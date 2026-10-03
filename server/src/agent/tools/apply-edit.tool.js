import fs from 'fs/promises';
import { applyEditSchema } from '../schemas/tool.schemas.js';
import { changeStore } from '../changes/change-store.js';
import { resolveWorkspacePath } from '../../utils/workspace-path.js';
import { AgentError, AgentErrors } from '../agent-errors.js';

export const applyEditTool = {
  name: 'apply_edit',
  description: 'Apply an approved proposed change to the recovered project. Human authorization only.',
  inputSchema: applyEditSchema,
  execute: async (context, input) => {
    const change = changeStore.getChange(input.changeId);

    if (!change) {
      throw new AgentError(AgentErrors.INVALID_INPUT, `Change "${input.changeId}" not found.`);
    }

    if (change.status === 'applied') {
      return {
        success: true,
        changeId: change.changeId,
        path: change.path,
        status: 'applied',
        message: 'Change has already been applied.'
      };
    }

    // Resolve target file path securely
    let targetFilePath;
    try {
      targetFilePath = resolveWorkspacePath(context.workspaceRoot, change.projectId, change.path);
    } catch (err) {
      throw new AgentError(AgentErrors.PATH_NOT_ALLOWED, 'Target path escapes workspace.');
    }

    // Check file existence
    try {
      await fs.access(targetFilePath);
    } catch {
      throw new AgentError(AgentErrors.FILE_NOT_FOUND, `Target file "${change.path}" does not exist.`);
    }

    // Read current content to ensure no edit conflict
    const currentContent = await fs.readFile(targetFilePath, 'utf-8');
    if (currentContent !== change.originalContent) {
      throw new AgentError(
        'EDIT_CONFLICT',
        `File "${change.path}" has been modified since this edit was proposed. Cannot safely apply.`
      );
    }

    // Safe to write proposed content
    await fs.writeFile(targetFilePath, change.proposedContent, 'utf-8');

    // Update change status in store
    changeStore.markApplied(change.changeId);

    return {
      success: true,
      changeId: change.changeId,
      path: change.path,
      status: 'applied'
    };
  }
};
