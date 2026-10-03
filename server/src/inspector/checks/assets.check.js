import fs from 'fs/promises';
import path from 'path';

/**
 * Deterministic check on assets folder and file sizes.
 */
export async function runAssetsCheck(projectDir) {
  const assetsDir = path.join(projectDir, 'assets');
  const results = {
    category: 'asset',
    hasAssetsDir: false,
    assetCount: 0,
    zeroByteFiles: [],
    unusualExtensions: []
  };

  try {
    const stat = await fs.stat(assetsDir);
    if (!stat.isDirectory()) return results;
    results.hasAssetsDir = true;

    async function walk(current) {
      const entries = await fs.readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else {
          results.assetCount++;
          const fstat = await fs.stat(full);
          const relPath = path.relative(projectDir, full).split(path.sep).join('/');
          if (fstat.size === 0) {
            results.zeroByteFiles.push(relPath);
          }
          const ext = path.extname(entry.name).toLowerCase();
          if (!ext || ['.tmp', '.part', '.crdownload', '.bak'].includes(ext)) {
            results.unusualExtensions.push(relPath);
          }
        }
      }
    }

    await walk(assetsDir);
    return results;
  } catch {
    return results;
  }
}
