import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

let server;

/**
 * Graceful shutdown handler.
 * Closes the HTTP server first to reject new traffic,
 * then cleanly terminates database connections.
 *
 * @param {string} signal - The terminating event/signal
 */
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown sequence...`);

  // Force exit safety timeout (10 seconds)
  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s. Forcing process exit.');
    process.exit(1);
  }, 10000);

  try {
    if (server) {
      await new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            logger.error('Error closing HTTP server:', { error: err.message });
          } else {
            logger.info('HTTP server closed. No longer accepting connections.');
          }
          resolve();
        });
      });
    }

    // Disconnect Mongoose
    await disconnectDatabase();

    clearTimeout(forceExitTimer);
    logger.info('Graceful shutdown completed successfully. Process exiting.');
    process.exit(0);
  } catch (err) {
    clearTimeout(forceExitTimer);
    logger.error('Error encountered during graceful shutdown:', { error: err.message });
    process.exit(1);
  }
};

/**
 * Bootstrap and start the application server.
 */
const startServer = async () => {
  // Connect to MongoDB with environment-based URI
  await connectDatabase();

  // Start HTTP listener
  server = app.listen(env.PORT, () => {
    logger.info(`=========================================`);
    logger.info(`🚀 ${env.PROJECT_NAME} Server Running`);
    logger.info(`🌐 Environment : ${env.NODE_ENV}`);
    logger.info(`📍 Port        : ${env.PORT}`);
    logger.info(`🩺 Health Check: http://localhost:${env.PORT}/api/v1/health`);
    logger.info(`=========================================`);
  });

  // Process-level termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Global unhandled error traps
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection at:', { promise, reason });
    gracefulShutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception caught:', { error: err.message, stack: err.stack });
    gracefulShutdown('uncaughtException');
  });
};

startServer().catch((error) => {
  logger.error('Fatal startup error:', error);
  process.exit(1);
});
