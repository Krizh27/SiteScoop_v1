import { Router } from 'express';
import { getAIStatus, testPrompt } from '../controllers/ai.controller.js';

const router = Router();

router.get('/status', getAIStatus);
router.post('/test', testPrompt);

export default router;
