export const AIErrorCodes = {
  OLLAMA_UNAVAILABLE: 'OLLAMA_UNAVAILABLE',
  OLLAMA_TIMEOUT: 'OLLAMA_TIMEOUT',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  INVALID_MODEL_RESPONSE: 'INVALID_MODEL_RESPONSE',
  MODEL_REQUEST_FAILED: 'MODEL_REQUEST_FAILED',
  MODEL_RESPONSE_EMPTY: 'MODEL_RESPONSE_EMPTY',
  INVALID_MODEL_CONFIGURATION: 'INVALID_MODEL_CONFIGURATION',
};

export class AIError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.details = details;
  }
}
