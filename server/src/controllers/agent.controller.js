import { registry } from '../agent/tools/tool-registry.js';
import { executeTool } from '../agent/tools/tool-executor.js';
import { AgentContext } from '../agent/agent-context.js';
import { agentService } from '../agent/agent.service.js';
import { modelService } from '../ai/model/model.service.js';
import { AgentPolicy } from '../agent/agent-policy.js';
import path from 'path';

const getWorkspaceDir = () => process.env.WORKSPACE_DIR 
  ? path.resolve(process.cwd(), process.env.WORKSPACE_DIR)
  : path.resolve(process.cwd(), '../workspace');

export const getTools = (req, res) => {
  try {
    const tools = registry.listTools();
    res.json({ success: true, tools });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal error listing tools' });
  }
};

export const runTool = async (req, res) => {
  try {
    const { tool, input } = req.body;
    
    if (!tool || !input || !input.projectId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'tool and input.projectId are required' }
      });
    }

    // 1. Initialize context safely
    let context;
    try {
      context = new AgentContext(input.projectId, getWorkspaceDir());
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: err.code || 'CONTEXT_ERROR', message: err.message }
      });
    }

    // 2. Execute
    const result = await executeTool(tool, input, context);
    
    // 3. Return consistent format
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};

/**
 * GET /api/agent/status
 * Returns agent mode, configured model, and count of available tools.
 */
export const getAgentStatus = async (req, res) => {
  try {
    const aiStatus = await modelService.getStatus();
    const availableTools = AgentPolicy.getAllowedTools().length;

    res.json({
      success: true,
      agent: {
        enabled: true,
        mode: 'read-only'
      },
      model: aiStatus.model || process.env.OLLAMA_MODEL || 'gemma4:e2b',
      availableTools,
      ollama: {
        available: aiStatus.ollama?.available || false
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_STATUS_ERROR',
        message: err.message || 'Failed to determine agent status'
      }
    });
  }
};

/**
 * POST /api/agent/run
 * Body: { projectId, request }
 */
export const runAgent = async (req, res) => {
  try {
    const { projectId, request } = req.body || {};

    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'projectId is required and must be a non-empty string'
        }
      });
    }

    if (!request || typeof request !== 'string' || !request.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'request is required and must be a non-empty string'
        }
      });
    }

    if (request.trim().length > 4000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'request exceeds maximum permitted length of 4000 characters'
        }
      });
    }

    const result = await agentService.runAgent({
      projectId: projectId.trim(),
      userRequest: request.trim(),
      workspaceDir: getWorkspaceDir()
    });

    const statusCode = result.success ? 200 : (result.error?.code === 'PROJECT_NOT_FOUND' ? 404 : 400);
    return res.status(statusCode).json(result);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_RUN_ERROR',
        message: err.message || 'Unexpected error running agent'
      }
    });
  }
};
