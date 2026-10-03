import { AgentError, AgentErrors } from './agent-errors.js';

export const ALLOWED_TOOLS = new Set([
  'list_project_files',
  'read_file',
  'search_project',
  'get_recovery_report',
  'get_file_metadata',
  'analyze_dependencies',
  'propose_edit',
  'get_diff'
  // apply_edit is strictly blocked from autonomous model execution (human approval only)
]);

export class AgentPolicy {
  /**
   * Determine if a tool is permitted for agent execution in Stage 5.
   */
  static isAllowed(toolName) {
    if (typeof toolName !== 'string') return false;
    return ALLOWED_TOOLS.has(toolName.trim());
  }

  /**
   * Assert that a tool is allowed, or throw AgentError(TOOL_NOT_ALLOWED).
   */
  static assertAllowed(toolName) {
    if (!this.isAllowed(toolName)) {
      throw new AgentError(
        AgentErrors.TOOL_NOT_ALLOWED,
        `Tool '${toolName}' is not permitted by agent security policy.`
      );
    }
  }

  /**
   * Return the list of permitted tool names.
   */
  static getAllowedTools() {
    return Array.from(ALLOWED_TOOLS);
  }
}
