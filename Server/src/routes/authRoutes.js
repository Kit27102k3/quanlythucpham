import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../Controller/authController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

router.get("/profile", verifyToken, (req, res) => {
  res.json({ message: `Welcome ${req.user.id}` });
});

export default router;
