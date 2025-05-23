"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _messageController = require("../Controller/messageController.js");
var _authMiddleware = require("../Middleware/authMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Các route cho message API
router.get('/contacts', _authMiddleware.verifyToken, _messageController.getAllContacts);
router.get('/user/:userId', _authMiddleware.verifyToken, _messageController.getMessagesByUserId);
router.post('/send', _authMiddleware.verifyToken, _messageController.sendMessage);
router.patch('/user/:userId/read-all', _authMiddleware.verifyToken, _messageController.markAllAsRead);
router.get('/unread-count', _authMiddleware.verifyToken, _messageController.getUnreadCount);
var _default = exports["default"] = router;