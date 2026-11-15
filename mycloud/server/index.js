import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { apiLimiter } from './middleware/rateLimiter.js';
import uploadRoutes from './routes/upload.js';
import fileRoutes from './routes/files.js';
import quotaRoutes from './routes/quota.js';
import { isR2Configured } from './config/r2.js';
import { isSupabaseConfigured } from './config/supabase.js';
import { isCloudinaryConfigured } from './config/cloudinary.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Security & utility middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter for API routes
app.use('/api', apiLimiter);

// Health check & status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MyCloud Backend API',
    timestamp: new Date().toISOString(),
    integrations: {
      supabase: isSupabaseConfigured ? 'connected' : 'placeholder (development mode)',
      cloudflareR2: isR2Configured ? 'connected' : 'placeholder (development mode)',
      cloudinary: isCloudinaryConfigured ? 'connected' : 'pending configuration',
    },
    version: '1.0.0',
  });
});

// Mount modular API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/quota', quotaRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint Not Found', path: req.originalUrl });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 MyCloud Backend Server running on port ${PORT}`);
  console.log(`📦 Cloudflare R2: ${isR2Configured ? 'ACTIVE (Documents & Files)' : 'DEVELOPMENT / MOCK MODE'}`);
  console.log(`☁️ Cloudinary:    ${isCloudinaryConfigured ? 'ACTIVE (Photos, Images & Videos)' : 'PENDING CONFIGURATION (Using R2 fallback)'}`);
  console.log(`⚡ Supabase DB:   ${isSupabaseConfigured ? 'ACTIVE' : 'DEVELOPMENT / MOCK MODE'}`);
  console.log(`===============================================`);
});

export default app;

