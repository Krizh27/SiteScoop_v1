import { Router } from 'express';
import { analyzeProject, editProject } from '../controllers/ai.controller.js';

const router = Router();

// POST /api/ai/analyze
router.post('/ai/analyze', analyzeProject);

// POST /api/ai/edit
router.post('/ai/edit', editProject);

export default router;

