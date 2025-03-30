import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../Model/Register.js";
import RefreshToken from "../Model/RefreshToken.js";
import { generateOTP } from "../Untils/otp.until.js";
import { sendOTPEmail } from "../Services/email.service.js";

export const register = async (req, res) => {
  try {
    const {
      email,
      phone,
      firstName,
      lastName,
      userName,
      password,
      address,
      userImage,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      phone,
      firstName,
      lastName,
      userName,
      password: hashedPassword,
      address,
      userImage,
    });
    await newUser.save();

    const refreshToken = jwt.sign({ id: newUser._id }, "SECRET_REFRESH", {
      expiresIn: "7d",
    });
    await RefreshToken.create({ userId: newUser._id, token: refreshToken });

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser._id,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const accessToken = jwt.sign({ id: user._id }, "SECRET_ACCESS", {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id: user._id }, "SECRET_REFRESH", {
      expiresIn: "7d",
    });

    await RefreshToken.deleteMany({ userId: user._id });
    await RefreshToken.create({ userId: user._id, token: refreshToken });

    res.status(200).json({ accessToken, refreshToken, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const tokenRecord = await RefreshToken.findOne({ token: refreshToken });
    if (!tokenRecord) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    jwt.verify(refreshToken, "SECRET_REFRESH", async (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ message: "Invalid or expired refresh token" });
      }

      const newAccessToken = jwt.sign({ id: decoded.id }, "SECRET_ACCESS", {
        expiresIn: "15m",
      });
      const newRefreshToken = jwt.sign({ id: decoded.id }, "SECRET_REFRESH", {
        expiresIn: "7d",
      });

      tokenRecord.token = newRefreshToken;
      await tokenRecord.save();

      res
        .status(200)
        .json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    await RefreshToken.findOneAndDelete({ token: refreshToken });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUser = async (req, res) => {
  try {
    const user = await User.find();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp mật khẩu hiện tại",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Mật khẩu hiện tại không chính xác",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới phải có ít nhất 8 ký tự",
        });
      }
      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới cần ít nhất 1 chữ hoa",
        });
      }
      if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới cần ít nhất 1 chữ số",
        });
      }
      if (!/[!@#$%^&*]/.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới cần ít nhất 1 ký tự đặc biệt",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    res.json({
      success: true,
      message: "Đổi mật khẩu thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật người dùng:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật thông tin",
    });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email chưa được đăng ký trong hệ thống",
      });
    }
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordToken = otp;
    user.resetPasswordExpires = otpExpires;
    await user.save();

    await sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn",
    });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý yêu cầu",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    console.log("Dữ liệu nhận được từ client:", req.body);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết",
      });
    }

    // Tìm người dùng dựa trên email và OTP hợp lệ
    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }, // OTP còn hạn sử dụng
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Mã OTP không hợp lệ hoặc đã hết hạn",
      });
    }

    // Kiểm tra độ mạnh của mật khẩu mới
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Mật khẩu mới phải có ít nhất 8 ký tự",
        });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Mật khẩu mới cần ít nhất 1 chữ hoa",
        });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res
        .status(400)
        .json({ success: false, message: "Mật khẩu mới cần ít nhất 1 chữ số" });
    }
    if (!/[!@#$%^&*]/.test(newPassword)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Mật khẩu mới cần ít nhất 1 ký tự đặc biệt",
        });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Xóa OTP sau khi sử dụng
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    console.error("Lỗi khi đặt lại mật khẩu:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đặt lại mật khẩu",
    });
  }
};
