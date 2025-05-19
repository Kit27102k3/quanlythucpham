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
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import webpush from 'web-push';

// Load environment variables
dotenv.config();

// Fallback secret keys in case environment variables aren't set
const JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS || "a5e2c2e7-bf3a-4aa1-b5e2-eab36d9db2ea";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5d6f7e8c9d0a1b2";

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
        { email: usernameToUse }
      ] 
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
        permissions: ["Xem"]
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
      await RefreshToken.deleteMany({ userId: foundUser._id, userModel: "User" });
      
      // Sau khi xóa tokens cũ, tạo token mới
      await RefreshToken.create({
        userId: foundUser._id,
        userModel: "User",
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
        role: "user"
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
    const { currentPassword, newPassword, firstName, lastName, phone, address, userImage } = req.body;

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
        userImage: user.userImage
      },
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật thông tin",
      error: err.message
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

// Hàm đăng nhập bằng Facebook
export const facebookLogin = async (req, res) => {
  try {
    const { accessToken, userID } = req.body;
    
    if (!accessToken || !userID) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin xác thực từ Facebook"
      });
    }

    // Xác thực token Facebook bằng cách gọi API của Facebook
    const fbResponse = await axios.get(`https://graph.facebook.com/v18.0/${userID}`, {
      params: {
        fields: 'id,email,first_name,last_name,picture',
        access_token: accessToken
      }
    });

    if (!fbResponse.data || !fbResponse.data.id) {
      return res.status(401).json({
        success: false,
        message: "Không thể xác thực với Facebook"
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
        user.authProvider = 'facebook';
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
      const profileImageUrl = ''; // Don't store Facebook profile URL
      
      user = new User({
        email: email || `${id}@facebook.com`,
        phone: '0000000000', // Placeholder phone number
        firstName: first_name || 'Facebook',
        lastName: last_name || 'User',
        userName: uniqueUsername,
        password: hashedPassword,
        userImage: profileImageUrl,
        facebookId: id,
        authProvider: 'facebook'
      });
      
      await user.save();
    }
    
    // Kiểm tra nếu tài khoản bị chặn
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
      });
    }
    
    // Tạo tokens
    const token = jwt.sign(
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
    
    // Lưu refresh token
    await RefreshToken.create({
      userId: user._id,
      userModel: "User",
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
        permissions: ["Xem"]
      },
      message: "Đăng nhập bằng Facebook thành công!"
    });
    
  } catch (error) {
    console.error("Facebook login error:", error);
    res.status(500).json({
      success: false,
      message: "Đăng nhập bằng Facebook thất bại. Vui lòng thử lại."
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
        message: "Thiếu thông tin xác thực từ Google"
      });
    }
    
    console.log("Google login with clientID:", process.env.GOOGLE_CLIENT_ID);
    
    // Xác thực Google ID token
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
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
          user.authProvider = 'google';
          await user.save();
        }
      }
      
      // Nếu vẫn không tìm thấy user, tạo mới
      if (!user) {
        // Tạo username ngẫu nhiên nếu không có
        const uniqueUsername = `google_${sub.slice(-8)}_${Date.now().toString().slice(-4)}`;
        
        // Tạo mật khẩu ngẫu nhiên
        const randomPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        user = new User({
          email: email,
          phone: '0000000000', // Placeholder phone number
          firstName: given_name || 'Google',
          lastName: family_name || 'User',
          userName: uniqueUsername,
          password: hashedPassword,
          userImage: picture || '',
          googleId: sub,
          authProvider: 'google'
        });
        
        await user.save();
      }
      
      // Kiểm tra nếu tài khoản bị chặn
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
        });
      }
      
      // Tạo tokens
      const token = jwt.sign(
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
      
      // Lưu refresh token
      await RefreshToken.create({
        userId: user._id,
        userModel: "User",
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
          permissions: ["Xem"]
        },
        message: "Đăng nhập bằng Google thành công!"
      });
      
    } catch (error) {
      console.error("Google login error:", error);
      res.status(500).json({
        success: false,
        message: "Đăng nhập bằng Google thất bại. Vui lòng thử lại."
      });
    }
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      success: false,
      message: "Đăng nhập bằng Google thất bại. Vui lòng thử lại."
    });
  }
};

// Hàm xử lý callback từ Facebook OAuth
export const facebookCallback = async (req, res) => {
  try {
    // Code from authentication callback
    const { code } = req.query;
    
    if (!code) {
      return res.redirect('/dang-nhap?error=no_code');
    }
    
    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
        code
      }
    });
    
    if (!tokenResponse.data.access_token) {
      return res.redirect('/dang-nhap?error=token_exchange_failed');
    }
    
    const accessToken = tokenResponse.data.access_token;
    
    // Get user data with access token
    const userDataResponse = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,first_name,last_name,email,picture',
        access_token: accessToken
      }
    });
    
    if (!userDataResponse.data.id) {
      return res.redirect('/dang-nhap?error=user_data_failed');
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
      const profileImageUrl = '';
      
      user = new User({
        email: `${uniqueUsername}@facebook.com`,
        phone: '0000000000', // Placeholder phone number
        firstName: first_name || 'Facebook',
        lastName: last_name || 'User',
        userName: uniqueUsername,
        password: hashedPassword,
        userImage: profileImageUrl,
        facebookId: id,
        authProvider: 'facebook'
      });
      
      await user.save();
    }
    
    // Check if account is blocked
    if (user.isBlocked) {
      return res.redirect('/dang-nhap?error=account_blocked');
    }
    
    // Create tokens
    const token = jwt.sign(
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
    
    // Xóa refresh tokens cũ của user này trước khi tạo mới
    try {
      await RefreshToken.deleteMany({ userId: user._id, userModel: "User" });
      
      // Sau khi xóa tokens cũ, tạo token mới
      await RefreshToken.create({
        userId: user._id,
        userModel: "User",
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    } catch (tokenError) {
      console.error("Error managing refresh tokens:", tokenError);
      // Continue even if token storage fails
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Redirect with tokens as URL parameters
    res.redirect(`/dang-nhap/success?token=${token}&refreshToken=${refreshToken}&userId=${user._id}&name=${encodeURIComponent(`${user.firstName} ${user.lastName}`)}&role=user`);
    
  } catch (error) {
    console.error("Facebook callback error:", error);
    res.redirect('/dang-nhap?error=server_error');
  }
};

// Hàm đăng nhập bằng Facebook token
export const facebookTokenLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Thiếu access token"
      });
    }

    // Lấy thông tin từ Facebook bằng access token
    const fbResponse = await axios.get(`https://graph.facebook.com/v18.0/me`, {
      params: {
        fields: 'id,first_name,last_name,email,picture{url,width,height,is_silhouette}',
        access_token: accessToken
      }
    });

    if (!fbResponse.data || !fbResponse.data.id) {
      return res.status(401).json({
        success: false,
        message: "Không thể xác thực với Facebook"
      });
    }

    const { id, first_name, last_name, email, picture } = fbResponse.data;
    
    // Log thông tin nhận được từ Facebook
    console.log("Facebook data received:", { 
      id, 
      first_name, 
      last_name, 
      email: email || "No email provided by Facebook",
      hasPicture: !!picture 
    });
    
    // Lấy ảnh chất lượng cao hơn từ Facebook nếu có
    let profileImageUrl = '';
    if (picture && picture.data && !picture.data.is_silhouette) {
      try {
        // Thử lấy ảnh lớn hơn từ Facebook Graph API
        const pictureResponse = await axios.get(`https://graph.facebook.com/v18.0/${id}/picture`, {
          params: {
            type: 'large',
            redirect: 'false',
            access_token: accessToken
          }
        });
        
        if (pictureResponse.data && pictureResponse.data.data && pictureResponse.data.data.url) {
          profileImageUrl = pictureResponse.data.data.url;
          console.log("Retrieved larger Facebook profile image:", profileImageUrl);
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
      profileImageUrl = 'https://www.gravatar.com/avatar/?d=mp&s=256';
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
        phone: '0000000000', // Placeholder phone number
        firstName: first_name || 'Facebook',
        lastName: last_name || 'User',
        userName: uniqueUsername,
        password: hashedPassword,
        userImage: profileImageUrl,
        facebookId: id,
        authProvider: 'facebook'
      });
      
      await user.save();
    } else {
      // Cập nhật avatar nếu người dùng đã tồn tại
      if (profileImageUrl && profileImageUrl !== 'https://www.gravatar.com/avatar/?d=mp&s=256') {
        user.userImage = profileImageUrl;
        await user.save();
      }
    }
    
    // Kiểm tra nếu tài khoản bị chặn
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
      });
    }
    
    // Tạo tokens
    const token = jwt.sign(
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
    
    // Xóa refresh tokens cũ của user này trước khi tạo mới
    try {
      await RefreshToken.deleteMany({ userId: user._id, userModel: "User" });
      
      // Sau khi xóa tokens cũ, tạo token mới
      await RefreshToken.create({
        userId: user._id,
        userModel: "User",
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
        permissions: ["Xem"]
      },
      message: "Đăng nhập bằng Facebook thành công!"
    });
    
  } catch (error) {
    console.error("Facebook token login error:", error);
    res.status(500).json({
      success: false,
      message: "Đăng nhập bằng Facebook thất bại. Vui lòng thử lại."
    });
  }
};

// Endpoint to get user avatar
export const getUserAvatar = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log("Fetching avatar for user ID:", userId);
    
    const user = await User.findById(userId).select("userImage firstName lastName email authProvider facebookId");

    if (!user) {
      console.log("User not found for ID:", userId);
      return res.json({ userImage: 'https://www.gravatar.com/avatar/?d=mp&s=256' });
    }

    console.log("User found:", user.email, "- Image:", user.userImage);

    // Nếu người dùng đang sử dụng Facebook và không có ảnh đại diện
    if (user.authProvider === 'facebook' && (!user.userImage || user.userImage.includes('platform-lookaside.fbsbx.com'))) {
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
      return res.json({ userImage: 'https://www.gravatar.com/avatar/?d=mp&s=256' });
    }

    // If user has a userImage that is a URL, return the URL directly
    if (user.userImage && (user.userImage.startsWith('http://') || user.userImage.startsWith('https://'))) {
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
    return res.json({ userImage: 'https://www.gravatar.com/avatar/?d=mp&s=256' });
  } catch (error) {
    console.error("Error fetching user avatar:", error);
    return res.json({ userImage: 'https://www.gravatar.com/avatar/?d=mp&s=256' });
  }
};

// New controller function to provide VAPID public key
export const getVapidPublicKey = (req, res) => {
  try {
    console.log("[getVapidPublicKey] Đang lấy VAPID public key từ biến môi trường...");
    
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    console.log("[getVapidPublicKey] VAPID_PUBLIC_KEY:", vapidPublicKey ? "Found" : "Not found");
    
    if (!vapidPublicKey) {
      console.error("[getVapidPublicKey] VAPID Public Key not configured in environment variables");
      return res.status(500).json({ message: "VAPID Public Key not configured on server." });
    }
    
    // Log to confirm the key is valid (should be Base64 URL-safe encoded)
    const isValidBase64 = /^[A-Za-z0-9\-_]+=*$/.test(vapidPublicKey);
    console.log("[getVapidPublicKey] Key appears to be valid Base64:", isValidBase64);
    console.log("[getVapidPublicKey] Key length:", vapidPublicKey.length);
    
    console.log("[getVapidPublicKey] Returning VAPID public key to client");
    res.status(200).json({ vapidPublicKey: vapidPublicKey });
  } catch (error) {
    console.error("[getVapidPublicKey] Error providing VAPID Public Key:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Controller function to subscribe a user to push notifications
export const subscribeToPush = async (req, res) => {
  const subscription = req.body;
  const userId = req.user.id; // Get user ID from the token (assuming verifyToken middleware is used)

  console.log(`[subscribeToPush] Đang xử lý yêu cầu đăng ký thông báo cho user ${userId}`);
  console.log(`[subscribeToPush] Dữ liệu subscription:`, JSON.stringify(subscription, null, 2));

  if (!subscription || !subscription.endpoint) {
    console.error(`[subscribeToPush] Missing or invalid subscription object`);
    return res.status(400).json({ message: "Push subscription object is required." });
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      console.error(`[subscribeToPush] User not found: ${userId}`);
      return res.status(404).json({ message: "User not found." });
    }

    // Kiểm tra đã có pushSubscriptions array chưa
    if (!user.pushSubscriptions) {
      console.log(`[subscribeToPush] Initializing pushSubscriptions array for user: ${userId}`);
      user.pushSubscriptions = [];
    }

    // Kiểm tra xem subscription này đã tồn tại chưa
    const existingSubscription = user.pushSubscriptions.find(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (existingSubscription) {
      console.log(`[subscribeToPush] Subscription already exists for user: ${userId}`);
      console.log(`[subscribeToPush] Existing subscriptions count: ${user.pushSubscriptions.length}`);
      return res.status(200).json({ 
        message: "Subscription already exists.",
        subscriptionCount: user.pushSubscriptions.length
      });
    }

    // Kiểm tra tính hợp lệ của subscription
    if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      console.error(`[subscribeToPush] Invalid subscription object, missing required keys`);
      return res.status(400).json({ message: "Invalid subscription object. Missing required keys." });
    }

    // Add the new subscription to the user's pushSubscriptions array
    console.log(`[subscribeToPush] Adding new subscription for user: ${userId}`);
    user.pushSubscriptions.push(subscription);

    // Save the updated user document
    await user.save();
    console.log(`[subscribeToPush] Subscription saved successfully. Total subscriptions: ${user.pushSubscriptions.length}`);

    // Send a test notification
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
            type: "test_notification"
          }
        }
      };
      
      console.log(`[subscribeToPush] Sending test notification to new subscription`);
      await webpush.sendNotification(subscription, JSON.stringify(testPayload));
      console.log(`[subscribeToPush] Test notification sent successfully`);
    } catch (notificationError) {
      console.error(`[subscribeToPush] Error sending test notification:`, notificationError);
      // We don't want to fail the subscription if the test notification fails
    }

    res.status(201).json({ 
      message: "Push subscription saved successfully.",
      subscriptionCount: user.pushSubscriptions.length
    });
  } catch (error) {
    console.error(`[subscribeToPush] Error saving push subscription:`, error);
    res.status(500).json({ message: "Internal server error while saving subscription", error: error.message });
  }
};

// Validate Push Subscription
export const validateSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription) {
      return res.status(400).json({ 
        success: false,
        message: "Subscription data is required" 
      });
    }

    const webpush = require('web-push');
    
    // Configure web-push with VAPID keys
    webpush.setVapidDetails(
      'mailto:daninc.system@gmail.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    
    // Send a small test notification payload
    const testPayload = JSON.stringify({
      title: "Validation Test",
      body: "This is a test to validate your subscription",
      silent: true
    });
    
    try {
      // Try to send a notification to check if the subscription is valid
      await webpush.sendNotification(subscription, testPayload);
      return res.status(200).json({ 
        success: true,
        valid: true,
        message: "Subscription is valid" 
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
          error: error.body || error.message
        });
      } else if (error.statusCode === 400) {
        // Bad request - Invalid subscription
        return res.status(200).json({ 
          success: true,
          valid: false,
          message: "Invalid subscription format",
          error: error.body || error.message
        });
      } else {
        // Other errors
        return res.status(200).json({ 
          success: true,
          valid: false,
          message: "Error validating subscription",
          error: error.body || error.message
        });
      }
    }
  } catch (error) {
    console.error("Validate subscription error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error while validating subscription" 
    });
  }
};
