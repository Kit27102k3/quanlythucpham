import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../Model/Register.js";
import RefreshToken from "../Model/RefreshToken.js";
import { generateOTP } from "../Untils/otp.until.js";
import { sendOTPEmail } from "../Services/email.service.js";
import Admin from "../Model/adminModel.js";

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

    // Kiểm tra email đã tồn tại
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Kiểm tra username đã tồn tại
    const existingUsername = await User.findOne({ userName });
    if (existingUsername) {
      return res.status(400).json({ message: "Tên đăng nhập đã được sử dụng" });
    }

    // Băm mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Tạo user mới
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
    
    // Lưu user vào database
    await newUser.save();

    // Tạo refresh token với secret key từ biến môi trường
    const refreshToken = jwt.sign(
      { id: newUser._id },
      process.env.JWT_REFRESH_SECRET || "SECRET_REFRESH", // Fallback nếu không có biến môi trường
      { expiresIn: "7d" }
    );
    
    // Lưu refresh token vào database với thời gian hết hạn
    await RefreshToken.create({
      userId: newUser._id,
      userModel: "User",
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 ngày
    });

    // Tạo access token cho người dùng mới
    const accessToken = jwt.sign(
      {
        id: newUser._id,
        role: "user",
        permissions: ["Xem"]
      },
      process.env.JWT_SECRET_ACCESS || "SECRET_ACCESS", // Fallback nếu không có biến môi trường
      { expiresIn: "1d" }
    );

    // Trả về thông tin đăng ký thành công
    res.status(201).json({
      success: true,
      message: "Đăng ký người dùng thành công",
      userId: newUser._id,
      accessToken,
      refreshToken,
      role: "user",
      permissions: ["Xem"],
      fullName: `${newUser.firstName} ${newUser.lastName}`
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false,
      message: "Đã xảy ra lỗi khi đăng ký người dùng",
      error: error.message 
    });
  }
};

export const login = async (req, res) => {
  try {
    const { userName, password } = req.body;

    // 1. Kiểm tra thông tin đăng nhập
    if (!userName || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tên đăng nhập và mật khẩu",
      });
    }

    // 2. Tìm kiếm user trong cả User và Admin collections
    let user = await User.findOne({ userName });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại",
      });
    }

    // 3. Kiểm tra trạng thái tài khoản
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị vô hiệu hóa",
      });
    }

    // Kiểm tra nếu tài khoản bị chặn
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked",
      });
    }

    // 4. Xác thực mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu không chính xác",
      });
    }

    // 5. Tạo tokens
    const accessToken = jwt.sign(
      {
        id: user._id,
        role: "user",
        permissions: ["Xem"]
      },
      process.env.JWT_SECRET_ACCESS,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // 6. Quản lý refresh token
    // Xóa tất cả refresh token cũ của user
    await RefreshToken.deleteMany({
      userId: user._id,
      userModel: "User"
    });

    // Lưu refresh token mới
    await RefreshToken.create({
      userId: user._id,
      userModel: "User",
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // 7. Cập nhật last login
    user.lastLogin = new Date();
    await user.save();

    // 8. Trả về response
    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      userId: user._id,
      role: "user",
      isBlocked: user.isBlocked || false,
      permissions: ["Xem"],
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      message: "Đăng nhập thành công"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống. Vui lòng thử lại sau"
    });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token exists in database
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      userId: decoded.id,
    });

    if (!storedToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Find user (either User or Admin)
    let user =
      (await User.findById(decoded.id)) || (await Admin.findById(decoded.id));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
        permissions: user.permissions || [],
      },
      process.env.JWT_SECRET_ACCESS,
      { expiresIn: "1h" }
    );

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // Remove expired refresh token from database
      await RefreshToken.findOneAndDelete({ token: refreshToken });
      return res.status(403).json({ message: "Refresh token expired" });
    }
    return res.status(403).json({ message: "Invalid refresh token" });
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
      return res
        .status(400)
        .json({ success: false, message: "Mật khẩu mới cần ít nhất 1 chữ số" });
    }
    if (!/[!@#$%^&*]/.test(newPassword)) {
      return res.status(400).json({
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
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đặt lại mật khẩu",
    });
  }
};

// Xử lý chặn/bỏ chặn người dùng
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    if (isBlocked === undefined) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin trạng thái chặn người dùng"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    // Cập nhật trạng thái chặn
    user.isBlocked = isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: isBlocked ? "Đã chặn người dùng thành công" : "Đã bỏ chặn người dùng thành công",
      user: {
        _id: user._id,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý yêu cầu"
    });
  }
};
