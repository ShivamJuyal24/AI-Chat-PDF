import multer from 'multer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express identifies 4-arg functions as error handlers.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err?.status ?? err?.statusCode ?? 500;
  let message = err?.message ?? 'Internal server error';

  if (err instanceof multer.MulterError) {
    status = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File exceeds the ${env.maxFileSizeMb}MB limit.`
        : `Upload error: ${err.message}`;
  }

  const isClientError = status < 500;
  logger.error(`${req.method} ${req.originalUrl} -> ${status}`, {
    message,
    code: err?.code,
    userId: req.auth?.userId,
    stack: !isClientError ? err?.stack : undefined,
  });

  res.status(status).json({
    error: isClientError || !env.isProd ? message : 'Internal server error',
  });
}
