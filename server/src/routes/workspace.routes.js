import express from 'express';
import { getProjects, getProject, getTree, getFile, getAsset, searchProject, getReport } from '../controllers/workspace.controller.js';

const router = express.Router();

router.get('/projects', getProjects);
router.get('/projects/:projectId', getProject);
router.get('/projects/:projectId/tree', getTree);
router.get('/projects/:projectId/file', getFile);
router.get('/projects/:projectId/asset', getAsset);
router.get('/projects/:projectId/search', searchProject);
router.get('/projects/:projectId/report', getReport);

export default router;
