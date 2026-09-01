import express from 'express';
import { dashboard, overview } from '../controllers/stats.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.get('/dashboard', dashboard);
router.get('/overview', overview);

export default router;
