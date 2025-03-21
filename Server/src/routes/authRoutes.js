import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getUserProfile,
  getAllUser,
  updateUser,
} from "../Controller/authController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", getAllUser);
router.get("/profile/:id", verifyToken, getUserProfile);
router.put("/update/:id", verifyToken, updateUser);

export default router;
