import express from 'express';
import './models/index.js';
import { correlationMiddleware } from './middleware/correlation.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { notFoundMiddleware } from './middleware/notFound.middleware.js';
import { securityMiddleware } from './middleware/security.middleware.js';
import apiRouter from './routes/index.js';
import { ApiResponse } from './utils/apiResponse.js';

const app = express();

// Request ID and correlation tracking middleware (must run first)
app.use(correlationMiddleware);

// Security headers and rate limiting
app.use(securityMiddleware);

// HTTP Request logging with correlation ID
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize empty strings for ID fields to null to prevent Mongoose CastError on optional foreign keys
const sanitizeEmptyIds = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeEmptyIds(obj[key]);
    } else if (typeof obj[key] === 'string' && obj[key].trim() === '') {
      if (/(^id$|_id$|Id$|_by$)/.test(key)) {
        obj[key] = null;
      }
    }
  }
  return obj;
};

app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeEmptyIds(req.body);
  }
  next();
});

// Static uploads directory
app.use('/uploads', express.static('src/uploads'));

// API Versioning: Mount all v1 routes under /api/v1
app.use('/api/v1', apiRouter);

// Root greeting / fallback
app.get('/', (req, res) => {
  return ApiResponse.success(
    res,
    {
      project: 'Danza ERP Backend API',
      status: 'online',
      docs: '/api/v1/health',
    },
    'Welcome to Danza ERP API Gateway'
  );
});

// Handle 404 routes
app.use(notFoundMiddleware);

// Centralized error handler
app.use(errorMiddleware);

export default app;
