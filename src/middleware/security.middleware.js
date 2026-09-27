import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from '../config/env.js';

// Rate Limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

// CORS options
export const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    const configuredOrigins = (env.CORS_ORIGIN || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    const clientUrls = (env.CLIENT_URL || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    const staticAllowedOrigins = [
      ...configuredOrigins,
      ...clientUrls,
      'https://erp-frontend-theta-fawn.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
    ];

    let hostname = '';
    try {
      hostname = new URL(origin).hostname;
    } catch {
      hostname = origin;
    }

    const isAllowed =
      staticAllowedOrigins.includes(origin) ||
      hostname.endsWith('.vercel.app') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      env.isDevelopment;

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS policy: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-ID', 'Accept'],
};

export const securityMiddleware = [
  helmet(),
  cors(corsOptions),
  apiLimiter,
];
