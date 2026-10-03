import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import { sanitizeFilename } from '../utils/fileUtils.js';
import { logger } from '../utils/logger.js';

const OLLAMA_DEFAULT_HOST = 'http://localhost:11434';
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT, 10) || 180000; // 180s for CPU inference
const MAX_HTML_PROMPT_CHARS = 10000; // Keep context bounded for fast inference
const MAX_CSS_PROMPT_CHARS = 5000;

/**
 * Locate project directory in workspace/projects/ or workspace/.staging/
 */
async function findProjectDir(projectId) {
  const cleanId = sanitizeFilename(projectId);
  const workspaceRoot = process.env.WORKSPACE_DIR
    ? path.resolve(process.cwd(), process.env.WORKSPACE_DIR)
    : path.resolve(process.cwd(), '../workspace');

  // Check workspace/projects/{cleanId}
  const projectDir = path.join(workspaceRoot, 'projects', cleanId);
  try {
    const stat = await fs.stat(projectDir);
    if (stat.isDirectory()) return projectDir;
  } catch {}

  // Check workspace/.staging/{cleanId} for backwards compatibility
  const stagingDir = path.join(workspaceRoot, '.staging', cleanId);
  try {
    const stat = await fs.stat(stagingDir);
    if (stat.isDirectory()) return stagingDir;
  } catch {}

  throw new Error(`Project "${projectId}" not found in workspace.`);
}

/**
 * Load index.html, manifest metadata, and relevant CSS files for the project.
 */
async function loadProjectContext(projectDir) {
  let html = '';
  let metadata = {};
  let cssText = '';

  // 1. Read index.html
  const indexPath = path.join(projectDir, 'index.html');
  try {
    html = await fs.readFile(indexPath, 'utf8');
  } catch {
    throw new Error('Project has no index.html available for analysis.');
  }

  // 2. Read manifest.json if present
  const manifestPath = path.join(projectDir, 'manifest.json');
  try {
    const rawManifest = await fs.readFile(manifestPath, 'utf8');
    const parsed = JSON.parse(rawManifest);
    metadata = parsed.metadata || parsed.page || {};
  } catch {}

  // 3. Read CSS files from assets/
  const assetsDir = path.join(projectDir, 'assets');
  try {
    const assetFiles = await fs.readdir(assetsDir);
    const cssFiles = assetFiles.filter(f => f.endsWith('.css')).slice(0, 3);
    for (const file of cssFiles) {
      if (cssText.length >= MAX_CSS_PROMPT_CHARS) break;
      const filePath = path.join(assetsDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      cssText += `/* --- ${file} --- */\n${content.substring(0, 4000)}\n\n`;
    }
  } catch {}

  return {
    html: html.substring(0, MAX_HTML_PROMPT_CHARS),
    metadata,
    css: cssText.substring(0, MAX_CSS_PROMPT_CHARS)
  };
}

/**
 * Analyze an extracted website project using local Ollama model.
 *
 * @param {string} projectId - Project identifier
 * @param {string} question - User question or instruction
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeWebsite(projectId, question) {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('A valid "projectId" string is required.');
  }

  const modelName = process.env.OLLAMA_MODEL;
  if (!modelName || modelName.trim().length === 0) {
    throw new Error(
      'Environment variable OLLAMA_MODEL is not configured. Please define OLLAMA_MODEL in your server/.env file (e.g. OLLAMA_MODEL=gemma4:e2b).'
    );
  }

  const ollamaHost = process.env.OLLAMA_HOST || OLLAMA_DEFAULT_HOST;
  const userQuestion = question?.trim() || 'Explain this website and suggest improvements';

  logger.info(`Analyzing project "${projectId}" with Ollama model "${modelName}"...`);

  // 1. Locate and load website context from workspace
  const projectDir = await findProjectDir(projectId);
  const context = await loadProjectContext(projectDir);

  // 2. Construct system and user prompts
  const systemPrompt = `You are Gemma, an expert website analysis assistant for SiteScoop AI.
Analyze the provided website HTML and CSS to inspect, debug, and suggest concrete architectural, visual, and code improvements.
Do not output internal thinking processes or <think> tags. Be concise, direct, and robust.
You must structure your response with these clear sections:
1. Short website summary
2. Three observations about the website
3. Three practical improvement suggestions
4. One suggested CSS improvement`;

  const userPrompt = `Project ID: ${projectId}
Title: ${context.metadata.title || 'Untitled'}
Source URL: ${context.metadata.canonical || 'N/A'}

HTML Content:
\`\`\`html
${context.html}
\`\`\`

${context.css ? `CSS Stylesheets:\n\`\`\`css\n${context.css}\n\`\`\`\n` : ''}
User Question:
${userQuestion}

Please analyze this website and provide:
1. Short website summary
2. Three observations about the website
3. Three practical improvement suggestions
4. One suggested CSS improvement`;

  // 3. Dispatch to local Ollama API with thinking disabled for fast, robust responses
  try {
    const response = await axios.post(
      `${ollamaHost}/api/chat`,
      {
        model: modelName.trim(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        think: false, // Disables extended thinking/reasoning loops for fast direct answers
        options: {
          num_predict: parseInt(process.env.OLLAMA_NUM_PREDICT, 10) || 768,
          temperature: 0.2
        }
      },
      {
        timeout: OLLAMA_TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    let messageContent = response.data?.message?.content;
    if (!messageContent) {
      throw new Error('Received empty or malformed response from Ollama.');
    }

    // Clean any residual <think> blocks if produced by the model
    messageContent = messageContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    logger.info(`Completed AI analysis for project "${projectId}" using "${modelName}".`);

    return {
      success: true,
      projectId,
      model: modelName.trim(),
      question: userQuestion,
      analysis: messageContent
    };
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      throw new Error(
        `Ollama is offline or unreachable at ${ollamaHost}. Please ensure Ollama is installed and running.`
      );
    }

    if (err.response?.status === 404 || err.response?.data?.error?.includes('not found')) {
      throw new Error(
        `Ollama model "${modelName}" is not installed. Please pull it locally using: ollama pull ${modelName}`
      );
    }

    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      throw new Error(
        `Ollama request timed out after ${OLLAMA_TIMEOUT_MS / 1000}s while waiting for "${modelName}" inference.`
      );
    }

    throw new Error(err.response?.data?.error || err.message || 'AI analysis request failed.');
  }
}
