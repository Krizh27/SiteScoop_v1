import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { runRecoveryCheck } from '../src/inspector/checks/recovery.check.js';
import { runHtmlCheck } from '../src/inspector/checks/html.check.js';
import { runDependenciesCheck } from '../src/inspector/checks/dependencies.check.js';
import { runAssetsCheck } from '../src/inspector/checks/assets.check.js';

describe('Deterministic Inspector Checks', () => {
  const testWorkspace = path.resolve(process.cwd(), './test_inspector_workspace');
  const projectA = path.join(testWorkspace, 'project-a');
  const projectB = path.join(testWorkspace, 'project-b');

  before(() => {
    // Setup project A: complete with issues
    fs.mkdirSync(path.join(projectA, 'assets', 'css'), { recursive: true });
    fs.mkdirSync(path.join(projectA, 'assets', 'js'), { recursive: true });

    // recovery.json with failed resources
    fs.writeFileSync(
      path.join(projectA, 'recovery.json'),
      JSON.stringify({
        url: 'https://example.com',
        downloadedResources: ['/assets/css/style.css'],
        failedResources: ['/assets/js/missing.js', '/assets/css/theme.css']
      })
    );

    // Existing style.css
    fs.writeFileSync(path.join(projectA, 'assets', 'css', 'style.css'), 'body { margin: 0; }');
    // Empty 0-byte file
    fs.writeFileSync(path.join(projectA, 'assets', 'js', 'empty.js'), '');

    // HTML missing title, missing viewport, and referencing missing.js
    fs.writeFileSync(
      path.join(projectA, 'index.html'),
      '<!doctype html><html><head><link rel="stylesheet" href="/assets/css/style.css"></head><body><script src="/assets/js/missing.js"></script><div id="dup"></div><div id="dup"></div></body></html>'
    );

    // package.json with dependencies
    fs.writeFileSync(
      path.join(projectA, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        dependencies: { react: '^18.0.0', lodash: '^4.17.21' }
      })
    );

    // Setup project B: empty / missing reports
    fs.mkdirSync(projectB, { recursive: true });
    fs.writeFileSync(
      path.join(projectB, 'index.html'),
      '<!doctype html><html><head><title>Clean Site</title><meta name="viewport" content="width=device-width"></head><body><h1>Hello</h1></body></html>'
    );
    // Malformed package.json
    fs.writeFileSync(path.join(projectB, 'package.json'), '{ broken json ...');
  });

  after(() => {
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  describe('Recovery Check', () => {
    test('detects failed resources and counts in recovery.json', async () => {
      const res = await runRecoveryCheck(projectA);
      assert.strictEqual(res.hasReport, true);
      assert.strictEqual(res.downloadedCount, 1);
      assert.strictEqual(res.failedCount, 2);
      assert.deepStrictEqual(res.failedResources, ['/assets/js/missing.js', '/assets/css/theme.css']);
    });

    test('handles missing recovery report gracefully', async () => {
      const res = await runRecoveryCheck(projectB);
      assert.strictEqual(res.hasReport, false);
      assert.strictEqual(res.category, 'recovery');
    });
  });

  describe('HTML Check', () => {
    test('detects missing title, missing viewport, and missing local script reference', async () => {
      const res = await runHtmlCheck(projectA);
      assert.strictEqual(res.hasHtml, true);
      assert.strictEqual(res.missingTitle, true);
      assert.strictEqual(res.missingViewport, true);
      assert.strictEqual(res.missingLocalReferences.length, 1);
      assert.strictEqual(res.missingLocalReferences[0].normalizedPath, 'assets/js/missing.js');
      assert.strictEqual(res.duplicateIds.length, 1);
      assert.strictEqual(res.duplicateIds[0].id, 'dup');
    });

    test('passes clean HTML with valid title and viewport', async () => {
      const res = await runHtmlCheck(projectB);
      assert.strictEqual(res.hasHtml, true);
      assert.strictEqual(res.missingTitle, false);
      assert.strictEqual(res.missingViewport, false);
      assert.strictEqual(res.missingLocalReferences.length, 0);
    });
  });

  describe('Dependencies Check', () => {
    test('reads valid package.json dependencies', async () => {
      const res = await runDependenciesCheck(projectA);
      assert.strictEqual(res.hasPackageJson, true);
      assert.strictEqual(res.isMalformed, false);
      assert.strictEqual(res.dependencyCount, 2);
    });

    test('detects malformed package.json without crashing', async () => {
      const res = await runDependenciesCheck(projectB);
      assert.strictEqual(res.hasPackageJson, true);
      assert.strictEqual(res.isMalformed, true);
    });

    test('handles missing package.json as recovery limitation', async () => {
      const emptyDir = path.join(testWorkspace, 'empty-dir');
      fs.mkdirSync(emptyDir, { recursive: true });
      const res = await runDependenciesCheck(emptyDir);
      assert.strictEqual(res.hasPackageJson, false);
      assert.match(res.message, /No package manifest was recovered/);
    });
  });

  describe('Assets Check', () => {
    test('detects zero-byte empty asset files', async () => {
      const res = await runAssetsCheck(projectA);
      assert.strictEqual(res.hasAssetsDir, true);
      assert.strictEqual(res.assetCount, 2);
      assert.strictEqual(res.zeroByteFiles.length, 1);
      assert.match(res.zeroByteFiles[0], /empty\.js/);
    });
  });
});
