import * as cheerio from 'cheerio';
import { URL } from 'url';

/**
 * Safely resolve a candidate URL against the document base URL.
 * Filters out invalid protocols such as data:, javascript:, mailto:, blob:, #.
 *
 * @param {string} rawUrl - The raw extracted URL string
 * @param {string} baseUrl - The base URL of the document
 * @returns {string|null} - The resolved absolute URL or null if invalid/unsupported
 */
export function resolveResourceUrl(rawUrl, baseUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  // Ignore data URLs, javascript:, mailto:, tel:, blob:
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('data:') ||
    lower.startsWith('javascript:') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('blob:')
  ) {
    return null;
  }

  try {
    const resolved = new URL(trimmed, baseUrl);
    // Only accept http and https
    if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
      return resolved.href;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse an HTML srcset attribute and extract all candidate URLs.
 * e.g. "image-320w.jpg 320w, image-480w.jpg 480w"
 */
function parseSrcset(srcsetStr, baseUrl) {
  if (!srcsetStr || typeof srcsetStr !== 'string') return [];
  const results = [];
  const parts = srcsetStr.split(',');

  for (const part of parts) {
    const candidate = part.trim().split(/\s+/)[0];
    if (candidate) {
      const resolved = resolveResourceUrl(candidate, baseUrl);
      if (resolved) results.push(resolved);
    }
  }

  return results;
}

/**
 * Parse HTML content using Cheerio and extract all structured resource references.
 *
 * @param {string} html - Raw HTML string
 * @param {string} pageUrl - The URL of the page (after redirects)
 * @returns {object} Extracted page metadata and categorized resources
 */
export function extractResourcesFromHtml(html, pageUrl) {
  const $ = cheerio.load(html || '');

  // Determine base URL: check if <base href="..."> is specified
  let effectiveBaseUrl = pageUrl;
  const baseTagHref = $('base[href]').first().attr('href');
  if (baseTagHref) {
    try {
      effectiveBaseUrl = new URL(baseTagHref, pageUrl).href;
    } catch {
      effectiveBaseUrl = pageUrl;
    }
  }

  // A. Page Information
  const title = $('title').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('meta[name="twitter:title"]').attr('content')?.trim() ||
    '';

  const description = $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    $('meta[name="twitter:description"]').attr('content')?.trim() ||
    '';

  const rawCanonical = $('link[rel="canonical"]').attr('href');
  const canonical = rawCanonical ? resolveResourceUrl(rawCanonical, effectiveBaseUrl) || pageUrl : pageUrl;

  const language = $('html').attr('lang')?.trim() || 'en';
  const viewport = $('meta[name="viewport"]').attr('content')?.trim() || '';

  // Favicon
  let favicon = null;
  const faviconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]'
  ];
  for (const sel of faviconSelectors) {
    const iconHref = $(sel).first().attr('href');
    if (iconHref) {
      const resolved = resolveResourceUrl(iconHref, effectiveBaseUrl);
      if (resolved) {
        favicon = resolved;
        break;
      }
    }
  }

  // Collections with Set for deduplication
  const stylesheetsSet = new Set();
  const scriptsSet = new Set();
  const imagesSet = new Set();
  const fontsSet = new Set();
  const linksSet = new Set();

  // B. Stylesheets: link[rel="stylesheet"]
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href');
    const resolved = resolveResourceUrl(href, effectiveBaseUrl);
    if (resolved) stylesheetsSet.add(resolved);
  });

  // Also capture <style> @import references if simple
  $('style').each((_, el) => {
    const content = $(el).text();
    const importRegex = /@import\s+(?:url\(['"]?([^'")]+)['"]?\)|['"]([^'"]+)['"])/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importUrl = match[1] || match[2];
      const resolved = resolveResourceUrl(importUrl, effectiveBaseUrl);
      if (resolved) stylesheetsSet.add(resolved);
    }
  });

  // C. JavaScript: script[src]
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    const resolved = resolveResourceUrl(src, effectiveBaseUrl);
    if (resolved) scriptsSet.add(resolved);
  });

  // D. Images: img[src], img[srcset], picture source[srcset]
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const resolved = resolveResourceUrl(src, effectiveBaseUrl);
    if (resolved) imagesSet.add(resolved);

    const srcset = $(el).attr('srcset');
    if (srcset) {
      for (const u of parseSrcset(srcset, effectiveBaseUrl)) {
        imagesSet.add(u);
      }
    }
  });

  $('picture source').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (srcset) {
      for (const u of parseSrcset(srcset, effectiveBaseUrl)) {
        imagesSet.add(u);
      }
    }
  });

  // Image meta tags (og:image)
  $('meta[property="og:image"]').each((_, el) => {
    const content = $(el).attr('content');
    const resolved = resolveResourceUrl(content, effectiveBaseUrl);
    if (resolved) imagesSet.add(resolved);
  });

  // E. Fonts: <link rel="preload" as="font"> or links to font files
  $('link[rel="preload"][as="font"]').each((_, el) => {
    const href = $(el).attr('href');
    const resolved = resolveResourceUrl(href, effectiveBaseUrl);
    if (resolved) fontsSet.add(resolved);
  });

  // Discover other font file links (.woff, .woff2, .ttf, .otf, .eot)
  $('link[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (/\.(woff2?|ttf|otf|eot)(\?.*)?$/i.test(href)) {
      const resolved = resolveResourceUrl(href, effectiveBaseUrl);
      if (resolved) fontsSet.add(resolved);
    }
  });

  // F. Icons and Web Manifest
  if (favicon) {
    imagesSet.add(favicon);
  }
  $('link[rel~="icon"], link[rel="apple-touch-icon"]').each((_, el) => {
    const href = $(el).attr('href');
    const resolved = resolveResourceUrl(href, effectiveBaseUrl);
    if (resolved) imagesSet.add(resolved);
  });

  $('link[rel="manifest"]').each((_, el) => {
    const href = $(el).attr('href');
    const resolved = resolveResourceUrl(href, effectiveBaseUrl);
    if (resolved) linksSet.add(resolved);
  });

  // G. Document Links (Top-level navigation links - not crawled recursively)
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const resolved = resolveResourceUrl(href, effectiveBaseUrl);
    if (resolved && resolved !== pageUrl) {
      // Keep up to 30 relevant unique navigation links
      if (linksSet.size < 30) {
        linksSet.add(resolved);
      }
    }
  });

  return {
    page: {
      title: title || 'Untitled Page',
      description: description || '',
      canonical: canonical || pageUrl,
      language: language || 'en',
      viewport: viewport || '',
      favicon: favicon || ''
    },
    resources: {
      stylesheets: Array.from(stylesheetsSet),
      scripts: Array.from(scriptsSet),
      images: Array.from(imagesSet),
      fonts: Array.from(fontsSet),
      links: Array.from(linksSet)
    }
  };
}
