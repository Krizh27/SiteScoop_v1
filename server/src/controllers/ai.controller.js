import { modelService } from '../ai/model/model.service.js';
import { getBaseSystemPrompt } from '../ai/prompts/base-system.prompt.js';
import { AIError, AIErrorCodes } from '../ai/ai.errors.js';

export const getAIStatus = async (req, res) => {
  try {
    const status = await modelService.getStatus();
    return res.json(status);
  } catch (err) {
    return res.json({
      success: false,
      ollama: {
        available: false
      },
      model: process.env.OLLAMA_MODEL || null,
      error: {
        code: AIErrorCodes.OLLAMA_UNAVAILABLE,
        message: err.message || 'Failed to determine AI subsystem status'
      }
    });
  }
};

export const testPrompt = async (req, res) => {
  try {
    const { prompt } = req.body || {};

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'The "prompt" field is required and must be a non-empty string.'
        }
      });
    }

    const systemPrompt = getBaseSystemPrompt();
    const result = await modelService.generate({
      systemPrompt,
      userPrompt: prompt.trim()
    });

    return res.json({
      success: true,
      model: result.model,
      response: result.content,
      content: result.content,
      usage: result.usage
    });
  } catch (err) {
    if (err instanceof AIError) {
      let statusCode = 500;
      switch (err.code) {
        case AIErrorCodes.OLLAMA_UNAVAILABLE:
          statusCode = 503;
          break;
        case AIErrorCodes.OLLAMA_TIMEOUT:
          statusCode = 504;
          break;
        case AIErrorCodes.MODEL_NOT_FOUND:
          statusCode = 404;
          break;
        case AIErrorCodes.INVALID_MODEL_CONFIGURATION:
          statusCode = 503;
          break;
        case AIErrorCodes.INVALID_MODEL_RESPONSE:
        case AIErrorCodes.MODEL_RESPONSE_EMPTY:
          statusCode = 502;
          break;
        default:
          statusCode = 500;
      }

      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: AIErrorCodes.MODEL_REQUEST_FAILED,
        message: err.message || 'An unexpected error occurred during model test'
      }
    });
  }
};
