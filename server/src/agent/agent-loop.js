import { logger } from '../utils/logger.js';
import { AgentParser } from './agent-parser.js';
import { AgentPolicy } from './agent-policy.js';
import { AgentError, AgentErrors } from './agent-errors.js';
import { executeTool } from './tools/tool-executor.js';
import { buildAgentSystemPrompt } from './prompts/agent-system.prompt.js';
import { modelService as defaultModelService } from '../ai/model/model.service.js';

export async function runAgentLoop(state, context, options = {}) {
  const modelService = options.modelService || defaultModelService;
  const maxSteps = options.maxSteps || parseInt(process.env.AGENT_MAX_STEPS || '8', 10);
  const maxObsChars = options.maxObservationChars || parseInt(process.env.AGENT_MAX_OBSERVATION_CHARS || '20000', 10);

  const systemPrompt = buildAgentSystemPrompt(state.projectId);
  let stepNumber = 0;
  const toolCallHistory = []; // Track repeat calls

  logger.info(`Agent started for project: ${state.projectId}`);
  logger.info(`User request length: ${state.userRequest.length} characters`);

  while (state.status === 'running') {
    stepNumber++;

    if (stepNumber > maxSteps) {
      logger.warn(`Agent step limit (${maxSteps}) reached`);
      state.setLimitReached(`Agent reasoning reached the maximum step limit of ${maxSteps} steps.`);
      return state;
    }

    logger.info(`Agent Step ${stepNumber} / ${maxSteps}`);

    // Build the prompt for Gemma containing observations so far
    let promptForModel = `USER REQUEST:\n${state.userRequest}\n`;

    if (state.observations.length > 0) {
      promptForModel += `\nPREVIOUS TOOL OBSERVATIONS:\n`;
      state.observations.forEach((obs, idx) => {
        promptForModel += `\n--- [Observation ${idx + 1} from ${obs.tool}] ---\n${obs.text}\n`;
      });
      promptForModel += `\nBased on the observations above, determine your next action. Return ONLY a single valid JSON action (tool_call, final, or clarification).\n`;
    } else {
      promptForModel += `\nBegin by choosing the most appropriate first tool call, or provide a final answer / clarification if sufficient. Return ONLY valid JSON.\n`;
    }

    // Call Model Service
    let modelResponse;
    try {
      modelResponse = await modelService.generate({
        systemPrompt,
        userPrompt: promptForModel
      });
    } catch (err) {
      logger.error(`Model invocation failed at step ${stepNumber}:`, err.message);
      state.fail(AgentErrors.MODEL_COMMUNICATION_ERROR, `Failed to communicate with AI model: ${err.message}`);
      return state;
    }

    // Parse and validate action
    let action;
    try {
      action = AgentParser.parse(modelResponse.content);
    } catch (err) {
      logger.error(`Action parsing failed at step ${stepNumber}:`, err.message);
      state.fail(err.code || AgentErrors.INVALID_AGENT_ACTION, err.message);
      return state;
    }

    // Handle Action Types
    if (action.type === 'final') {
      logger.info('Agent produced final answer');
      state.recordStep(stepNumber, action);
      state.setFinal(action.answer);
      return state;
    }

    if (action.type === 'clarification') {
      logger.info('Agent requested clarification');
      state.recordStep(stepNumber, action);
      state.setClarification(action.question);
      return state;
    }

    if (action.type === 'tool_call') {
      const toolName = action.tool;
      logger.info(`Tool requested: ${toolName}`);

      // Verify tool permission against security policy
      try {
        AgentPolicy.assertAllowed(toolName);
      } catch (err) {
        logger.warn(`Security policy rejected tool '${toolName}'`);
        state.fail(err.code || AgentErrors.TOOL_NOT_ALLOWED, err.message);
        return state;
      }

      // Prepare and enforce input parameters
      const toolInput = { ...(action.input || {}) };
      toolInput.projectId = state.projectId; // Enforce project boundary

      state.recordToolCall(toolName, toolInput);

      // Check for repeated calls with identical input
      const callKey = `${toolName}:${JSON.stringify(toolInput)}`;
      const repeatCount = toolCallHistory.filter(k => k === callKey).length;
      toolCallHistory.push(callKey);

      let observationText = '';

      if (repeatCount >= 3) {
        logger.warn(`Detected repeated tool call '${toolName}' with identical inputs (${repeatCount + 1} times)`);
        observationText = `TOOL RESULT: ${toolName}\n[Notice] You have already called ${toolName} with identical inputs ${repeatCount + 1} times. Please synthesize your findings into a final answer.`;
      } else {
        // Execute the safe tool
        const execResult = await executeTool(toolName, toolInput, context);
        logger.info(`Tool result: ${execResult.success ? 'success' : 'error'}`);

        if (execResult.success) {
          const rawDataString = typeof execResult.data === 'string'
            ? execResult.data
            : JSON.stringify(execResult.data, null, 2);

          observationText = `TOOL RESULT: ${toolName}\n${rawDataString}`;
        } else {
          observationText = `TOOL RESULT: ${toolName}\nsuccess: false\nerror: ${execResult.error?.code || 'ERROR'}: ${execResult.error?.message || 'Tool execution failed'}`;
        }
      }

      // Enforce observation character limit
      if (observationText.length > maxObsChars) {
        const originalLen = observationText.length;
        const truncatedSlice = observationText.slice(0, maxObsChars);
        observationText = `[OBSERVATION TRUNCATED]\nOriginal size: ${originalLen} characters\nReturned: ${maxObsChars} characters\n\n${truncatedSlice}\n\n[... Remaining content truncated for token conservation ...]`;
      }

      state.recordStep(stepNumber, action, observationText);
      state.recordObservation(toolName, observationText);

      // Section 15: If an edit was proposed, stop and await human review
      if (toolName === 'propose_edit' && execResult?.success && execResult?.data?.changeId) {
        logger.info(`Pending change created: ${execResult.data.changeId}. Stopping loop for human approval.`);
        state.recordPendingChange(execResult.data);
        state.finalAnswer = `I have inspected the file and proposed an edit: ${execResult.data.reason || 'Code improvement'}. A pending change (${execResult.data.changeId}) has been created for your review. Please review the diff and approve to apply.`;
        return state;
      }
    }
  }

  return state;
}
