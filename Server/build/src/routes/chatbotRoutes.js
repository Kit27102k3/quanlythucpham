"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.chatbotRoutes = void 0;
var _express = _interopRequireDefault(require("express"));
var _chatbotController = require("../Controller/chatbotController.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Route cho chatbot
router.post('/', _chatbotController.handleMessage);

// Route cho webhook từ Rasa
router.post('/webhook', _chatbotController.handleRasaWebhook);
var chatbotRoutes = exports.chatbotRoutes = router;