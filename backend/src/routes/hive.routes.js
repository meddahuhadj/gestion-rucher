import express from 'express';
import { list, get, create, update, remove } from '../controllers/hive.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.get('/', list);
router.get('/:id', get);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
