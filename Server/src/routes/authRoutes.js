import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getUserProfile,
  getAllUser,
  updateUser,
  requestPasswordReset,
  resetPassword,
  blockUser,
  facebookLogin,
  googleLogin,
  facebookCallback,
  facebookTokenLogin,
  getUserAvatar,
  getVapidPublicKey,
  subscribeToPush,
  validateSubscription,
  addUserAddress,
  getUserAddresses,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
  migrateAllLegacyAddresses
} from "../Controller/authController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", getAllUser);
router.get("/profile/:id", verifyToken, getUserProfile);
router.put("/update/:userId", verifyToken, updateUser);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.put("/profile/block/:userId", blockUser);

// User avatar route
router.get("/users/avatar/:id", getUserAvatar);

// Thêm các route cho OAuth
router.post("/facebook-login", facebookLogin);
router.post("/facebook-token", facebookTokenLogin);
router.post("/google-login", googleLogin);
router.get("/facebook/callback", facebookCallback);

// Route để lấy VAPID Public Key
router.get("/vapid-public-key", getVapidPublicKey);

// Route để đăng ký nhận Push Subscription
router.post("/subscribe", verifyToken, subscribeToPush);

// Add the validation route
router.post('/validate-subscription', validateSubscription);

// Các route quản lý địa chỉ
router.post("/user/:userId/addresses", verifyToken, addUserAddress);
router.get("/user/:userId/addresses", verifyToken, getUserAddresses);
router.put("/user/:userId/addresses/:addressId", verifyToken, updateUserAddress);
router.delete("/user/:userId/addresses/:addressId", verifyToken, deleteUserAddress);
router.put("/user/:userId/addresses/:addressId/default", verifyToken, setDefaultAddress);

// Admin route to migrate all legacy addresses
router.post("/admin/migrate-addresses", verifyToken, migrateAllLegacyAddresses);

export default router;
