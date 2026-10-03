import fs from 'fs/promises';
import path from 'path';
import { resolveWorkspacePath } from '../../utils/workspace-path.js';

const buildTree = async (currentPath, rootPath) => {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  
  const nodes = [];
  
  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    // Convert OS specific separators to forward slashes for the frontend
    const relativePath = path.relative(rootPath, fullPath).split(path.sep).join('/');
    
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        type: 'directory',
        path: relativePath,
        children: await buildTree(fullPath, rootPath)
      });
    } else {
      nodes.push({
        name: entry.name,
        type: 'file',
        path: relativePath
      });
    }
  }
  
  // Sort: directories first, then alphabetically
  return nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
};

export const getFileTree = async (workspaceDir, projectId) => {
  const projectRoot = resolveWorkspacePath(workspaceDir, projectId);
  return await buildTree(projectRoot, projectRoot);
};
