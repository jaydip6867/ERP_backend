import { getDatabaseStatus, pingDatabase } from '../config/db.js';
import { env } from '../config/env.js';

export const getHealthStatus = async () => {
  const uptimeInSeconds = Math.floor(process.uptime());
  const dbStatus = getDatabaseStatus();
  const dbPing = await pingDatabase();

  return {
    projectName: env.PROJECT_NAME,
    apiStatus: 'healthy',
    environment: env.NODE_ENV,
    version: env.API_VERSION,
    database: {
      status: dbStatus,
      reachable: dbPing.ok,
      message: dbPing.message,
    },
    uptime: `${uptimeInSeconds}s`,
    timestamp: new Date().toISOString(),
  };
};
