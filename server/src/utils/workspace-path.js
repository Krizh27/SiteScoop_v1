import path from 'path';

export const resolveWorkspacePath = (workspaceDir, projectId, relativeFilePath = '') => {
  // Validate projectId to ensure it doesn't try to navigate out
  if (!projectId || projectId.includes('..') || projectId.includes('/') || projectId.includes('\\')) {
    throw new Error('Invalid project ID');
  }

  const projectRoot = path.resolve(workspaceDir, projectId);

  // Ensure projectRoot is within workspaceDir
  if (!projectRoot.startsWith(path.resolve(workspaceDir))) {
    throw new Error('Project ID escapes workspace');
  }

  if (!relativeFilePath) {
    return projectRoot;
  }

  const normalizedRelativePath = path.normalize(relativeFilePath).replace(/^(\.\.[\/\\])+/, '');
  const finalPath = path.resolve(projectRoot, normalizedRelativePath);

  // Ensure finalPath is within projectRoot
  if (!finalPath.startsWith(projectRoot)) {
    throw new Error('Path traversal detected');
  }

  return finalPath;
};
