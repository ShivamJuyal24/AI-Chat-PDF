import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { timed } from '../utils/timed.js';

const INCREMENT_AND_EXPIRE = `
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return count
`;

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
      const count = await timed('rate-limit.redis.incr-expire', () => redis.eval(
        INCREMENT_AND_EXPIRE,
        1,
        key,
        windowSeconds,
      ), {
        requestId: req.headers['x-request-id'],
        keyPrefix,
      });

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
