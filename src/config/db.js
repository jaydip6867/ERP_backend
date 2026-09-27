import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { env } from './env.js';

let isConnected = false;

// Default mongoose configuration options
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 20,
  minPoolSize: 5,
  autoIndex: env.isDevelopment, // Build indexes in development; recommended false in massive high-traffic production
};

/**
 * Connect to MongoDB with environment-based URI and resilient event handling.
 */
export const connectDatabase = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    logger.info('MongoDB is already connected.');
    return;
  }

  // Setup connection event listeners
  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info(`✅ MongoDB connection established: ${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    logger.error('❌ MongoDB connection error:', { error: err.message, stack: err.stack });
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('⚠️ MongoDB connection disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    logger.info('🔄 MongoDB connection re-established.');
  });

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, mongooseOptions);
    isConnected = conn.connection.readyState === 1;
    logger.info(`📦 MongoDB connected host: ${conn.connection.host}, database: ${conn.connection.name}`);
  } catch (error) {
    isConnected = false;
    logger.warn(
      `MongoDB connection initialization notice: ${error.message}. Running with offline/degraded database state.`
    );
  }
};

/**
 * Gracefully close database connection during server shutdown.
 */
export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close(false);
      isConnected = false;
      logger.info('MongoDB connection cleanly closed through graceful shutdown.');
    } catch (err) {
      logger.error('Error during MongoDB disconnect:', { error: err.message });
    }
  }
};

/**
 * Returns human-readable state of MongoDB connection.
 */
export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Performs database ping/heartbeat command to verify active connection.
 */
export const pingDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    return { ok: false, message: 'Database not connected' };
  }
  try {
    await mongoose.connection.db.admin().ping();
    return { ok: true, message: 'Database reachable' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
};
