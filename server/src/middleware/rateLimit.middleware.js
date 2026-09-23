import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Fixed-window rate limiter backed by Upstash Redis, keyed per Clerk user
 * (falls back to client IP for unauthenticated routes). Fails open if Redis
 * is unavailable — a limiter outage must not take the API down with it.
 */
export const rateLimit = ({ keyPrefix, windowSeconds, max }) => {
  return async (req, res, next) => {
    try {
      const identity = req.auth?.userId ?? req.ip ?? 'anonymous';
      const key = `rl:${keyPrefix}:${identity}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));

      if (count > max) {
        res.setHeader('Retry-After', windowSeconds);
        res.status(429).json({
          error: 'Too many requests. Please slow down and try again shortly.',
        });
        return;
      }
    } catch (err) {
      logger.warn(`Rate limiter unavailable, allowing request: ${err.message}`);
    }

    next();
  };
};
