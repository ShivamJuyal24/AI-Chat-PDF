import express from 'express';
import {uploadFile} from '../controllers/upload.controller.js';
import {upload} from '../middleware/upload.middleware.js';
import {requireAuth} from '../middleware/auth.middleware.js';
const router = express.Router();

router.post('/',requireAuth, upload.single('file'), uploadFile);

export default router;