import express from 'express';
import { updateProfile } from '../controllers/user.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.put('/profile', auth, updateProfile);

export default router;
