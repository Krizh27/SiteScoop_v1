import { readFileSchema } from '../schemas/tool.schemas.js';
import { readFileContent } from '../../services/workspace/file-reader.service.js';
import { AgentError, AgentErrors } from '../agent-errors.js';

export const readFileTool = {
  name: 'read_file',
  description: 'Read a text file from the recovered project. Use this when you need to inspect source code or configuration. Only relative project paths are allowed. Binary files return metadata instead of content.',
  inputSchema: readFileSchema,
  execute: async (context, input) => {
    try {
      const result = await readFileContent(context.workspaceRoot, context.projectId, input.path);
      
      if (result.binary) {
        return {
          path: result.path,
          binary: true,
          size: result.size,
          content: null
        };
      }
      
      return {
        path: result.path,
        content: result.content,
        size: result.size
      };
    } catch (error) {
      if (error.message === 'FILE_TOO_LARGE') {
        throw new AgentError(AgentErrors.FILE_TOO_LARGE, 'File exceeds maximum readable size.');
      }
      if (error.message === 'Not a file') {
         throw new AgentError(AgentErrors.INVALID_INPUT, 'Target is a directory, not a file.');
      }
      if (error.message === 'Path traversal detected') {
         throw new AgentError(AgentErrors.PATH_NOT_ALLOWED, 'Path traversal detected');
      }
      throw new AgentError(AgentErrors.FILE_NOT_FOUND, 'File not found or unreadable.');
    }
  }
};
