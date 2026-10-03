import { registry } from './tool-registry.js';
import { AgentError, AgentErrors } from '../agent-errors.js';

export const executeTool = async (toolName, input, context) => {
  try {
    const tool = registry.getTool(toolName);
    
    const validation = tool.inputSchema.safeParse(input);
    if (!validation.success) {
      throw new AgentError(AgentErrors.INVALID_INPUT, validation.error.message);
    }
    
    const result = await tool.execute(context, validation.data);
    
    return {
      success: true,
      tool: toolName,
      data: result
    };
  } catch (error) {
    const code = error instanceof AgentError ? error.code : AgentErrors.TOOL_EXECUTION_FAILED;
    const message = error.message;

    if (!(error instanceof AgentError)) {
      console.error(`[Agent Tool Error] ${toolName}:`, error); // Log server-side only
    }

    return {
      success: false,
      tool: toolName,
      error: {
        code,
        message: error instanceof AgentError ? message : 'An internal execution error occurred.'
      }
    };
  }
};
