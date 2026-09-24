import './src/config/env.js';
import app from './src/app.js';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { redis, bullConnection } from './src/config/redis.js';
import { documentQueue } from './src/queues/documentQueue.js';
import { logger } from './src/utils/logger.js';

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

async function shutdown(signal) {
  logger.info(`${signal} received — shutting down API gracefully...`);
  try {
    await new Promise((resolve) => server.close(resolve));
    await Promise.allSettled([
      documentQueue.close(),
      redis.quit(),
      bullConnection.quit(),
      prisma.$disconnect(),
    ]);
    logger.info('Shutdown complete.');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', err.message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});
