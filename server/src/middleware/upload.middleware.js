import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const upload = multer({
  // Keep the file in memory; it is streamed straight to Supabase Storage,
  // so nothing is ever written to the server's local disk.
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new ApiError(400, 'Only PDF files are allowed.'));
      return;
    }
    cb(null, true);
  },
});

const uploadSingle = upload.single('file');

export const logUploadRequest = (req, _res, next) => {
  logger.info('Upload request received', {
    method: req.method,
    path: req.originalUrl,
    contentType: req.get('content-type'),
    contentLength: req.get('content-length'),
    hasAuthorization: Boolean(req.get('authorization')),
  });
  next();
};

export const uploadPdfFile = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  uploadSingle(req, res, (err) => {
    logger.info('Timing', {
      label: 'upload.multer.parse',
      durationMs: Number((Number(process.hrtime.bigint() - startedAt) / 1_000_000).toFixed(2)),
      requestId: req.headers['x-request-id'],
    });
    if (err) {
      logger.error('Upload multipart parsing failed', {
        code: err.code,
        message: err.message,
        field: err.field,
      });
      next(err);
      return;
    }

    logger.info('Upload multipart parsing completed', {
      hasFile: Boolean(req.file),
      field: req.file?.fieldname,
      name: req.file?.originalname,
      size: req.file?.size,
      mimetype: req.file?.mimetype,
    });
    next();
  });
};
