import express from 'express';
import { testAI } from '../controllers/aiController.js';

const router = express.Router();

router.post('/test', testAI);

export default router;
