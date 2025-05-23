"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _systemController = require("../Controller/systemController.js");
var _authMiddleware = require("../Middleware/authMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Route lấy thống kê hoạt động hệ thống - yêu cầu xác thực và quyền admin
router.get('/stats', _authMiddleware.verifyToken, _authMiddleware.isAdmin, _systemController.getSystemStats);
var _default = exports["default"] = router;