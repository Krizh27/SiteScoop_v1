export class AgentState {
  constructor(projectId, userRequest) {
    this.projectId = projectId;
    this.userRequest = userRequest;
    this.messages = [];
    this.steps = [];
    this.toolCalls = [];
    this.observations = [];
    this.status = 'running'; // 'running' | 'completed' | 'change_pending' | 'needs_clarification' | 'limit_reached' | 'failed'
    this.finalAnswer = null;
    this.clarificationQuestion = null;
    this.pendingChange = null;
    this.error = null;
  }

  recordPendingChange(change) {
    this.pendingChange = change;
    this.status = 'change_pending';
  }

  recordStep(stepNumber, action, observation = null) {
    this.steps.push({
      step: stepNumber,
      actionType: action.type,
      tool: action.tool || null
    });
  }

  recordToolCall(tool, input) {
    this.toolCalls.push({
      tool,
      input: { ...input }
    });
  }

  recordObservation(tool, observationText) {
    this.observations.push({
      tool,
      text: observationText
    });
  }

  setFinal(answer) {
    this.status = 'completed';
    this.finalAnswer = answer;
  }

  setClarification(question) {
    this.status = 'needs_clarification';
    this.clarificationQuestion = question;
  }

  setLimitReached(message) {
    this.status = 'limit_reached';
    this.error = {
      code: 'AGENT_STEP_LIMIT_REACHED',
      message
    };
  }

  fail(code, message) {
    this.status = 'failed';
    this.error = { code, message };
  }
}
