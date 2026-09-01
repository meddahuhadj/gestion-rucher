import express from 'express';
import { current, create, join, setActive, removeMember, leave, transferOwner } from '../controllers/workspace.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.get('/', current);
router.post('/', create);
router.post('/join', join);
router.put('/active', setActive);
router.post('/:workspaceId/transfer/:userId', transferOwner);
router.delete('/:workspaceId/members/:userId', removeMember);
router.delete('/:workspaceId/leave', leave);

export default router;
