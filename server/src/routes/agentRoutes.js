import express from 'express';
import { runAgent, analyzeSite } from '../controllers/agentController.js';

const router = express.Router();

router.post('/run', runAgent);
router.post('/analyze', analyzeSite);

export default router;
