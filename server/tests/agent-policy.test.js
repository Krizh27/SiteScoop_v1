import { test, describe } from 'node:test';
import assert from 'node:assert';
import { AgentPolicy, ALLOWED_TOOLS } from '../src/agent/agent-policy.js';
import { AgentErrors } from '../src/agent/agent-errors.js';

describe('AgentPolicy', () => {
  test('permits all 6 required read-only tools', () => {
    const expected = [
      'list_project_files',
      'read_file',
      'search_project',
      'get_recovery_report',
      'get_file_metadata',
      'analyze_dependencies'
    ];

    for (const tool of expected) {
      assert.strictEqual(AgentPolicy.isAllowed(tool), true, `Expected tool ${tool} to be permitted`);
      assert.doesNotThrow(() => AgentPolicy.assertAllowed(tool));
    }
  });

  test('rejects arbitrary unknown tools', () => {
    const dangerous = ['delete_everything', 'run_command', 'custom_tool', 'eval'];
    for (const tool of dangerous) {
      assert.strictEqual(AgentPolicy.isAllowed(tool), false);
      assert.throws(
        () => AgentPolicy.assertAllowed(tool),
        (err) => err.code === AgentErrors.TOOL_NOT_ALLOWED
      );
    }
  });

  test('rejects future mutation tools in Stage 5', () => {
    const mutationTools = ['edit_file', 'create_file', 'delete_file', 'apply_patch', 'exec_shell'];
    for (const tool of mutationTools) {
      assert.strictEqual(AgentPolicy.isAllowed(tool), false);
      assert.throws(
        () => AgentPolicy.assertAllowed(tool),
        (err) => err.code === AgentErrors.TOOL_NOT_ALLOWED
      );
    }
  });
});
