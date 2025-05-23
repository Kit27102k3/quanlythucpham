"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _supplierController = require("../Controller/supplierController.js");
var _authMiddleware = require("../Middleware/authMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Tất cả routes đều được bảo vệ, chỉ admin mới có quyền truy cập
router.use(_authMiddleware.verifyToken);

// GET /api/suppliers - Lấy tất cả nhà cung cấp
router.route('/').get(_authMiddleware.isAdmin, _supplierController.getAllSuppliers).post(_authMiddleware.isAdmin, _supplierController.createSupplier);

// GET /api/suppliers/search - Tìm kiếm nhà cung cấp
router.route('/search').get(_authMiddleware.isAdmin, _supplierController.searchSuppliers);

// GET, PUT, DELETE /api/suppliers/:id - Lấy, cập nhật, xóa nhà cung cấp theo ID
router.route('/:id').get(_authMiddleware.isAdmin, _supplierController.getSupplierById).put(_authMiddleware.isAdmin, _supplierController.updateSupplier)["delete"](_authMiddleware.isAdmin, _supplierController.deleteSupplier);
var _default = exports["default"] = router;