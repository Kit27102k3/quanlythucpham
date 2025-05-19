"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _authController = require("../Controller/authController.js");
var _authMiddleware = require("../Middleware/authMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();
router.post("/register", _authController.register);
router.post("/login", _authController.login);
router.post("/logout", _authController.logout);
router.post("/refresh-token", _authController.refreshToken);
router.get("/profile", _authController.getAllUser);
router.get("/profile/:id", _authMiddleware.verifyToken, _authController.getUserProfile);
router.put("/update/:userId", _authMiddleware.verifyToken, _authController.updateUser);
router.post("/request-password-reset", _authController.requestPasswordReset);
router.post("/reset-password", _authController.resetPassword);
router.put("/profile/block/:userId", _authController.blockUser);

// User avatar route
router.get("/users/avatar/:id", _authController.getUserAvatar);

// Thêm các route cho OAuth
router.post("/facebook-login", _authController.facebookLogin);
router.post("/facebook-token", _authController.facebookTokenLogin);
router.post("/google-login", _authController.googleLogin);
router.get("/facebook/callback", _authController.facebookCallback);

// Route để lấy VAPID Public Key
router.get("/vapid-public-key", _authController.getVapidPublicKey);

// Route để đăng ký nhận Push Subscription
router.post("/subscribe", _authMiddleware.verifyToken, _authController.subscribeToPush);
var _default = exports["default"] = router;