import express from 'express';
import { getTools, runTool } from '../controllers/agent.controller.js';

const router = express.Router();

router.get('/tools', getTools);
router.post('/tools/execute', runTool);

export default router;
