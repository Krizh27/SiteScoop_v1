import express from 'express';
import {
  getTools,
  runTool,
  getAgentStatus,
  runAgent
} from '../controllers/agent.controller.js';

const router = express.Router();

router.get('/status', getAgentStatus);
router.get('/tools', getTools);
router.post('/tools/execute', runTool);
router.post('/run', runAgent);

export default router;
