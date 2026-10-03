import { analyzeWebsite } from '../services/ai.service.js';
import { runAgentHarness } from '../services/agentHarness.service.js';

/**
 * Controller to handle AI website analysis requests.
 * POST /api/ai/analyze
 */
export const analyzeProject = async (req, res, next) => {
  try {
    const { projectId, question } = req.body || {};

    if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: "projectId" (string)'
      });
    }

    const result = await analyzeWebsite(projectId.trim(), question);
    return res.status(200).json(result);
  } catch (error) {
    const message = error.message || 'AI analysis failed';

    // Differentiate client validation / missing project errors
    const isClientError =
      message.includes('not found') ||
      message.includes('required') ||
      message.includes('no index.html');

    if (isClientError) {
      return res.status(400).json({
        success: false,
        error: message
      });
    }

    // Differentiate Ollama offline / model not installed / timeout
    const isOllamaError =
      message.includes('Ollama is offline') ||
      message.includes('not installed') ||
      message.includes('timed out') ||
      message.includes('not configured');

    if (isOllamaError) {
      return res.status(503).json({
        success: false,
        error: message
      });
    }

    next(error);
  }
};

/**
 * Controller to handle AI Autonomous Code Agent editing via CRUD tools.
 * POST /api/ai/edit
 */
export const editProject = async (req, res, next) => {
  try {
    const { projectId, instruction } = req.body || {};

    if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: "projectId" (string)'
      });
    }

    const result = await runAgentHarness(projectId.trim(), instruction);
    return res.status(200).json(result);
  } catch (error) {
    const message = error.message || 'Agent harness failed';

    const isClientError =
      message.includes('not found') ||
      message.includes('required') ||
      message.includes('Target code snippet not found');

    if (isClientError) {
      return res.status(400).json({
        success: false,
        error: message
      });
    }

    const isTimeout =
      message.includes('timed out') ||
      message.includes('timeout');

    if (isTimeout) {
      return res.status(504).json({
        success: false,
        error: message
      });
    }

    const isOllamaError =
      message.includes('Ollama is offline') ||
      message.includes('not installed') ||
      message.includes('ECONNREFUSED');

    if (isOllamaError) {
      return res.status(503).json({
        success: false,
        error: message
      });
    }

    next(error);
  }
};

