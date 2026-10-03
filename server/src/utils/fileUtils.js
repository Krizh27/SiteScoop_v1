import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

/**
 * Sanitize a string to be safely used as a filename.
 * Strips path traversal sequences, control characters, and reserved characters.
 */
export function sanitizeFilename(name, fallbackExt = '') {
  if (!name || typeof name !== 'string') {
    return `asset_${crypto.randomBytes(4).toString('hex')}${fallbackExt}`;
  }

  // Remove query parameters or hash fragments
  const cleanName = name.split('?')[0].split('#')[0];

  // Extract base filename without directory path
  let baseName = path.basename(cleanName);

  // Replace dangerous characters with underscores
  baseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Avoid hidden files or relative path segments
  baseName = baseName.replace(/^\.+/, '');

  if (!baseName || baseName.length === 0) {
    return `asset_${crypto.randomBytes(4).toString('hex')}${fallbackExt}`;
  }

  // Truncate to reasonable length while preserving extension
  const ext = path.extname(baseName) || fallbackExt;
  const stem = path.basename(baseName, ext).substring(0, 50);

  return `${stem}${ext}`;
}

/**
 * Determine suitable file extension based on MIME type or URL.
 */
export function getExtensionFromContentType(contentType, urlPath = '') {
  if (urlPath) {
    const cleanUrl = urlPath.split('?')[0].split('#')[0];
    const existingExt = path.extname(cleanUrl).toLowerCase();
    if (existingExt && existingExt.length <= 6 && /^\.[a-z0-9]+$/i.test(existingExt)) {
      return existingExt;
    }
  }

  if (!contentType) return '.bin';

  const mime = contentType.split(';')[0].trim().toLowerCase();
  const mimeMap = {
    'text/html': '.html',
    'text/css': '.css',
    'application/javascript': '.js',
    'text/javascript': '.js',
    'application/x-javascript': '.js',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'image/webp': '.webp',
    'image/x-icon': '.ico',
    'image/vnd.microsoft.icon': '.ico',
    'font/woff': '.woff',
    'font/woff2': '.woff2',
    'application/font-woff': '.woff',
    'application/font-woff2': '.woff2',
    'font/ttf': '.ttf',
    'font/otf': '.otf',
    'application/x-font-ttf': '.ttf',
    'application/vnd.ms-fontobject': '.eot',
    'application/json': '.json',
    'application/manifest+json': '.webmanifest'
  };

  return mimeMap[mime] || '.bin';
}

/**
 * Ensure directory exists safely.
 */
export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Save JSON data to file with pretty formatting.
 */
export async function writeJsonFile(filePath, data) {
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content, 'utf8');
}
