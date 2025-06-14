/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../Model/Register.js";
import RefreshToken from "../Model/RefreshToken.js";
import { generateOTP } from "../utils/otp.until.js";
import { sendOTPEmail } from "../Services/email.service.js";
import Admin from "../Model/adminModel.js";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import webpush from "web-push";

// Load environment variables
dotenv.config();

// Fallback secret keys in case environment variables aren't set
const JWT_SECRET_ACCESS =
  process.env.JWT_SECRET_ACCESS || "a5e2c2e7-bf3a-4aa1-b5e2-eab36d9db2ea";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5d6f7e8c9d0a1b2";

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
    });

    // Tạo access token cho người dùng mới
    const accessToken = jwt.sign(
      {
        id: newUser._id,
        role: "user",
        permissions: ["Xem"],
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
      fullName: `${newUser.firstName} ${newUser.lastName}`,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đăng ký người dùng",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, userName, user_name, password } = req.body;

    // Normalize username variants (database might have either username or userName)
    const usernameToUse = username || userName || user_name;

    if (!usernameToUse || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tên người dùng và mật khẩu",
      });
    }

    const foundUser = await User.findOne({
      $or: [
        { userName: usernameToUse },
        { username: usernameToUse },
        { email: usernameToUse },
      ],
    });

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    if (foundUser.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, foundUser.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu không đúng",
      });
    }

    const accessToken = jwt.sign(
      {
        id: foundUser._id,
        role: "user",
        permissions: ["Xem"],
      },
      process.env.JWT_SECRET_ACCESS,
      { expiresIn: "1d" }
    );

    // Generate refresh token with extended expiry
    const refreshToken = jwt.sign(
      { id: foundUser._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Xóa refresh tokens cũ của user này trước khi tạo mới
    try {
      await RefreshToken.deleteMany({
        userId: foundUser._id,
        userModel: "User",
      });

      // Sau khi xóa tokens cũ, tạo token mới
      await RefreshToken.create({
        userId: foundUser._id,
        userModel: "User",
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    } catch (tokenError) {
      console.error("Error managing refresh tokens:", tokenError);
      // Continue even if token storage fails
    }

    // Update last login time
    foundUser.lastLogin = new Date();
    await foundUser.save();

    // Format response
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token: accessToken,
      refreshToken,
      user: {
        id: foundUser._id,
        userName: foundUser.userName,
        email: foundUser.email,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        role: "user",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi đăng nhập: " + error.message,
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

// Migrate single address to addresses array
const migrateLegacyAddress = async (user) => {
  try {
    // Check if addresses array is empty but legacy address exists
    if ((!user.addresses || user.addresses.length === 0) && user.address) {
      console.log(`Migrating legacy address for user: ${user._id}`);

      // Create new address object from legacy fields
      const newAddress = {
        fullAddress: user.fullAddress || user.address,
        houseNumber: user.houseNumber || "",
        ward: user.ward || "",
        district: user.district || "",
        province: user.province || "",
        coordinates: user.coordinates || {},
        isDefault: true,
        label: "Nhà",
        receiverName: `${user.firstName} ${user.lastName}`,
        receiverPhone: user.phone,
      };

      // Add to addresses array
      user.addresses = [newAddress];
      await user.save();
      console.log(`Legacy address migrated successfully for user: ${user._id}`);
    }
    return user;
  } catch (error) {
    console.error("Error migrating legacy address:", error);
    return user;
  }
};

// Add the migration logic to getUserProfile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    let user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Migrate legacy address if needed
    user = await migrateLegacyAddress(user);

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
    const {
      currentPassword,
      newPassword,
      firstName,
      lastName,
      phone,
      address,
      userImage,
    } = req.body;

    console.log("Updating user profile:", userId);
    console.log("Request body:", req.body);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Xử lý cập nhật mật khẩu nếu có
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

    // Xử lý cập nhật thông tin cá nhân
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) {
      console.log("Updating address to:", address);
      user.address = address;
    }

    // Xử lý cập nhật avatar nếu có
    if (userImage !== undefined) {
      console.log("Updating user image to:", userImage);
      user.userImage = userImage;
    }

    await user.save();
    console.log("User updated successfully:", user);

    // Trả về thông tin người dùng đã được cập nhật
    res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        userImage: user.userImage,
      },
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật thông tin",
      error: err.message,
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
        message: "Thiếu thông tin trạng thái chặn người dùng",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Cập nhật trạng thái chặn
    user.isBlocked = isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: isBlocked
        ? "Đã chặn người dùng thành công"
        : "Đã bỏ chặn người dùng thành công",
      user: {
        _id: user._id,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý yêu cầu",
    });
  }
};

// Hàm đăng nhập bằng Facebook
export const facebookLogin = async (req, res) => {
  try {
    const { accessToken, userID } = req.body;

    if (!accessToken || !userID) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin xác thực từ Facebook",
      });
    }

    // Xác thực token Facebook bằng cách gọi API của Facebook
    const fbResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${userID}`,
      {
        params: {
          fields: "id,email,first_name,last_name,picture",
          access_token: accessToken,
        },
      }
    );

    if (!fbResponse.data || !fbResponse.data.id) {
      return res.status(401).json({
        success: false,
        message: "Không thể xác thực với Facebook",
      });
    }

    const { id, email, first_name, last_name, picture } = fbResponse.data;

    // Tìm user với FacebookID
    let user = await User.findOne({ facebookId: id });

    // Nếu user không tồn tại nhưng email đã tồn tại, liên kết tài khoản đó
    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        // Liên kết tài khoản đã tồn tại với Facebook
        user.facebookId = id;
        user.authProvider = "facebook";
        await user.save();
      }
    }

    // Nếu vẫn không tìm thấy user, tạo mới
    if (!user) {
      // Tạo username ngẫu nhiên nếu không có
      const uniqueUsername = `fb_${id}_${Date.now().toString().slice(-4)}`;

      // Tạo mật khẩu ngẫu nhiên
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Use default avatar instead of Facebook profile pic
      const profileImageUrl = ""; // Don't store Facebook profile URL

      user = new User({
        email: email || `${id}@facebook.com`,
        phone: "0000000000", // Placeholder phone number
        firstName: first_name || "Facebook",
        lastName: last_name || "User",
        userName: uniqueUsername,
        password: hashedPassword,
        userImage: profileImageUrl,
        facebookId: id,
        authProvider: "facebook",
      });

      await user.save();
    }

    // Kiểm tra nếu tài khoản bị chặn
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
      });
    }

    // Tạo tokens
    const token = jwt.sign(
      {
        id: user._id,
        role: "user",
        permissions: ["Xem"],
      },
      process.env.JWT_SECRET_ACCESS,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Lưu refresh token
    await RefreshToken.create({
      userId: user._id,
      userModel: "User",
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Cập nhật lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Gửi response
    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: "user",
        permissions: ["Xem"],
      },
      message: "Đăng nhập bằng Facebook thành công!",
    });
  } catch (error) {
    console.error("Facebook login error:", error);
    res.status(500).json({
      success: false,
      message: "Đăng nhập bằng Facebook thất bại. Vui lòng thử lại.",
    });
  }
};

// Hàm đăng nhập bằng Google
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin xác thực từ Google",
      });
    }

    console.log("Google login with clientID:", process.env.GOOGLE_CLIENT_ID);

    // Xác thực Google ID token
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      console.log("Google payload verified successfully:", payload.sub);

      const { sub, email, given_name, family_name, picture } = payload;

      // Tìm user với GoogleID
      let user = await User.findOne({ googleId: sub });

      // Nếu user không tồn tại nhưng email đã tồn tại, liên kết tài khoản đó
      if (!user && email) {
        user = await User.findOne({ email });
        if (user) {
          // Liên kết tài khoản đã tồn tại với Google
          user.googleId = sub;
          user.authProvider = "google";
          await user.save();
        }
      }

      // Nếu vẫn không tìm thấy user, tạo mới
      if (!user) {
        // Tạo username ngẫu nhiên nếu không có
        const uniqueUsername = `google_${sub.slice(-8)}_${Date.now()
          .toString()
          .slice(-4)}`;

        // Tạo mật khẩu ngẫu nhiên
        const randomPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = new User({
          email: email,
          phone: "0000000000", // Placeholder phone number
          firstName: given_name || "Google",
          lastName: family_name || "User",
          userName: uniqueUsername,
          password: hashedPassword,
          userImage: picture || "",
          googleId: sub,
          authProvider: "google",
        });

        await user.save();
      }

      // Kiểm tra nếu tài khoản bị chặn
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
        });
      }

      // Tạo tokens
      const token = jwt.sign(
        {
          id: user._id,
          role: "user",
          permissions: ["Xem"],
        },
        process.env.JWT_SECRET_ACCESS,
        { expiresIn: "1d" }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      // Lưu refresh token
      await RefreshToken.create({
        userId: user._id,
        userModel: "User",
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Cập nhật lastLogin
      user.lastLogin = new Date();
      await user.save();

      // Gửi response
      res.status(200).json({
        success: true,
        token,
        refreshToken,
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: "user",
          permissions: ["Xem"],
        },
        message: "Đăng nhập bằng Google thành công!",
      });
    } catch (error) {
      console.error("Google login error:", error);
      res.status(500).json({
        success: false,
        message: "Đăng nhập bằng Google thất bại. Vui lòng thử lại.",
      });
    }
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      success: false,
      message: "Đăng nhập bằng Google thất bại. Vui lòng thử lại.",
    });
  }
};

// Hàm xử lý callback từ Facebook OAuth
export const facebookCallback = async (req, res) => {
  try {
    // Code from authentication callback
    const { code } = req.query;

    if (!code) {
      return res.redirect("/dang-nhap?error=no_code");
    }

    // Exchange code for access token
    const tokenResponse = await axios.get(
      "https://graph.facebook.com/oauth/access_token",
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
          code,
        },
      }
    );

    if (!tokenResponse.data.access_token) {
      return res.redirect("/dang-nhap?error=token_exchange_failed");
    }

    const accessToken = tokenResponse.data.access_token;

    // Get user data with access token
    const userDataResponse = await axios.get("https://graph.facebook.com/me", {
      params: {
        fields: "id,first_name,last_name,email,picture",
        access_token: accessToken,
      },
    });

    if (!userDataResponse.data.id) {
      return res.redirect("/dang-nhap?error=user_data_failed");
    }

    const { id, first_name, last_name, email } = userDataResponse.data;

    // Look for user with Facebook ID
    let user = await User.findOne({ facebookId: id });

    // If user not found but we have an email, look for user with that email
    if (!user && email) {
      user = await User.findOne({ email });

      // If found by email, update the Facebook ID
      if (user) {
        user.facebookId = id;
        await user.save();
      }
    }

    // If still no user, create a new one
    if (!user) {
      const uniqueUsername = `fb_${id}_${Date.now().toString().slice(-4)}`;
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Use default avatar instead of Facebook image
      const profileImageUrl = "";

      user = new User({
        email: `${uniqueUsername}@facebook.com`,
        phone: "0000000000", // Placeholder phone number
        firstName: first_name || "Facebook",
        lastName: last_name || "User",
        userName: uniqueUsername,
        password: hashedPassword,
        userImage: profileImageUrl,
        facebookId: id,
        authProvider: "facebook",
      });

      await user.save();
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return res.redirect("/dang-nhap?error=account_blocked");
    }

    // Create tokens
    const token = jwt.sign(
      {
        id: user._id,
        role: "user",
        permissions: ["Xem"],
      },
      process.env.JWT_SECRET_ACCESS,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Xóa refresh tokens cũ của user này trước khi tạo mới
    try {
      await RefreshToken.deleteMany({ userId: user._id, userModel: "User" });

      // Sau khi xóa tokens cũ, tạo token mới
      await RefreshToken.create({
        userId: user._id,
        userModel: "User",
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    } catch (tokenError) {
      console.error("Error managing refresh tokens:", tokenError);
      // Continue even if token storage fails
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Redirect with tokens as URL parameters
    res.redirect(
      `/dang-nhap/success?token=${token}&refreshToken=${refreshToken}&userId=${
        user._id
      }&name=${encodeURIComponent(
        `${user.firstName} ${user.lastName}`
      )}&role=user`
    );
  } catch (error) {
    console.error("Facebook callback error:", error);
    res.redirect("/dang-nhap?error=server_error");
  }
};

// Hàm đăng nhập bằng Facebook token
export const facebookTokenLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Thiếu access token",
      });
    }

    // Lấy thông tin từ Facebook bằng access token
    const fbResponse = await axios.get(`https://graph.facebook.com/v18.0/me`, {
      params: {
        fields:
          "id,first_name,last_name,email,picture{url,width,height,is_silhouette}",
        access_token: accessToken,
      },
    });

    if (!fbResponse.data || !fbResponse.data.id) {
      return res.status(401).json({
        success: false,
        message: "Không thể xác thực với Facebook",
      });
    }

    const { id, first_name, last_name, email, picture } = fbResponse.data;

    // Log thông tin nhận được từ Facebook
    console.log("Facebook data received:", {
      id,
      first_name,
      last_name,
      email: email || "No email provided by Facebook",
      hasPicture: !!picture,
    });

    // Lấy ảnh chất lượng cao hơn từ Facebook nếu có
    let profileImageUrl = "";
    if (picture && picture.data && !picture.data.is_silhouette) {
      try {
        // Thử lấy ảnh lớn hơn từ Facebook Graph API
        const pictureResponse = await axios.get(
          `https://graph.facebook.com/v18.0/${id}/picture`,
          {
            params: {
              type: "large",
              redirect: "false",
              access_token: accessToken,
            },
          }
        );

        if (
          pictureResponse.data &&
          pictureResponse.data.data &&
          pictureResponse.data.data.url
        ) {
          profileImageUrl = pictureResponse.data.data.url;
          console.log(
            "Retrieved larger Facebook profile image:",
            profileImageUrl
          );
        }
      } catch (pictureError) {
        console.error("Error fetching larger picture:", pictureError);
        // Fallback to original picture if available
        if (picture && picture.data && picture.data.url) {
          profileImageUrl = picture.data.url;
        }
      }
    }

    // Fallback to default avatar if no Facebook image
    if (!profileImageUrl) {
      profileImageUrl = "https://www.gravatar.com/avatar/?d=mp&s=256";
    }

    // Tìm user với FacebookID
    let user = await User.findOne({ facebookId: id });

    // Nếu không tìm thấy theo facebookId và có email, thử tìm theo email
    if (!user && email) {
      user = await User.findOne({ email });
      // Nếu tìm thấy theo email, cập nhật facebookId
      if (user) {
        user.facebookId = id;
        await user.save();
      }
    }

    // Nếu vẫn không tìm thấy user, tạo mới
    if (!user) {
      // Tạo username ngẫu nhiên nếu không có
      const uniqueUsername = `fb_${id}_${Date.now().toString().slice(-4)}`;

      // Tạo mật khẩu ngẫu nhiên
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Tạo email giả nếu không có email từ Facebook
      const userEmail = email || `${uniqueUsername}@facebook.user`;

      user = new User({
        email: userEmail,
        phone: "0000000000", // Placeholder phone number
        firstName: first_name || "Facebook",
        lastName: last_name || "User",
        userName: uniqueUsername,
        password: hashedPassword,
        userImage: profileImageUrl,
        facebookId: id,
        authProvider: "facebook",
      });

      await user.save();
    } else {
      // Cập nhật avatar nếu người dùng đã tồn tại
      if (
        profileImageUrl &&
        profileImageUrl !== "https://www.gravatar.com/avatar/?d=mp&s=256"
      ) {
        user.userImage = profileImageUrl;
        await user.save();
      }
    }

    // Kiểm tra nếu tài khoản bị chặn
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
      });
    }

    // Tạo tokens
    const token = jwt.sign(
      {
        id: user._id,
        role: "user",
        permissions: ["Xem"],
      },
      process.env.JWT_SECRET_ACCESS,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Xóa refresh tokens cũ của user này trước khi tạo mới
    try {
      await RefreshToken.deleteMany({ userId: user._id, userModel: "User" });

      // Sau khi xóa tokens cũ, tạo token mới
      await RefreshToken.create({
        userId: user._id,
        userModel: "User",
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    } catch (tokenError) {
      console.error("Error managing refresh tokens:", tokenError);
      // Continue even if token storage fails
    }

    // Cập nhật lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Gửi response
    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        userImage: user.userImage,
        role: "user",
        permissions: ["Xem"],
      },
      message: "Đăng nhập bằng Facebook thành công!",
    });
  } catch (error) {
    console.error("Facebook token login error:", error);
    res.status(500).json({
      success: false,
      message: "Đăng nhập bằng Facebook thất bại. Vui lòng thử lại.",
    });
  }
};

// Endpoint to get user avatar
export const getUserAvatar = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId).select(
      "userImage firstName lastName email authProvider facebookId"
    );

    if (!user) {
      console.log("User not found for ID:", userId);
      return res.json({
        userImage: "https://www.gravatar.com/avatar/?d=mp&s=256",
      });
    }

    console.log("User found:", user.email, "- Image:", user.userImage);

    // Nếu người dùng đang sử dụng Facebook và không có ảnh đại diện
    if (
      user.authProvider === "facebook" &&
      (!user.userImage ||
        user.userImage.includes("platform-lookaside.fbsbx.com"))
    ) {
      if (user.facebookId) {
        try {
          // Tạo một avatar tốt hơn cho người dùng Facebook
          const fbAvatarUrl = `https://graph.facebook.com/${user.facebookId}/picture?type=large`;
          return res.json({ userImage: fbAvatarUrl });
        } catch (fbError) {
          console.error("Error creating Facebook avatar URL:", fbError);
        }
      }
      // Fallback nếu không lấy được ảnh Facebook
      return res.json({
        userImage: "https://www.gravatar.com/avatar/?d=mp&s=256",
      });
    }

    // If user has a userImage that is a URL, return the URL directly
    if (
      user.userImage &&
      (user.userImage.startsWith("http://") ||
        user.userImage.startsWith("https://"))
    ) {
      console.log("Returning external avatar URL:", user.userImage);
      return res.json({ userImage: user.userImage });
    }

    // If user has a local image (e.g. uploaded file path), serve that
    if (user.userImage) {
      console.log("Serving local avatar");
      // You might need to adjust this depending on how your images are stored
      return res.sendFile(user.userImage, { root: process.cwd() });
    }

    // If no image is found, return a default avatar
    console.log("No avatar found, using default");
    return res.json({
      userImage: "https://www.gravatar.com/avatar/?d=mp&s=256",
    });
  } catch (error) {
    console.error("Error fetching user avatar:", error);
    return res.json({
      userImage: "https://www.gravatar.com/avatar/?d=mp&s=256",
    });
  }
};

// New controller function to provide VAPID public key
export const getVapidPublicKey = (req, res) => {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      return res
        .status(500)
        .json({ message: "VAPID Public Key not configured on server." });
    }

    // Log to confirm the key is valid (should be Base64 URL-safe encoded)
    const isValidBase64 = /^[A-Za-z0-9\-_]+=*$/.test(vapidPublicKey);

    res.status(200).json({ vapidPublicKey: vapidPublicKey });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Controller function to subscribe a user to push notifications
export const subscribeToPush = async (req, res) => {
  const subscription = req.body;
  const userId = req.user.id;

  if (!subscription || !subscription.endpoint) {
    return res
      .status(400)
      .json({ message: "Push subscription object is required." });
  }

  try {
    // Set timeout for MongoDB operations
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database operation timed out")), 5000)
    );

    // Find user with timeout
    const userPromise = User.findById(userId);
    const user = await Promise.race([userPromise, timeoutPromise]);

    if (!user) {
      console.error(`[subscribeToPush] User not found: ${userId}`);
      return res.status(404).json({ message: "User not found." });
    }

    // Initialize pushSubscriptions array if not exists
    if (!user.pushSubscriptions) {
      user.pushSubscriptions = [];
    }

    // Check for existing subscription
    const existingSubscription = user.pushSubscriptions.find(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (existingSubscription) {
      console.log(
        `[subscribeToPush] Subscription already exists for user: ${userId}`
      );
      return res.status(200).json({
        message: "Subscription already exists.",
        subscriptionCount: user.pushSubscriptions.length,
      });
    }

    // Validate subscription
    if (
      !subscription.keys ||
      !subscription.keys.p256dh ||
      !subscription.keys.auth
    ) {
      console.error(
        `[subscribeToPush] Invalid subscription object, missing required keys`
      );
      return res
        .status(400)
        .json({
          message: "Invalid subscription object. Missing required keys.",
        });
    }

    // Add new subscription
    console.log(
      `[subscribeToPush] Adding new subscription for user: ${userId}`
    );
    user.pushSubscriptions.push(subscription);

    // Save with timeout
    const savePromise = user.save();
    await Promise.race([savePromise, timeoutPromise]);

    // Send response immediately after saving
    res.status(201).json({
      message: "Push subscription saved successfully.",
      subscriptionCount: user.pushSubscriptions.length,
    });

    // Send test notification asynchronously after response
    try {
      const testPayload = {
        notification: {
          title: "Đăng ký thành công",
          body: "Bạn đã đăng ký nhận thông báo thành công!",
          icon: "/Logo.png",
          vibrate: [100, 50, 100],
          data: {
            url: "/",
            dateOfArrival: Date.now(),
            primaryKey: 1,
            type: "test_notification",
          },
        },
      };

      // Add retry logic for sending notification
      let retries = 3;
      while (retries > 0) {
        try {
          await webpush.sendNotification(
            subscription,
            JSON.stringify(testPayload)
          );
          console.log(`[subscribeToPush] Test notification sent successfully`);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error(
              `[subscribeToPush] Failed to send test notification after 3 attempts:`,
              error
            );
          } else {
            console.log(`[subscribeToPush] Retrying test notification...`);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
          }
        }
      }
    } catch (notificationError) {
      console.error(
        `[subscribeToPush] Error in test notification process:`,
        notificationError
      );
      // Don't throw error since we already sent success response
    }
  } catch (error) {
    console.error(`[subscribeToPush] Error saving push subscription:`, error);
    res.status(500).json({
      message: "Internal server error while saving subscription",
      error: error.message,
    });
  }
};

// Validate Push Subscription
export const validateSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "Subscription data is required",
      });
    }

    const webpush = require("web-push");

    // Configure web-push with VAPID keys
    webpush.setVapidDetails(
      "mailto:daninc.system@gmail.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // Send a small test notification payload
    const testPayload = JSON.stringify({
      title: "Validation Test",
      body: "This is a test to validate your subscription",
      silent: true,
    });

    try {
      // Try to send a notification to check if the subscription is valid
      await webpush.sendNotification(subscription, testPayload);
      return res.status(200).json({
        success: true,
        valid: true,
        message: "Subscription is valid",
      });
    } catch (error) {
      console.log("Validation error:", error);

      // Check for specific error status codes
      if (error.statusCode === 404 || error.statusCode === 410) {
        // 404: Not Found, 410: Gone - Subscription has expired or is invalid
        return res.status(200).json({
          success: true,
          valid: false,
          message: "Subscription has expired or is invalid",
          error: error.body || error.message,
        });
      } else if (error.statusCode === 400) {
        // Bad request - Invalid subscription
        return res.status(200).json({
          success: true,
          valid: false,
          message: "Invalid subscription format",
          error: error.body || error.message,
        });
      } else {
        // Other errors
        return res.status(200).json({
          success: true,
          valid: false,
          message: "Error validating subscription",
          error: error.body || error.message,
        });
      }
    }
  } catch (error) {
    console.error("Validate subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while validating subscription",
    });
  }
};

// Tạo/cập nhật địa chỉ mặc định đơn lẻ từ mảng địa chỉ cho tính tương thích ngược
const updateDefaultAddressForBackwardCompatibility = async (userId) => {
  try {
    console.log(
      `[updateDefaultAddressForBackwardCompatibility] Updating legacy address for user ${userId}`
    );

    const user = await User.findById(userId);
    if (!user) {
      console.log(
        `[updateDefaultAddressForBackwardCompatibility] User not found: ${userId}`
      );
      return;
    }

    // Tìm địa chỉ mặc định trong mảng
    const defaultAddress = user.addresses.find(
      (addr) => addr.isDefault === true
    );

    if (defaultAddress) {
      console.log(
        `[updateDefaultAddressForBackwardCompatibility] Found default address: ${defaultAddress.fullAddress}`
      );

      // Cập nhật trường address legacy - đảm bảo không phải undefined
      user.address = defaultAddress.fullAddress || "";

      // Cập nhật các trường riêng lẻ cho địa chỉ (nếu có)
      user.houseNumber = defaultAddress.houseNumber || "";
      user.ward = defaultAddress.ward || "";
      user.district = defaultAddress.district || "";
      user.province = defaultAddress.province || "";

      // Sao chép tọa độ nếu có
      if (
        defaultAddress.coordinates &&
        defaultAddress.coordinates.lat &&
        defaultAddress.coordinates.lng
      ) {
        user.coordinates = {
          lat: defaultAddress.coordinates.lat,
          lng: defaultAddress.coordinates.lng,
        };
      }

      // Đảm bảo fullAddress được cập nhật
      user.fullAddress = defaultAddress.fullAddress || "";

      // Đánh dấu là đã sửa đổi để đảm bảo mongoose cập nhật
      user.markModified("address");
      user.markModified("coordinates");

      await user.save();
      console.log(
        `[updateDefaultAddressForBackwardCompatibility] Updated legacy address fields for user ${userId}`
      );
    } else {
      console.log(
        `[updateDefaultAddressForBackwardCompatibility] No default address found for user ${userId}`
      );
    }
  } catch (error) {
    console.error(
      `[updateDefaultAddressForBackwardCompatibility] Error updating legacy address:`,
      error
    );
  }
};

// Thêm địa chỉ mới
export const addUserAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    const addressData = req.body;

    if (!addressData.fullAddress) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp địa chỉ đầy đủ",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Nếu đây là địa chỉ đầu tiên, đặt nó làm mặc định
    if (!user.addresses || user.addresses.length === 0) {
      addressData.isDefault = true;
    } else if (addressData.isDefault) {
      // Nếu địa chỉ mới là mặc định, cập nhật tất cả các địa chỉ khác thành không mặc định
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // Nếu không có thông tin người nhận, sử dụng thông tin người dùng
    if (!addressData.receiverName) {
      addressData.receiverName = `${user.firstName} ${user.lastName}`;
    }

    if (!addressData.receiverPhone) {
      addressData.receiverPhone = user.phone;
    }

    // Thêm địa chỉ mới vào mảng
    user.addresses.push(addressData);

    // Nếu đây là địa chỉ mặc định, cập nhật trường address cũ
    if (addressData.isDefault || user.addresses.length === 1) {
      await updateDefaultAddressForBackwardCompatibility(userId);
    }

    // Lưu người dùng đã cập nhật
    await user.save();

    res.status(200).json({
      success: true,
      message: "Thêm địa chỉ thành công",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Lỗi khi thêm địa chỉ:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi thêm địa chỉ",
      error: error.message,
    });
  }
};

// Lấy tất cả địa chỉ của người dùng
export const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Migrate legacy address if needed
    user = await migrateLegacyAddress(user);

    res.status(200).json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách địa chỉ:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách địa chỉ",
      error: error.message,
    });
  }
};

// Cập nhật địa chỉ
export const updateUserAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const updatedData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Tìm địa chỉ cần cập nhật
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa chỉ",
      });
    }

    // Kiểm tra nếu địa chỉ được cập nhật trở thành mặc định
    if (updatedData.isDefault) {
      // Cập nhật tất cả các địa chỉ khác thành không mặc định
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // Cập nhật địa chỉ
    Object.keys(updatedData).forEach((key) => {
      user.addresses[addressIndex][key] = updatedData[key];
    });

    // Nếu đây là địa chỉ mặc định, cập nhật trường address cũ
    if (updatedData.isDefault) {
      await updateDefaultAddressForBackwardCompatibility(userId);
    }

    // Lưu thay đổi
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật địa chỉ thành công",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật địa chỉ:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật địa chỉ",
      error: error.message,
    });
  }
};

// Xóa địa chỉ
export const deleteUserAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Tìm địa chỉ cần xóa
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa chỉ",
      });
    }

    // Kiểm tra nếu địa chỉ bị xóa là mặc định
    const isDefault = user.addresses[addressIndex].isDefault;

    // Xóa địa chỉ khỏi mảng
    user.addresses.splice(addressIndex, 1);

    // Nếu địa chỉ bị xóa là mặc định và vẫn còn địa chỉ khác, đặt địa chỉ đầu tiên còn lại làm mặc định
    if (isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    // Nếu đã thay đổi địa chỉ mặc định, cập nhật trường address cũ
    if (isDefault && user.addresses.length > 0) {
      await updateDefaultAddressForBackwardCompatibility(userId);
    }

    // Lưu thay đổi
    await user.save();

    res.status(200).json({
      success: true,
      message: "Xóa địa chỉ thành công",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Lỗi khi xóa địa chỉ:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa địa chỉ",
      error: error.message,
    });
  }
};

// Đặt địa chỉ mặc định
export const setDefaultAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    console.log(
      `[setDefaultAddress] Setting address ${addressId} as default for user ${userId}`
    );

    const user = await User.findById(userId);
    if (!user) {
      console.log(`[setDefaultAddress] User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Kiểm tra xem địa chỉ có tồn tại không
    const addressExists = user.addresses.some(
      (addr) => addr._id.toString() === addressId
    );
    if (!addressExists) {
      console.log(`[setDefaultAddress] Address not found: ${addressId}`);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa chỉ",
      });
    }

    // Đặt tất cả địa chỉ thành không mặc định, sau đó đặt địa chỉ được chọn thành mặc định
    user.addresses.forEach((addr) => {
      const isSelected = addr._id.toString() === addressId;
      addr.isDefault = isSelected;

      if (isSelected) {
        console.log(
          `[setDefaultAddress] Setting address as default: ${addr.fullAddress}`
        );
      }
    });

    // Đánh dấu mảng addresses đã được sửa đổi để đảm bảo mongoose cập nhật
    user.markModified("addresses");

    // Lưu thay đổi trước khi cập nhật tương thích ngược
    await user.save();

    // Cập nhật trường address cũ
    await updateDefaultAddressForBackwardCompatibility(userId);

    res.status(200).json({
      success: true,
      message: "Đặt địa chỉ mặc định thành công",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error(`[setDefaultAddress] Error setting default address:`, error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đặt địa chỉ mặc định",
      error: error.message,
    });
  }
};

// Admin endpoint to migrate all legacy addresses
export const migrateAllLegacyAddresses = async (req, res) => {
  try {
    // Kiểm tra quyền admin (thực tế nên sử dụng middleware)
    if (!req.user || !req.user.role || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thực hiện chức năng này",
      });
    }

    // Lấy tất cả user có địa chỉ cũ
    const users = await User.find({
      address: { $exists: true, $ne: "" },
      $or: [{ addresses: { $exists: false } }, { addresses: { $size: 0 } }],
    });

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Xử lý từng user
    for (const user of users) {
      try {
        // Kiểm tra nếu mảng addresses trống
        if (!user.addresses || user.addresses.length === 0) {
          await migrateLegacyAddress(user);
          migratedCount++;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`Error migrating address for user ${user._id}:`, err);
        errorCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Đã di chuyển ${migratedCount} địa chỉ, bỏ qua ${skippedCount}, lỗi ${errorCount}`,
      total: users.length,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error("Lỗi khi di chuyển dữ liệu địa chỉ:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi di chuyển dữ liệu địa chỉ",
      error: error.message,
    });
  }
};
