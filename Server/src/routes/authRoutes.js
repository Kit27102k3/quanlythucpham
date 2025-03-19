import express from "express";
import { register, login, logout } from "../Controller/authController.js";
import User from "../Model/Account/Register.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body; // Hoặc lấy từ cookies

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    // Kiểm tra refresh token trong bảng RefreshToken
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Xác thực refresh token
    jwt.verify(refreshToken, "SECRET_REFRESH", async (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .json({ message: "Invalid or expired refresh token" });
      }

      // Lấy thông tin user từ decoded id
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Tạo access token mới
      const accessToken = jwt.sign({ id: user._id }, "SECRET_ACCESS", {
        expiresIn: "15m",
      });

      // Tạo refresh token mới
      const newRefreshToken = jwt.sign({ id: user._id }, "SECRET_REFRESH", {
        expiresIn: "7d",
      });

      // Cập nhật lại refresh token trong database
      storedToken.token = newRefreshToken;
      await storedToken.save();

      // Set lại cookie cho refresh token mới
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });

      // Trả về access token mới
      res.json({ accessToken });
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/profile", async function (req, res) {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
