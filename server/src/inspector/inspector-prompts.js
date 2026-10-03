export const INSPECTOR_SYSTEM_PROMPT = `You are the SiteScoop Project Inspector.

Your task is to analyze a recovered frontend website project and report concrete, evidence-backed issues, limitations, and potential broken references.

Strict Principles:
1. Evidence First: Every finding must cite explicit evidence (e.g., download failure in recovery.json, missing referenced file, missing viewport in index.html).
2. Distinguish Fact from Inference: Do not declare something broken merely because it is unusual or incomplete.
3. Incomplete Recovery Reality:
   - Missing backend code is expected in frontend recovery; do NOT report missing backend as a frontend error.
   - If package.json is missing, state: "No package manifest was recovered, so original npm dependencies cannot be confirmed" (categorized as dependency, severity info).
   - Do NOT invent files, APIs, or libraries not supported by evidence.
4. Confidence Levels:
   - high: Directly supported by concrete project/recovery evidence.
   - medium: Supported by multiple clues but requires human verification.
   - low: Plausible interpretation requiring human verification.
5. Severity Levels:
   - error: Confirmed broken behavior (e.g. required entry script failed to download).
   - warning: Recovered resource unavailable or potential display issue (e.g. missing stylesheet).
   - info: Noteworthy architectural fact or recovery limitation (e.g. absent package manifest).

Output Format:
You must respond with ONLY a single valid JSON object containing an array of findings:
{
  "findings": [
    {
      "id": "finding-1",
      "title": "Concise issue summary",
      "category": "recovery | asset | html | css | javascript | dependency | structure | performance | security | unknown",
      "severity": "info | warning | error",
      "confidence": "low | medium | high",
      "description": "What was observed and why it matters.",
      "evidence": [
        "Concrete observation 1 (e.g. index.html references /assets/main.css)",
        "Concrete observation 2 (e.g. recovery.json records /assets/main.css as failed)"
      ],
      "affectedFiles": ["index.html"],
      "suggestedAction": "Practical verification or remediation step."
    }
  ]
}

Do not include any introductory or concluding text outside the JSON object.`;

export function formatDeterministicObservations(deterministicChecks) {
  const sections = [];

  // Recovery
  const rec = deterministicChecks.recovery;
  if (rec) {
    if (rec.hasReport) {
      let recText = `Recovery Report:
- Total resources attempted: ${rec.totalResources}
- Successfully downloaded: ${rec.downloadedCount}
- Failed resources count: ${rec.failedCount}`;
      if (rec.failedResources && rec.failedResources.length > 0) {
        recText += `\n- Failed resource paths:\n  ${rec.failedResources.map(f => typeof f === 'object' ? f.url || JSON.stringify(f) : f).join('\n  ')}`;
      }
      sections.push(recText);
    } else {
      sections.push('Recovery Report: No recovery.json found.');
    }
  }

  // HTML
  const html = deterministicChecks.html;
  if (html && html.hasHtml) {
    let htmlText = `HTML Analysis (index.html):
- Missing <title>: ${html.missingTitle}
- Missing viewport meta: ${html.missingViewport}`;
    if (html.missingLocalReferences && html.missingLocalReferences.length > 0) {
      htmlText += `\n- Local assets referenced in HTML that DO NOT exist on disk:\n  ${html.missingLocalReferences.map(r => `${r.sourceTag} (expected at ${r.normalizedPath})`).join('\n  ')}`;
    }
    if (html.duplicateIds && html.duplicateIds.length > 0) {
      htmlText += `\n- Duplicate element IDs:\n  ${html.duplicateIds.map(d => `#${d.id} (${d.count}x)`).join(', ')}`;
    }
    sections.push(htmlText);
  }

  // Assets
  const assets = deterministicChecks.assets;
  if (assets) {
    let assetText = `Assets Directory:
- Recovered asset files: ${assets.assetCount}`;
    if (assets.zeroByteFiles && assets.zeroByteFiles.length > 0) {
      assetText += `\n- Empty (0-byte) files:\n  ${assets.zeroByteFiles.join('\n  ')}`;
    }
    if (assets.unusualExtensions && assets.unusualExtensions.length > 0) {
      assetText += `\n- Unusual/temporary extensions:\n  ${assets.unusualExtensions.join('\n  ')}`;
    }
    sections.push(assetText);
  }

  // Dependencies
  const dep = deterministicChecks.dependencies;
  if (dep) {
    let depText = `Dependency Manifest:
- Has package.json: ${dep.hasPackageJson}`;
    if (dep.hasPackageJson) {
      depText += `\n- Declared dependencies: ${dep.dependencyCount}\n- Declared devDependencies: ${dep.devDependencyCount}`;
    } else {
      depText += `\n- Note: ${dep.message}`;
    }
    sections.push(depText);
  }

  return sections.join('\n\n');
}
