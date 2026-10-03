import axios from 'axios';
import { AIError, AIErrorCodes } from '../ai.errors.js';
import {
  ollamaChatRequestSchema,
  ollamaChatResponseSchema
} from './ollama.schemas.js';

export class OllamaClient {
  constructor(config = {}) {
    this.customBaseUrl = config.baseUrl;
    this.customTimeout = config.timeoutMs;
    this.customModel = config.model;
    this.customTemperature = config.temperature;
  }

  getBaseUrl() {
    return this.customBaseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  getModel() {
    return this.customModel || process.env.OLLAMA_MODEL || 'gemma4:e2b';
  }

  getTimeout() {
    const t = this.customTimeout || process.env.OLLAMA_TIMEOUT_MS;
    return t ? parseInt(t, 10) : 120000;
  }

  getTemperature() {
    const temp = this.customTemperature ?? process.env.OLLAMA_TEMPERATURE;
    return temp !== undefined && temp !== null && temp !== '' ? parseFloat(temp) : 0.2;
  }

  /**
   * Check if Ollama service is reachable.
   * Does not throw on failure; returns true/false.
   */
  async isAvailable() {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await axios.get(`${baseUrl}/api/tags`, {
        timeout: 3000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Get metadata/info about a specific model.
   * Throws MODEL_NOT_FOUND or OLLAMA_UNAVAILABLE.
   */
  async getModelInfo(modelName) {
    const targetModel = modelName || this.getModel();
    const baseUrl = this.getBaseUrl();
    const timeout = Math.min(this.getTimeout(), 10000);

    try {
      // First try /api/show
      const response = await axios.post(
        `${baseUrl}/api/show`,
        { name: targetModel },
        { timeout }
      );
      return {
        model: targetModel,
        details: response.data.details || null,
        parameters: response.data.parameters || null
      };
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new AIError(
          AIErrorCodes.OLLAMA_UNAVAILABLE,
          `Ollama is not reachable at ${baseUrl}`
        );
      }
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        throw new AIError(
          AIErrorCodes.OLLAMA_TIMEOUT,
          `Connection to Ollama timed out while fetching model info`
        );
      }
      if (err.response?.status === 404 || err.response?.data?.error?.includes('not found')) {
        throw new AIError(
          AIErrorCodes.MODEL_NOT_FOUND,
          `Model '${targetModel}' was not found in Ollama`
        );
      }
      // If /api/show is not supported or failed with other code, check /api/tags
      try {
        const tagsRes = await axios.get(`${baseUrl}/api/tags`, { timeout });
        const models = tagsRes.data?.models || [];
        const exists = models.some(m => 
          m.name === targetModel || 
          m.name === `${targetModel}:latest` || 
          m.name?.startsWith(targetModel)
        );
        if (exists) {
          return { model: targetModel };
        }
        throw new AIError(
          AIErrorCodes.MODEL_NOT_FOUND,
          `Model '${targetModel}' was not found in Ollama`
        );
      } catch (tagsErr) {
        if (tagsErr instanceof AIError) throw tagsErr;
        throw new AIError(
          AIErrorCodes.MODEL_REQUEST_FAILED,
          err.response?.data?.error || err.message || 'Failed to inspect model'
        );
      }
    }
  }

  /**
   * Send a generation/chat request to Ollama.
   * Returns normalized response structure.
   */
  async generate(request = {}) {
    const model = request.model || this.getModel();
    const baseUrl = this.getBaseUrl();
    const timeout = request.timeoutMs || this.getTimeout();
    const temperature = request.temperature !== undefined ? request.temperature : this.getTemperature();

    // Construct messages array
    let messages = [];
    if (Array.isArray(request.messages) && request.messages.length > 0) {
      messages = [...request.messages];
      if (request.system && !messages.some(m => m.role === 'system')) {
        messages.unshift({ role: 'system', content: request.system });
      }
    } else if (request.prompt) {
      if (request.system) {
        messages.push({ role: 'system', content: request.system });
      }
      messages.push({ role: 'user', content: request.prompt });
    }

    // Validate request structure
    const parseResult = ollamaChatRequestSchema.safeParse({
      model,
      messages,
      stream: false,
      options: { temperature }
    });

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(i => i.message).join('; ');
      throw new AIError(AIErrorCodes.MODEL_REQUEST_FAILED, `Invalid Ollama request: ${errorMsg}`);
    }

    try {
      const response = await axios.post(
        `${baseUrl}/api/chat`,
        parseResult.data,
        {
          timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Validate Ollama response shape
      const validated = ollamaChatResponseSchema.safeParse(response.data);
      if (!validated.success) {
        throw new AIError(
          AIErrorCodes.INVALID_MODEL_RESPONSE,
          'Ollama returned a malformed response'
        );
      }

      const content = response.data.message?.content;
      if (typeof content !== 'string' || content.trim().length === 0) {
        throw new AIError(
          AIErrorCodes.MODEL_RESPONSE_EMPTY,
          'Model returned an empty response'
        );
      }

      const usage = {
        promptTokens: typeof response.data.prompt_eval_count === 'number' ? response.data.prompt_eval_count : null,
        completionTokens: typeof response.data.eval_count === 'number' ? response.data.eval_count : null
      };

      return {
        model: response.data.model || model,
        content: content,
        usage
      };
    } catch (err) {
      if (err instanceof AIError) {
        throw err;
      }
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        throw new AIError(
          AIErrorCodes.OLLAMA_TIMEOUT,
          `Ollama request timed out after ${timeout}ms`
        );
      }
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new AIError(
          AIErrorCodes.OLLAMA_UNAVAILABLE,
          `Ollama is not reachable at ${baseUrl}`
        );
      }
      if (err.response?.status === 404 || err.response?.data?.error?.includes('not found')) {
        throw new AIError(
          AIErrorCodes.MODEL_NOT_FOUND,
          err.response?.data?.error || `Model '${model}' not found in Ollama`
        );
      }
      if (err.response?.data?.error) {
        throw new AIError(
          AIErrorCodes.MODEL_REQUEST_FAILED,
          err.response.data.error
        );
      }
      throw new AIError(
        AIErrorCodes.MODEL_REQUEST_FAILED,
        err.message || 'Failed to communicate with Ollama'
      );
    }
  }
}

export const defaultOllamaClient = new OllamaClient();
