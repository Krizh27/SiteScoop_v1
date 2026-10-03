import fs from 'fs/promises';
import path from 'path';

const walk = async (dir, baseDir) => {
  let results = [];
  const list = await fs.readdir(dir, { withFileTypes: true });
  for (let file of list) {
    const fullPath = path.resolve(dir, file.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (file.isDirectory()) {
      results = results.concat(await walk(fullPath, baseDir));
    } else {
      results.push(relPath);
    }
  }
  return results;
};

export default {
  name: 'list_site_files',
  description: 'Lists all files in a recovered website workspace.',
  parameters: {
    type: 'object',
    properties: {
      siteId: { type: 'string', description: 'The unique ID of the site.' }
    },
    required: ['siteId']
  },
  execute: async ({ siteId }) => {
    try {
      if (!/^[a-zA-Z0-9_-]+$/.test(siteId)) throw new Error('Invalid siteId format');
      const siteDir = path.resolve(process.cwd(), '../workspace/sites', siteId);
      if (!siteDir.startsWith(path.resolve(process.cwd(), '../workspace/sites'))) throw new Error('Invalid path');
      
      const files = await walk(siteDir, siteDir);
      return { success: true, files };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
