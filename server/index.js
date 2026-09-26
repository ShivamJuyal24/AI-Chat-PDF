import './src/config/env.js';
import app from './src/app.js';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { redis, bullConnection } from './src/config/redis.js';
import { documentQueue } from './src/queues/documentQueue.js';
import { startDocumentWorker } from './src/workers/documentWorker.js';
import { logger } from './src/utils/logger.js';

const documentWorker = startDocumentWorker();
const server = app.listen(env.port, () => {
  logger.info(`🚀 API server listening on port ${env.port} (${env.nodeEnv})`);
  logger.info('Runtime service configuration', {
    databaseHost: getHost(env.databaseUrl),
    redisHost: getHost(env.redisUrl),
    supabaseHost: getHost(env.supabaseUrl),
    embeddingModel: env.geminiEmbeddingModel,
    primaryChatModel: env.groqApiKey ? env.groqChatModel : env.geminiChatModel,
    fallbackChatModel: env.groqApiKey ? env.geminiChatModel : null,
  });
});

function getHost(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return 'unknown';
  }
}

server.on('error', (err) => {
  logger.error('Failed to start HTTP server:', err.message);
  process.exit(1);
});

let shutdownPromise;

function shutdown(signal) {
  if (shutdownPromise) return shutdownPromise;

  shutdownPromise = (async () => {
    logger.info(`${signal} received — shutting down API and worker gracefully...`);
    let exitCode = 0;

    try {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('HTTP server closed.');
    } catch (err) {
      exitCode = 1;
      logger.error('Error closing HTTP server:', err.message);
    }

    try {
      await documentWorker.close();
      logger.info('Document worker closed.');
    } catch (err) {
      exitCode = 1;
      logger.error('Error closing document worker:', err.message);
    }

    try {
      await documentQueue.close();
      logger.info('Document queue closed.');
    } catch (err) {
      exitCode = 1;
      logger.error('Error closing document queue:', err.message);
    }

    const closeResults = await Promise.allSettled([
      redis.quit(),
      bullConnection.quit(),
      prisma.$disconnect(),
    ]);
    for (const result of closeResults) {
      if (result.status === 'rejected') {
        exitCode = 1;
        logger.error('Error closing a dependency:', result.reason?.message ?? result.reason);
      }
    }

    logger.info(`Shutdown complete (exit code ${exitCode}).`);
    process.exitCode = exitCode;
  })();

  return shutdownPromise;
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});
