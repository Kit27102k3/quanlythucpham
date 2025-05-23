"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var cartSchema = _mongoose["default"].Schema({
  userId: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: [{
    productId: {
      type: _mongoose["default"].Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      "default": 1
    },
    price: {
      type: Number,
      required: true,
      "default": 0
    },
    createdAt: {
      type: Date,
      "default": Date.now()
    }
  }]
});
var Cart = _mongoose["default"].model("Cart", cartSchema);
var _default = exports["default"] = Cart;