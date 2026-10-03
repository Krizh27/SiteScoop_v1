import { Router } from 'express';
import healthRoutes from './health.routes.js';
import extractionRoutes from './extraction.routes.js';
import aiRoutes from './ai.routes.js';
import projectFilesRoutes from './projectFiles.routes.js';

const router = Router();

// Mount routes
router.use('/', healthRoutes);
router.use('/', extractionRoutes);
router.use('/', aiRoutes);
router.use('/', projectFilesRoutes);

export default router;


