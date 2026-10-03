import crypto from 'crypto';
import * as diff from 'diff';

class ChangeStore {
  constructor() {
    this.changes = new Map();
  }

  /**
   * Create and store a pending proposed change.
   */
  createPendingChange({ projectId, path, originalContent, proposedContent, reason }) {
    const changeId = `change_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Generate unified diff
    const patch = diff.createPatch(path, originalContent, proposedContent, 'original', 'proposed');

    const change = {
      changeId,
      projectId,
      path,
      originalContent,
      proposedContent,
      reason: reason || 'Proposed code update',
      status: 'pending',
      diff: patch,
      createdAt: new Date().toISOString()
    };

    this.changes.set(changeId, change);
    return change;
  }

  /**
   * Retrieve a change by its ID.
   */
  getChange(changeId) {
    if (!changeId) return null;
    return this.changes.get(changeId) || null;
  }

  /**
   * Mark a change as applied.
   */
  markApplied(changeId) {
    const change = this.changes.get(changeId);
    if (!change) return null;
    change.status = 'applied';
    change.appliedAt = new Date().toISOString();
    return change;
  }

  /**
   * Mark a change as reverted.
   */
  markReverted(changeId) {
    const change = this.changes.get(changeId);
    if (!change) return null;
    change.status = 'reverted';
    change.revertedAt = new Date().toISOString();
    return change;
  }

  /**
   * List all changes for a specific project.
   */
  listByProject(projectId) {
    const results = [];
    for (const change of this.changes.values()) {
      if (change.projectId === projectId) {
        results.push(change);
      }
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Clear all changes (for testing).
   */
  clear() {
    this.changes.clear();
  }
}

export const changeStore = new ChangeStore();
