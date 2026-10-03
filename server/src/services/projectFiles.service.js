import path from 'path';
import fs from 'fs/promises';
import { sanitizeFilename, ensureDir } from '../utils/fileUtils.js';

/**
 * Resolve project root and prevent directory traversal.
 */
export async function getProjectRoot(projectId) {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('A valid "projectId" is required.');
  }

  const cleanId = sanitizeFilename(projectId);
  const workspaceRoot = process.env.WORKSPACE_DIR
    ? path.resolve(process.cwd(), process.env.WORKSPACE_DIR)
    : path.resolve(process.cwd(), '../workspace');

  // Check workspace/projects/{cleanId}
  const projectDir = path.join(workspaceRoot, 'projects', cleanId);
  try {
    const stat = await fs.stat(projectDir);
    if (stat.isDirectory()) return projectDir;
  } catch {}

  // Backwards-compatibility with workspace/.staging/{cleanId}
  const stagingDir = path.join(workspaceRoot, '.staging', cleanId);
  try {
    const stat = await fs.stat(stagingDir);
    if (stat.isDirectory()) return stagingDir;
  } catch {}

  throw new Error(`Project "${projectId}" not found in workspace.`);
}

/**
 * Validate that a relative file path stays strictly inside projectRoot.
 */
function resolveSafePath(projectRoot, relativeFilePath) {
  if (!relativeFilePath || typeof relativeFilePath !== 'string') {
    throw new Error('A valid file path is required.');
  }

  // Normalize and resolve path
  const normalizedRelative = path.normalize(relativeFilePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const absoluteTarget = path.resolve(projectRoot, normalizedRelative);

  if (!absoluteTarget.startsWith(projectRoot)) {
    throw new Error(`Access denied: path traversal outside project sandbox is forbidden.`);
  }

  return absoluteTarget;
}

/**
 * Recursively list all files in a project workspace.
 *
 * @param {string} projectId
 * @returns {Promise<Array<{ path: string, sizeBytes: number, isDirectory: boolean }>>}
 */
export async function listProjectFiles(projectId) {
  const projectRoot = await getProjectRoot(projectId);
  const filesList = [];

  async function walk(currentDir, relativePrefix = '') {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.git') || entry.name === 'node_modules') continue;

      const fullPath = path.join(currentDir, entry.name);
      const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await walk(fullPath, relPath);
      } else {
        const stat = await fs.stat(fullPath);
        filesList.push({
          path: relPath,
          sizeBytes: stat.size,
          isDirectory: false
        });
      }
    }
  }

  await walk(projectRoot);
  return filesList;
}

/**
 * Read the content of a file in the project.
 *
 * @param {string} projectId
 * @param {string} relativeFilePath
 * @returns {Promise<{ filePath: string, content: string, sizeBytes: number }>}
 */
export async function readProjectFile(projectId, relativeFilePath) {
  const projectRoot = await getProjectRoot(projectId);
  const safePath = resolveSafePath(projectRoot, relativeFilePath);

  try {
    const stat = await fs.stat(safePath);
    if (stat.isDirectory()) {
      throw new Error(`"${relativeFilePath}" is a directory, not a file.`);
    }

    const content = await fs.readFile(safePath, 'utf8');
    return {
      filePath: relativeFilePath,
      content,
      sizeBytes: stat.size
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`File "${relativeFilePath}" does not exist in project "${projectId}".`);
    }
    throw err;
  }
}

/**
 * Create or overwrite a file in the project.
 *
 * @param {string} projectId
 * @param {string} relativeFilePath
 * @param {string} content
 * @returns {Promise<{ filePath: string, bytesWritten: number, success: boolean }>}
 */
export async function writeProjectFile(projectId, relativeFilePath, content) {
  const projectRoot = await getProjectRoot(projectId);
  const safePath = resolveSafePath(projectRoot, relativeFilePath);

  // Ensure parent directory exists
  await ensureDir(path.dirname(safePath));

  const contentStr = typeof content === 'string' ? content : String(content ?? '');
  await fs.writeFile(safePath, contentStr, 'utf8');
  const stat = await fs.stat(safePath);

  return {
    filePath: relativeFilePath,
    bytesWritten: stat.size,
    success: true
  };
}

/**
 * Delete a file from the project workspace.
 *
 * @param {string} projectId
 * @param {string} relativeFilePath
 * @returns {Promise<{ filePath: string, success: boolean }>}
 */
export async function deleteProjectFile(projectId, relativeFilePath) {
  const projectRoot = await getProjectRoot(projectId);
  const safePath = resolveSafePath(projectRoot, relativeFilePath);

  await fs.unlink(safePath);
  return {
    filePath: relativeFilePath,
    success: true
  };
}
