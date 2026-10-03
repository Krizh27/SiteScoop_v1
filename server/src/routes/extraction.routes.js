import { Router } from 'express';
import { extractUrl } from '../controllers/extraction.controller.js';

const router = Router();

// POST /api/extract
router.post('/extract', extractUrl);

export default router;
