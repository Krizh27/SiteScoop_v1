import fs from 'fs/promises';
import path from 'path';

export default {
  name: 'write_site_file',
  description: 'Write or overwrite a file in the recovered website workspace. Use this to apply fixes to HTML, CSS, or JS files. Do not create new files outside of the workspace directory.',
  parameters: {
    type: 'object',
    properties: {
      siteId: {
        type: 'string',
        description: 'The unique ID of the site workspace (e.g. site_12345_abc)'
      },
      filePath: {
        type: 'string',
        description: 'The relative path of the file to write (e.g. index.html, assets/css/style.css)'
      },
      content: {
        type: 'string',
        description: 'The complete new content to write to the file'
      }
    },
    required: ['siteId', 'filePath', 'content']
  },
  execute: async (args) => {
    try {
      const { siteId, filePath, content } = args;
      
      // Basic security validation
      if (filePath.includes('..') || filePath.startsWith('/')) {
        return { error: 'Path traversal is not allowed.' };
      }
      
      // Construct the absolute path to the workspace directory
      const workspaceDir = path.resolve(process.cwd(), 'workspace', 'sites', siteId);
      
      // Validate workspace exists
      try {
        await fs.access(workspaceDir);
      } catch {
        return { error: `Site workspace not found: ${siteId}` };
      }

      const absoluteFilePath = path.resolve(workspaceDir, filePath);
      
      // Ensure the resolved path is actually inside the workspace directory
      if (!absoluteFilePath.startsWith(workspaceDir)) {
        return { error: 'Access denied: Path is outside the workspace.' };
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(absoluteFilePath), { recursive: true });
      await fs.writeFile(absoluteFilePath, content, 'utf8');

      return {
        success: true,
        message: `Successfully wrote ${content.length} bytes to ${filePath}`
      };
    } catch (error) {
      return { error: `Failed to write file: ${error.message}` };
    }
  }
};
