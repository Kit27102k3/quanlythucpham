import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../Controller/authController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";
import User from "../Model/Account/Register.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body; // Hoặc lấy từ cookies

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    // Kiểm tra refresh token trong database
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Xác thực refresh token
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          return res
            .status(401)
            .json({ message: "Invalid or expired refresh token" });
        }

        // Tạo access token mới
        const accessToken = jwt.sign(
          { id: user._id, email: user.email },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" } // Thời hạn của access token
        );

        // Trả về access token mới
        res.json({ accessToken });
      }
    );
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/logout", logout);

router.get("/profile", async function (req, res) {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
