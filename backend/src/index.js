import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = env.PUBLIC_URL ? [env.PUBLIC_URL, 'http://localhost:5173'] : true;
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Rucher API is running' });
});

app.use('/api', routes);

// Serve the built React frontend (single-service deployment)
const publicDir = path.join(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA fallback: send index.html for any non-API route
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else if (env.NODE_ENV === 'production') {
  console.warn('⚠️  frontend build not found at backend/public — run the build step first');
}

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`✅ Rucher backend running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});