"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var orderSchema = new _mongoose["default"].Schema({
  userId: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    ref: "User"
  },
  products: [{
    productId: {
      type: _mongoose["default"].Schema.Types.ObjectId,
      ref: "Product"
    },
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  coupon: {
    type: Object,
    "default": null,
    required: false
  },
  status: {
    type: String,
    "default": "pending"
  },
  shippingInfo: {
    address: String,
    phone: String,
    method: String
  },
  paymentMethod: String,
  orderCode: {
    type: String
  },
  notes: {
    type: String
  },
  isPaid: {
    type: Boolean,
    "default": false
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});
var Order = _mongoose["default"].model("Order", orderSchema);
var _default = exports["default"] = Order;