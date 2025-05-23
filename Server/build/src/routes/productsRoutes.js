"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _productsController = require("../Controller/productsController.js");
var _authMiddleware = require("../Middleware/authMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// server/routes/productsRoutes.js

var router = _express["default"].Router();

// Public routes
router.get("/products", _productsController.getAllProducts);
router.get("/products/search", _productsController.searchProducts);
router.get("/products/best-selling", _productsController.getBestSellingProducts);
router.get("/products/best-sellers", _productsController.getBestSellingProducts);
router.get("/products/category/:category", _productsController.getProductByCategory);
router.get("/products/slug/:slug", _productsController.getProductBySlug);
router.get("/products/:id", _productsController.getProductById);

// Protected routes (require authentication)
router.post("/products", _authMiddleware.verifyToken, _authMiddleware.isAdmin, _productsController.createProduct);
router.put("/products/:id", _authMiddleware.verifyToken, _authMiddleware.isAdmin, _productsController.updateProduct);
router["delete"]("/products/:id", _authMiddleware.verifyToken, _authMiddleware.isAdmin, _productsController.deleteProduct);

// Thêm route kiểm tra và cập nhật hạn sử dụng và giảm giá
router.get("/check-expirations", _authMiddleware.verifyToken, _authMiddleware.isAdmin, _productsController.checkAndUpdateExpirations);
var _default = exports["default"] = router;