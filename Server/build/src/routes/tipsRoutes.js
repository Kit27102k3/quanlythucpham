"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _tipsController = require("../Controller/tipsController.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Lấy tất cả mẹo hay
router.get("/tips", _tipsController.getAllTips);

// Lấy mẹo hay theo ID
router.get("/tips/:id", _tipsController.getTipById);

// Lấy mẹo hay theo danh mục
router.get("/tips/category/:category", _tipsController.getTipsByCategory);

// Lấy các mẹo nổi bật
router.get("/tips/featured", _tipsController.getFeaturedTips);

// Tạo mẹo hay mới
router.post("/tips", _tipsController.createTip);

// Cập nhật mẹo hay
router.put("/tips/:id", _tipsController.updateTip);

// Xóa mẹo hay
router["delete"]("/tips/:id", _tipsController.deleteTip);

// Tăng likes cho mẹo hay
router.post("/tips/:id/like", _tipsController.likeTip);
var _default = exports["default"] = router;