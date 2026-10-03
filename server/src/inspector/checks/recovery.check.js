import fs from 'fs/promises';
import path from 'path';

/**
 * Deterministic check on recovery metadata (recovery.json).
 */
export async function runRecoveryCheck(projectDir) {
  const recoveryPath = path.join(projectDir, 'recovery.json');
  try {
    const raw = await fs.readFile(recoveryPath, 'utf-8');
    const data = JSON.parse(raw);

    const failed = Array.isArray(data.failedResources) ? data.failedResources : [];
    const downloaded = Array.isArray(data.downloadedResources) ? data.downloadedResources : [];

    return {
      category: 'recovery',
      hasReport: true,
      url: data.url || 'Unknown',
      totalResources: downloaded.length + failed.length,
      downloadedCount: downloaded.length,
      failedCount: failed.length,
      failedResources: failed.slice(0, 15), // Top 15 to stay compact
      isCapped: failed.length > 15
    };
  } catch {
    return {
      category: 'recovery',
      hasReport: false,
      message: 'No recovery.json report was found in the project root.'
    };
  }
}
