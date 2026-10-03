import { Router } from 'express';
import healthRoutes from './health.routes.js';
import extractionRoutes from './extraction.routes.js';

const router = Router();

// Mount routes
router.use('/', healthRoutes);
router.use('/', extractionRoutes);

export default router;

