import { Router } from 'express';
import { chat } from '../controllers/chat.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';
import { env } from '../config/env.js';

export const chatRouter = Router();

chatRouter.post(
  '/',
  protectRoute,
  rateLimit({ keyPrefix: 'chat', windowSeconds: 60, max: env.rateLimitChatPerMin }),
  chat
);
