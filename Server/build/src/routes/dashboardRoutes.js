"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _dashboardController = require("../Controller/dashboardController.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// import { verifyToken } from "../Middleware/authMiddleware.js";

var router = _express["default"].Router();
router.get("/stats", _dashboardController.getDashboardStats);
var _default = exports["default"] = router;