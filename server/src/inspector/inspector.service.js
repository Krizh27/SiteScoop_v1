import path from 'path';
import fs from 'fs';
import { runAllDeterministicChecks } from './checks/index.js';
import { FindingNormalizer } from './finding-normalizer.js';
import { INSPECTOR_SYSTEM_PROMPT, formatDeterministicObservations } from './inspector-prompts.js';
import { inspectionReportSchema } from './inspector.schemas.js';
import { InspectorError, InspectorErrors } from './inspector.errors.js';
import { modelService as defaultModelService } from '../ai/model/model.service.js';
import { logger } from '../utils/logger.js';
import { resolveWorkspacePath } from '../utils/workspace-path.js';

export class InspectorService {
  constructor(options = {}) {
    this.workspaceDir = options.workspaceDir || process.env.WORKSPACE_DIR || './workspace';
    this.reportCache = new Map(); // In-memory report cache keyed by projectId
  }

  getWorkspacePath() {
    return path.resolve(process.cwd(), this.workspaceDir);
  }

  /**
   * Run full inspection on a recovered project.
   */
  async inspectProject({ projectId, focus = [], modelService = defaultModelService } = {}) {
    if (!projectId || typeof projectId !== 'string') {
      throw new InspectorError(InspectorErrors.INVALID_INPUT, 'Invalid projectId');
    }

    const workspaceRoot = this.getWorkspacePath();
    let projectDir;
    try {
      projectDir = resolveWorkspacePath(workspaceRoot, projectId);
      if (!fs.existsSync(projectDir)) {
        throw new InspectorError(InspectorErrors.NO_PROJECT_DATA, `Project '${projectId}' does not exist.`);
      }
    } catch (err) {
      if (err instanceof InspectorError) throw err;
      throw new InspectorError(InspectorErrors.NO_PROJECT_DATA, 'Invalid project path');
    }

    logger.info(`[Inspector] Running inspection for project: ${projectId}`);

    // 1. Run deterministic checks
    const deterministicResults = await runAllDeterministicChecks(projectDir);
    const deterministicText = formatDeterministicObservations(deterministicResults);

    // 2. Synthesize baseline deterministic findings (guarantees core factual issues are always captured)
    const baselineFindings = this.buildDeterministicFindings(deterministicResults, projectId);

    // 3. Prompt Gemma for analysis and interpretation
    let promptForModel = `PROJECT INSPECTION REQUEST:
Project ID: ${projectId}
${focus.length > 0 ? `Focus Areas: ${focus.join(', ')}` : 'Comprehensive Inspection'}

DETERMINISTIC OBSERVATIONS:
${deterministicText}

Synthesize these observations into evidence-backed findings. Follow the strict output format and anti-hallucination rules. Return ONLY valid JSON with { "findings": [...] }.`;

    let modelFindings = [];
    let agentStepsCount = 1;

    try {
      logger.info(`[Inspector] Invoking model for inspection reasoning`);
      const modelResult = await modelService.generate({
        systemPrompt: INSPECTOR_SYSTEM_PROMPT,
        userPrompt: promptForModel
      });

      // Parse JSON from response
      modelFindings = this.extractFindingsFromModelResponse(modelResult.content);
    } catch (err) {
      logger.warn(`[Inspector] Model inspection reasoning failed or unavailable: ${err.message}. Using deterministic baseline findings.`);
      // If model failed (e.g. Ollama offline), fallback cleanly to deterministic baseline findings!
      modelFindings = [];
    }

    // 4. Combine model findings with deterministic findings and normalize
    const mergedRaw = [...modelFindings, ...baselineFindings];
    const maxFindings = parseInt(process.env.INSPECTOR_MAX_FINDINGS || '12', 10);
    const normalizedFindings = FindingNormalizer.normalizeFindings(mergedRaw, { maxFindings });

    // 5. Calculate summary metrics
    const summary = {
      findingCount: normalizedFindings.length,
      errorCount: normalizedFindings.filter(f => f.severity === 'error').length,
      warningCount: normalizedFindings.filter(f => f.severity === 'warning').length,
      infoCount: normalizedFindings.filter(f => f.severity === 'info').length
    };

    // 6. Build final report payload
    const reportPayload = {
      success: true,
      projectId,
      summary,
      findings: normalizedFindings,
      analysis: {
        deterministicChecks: 4,
        agentSteps: agentStepsCount
      }
    };

    // 7. Validate report against Zod schema
    const validated = inspectionReportSchema.safeParse(reportPayload);
    if (!validated.success) {
      throw new InspectorError(
        InspectorErrors.INVALID_INSPECTION_RESPONSE,
        'Generated inspection report failed schema validation.'
      );
    }

    // 8. Cache report in memory
    this.reportCache.set(projectId, validated.data);
    logger.info(`[Inspector] Inspection completed with ${summary.findingCount} findings (${summary.errorCount} errors, ${summary.warningCount} warnings, ${summary.infoCount} info).`);

    return validated.data;
  }

  /**
   * Retrieve cached report for a project if available.
   */
  getReport(projectId) {
    if (!this.reportCache.has(projectId)) {
      throw new InspectorError(InspectorErrors.INSPECTION_NOT_FOUND, `No inspection report found for project '${projectId}'.`);
    }
    return this.reportCache.get(projectId);
  }

  /**
   * Extract findings JSON array from raw model text.
   */
  extractFindingsFromModelResponse(rawText) {
    if (!rawText || typeof rawText !== 'string') return [];

    let cleaned = rawText.trim();
    // Strip markdown code fences if wrapped
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.findings)) {
        return parsed.findings;
      }
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      // Try to find { ... } block
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try {
          const slice = cleaned.slice(start, end + 1);
          const parsed = JSON.parse(slice);
          if (Array.isArray(parsed.findings)) return parsed.findings;
        } catch {
          return [];
        }
      }
      return [];
    }
  }

  /**
   * Produce factual baseline findings from deterministic checks.
   */
  buildDeterministicFindings(checks, projectId) {
    const findings = [];

    // Failed resources from recovery.json
    if (checks.recovery?.hasReport && checks.recovery.failedCount > 0) {
      findings.push({
        id: 'det-rec-1',
        title: `${checks.recovery.failedCount} external resource(s) failed during recovery`,
        category: 'recovery',
        severity: 'warning',
        confidence: 'high',
        description: `During the site extraction process, ${checks.recovery.failedCount} resource(s) could not be retrieved from the live website.`,
        evidence: [
          `recovery.json records ${checks.recovery.failedCount} download failures out of ${checks.recovery.totalResources} attempted resources.`,
          checks.recovery.failedResources.length > 0
            ? `Sample failed resources: ${checks.recovery.failedResources.map(f => typeof f === 'object' ? f.url || JSON.stringify(f) : f).slice(0, 3).join(', ')}`
            : 'Check recovery report for individual failed URLs.'
        ],
        affectedFiles: ['recovery.json'],
        suggestedAction: 'Verify whether these resources still exist on the original live deployment.'
      });
    }

    // Missing local references in HTML
    if (checks.html?.missingLocalReferences?.length > 0) {
      for (const missing of checks.html.missingLocalReferences.slice(0, 5)) {
        findings.push({
          id: `det-html-ref-${missing.normalizedPath}`,
          title: `Referenced local resource not found: ${missing.normalizedPath}`,
          category: 'html',
          severity: 'warning',
          confidence: 'high',
          description: `index.html references a local asset that is missing from the recovered project workspace.`,
          evidence: [
            `Tag in index.html references '${missing.sourceTag}'`,
            `File does not exist at path: '${missing.normalizedPath}'`
          ],
          affectedFiles: ['index.html'],
          suggestedAction: 'Check recovery report to see if this asset failed to download or was excluded.'
        });
      }
    }

    // Missing viewport metadata
    if (checks.html?.hasHtml && checks.html.missingViewport) {
      findings.push({
        id: 'det-html-viewport',
        title: 'Missing viewport meta tag',
        category: 'html',
        severity: 'info',
        confidence: 'high',
        description: 'index.html does not declare a <meta name="viewport"> tag, which may affect responsive mobile rendering.',
        evidence: [
          'No <meta name="viewport"> element was found in the head of index.html.'
        ],
        affectedFiles: ['index.html'],
        suggestedAction: 'Add a standard responsive viewport meta tag if targeting mobile devices.'
      });
    }

    // Missing package.json manifest
    if (checks.dependencies && !checks.dependencies.hasPackageJson) {
      findings.push({
        id: 'det-dep-none',
        title: 'No package manifest recovered',
        category: 'dependency',
        severity: 'info',
        confidence: 'high',
        description: 'No package.json manifest was recovered from the deployed website.',
        evidence: [
          'No package.json file exists in the recovered project root directory.',
          'Deployed static websites typically omit developer build manifests.'
        ],
        affectedFiles: [],
        suggestedAction: 'Original npm dependencies cannot be confirmed from project files alone; inspect bundled scripts manually.'
      });
    }

    return findings;
  }
}

export const inspectorService = new InspectorService();
