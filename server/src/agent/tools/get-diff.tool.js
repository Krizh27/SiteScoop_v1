import { getDiffSchema } from '../schemas/tool.schemas.js';
import { changeStore } from '../changes/change-store.js';
import { AgentError, AgentErrors } from '../agent-errors.js';

export const getDiffTool = {
  name: 'get_diff',
  description: 'Retrieve the unified diff and details of a pending proposed change by its changeId.',
  inputSchema: getDiffSchema,
  execute: async (context, input) => {
    const change = changeStore.getChange(input.changeId);

    if (!change) {
      throw new AgentError(AgentErrors.INVALID_INPUT, `Change "${input.changeId}" not found.`);
    }

    return {
      changeId: change.changeId,
      projectId: change.projectId,
      path: change.path,
      diff: change.diff,
      reason: change.reason,
      status: change.status
    };
  }
};
