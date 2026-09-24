import { logger } from './logger.js';

export async function timed(label, operation, context = {}) {
  const startedAt = process.hrtime.bigint();

  try {
    return await operation();
  } finally {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info('Timing', {
      label,
      durationMs: Number(durationMs.toFixed(2)),
      ...context,
    });
  }
}