import express from 'express';
import rateLimit from 'express-rate-limit';
import { downloadMediaController, proxyDownloadController } from '../server/downloadController';

const app = express();

// Trust reverse proxy for correct IP identification in serverless environment
app.set('trust proxy', 1);

// Middleware for body parsing
app.use(express.json());

// Rate Limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per 15 minutes
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }
});

app.use('/api/', limiter);

// Register API Routes
app.post('/api/download', downloadMediaController);
app.get('/api/proxy-download', proxyDownloadController);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Export the Express app for Vercel's serverless builder
export default app;
