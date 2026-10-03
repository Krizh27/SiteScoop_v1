import { resolveWorkspacePath } from '../utils/workspace-path.js';
import { AgentError, AgentErrors } from './agent-errors.js';
import path from 'path';
import fs from 'fs';

export class AgentContext {
  constructor(projectId, workspaceDir) {
    if (!projectId || typeof projectId !== 'string') {
      throw new AgentError(AgentErrors.INVALID_INPUT, 'Invalid projectId');
    }
    
    this.projectId = projectId;
    this.workspaceRoot = path.resolve(workspaceDir);
    this.createdAt = new Date().toISOString();

    try {
      this.projectRoot = resolveWorkspacePath(this.workspaceRoot, this.projectId);
      if (!fs.existsSync(this.projectRoot)) {
        throw new AgentError(AgentErrors.PROJECT_NOT_FOUND, `Project ${this.projectId} does not exist`);
      }
    } catch (e) {
      if (e instanceof AgentError) throw e;
      throw new AgentError(AgentErrors.PATH_NOT_ALLOWED, 'Invalid project path');
    }
  }
}
