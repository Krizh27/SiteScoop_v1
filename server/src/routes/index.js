import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// Mount health routes under root router
router.use('/', healthRoutes);

export default router;
