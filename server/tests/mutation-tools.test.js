import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs/promises';
import { changeStore } from '../src/agent/changes/change-store.js';
import { proposeEditTool } from '../src/agent/tools/propose-edit.tool.js';
import { getDiffTool } from '../src/agent/tools/get-diff.tool.js';
import { applyEditTool } from '../src/agent/tools/apply-edit.tool.js';
import { AgentPolicy } from '../src/agent/agent-policy.js';
import { AgentContext } from '../src/agent/agent-context.js';

describe('Stage 6/7/8 MVP Mutation Capabilities', () => {
  const workspaceRoot = path.resolve(process.cwd(), '../workspace');
  const projectId = 'demo-site';
  const targetFile = 'index.html';

  beforeEach(async () => {
    changeStore.clear();
    // Reset index.html to default fixture state
    const originalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Demo Site — SiteScoop AI</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to Recovered Demo Site</h1>
  </div>
</body>
</html>`;
    const filePath = path.resolve(workspaceRoot, projectId, targetFile);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, originalHtml, 'utf-8');
  });

  test('propose_edit generates pending change with diff and does not modify file', async () => {
    const context = new AgentContext(projectId, workspaceRoot);
    const proposedContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Site — SiteScoop AI</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to Recovered Demo Site</h1>
  </div>
</body>
</html>`;

    const result = await proposeEditTool.execute(context, {
      projectId,
      path: targetFile,
      proposedContent,
      reason: 'Add viewport meta tag for mobile responsiveness'
    });

    assert.equal(result.success, true);
    assert.ok(result.changeId);
    assert.equal(result.status, 'pending');
    assert.match(result.diff, /\+.*meta name="viewport"/);

    // Verify file on disk has NOT changed
    const currentOnDisk = await fs.readFile(path.resolve(workspaceRoot, projectId, targetFile), 'utf-8');
    assert.ok(!currentOnDisk.includes('meta name="viewport"'));
  });

  test('get_diff retrieves valid diff by changeId', async () => {
    const context = new AgentContext(projectId, workspaceRoot);
    const proposed = '<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>';

    const propResult = await proposeEditTool.execute(context, {
      projectId,
      path: targetFile,
      proposedContent: proposed,
      reason: 'Viewport fix'
    });

    const diffResult = await getDiffTool.execute(context, {
      changeId: propResult.changeId
    });

    assert.equal(diffResult.changeId, propResult.changeId);
    assert.equal(diffResult.path, targetFile);
    assert.equal(diffResult.status, 'pending');
    assert.ok(diffResult.diff.length > 0);
  });

  test('AgentPolicy blocks apply_edit from autonomous model execution', () => {
    assert.equal(AgentPolicy.isAllowed('propose_edit'), true);
    assert.equal(AgentPolicy.isAllowed('get_diff'), true);
    assert.equal(AgentPolicy.isAllowed('apply_edit'), false);
    assert.throws(() => AgentPolicy.assertAllowed('apply_edit'), /not permitted by agent security policy/);
  });

  test('apply_edit writes proposed content on human approval', async () => {
    const context = new AgentContext(projectId, workspaceRoot);
    const proposed = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Site — SiteScoop AI</title>
</head>
<body></body>
</html>`;

    const propResult = await proposeEditTool.execute(context, {
      projectId,
      path: targetFile,
      proposedContent: proposed,
      reason: 'Add viewport'
    });

    // Human approves and calls applyEditTool
    const applyResult = await applyEditTool.execute(context, {
      changeId: propResult.changeId
    });

    assert.equal(applyResult.success, true);
    assert.equal(applyResult.status, 'applied');

    // Verify content on disk was actually written
    const updated = await fs.readFile(path.resolve(workspaceRoot, projectId, targetFile), 'utf-8');
    assert.equal(updated, proposed);
  });

  test('apply_edit rejects edit if file changed on disk (EDIT_CONFLICT)', async () => {
    const context = new AgentContext(projectId, workspaceRoot);
    const propResult = await proposeEditTool.execute(context, {
      projectId,
      path: targetFile,
      proposedContent: 'proposed content',
      reason: 'test'
    });

    // Simulate concurrent modification to disk file
    await fs.writeFile(path.resolve(workspaceRoot, projectId, targetFile), 'concurrent modification!', 'utf-8');

    // Attempting to apply should throw EDIT_CONFLICT
    await assert.rejects(
      async () => applyEditTool.execute(context, { changeId: propResult.changeId }),
      (err) => err.code === 'EDIT_CONFLICT'
    );
  });
});
