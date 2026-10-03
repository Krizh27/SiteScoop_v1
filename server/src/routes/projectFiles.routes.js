import { Router } from 'express';
import {
  getProjectFiles,
  getFileContent,
  saveFileContent,
  getProjectPreview
} from '../controllers/projectFiles.controller.js';

const router = Router();

// GET /api/projects/:projectId/files
router.get('/projects/:projectId/files', getProjectFiles);

// GET /api/projects/:projectId/file?path=...
router.get('/projects/:projectId/file', getFileContent);

// POST /api/projects/:projectId/file
router.post('/projects/:projectId/file', saveFileContent);

// GET /api/projects/:projectId/preview
router.get('/projects/:projectId/preview', getProjectPreview);

export default router;

