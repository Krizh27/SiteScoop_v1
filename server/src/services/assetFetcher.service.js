import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { validateUrl } from './urlValidator.service.js';
import { sanitizeFilename, getExtensionFromContentType, ensureDir } from '../utils/fileUtils.js';

// Constraints defined in requirements
const MAX_CONCURRENCY = 4;
const MAX_INDIVIDUAL_ASSET_SIZE = 3 * 1024 * 1024; // 3 MB
const MAX_AGGREGATE_SIZE = 10 * 1024 * 1024;       // 10 MB
const MAX_TOTAL_ASSETS = 20;                       // Up to 20 assets
const ASSET_REQUEST_TIMEOUT = 8000;                // 8 seconds

/**
 * Concurrent async task pool with max concurrency.
 */
async function runWithConcurrency(items, limit, asyncFn) {
  const results = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      try {
        results[index] = await asyncFn(items[index], index);
      } catch (err) {
        results[index] = { error: err.message, status: 'failed' };
      }
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Safely fetch and stage assets into the isolated extraction directory.
 *
 * @param {Array<string>} assetUrls - Deduplicated list of public asset URLs
 * @param {string} stagingDir - Absolute path to workspace/.staging/<extraction-id>/
 * @returns {Promise<{
 *   downloaded: number,
 *   failed: number,
 *   manifestAssets: Array<object>,
 *   warnings: Array<string>
 * }>}
 */
export async function fetchAndStageAssets(assetUrls, stagingDir) {
  const assetsDir = path.join(stagingDir, 'assets');
  await ensureDir(assetsDir);

  const warnings = [];
  const manifestAssets = [];
  const usedFilenames = new Set();

  let totalDownloadedBytes = 0;
  let downloadedCount = 0;
  let failedCount = 0;

  // Filter and limit to MAX_TOTAL_ASSETS
  const targetUrls = assetUrls.slice(0, MAX_TOTAL_ASSETS);
  if (assetUrls.length > MAX_TOTAL_ASSETS) {
    warnings.push(`Asset download cap reached: queued ${MAX_TOTAL_ASSETS} of ${assetUrls.length} discovered assets.`);
  }

  await runWithConcurrency(targetUrls, MAX_CONCURRENCY, async (url) => {
    // Check aggregate download limit
    if (totalDownloadedBytes >= MAX_AGGREGATE_SIZE) {
      manifestAssets.push({
        originalUrl: url,
        localRelativePath: null,
        status: 'skipped',
        error: 'Aggregate download budget (25 MB) exceeded.'
      });
      failedCount++;
      return;
    }

    // SSRF Check on asset URL
    try {
      await validateUrl(url);
    } catch (ssrfErr) {
      manifestAssets.push({
        originalUrl: url,
        localRelativePath: null,
        status: 'failed',
        error: `SSRF security policy blocked asset: ${ssrfErr.message}`
      });
      failedCount++;
      return;
    }

    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: ASSET_REQUEST_TIMEOUT,
        maxContentLength: MAX_INDIVIDUAL_ASSET_SIZE,
        maxBodyLength: MAX_INDIVIDUAL_ASSET_SIZE,
        headers: {
          'User-Agent': 'SiteScoop-AI/1.0 (+https://github.com/Krizh27/SiteScoop_v1)',
          'Accept': '*/*'
        },
        validateStatus: status => status === 200
      });

      const buffer = Buffer.from(response.data);
      const sizeBytes = buffer.length;

      if (sizeBytes > MAX_INDIVIDUAL_ASSET_SIZE) {
        throw new Error(`Asset size (${(sizeBytes / 1024 / 1024).toFixed(2)} MB) exceeds 5 MB limit.`);
      }

      if (totalDownloadedBytes + sizeBytes > MAX_AGGREGATE_SIZE) {
        warnings.push(`Aggregate size limit reached while downloading ${url}`);
        manifestAssets.push({
          originalUrl: url,
          localRelativePath: null,
          status: 'skipped',
          error: 'Aggregate download budget exceeded.'
        });
        failedCount++;
        return;
      }

      const contentType = response.headers['content-type'] || '';
      const fallbackExt = getExtensionFromContentType(contentType, url);

      // Determine unique, safe filename
      const urlPath = new URL(url).pathname;
      let baseFilename = sanitizeFilename(path.basename(urlPath), fallbackExt);

      let uniqueFilename = baseFilename;
      let counter = 1;
      const parsedExt = path.extname(baseFilename);
      const parsedStem = path.basename(baseFilename, parsedExt);

      while (usedFilenames.has(uniqueFilename.toLowerCase())) {
        uniqueFilename = `${parsedStem}_${counter}${parsedExt}`;
        counter++;
      }
      usedFilenames.add(uniqueFilename.toLowerCase());

      const destinationPath = path.join(assetsDir, uniqueFilename);
      await fs.writeFile(destinationPath, buffer);

      totalDownloadedBytes += sizeBytes;
      downloadedCount++;

      manifestAssets.push({
        originalUrl: url,
        localRelativePath: `assets/${uniqueFilename}`,
        contentType,
        sizeBytes,
        status: 'downloaded'
      });
    } catch (downloadErr) {
      failedCount++;
      manifestAssets.push({
        originalUrl: url,
        localRelativePath: null,
        status: 'failed',
        error: downloadErr.message || 'Download failed'
      });
    }
  });

  return {
    downloaded: downloadedCount,
    failed: failedCount,
    manifestAssets,
    warnings
  };
}
