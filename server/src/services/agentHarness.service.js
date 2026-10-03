import axios from 'axios';
import {
  listProjectFiles,
  readProjectFile,
  writeProjectFile,
  deleteProjectFile
} from './projectFiles.service.js';
import { logger } from '../utils/logger.js';

const OLLAMA_DEFAULT_HOST = 'http://localhost:11434';
const MAX_AGENT_TURNS = 5;
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT, 10) || 120000;

/**
 * Tool definitions exposed to Gemma in Ollama's native tool-calling format.
 */
export const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List all files and asset paths in the cloned website project',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the full code/content of a file in the project workspace (e.g. index.html or assets/css.css)',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Relative path to the file inside the project workspace'
          }
        },
        required: ['filePath']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Create or overwrite a file with updated code in the project workspace',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Relative path to the file to create or overwrite'
          },
          content: {
            type: 'string',
            description: 'The complete new code or content to save into the file'
          }
        },
        required: ['filePath', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'replace_code',
      description: 'Replace an exact snippet of code within an existing project file',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Relative path to the target file'
          },
          targetCode: {
            type: 'string',
            description: 'The exact string snippet of code to be replaced'
          },
          replacementCode: {
            type: 'string',
            description: 'The new code to replace the target snippet with'
          }
        },
        required: ['filePath', 'targetCode', 'replacementCode']
      }
    }
  }
];

/**
 * Execute a single tool call requested by the model.
 */
async function executeTool(projectId, toolName, args) {
  logger.info(`Executing agent tool "${toolName}" for project ${projectId}`, args);

  switch (toolName) {
    case 'list_files': {
      const files = await listProjectFiles(projectId);
      return { success: true, files: files.map(f => f.path) };
    }

    case 'read_file': {
      const { filePath } = args || {};
      const fileData = await readProjectFile(projectId, filePath);
      return { success: true, filePath: fileData.filePath, content: fileData.content };
    }

    case 'write_file': {
      const { filePath, content } = args || {};
      const result = await writeProjectFile(projectId, filePath, content);
      return { success: true, filePath: result.filePath, bytesWritten: result.bytesWritten };
    }

    case 'replace_code': {
      const { filePath, targetCode, replacementCode } = args || {};
      const fileData = await readProjectFile(projectId, filePath);
      if (!fileData.content.includes(targetCode)) {
        throw new Error(`Target code snippet not found in "${filePath}".`);
      }
      const updatedContent = fileData.content.replace(targetCode, replacementCode);
      const writeRes = await writeProjectFile(projectId, filePath, updatedContent);
      return { success: true, filePath: writeRes.filePath, modified: true };
    }

    case 'delete_file': {
      const { filePath } = args || {};
      const result = await deleteProjectFile(projectId, filePath);
      return { success: true, filePath: result.filePath, deleted: true };
    }

    default:
      throw new Error(`Unknown tool "${toolName}".`);
  }
}

/**
 * Run the Autonomous Agent Harness loop with Gemma.
 *
 * @param {string} projectId - Target project ID
 * @param {string} instruction - User prompt or instruction
 * @returns {Promise<object>} Agent execution result including modified files and explanation
 */
export async function runAgentHarness(projectId, instruction) {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('A valid "projectId" is required.');
  }

  const modelName = process.env.OLLAMA_MODEL || 'gemma4:e2b';
  const ollamaHost = process.env.OLLAMA_HOST || OLLAMA_DEFAULT_HOST;
  const userInstruction = instruction?.trim() || 'Inspect the website and improve the styling.';

  // Gather current project file list for initial context
  const initialFiles = await listProjectFiles(projectId);
  const filePaths = initialFiles.map(f => f.path);

  const systemPrompt = `You are Gemma, an autonomous website development agent for SiteScoop AI.
You have CRUD tools to inspect and directly modify the recovered website codebase:
- list_files: View all files in the project.
- read_file: View the full source code of a file before modifying it.
- write_file: Write updated code to a file.
- replace_code: Replace a specific code block in a file.

Guidelines:
1. Always read a file before modifying it so you have the exact existing code.
2. Apply clean, responsive, robust modern HTML/CSS.
3. Keep external asset paths intact unless improving them.
4. When you are done making changes, provide a concise summary of what you improved.
5. Do not output internal thinking or reasoning tags.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Project ID: ${projectId}
Available Project Files:
${filePaths.map(p => ` - ${p}`).join('\n')}

Instruction:
${userInstruction}`
    }
  ];

  const executedTools = [];
  const modifiedFiles = new Set();
  let currentTurn = 0;
  let finalMessage = '';

  while (currentTurn < MAX_AGENT_TURNS) {
    currentTurn++;
    logger.info(`Agent harness turn ${currentTurn}/${MAX_AGENT_TURNS} for ${projectId}...`);

    let response;
    try {
      response = await axios.post(
        `${ollamaHost}/api/chat`,
        {
          model: modelName.trim(),
          messages,
          tools: AGENT_TOOLS,
          stream: false,
          think: false,
          options: {
            num_predict: 1024,
            temperature: 0.1
          }
        },
        {
          timeout: OLLAMA_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        throw new Error(`Ollama is offline or unreachable at ${ollamaHost}.`);
      }
      throw err;
    }

    const assistantMessage = response.data?.message;
    if (!assistantMessage) {
      throw new Error('Received empty response from Ollama during agent harness loop.');
    }

    messages.push(assistantMessage);

    const toolCalls = assistantMessage.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      // Model finished and gave its textual explanation
      finalMessage = (assistantMessage.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      break;
    }

    // Process all requested tool calls in this turn
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function?.name;
      let toolArgs = toolCall.function?.arguments || {};
      if (typeof toolArgs === 'string') {
        try { toolArgs = JSON.parse(toolArgs); } catch {}
      }

      let toolResult;
      try {
        toolResult = await executeTool(projectId, toolName, toolArgs);
        if (toolName === 'write_file' || toolName === 'replace_code') {
          if (toolArgs.filePath) modifiedFiles.add(toolArgs.filePath);
        }
      } catch (toolErr) {
        toolResult = { error: toolErr.message, success: false };
      }

      executedTools.push({
        turn: currentTurn,
        name: toolName,
        args: toolArgs,
        result: toolResult
      });

      // Append tool execution response to conversation history
      messages.push({
        role: 'tool',
        content: JSON.stringify(toolResult)
      });
    }
  }

  return {
    success: true,
    projectId,
    model: modelName,
    turnsExecuted: currentTurn,
    instruction: userInstruction,
    modifiedFiles: Array.from(modifiedFiles),
    executedTools,
    summary: finalMessage || 'Agent completed all requested file modifications successfully.'
  };
}
