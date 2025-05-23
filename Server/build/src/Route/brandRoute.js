"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _brandController = require("../Controller/brandController.js");
var _authMiddleware = require("../Middleware/authMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Public routes
router.get("/", _brandController.getAllBrands);
router.get("/search", _brandController.searchBrands);
router.get("/:id", _brandController.getBrandById);

// Admin & Manager only routes
router.post("/", _authMiddleware.verifyToken, _authMiddleware.isAdmin, _brandController.createBrand);
router.put("/:id", _authMiddleware.verifyToken, _authMiddleware.isAdmin, _brandController.updateBrand);
router["delete"]("/:id", _authMiddleware.verifyToken, _authMiddleware.isAdmin, _brandController.deleteBrand);
var _default = exports["default"] = router;