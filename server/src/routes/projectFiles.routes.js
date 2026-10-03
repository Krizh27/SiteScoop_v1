import { Router } from 'express';
import {
  getProjectFiles,
  getFileContent,
  saveFileContent
} from '../controllers/projectFiles.controller.js';

const router = Router();

// GET /api/projects/:projectId/files
router.get('/projects/:projectId/files', getProjectFiles);

// GET /api/projects/:projectId/file?path=...
router.get('/projects/:projectId/file', getFileContent);

// POST /api/projects/:projectId/file
router.post('/projects/:projectId/file', saveFileContent);

export default router;
