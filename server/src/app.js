import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { clerkMiddleware } from './config/clerk.js';
import { apiRouter } from './routes/index.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigins,
    methods: ['GET', 'POST', 'DELETE'],
  })
);
app.use(morgan(env.isProd ? 'tiny' : 'dev'));
app.use(
  clerkMiddleware({
    publishableKey: env.clerkPublishableKey,
    secretKey: env.clerkSecretKey,
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
