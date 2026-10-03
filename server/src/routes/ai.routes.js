import { Router } from 'express';
import { analyzeProject } from '../controllers/ai.controller.js';

const router = Router();

// POST /api/ai/analyze
router.post('/ai/analyze', analyzeProject);

export default router;
