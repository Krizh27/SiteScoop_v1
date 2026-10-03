import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { validateUrl } from './urlValidator.service.js';
import { extractResourcesFromHtml, resolveResourceUrl } from './resourceExtractor.service.js';
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
 * Rewrite HTML asset references to local relative paths for downloaded assets.
 */
function rewriteHtmlAssetPaths(html, finalUrl, downloadedAssets) {
  const $ = cheerio.load(html || '');

  // Map of originalUrl -> localRelativePath
  const urlToLocalMap = new Map();
  for (const asset of downloadedAssets) {
    if (asset.status === 'downloaded' && asset.localRelativePath) {
      urlToLocalMap.set(asset.originalUrl, asset.localRelativePath);
    }
  }

  // Rewrite stylesheets: link[rel="stylesheet"]
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href');
    const resolved = resolveResourceUrl(href, finalUrl);
    if (resolved && urlToLocalMap.has(resolved)) {
      $(el).attr('href', urlToLocalMap.get(resolved));
    }
  });

  // Rewrite scripts: script[src]
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    const resolved = resolveResourceUrl(src, finalUrl);
    if (resolved && urlToLocalMap.has(resolved)) {
      $(el).attr('src', urlToLocalMap.get(resolved));
    }
  });

  // Rewrite images: img[src]
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    const resolved = resolveResourceUrl(src, finalUrl);
    if (resolved && urlToLocalMap.has(resolved)) {
      $(el).attr('src', urlToLocalMap.get(resolved));
    }
  });

  // Remove <base> tag so local relative paths function correctly
  $('base').remove();

  return $.html();
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

  // 4. Generate unique project ID & prepare directories
  const timestamp = new Date().toISOString();
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  const projectId = `proj_${Date.now()}_${randomSuffix}`;

  const workspaceRoot = process.env.WORKSPACE_DIR
    ? path.resolve(process.cwd(), process.env.WORKSPACE_DIR)
    : path.resolve(process.cwd(), '../workspace');

  // Primary project directory in workspace/projects/{projectId}/
  const projectDir = path.join(workspaceRoot, 'projects', projectId);
  await ensureDir(projectDir);

  // 5. Gather all asset candidates for download (CSS, JS, images)
  const assetCandidates = [
    ...resources.stylesheets,
    ...resources.scripts,
    ...resources.images,
    ...resources.fonts
  ];

  // Deduplicate asset candidates
  const uniqueAssetUrls = Array.from(new Set(assetCandidates));

  // 6. Download public CSS, JS, images, fonts into projectDir/assets/
  const assetFetchResult = await fetchAndStageAssets(uniqueAssetUrls, projectDir);

  if (assetFetchResult.warnings && assetFetchResult.warnings.length > 0) {
    warnings.push(...assetFetchResult.warnings);
  }

  // 7. Rewrite downloaded asset references to local relative paths in index.html
  const rewrittenHtml = rewriteHtmlAssetPaths(html, finalUrl, assetFetchResult.manifestAssets);
  const indexPath = path.join(projectDir, 'index.html');
  await fs.writeFile(indexPath, rewrittenHtml, 'utf8');

  // Also maintain backup of raw original HTML
  const originalIndexPath = path.join(projectDir, 'index.original.html');
  await fs.writeFile(originalIndexPath, html, 'utf8');

  // 8. Generate and save manifest.json
  const assetCounts = {
    stylesheets: resources.stylesheets.length,
    scripts: resources.scripts.length,
    images: resources.images.length,
    fonts: resources.fonts.length,
    downloaded: assetFetchResult.downloaded,
    failed: assetFetchResult.failed,
    totalDiscovered: uniqueAssetUrls.length
  };

  const manifest = {
    projectId,
    originalUrl: normalizedSourceUrl,
    finalUrl,
    timestamp,
    metadata: {
      title: page.title,
      description: page.description,
      canonical: page.canonical,
      language: page.language
    },
    page,
    resources,
    assetCounts,
    downloadedAssets: assetFetchResult.manifestAssets,
    warnings
  };

  const manifestPath = path.join(projectDir, 'manifest.json');
  await writeJsonFile(manifestPath, manifest);

  logger.info(`Completed extraction for project ${projectId}: ${assetFetchResult.downloaded} assets downloaded, ${assetFetchResult.failed} failed.`);

  // 9. Return JSON with projectId, metadata, asset counts, warnings, and success status
  return {
    success: true,
    projectId,
    extractionId: projectId, // Backwards-compatibility
    sourceUrl: normalizedSourceUrl,
    metadata: {
      title: page.title,
      description: page.description,
      canonical: page.canonical,
      language: page.language
    },
    page: {
      title: page.title,
      description: page.description,
      canonical: page.canonical,
      language: page.language
    },
    assetCounts,
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
      totalResources: uniqueAssetUrls.length
    },
    warnings
  };
}
