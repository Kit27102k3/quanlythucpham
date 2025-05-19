"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var paymentSchema = new _mongoose["default"].Schema({
  amount: {
    type: Number,
    required: true
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
    }
  }],
  status: {
    type: String,
    "enum": ["pending", "completed", "failed"],
    "default": "pending"
  },
  paymentMethod: {
    type: String,
    required: true
  },
  transactionId: {
    type: String
  }
}, {
  timestamps: true
});
var Payment = _mongoose["default"].model("Payment", paymentSchema);
var _default = exports["default"] = Payment;