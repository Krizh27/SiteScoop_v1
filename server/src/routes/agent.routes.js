import express from 'express';
import {
  getTools,
  runTool,
  getAgentStatus,
  runAgent,
  getChange,
  applyChange,
  revertChange,
  getProjectChanges
} from '../controllers/agent.controller.js';

const router = express.Router();

router.get('/status', getAgentStatus);
router.get('/tools', getTools);
router.post('/tools/execute', runTool);
router.post('/run', runAgent);

// Human approval & Change management routes
router.get('/changes/:changeId', getChange);
router.get('/changes/project/:projectId', getProjectChanges);
router.post('/changes/:changeId/apply', applyChange);
router.post('/changes/:changeId/revert', revertChange);

export default router;

