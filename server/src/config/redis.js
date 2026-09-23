import IORedis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Upstash requires TLS and BullMQ requires these flags over it.
const baseOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

/** General-purpose connection: rate limiting, health checks, caching. */
export const redis = new IORedis(env.redisUrl, baseOptions);

/**
 * Dedicated connection for BullMQ. The worker holds its connection in
 * blocking mode while waiting for jobs, so it must not be shared with
 * regular commands.
 */
export const bullConnection = new IORedis(env.redisUrl, baseOptions);

for (const [name, connection] of [
  ['redis', redis],
  ['bull', bullConnection],
]) {
  connection.on('error', (err) => logger.error(`Redis [${name}] error:`, err.message));
}
