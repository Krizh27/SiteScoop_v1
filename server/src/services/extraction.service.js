import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { URL } from 'url';
import { validateUrl } from './urlValidator.service.js';
import { extractResourcesFromHtml } from './resourceExtractor.service.js';
import { fetchAndStageAssets } from './assetFetcher.service.js';
import { ensureDir, writeJsonFile } from '../utils/fileUtils.js';
import { logger } from '../utils/logger.js';

const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT = 10000;              // 10 seconds
const MAX_HTML_SIZE = 10 * 1024 * 1024;      // 10 MB

/**
 * Perform secure HTTP fetch following redirects with SSRF revalidation.
 */
async function fetchTargetHtml(initialUrl) {
  let currentUrl = initialUrl;
  let redirectsCount = 0;
  const redirectHistory = [initialUrl];

  while (true) {
    // Revalidate every step to prevent SSRF via open redirects
    await validateUrl(currentUrl);

    let response;
    try {
      response = await axios.get(currentUrl, {
        maxRedirects: 0,
        timeout: REQUEST_TIMEOUT,
        maxContentLength: MAX_HTML_SIZE,
        maxBodyLength: MAX_HTML_SIZE,
        responseType: 'text',
        headers: {
          'User-Agent': 'SiteScoop-AI/1.0 (+https://github.com/Krizh27/SiteScoop_v1)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        validateStatus: status => (status >= 200 && status < 400)
      });
    } catch (fetchErr) {
      if (fetchErr.response) {
        throw new Error(`Target website responded with HTTP ${fetchErr.response.status}: ${fetchErr.response.statusText}`);
      }
      throw new Error(`Connection failed for ${currentUrl}: ${fetchErr.message}`);
    }

    // Handle redirects
    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      if (redirectsCount >= MAX_REDIRECTS) {
        throw new Error(`Exceeded maximum allowed redirects (${MAX_REDIRECTS}).`);
      }

      const redirectDestination = new URL(response.headers.location, currentUrl).href;
      currentUrl = redirectDestination;
      redirectHistory.push(currentUrl);
      redirectsCount++;
      continue;
    }

    if (response.status !== 200) {
      throw new Error(`Unexpected HTTP status ${response.status} from target.`);
    }

    const html = typeof response.data === 'string' ? response.data : String(response.data);
    if (!html || html.trim().length === 0) {
      throw new Error('Target website returned an empty response.');
    }

    return {
      html,
      finalUrl: currentUrl,
      redirectHistory,
      contentType: response.headers['content-type'] || ''
    };
  }
}

/**
 * Main Extraction Service orchestrating validation, HTML parsing, asset downloading, and staging.
 *
 * @param {string} rawTargetUrl - The raw target URL input
 * @returns {Promise<object>} Extraction result conforming to API response spec
 */
export async function extractWebsite(rawTargetUrl) {
  // 1. Initial URL Validation & SSRF check
  const { parsedUrl } = await validateUrl(rawTargetUrl);
  const normalizedSourceUrl = parsedUrl.href;

  logger.info(`Starting website extraction for: ${normalizedSourceUrl}`);

  // 2. Fetch HTML securely
  const { html, finalUrl, redirectHistory, contentType } = await fetchTargetHtml(normalizedSourceUrl);

  const warnings = [];
  if (redirectHistory.length > 1) {
    warnings.push(`Redirected ${redirectHistory.length - 1} time(s): ${redirectHistory.join(' -> ')}`);
  }

  // 3. Extract metadata and resources using Cheerio
  const { page, resources } = extractResourcesFromHtml(html, finalUrl);

  // 4. Generate unique extraction ID & prepare staging directories
  const timestamp = new Date().toISOString();
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const extractionId = `ext_${Date.now()}_${randomSuffix}`;

  const workspaceRoot = process.env.WORKSPACE_DIR
    ? path.resolve(process.cwd(), process.env.WORKSPACE_DIR)
    : path.resolve(process.cwd(), '../workspace');

  const stagingDir = path.join(workspaceRoot, '.staging', extractionId);
  await ensureDir(stagingDir);

  // 5. Save raw index.html to staging directory
  const indexPath = path.join(stagingDir, 'index.html');
  await fs.writeFile(indexPath, html, 'utf8');

  // 6. Gather all asset candidates for download (stylesheets, scripts, images, fonts)
  const assetCandidates = [
    ...resources.stylesheets,
    ...resources.scripts,
    ...resources.images,
    ...resources.fonts
  ];

  // Deduplicate asset candidates
  const uniqueAssetUrls = Array.from(new Set(assetCandidates));

  // 7. Download and stage public assets
  const assetFetchResult = await fetchAndStageAssets(uniqueAssetUrls, stagingDir);

  if (assetFetchResult.warnings && assetFetchResult.warnings.length > 0) {
    warnings.push(...assetFetchResult.warnings);
  }

  // 8. Generate and save manifest.json
  const totalResources =
    resources.stylesheets.length +
    resources.scripts.length +
    resources.images.length +
    resources.fonts.length +
    resources.links.length;

  const manifest = {
    extractionId,
    originalUrl: normalizedSourceUrl,
    finalUrl,
    timestamp,
    page,
    resources,
    assets: assetFetchResult.manifestAssets,
    downloadSummary: {
      downloaded: assetFetchResult.downloaded,
      failed: assetFetchResult.failed,
      totalDiscovered: uniqueAssetUrls.length
    },
    warnings
  };

  const manifestPath = path.join(stagingDir, 'manifest.json');
  await writeJsonFile(manifestPath, manifest);

  logger.info(`Completed extraction ${extractionId}: ${assetFetchResult.downloaded} assets downloaded, ${assetFetchResult.failed} failed.`);

  // 9. Format response matching requirement #4 exactly
  return {
    success: true,
    extractionId,
    sourceUrl: normalizedSourceUrl,
    page: {
      title: page.title,
      description: page.description,
      canonical: page.canonical,
      language: page.language
    },
    resources: {
      stylesheets: resources.stylesheets,
      scripts: resources.scripts,
      images: resources.images,
      fonts: resources.fonts,
      links: resources.links
    },
    assets: {
      downloaded: assetFetchResult.downloaded,
      failed: assetFetchResult.failed
    },
    summary: {
      totalResources
    },
    warnings
  };
}
