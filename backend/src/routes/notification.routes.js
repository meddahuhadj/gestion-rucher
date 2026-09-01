import express from 'express';
import { list, markRead, markAllRead, remove } from '../controllers/notification.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.get('/', list);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', remove);

export default router;
