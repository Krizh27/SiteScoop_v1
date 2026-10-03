import { getFileMetadataSchema } from '../schemas/tool.schemas.js';
import { resolveWorkspacePath } from '../../utils/workspace-path.js';
import fs from 'fs/promises';
import path from 'path';
import { AgentError, AgentErrors } from '../agent-errors.js';

const getMimeType = (ext) => {
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  return types[ext] || 'application/octet-stream';
};

export const getFileMetadataTool = {
  name: 'get_file_metadata',
  description: 'Retrieve metadata about a specific file (size, extension, mimeType). Use this to check file properties without reading its contents.',
  inputSchema: getFileMetadataSchema,
  execute: async (context, input) => {
    try {
      const filePath = resolveWorkspacePath(context.workspaceRoot, context.projectId, input.path);
      const stat = await fs.stat(filePath);
      
      if (!stat.isFile()) {
        throw new AgentError(AgentErrors.INVALID_INPUT, 'Path is not a file');
      }

      const extension = path.extname(filePath).toLowerCase();
      
      return {
        path: input.path,
        size: stat.size,
        extension,
        mimeType: getMimeType(extension),
        isBinary: !['.html', '.htm', '.css', '.js', '.mjs', '.cjs', '.json', '.md', '.txt', '.svg', '.xml'].includes(extension)
      };
    } catch (error) {
      if (error instanceof AgentError) throw error;
      throw new AgentError(AgentErrors.FILE_NOT_FOUND, 'File not found');
    }
  }
};
