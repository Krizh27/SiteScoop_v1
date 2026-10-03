import { proposeEditSchema } from '../schemas/tool.schemas.js';
import { readFileContent } from '../../services/workspace/file-reader.service.js';
import { changeStore } from '../changes/change-store.js';
import { AgentError, AgentErrors } from '../agent-errors.js';

export const proposeEditTool = {
  name: 'propose_edit',
  description: 'Propose a code modification to a recovered project file. Provide the relative path and the complete new proposed file content. This creates a pending change for human review and diff approval. It does NOT modify the file directly.',
  inputSchema: proposeEditSchema,
  execute: async (context, input) => {
    try {
      const result = await readFileContent(context.workspaceRoot, context.projectId, input.path);

      if (result.binary) {
        throw new AgentError(AgentErrors.INVALID_INPUT, 'Cannot propose edits to a binary file.');
      }

      const pendingChange = changeStore.createPendingChange({
        projectId: context.projectId,
        path: input.path,
        originalContent: result.content,
        proposedContent: input.proposedContent,
        reason: input.reason || 'Proposed code improvement'
      });

      return {
        success: true,
        changeId: pendingChange.changeId,
        path: pendingChange.path,
        reason: pendingChange.reason,
        status: 'pending',
        diff: pendingChange.diff
      };
    } catch (error) {
      if (error instanceof AgentError) throw error;
      if (error.message === 'Path traversal detected') {
        throw new AgentError(AgentErrors.PATH_NOT_ALLOWED, 'Path traversal detected');
      }
      if (error.message === 'Not a file') {
        throw new AgentError(AgentErrors.INVALID_INPUT, 'Target is a directory, not a file.');
      }
      throw new AgentError(AgentErrors.FILE_NOT_FOUND, `File "${input.path}" not found or unreadable.`);
    }
  }
};
