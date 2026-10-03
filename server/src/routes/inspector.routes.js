import { Router } from 'express';
import { runInspection, getInspectionReport } from '../controllers/inspector.controller.js';

const router = Router();

router.post('/run', runInspection);
router.get('/projects/:projectId/report', getInspectionReport);

export default router;
