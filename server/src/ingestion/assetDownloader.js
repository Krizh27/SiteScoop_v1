import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const downloadAssets = async (assets, siteDir) => {
  const MAX_ASSETS = parseInt(process.env.MAX_ASSETS || '50', 10);
  const MAX_ASSET_SIZE = parseInt(process.env.MAX_ASSET_SIZE_MB || '5', 10) * 1024 * 1024;
  const TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '10000', 10);
  
  const toDownload = assets.slice(0, MAX_ASSETS);
  const results = [];

  for (const asset of toDownload) {
    const result = { ...asset, status: 'pending' };
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(asset.url, { signal: controller.signal, redirect: 'follow' });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > MAX_ASSET_SIZE) {
         throw new Error('File too large');
      }
      
      let folder = 'other';
      if (asset.type === 'stylesheet') folder = 'css';
      else if (asset.type === 'script') folder = 'js';
      else if (asset.type === 'image') folder = 'images';
      
      const ext = path.extname(new URL(asset.url).pathname) || '';
      const filename = `${crypto.randomBytes(8).toString('hex')}${ext}`;
      const localPath = path.join('assets', folder, filename);
      
      await fs.writeFile(path.join(siteDir, localPath), Buffer.from(buffer));
      
      result.status = 'downloaded';
      result.localPath = localPath;
      result.contentType = res.headers.get('content-type') || '';
      result.size = buffer.byteLength;

    } catch (e) {
      result.status = 'failed';
      result.error = e.message;
    }
    results.push(result);
  }
  
  return results;
};
