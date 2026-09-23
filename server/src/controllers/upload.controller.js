import { randomUUID } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { enqueueDocumentJob } from '../queues/documentQueue.js';
import { uploadPdf, deletePdf } from '../services/storage.service.js';
import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const PDF_MAGIC_BYTES = '%PDF-';

export const uploadFile = async (req, res) => {
  logger.info('Upload validation started', {
    userId: req.auth?.userId,
    hasFile: Boolean(req.file),
    name: req.file?.originalname,
    size: req.file?.size,
    mimetype: req.file?.mimetype,
  });

  if (!req.file?.buffer?.length) {
    throw new ApiError(400, 'No file uploaded. Send the PDF as multipart field "file".');
  }

  // Trust content, verify bytes: the declared mimetype can be spoofed.
  if (req.file.buffer.subarray(0, 5).toString('latin1') !== PDF_MAGIC_BYTES) {
    throw new ApiError(400, 'This file is not a valid PDF.');
  }

  const userId = req.auth.userId;
  const documentId = randomUUID();
  const storagePath = `${userId}/${documentId}.pdf`;

  logger.info('Uploading PDF to storage', { documentId, storagePath, bytes: req.file.size });
  await uploadPdf(storagePath, req.file.buffer);
  logger.info('PDF stored successfully', { documentId, storagePath });

  try {
    logger.info('Creating document record', { documentId, userId });
    const document = await prisma.document.create({
      data: {
        id: documentId,
        userId,
        originalName: req.file.originalname || 'document.pdf',
        fileName: `${documentId}.pdf`,
        filePath: storagePath,
        fileSize: req.file.size,
      },
      select: { id: true, status: true, originalName: true, createdAt: true },
    });

    try {
      logger.info('Enqueuing document processing job', { documentId, userId });
      await enqueueDocumentJob({ documentId, userId, storagePath });
      logger.info('Document processing job queued', { documentId });
    } catch (err) {
      logger.error('Failed to enqueue document job', { documentId, message: err.message, stack: err.stack });
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED', errorMessage: 'Upload accepted but processing could not be queued.' },
      });
      throw new ApiError(503, 'Upload accepted but processing could not be queued. Please retry.');
    }

    logger.info('Upload completed', {
      documentId,
      userId,
      originalName: document.originalName,
      bytes: req.file.size,
    });
    res.status(201).json({ ...document, status: 'UPLOADED' });
  } catch (err) {
    // Don't leave an orphaned object in storage behind.
    logger.error('Upload failed after storage upload; deleting stored PDF', {
      documentId,
      storagePath,
      message: err.message,
      stack: err.stack,
    });
    await deletePdf(storagePath).catch(() => {});
    throw err;
  }
};
