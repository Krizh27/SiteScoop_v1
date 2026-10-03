import { test, describe } from 'node:test';
import assert from 'node:assert';
import { FindingNormalizer } from '../src/inspector/finding-normalizer.js';

describe('FindingNormalizer', () => {
  test('accepts valid finding with evidence and normalizes fields', () => {
    const raw = [
      {
        title: 'Missing JavaScript bundle',
        category: 'javascript',
        severity: 'warning',
        confidence: 'high',
        description: 'index.html links to missing.js which was not recovered.',
        evidence: ['index.html line 12: <script src="/missing.js">'],
        affectedFiles: ['index.html'],
        suggestedAction: 'Verify the file exists on remote server.'
      }
    ];

    const normalized = FindingNormalizer.normalizeFindings(raw);
    assert.strictEqual(normalized.length, 1);
    assert.strictEqual(normalized[0].title, 'Missing JavaScript bundle');
    assert.strictEqual(normalized[0].category, 'javascript');
    assert.strictEqual(normalized[0].severity, 'warning');
    assert.strictEqual(normalized[0].confidence, 'high');
    assert.strictEqual(normalized[0].affectedFiles[0], 'index.html');
    assert.ok(normalized[0].id.startsWith('finding-'));
  });

  test('rejects finding with missing or empty evidence (Mandatory Evidence Rule)', () => {
    const raw = [
      {
        title: 'Backend might be broken',
        category: 'recovery',
        severity: 'error',
        description: 'The backend is probably offline.',
        evidence: [] // Empty evidence!
      },
      {
        title: 'Valid finding',
        category: 'html',
        severity: 'info',
        description: 'Missing title tag.',
        evidence: ['No title tag in head.']
      }
    ];

    const normalized = FindingNormalizer.normalizeFindings(raw);
    assert.strictEqual(normalized.length, 1);
    assert.strictEqual(normalized[0].title, 'Valid finding');
  });

  test('normalizes unrecognized severity and confidence to safe defaults', () => {
    const raw = [
      {
        title: 'Some issue',
        category: 'nonexistent-category',
        severity: 'catastrophic-danger', // invalid severity
        confidence: 'super-certain',     // invalid confidence
        description: 'Description here',
        evidence: ['Proof here']
      }
    ];

    const normalized = FindingNormalizer.normalizeFindings(raw);
    assert.strictEqual(normalized.length, 1);
    assert.strictEqual(normalized[0].category, 'unknown');
    assert.strictEqual(normalized[0].severity, 'info'); // falls back to info
    assert.strictEqual(normalized[0].confidence, 'medium'); // falls back to medium
  });

  test('deduplicates findings with identical titles and affected files', () => {
    const raw = [
      {
        title: 'Missing resource: style.css',
        category: 'asset',
        severity: 'warning',
        description: 'First report of style.css',
        evidence: ['Evidence A'],
        affectedFiles: ['index.html']
      },
      {
        title: 'Missing resource: style.css',
        category: 'asset',
        severity: 'warning',
        description: 'Second report of style.css',
        evidence: ['Evidence B'],
        affectedFiles: ['index.html']
      }
    ];

    const normalized = FindingNormalizer.normalizeFindings(raw);
    assert.strictEqual(normalized.length, 1);
    // Evidence should be merged
    assert.strictEqual(normalized[0].evidence.length, 2);
    assert.ok(normalized[0].evidence.includes('Evidence A'));
    assert.ok(normalized[0].evidence.includes('Evidence B'));
  });

  test('sorts by severity (error > warning > info) and enforces max limit', () => {
    const raw = [
      { title: 'Info finding', severity: 'info', description: 'desc', evidence: ['ev'] },
      { title: 'Error finding', severity: 'error', description: 'desc', evidence: ['ev'] },
      { title: 'Warning finding', severity: 'warning', description: 'desc', evidence: ['ev'] }
    ];

    const normalized = FindingNormalizer.normalizeFindings(raw, { maxFindings: 2 });
    assert.strictEqual(normalized.length, 2);
    assert.strictEqual(normalized[0].severity, 'error');
    assert.strictEqual(normalized[1].severity, 'warning');
  });
});
