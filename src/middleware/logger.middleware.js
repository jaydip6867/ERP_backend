import morgan from 'morgan';
import { env } from '../config/env.js';

// Custom token for correlation ID
morgan.token('id', (req) => req.id || req.requestId || '-');

// Formats with correlation ID included
const format = env.isDevelopment
  ? ':method :url :status :res[content-length] - :response-time ms [req-id: :id]'
  : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" [req-id: :id]';

export const requestLogger = morgan(format, {
  skip: (req) => req.url === '/favicon.ico',
});
