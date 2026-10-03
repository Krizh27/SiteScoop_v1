import fs from 'fs/promises';
import path from 'path';

export default {
  name: 'get_site_manifest',
  description: 'Gets the manifest.json for a recovered website.',
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
      const manifestPath = path.resolve(process.cwd(), '../workspace/sites', siteId, 'manifest.json');
      if (!manifestPath.startsWith(path.resolve(process.cwd(), '../workspace/sites'))) throw new Error('Invalid path');
      
      const content = await fs.readFile(manifestPath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
