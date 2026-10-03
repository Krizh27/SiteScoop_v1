import {
  listProjectFiles,
  readProjectFile,
  writeProjectFile,
  deleteProjectFile
} from '../services/projectFiles.service.js';
import { getPreviewUrl, setActiveProject } from '../services/previewServer.service.js';

function handleProjectError(error, res, next) {
  const msg = error.message || 'File operation failed';
  if (msg.includes('not found') || msg.includes('does not exist')) {
    return res.status(404).json({ success: false, error: msg });
  }
  if (msg.includes('Access denied') || msg.includes('required') || msg.includes('Invalid')) {
    return res.status(400).json({ success: false, error: msg });
  }
  next(error);
}

/**
 * List files in project.
 * GET /api/projects/:projectId/files
 */
export const getProjectFiles = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const files = await listProjectFiles(projectId);
    res.status(200).json({ success: true, projectId, files });
  } catch (error) {
    handleProjectError(error, res, next);
  }
};

/**
 * Read specific file content.
 * GET /api/projects/:projectId/file?path=...
 */
export const getFileContent = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const filePath = req.query.path || 'index.html';
    const result = await readProjectFile(projectId, filePath);
    res.status(200).json({ success: true, projectId, ...result });
  } catch (error) {
    handleProjectError(error, res, next);
  }
};

/**
 * Write or update file content.
 * POST /api/projects/:projectId/file
 */
export const saveFileContent = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { path: filePath, content } = req.body || {};

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing required field: "path"' });
    }

    const result = await writeProjectFile(projectId, filePath, content ?? '');
    res.status(200).json({ success: true, projectId, ...result });
  } catch (error) {
    handleProjectError(error, res, next);
  }
};

/**
 * Get live preview URL on port 5050.
 * GET /api/projects/:projectId/preview
 */
export const getProjectPreview = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    setActiveProject(projectId);
    const previewUrl = getPreviewUrl(projectId);
    res.status(200).json({ success: true, projectId, previewUrl });
  } catch (error) {
    handleProjectError(error, res, next);
  }
};


