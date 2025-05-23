"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _cartController = require("../Controller/cartController.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();
router.post("/add-to-cart", _cartController.addToCart);
router["delete"]("/remove-from-cart", _cartController.removeFromCart);
router.get("/:userId", _cartController.getCart);
router.put("/update-cart-item", _cartController.updateCartItem);
router["delete"]("/clear-cart", _cartController.clearCart);
var _default = exports["default"] = router;