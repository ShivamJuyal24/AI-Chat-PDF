import { Router } from 'express';
import {
  listDocuments,
  getDocument,
  getDocumentMessages,
  deleteDocument,
} from '../controllers/document.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

export const documentRouter = Router();

documentRouter.use(protectRoute);

documentRouter.get('/', listDocuments);
documentRouter.get('/:id', getDocument);
documentRouter.get('/:id/messages', getDocumentMessages);
documentRouter.delete('/:id', deleteDocument);
