import { Router } from 'express';
import { uploadFile } from '../controllers/upload.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { logUploadRequest, uploadPdfFile } from '../middleware/upload.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';
import { env } from '../config/env.js';

export const uploadRouter = Router();

uploadRouter.post(
  '/',
  logUploadRequest,
  protectRoute,
  rateLimit({ keyPrefix: 'upload', windowSeconds: 3600, max: env.rateLimitUploadPerHour }),
  uploadPdfFile,
  uploadFile
);
