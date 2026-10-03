import express from 'express';
import { ingest } from '../controllers/siteController.js';

const router = express.Router();

router.post('/ingest', ingest);

export default router;
