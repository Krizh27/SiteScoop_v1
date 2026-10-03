import { logger } from '../../utils/logger.js';
import { defaultOllamaClient, OllamaClient } from '../ollama/ollama.client.js';
import { modelRequestSchema, modelResponseSchema } from './model.schemas.js';
import { AIError, AIErrorCodes } from '../ai.errors.js';

export class ModelService {
  constructor(client = defaultOllamaClient) {
    this.client = client;
  }

  /**
   * Validate current environment configuration for AI operations.
   */
  validateConfiguration() {
    const baseUrl = process.env.OLLAMA_BASE_URL || this.client.getBaseUrl();
    const model = process.env.OLLAMA_MODEL || this.client.getModel();

    if (!baseUrl || !baseUrl.trim()) {
      return {
        valid: false,
        code: AIErrorCodes.INVALID_MODEL_CONFIGURATION,
        message: 'OLLAMA_BASE_URL is not configured'
      };
    }

    if (!model || !model.trim()) {
      return {
        valid: false,
        code: AIErrorCodes.INVALID_MODEL_CONFIGURATION,
        message: 'OLLAMA_MODEL is not configured'
      };
    }

    return { valid: true, baseUrl, model };
  }

  /**
   * Get the overall AI subsystem status.
   * Never throws; returns safe status object.
   */
  async getStatus() {
    const configCheck = this.validateConfiguration();
    const configuredModel = this.client.getModel();

    if (!configCheck.valid) {
      return {
        success: false,
        ollama: {
          available: false
        },
        model: configuredModel || null,
        error: {
          code: configCheck.code,
          message: configCheck.message
        }
      };
    }

    const available = await this.client.isAvailable();
    if (!available) {
      return {
        success: false,
        ollama: {
          available: false
        },
        model: configuredModel,
        error: {
          code: AIErrorCodes.OLLAMA_UNAVAILABLE,
          message: `Ollama is not reachable at ${this.client.getBaseUrl()}`
        }
      };
    }

    return {
      success: true,
      ollama: {
        available: true
      },
      model: configuredModel
    };
  }

  /**
   * Primary entry point for AI model generation.
   * Accepts systemPrompt, userPrompt, temperature.
   * Returns normalized, Zod-validated model response.
   */
  async generate({ systemPrompt, userPrompt, temperature } = {}) {
    // 1. Validate request shape
    const parsedRequest = modelRequestSchema.safeParse({
      systemPrompt,
      userPrompt,
      temperature
    });

    if (!parsedRequest.success) {
      const errorMsg = parsedRequest.error.issues.map(i => i.message).join('; ');
      throw new AIError(AIErrorCodes.MODEL_REQUEST_FAILED, `Invalid model request: ${errorMsg}`);
    }

    // 2. Validate configuration
    const configCheck = this.validateConfiguration();
    if (!configCheck.valid) {
      throw new AIError(configCheck.code, configCheck.message);
    }

    const modelName = this.client.getModel();
    const promptLength = (systemPrompt ? systemPrompt.length : 0) + (userPrompt ? userPrompt.length : 0);

    // 3. Safe development logging (Section 17)
    logger.info('AI request started');
    logger.info(`Model: ${modelName}`);
    logger.info(`Prompt length: ${promptLength} characters`);

    // 4. Send request to Ollama
    const messages = [];
    if (systemPrompt && systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt.trim() });
    }
    messages.push({ role: 'user', content: userPrompt.trim() });

    const rawResult = await this.client.generate({
      model: modelName,
      messages,
      temperature
    });

    const responseLength = rawResult.content ? rawResult.content.length : 0;
    logger.info('AI response received');
    logger.info(`Response length: ${responseLength} characters`);

    // 5. Structure and validate response
    const normalizedResponse = {
      success: true,
      model: rawResult.model || modelName,
      content: rawResult.content,
      usage: {
        promptTokens: rawResult.usage?.promptTokens ?? null,
        completionTokens: rawResult.usage?.completionTokens ?? null
      }
    };

    const validatedResponse = modelResponseSchema.safeParse(normalizedResponse);
    if (!validatedResponse.success) {
      throw new AIError(
        AIErrorCodes.INVALID_MODEL_RESPONSE,
        'Model response failed validation against expected schema'
      );
    }

    return validatedResponse.data;
  }
}

export const modelService = new ModelService();

/**
 * Startup helper to check configuration without throwing or crashing.
 */
export function checkAiConfiguration() {
  const check = modelService.validateConfiguration();
  if (!check.valid) {
    logger.warn(`AI configuration notice: ${check.message}. AI features will report offline until configured.`);
  } else {
    logger.info(`AI configuration initialized (Base URL: ${check.baseUrl}, Model: ${check.model})`);
  }
}
