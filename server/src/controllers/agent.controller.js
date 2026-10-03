import { registry } from '../agent/tools/tool-registry.js';
import { executeTool } from '../agent/tools/tool-executor.js';
import { AgentContext } from '../agent/agent-context.js';
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
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'tool and input.projectId are required' } });
    }

    // 1. Initialize context safely
    let context;
    try {
      context = new AgentContext(input.projectId, getWorkspaceDir());
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: err.code || 'CONTEXT_ERROR', message: err.message } });
    }

    // 2. Execute
    const result = await executeTool(tool, input, context);
    
    // 3. Return consistent format
    res.json(result);

  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
