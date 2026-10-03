import express from 'express';
import { runAgent, analyzeSite, fixSite } from '../controllers/agentController.js';

const router = express.Router();

router.post('/run', runAgent);
router.post('/analyze', analyzeSite);
router.post('/fix', fixSite);

export default router;
