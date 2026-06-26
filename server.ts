import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import rateLimit from 'express-rate-limit';
import { downloadMediaController, proxyDownloadController } from './server/downloadController';

// Fallback handlers to prevent asynchronous connection failures (e.g. EPIPE) from crashing the server
process.on('uncaughtException', (err: any) => {
  console.error('[Global Uncaught Exception]:', err.message || err, err.stack);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('[Global Unhandled Rejection]: at:', promise, 'reason:', reason?.message || reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust reverse proxy for correct IP identification
  app.set('trust proxy', 1);

  // Middleware for body parsing
  app.use(express.json());

  // Rate Limiting (حماية من الهجمات)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per 15 minutes
    message: {
      error: 'Too many requests, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false } // Disable warnings about x-forwarded-for validation
  });

  app.use('/api/', limiter);

  // API router
  app.post('/api/download', downloadMediaController);
  app.get('/api/proxy-download', proxyDownloadController);

  // Health check endpoint with extra details
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in DEVELOPMENT mode with Vite dev middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running in PRODUCTION mode with static file server...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Fallback for SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to 0.0.0.0 and port 3000 for Cloud Run / external routing
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running successfully on http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📥 Download API: POST http://localhost:${PORT}/api/download`);
    console.log(`🔄 Proxy API: GET http://localhost:${PORT}/api/proxy-download?url=...`);
  });
}

startServer().catch((error) => {
  console.error('Fatal server startup error:', error);
});
