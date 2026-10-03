import fs from 'fs/promises';
import path from 'path';

export default {
  name: 'read_site_file',
  description: 'Reads the contents of a specific file from a recovered website workspace.',
  parameters: {
    type: 'object',
    properties: {
      siteId: { type: 'string', description: 'The unique ID of the site.' },
      filePath: { type: 'string', description: 'The relative path of the file to read.' }
    },
    required: ['siteId', 'filePath']
  },
  execute: async ({ siteId, filePath }) => {
    try {
      if (!/^[a-zA-Z0-9_-]+$/.test(siteId)) throw new Error('Invalid siteId format');
      if (path.isAbsolute(filePath)) throw new Error('Absolute paths are not allowed');
      
      const siteDir = path.resolve(process.cwd(), '../workspace/sites', siteId);
      const targetPath = path.resolve(siteDir, filePath);
      
      if (!targetPath.startsWith(siteDir)) throw new Error('Path traversal detected');
      
      const stat = await fs.stat(targetPath);
      if (stat.size > 1024 * 1024) throw new Error('File is too large to read (max 1MB)');

      const content = await fs.readFile(targetPath, 'utf8');
      return { success: true, content };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
