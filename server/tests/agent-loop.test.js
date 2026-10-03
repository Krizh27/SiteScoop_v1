import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { AgentService } from '../src/agent/agent.service.js';
import { registerAllTools } from '../src/agent/tools/index.js';

describe('AgentLoop & Mock Model Sequence', () => {
  const testWorkspace = path.resolve(process.cwd(), './test_workspace');
  const testProjectId = 'recovery-test-project-123';
  const testProjectDir = path.join(testWorkspace, testProjectId);

  before(() => {
    // Register tools
    registerAllTools();

    // Create temporary test project structure
    if (!fs.existsSync(testProjectDir)) {
      fs.mkdirSync(testProjectDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(testProjectDir, 'index.html'),
      '<!doctype html><html><head><title>Test Project</title></head><body><h1>Hello SiteScoop</h1></body></html>'
    );
    fs.writeFileSync(
      path.join(testProjectDir, 'recovery-report.json'),
      JSON.stringify({ url: 'https://example.com', downloadedResources: ['index.html'] })
    );
  });

  after(() => {
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  test('executes 3-step mock sequence cleanly without Ollama (Section 30)', async () => {
    const responses = [
      JSON.stringify({
        type: 'tool_call',
        tool: 'list_project_files',
        input: { projectId: testProjectId }
      }),
      JSON.stringify({
        type: 'tool_call',
        tool: 'read_file',
        input: { projectId: testProjectId, path: 'index.html' }
      }),
      JSON.stringify({
        type: 'final',
        answer: 'The project contains a recovered HTML entry point with a title and heading.'
      })
    ];

    let callCount = 0;
    const mockModelService = {
      generate: async () => {
        const content = responses[callCount] || responses[responses.length - 1];
        callCount++;
        return {
          success: true,
          model: 'mock-gemma',
          content,
          usage: { promptTokens: 50, completionTokens: 50 }
        };
      }
    };

    const agentService = new AgentService({ workspaceDir: testWorkspace });
    const result = await agentService.runAgent({
      projectId: testProjectId,
      userRequest: 'Explain the entry point of this project.',
      workspaceDir: testWorkspace,
      modelService: mockModelService
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.steps, 3);
    assert.strictEqual(result.toolCalls.length, 2);
    assert.strictEqual(result.toolCalls[0].tool, 'list_project_files');
    assert.strictEqual(result.toolCalls[1].tool, 'read_file');
    assert.strictEqual(
      result.answer,
      'The project contains a recovered HTML entry point with a title and heading.'
    );
  });

  test('terminates when step limit is reached', async () => {
    // Model keeps requesting tools in an infinite loop
    const mockModelService = {
      generate: async () => ({
        success: true,
        model: 'mock-gemma',
        content: JSON.stringify({
          type: 'tool_call',
          tool: 'list_project_files',
          input: { projectId: testProjectId }
        })
      })
    };

    const agentService = new AgentService({ workspaceDir: testWorkspace });
    const result = await agentService.runAgent({
      projectId: testProjectId,
      userRequest: 'Analyze forever',
      workspaceDir: testWorkspace,
      modelService: mockModelService,
      maxSteps: 3
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, 'limit_reached');
    assert.strictEqual(result.error.code, 'AGENT_STEP_LIMIT_REACHED');
  });

  test('terminates on clarification action', async () => {
    const mockModelService = {
      generate: async () => ({
        success: true,
        model: 'mock-gemma',
        content: JSON.stringify({
          type: 'clarification',
          question: 'Are you interested in styles or markup?'
        })
      })
    };

    const agentService = new AgentService({ workspaceDir: testWorkspace });
    const result = await agentService.runAgent({
      projectId: testProjectId,
      userRequest: 'Check frontend',
      workspaceDir: testWorkspace,
      modelService: mockModelService
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'needs_clarification');
    assert.strictEqual(result.question, 'Are you interested in styles or markup?');
  });

  test('handles tool error gracefully when path traversal is attempted', async () => {
    let callCount = 0;
    const mockModelService = {
      generate: async () => {
        callCount++;
        if (callCount === 1) {
          return {
            success: true,
            model: 'mock-gemma',
            content: JSON.stringify({
              type: 'tool_call',
              tool: 'read_file',
              input: { projectId: testProjectId, path: '../../outside.txt' }
            })
          };
        }
        return {
          success: true,
          model: 'mock-gemma',
          content: JSON.stringify({
            type: 'final',
            answer: 'Access was denied as expected.'
          })
        };
      }
    };

    const agentService = new AgentService({ workspaceDir: testWorkspace });
    const result = await agentService.runAgent({
      projectId: testProjectId,
      userRequest: 'Try to read outside',
      workspaceDir: testWorkspace,
      modelService: mockModelService
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.toolCalls.length, 1);
    assert.strictEqual(result.toolCalls[0].tool, 'read_file');
  });
});
