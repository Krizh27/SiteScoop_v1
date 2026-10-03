import express from 'express';
import { recover } from '../controllers/recovery.controller.js';

const router = express.Router();

router.post('/', recover);

export default router;
