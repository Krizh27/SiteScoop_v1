import { analyzeWebsite } from '../services/ai.service.js';

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
