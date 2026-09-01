import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { ok, fail } from '../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

import fs from 'fs';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  },
});

const router = express.Router();

router.post('/', authlessUpload, (req, res) => {
  if (!req.file) return fail(res, 400, 'No file uploaded');
  return ok(res, { path: `/uploads/${req.file.filename}`, url: `/uploads/${req.file.filename}` });
});

function authlessUpload(req, res, next) {
  upload.array('photos', 5)(req, res, (err) => {
    if (err) return fail(res, 400, err.message);
    next();
  });
}

export default router;
