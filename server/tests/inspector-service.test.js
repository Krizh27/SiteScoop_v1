import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { InspectorService } from '../src/inspector/inspector.service.js';
import { InspectorErrors } from '../src/inspector/inspector.errors.js';

describe('InspectorService Integration', () => {
  const testWorkspace = path.resolve(process.cwd(), './test_service_workspace');
  const testProjectId = 'recovery-test-sample-456';
  const testProjectDir = path.join(testWorkspace, testProjectId);

  before(() => {
    fs.mkdirSync(path.join(testProjectDir, 'assets'), { recursive: true });
    fs.writeFileSync(
      path.join(testProjectDir, 'recovery.json'),
      JSON.stringify({
        url: 'https://example.com',
        downloadedResources: ['index.html'],
        failedResources: ['/assets/bundle.js']
      })
    );
    fs.writeFileSync(
      path.join(testProjectDir, 'index.html'),
      '<!doctype html><html><head><title>Test App</title></head><body><script src="/assets/bundle.js"></script></body></html>'
    );
  });

  after(() => {
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  test('successfully inspects project using mock model service', async () => {
    const mockModelService = {
      generate: async () => ({
        success: true,
        model: 'mock-gemma',
        content: JSON.stringify({
          findings: [
            {
              id: 'model-finding-1',
              title: 'Critical script bundle missing',
              category: 'javascript',
              severity: 'error',
              confidence: 'high',
              description: 'The main script bundle failed during recovery and is absent from workspace.',
              evidence: [
                'index.html references /assets/bundle.js',
                'recovery.json records /assets/bundle.js as failed'
              ],
              affectedFiles: ['index.html'],
              suggestedAction: 'Verify whether the bundle can be manually downloaded.'
            }
          ]
        })
      })
    };

    const service = new InspectorService({ workspaceDir: testWorkspace });
    const report = await service.inspectProject({
      projectId: testProjectId,
      modelService: mockModelService
    });

    assert.strictEqual(report.success, true);
    assert.strictEqual(report.projectId, testProjectId);
    assert.ok(report.summary.findingCount >= 1);
    assert.ok(report.findings.some(f => f.title === 'Critical script bundle missing'));
    assert.strictEqual(report.analysis.deterministicChecks, 4);

    // Verify caching works
    const cached = service.getReport(testProjectId);
    assert.strictEqual(cached.projectId, testProjectId);
    assert.strictEqual(cached.summary.findingCount, report.summary.findingCount);
  });

  test('falls back gracefully to deterministic findings if model is offline', async () => {
    const failingModelService = {
      generate: async () => {
        throw new Error('Ollama connection refused');
      }
    };

    const service = new InspectorService({ workspaceDir: testWorkspace });
    const report = await service.inspectProject({
      projectId: testProjectId,
      modelService: failingModelService
    });

    assert.strictEqual(report.success, true);
    assert.ok(report.summary.findingCount > 0);
    // Baseline findings detected the failed resource from recovery.json
    assert.ok(report.findings.some(f => f.category === 'recovery'));
  });

  test('throws NO_PROJECT_DATA for nonexistent project', async () => {
    const service = new InspectorService({ workspaceDir: testWorkspace });
    await assert.rejects(
      () => service.inspectProject({ projectId: 'nonexistent-project' }),
      (err) => err.code === InspectorErrors.NO_PROJECT_DATA
    );
  });
});
