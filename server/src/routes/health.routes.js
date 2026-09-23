import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';

export const healthRouter = Router();

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

/**
 * Public readiness probe: verifies Postgres and Redis connectivity.
 * Returns 503 when a dependency is down so platforms can restart/route traffic.
 */
healthRouter.get('/health', async (_req, res) => {
  const [db, cache] = await Promise.allSettled([
    withTimeout(prisma.$queryRaw`SELECT 1`, 3000),
    withTimeout(redis.ping(), 3000),
  ]);

  const dbOk = db.status === 'fulfilled';
  const redisOk = cache.status === 'fulfilled';
  const healthy = dbOk && redisOk;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    dependencies: { postgres: dbOk, redis: redisOk },
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});
