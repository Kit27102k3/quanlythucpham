import express from 'express';
import { uploadImage, upload } from '../Controller/uploadController.js';
import { verifyToken } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Protected upload routes
router.post('/upload/image', verifyToken, upload.single('image'), uploadImage);

export default router; 