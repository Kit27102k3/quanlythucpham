import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../Model/Account/Register.js";
import RefreshToken from "../Model/Account/RefreshToken.js";

export const register = async (req, res) => {
  try {
    const {
      email,
      phone,
      firstName,
      lastName,
      userName,
      address,
      password,
      userImage,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      phone,
      firstName,
      lastName,
      userName,
      address,
      password: hashedPassword,
      userImage,
    });

    await newUser.save();

    const refreshToken = jwt.sign({ id: newUser._id }, "SECRET_REFRESH", {
      expiresIn: "7d",
    });

    const newRefreshToken = new RefreshToken({
      userId: newUser._id,
      token: refreshToken,
    });
    await newRefreshToken.save();

    res.status(201).json({
      message: "Người dùng đã đăng ký thành công!",
      userId: newUser._id,
      refreshToken,
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName });

    if (!user) {
      return res.status(400).json({ message: "Người dùng không tồn tại" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Mật khẩu không hợp lệ" });
    }

    const accessToken = jwt.sign({ id: user._id }, "SECRET_ACCESS", {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id: user._id }, "SECRET_REFRESH", {
      expiresIn: "7d",
    });

    // Xóa token cũ (nếu có) và lưu token mới
    await RefreshToken.findOneAndDelete({ userId: user._id });
    const newRefreshToken = new RefreshToken({
      userId: user._id,
      token: refreshToken,
    });
    await newRefreshToken.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ accessToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    // Kiểm tra refreshToken trong database
    const tokenRecord = await RefreshToken.findOne({ token: refreshToken });
    if (!tokenRecord) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    jwt.verify(refreshToken, "SECRET_REFRESH", async (err, decode) => {
      if (err) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      // Tạo token mới
      const newAccessToken = jwt.sign({ id: decode.id }, "SECRET_ACCESS", {
        expiresIn: "15m",
      });

      const newRefreshToken = jwt.sign({ id: decode.id }, "SECRET_REFRESH", {
        expiresIn: "7d",
      });

      // Cập nhật refreshToken trong database
      tokenRecord.token = newRefreshToken;
      await tokenRecord.save();

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });

      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No token" });

    const tokenRecord = await RefreshToken.findOne({ token: refreshToken });
    if (!tokenRecord) {
      return res.status(400).json({ message: "Invalid refresh token" });
    }

    await RefreshToken.deleteOne({ token: refreshToken });

    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
