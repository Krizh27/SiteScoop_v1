export const InspectorErrors = {
  INSPECTION_FAILED: 'INSPECTION_FAILED',
  INSPECTION_NOT_FOUND: 'INSPECTION_NOT_FOUND',
  INVALID_INSPECTION_RESPONSE: 'INVALID_INSPECTION_RESPONSE',
  INSPECTION_STEP_LIMIT: 'INSPECTION_STEP_LIMIT',
  NO_PROJECT_DATA: 'NO_PROJECT_DATA',
  INVALID_INPUT: 'INVALID_INPUT'
};

export class InspectorError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'InspectorError';
    this.code = code;
  }
}
