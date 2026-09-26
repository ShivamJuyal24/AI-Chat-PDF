import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { clerkMiddleware } from './config/clerk.js';
import { apiRouter } from './routes/index.routes.js';
import {
  notFoundHandler,
  errorHandler,
} from './middleware/error.middleware.js';
import { logger } from './utils/logger.js';

const app = express();

app.use(helmet());

// CORS must run before authentication and API routes.
app.use(
  cors({
    origin: env.clientOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);

// Handle preflight requests before Clerk authentication.
app.options(/.*/, cors({
  origin: env.clientOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));

app.use(morgan(env.isProd ? 'tiny' : 'dev'));

const clerkAuthMiddleware = clerkMiddleware({
  publishableKey: env.clerkPublishableKey,
  secretKey: env.clerkSecretKey,
});

app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();

  clerkAuthMiddleware(req, res, (err) => {
    logger.info('Timing', {
      label: 'auth.clerk',
      requestId: req.headers['x-request-id'],
      durationMs: Number(
        (
          Number(process.hrtime.bigint() - startedAt) /
          1_000_000
        ).toFixed(2)
      ),
    });

    next(err);
  });
});

app.use(express.json({ limit: '1mb' }));

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;