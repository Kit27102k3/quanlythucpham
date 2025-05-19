"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _adminController = require("../Controller/adminController.js");
var _authMiddleware = require("../Middleware/authMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Public routes
router.post("/login", _adminController.adminLogin);

// Admin management routes
router.post("/admin/create", _adminController.createAdmin);
router.get("/admin/list", _adminController.getAllAdmins);
router.put("/admin/:id", _adminController.updateAdmin);
router["delete"]("/admin/:id", _adminController.deleteAdmin);
router.get("/admin/:id", _adminController.getAdminById);

// Route để cập nhật quyền cho tất cả admin/manager/employee thuộc một vai trò nhất định (Chỉ Admin)
router.put("/roles/:roleKey/permissions", _authMiddleware.verifyToken, _authMiddleware.isAdmin, _adminController.updateRolePermissions);
var _default = exports["default"] = router;