"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var paymentSchema = new _mongoose["default"].Schema({
  userId: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  orderId: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    ref: "Order"
  },
  amount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number
  },
  products: [{
    productId: {
      type: _mongoose["default"].Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  paymentMethod: {
    type: String,
    required: true
  },
  status: {
    type: String,
    "enum": ["pending", "processing", "completed", "failed", "refunded"],
    "default": "pending"
  },
  paidAt: {
    type: Date
  },
  transactionId: {
    type: String
  },
  responseCode: {
    type: String
  },
  responseMessage: {
    type: String
  },
  savedVoucherId: {
    type: _mongoose["default"].Schema.Types.ObjectId,
    ref: "SavedVoucher"
  }
}, {
  timestamps: true
});
var Payment = _mongoose["default"].model("Payment", paymentSchema);
var _default = exports["default"] = Payment;