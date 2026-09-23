import './src/config/env.js';
import { startDocumentWorker } from './src/workers/documentWorker.js';
import { prisma } from './src/config/prisma.js';
import { redis, bullConnection } from './src/config/redis.js';
import { logger } from './src/utils/logger.js';

const documentWorker = startDocumentWorker();

async function shutdown(signal) {
  logger.info(`${signal} received — closing worker...`);
  try {
    await documentWorker.close();
    await Promise.allSettled([redis.quit(), bullConnection.quit(), prisma.$disconnect()]);
    logger.info('Worker shutdown complete.');
    process.exit(0);
  } catch (err) {
    logger.error('Error during worker shutdown:', err.message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});
