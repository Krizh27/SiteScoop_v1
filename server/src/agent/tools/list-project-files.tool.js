import { listProjectFilesSchema } from '../schemas/tool.schemas.js';
import { getFileTree } from '../../services/workspace/file-tree.service.js';

export const listProjectFilesTool = {
  name: 'list_project_files',
  description: 'List all files and directories in a recovered project. Use this to understand the structure of the project.',
  inputSchema: listProjectFilesSchema,
  execute: async (context, input) => {
    // Reuse Stage 2 functionality
    const tree = await getFileTree(context.workspaceRoot, context.projectId);
    
    // Flatten tree slightly for the model to be easier to read
    const flattenTree = (nodes, currentPath = '') => {
      let files = [];
      for (const node of nodes) {
        if (node.type === 'directory') {
          files.push({ path: node.path, type: 'directory' });
          files = files.concat(flattenTree(node.children, node.path));
        } else {
          files.push({ path: node.path, type: 'file' });
        }
      }
      return files;
    };

    return {
      projectId: context.projectId,
      files: flattenTree(tree)
    };
  }
};
