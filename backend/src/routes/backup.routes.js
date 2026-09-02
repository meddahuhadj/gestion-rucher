import express from 'express';
import { exportData, importData } from '../controllers/backup.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.get('/export', exportData);
router.post('/import', importData);

export default router;
