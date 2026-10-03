import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { URL } from 'url';
import { parseHtml } from './htmlParser.js';
import { extractAssets } from './assetExtractor.js';
import { downloadAssets } from './assetDownloader.js';
import { generateManifest } from './manifest.js';

const isSafeUrl = (urlStr) => {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname;
    // basic SSRF blocklist
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return false;
    if (hostname.match(/^10\./) || hostname.match(/^192\.168\./) || hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) return false;
    return true;
  } catch (e) {
    return false;
  }
};

export const ingestSite = async (targetUrl) => {
  if (!isSafeUrl(targetUrl)) {
    throw new Error('Invalid or unsafe URL');
  }

  const siteId = `site_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}_${crypto.randomBytes(4).toString('hex')}`;
  
  const baseWorkspace = path.resolve(process.cwd(), '../workspace/sites');
  const siteDir = path.resolve(baseWorkspace, siteId);
  
  if (!siteDir.startsWith(baseWorkspace)) {
    throw new Error('Invalid workspace path generated');
  }
  
  await fs.mkdir(siteDir, { recursive: true });
  await fs.mkdir(path.join(siteDir, 'assets/css'), { recursive: true });
  await fs.mkdir(path.join(siteDir, 'assets/js'), { recursive: true });
  await fs.mkdir(path.join(siteDir, 'assets/images'), { recursive: true });
  await fs.mkdir(path.join(siteDir, 'assets/other'), { recursive: true });

  const TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '10000', 10);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  let response;
  try {
    response = await fetch(targetUrl, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(timeout);
  } catch (e) {
    clearTimeout(timeout);
    throw new Error(`Failed to fetch URL: ${e.message}`);
  }
  
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    throw new Error(`Expected HTML, received ${contentType}`);
  }

  const html = await response.text();
  const finalUrl = response.url;
  
  await fs.writeFile(path.join(siteDir, 'index.html'), html);
  
  const metadata = parseHtml(html, finalUrl);
  const assets = extractAssets(html, finalUrl);
  
  const downloadedAssets = await downloadAssets(assets, siteDir);
  
  const manifest = generateManifest({
    siteUrl: targetUrl,
    finalUrl: finalUrl,
    metadata,
    htmlSize: Buffer.byteLength(html),
    assets: downloadedAssets
  });
  
  await fs.writeFile(path.join(siteDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  return {
    siteId,
    sourceUrl: targetUrl,
    finalUrl: finalUrl,
    manifest
  };
};
