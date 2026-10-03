import { test, describe } from 'node:test';
import assert from 'node:assert';
import { AgentParser } from '../src/agent/agent-parser.js';
import { AgentErrors } from '../src/agent/agent-errors.js';

describe('AgentParser', () => {
  test('parses valid tool_call action', () => {
    const raw = JSON.stringify({
      type: 'tool_call',
      tool: 'read_file',
      input: { path: 'index.html' }
    });

    const action = AgentParser.parse(raw);
    assert.strictEqual(action.type, 'tool_call');
    assert.strictEqual(action.tool, 'read_file');
    assert.strictEqual(action.input.path, 'index.html');
  });

  test('parses valid final action', () => {
    const raw = JSON.stringify({
      type: 'final',
      answer: 'The website is a static landing page.'
    });

    const action = AgentParser.parse(raw);
    assert.strictEqual(action.type, 'final');
    assert.strictEqual(action.answer, 'The website is a static landing page.');
  });

  test('parses valid clarification action', () => {
    const raw = JSON.stringify({
      type: 'clarification',
      question: 'Which project directory should I inspect?'
    });

    const action = AgentParser.parse(raw);
    assert.strictEqual(action.type, 'clarification');
    assert.strictEqual(action.question, 'Which project directory should I inspect?');
  });

  test('safely strips markdown json code fences', () => {
    const raw = `Here is my action:
\`\`\`json
{
  "type": "tool_call",
  "tool": "list_project_files",
  "input": {}
}
\`\`\`
Hope this helps!`;

    const action = AgentParser.parse(raw);
    assert.strictEqual(action.type, 'tool_call');
    assert.strictEqual(action.tool, 'list_project_files');
  });

  test('rejects malformed json', () => {
    assert.throws(
      () => AgentParser.parse('{ "type": "final", answer: incomplete...'),
      (err) => err.code === AgentErrors.INVALID_AGENT_ACTION
    );
  });

  test('rejects multiple conflicting json objects', () => {
    const raw = `{"type": "tool_call", "tool": "read_file", "input": {}} and {"type": "final", "answer": "done"}`;
    assert.throws(
      () => AgentParser.parse(raw),
      (err) => err.code === AgentErrors.INVALID_AGENT_ACTION
    );
  });

  test('rejects arbitrary conversational text without json', () => {
    assert.throws(
      () => AgentParser.parse('I think we should inspect index.html.'),
      (err) => err.code === AgentErrors.INVALID_AGENT_ACTION
    );
  });

  test('rejects unknown action type', () => {
    const raw = JSON.stringify({
      type: 'unknown_action_type',
      data: 'something'
    });
    assert.throws(
      () => AgentParser.parse(raw),
      (err) => err.code === AgentErrors.INVALID_AGENT_ACTION
    );
  });

  test('rejects tool_call missing tool name', () => {
    const raw = JSON.stringify({
      type: 'tool_call',
      input: {}
    });
    assert.throws(
      () => AgentParser.parse(raw),
      (err) => err.code === AgentErrors.INVALID_AGENT_ACTION
    );
  });
});
