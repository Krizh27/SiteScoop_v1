import { AgentContext } from './agent-context.js';
import { AgentState } from './agent-state.js';
import { runAgentLoop } from './agent-loop.js';
import { AgentError, AgentErrors } from './agent-errors.js';
import { runAgentRequestSchema } from './agent.schemas.js';

export class AgentService {
  constructor(options = {}) {
    this.workspaceDir = options.workspaceDir || process.env.WORKSPACE_DIR || './workspace';
  }

  /**
   * Run the autonomous read-only agent for a given project and user request.
   */
  async runAgent({ projectId, userRequest, workspaceDir, modelService, maxSteps } = {}) {
    // 1. Validate inputs
    const parsed = runAgentRequestSchema.safeParse({
      projectId,
      request: userRequest
    });

    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join('; ');
      return {
        success: false,
        status: 'failed',
        error: {
          code: AgentErrors.INVALID_INPUT,
          message: msg
        }
      };
    }

    const effectiveWorkspace = workspaceDir || this.workspaceDir;

    // 2. Instantiate Context (verifies project exists and checks bounds)
    let context;
    try {
      context = new AgentContext(projectId, effectiveWorkspace);
    } catch (err) {
      return {
        success: false,
        status: 'failed',
        error: {
          code: err.code || AgentErrors.PROJECT_NOT_FOUND,
          message: err.message
        }
      };
    }

    // 3. Initialize State
    const state = new AgentState(projectId, userRequest);

    // 4. Run the Agent Loop
    const finalState = await runAgentLoop(state, context, {
      modelService,
      maxSteps
    });

    // 5. Build clean, safe response payload (strip private reasoning & prompts)
    const baseSummary = {
      projectId: finalState.projectId,
      steps: finalState.steps.length,
      toolCalls: finalState.toolCalls.map(tc => ({ tool: tc.tool }))
    };

    if (finalState.status === 'change_pending' || finalState.pendingChange) {
      return {
        success: true,
        status: 'change_pending',
        answer: finalState.finalAnswer || 'A code modification has been proposed for review.',
        change: {
          changeId: finalState.pendingChange?.changeId,
          path: finalState.pendingChange?.path,
          reason: finalState.pendingChange?.reason,
          diff: finalState.pendingChange?.diff
        },
        ...baseSummary
      };
    }

    if (finalState.status === 'completed') {
      return {
        success: true,
        status: 'completed',
        answer: finalState.finalAnswer,
        ...baseSummary
      };
    }

    if (finalState.status === 'needs_clarification') {
      return {
        success: true,
        status: 'needs_clarification',
        question: finalState.clarificationQuestion,
        ...baseSummary
      };
    }

    return {
      success: false,
      status: finalState.status,
      error: finalState.error || {
        code: AgentErrors.TOOL_EXECUTION_FAILED,
        message: 'Agent was unable to complete the request'
      },
      ...baseSummary
    };
  }
}

export const agentService = new AgentService();
