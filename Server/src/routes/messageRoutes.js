import express from 'express';
import {
  getAllContacts,
  getMessagesByUserId,
  sendMessage,
  markAllAsRead,
  getUnreadCount
} from '../Controller/messageController.js';
import { verifyToken } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Các route cho message API
router.get('/contacts', verifyToken, getAllContacts);
router.get('/user/:userId', verifyToken, getMessagesByUserId);
router.post('/send', verifyToken, sendMessage);
router.patch('/user/:userId/read-all', verifyToken, markAllAsRead);
router.get('/unread-count', verifyToken, getUnreadCount);

export default router;