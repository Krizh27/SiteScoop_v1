import axios from 'axios';
import { isAllowedUrl, sanitizeFilename } from './url.service.js';
import path from 'path';

export const downloadAsset = async (urlStr, type) => {
  if (!isAllowedUrl(urlStr)) {
    throw new Error('Disallowed URL for asset download');
  }

  const response = await axios.get(urlStr, {
    responseType: 'arraybuffer',
    timeout: 10000,
    maxContentLength: 10 * 1024 * 1024, // 10MB limit per asset
    validateStatus: status => status >= 200 && status < 300
  });

  const urlObj = new URL(urlStr);
  const pathname = urlObj.pathname;
  let filename = path.basename(pathname);
  if (!filename || filename === '/') {
    filename = `asset-${Date.now()}`;
  }
  
  filename = sanitizeFilename(filename);
  
  let subDir = 'other';
  if (type === 'css') subDir = 'css';
  else if (type === 'javascript') subDir = 'js';
  else if (type === 'image') subDir = 'images';
  else if (type === 'font') subDir = 'fonts';

  // Ensure unique filename if needed, though simple replacement is fine for MVP
  // If multiple assets have the same name, we can append timestamp
  filename = `${Date.now()}-${filename}`;

  const localPath = `assets/${subDir}/${filename}`;

  return {
    content: response.data,
    localPath
  };
};
