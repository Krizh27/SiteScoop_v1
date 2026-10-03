export const AgentErrors = {
  INVALID_TOOL: 'INVALID_TOOL',
  INVALID_INPUT: 'INVALID_INPUT',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PATH_NOT_ALLOWED: 'PATH_NOT_ALLOWED',
  BINARY_FILE: 'BINARY_FILE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  TOOL_EXECUTION_FAILED: 'TOOL_EXECUTION_FAILED'
};

export class AgentError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
