"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _brandRoute = _interopRequireDefault(require("../Route/brandRoute.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();
router.use("/", _brandRoute["default"]);
var _default = exports["default"] = router;