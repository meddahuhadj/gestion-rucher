import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import workspaceRoutes from './workspace.routes.js';
import apiaryRoutes from './apiary.routes.js';
import hiveRoutes from './hive.routes.js';
import inspectionRoutes from './inspection.routes.js';
import taskRoutes from './task.routes.js';
import queenRoutes from './queen.routes.js';
import harvestRoutes from './harvest.routes.js';
import expenseRoutes from './expense.routes.js';
import revenueRoutes from './revenue.routes.js';
import notificationRoutes from './notification.routes.js';
import statsRoutes from './stats.routes.js';
import uploadRoutes from './upload.routes.js';
import backupRoutes from './backup.routes.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/upload', auth, uploadRoutes);
router.use('/apiaries', apiaryRoutes);
router.use('/hives', hiveRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/tasks', taskRoutes);
router.use('/queens', queenRoutes);
router.use('/harvests', harvestRoutes);
router.use('/expenses', expenseRoutes);
router.use('/revenues', revenueRoutes);
router.use('/notifications', notificationRoutes);
router.use('/stats', statsRoutes);
router.use('/backup', backupRoutes);

export default router;
