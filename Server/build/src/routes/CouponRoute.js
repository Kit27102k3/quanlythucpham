"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var CouponController = _interopRequireWildcard(require("../Controller/CouponController.js"));
var _AuthMiddleware = require("../Middleware/AuthMiddleware.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Public routes
router.get("/active", CouponController.getActiveCoupons);
router.post("/validate", CouponController.validateCoupon);

// Protected routes (for applying coupons during checkout)
router.post("/apply", _AuthMiddleware.verifyToken, CouponController.applyCoupon);

// Admin routes for managing coupons would go here
// router.post("/", verifyToken, isAdmin, CouponController.createCoupon);
// router.get("/", verifyToken, isAdmin, CouponController.getAllCoupons);
// etc.
var _default = exports["default"] = router;