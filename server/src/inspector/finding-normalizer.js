import { findingCategoryEnum, findingSeverityEnum, findingConfidenceEnum } from './inspector.schemas.js';

export class FindingNormalizer {
  /**
   * Normalize, filter, deduplicate, and rank findings.
   */
  static normalizeFindings(rawFindings = [], options = {}) {
    if (!Array.isArray(rawFindings)) return [];

    const maxFindings = options.maxFindings || parseInt(process.env.INSPECTOR_MAX_FINDINGS || '12', 10);
    const validCategories = new Set(findingCategoryEnum.options);
    const validSeverities = new Set(findingSeverityEnum.options);
    const validConfidences = new Set(findingConfidenceEnum.options);

    const normalized = [];
    const seenSignatures = new Set();

    let counter = 1;

    for (const raw of rawFindings) {
      if (!raw || typeof raw !== 'object') continue;

      const title = typeof raw.title === 'string' ? raw.title.trim() : '';
      const description = typeof raw.description === 'string' ? raw.description.trim() : '';
      if (!title || !description) continue;

      // Extract and clean evidence
      let evidenceList = [];
      if (Array.isArray(raw.evidence)) {
        evidenceList = raw.evidence
          .map(e => (typeof e === 'string' ? e.trim() : ''))
          .filter(e => e.length > 0);
      } else if (typeof raw.evidence === 'string' && raw.evidence.trim()) {
        evidenceList = [raw.evidence.trim()];
      }

      // Mandatory Evidence Rule (Section 20): If no evidence, discard
      if (evidenceList.length === 0) {
        continue;
      }

      // Extract affected files
      let affected = [];
      if (Array.isArray(raw.affectedFiles)) {
        affected = raw.affectedFiles
          .map(f => (typeof f === 'string' ? f.trim() : ''))
          .filter(f => f.length > 0);
      } else if (typeof raw.affectedFiles === 'string' && raw.affectedFiles.trim()) {
        affected = [raw.affectedFiles.trim()];
      }

      // Normalize category
      let category = typeof raw.category === 'string' ? raw.category.toLowerCase().trim() : 'unknown';
      if (!validCategories.has(category)) {
        category = 'unknown';
      }

      // Normalize severity
      let severity = typeof raw.severity === 'string' ? raw.severity.toLowerCase().trim() : 'info';
      if (!validSeverities.has(severity)) {
        severity = 'info';
      }

      // Normalize confidence
      let confidence = typeof raw.confidence === 'string' ? raw.confidence.toLowerCase().trim() : 'medium';
      if (!validConfidences.has(confidence)) {
        confidence = 'medium';
      }

      // Deduplication signature
      const signature = `${category}:${title.toLowerCase()}:${affected.sort().join(',')}`;
      if (seenSignatures.has(signature)) {
        // Merge evidence into existing finding if duplicate
        const existing = normalized.find(f => f._signature === signature);
        if (existing) {
          for (const ev of evidenceList) {
            if (!existing.evidence.includes(ev)) {
              existing.evidence.push(ev);
            }
          }
        }
        continue;
      }

      seenSignatures.add(signature);

      const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `finding-${counter++}`;
      const suggestedAction = typeof raw.suggestedAction === 'string' && raw.suggestedAction.trim()
        ? raw.suggestedAction.trim()
        : undefined;

      normalized.push({
        _signature: signature,
        id,
        title,
        category,
        severity,
        confidence,
        description,
        evidence: evidenceList,
        affectedFiles: affected,
        suggestedAction
      });
    }

    // Rank findings: error > warning > info, high > medium > low
    const severityWeight = { error: 3, warning: 2, info: 1 };
    const confidenceWeight = { high: 3, medium: 2, low: 1 };

    normalized.sort((a, b) => {
      const sDiff = severityWeight[b.severity] - severityWeight[a.severity];
      if (sDiff !== 0) return sDiff;
      return confidenceWeight[b.confidence] - confidenceWeight[a.confidence];
    });

    // Strip internal signature and cap at maxFindings
    return normalized.slice(0, maxFindings).map(({ _signature, ...clean }) => clean);
  }
}
