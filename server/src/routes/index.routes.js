import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { uploadRouter } from './upload.routes.js';
import { documentRouter } from './document.routes.js';
import { chatRouter } from './chat.routes.js';
import { protectRoute } from '../middleware/auth.middleware.js';

export const apiRouter = Router();

apiRouter.use('/', healthRouter);

// Lets the client verify its Clerk token wiring end-to-end.
apiRouter.get('/me', protectRoute, (req, res) => {
  res.json({ userId: req.userId });
});

apiRouter.use('/upload', uploadRouter);
apiRouter.use('/documents', documentRouter);
apiRouter.use('/chat', chatRouter);
