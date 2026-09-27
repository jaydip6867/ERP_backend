import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend directory or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  PROJECT_NAME: process.env.PROJECT_NAME || 'Danza ERP',
  API_VERSION: process.env.API_VERSION || 'v1',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/danza_erp',
  
  // JWT & Session Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'danza_erp_default_dev_secret_key_12345',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh` : 'danza_erp_refresh_secret_key_67890'),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Security parameters
  MAX_FAILED_LOGIN_ATTEMPTS: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5', 10),
  LOCK_TIME_MINUTES: parseInt(process.env.LOCK_TIME_MINUTES || '30', 10),
  PASSWORD_RESET_EXPIRES_MINUTES: parseInt(process.env.PASSWORD_RESET_EXPIRES_MINUTES || '60', 10),

  // Frontend and CORS
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};
