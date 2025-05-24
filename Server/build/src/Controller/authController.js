"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.validateSubscription = exports.updateUserAddress = exports.updateUser = exports.subscribeToPush = exports.setDefaultAddress = exports.resetPassword = exports.requestPasswordReset = exports.register = exports.refreshToken = exports.migrateAllLegacyAddresses = exports.logout = exports.login = exports.googleLogin = exports.getVapidPublicKey = exports.getUserProfile = exports.getUserAvatar = exports.getUserAddresses = exports.getAllUser = exports.facebookTokenLogin = exports.facebookLogin = exports.facebookCallback = exports.deleteUserAddress = exports.blockUser = exports.addUserAddress = void 0;

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _bcryptjs = _interopRequireDefault(require("bcryptjs"));
var _Register = _interopRequireDefault(require("../Model/Register.js"));
var _RefreshToken = _interopRequireDefault(require("../Model/RefreshToken.js"));
var _otpUntil = require("../utils/otp.until.js");
var _emailService = require("../Services/email.service.js");
var _adminModel = _interopRequireDefault(require("../Model/adminModel.js"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _googleAuthLibrary = require("google-auth-library");
var _axios = _interopRequireDefault(require("axios"));
var _webPush = _interopRequireDefault(require("web-push"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} /* eslint-disable no-undef */ /* eslint-disable no-unused-vars */

// Load environment variables
_dotenv.default.config();

// Fallback secret keys in case environment variables aren't set
const JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS || "a5e2c2e7-bf3a-4aa1-b5e2-eab36d9db2ea";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5d6f7e8c9d0a1b2";

// Google OAuth client
const googleClient = new _googleAuthLibrary.OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res) => {
  try {
    const {
      email,
      phone,
      firstName,
      lastName,
      userName,
      password,
      address,
      userImage
    } = req.body;

    // Kiểm tra email đã tồn tại
    const existingEmail = await _Register.default.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Kiểm tra username đã tồn tại
    const existingUsername = await _Register.default.findOne({ userName });
    if (existingUsername) {
      return res.status(400).json({ message: "Tên đăng nhập đã được sử dụng" });
    }

    // Băm mật khẩu
    const hashedPassword = await _bcryptjs.default.hash(password, 10);

    // Tạo user mới
    const newUser = new _Register.default({
      email,
      phone,
      firstName,
      lastName,
      userName,
      password: hashedPassword,
      address,
      userImage
    });

    // Lưu user vào database
    await newUser.save();

    // Tạo refresh token với secret key từ biến môi trường
    const refreshToken = _jsonwebtoken.default.sign(
      { id: newUser._id },
      process.env.JWT_REFRESH_SECRET || "SECRET_REFRESH", // Fallback nếu không có biến môi trường
      { expiresIn: "7d" }
    );

    // Lưu refresh token vào database với thời gian hết hạn
    await _RefreshToken.default.create({
      userId: newUser._id,
      userModel: "User",
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 ngày
    });

    // Tạo access token cho người dùng mới
    const accessToken = _jsonwebtoken.default.sign(
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
};exports.register = register;

const login = async (req, res) => {
  try {
    const { username, userName, user_name, password } = req.body;

    // Normalize username variants (database might have either username or userName)
    const usernameToUse = username || userName || user_name;

    if (!usernameToUse || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tên người dùng và mật khẩu"
      });
    }

    const foundUser = await _Register.default.findOne({
      $or: [
      { userName: usernameToUse },
      { username: usernameToUse },
      { email: usernameToUse }]

    });

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại"
      });
    }

    if (foundUser.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
      });
    }

    const isPasswordValid = await _bcryptjs.default.compare(password, foundUser.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu không đúng"
      });
    }

    const accessToken = _jsonwebtoken.default.sign(
      {
        id: foundUser._id,
        role: "user",
        permissions: ["Xem"]
      },
      process.env.JWT_SECRET_ACCESS,
      { expiresIn: "1d" }
    );

    // Generate refresh token with extended expiry
    const refreshToken = _jsonwebtoken.default.sign(
      { id: foundUser._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Xóa refresh tokens cũ của user này trước khi tạo mới
    try {
      await _RefreshToken.default.deleteMany({ userId: foundUser._id, userModel: "User" });

      // Sau khi xóa tokens cũ, tạo token mới
      await _RefreshToken.default.create({
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
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi đăng nhập: " + error.message
    });
  }
};exports.login = login;

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    // Verify refresh token
    const decoded = _jsonwebtoken.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token exists in database
    const storedToken = await _RefreshToken.default.findOne({
      token: refreshToken,
      userId: decoded.id
    });

    if (!storedToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Find user (either User or Admin)
    let user =
    (await _Register.default.findById(decoded.id)) || (await _adminModel.default.findById(decoded.id));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new access token
    const newAccessToken = _jsonwebtoken.default.sign(
      {
        id: user._id,
        role: user.role,
        permissions: user.permissions || []
      },
      process.env.JWT_SECRET_ACCESS,
      { expiresIn: "1h" }
    );

    res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // Remove expired refresh token from database
      await _RefreshToken.default.findOneAndDelete({ token: refreshToken });
      return res.status(403).json({ message: "Refresh token expired" });
    }
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};exports.refreshToken = refreshToken;

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    await _RefreshToken.default.findOneAndDelete({ token: refreshToken });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Migrate single address to addresses array
exports.logout = logout;const migrateLegacyAddress = async (user) => {
  try {
    // Check if addresses array is empty but legacy address exists
    if ((!user.addresses || user.addresses.length === 0) && user.address) {
      console.log(`Migrating legacy address for user: ${user._id}`);

      // Create new address object from legacy fields
      const newAddress = {
        fullAddress: user.fullAddress || user.address,
        houseNumber: user.houseNumber || '',
        ward: user.ward || '',
        district: user.district || '',
        province: user.province || '',
        coordinates: user.coordinates || {},
        isDefault: true,
        label: "Nhà",
        receiverName: `${user.firstName} ${user.lastName}`,
        receiverPhone: user.phone
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
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    let user = await _Register.default.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Migrate legacy address if needed
    user = await migrateLegacyAddress(user);

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};exports.getUserProfile = getUserProfile;

const getAllUser = async (req, res) => {
  try {
    const user = await _Register.default.find();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};exports.getAllUser = getAllUser;

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword, firstName, lastName, phone, address, userImage } = req.body;

    console.log("Updating user profile:", userId);
    console.log("Request body:", req.body);

    const user = await _Register.default.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    // Xử lý cập nhật mật khẩu nếu có
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp mật khẩu hiện tại"
        });
      }

      const isMatch = await _bcryptjs.default.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Mật khẩu hiện tại không chính xác"
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới phải có ít nhất 8 ký tự"
        });
      }
      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới cần ít nhất 1 chữ hoa"
        });
      }
      if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới cần ít nhất 1 chữ số"
        });
      }
      if (!/[!@#$%^&*]/.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới cần ít nhất 1 ký tự đặc biệt"
        });
      }

      const salt = await _bcryptjs.default.genSalt(10);
      user.password = await _bcryptjs.default.hash(newPassword, salt);
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
      }
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật thông tin",
      error: err.message
    });
  }
};exports.updateUser = updateUser;

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await _Register.default.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email chưa được đăng ký trong hệ thống"
      });
    }
    const otp = (0, _otpUntil.generateOTP)();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordToken = otp;
    user.resetPasswordExpires = otpExpires;
    await user.save();

    await (0, _emailService.sendOTPEmail)(email, otp);

    res.status(200).json({
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn"
    });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý yêu cầu"
    });
  }
};exports.requestPasswordReset = requestPasswordReset;

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết"
      });
    }

    // Tìm người dùng dựa trên email và OTP hợp lệ
    const user = await _Register.default.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() } // OTP còn hạn sử dụng
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Mã OTP không hợp lệ hoặc đã hết hạn"
      });
    }

    // Kiểm tra độ mạnh của mật khẩu mới
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 8 ký tự"
      });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới cần ít nhất 1 chữ hoa"
      });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.
      status(400).
      json({ success: false, message: "Mật khẩu mới cần ít nhất 1 chữ số" });
    }
    if (!/[!@#$%^&*]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới cần ít nhất 1 ký tự đặc biệt"
      });
    }

    // Hash mật khẩu mới
    const salt = await _bcryptjs.default.genSalt(10);
    user.password = await _bcryptjs.default.hash(newPassword, salt);

    // Xóa OTP sau khi sử dụng
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đặt lại mật khẩu"
    });
  }
};

// Xử lý chặn/bỏ chặn người dùng
exports.resetPassword = resetPassword;const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    if (isBlocked === undefined) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin trạng thái chặn người dùng"
      });
    }

    const user = await _Register.default.findById(userId);
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
exports.blockUser = blockUser;const facebookLogin = async (req, res) => {
  try {
    const { accessToken, userID } = req.body;

    if (!accessToken || !userID) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin xác thực từ Facebook"
      });
    }

    // Xác thực token Facebook bằng cách gọi API của Facebook
    const fbResponse = await _axios.default.get(`https://graph.facebook.com/v18.0/${userID}`, {
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
    let user = await _Register.default.findOne({ facebookId: id });

    // Nếu user không tồn tại nhưng email đã tồn tại, liên kết tài khoản đó
    if (!user && email) {
      user = await _Register.default.findOne({ email });
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
      const hashedPassword = await _bcryptjs.default.hash(randomPassword, 10);

      // Use default avatar instead of Facebook profile pic
      const profileImageUrl = ''; // Don't store Facebook profile URL

      user = new _Register.default({
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
    const token = _jsonwebtoken.default.sign(
      {
        id: user._id,
        role: "user",
        permissions: ["Xem"]
      },
      process.env.JWT_SECRET_ACCESS,
      { expiresIn: "1d" }
    );

    const refreshToken = _jsonwebtoken.default.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Lưu refresh token
    await _RefreshToken.default.create({
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
exports.facebookLogin = facebookLogin;const googleLogin = async (req, res) => {
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
      let user = await _Register.default.findOne({ googleId: sub });

      // Nếu user không tồn tại nhưng email đã tồn tại, liên kết tài khoản đó
      if (!user && email) {
        user = await _Register.default.findOne({ email });
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
        const hashedPassword = await _bcryptjs.default.hash(randomPassword, 10);

        user = new _Register.default({
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
      const token = _jsonwebtoken.default.sign(
        {
          id: user._id,
          role: "user",
          permissions: ["Xem"]
        },
        process.env.JWT_SECRET_ACCESS,
        { expiresIn: "1d" }
      );

      const refreshToken = _jsonwebtoken.default.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      // Lưu refresh token
      await _RefreshToken.default.create({
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
exports.googleLogin = googleLogin;const facebookCallback = async (req, res) => {
  try {
    // Code from authentication callback
    const { code } = req.query;

    if (!code) {
      return res.redirect('/dang-nhap?error=no_code');
    }

    // Exchange code for access token
    const tokenResponse = await _axios.default.get('https://graph.facebook.com/oauth/access_token', {
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
    const userDataResponse = await _axios.default.get('https://graph.facebook.com/me', {
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
    let user = await _Register.default.findOne({ facebookId: id });

    // If user not found but we have an email, look for user with that email
    if (!user && email) {
      user = await _Register.default.findOne({ email });

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
      const hashedPassword = await _bcryptjs.default.hash(randomPassword, 10);

      // Use default avatar instead of Facebook image
      const profileImageUrl = '';

      user = new _Register.default({
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
    const token = _jsonwebtoken.default.sign(
      {
        id: user._id,
        role: "user",
        permissions: ["Xem"]
      },
      process.env.JWT_SECRET_ACCESS,
      { expiresIn: "1d" }
    );

    const refreshToken = _jsonwebtoken.default.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Xóa refresh tokens cũ của user này trước khi tạo mới
    try {
      await _RefreshToken.default.deleteMany({ userId: user._id, userModel: "User" });

      // Sau khi xóa tokens cũ, tạo token mới
      await _RefreshToken.default.create({
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
exports.facebookCallback = facebookCallback;const facebookTokenLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Thiếu access token"
      });
    }

    // Lấy thông tin từ Facebook bằng access token
    const fbResponse = await _axios.default.get(`https://graph.facebook.com/v18.0/me`, {
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
        const pictureResponse = await _axios.default.get(`https://graph.facebook.com/v18.0/${id}/picture`, {
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
    let user = await _Register.default.findOne({ facebookId: id });

    // Nếu không tìm thấy theo facebookId và có email, thử tìm theo email
    if (!user && email) {
      user = await _Register.default.findOne({ email });
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
      const hashedPassword = await _bcryptjs.default.hash(randomPassword, 10);

      // Tạo email giả nếu không có email từ Facebook
      const userEmail = email || `${uniqueUsername}@facebook.user`;

      user = new _Register.default({
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
    const token = _jsonwebtoken.default.sign(
      {
        id: user._id,
        role: "user",
        permissions: ["Xem"]
      },
      process.env.JWT_SECRET_ACCESS,
      { expiresIn: "1d" }
    );

    const refreshToken = _jsonwebtoken.default.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Xóa refresh tokens cũ của user này trước khi tạo mới
    try {
      await _RefreshToken.default.deleteMany({ userId: user._id, userModel: "User" });

      // Sau khi xóa tokens cũ, tạo token mới
      await _RefreshToken.default.create({
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
exports.facebookTokenLogin = facebookTokenLogin;const getUserAvatar = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log("Fetching avatar for user ID:", userId);

    const user = await _Register.default.findById(userId).select("userImage firstName lastName email authProvider facebookId");

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
exports.getUserAvatar = getUserAvatar;const getVapidPublicKey = (req, res) => {
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
exports.getVapidPublicKey = getVapidPublicKey;const subscribeToPush = async (req, res) => {
  const subscription = req.body;
  const userId = req.user.id;

  console.log(`[subscribeToPush] Đang xử lý yêu cầu đăng ký thông báo cho user ${userId}`);
  console.log(`[subscribeToPush] Dữ liệu subscription:`, JSON.stringify(subscription, null, 2));

  if (!subscription || !subscription.endpoint) {
    console.error(`[subscribeToPush] Missing or invalid subscription object`);
    return res.status(400).json({ message: "Push subscription object is required." });
  }

  try {
    // Set timeout for MongoDB operations
    const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Database operation timed out')), 5000)
    );

    // Find user with timeout
    const userPromise = _Register.default.findById(userId);
    const user = await Promise.race([userPromise, timeoutPromise]);

    if (!user) {
      console.error(`[subscribeToPush] User not found: ${userId}`);
      return res.status(404).json({ message: "User not found." });
    }

    // Initialize pushSubscriptions array if not exists
    if (!user.pushSubscriptions) {
      console.log(`[subscribeToPush] Initializing pushSubscriptions array for user: ${userId}`);
      user.pushSubscriptions = [];
    }

    // Check for existing subscription
    const existingSubscription = user.pushSubscriptions.find(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (existingSubscription) {
      console.log(`[subscribeToPush] Subscription already exists for user: ${userId}`);
      return res.status(200).json({
        message: "Subscription already exists.",
        subscriptionCount: user.pushSubscriptions.length
      });
    }

    // Validate subscription
    if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      console.error(`[subscribeToPush] Invalid subscription object, missing required keys`);
      return res.status(400).json({ message: "Invalid subscription object. Missing required keys." });
    }

    // Add new subscription
    console.log(`[subscribeToPush] Adding new subscription for user: ${userId}`);
    user.pushSubscriptions.push(subscription);

    // Save with timeout
    const savePromise = user.save();
    await Promise.race([savePromise, timeoutPromise]);

    console.log(`[subscribeToPush] Subscription saved successfully. Total subscriptions: ${user.pushSubscriptions.length}`);

    // Send response immediately after saving
    res.status(201).json({
      message: "Push subscription saved successfully.",
      subscriptionCount: user.pushSubscriptions.length
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
            type: "test_notification"
          }
        }
      };

      // Add retry logic for sending notification
      let retries = 3;
      while (retries > 0) {
        try {
          console.log(`[subscribeToPush] Sending test notification to new subscription (attempt ${4 - retries}/3)`);
          await _webPush.default.sendNotification(subscription, JSON.stringify(testPayload));
          console.log(`[subscribeToPush] Test notification sent successfully`);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error(`[subscribeToPush] Failed to send test notification after 3 attempts:`, error);
          } else {
            console.log(`[subscribeToPush] Retrying test notification...`);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
          }
        }
      }
    } catch (notificationError) {
      console.error(`[subscribeToPush] Error in test notification process:`, notificationError);
      // Don't throw error since we already sent success response
    }
  } catch (error) {
    console.error(`[subscribeToPush] Error saving push subscription:`, error);
    res.status(500).json({
      message: "Internal server error while saving subscription",
      error: error.message
    });
  }
};

// Validate Push Subscription
exports.subscribeToPush = subscribeToPush;const validateSubscription = async (req, res) => {
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

// Tạo/cập nhật địa chỉ mặc định đơn lẻ từ mảng địa chỉ cho tính tương thích ngược
exports.validateSubscription = validateSubscription;const updateDefaultAddressForBackwardCompatibility = async (userId) => {
  try {
    console.log(`[updateDefaultAddressForBackwardCompatibility] Updating legacy address for user ${userId}`);

    const user = await _Register.default.findById(userId);
    if (!user) {
      console.log(`[updateDefaultAddressForBackwardCompatibility] User not found: ${userId}`);
      return;
    }

    // Tìm địa chỉ mặc định trong mảng
    const defaultAddress = user.addresses.find((addr) => addr.isDefault === true);

    if (defaultAddress) {
      console.log(`[updateDefaultAddressForBackwardCompatibility] Found default address: ${defaultAddress.fullAddress}`);

      // Cập nhật trường address legacy - đảm bảo không phải undefined
      user.address = defaultAddress.fullAddress || '';

      // Cập nhật các trường riêng lẻ cho địa chỉ (nếu có)
      user.houseNumber = defaultAddress.houseNumber || '';
      user.ward = defaultAddress.ward || '';
      user.district = defaultAddress.district || '';
      user.province = defaultAddress.province || '';

      // Sao chép tọa độ nếu có
      if (defaultAddress.coordinates && defaultAddress.coordinates.lat && defaultAddress.coordinates.lng) {
        user.coordinates = {
          lat: defaultAddress.coordinates.lat,
          lng: defaultAddress.coordinates.lng
        };
      }

      // Đảm bảo fullAddress được cập nhật
      user.fullAddress = defaultAddress.fullAddress || '';

      // Đánh dấu là đã sửa đổi để đảm bảo mongoose cập nhật
      user.markModified('address');
      user.markModified('coordinates');

      await user.save();
      console.log(`[updateDefaultAddressForBackwardCompatibility] Updated legacy address fields for user ${userId}`);
    } else {
      console.log(`[updateDefaultAddressForBackwardCompatibility] No default address found for user ${userId}`);
    }
  } catch (error) {
    console.error(`[updateDefaultAddressForBackwardCompatibility] Error updating legacy address:`, error);
  }
};

// Thêm địa chỉ mới
const addUserAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    const addressData = req.body;

    if (!addressData.fullAddress) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp địa chỉ đầy đủ"
      });
    }

    const user = await _Register.default.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
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
      addresses: user.addresses
    });
  } catch (error) {
    console.error("Lỗi khi thêm địa chỉ:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi thêm địa chỉ",
      error: error.message
    });
  }
};

// Lấy tất cả địa chỉ của người dùng
exports.addUserAddress = addUserAddress;const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;

    let user = await _Register.default.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    // Migrate legacy address if needed
    user = await migrateLegacyAddress(user);

    res.status(200).json({
      success: true,
      addresses: user.addresses || []
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách địa chỉ:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách địa chỉ",
      error: error.message
    });
  }
};

// Cập nhật địa chỉ
exports.getUserAddresses = getUserAddresses;const updateUserAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const updatedData = req.body;

    const user = await _Register.default.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    // Tìm địa chỉ cần cập nhật
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa chỉ"
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
      addresses: user.addresses
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật địa chỉ:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật địa chỉ",
      error: error.message
    });
  }
};

// Xóa địa chỉ
exports.updateUserAddress = updateUserAddress;const deleteUserAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const user = await _Register.default.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    // Tìm địa chỉ cần xóa
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa chỉ"
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
      addresses: user.addresses
    });
  } catch (error) {
    console.error("Lỗi khi xóa địa chỉ:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa địa chỉ",
      error: error.message
    });
  }
};

// Đặt địa chỉ mặc định
exports.deleteUserAddress = deleteUserAddress;const setDefaultAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    console.log(`[setDefaultAddress] Setting address ${addressId} as default for user ${userId}`);

    const user = await _Register.default.findById(userId);
    if (!user) {
      console.log(`[setDefaultAddress] User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    // Kiểm tra xem địa chỉ có tồn tại không
    const addressExists = user.addresses.some((addr) => addr._id.toString() === addressId);
    if (!addressExists) {
      console.log(`[setDefaultAddress] Address not found: ${addressId}`);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa chỉ"
      });
    }

    // Đặt tất cả địa chỉ thành không mặc định, sau đó đặt địa chỉ được chọn thành mặc định
    user.addresses.forEach((addr) => {
      const isSelected = addr._id.toString() === addressId;
      addr.isDefault = isSelected;

      if (isSelected) {
        console.log(`[setDefaultAddress] Setting address as default: ${addr.fullAddress}`);
      }
    });

    // Đánh dấu mảng addresses đã được sửa đổi để đảm bảo mongoose cập nhật
    user.markModified('addresses');

    // Lưu thay đổi trước khi cập nhật tương thích ngược
    await user.save();

    // Cập nhật trường address cũ
    await updateDefaultAddressForBackwardCompatibility(userId);

    res.status(200).json({
      success: true,
      message: "Đặt địa chỉ mặc định thành công",
      addresses: user.addresses
    });
  } catch (error) {
    console.error(`[setDefaultAddress] Error setting default address:`, error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đặt địa chỉ mặc định",
      error: error.message
    });
  }
};

// Admin endpoint to migrate all legacy addresses
exports.setDefaultAddress = setDefaultAddress;const migrateAllLegacyAddresses = async (req, res) => {
  try {
    // Kiểm tra quyền admin (thực tế nên sử dụng middleware)
    if (!req.user || !req.user.role || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thực hiện chức năng này"
      });
    }

    // Lấy tất cả user có địa chỉ cũ
    const users = await _Register.default.find({
      address: { $exists: true, $ne: "" },
      $or: [
      { addresses: { $exists: false } },
      { addresses: { $size: 0 } }]

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
      errors: errorCount
    });
  } catch (error) {
    console.error("Lỗi khi di chuyển dữ liệu địa chỉ:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi di chuyển dữ liệu địa chỉ",
      error: error.message
    });
  }
};exports.migrateAllLegacyAddresses = migrateAllLegacyAddresses;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfanNvbndlYnRva2VuIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfYmNyeXB0anMiLCJfUmVnaXN0ZXIiLCJfUmVmcmVzaFRva2VuIiwiX290cFVudGlsIiwiX2VtYWlsU2VydmljZSIsIl9hZG1pbk1vZGVsIiwiX2RvdGVudiIsIl9nb29nbGVBdXRoTGlicmFyeSIsIl9heGlvcyIsIl93ZWJQdXNoIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiZG90ZW52IiwiY29uZmlnIiwiSldUX1NFQ1JFVF9BQ0NFU1MiLCJwcm9jZXNzIiwiZW52IiwiSldUX1JFRlJFU0hfU0VDUkVUIiwiZ29vZ2xlQ2xpZW50IiwiT0F1dGgyQ2xpZW50IiwiR09PR0xFX0NMSUVOVF9JRCIsInJlZ2lzdGVyIiwicmVxIiwicmVzIiwiZW1haWwiLCJwaG9uZSIsImZpcnN0TmFtZSIsImxhc3ROYW1lIiwidXNlck5hbWUiLCJwYXNzd29yZCIsImFkZHJlc3MiLCJ1c2VySW1hZ2UiLCJib2R5IiwiZXhpc3RpbmdFbWFpbCIsIlVzZXIiLCJmaW5kT25lIiwic3RhdHVzIiwianNvbiIsIm1lc3NhZ2UiLCJleGlzdGluZ1VzZXJuYW1lIiwiaGFzaGVkUGFzc3dvcmQiLCJiY3J5cHQiLCJoYXNoIiwibmV3VXNlciIsInNhdmUiLCJyZWZyZXNoVG9rZW4iLCJqd3QiLCJzaWduIiwiaWQiLCJfaWQiLCJleHBpcmVzSW4iLCJSZWZyZXNoVG9rZW4iLCJjcmVhdGUiLCJ1c2VySWQiLCJ1c2VyTW9kZWwiLCJ0b2tlbiIsImV4cGlyZXNBdCIsIkRhdGUiLCJub3ciLCJhY2Nlc3NUb2tlbiIsInJvbGUiLCJwZXJtaXNzaW9ucyIsInN1Y2Nlc3MiLCJmdWxsTmFtZSIsImVycm9yIiwiY29uc29sZSIsImV4cG9ydHMiLCJsb2dpbiIsInVzZXJuYW1lIiwidXNlcl9uYW1lIiwidXNlcm5hbWVUb1VzZSIsImZvdW5kVXNlciIsIiRvciIsImlzQmxvY2tlZCIsImlzUGFzc3dvcmRWYWxpZCIsImNvbXBhcmUiLCJkZWxldGVNYW55IiwidG9rZW5FcnJvciIsImxhc3RMb2dpbiIsInVzZXIiLCJkZWNvZGVkIiwidmVyaWZ5Iiwic3RvcmVkVG9rZW4iLCJmaW5kQnlJZCIsIkFkbWluIiwibmV3QWNjZXNzVG9rZW4iLCJuYW1lIiwiZmluZE9uZUFuZERlbGV0ZSIsImxvZ291dCIsIm1pZ3JhdGVMZWdhY3lBZGRyZXNzIiwiYWRkcmVzc2VzIiwibGVuZ3RoIiwibG9nIiwibmV3QWRkcmVzcyIsImZ1bGxBZGRyZXNzIiwiaG91c2VOdW1iZXIiLCJ3YXJkIiwiZGlzdHJpY3QiLCJwcm92aW5jZSIsImNvb3JkaW5hdGVzIiwiaXNEZWZhdWx0IiwibGFiZWwiLCJyZWNlaXZlck5hbWUiLCJyZWNlaXZlclBob25lIiwiZ2V0VXNlclByb2ZpbGUiLCJwYXJhbXMiLCJzZWxlY3QiLCJnZXRBbGxVc2VyIiwiZmluZCIsInVwZGF0ZVVzZXIiLCJjdXJyZW50UGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsImlzTWF0Y2giLCJ0ZXN0Iiwic2FsdCIsImdlblNhbHQiLCJ1bmRlZmluZWQiLCJlcnIiLCJyZXF1ZXN0UGFzc3dvcmRSZXNldCIsIm90cCIsImdlbmVyYXRlT1RQIiwib3RwRXhwaXJlcyIsInJlc2V0UGFzc3dvcmRUb2tlbiIsInJlc2V0UGFzc3dvcmRFeHBpcmVzIiwic2VuZE9UUEVtYWlsIiwicmVzZXRQYXNzd29yZCIsIiRndCIsImJsb2NrVXNlciIsImZhY2Vib29rTG9naW4iLCJ1c2VySUQiLCJmYlJlc3BvbnNlIiwiYXhpb3MiLCJnZXQiLCJmaWVsZHMiLCJhY2Nlc3NfdG9rZW4iLCJkYXRhIiwiZmlyc3RfbmFtZSIsImxhc3RfbmFtZSIsInBpY3R1cmUiLCJmYWNlYm9va0lkIiwiYXV0aFByb3ZpZGVyIiwidW5pcXVlVXNlcm5hbWUiLCJ0b1N0cmluZyIsInNsaWNlIiwicmFuZG9tUGFzc3dvcmQiLCJNYXRoIiwicmFuZG9tIiwicHJvZmlsZUltYWdlVXJsIiwiZ29vZ2xlTG9naW4iLCJjcmVkZW50aWFsIiwidGlja2V0IiwidmVyaWZ5SWRUb2tlbiIsImlkVG9rZW4iLCJhdWRpZW5jZSIsInBheWxvYWQiLCJnZXRQYXlsb2FkIiwic3ViIiwiZ2l2ZW5fbmFtZSIsImZhbWlseV9uYW1lIiwiZ29vZ2xlSWQiLCJmYWNlYm9va0NhbGxiYWNrIiwiY29kZSIsInF1ZXJ5IiwicmVkaXJlY3QiLCJ0b2tlblJlc3BvbnNlIiwiY2xpZW50X2lkIiwiRkFDRUJPT0tfQVBQX0lEIiwiY2xpZW50X3NlY3JldCIsIkZBQ0VCT09LX0FQUF9TRUNSRVQiLCJyZWRpcmVjdF91cmkiLCJGQUNFQk9PS19DQUxMQkFDS19VUkwiLCJ1c2VyRGF0YVJlc3BvbnNlIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiZmFjZWJvb2tUb2tlbkxvZ2luIiwiaGFzUGljdHVyZSIsImlzX3NpbGhvdWV0dGUiLCJwaWN0dXJlUmVzcG9uc2UiLCJ0eXBlIiwidXJsIiwicGljdHVyZUVycm9yIiwidXNlckVtYWlsIiwiZ2V0VXNlckF2YXRhciIsImluY2x1ZGVzIiwiZmJBdmF0YXJVcmwiLCJmYkVycm9yIiwic3RhcnRzV2l0aCIsInNlbmRGaWxlIiwicm9vdCIsImN3ZCIsImdldFZhcGlkUHVibGljS2V5IiwidmFwaWRQdWJsaWNLZXkiLCJWQVBJRF9QVUJMSUNfS0VZIiwiaXNWYWxpZEJhc2U2NCIsInN1YnNjcmliZVRvUHVzaCIsInN1YnNjcmlwdGlvbiIsIkpTT04iLCJzdHJpbmdpZnkiLCJlbmRwb2ludCIsInRpbWVvdXRQcm9taXNlIiwiUHJvbWlzZSIsIl8iLCJyZWplY3QiLCJzZXRUaW1lb3V0IiwiRXJyb3IiLCJ1c2VyUHJvbWlzZSIsInJhY2UiLCJwdXNoU3Vic2NyaXB0aW9ucyIsImV4aXN0aW5nU3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uQ291bnQiLCJrZXlzIiwicDI1NmRoIiwiYXV0aCIsInB1c2giLCJzYXZlUHJvbWlzZSIsInRlc3RQYXlsb2FkIiwibm90aWZpY2F0aW9uIiwidGl0bGUiLCJpY29uIiwidmlicmF0ZSIsImRhdGVPZkFycml2YWwiLCJwcmltYXJ5S2V5IiwicmV0cmllcyIsIndlYnB1c2giLCJzZW5kTm90aWZpY2F0aW9uIiwicmVzb2x2ZSIsIm5vdGlmaWNhdGlvbkVycm9yIiwidmFsaWRhdGVTdWJzY3JpcHRpb24iLCJzZXRWYXBpZERldGFpbHMiLCJWQVBJRF9QUklWQVRFX0tFWSIsInNpbGVudCIsInZhbGlkIiwic3RhdHVzQ29kZSIsInVwZGF0ZURlZmF1bHRBZGRyZXNzRm9yQmFja3dhcmRDb21wYXRpYmlsaXR5IiwiZGVmYXVsdEFkZHJlc3MiLCJhZGRyIiwibGF0IiwibG5nIiwibWFya01vZGlmaWVkIiwiYWRkVXNlckFkZHJlc3MiLCJhZGRyZXNzRGF0YSIsImZvckVhY2giLCJnZXRVc2VyQWRkcmVzc2VzIiwidXBkYXRlVXNlckFkZHJlc3MiLCJhZGRyZXNzSWQiLCJ1cGRhdGVkRGF0YSIsImFkZHJlc3NJbmRleCIsImZpbmRJbmRleCIsIk9iamVjdCIsImtleSIsImRlbGV0ZVVzZXJBZGRyZXNzIiwic3BsaWNlIiwic2V0RGVmYXVsdEFkZHJlc3MiLCJhZGRyZXNzRXhpc3RzIiwic29tZSIsImlzU2VsZWN0ZWQiLCJtaWdyYXRlQWxsTGVnYWN5QWRkcmVzc2VzIiwidXNlcnMiLCIkZXhpc3RzIiwiJG5lIiwiJHNpemUiLCJtaWdyYXRlZENvdW50Iiwic2tpcHBlZENvdW50IiwiZXJyb3JDb3VudCIsInRvdGFsIiwibWlncmF0ZWQiLCJza2lwcGVkIiwiZXJyb3JzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL0NvbnRyb2xsZXIvYXV0aENvbnRyb2xsZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG5pbXBvcnQgand0IGZyb20gXCJqc29ud2VidG9rZW5cIjtcbmltcG9ydCBiY3J5cHQgZnJvbSBcImJjcnlwdGpzXCI7XG5pbXBvcnQgVXNlciBmcm9tIFwiLi4vTW9kZWwvUmVnaXN0ZXIuanNcIjtcbmltcG9ydCBSZWZyZXNoVG9rZW4gZnJvbSBcIi4uL01vZGVsL1JlZnJlc2hUb2tlbi5qc1wiO1xuaW1wb3J0IHsgZ2VuZXJhdGVPVFAgfSBmcm9tIFwiLi4vdXRpbHMvb3RwLnVudGlsLmpzXCI7XG5pbXBvcnQgeyBzZW5kT1RQRW1haWwgfSBmcm9tIFwiLi4vU2VydmljZXMvZW1haWwuc2VydmljZS5qc1wiO1xuaW1wb3J0IEFkbWluIGZyb20gXCIuLi9Nb2RlbC9hZG1pbk1vZGVsLmpzXCI7XG5pbXBvcnQgZG90ZW52IGZyb20gXCJkb3RlbnZcIjtcbmltcG9ydCB7IE9BdXRoMkNsaWVudCB9IGZyb20gJ2dvb2dsZS1hdXRoLWxpYnJhcnknO1xuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCB3ZWJwdXNoIGZyb20gJ3dlYi1wdXNoJztcblxuLy8gTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbmRvdGVudi5jb25maWcoKTtcblxuLy8gRmFsbGJhY2sgc2VjcmV0IGtleXMgaW4gY2FzZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgYXJlbid0IHNldFxuY29uc3QgSldUX1NFQ1JFVF9BQ0NFU1MgPSBwcm9jZXNzLmVudi5KV1RfU0VDUkVUX0FDQ0VTUyB8fCBcImE1ZTJjMmU3LWJmM2EtNGFhMS1iNWUyLWVhYjM2ZDlkYjJlYVwiO1xuY29uc3QgSldUX1JFRlJFU0hfU0VDUkVUID0gcHJvY2Vzcy5lbnYuSldUX1JFRlJFU0hfU0VDUkVUIHx8IFwiN2Y4ZTlkMGMxYjJhM2Y0ZTVkNmM3YjhhOWYwZTFkMmMzYjRhNWQ2ZjdlOGM5ZDBhMWIyXCI7XG5cbi8vIEdvb2dsZSBPQXV0aCBjbGllbnRcbmNvbnN0IGdvb2dsZUNsaWVudCA9IG5ldyBPQXV0aDJDbGllbnQocHJvY2Vzcy5lbnYuR09PR0xFX0NMSUVOVF9JRCk7XG5cbmV4cG9ydCBjb25zdCByZWdpc3RlciA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHtcbiAgICAgIGVtYWlsLFxuICAgICAgcGhvbmUsXG4gICAgICBmaXJzdE5hbWUsXG4gICAgICBsYXN0TmFtZSxcbiAgICAgIHVzZXJOYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBhZGRyZXNzLFxuICAgICAgdXNlckltYWdlLFxuICAgIH0gPSByZXEuYm9keTtcblxuICAgIC8vIEtp4buDbSB0cmEgZW1haWwgxJHDoyB04buTbiB04bqhaVxuICAgIGNvbnN0IGV4aXN0aW5nRW1haWwgPSBhd2FpdCBVc2VyLmZpbmRPbmUoeyBlbWFpbCB9KTtcbiAgICBpZiAoZXhpc3RpbmdFbWFpbCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgbWVzc2FnZTogXCJFbWFpbCDEkcOjIMSRxrDhu6NjIHPhu60gZOG7pW5nXCIgfSk7XG4gICAgfVxuXG4gICAgLy8gS2nhu4NtIHRyYSB1c2VybmFtZSDEkcOjIHThu5NuIHThuqFpXG4gICAgY29uc3QgZXhpc3RpbmdVc2VybmFtZSA9IGF3YWl0IFVzZXIuZmluZE9uZSh7IHVzZXJOYW1lIH0pO1xuICAgIGlmIChleGlzdGluZ1VzZXJuYW1lKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBtZXNzYWdlOiBcIlTDqm4gxJHEg25nIG5o4bqtcCDEkcOjIMSRxrDhu6NjIHPhu60gZOG7pW5nXCIgfSk7XG4gICAgfVxuXG4gICAgLy8gQsSDbSBt4bqtdCBraOG6qXVcbiAgICBjb25zdCBoYXNoZWRQYXNzd29yZCA9IGF3YWl0IGJjcnlwdC5oYXNoKHBhc3N3b3JkLCAxMCk7XG4gICAgXG4gICAgLy8gVOG6oW8gdXNlciBt4bubaVxuICAgIGNvbnN0IG5ld1VzZXIgPSBuZXcgVXNlcih7XG4gICAgICBlbWFpbCxcbiAgICAgIHBob25lLFxuICAgICAgZmlyc3ROYW1lLFxuICAgICAgbGFzdE5hbWUsXG4gICAgICB1c2VyTmFtZSxcbiAgICAgIHBhc3N3b3JkOiBoYXNoZWRQYXNzd29yZCxcbiAgICAgIGFkZHJlc3MsXG4gICAgICB1c2VySW1hZ2UsXG4gICAgfSk7XG4gICAgXG4gICAgLy8gTMawdSB1c2VyIHbDoG8gZGF0YWJhc2VcbiAgICBhd2FpdCBuZXdVc2VyLnNhdmUoKTtcblxuICAgIC8vIFThuqFvIHJlZnJlc2ggdG9rZW4gduG7m2kgc2VjcmV0IGtleSB04burIGJp4bq/biBtw7RpIHRyxrDhu51uZ1xuICAgIGNvbnN0IHJlZnJlc2hUb2tlbiA9IGp3dC5zaWduKFxuICAgICAgeyBpZDogbmV3VXNlci5faWQgfSxcbiAgICAgIHByb2Nlc3MuZW52LkpXVF9SRUZSRVNIX1NFQ1JFVCB8fCBcIlNFQ1JFVF9SRUZSRVNIXCIsIC8vIEZhbGxiYWNrIG7hur91IGtow7RuZyBjw7MgYmnhur9uIG3DtGkgdHLGsOG7nW5nXG4gICAgICB7IGV4cGlyZXNJbjogXCI3ZFwiIH1cbiAgICApO1xuICAgIFxuICAgIC8vIEzGsHUgcmVmcmVzaCB0b2tlbiB2w6BvIGRhdGFiYXNlIHbhu5tpIHRo4budaSBnaWFuIGjhur90IGjhuqFuXG4gICAgYXdhaXQgUmVmcmVzaFRva2VuLmNyZWF0ZSh7XG4gICAgICB1c2VySWQ6IG5ld1VzZXIuX2lkLFxuICAgICAgdXNlck1vZGVsOiBcIlVzZXJcIixcbiAgICAgIHRva2VuOiByZWZyZXNoVG9rZW4sXG4gICAgICBleHBpcmVzQXQ6IG5ldyBEYXRlKERhdGUubm93KCkgKyA3ICogMjQgKiA2MCAqIDYwICogMTAwMCkgLy8gNyBuZ8OgeVxuICAgIH0pO1xuXG4gICAgLy8gVOG6oW8gYWNjZXNzIHRva2VuIGNobyBuZ8aw4budaSBkw7luZyBt4bubaVxuICAgIGNvbnN0IGFjY2Vzc1Rva2VuID0gand0LnNpZ24oXG4gICAgICB7XG4gICAgICAgIGlkOiBuZXdVc2VyLl9pZCxcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIHBlcm1pc3Npb25zOiBbXCJYZW1cIl1cbiAgICAgIH0sXG4gICAgICBwcm9jZXNzLmVudi5KV1RfU0VDUkVUX0FDQ0VTUyB8fCBcIlNFQ1JFVF9BQ0NFU1NcIiwgLy8gRmFsbGJhY2sgbuG6v3Uga2jDtG5nIGPDsyBiaeG6v24gbcO0aSB0csaw4budbmdcbiAgICAgIHsgZXhwaXJlc0luOiBcIjFkXCIgfVxuICAgICk7XG5cbiAgICAvLyBUcuG6oyB24buBIHRow7RuZyB0aW4gxJHEg25nIGvDvSB0aMOgbmggY8O0bmdcbiAgICByZXMuc3RhdHVzKDIwMSkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCLEkMSDbmcga8O9IG5nxrDhu51pIGTDuW5nIHRow6BuaCBjw7RuZ1wiLFxuICAgICAgdXNlcklkOiBuZXdVc2VyLl9pZCxcbiAgICAgIGFjY2Vzc1Rva2VuLFxuICAgICAgcmVmcmVzaFRva2VuLFxuICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICBwZXJtaXNzaW9uczogW1wiWGVtXCJdLFxuICAgICAgZnVsbE5hbWU6IGAke25ld1VzZXIuZmlyc3ROYW1lfSAke25ld1VzZXIubGFzdE5hbWV9YFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJSZWdpc3RyYXRpb24gZXJyb3I6XCIsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIMSRxINuZyBrw70gbmfGsOG7nWkgZMO5bmdcIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlIFxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgbG9naW4gPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHVzZXJuYW1lLCB1c2VyTmFtZSwgdXNlcl9uYW1lLCBwYXNzd29yZCB9ID0gcmVxLmJvZHk7XG4gICAgXG4gICAgLy8gTm9ybWFsaXplIHVzZXJuYW1lIHZhcmlhbnRzIChkYXRhYmFzZSBtaWdodCBoYXZlIGVpdGhlciB1c2VybmFtZSBvciB1c2VyTmFtZSlcbiAgICBjb25zdCB1c2VybmFtZVRvVXNlID0gdXNlcm5hbWUgfHwgdXNlck5hbWUgfHwgdXNlcl9uYW1lO1xuICAgIFxuICAgIGlmICghdXNlcm5hbWVUb1VzZSB8fCAhcGFzc3dvcmQpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIlZ1aSBsw7JuZyBjdW5nIGPhuqVwIHTDqm4gbmfGsOG7nWkgZMO5bmcgdsOgIG3huq10IGto4bqpdVwiLFxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IGZvdW5kVXNlciA9IGF3YWl0IFVzZXIuZmluZE9uZSh7IFxuICAgICAgJG9yOiBbXG4gICAgICAgIHsgdXNlck5hbWU6IHVzZXJuYW1lVG9Vc2UgfSxcbiAgICAgICAgeyB1c2VybmFtZTogdXNlcm5hbWVUb1VzZSB9LFxuICAgICAgICB7IGVtYWlsOiB1c2VybmFtZVRvVXNlIH1cbiAgICAgIF0gXG4gICAgfSk7XG4gICAgXG4gICAgaWYgKCFmb3VuZFVzZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIk5nxrDhu51pIGTDuW5nIGtow7RuZyB04buTbiB04bqhaVwiLFxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGlmIChmb3VuZFVzZXIuaXNCbG9ja2VkKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJUw6BpIGtob+G6o24gxJHDoyBi4buLIGtow7NhLiBWdWkgbMOybmcgbGnDqm4gaOG7hyBxdeG6o24gdHLhu4sgdmnDqm4uXCIsXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgaXNQYXNzd29yZFZhbGlkID0gYXdhaXQgYmNyeXB0LmNvbXBhcmUocGFzc3dvcmQsIGZvdW5kVXNlci5wYXNzd29yZCk7XG4gICAgXG4gICAgaWYgKCFpc1Bhc3N3b3JkVmFsaWQpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIk3huq10IGto4bqpdSBraMO0bmcgxJHDum5nXCIsXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgYWNjZXNzVG9rZW4gPSBqd3Quc2lnbihcbiAgICAgIHtcbiAgICAgICAgaWQ6IGZvdW5kVXNlci5faWQsXG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBwZXJtaXNzaW9uczogW1wiWGVtXCJdXG4gICAgICB9LFxuICAgICAgcHJvY2Vzcy5lbnYuSldUX1NFQ1JFVF9BQ0NFU1MsXG4gICAgICB7IGV4cGlyZXNJbjogXCIxZFwiIH1cbiAgICApO1xuICAgIFxuICAgIC8vIEdlbmVyYXRlIHJlZnJlc2ggdG9rZW4gd2l0aCBleHRlbmRlZCBleHBpcnlcbiAgICBjb25zdCByZWZyZXNoVG9rZW4gPSBqd3Quc2lnbihcbiAgICAgIHsgaWQ6IGZvdW5kVXNlci5faWQgfSxcbiAgICAgIHByb2Nlc3MuZW52LkpXVF9SRUZSRVNIX1NFQ1JFVCxcbiAgICAgIHsgZXhwaXJlc0luOiBcIjdkXCIgfVxuICAgICk7XG4gICAgXG4gICAgLy8gWMOzYSByZWZyZXNoIHRva2VucyBjxakgY+G7p2EgdXNlciBuw6B5IHRyxrDhu5tjIGtoaSB04bqhbyBt4bubaVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBSZWZyZXNoVG9rZW4uZGVsZXRlTWFueSh7IHVzZXJJZDogZm91bmRVc2VyLl9pZCwgdXNlck1vZGVsOiBcIlVzZXJcIiB9KTtcbiAgICAgIFxuICAgICAgLy8gU2F1IGtoaSB4w7NhIHRva2VucyBjxaksIHThuqFvIHRva2VuIG3hu5tpXG4gICAgICBhd2FpdCBSZWZyZXNoVG9rZW4uY3JlYXRlKHtcbiAgICAgICAgdXNlcklkOiBmb3VuZFVzZXIuX2lkLFxuICAgICAgICB1c2VyTW9kZWw6IFwiVXNlclwiLFxuICAgICAgICB0b2tlbjogcmVmcmVzaFRva2VuLFxuICAgICAgICBleHBpcmVzQXQ6IG5ldyBEYXRlKERhdGUubm93KCkgKyA3ICogMjQgKiA2MCAqIDYwICogMTAwMClcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKHRva2VuRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBtYW5hZ2luZyByZWZyZXNoIHRva2VuczpcIiwgdG9rZW5FcnJvcik7XG4gICAgICAvLyBDb250aW51ZSBldmVuIGlmIHRva2VuIHN0b3JhZ2UgZmFpbHNcbiAgICB9XG4gICAgXG4gICAgLy8gVXBkYXRlIGxhc3QgbG9naW4gdGltZVxuICAgIGZvdW5kVXNlci5sYXN0TG9naW4gPSBuZXcgRGF0ZSgpO1xuICAgIGF3YWl0IGZvdW5kVXNlci5zYXZlKCk7XG4gICAgXG4gICAgLy8gRm9ybWF0IHJlc3BvbnNlXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiBcIsSQxINuZyBuaOG6rXAgdGjDoG5oIGPDtG5nXCIsXG4gICAgICB0b2tlbjogYWNjZXNzVG9rZW4sXG4gICAgICByZWZyZXNoVG9rZW4sXG4gICAgICB1c2VyOiB7XG4gICAgICAgIGlkOiBmb3VuZFVzZXIuX2lkLFxuICAgICAgICB1c2VyTmFtZTogZm91bmRVc2VyLnVzZXJOYW1lLFxuICAgICAgICBlbWFpbDogZm91bmRVc2VyLmVtYWlsLFxuICAgICAgICBmaXJzdE5hbWU6IGZvdW5kVXNlci5maXJzdE5hbWUsXG4gICAgICAgIGxhc3ROYW1lOiBmb3VuZFVzZXIubGFzdE5hbWUsXG4gICAgICAgIHJvbGU6IFwidXNlclwiXG4gICAgICB9LFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJMb2dpbiBlcnJvcjpcIiwgZXJyb3IpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwiTOG7l2kgxJHEg25nIG5o4bqtcDogXCIgKyBlcnJvci5tZXNzYWdlLFxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgcmVmcmVzaFRva2VuID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IHsgcmVmcmVzaFRva2VuIH0gPSByZXEuYm9keTtcblxuICBpZiAoIXJlZnJlc2hUb2tlbikge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IG1lc3NhZ2U6IFwiUmVmcmVzaCB0b2tlbiBpcyByZXF1aXJlZFwiIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICAvLyBWZXJpZnkgcmVmcmVzaCB0b2tlblxuICAgIGNvbnN0IGRlY29kZWQgPSBqd3QudmVyaWZ5KHJlZnJlc2hUb2tlbiwgcHJvY2Vzcy5lbnYuSldUX1JFRlJFU0hfU0VDUkVUKTtcblxuICAgIC8vIENoZWNrIGlmIHJlZnJlc2ggdG9rZW4gZXhpc3RzIGluIGRhdGFiYXNlXG4gICAgY29uc3Qgc3RvcmVkVG9rZW4gPSBhd2FpdCBSZWZyZXNoVG9rZW4uZmluZE9uZSh7XG4gICAgICB0b2tlbjogcmVmcmVzaFRva2VuLFxuICAgICAgdXNlcklkOiBkZWNvZGVkLmlkLFxuICAgIH0pO1xuXG4gICAgaWYgKCFzdG9yZWRUb2tlbikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgbWVzc2FnZTogXCJJbnZhbGlkIHJlZnJlc2ggdG9rZW5cIiB9KTtcbiAgICB9XG5cbiAgICAvLyBGaW5kIHVzZXIgKGVpdGhlciBVc2VyIG9yIEFkbWluKVxuICAgIGxldCB1c2VyID1cbiAgICAgIChhd2FpdCBVc2VyLmZpbmRCeUlkKGRlY29kZWQuaWQpKSB8fCAoYXdhaXQgQWRtaW4uZmluZEJ5SWQoZGVjb2RlZC5pZCkpO1xuXG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIlVzZXIgbm90IGZvdW5kXCIgfSk7XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgbmV3IGFjY2VzcyB0b2tlblxuICAgIGNvbnN0IG5ld0FjY2Vzc1Rva2VuID0gand0LnNpZ24oXG4gICAgICB7XG4gICAgICAgIGlkOiB1c2VyLl9pZCxcbiAgICAgICAgcm9sZTogdXNlci5yb2xlLFxuICAgICAgICBwZXJtaXNzaW9uczogdXNlci5wZXJtaXNzaW9ucyB8fCBbXSxcbiAgICAgIH0sXG4gICAgICBwcm9jZXNzLmVudi5KV1RfU0VDUkVUX0FDQ0VTUyxcbiAgICAgIHsgZXhwaXJlc0luOiBcIjFoXCIgfVxuICAgICk7XG5cbiAgICByZXMuanNvbih7XG4gICAgICBhY2Nlc3NUb2tlbjogbmV3QWNjZXNzVG9rZW4sXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGVycm9yLm5hbWUgPT09IFwiVG9rZW5FeHBpcmVkRXJyb3JcIikge1xuICAgICAgLy8gUmVtb3ZlIGV4cGlyZWQgcmVmcmVzaCB0b2tlbiBmcm9tIGRhdGFiYXNlXG4gICAgICBhd2FpdCBSZWZyZXNoVG9rZW4uZmluZE9uZUFuZERlbGV0ZSh7IHRva2VuOiByZWZyZXNoVG9rZW4gfSk7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBtZXNzYWdlOiBcIlJlZnJlc2ggdG9rZW4gZXhwaXJlZFwiIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBtZXNzYWdlOiBcIkludmFsaWQgcmVmcmVzaCB0b2tlblwiIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgbG9nb3V0ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyByZWZyZXNoVG9rZW4gfSA9IHJlcS5ib2R5O1xuXG4gICAgaWYgKCFyZWZyZXNoVG9rZW4pIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IG1lc3NhZ2U6IFwiTm8gcmVmcmVzaCB0b2tlbiBwcm92aWRlZFwiIH0pO1xuICAgIH1cblxuICAgIGF3YWl0IFJlZnJlc2hUb2tlbi5maW5kT25lQW5kRGVsZXRlKHsgdG9rZW46IHJlZnJlc2hUb2tlbiB9KTtcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7IG1lc3NhZ2U6IFwiTG9nZ2VkIG91dCBzdWNjZXNzZnVsbHlcIiB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfSk7XG4gIH1cbn07XG5cbi8vIE1pZ3JhdGUgc2luZ2xlIGFkZHJlc3MgdG8gYWRkcmVzc2VzIGFycmF5XG5jb25zdCBtaWdyYXRlTGVnYWN5QWRkcmVzcyA9IGFzeW5jICh1c2VyKSA9PiB7XG4gIHRyeSB7XG4gICAgLy8gQ2hlY2sgaWYgYWRkcmVzc2VzIGFycmF5IGlzIGVtcHR5IGJ1dCBsZWdhY3kgYWRkcmVzcyBleGlzdHNcbiAgICBpZiAoKCF1c2VyLmFkZHJlc3NlcyB8fCB1c2VyLmFkZHJlc3Nlcy5sZW5ndGggPT09IDApICYmIHVzZXIuYWRkcmVzcykge1xuICAgICAgY29uc29sZS5sb2coYE1pZ3JhdGluZyBsZWdhY3kgYWRkcmVzcyBmb3IgdXNlcjogJHt1c2VyLl9pZH1gKTtcbiAgICAgIFxuICAgICAgLy8gQ3JlYXRlIG5ldyBhZGRyZXNzIG9iamVjdCBmcm9tIGxlZ2FjeSBmaWVsZHNcbiAgICAgIGNvbnN0IG5ld0FkZHJlc3MgPSB7XG4gICAgICAgIGZ1bGxBZGRyZXNzOiB1c2VyLmZ1bGxBZGRyZXNzIHx8IHVzZXIuYWRkcmVzcyxcbiAgICAgICAgaG91c2VOdW1iZXI6IHVzZXIuaG91c2VOdW1iZXIgfHwgJycsXG4gICAgICAgIHdhcmQ6IHVzZXIud2FyZCB8fCAnJyxcbiAgICAgICAgZGlzdHJpY3Q6IHVzZXIuZGlzdHJpY3QgfHwgJycsXG4gICAgICAgIHByb3ZpbmNlOiB1c2VyLnByb3ZpbmNlIHx8ICcnLFxuICAgICAgICBjb29yZGluYXRlczogdXNlci5jb29yZGluYXRlcyB8fCB7fSxcbiAgICAgICAgaXNEZWZhdWx0OiB0cnVlLFxuICAgICAgICBsYWJlbDogXCJOaMOgXCIsXG4gICAgICAgIHJlY2VpdmVyTmFtZTogYCR7dXNlci5maXJzdE5hbWV9ICR7dXNlci5sYXN0TmFtZX1gLFxuICAgICAgICByZWNlaXZlclBob25lOiB1c2VyLnBob25lXG4gICAgICB9O1xuICAgICAgXG4gICAgICAvLyBBZGQgdG8gYWRkcmVzc2VzIGFycmF5XG4gICAgICB1c2VyLmFkZHJlc3NlcyA9IFtuZXdBZGRyZXNzXTtcbiAgICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuICAgICAgY29uc29sZS5sb2coYExlZ2FjeSBhZGRyZXNzIG1pZ3JhdGVkIHN1Y2Nlc3NmdWxseSBmb3IgdXNlcjogJHt1c2VyLl9pZH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHVzZXI7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIG1pZ3JhdGluZyBsZWdhY3kgYWRkcmVzczpcIiwgZXJyb3IpO1xuICAgIHJldHVybiB1c2VyO1xuICB9XG59O1xuXG4vLyBBZGQgdGhlIG1pZ3JhdGlvbiBsb2dpYyB0byBnZXRVc2VyUHJvZmlsZVxuZXhwb3J0IGNvbnN0IGdldFVzZXJQcm9maWxlID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgdXNlcklkID0gcmVxLnBhcmFtcy5pZDtcbiAgICBsZXQgdXNlciA9IGF3YWl0IFVzZXIuZmluZEJ5SWQodXNlcklkKS5zZWxlY3QoXCItcGFzc3dvcmRcIik7XG5cbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6IFwiVXNlciBub3QgZm91bmRcIiB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gTWlncmF0ZSBsZWdhY3kgYWRkcmVzcyBpZiBuZWVkZWRcbiAgICB1c2VyID0gYXdhaXQgbWlncmF0ZUxlZ2FjeUFkZHJlc3ModXNlcik7XG5cbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih1c2VyKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBnZXRBbGxVc2VyID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuZmluZCgpO1xuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHVzZXIpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogZXJyb3IubWVzc2FnZSB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IHVwZGF0ZVVzZXIgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHVzZXJJZCB9ID0gcmVxLnBhcmFtcztcbiAgICBjb25zdCB7IGN1cnJlbnRQYXNzd29yZCwgbmV3UGFzc3dvcmQsIGZpcnN0TmFtZSwgbGFzdE5hbWUsIHBob25lLCBhZGRyZXNzLCB1c2VySW1hZ2UgfSA9IHJlcS5ib2R5O1xuXG4gICAgY29uc29sZS5sb2coXCJVcGRhdGluZyB1c2VyIHByb2ZpbGU6XCIsIHVzZXJJZCk7XG4gICAgY29uc29sZS5sb2coXCJSZXF1ZXN0IGJvZHk6XCIsIHJlcS5ib2R5KTtcblxuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBVc2VyLmZpbmRCeUlkKHVzZXJJZCk7XG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgbmfGsOG7nWkgZMO5bmdcIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFjhu60gbMO9IGPhuq1wIG5o4bqtdCBt4bqtdCBraOG6qXUgbuG6v3UgY8OzXG4gICAgaWYgKG5ld1Bhc3N3b3JkKSB7XG4gICAgICBpZiAoIWN1cnJlbnRQYXNzd29yZCkge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiVnVpIGzDsm5nIGN1bmcgY+G6pXAgbeG6rXQga2jhuql1IGhp4buHbiB04bqhaVwiLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXNNYXRjaCA9IGF3YWl0IGJjcnlwdC5jb21wYXJlKGN1cnJlbnRQYXNzd29yZCwgdXNlci5wYXNzd29yZCk7XG4gICAgICBpZiAoIWlzTWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBtZXNzYWdlOiBcIk3huq10IGto4bqpdSBoaeG7h24gdOG6oWkga2jDtG5nIGNow61uaCB4w6FjXCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAobmV3UGFzc3dvcmQubGVuZ3RoIDwgOCkge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiTeG6rXQga2jhuql1IG3hu5tpIHBo4bqjaSBjw7Mgw610IG5o4bqldCA4IGvDvSB04buxXCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKCEvW0EtWl0vLnRlc3QobmV3UGFzc3dvcmQpKSB7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgbWVzc2FnZTogXCJN4bqtdCBraOG6qXUgbeG7m2kgY+G6p24gw610IG5o4bqldCAxIGNo4buvIGhvYVwiLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICghL1swLTldLy50ZXN0KG5ld1Bhc3N3b3JkKSkge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiTeG6rXQga2jhuql1IG3hu5tpIGPhuqduIMOtdCBuaOG6pXQgMSBjaOG7ryBz4buRXCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKCEvWyFAIyQlXiYqXS8udGVzdChuZXdQYXNzd29yZCkpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBtZXNzYWdlOiBcIk3huq10IGto4bqpdSBt4bubaSBj4bqnbiDDrXQgbmjhuqV0IDEga8O9IHThu7EgxJHhurdjIGJp4buHdFwiLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2FsdCA9IGF3YWl0IGJjcnlwdC5nZW5TYWx0KDEwKTtcbiAgICAgIHVzZXIucGFzc3dvcmQgPSBhd2FpdCBiY3J5cHQuaGFzaChuZXdQYXNzd29yZCwgc2FsdCk7XG4gICAgfVxuXG4gICAgLy8gWOG7rSBsw70gY+G6rXAgbmjhuq10IHRow7RuZyB0aW4gY8OhIG5ow6JuXG4gICAgaWYgKGZpcnN0TmFtZSAhPT0gdW5kZWZpbmVkKSB1c2VyLmZpcnN0TmFtZSA9IGZpcnN0TmFtZTtcbiAgICBpZiAobGFzdE5hbWUgIT09IHVuZGVmaW5lZCkgdXNlci5sYXN0TmFtZSA9IGxhc3ROYW1lO1xuICAgIGlmIChwaG9uZSAhPT0gdW5kZWZpbmVkKSB1c2VyLnBob25lID0gcGhvbmU7XG4gICAgaWYgKGFkZHJlc3MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZyBhZGRyZXNzIHRvOlwiLCBhZGRyZXNzKTtcbiAgICAgIHVzZXIuYWRkcmVzcyA9IGFkZHJlc3M7XG4gICAgfVxuICAgIFxuICAgIC8vIFjhu60gbMO9IGPhuq1wIG5o4bqtdCBhdmF0YXIgbuG6v3UgY8OzXG4gICAgaWYgKHVzZXJJbWFnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlVwZGF0aW5nIHVzZXIgaW1hZ2UgdG86XCIsIHVzZXJJbWFnZSk7XG4gICAgICB1c2VyLnVzZXJJbWFnZSA9IHVzZXJJbWFnZTtcbiAgICB9XG5cbiAgICBhd2FpdCB1c2VyLnNhdmUoKTtcbiAgICBjb25zb2xlLmxvZyhcIlVzZXIgdXBkYXRlZCBzdWNjZXNzZnVsbHk6XCIsIHVzZXIpO1xuICAgIFxuICAgIC8vIFRy4bqjIHbhu4EgdGjDtG5nIHRpbiBuZ8aw4budaSBkw7luZyDEkcOjIMSRxrDhu6NjIGPhuq1wIG5o4bqtdFxuICAgIHJlcy5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiBcIkPhuq1wIG5o4bqtdCB0aMO0bmcgdGluIHRow6BuaCBjw7RuZ1wiLFxuICAgICAgdXNlcjoge1xuICAgICAgICBfaWQ6IHVzZXIuX2lkLFxuICAgICAgICBmaXJzdE5hbWU6IHVzZXIuZmlyc3ROYW1lLFxuICAgICAgICBsYXN0TmFtZTogdXNlci5sYXN0TmFtZSxcbiAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXG4gICAgICAgIHBob25lOiB1c2VyLnBob25lLFxuICAgICAgICBhZGRyZXNzOiB1c2VyLmFkZHJlc3MsXG4gICAgICAgIHVzZXJJbWFnZTogdXNlci51c2VySW1hZ2VcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciB1cGRhdGluZyB1c2VyOlwiLCBlcnIpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgdGjDtG5nIHRpblwiLFxuICAgICAgZXJyb3I6IGVyci5tZXNzYWdlXG4gICAgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCByZXF1ZXN0UGFzc3dvcmRSZXNldCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgZW1haWwgfSA9IHJlcS5ib2R5O1xuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBVc2VyLmZpbmRPbmUoeyBlbWFpbCB9KTtcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIkVtYWlsIGNoxrBhIMSRxrDhu6NjIMSRxINuZyBrw70gdHJvbmcgaOG7hyB0aOG7kW5nXCIsXG4gICAgICB9KTtcbiAgICB9XG4gICAgY29uc3Qgb3RwID0gZ2VuZXJhdGVPVFAoKTtcbiAgICBjb25zdCBvdHBFeHBpcmVzID0gbmV3IERhdGUoRGF0ZS5ub3coKSArIDE1ICogNjAgKiAxMDAwKTtcblxuICAgIHVzZXIucmVzZXRQYXNzd29yZFRva2VuID0gb3RwO1xuICAgIHVzZXIucmVzZXRQYXNzd29yZEV4cGlyZXMgPSBvdHBFeHBpcmVzO1xuICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuXG4gICAgYXdhaXQgc2VuZE9UUEVtYWlsKGVtYWlsLCBvdHApO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwiTcOjIE9UUCDEkcOjIMSRxrDhu6NjIGfhu61pIMSR4bq/biBlbWFpbCBj4bunYSBi4bqhblwiLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBpbiByZXF1ZXN0UGFzc3dvcmRSZXNldDpcIiwgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSB44butIGzDvSB5w6p1IGPhuqd1XCIsXG4gICAgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCByZXNldFBhc3N3b3JkID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBlbWFpbCwgb3RwLCBuZXdQYXNzd29yZCB9ID0gcmVxLmJvZHk7XG5cbiAgICBpZiAoIWVtYWlsIHx8ICFvdHAgfHwgIW5ld1Bhc3N3b3JkKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJUaGnhur91IHRow7RuZyB0aW4gY+G6p24gdGhp4bq/dFwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVMOsbSBuZ8aw4budaSBkw7luZyBk4buxYSB0csOqbiBlbWFpbCB2w6AgT1RQIGjhu6NwIGzhu4dcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHtcbiAgICAgIGVtYWlsLFxuICAgICAgcmVzZXRQYXNzd29yZFRva2VuOiBvdHAsXG4gICAgICByZXNldFBhc3N3b3JkRXhwaXJlczogeyAkZ3Q6IERhdGUubm93KCkgfSwgLy8gT1RQIGPDsm4gaOG6oW4gc+G7rSBk4bulbmdcbiAgICB9KTtcblxuICAgIGlmICghdXNlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiTcOjIE9UUCBraMO0bmcgaOG7o3AgbOG7hyBob+G6t2MgxJHDoyBo4bq/dCBo4bqhblwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gS2nhu4NtIHRyYSDEkeG7mSBt4bqhbmggY+G7p2EgbeG6rXQga2jhuql1IG3hu5tpXG4gICAgaWYgKG5ld1Bhc3N3b3JkLmxlbmd0aCA8IDgpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIk3huq10IGto4bqpdSBt4bubaSBwaOG6o2kgY8OzIMOtdCBuaOG6pXQgOCBrw70gdOG7sVwiLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICghL1tBLVpdLy50ZXN0KG5ld1Bhc3N3b3JkKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiTeG6rXQga2jhuql1IG3hu5tpIGPhuqduIMOtdCBuaOG6pXQgMSBjaOG7ryBob2FcIixcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoIS9bMC05XS8udGVzdChuZXdQYXNzd29yZCkpIHtcbiAgICAgIHJldHVybiByZXNcbiAgICAgICAgLnN0YXR1cyg0MDApXG4gICAgICAgIC5qc29uKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IFwiTeG6rXQga2jhuql1IG3hu5tpIGPhuqduIMOtdCBuaOG6pXQgMSBjaOG7ryBz4buRXCIgfSk7XG4gICAgfVxuICAgIGlmICghL1shQCMkJV4mKl0vLnRlc3QobmV3UGFzc3dvcmQpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJN4bqtdCBraOG6qXUgbeG7m2kgY+G6p24gw610IG5o4bqldCAxIGvDvSB04buxIMSR4bq3YyBiaeG7h3RcIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEhhc2ggbeG6rXQga2jhuql1IG3hu5tpXG4gICAgY29uc3Qgc2FsdCA9IGF3YWl0IGJjcnlwdC5nZW5TYWx0KDEwKTtcbiAgICB1c2VyLnBhc3N3b3JkID0gYXdhaXQgYmNyeXB0Lmhhc2gobmV3UGFzc3dvcmQsIHNhbHQpO1xuXG4gICAgLy8gWMOzYSBPVFAgc2F1IGtoaSBz4butIGThu6VuZ1xuICAgIHVzZXIucmVzZXRQYXNzd29yZFRva2VuID0gbnVsbDtcbiAgICB1c2VyLnJlc2V0UGFzc3dvcmRFeHBpcmVzID0gbnVsbDtcblxuICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiBcIsSQ4bq3dCBs4bqhaSBt4bqtdCBraOG6qXUgdGjDoG5oIGPDtG5nXCIsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSDEkeG6t3QgbOG6oWkgbeG6rXQga2jhuql1XCIsXG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIFjhu60gbMO9IGNo4bq3bi9i4buPIGNo4bq3biBuZ8aw4budaSBkw7luZ1xuZXhwb3J0IGNvbnN0IGJsb2NrVXNlciA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgdXNlcklkIH0gPSByZXEucGFyYW1zO1xuICAgIGNvbnN0IHsgaXNCbG9ja2VkIH0gPSByZXEuYm9keTtcblxuICAgIGlmIChpc0Jsb2NrZWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiVGhp4bq/dSB0aMO0bmcgdGluIHRy4bqhbmcgdGjDoWkgY2jhurduIG5nxrDhu51pIGTDuW5nXCJcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBVc2VyLmZpbmRCeUlkKHVzZXJJZCk7XG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgbmfGsOG7nWkgZMO5bmdcIlxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgY2jhurduXG4gICAgdXNlci5pc0Jsb2NrZWQgPSBpc0Jsb2NrZWQ7XG4gICAgYXdhaXQgdXNlci5zYXZlKCk7XG5cbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogaXNCbG9ja2VkID8gXCLEkMOjIGNo4bq3biBuZ8aw4budaSBkw7luZyB0aMOgbmggY8O0bmdcIiA6IFwixJDDoyBi4buPIGNo4bq3biBuZ8aw4budaSBkw7luZyB0aMOgbmggY8O0bmdcIixcbiAgICAgIHVzZXI6IHtcbiAgICAgICAgX2lkOiB1c2VyLl9pZCxcbiAgICAgICAgaXNCbG9ja2VkOiB1c2VyLmlzQmxvY2tlZFxuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSB44butIGzDvSB5w6p1IGPhuqd1XCJcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gSMOgbSDEkcSDbmcgbmjhuq1wIGLhurFuZyBGYWNlYm9va1xuZXhwb3J0IGNvbnN0IGZhY2Vib29rTG9naW4gPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IGFjY2Vzc1Rva2VuLCB1c2VySUQgfSA9IHJlcS5ib2R5O1xuICAgIFxuICAgIGlmICghYWNjZXNzVG9rZW4gfHwgIXVzZXJJRCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiVGhp4bq/dSB0aMO0bmcgdGluIHjDoWMgdGjhu7FjIHThu6sgRmFjZWJvb2tcIlxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gWMOhYyB0aOG7sWMgdG9rZW4gRmFjZWJvb2sgYuG6sW5nIGPDoWNoIGfhu41pIEFQSSBj4bunYSBGYWNlYm9va1xuICAgIGNvbnN0IGZiUmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYGh0dHBzOi8vZ3JhcGguZmFjZWJvb2suY29tL3YxOC4wLyR7dXNlcklEfWAsIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBmaWVsZHM6ICdpZCxlbWFpbCxmaXJzdF9uYW1lLGxhc3RfbmFtZSxwaWN0dXJlJyxcbiAgICAgICAgYWNjZXNzX3Rva2VuOiBhY2Nlc3NUb2tlblxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFmYlJlc3BvbnNlLmRhdGEgfHwgIWZiUmVzcG9uc2UuZGF0YS5pZCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHRo4buDIHjDoWMgdGjhu7FjIHbhu5tpIEZhY2Vib29rXCJcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHsgaWQsIGVtYWlsLCBmaXJzdF9uYW1lLCBsYXN0X25hbWUsIHBpY3R1cmUgfSA9IGZiUmVzcG9uc2UuZGF0YTtcbiAgICBcbiAgICAvLyBUw6xtIHVzZXIgduG7m2kgRmFjZWJvb2tJRFxuICAgIGxldCB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgZmFjZWJvb2tJZDogaWQgfSk7XG4gICAgXG4gICAgLy8gTuG6v3UgdXNlciBraMO0bmcgdOG7k24gdOG6oWkgbmjGsG5nIGVtYWlsIMSRw6MgdOG7k24gdOG6oWksIGxpw6puIGvhur90IHTDoGkga2hv4bqjbiDEkcOzXG4gICAgaWYgKCF1c2VyICYmIGVtYWlsKSB7XG4gICAgICB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgZW1haWwgfSk7XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICAvLyBMacOqbiBr4bq/dCB0w6BpIGtob+G6o24gxJHDoyB04buTbiB04bqhaSB24bubaSBGYWNlYm9va1xuICAgICAgICB1c2VyLmZhY2Vib29rSWQgPSBpZDtcbiAgICAgICAgdXNlci5hdXRoUHJvdmlkZXIgPSAnZmFjZWJvb2snO1xuICAgICAgICBhd2FpdCB1c2VyLnNhdmUoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gTuG6v3UgduG6q24ga2jDtG5nIHTDrG0gdGjhuqV5IHVzZXIsIHThuqFvIG3hu5tpXG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICAvLyBU4bqhbyB1c2VybmFtZSBuZ+G6q3Ugbmhpw6puIG7hur91IGtow7RuZyBjw7NcbiAgICAgIGNvbnN0IHVuaXF1ZVVzZXJuYW1lID0gYGZiXyR7aWR9XyR7RGF0ZS5ub3coKS50b1N0cmluZygpLnNsaWNlKC00KX1gO1xuICAgICAgXG4gICAgICAvLyBU4bqhbyBt4bqtdCBraOG6qXUgbmfhuqt1IG5oacOqblxuICAgICAgY29uc3QgcmFuZG9tUGFzc3dvcmQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgtMTApO1xuICAgICAgY29uc3QgaGFzaGVkUGFzc3dvcmQgPSBhd2FpdCBiY3J5cHQuaGFzaChyYW5kb21QYXNzd29yZCwgMTApO1xuICAgICAgXG4gICAgICAvLyBVc2UgZGVmYXVsdCBhdmF0YXIgaW5zdGVhZCBvZiBGYWNlYm9vayBwcm9maWxlIHBpY1xuICAgICAgY29uc3QgcHJvZmlsZUltYWdlVXJsID0gJyc7IC8vIERvbid0IHN0b3JlIEZhY2Vib29rIHByb2ZpbGUgVVJMXG4gICAgICBcbiAgICAgIHVzZXIgPSBuZXcgVXNlcih7XG4gICAgICAgIGVtYWlsOiBlbWFpbCB8fCBgJHtpZH1AZmFjZWJvb2suY29tYCxcbiAgICAgICAgcGhvbmU6ICcwMDAwMDAwMDAwJywgLy8gUGxhY2Vob2xkZXIgcGhvbmUgbnVtYmVyXG4gICAgICAgIGZpcnN0TmFtZTogZmlyc3RfbmFtZSB8fCAnRmFjZWJvb2snLFxuICAgICAgICBsYXN0TmFtZTogbGFzdF9uYW1lIHx8ICdVc2VyJyxcbiAgICAgICAgdXNlck5hbWU6IHVuaXF1ZVVzZXJuYW1lLFxuICAgICAgICBwYXNzd29yZDogaGFzaGVkUGFzc3dvcmQsXG4gICAgICAgIHVzZXJJbWFnZTogcHJvZmlsZUltYWdlVXJsLFxuICAgICAgICBmYWNlYm9va0lkOiBpZCxcbiAgICAgICAgYXV0aFByb3ZpZGVyOiAnZmFjZWJvb2snXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgYXdhaXQgdXNlci5zYXZlKCk7XG4gICAgfVxuICAgIFxuICAgIC8vIEtp4buDbSB0cmEgbuG6v3UgdMOgaSBraG/huqNuIGLhu4sgY2jhurduXG4gICAgaWYgKHVzZXIuaXNCbG9ja2VkKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJUw6BpIGtob+G6o24gxJHDoyBi4buLIGtow7NhLiBWdWkgbMOybmcgbGnDqm4gaOG7hyBxdeG6o24gdHLhu4sgdmnDqm4uXCJcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBU4bqhbyB0b2tlbnNcbiAgICBjb25zdCB0b2tlbiA9IGp3dC5zaWduKFxuICAgICAge1xuICAgICAgICBpZDogdXNlci5faWQsXG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBwZXJtaXNzaW9uczogW1wiWGVtXCJdXG4gICAgICB9LFxuICAgICAgcHJvY2Vzcy5lbnYuSldUX1NFQ1JFVF9BQ0NFU1MsXG4gICAgICB7IGV4cGlyZXNJbjogXCIxZFwiIH1cbiAgICApO1xuXG4gICAgY29uc3QgcmVmcmVzaFRva2VuID0gand0LnNpZ24oXG4gICAgICB7IGlkOiB1c2VyLl9pZCB9LFxuICAgICAgcHJvY2Vzcy5lbnYuSldUX1JFRlJFU0hfU0VDUkVULFxuICAgICAgeyBleHBpcmVzSW46IFwiN2RcIiB9XG4gICAgKTtcbiAgICBcbiAgICAvLyBMxrB1IHJlZnJlc2ggdG9rZW5cbiAgICBhd2FpdCBSZWZyZXNoVG9rZW4uY3JlYXRlKHtcbiAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICB1c2VyTW9kZWw6IFwiVXNlclwiLFxuICAgICAgdG9rZW46IHJlZnJlc2hUb2tlbixcbiAgICAgIGV4cGlyZXNBdDogbmV3IERhdGUoRGF0ZS5ub3coKSArIDcgKiAyNCAqIDYwICogNjAgKiAxMDAwKVxuICAgIH0pO1xuICAgIFxuICAgIC8vIEPhuq1wIG5o4bqtdCBsYXN0TG9naW5cbiAgICB1c2VyLmxhc3RMb2dpbiA9IG5ldyBEYXRlKCk7XG4gICAgYXdhaXQgdXNlci5zYXZlKCk7XG4gICAgXG4gICAgLy8gR+G7rWkgcmVzcG9uc2VcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgdG9rZW4sXG4gICAgICByZWZyZXNoVG9rZW4sXG4gICAgICB1c2VyOiB7XG4gICAgICAgIGlkOiB1c2VyLl9pZCxcbiAgICAgICAgbmFtZTogYCR7dXNlci5maXJzdE5hbWV9ICR7dXNlci5sYXN0TmFtZX1gLFxuICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIHBlcm1pc3Npb25zOiBbXCJYZW1cIl1cbiAgICAgIH0sXG4gICAgICBtZXNzYWdlOiBcIsSQxINuZyBuaOG6rXAgYuG6sW5nIEZhY2Vib29rIHRow6BuaCBjw7RuZyFcIlxuICAgIH0pO1xuICAgIFxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJGYWNlYm9vayBsb2dpbiBlcnJvcjpcIiwgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMSDbmcgbmjhuq1wIGLhurFuZyBGYWNlYm9vayB0aOG6pXQgYuG6oWkuIFZ1aSBsw7JuZyB0aOG7rSBs4bqhaS5cIlxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBIw6BtIMSRxINuZyBuaOG6rXAgYuG6sW5nIEdvb2dsZVxuZXhwb3J0IGNvbnN0IGdvb2dsZUxvZ2luID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBjcmVkZW50aWFsIH0gPSByZXEuYm9keTtcbiAgICBcbiAgICBpZiAoIWNyZWRlbnRpYWwpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIlRoaeG6v3UgdGjDtG5nIHRpbiB4w6FjIHRo4buxYyB04burIEdvb2dsZVwiXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgY29uc29sZS5sb2coXCJHb29nbGUgbG9naW4gd2l0aCBjbGllbnRJRDpcIiwgcHJvY2Vzcy5lbnYuR09PR0xFX0NMSUVOVF9JRCk7XG4gICAgXG4gICAgLy8gWMOhYyB0aOG7sWMgR29vZ2xlIElEIHRva2VuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRpY2tldCA9IGF3YWl0IGdvb2dsZUNsaWVudC52ZXJpZnlJZFRva2VuKHtcbiAgICAgICAgaWRUb2tlbjogY3JlZGVudGlhbCxcbiAgICAgICAgYXVkaWVuY2U6IHByb2Nlc3MuZW52LkdPT0dMRV9DTElFTlRfSURcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBjb25zdCBwYXlsb2FkID0gdGlja2V0LmdldFBheWxvYWQoKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiR29vZ2xlIHBheWxvYWQgdmVyaWZpZWQgc3VjY2Vzc2Z1bGx5OlwiLCBwYXlsb2FkLnN1Yik7XG4gICAgICBcbiAgICAgIGNvbnN0IHsgc3ViLCBlbWFpbCwgZ2l2ZW5fbmFtZSwgZmFtaWx5X25hbWUsIHBpY3R1cmUgfSA9IHBheWxvYWQ7XG4gICAgICBcbiAgICAgIC8vIFTDrG0gdXNlciB24bubaSBHb29nbGVJRFxuICAgICAgbGV0IHVzZXIgPSBhd2FpdCBVc2VyLmZpbmRPbmUoeyBnb29nbGVJZDogc3ViIH0pO1xuICAgICAgXG4gICAgICAvLyBO4bq/dSB1c2VyIGtow7RuZyB04buTbiB04bqhaSBuaMawbmcgZW1haWwgxJHDoyB04buTbiB04bqhaSwgbGnDqm4ga+G6v3QgdMOgaSBraG/huqNuIMSRw7NcbiAgICAgIGlmICghdXNlciAmJiBlbWFpbCkge1xuICAgICAgICB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgZW1haWwgfSk7XG4gICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgLy8gTGnDqm4ga+G6v3QgdMOgaSBraG/huqNuIMSRw6MgdOG7k24gdOG6oWkgduG7m2kgR29vZ2xlXG4gICAgICAgICAgdXNlci5nb29nbGVJZCA9IHN1YjtcbiAgICAgICAgICB1c2VyLmF1dGhQcm92aWRlciA9ICdnb29nbGUnO1xuICAgICAgICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIE7hur91IHbhuqtuIGtow7RuZyB0w6xtIHRo4bqleSB1c2VyLCB04bqhbyBt4bubaVxuICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgIC8vIFThuqFvIHVzZXJuYW1lIG5n4bqrdSBuaGnDqm4gbuG6v3Uga2jDtG5nIGPDs1xuICAgICAgICBjb25zdCB1bmlxdWVVc2VybmFtZSA9IGBnb29nbGVfJHtzdWIuc2xpY2UoLTgpfV8ke0RhdGUubm93KCkudG9TdHJpbmcoKS5zbGljZSgtNCl9YDtcbiAgICAgICAgXG4gICAgICAgIC8vIFThuqFvIG3huq10IGto4bqpdSBuZ+G6q3Ugbmhpw6puXG4gICAgICAgIGNvbnN0IHJhbmRvbVBhc3N3b3JkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoLTEwKTtcbiAgICAgICAgY29uc3QgaGFzaGVkUGFzc3dvcmQgPSBhd2FpdCBiY3J5cHQuaGFzaChyYW5kb21QYXNzd29yZCwgMTApO1xuICAgICAgICBcbiAgICAgICAgdXNlciA9IG5ldyBVc2VyKHtcbiAgICAgICAgICBlbWFpbDogZW1haWwsXG4gICAgICAgICAgcGhvbmU6ICcwMDAwMDAwMDAwJywgLy8gUGxhY2Vob2xkZXIgcGhvbmUgbnVtYmVyXG4gICAgICAgICAgZmlyc3ROYW1lOiBnaXZlbl9uYW1lIHx8ICdHb29nbGUnLFxuICAgICAgICAgIGxhc3ROYW1lOiBmYW1pbHlfbmFtZSB8fCAnVXNlcicsXG4gICAgICAgICAgdXNlck5hbWU6IHVuaXF1ZVVzZXJuYW1lLFxuICAgICAgICAgIHBhc3N3b3JkOiBoYXNoZWRQYXNzd29yZCxcbiAgICAgICAgICB1c2VySW1hZ2U6IHBpY3R1cmUgfHwgJycsXG4gICAgICAgICAgZ29vZ2xlSWQ6IHN1YixcbiAgICAgICAgICBhdXRoUHJvdmlkZXI6ICdnb29nbGUnXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgYXdhaXQgdXNlci5zYXZlKCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIEtp4buDbSB0cmEgbuG6v3UgdMOgaSBraG/huqNuIGLhu4sgY2jhurduXG4gICAgICBpZiAodXNlci5pc0Jsb2NrZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBtZXNzYWdlOiBcIlTDoGkga2hv4bqjbiDEkcOjIGLhu4sga2jDs2EuIFZ1aSBsw7JuZyBsacOqbiBo4buHIHF14bqjbiB0cuG7iyB2acOqbi5cIlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gVOG6oW8gdG9rZW5zXG4gICAgICBjb25zdCB0b2tlbiA9IGp3dC5zaWduKFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IHVzZXIuX2lkLFxuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbXCJYZW1cIl1cbiAgICAgICAgfSxcbiAgICAgICAgcHJvY2Vzcy5lbnYuSldUX1NFQ1JFVF9BQ0NFU1MsXG4gICAgICAgIHsgZXhwaXJlc0luOiBcIjFkXCIgfVxuICAgICAgKTtcblxuICAgICAgY29uc3QgcmVmcmVzaFRva2VuID0gand0LnNpZ24oXG4gICAgICAgIHsgaWQ6IHVzZXIuX2lkIH0sXG4gICAgICAgIHByb2Nlc3MuZW52LkpXVF9SRUZSRVNIX1NFQ1JFVCxcbiAgICAgICAgeyBleHBpcmVzSW46IFwiN2RcIiB9XG4gICAgICApO1xuICAgICAgXG4gICAgICAvLyBMxrB1IHJlZnJlc2ggdG9rZW5cbiAgICAgIGF3YWl0IFJlZnJlc2hUb2tlbi5jcmVhdGUoe1xuICAgICAgICB1c2VySWQ6IHVzZXIuX2lkLFxuICAgICAgICB1c2VyTW9kZWw6IFwiVXNlclwiLFxuICAgICAgICB0b2tlbjogcmVmcmVzaFRva2VuLFxuICAgICAgICBleHBpcmVzQXQ6IG5ldyBEYXRlKERhdGUubm93KCkgKyA3ICogMjQgKiA2MCAqIDYwICogMTAwMClcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBD4bqtcCBuaOG6rXQgbGFzdExvZ2luXG4gICAgICB1c2VyLmxhc3RMb2dpbiA9IG5ldyBEYXRlKCk7XG4gICAgICBhd2FpdCB1c2VyLnNhdmUoKTtcbiAgICAgIFxuICAgICAgLy8gR+G7rWkgcmVzcG9uc2VcbiAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgdG9rZW4sXG4gICAgICAgIHJlZnJlc2hUb2tlbixcbiAgICAgICAgdXNlcjoge1xuICAgICAgICAgIGlkOiB1c2VyLl9pZCxcbiAgICAgICAgICBuYW1lOiBgJHt1c2VyLmZpcnN0TmFtZX0gJHt1c2VyLmxhc3ROYW1lfWAsXG4gICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtcIlhlbVwiXVxuICAgICAgICB9LFxuICAgICAgICBtZXNzYWdlOiBcIsSQxINuZyBuaOG6rXAgYuG6sW5nIEdvb2dsZSB0aMOgbmggY8O0bmchXCJcbiAgICAgIH0pO1xuICAgICAgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJHb29nbGUgbG9naW4gZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwixJDEg25nIG5o4bqtcCBi4bqxbmcgR29vZ2xlIHRo4bqldCBi4bqhaS4gVnVpIGzDsm5nIHRo4butIGzhuqFpLlwiXG4gICAgICB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkdvb2dsZSBsb2dpbiBlcnJvcjpcIiwgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMSDbmcgbmjhuq1wIGLhurFuZyBHb29nbGUgdGjhuqV0IGLhuqFpLiBWdWkgbMOybmcgdGjhu60gbOG6oWkuXCJcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gSMOgbSB44butIGzDvSBjYWxsYmFjayB04burIEZhY2Vib29rIE9BdXRoXG5leHBvcnQgY29uc3QgZmFjZWJvb2tDYWxsYmFjayA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIC8vIENvZGUgZnJvbSBhdXRoZW50aWNhdGlvbiBjYWxsYmFja1xuICAgIGNvbnN0IHsgY29kZSB9ID0gcmVxLnF1ZXJ5O1xuICAgIFxuICAgIGlmICghY29kZSkge1xuICAgICAgcmV0dXJuIHJlcy5yZWRpcmVjdCgnL2RhbmctbmhhcD9lcnJvcj1ub19jb2RlJyk7XG4gICAgfVxuICAgIFxuICAgIC8vIEV4Y2hhbmdlIGNvZGUgZm9yIGFjY2VzcyB0b2tlblxuICAgIGNvbnN0IHRva2VuUmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoJ2h0dHBzOi8vZ3JhcGguZmFjZWJvb2suY29tL29hdXRoL2FjY2Vzc190b2tlbicsIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkZBQ0VCT09LX0FQUF9JRCxcbiAgICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuRkFDRUJPT0tfQVBQX1NFQ1JFVCxcbiAgICAgICAgcmVkaXJlY3RfdXJpOiBwcm9jZXNzLmVudi5GQUNFQk9PS19DQUxMQkFDS19VUkwsXG4gICAgICAgIGNvZGVcbiAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICBpZiAoIXRva2VuUmVzcG9uc2UuZGF0YS5hY2Nlc3NfdG9rZW4pIHtcbiAgICAgIHJldHVybiByZXMucmVkaXJlY3QoJy9kYW5nLW5oYXA/ZXJyb3I9dG9rZW5fZXhjaGFuZ2VfZmFpbGVkJyk7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IGFjY2Vzc1Rva2VuID0gdG9rZW5SZXNwb25zZS5kYXRhLmFjY2Vzc190b2tlbjtcbiAgICBcbiAgICAvLyBHZXQgdXNlciBkYXRhIHdpdGggYWNjZXNzIHRva2VuXG4gICAgY29uc3QgdXNlckRhdGFSZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldCgnaHR0cHM6Ly9ncmFwaC5mYWNlYm9vay5jb20vbWUnLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgZmllbGRzOiAnaWQsZmlyc3RfbmFtZSxsYXN0X25hbWUsZW1haWwscGljdHVyZScsXG4gICAgICAgIGFjY2Vzc190b2tlbjogYWNjZXNzVG9rZW5cbiAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICBpZiAoIXVzZXJEYXRhUmVzcG9uc2UuZGF0YS5pZCkge1xuICAgICAgcmV0dXJuIHJlcy5yZWRpcmVjdCgnL2RhbmctbmhhcD9lcnJvcj11c2VyX2RhdGFfZmFpbGVkJyk7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHsgaWQsIGZpcnN0X25hbWUsIGxhc3RfbmFtZSwgZW1haWwgfSA9IHVzZXJEYXRhUmVzcG9uc2UuZGF0YTtcbiAgICBcbiAgICAvLyBMb29rIGZvciB1c2VyIHdpdGggRmFjZWJvb2sgSURcbiAgICBsZXQgdXNlciA9IGF3YWl0IFVzZXIuZmluZE9uZSh7IGZhY2Vib29rSWQ6IGlkIH0pO1xuICAgIFxuICAgIC8vIElmIHVzZXIgbm90IGZvdW5kIGJ1dCB3ZSBoYXZlIGFuIGVtYWlsLCBsb29rIGZvciB1c2VyIHdpdGggdGhhdCBlbWFpbFxuICAgIGlmICghdXNlciAmJiBlbWFpbCkge1xuICAgICAgdXNlciA9IGF3YWl0IFVzZXIuZmluZE9uZSh7IGVtYWlsIH0pO1xuICAgICAgXG4gICAgICAvLyBJZiBmb3VuZCBieSBlbWFpbCwgdXBkYXRlIHRoZSBGYWNlYm9vayBJRFxuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgdXNlci5mYWNlYm9va0lkID0gaWQ7XG4gICAgICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBJZiBzdGlsbCBubyB1c2VyLCBjcmVhdGUgYSBuZXcgb25lXG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICBjb25zdCB1bmlxdWVVc2VybmFtZSA9IGBmYl8ke2lkfV8ke0RhdGUubm93KCkudG9TdHJpbmcoKS5zbGljZSgtNCl9YDtcbiAgICAgIGNvbnN0IHJhbmRvbVBhc3N3b3JkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoLTEwKTtcbiAgICAgIGNvbnN0IGhhc2hlZFBhc3N3b3JkID0gYXdhaXQgYmNyeXB0Lmhhc2gocmFuZG9tUGFzc3dvcmQsIDEwKTtcbiAgICAgIFxuICAgICAgLy8gVXNlIGRlZmF1bHQgYXZhdGFyIGluc3RlYWQgb2YgRmFjZWJvb2sgaW1hZ2VcbiAgICAgIGNvbnN0IHByb2ZpbGVJbWFnZVVybCA9ICcnO1xuICAgICAgXG4gICAgICB1c2VyID0gbmV3IFVzZXIoe1xuICAgICAgICBlbWFpbDogYCR7dW5pcXVlVXNlcm5hbWV9QGZhY2Vib29rLmNvbWAsXG4gICAgICAgIHBob25lOiAnMDAwMDAwMDAwMCcsIC8vIFBsYWNlaG9sZGVyIHBob25lIG51bWJlclxuICAgICAgICBmaXJzdE5hbWU6IGZpcnN0X25hbWUgfHwgJ0ZhY2Vib29rJyxcbiAgICAgICAgbGFzdE5hbWU6IGxhc3RfbmFtZSB8fCAnVXNlcicsXG4gICAgICAgIHVzZXJOYW1lOiB1bmlxdWVVc2VybmFtZSxcbiAgICAgICAgcGFzc3dvcmQ6IGhhc2hlZFBhc3N3b3JkLFxuICAgICAgICB1c2VySW1hZ2U6IHByb2ZpbGVJbWFnZVVybCxcbiAgICAgICAgZmFjZWJvb2tJZDogaWQsXG4gICAgICAgIGF1dGhQcm92aWRlcjogJ2ZhY2Vib29rJ1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuICAgIH1cbiAgICBcbiAgICAvLyBDaGVjayBpZiBhY2NvdW50IGlzIGJsb2NrZWRcbiAgICBpZiAodXNlci5pc0Jsb2NrZWQpIHtcbiAgICAgIHJldHVybiByZXMucmVkaXJlY3QoJy9kYW5nLW5oYXA/ZXJyb3I9YWNjb3VudF9ibG9ja2VkJyk7XG4gICAgfVxuICAgIFxuICAgIC8vIENyZWF0ZSB0b2tlbnNcbiAgICBjb25zdCB0b2tlbiA9IGp3dC5zaWduKFxuICAgICAge1xuICAgICAgICBpZDogdXNlci5faWQsXG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBwZXJtaXNzaW9uczogW1wiWGVtXCJdXG4gICAgICB9LFxuICAgICAgcHJvY2Vzcy5lbnYuSldUX1NFQ1JFVF9BQ0NFU1MsXG4gICAgICB7IGV4cGlyZXNJbjogXCIxZFwiIH1cbiAgICApO1xuXG4gICAgY29uc3QgcmVmcmVzaFRva2VuID0gand0LnNpZ24oXG4gICAgICB7IGlkOiB1c2VyLl9pZCB9LFxuICAgICAgcHJvY2Vzcy5lbnYuSldUX1JFRlJFU0hfU0VDUkVULFxuICAgICAgeyBleHBpcmVzSW46IFwiN2RcIiB9XG4gICAgKTtcbiAgICBcbiAgICAvLyBYw7NhIHJlZnJlc2ggdG9rZW5zIGPFqSBj4bunYSB1c2VyIG7DoHkgdHLGsOG7m2Mga2hpIHThuqFvIG3hu5tpXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IFJlZnJlc2hUb2tlbi5kZWxldGVNYW55KHsgdXNlcklkOiB1c2VyLl9pZCwgdXNlck1vZGVsOiBcIlVzZXJcIiB9KTtcbiAgICAgIFxuICAgICAgLy8gU2F1IGtoaSB4w7NhIHRva2VucyBjxaksIHThuqFvIHRva2VuIG3hu5tpXG4gICAgICBhd2FpdCBSZWZyZXNoVG9rZW4uY3JlYXRlKHtcbiAgICAgICAgdXNlcklkOiB1c2VyLl9pZCxcbiAgICAgICAgdXNlck1vZGVsOiBcIlVzZXJcIixcbiAgICAgICAgdG9rZW46IHJlZnJlc2hUb2tlbixcbiAgICAgICAgZXhwaXJlc0F0OiBuZXcgRGF0ZShEYXRlLm5vdygpICsgNyAqIDI0ICogNjAgKiA2MCAqIDEwMDApXG4gICAgICB9KTtcbiAgICB9IGNhdGNoICh0b2tlbkVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgbWFuYWdpbmcgcmVmcmVzaCB0b2tlbnM6XCIsIHRva2VuRXJyb3IpO1xuICAgICAgLy8gQ29udGludWUgZXZlbiBpZiB0b2tlbiBzdG9yYWdlIGZhaWxzXG4gICAgfVxuICAgIFxuICAgIC8vIFVwZGF0ZSBsYXN0IGxvZ2luXG4gICAgdXNlci5sYXN0TG9naW4gPSBuZXcgRGF0ZSgpO1xuICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuICAgIFxuICAgIC8vIFJlZGlyZWN0IHdpdGggdG9rZW5zIGFzIFVSTCBwYXJhbWV0ZXJzXG4gICAgcmVzLnJlZGlyZWN0KGAvZGFuZy1uaGFwL3N1Y2Nlc3M/dG9rZW49JHt0b2tlbn0mcmVmcmVzaFRva2VuPSR7cmVmcmVzaFRva2VufSZ1c2VySWQ9JHt1c2VyLl9pZH0mbmFtZT0ke2VuY29kZVVSSUNvbXBvbmVudChgJHt1c2VyLmZpcnN0TmFtZX0gJHt1c2VyLmxhc3ROYW1lfWApfSZyb2xlPXVzZXJgKTtcbiAgICBcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiRmFjZWJvb2sgY2FsbGJhY2sgZXJyb3I6XCIsIGVycm9yKTtcbiAgICByZXMucmVkaXJlY3QoJy9kYW5nLW5oYXA/ZXJyb3I9c2VydmVyX2Vycm9yJyk7XG4gIH1cbn07XG5cbi8vIEjDoG0gxJHEg25nIG5o4bqtcCBi4bqxbmcgRmFjZWJvb2sgdG9rZW5cbmV4cG9ydCBjb25zdCBmYWNlYm9va1Rva2VuTG9naW4gPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IGFjY2Vzc1Rva2VuIH0gPSByZXEuYm9keTtcbiAgICBcbiAgICBpZiAoIWFjY2Vzc1Rva2VuKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJUaGnhur91IGFjY2VzcyB0b2tlblwiXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBM4bqleSB0aMO0bmcgdGluIHThu6sgRmFjZWJvb2sgYuG6sW5nIGFjY2VzcyB0b2tlblxuICAgIGNvbnN0IGZiUmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYGh0dHBzOi8vZ3JhcGguZmFjZWJvb2suY29tL3YxOC4wL21lYCwge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIGZpZWxkczogJ2lkLGZpcnN0X25hbWUsbGFzdF9uYW1lLGVtYWlsLHBpY3R1cmV7dXJsLHdpZHRoLGhlaWdodCxpc19zaWxob3VldHRlfScsXG4gICAgICAgIGFjY2Vzc190b2tlbjogYWNjZXNzVG9rZW5cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICghZmJSZXNwb25zZS5kYXRhIHx8ICFmYlJlc3BvbnNlLmRhdGEuaWQpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0aOG7gyB4w6FjIHRo4buxYyB24bubaSBGYWNlYm9va1wiXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB7IGlkLCBmaXJzdF9uYW1lLCBsYXN0X25hbWUsIGVtYWlsLCBwaWN0dXJlIH0gPSBmYlJlc3BvbnNlLmRhdGE7XG4gICAgXG4gICAgLy8gTG9nIHRow7RuZyB0aW4gbmjhuq1uIMSRxrDhu6NjIHThu6sgRmFjZWJvb2tcbiAgICBjb25zb2xlLmxvZyhcIkZhY2Vib29rIGRhdGEgcmVjZWl2ZWQ6XCIsIHsgXG4gICAgICBpZCwgXG4gICAgICBmaXJzdF9uYW1lLCBcbiAgICAgIGxhc3RfbmFtZSwgXG4gICAgICBlbWFpbDogZW1haWwgfHwgXCJObyBlbWFpbCBwcm92aWRlZCBieSBGYWNlYm9va1wiLFxuICAgICAgaGFzUGljdHVyZTogISFwaWN0dXJlIFxuICAgIH0pO1xuICAgIFxuICAgIC8vIEzhuqV5IOG6o25oIGNo4bqldCBsxrDhu6NuZyBjYW8gaMahbiB04burIEZhY2Vib29rIG7hur91IGPDs1xuICAgIGxldCBwcm9maWxlSW1hZ2VVcmwgPSAnJztcbiAgICBpZiAocGljdHVyZSAmJiBwaWN0dXJlLmRhdGEgJiYgIXBpY3R1cmUuZGF0YS5pc19zaWxob3VldHRlKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBUaOG7rSBs4bqleSDhuqNuaCBs4bubbiBoxqFuIHThu6sgRmFjZWJvb2sgR3JhcGggQVBJXG4gICAgICAgIGNvbnN0IHBpY3R1cmVSZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChgaHR0cHM6Ly9ncmFwaC5mYWNlYm9vay5jb20vdjE4LjAvJHtpZH0vcGljdHVyZWAsIHtcbiAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdsYXJnZScsXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZhbHNlJyxcbiAgICAgICAgICAgIGFjY2Vzc190b2tlbjogYWNjZXNzVG9rZW5cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgaWYgKHBpY3R1cmVSZXNwb25zZS5kYXRhICYmIHBpY3R1cmVSZXNwb25zZS5kYXRhLmRhdGEgJiYgcGljdHVyZVJlc3BvbnNlLmRhdGEuZGF0YS51cmwpIHtcbiAgICAgICAgICBwcm9maWxlSW1hZ2VVcmwgPSBwaWN0dXJlUmVzcG9uc2UuZGF0YS5kYXRhLnVybDtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlJldHJpZXZlZCBsYXJnZXIgRmFjZWJvb2sgcHJvZmlsZSBpbWFnZTpcIiwgcHJvZmlsZUltYWdlVXJsKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAocGljdHVyZUVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBmZXRjaGluZyBsYXJnZXIgcGljdHVyZTpcIiwgcGljdHVyZUVycm9yKTtcbiAgICAgICAgLy8gRmFsbGJhY2sgdG8gb3JpZ2luYWwgcGljdHVyZSBpZiBhdmFpbGFibGVcbiAgICAgICAgaWYgKHBpY3R1cmUgJiYgcGljdHVyZS5kYXRhICYmIHBpY3R1cmUuZGF0YS51cmwpIHtcbiAgICAgICAgICBwcm9maWxlSW1hZ2VVcmwgPSBwaWN0dXJlLmRhdGEudXJsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIEZhbGxiYWNrIHRvIGRlZmF1bHQgYXZhdGFyIGlmIG5vIEZhY2Vib29rIGltYWdlXG4gICAgaWYgKCFwcm9maWxlSW1hZ2VVcmwpIHtcbiAgICAgIHByb2ZpbGVJbWFnZVVybCA9ICdodHRwczovL3d3dy5ncmF2YXRhci5jb20vYXZhdGFyLz9kPW1wJnM9MjU2JztcbiAgICB9XG4gICAgXG4gICAgLy8gVMOsbSB1c2VyIHbhu5tpIEZhY2Vib29rSURcbiAgICBsZXQgdXNlciA9IGF3YWl0IFVzZXIuZmluZE9uZSh7IGZhY2Vib29rSWQ6IGlkIH0pO1xuICAgIFxuICAgIC8vIE7hur91IGtow7RuZyB0w6xtIHRo4bqleSB0aGVvIGZhY2Vib29rSWQgdsOgIGPDsyBlbWFpbCwgdGjhu60gdMOsbSB0aGVvIGVtYWlsXG4gICAgaWYgKCF1c2VyICYmIGVtYWlsKSB7XG4gICAgICB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgZW1haWwgfSk7XG4gICAgICAvLyBO4bq/dSB0w6xtIHRo4bqleSB0aGVvIGVtYWlsLCBj4bqtcCBuaOG6rXQgZmFjZWJvb2tJZFxuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgdXNlci5mYWNlYm9va0lkID0gaWQ7XG4gICAgICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBO4bq/dSB24bqrbiBraMO0bmcgdMOsbSB0aOG6pXkgdXNlciwgdOG6oW8gbeG7m2lcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIC8vIFThuqFvIHVzZXJuYW1lIG5n4bqrdSBuaGnDqm4gbuG6v3Uga2jDtG5nIGPDs1xuICAgICAgY29uc3QgdW5pcXVlVXNlcm5hbWUgPSBgZmJfJHtpZH1fJHtEYXRlLm5vdygpLnRvU3RyaW5nKCkuc2xpY2UoLTQpfWA7XG4gICAgICBcbiAgICAgIC8vIFThuqFvIG3huq10IGto4bqpdSBuZ+G6q3Ugbmhpw6puXG4gICAgICBjb25zdCByYW5kb21QYXNzd29yZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKC0xMCk7XG4gICAgICBjb25zdCBoYXNoZWRQYXNzd29yZCA9IGF3YWl0IGJjcnlwdC5oYXNoKHJhbmRvbVBhc3N3b3JkLCAxMCk7XG4gICAgICBcbiAgICAgIC8vIFThuqFvIGVtYWlsIGdp4bqjIG7hur91IGtow7RuZyBjw7MgZW1haWwgdOG7qyBGYWNlYm9va1xuICAgICAgY29uc3QgdXNlckVtYWlsID0gZW1haWwgfHwgYCR7dW5pcXVlVXNlcm5hbWV9QGZhY2Vib29rLnVzZXJgO1xuICAgICAgXG4gICAgICB1c2VyID0gbmV3IFVzZXIoe1xuICAgICAgICBlbWFpbDogdXNlckVtYWlsLFxuICAgICAgICBwaG9uZTogJzAwMDAwMDAwMDAnLCAvLyBQbGFjZWhvbGRlciBwaG9uZSBudW1iZXJcbiAgICAgICAgZmlyc3ROYW1lOiBmaXJzdF9uYW1lIHx8ICdGYWNlYm9vaycsXG4gICAgICAgIGxhc3ROYW1lOiBsYXN0X25hbWUgfHwgJ1VzZXInLFxuICAgICAgICB1c2VyTmFtZTogdW5pcXVlVXNlcm5hbWUsXG4gICAgICAgIHBhc3N3b3JkOiBoYXNoZWRQYXNzd29yZCxcbiAgICAgICAgdXNlckltYWdlOiBwcm9maWxlSW1hZ2VVcmwsXG4gICAgICAgIGZhY2Vib29rSWQ6IGlkLFxuICAgICAgICBhdXRoUHJvdmlkZXI6ICdmYWNlYm9vaydcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBhd2FpdCB1c2VyLnNhdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ+G6rXAgbmjhuq10IGF2YXRhciBu4bq/dSBuZ8aw4budaSBkw7luZyDEkcOjIHThu5NuIHThuqFpXG4gICAgICBpZiAocHJvZmlsZUltYWdlVXJsICYmIHByb2ZpbGVJbWFnZVVybCAhPT0gJ2h0dHBzOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvP2Q9bXAmcz0yNTYnKSB7XG4gICAgICAgIHVzZXIudXNlckltYWdlID0gcHJvZmlsZUltYWdlVXJsO1xuICAgICAgICBhd2FpdCB1c2VyLnNhdmUoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gS2nhu4NtIHRyYSBu4bq/dSB0w6BpIGtob+G6o24gYuG7iyBjaOG6t25cbiAgICBpZiAodXNlci5pc0Jsb2NrZWQpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIlTDoGkga2hv4bqjbiDEkcOjIGLhu4sga2jDs2EuIFZ1aSBsw7JuZyBsacOqbiBo4buHIHF14bqjbiB0cuG7iyB2acOqbi5cIlxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIFThuqFvIHRva2Vuc1xuICAgIGNvbnN0IHRva2VuID0gand0LnNpZ24oXG4gICAgICB7XG4gICAgICAgIGlkOiB1c2VyLl9pZCxcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIHBlcm1pc3Npb25zOiBbXCJYZW1cIl1cbiAgICAgIH0sXG4gICAgICBwcm9jZXNzLmVudi5KV1RfU0VDUkVUX0FDQ0VTUyxcbiAgICAgIHsgZXhwaXJlc0luOiBcIjFkXCIgfVxuICAgICk7XG5cbiAgICBjb25zdCByZWZyZXNoVG9rZW4gPSBqd3Quc2lnbihcbiAgICAgIHsgaWQ6IHVzZXIuX2lkIH0sXG4gICAgICBwcm9jZXNzLmVudi5KV1RfUkVGUkVTSF9TRUNSRVQsXG4gICAgICB7IGV4cGlyZXNJbjogXCI3ZFwiIH1cbiAgICApO1xuICAgIFxuICAgIC8vIFjDs2EgcmVmcmVzaCB0b2tlbnMgY8WpIGPhu6dhIHVzZXIgbsOgeSB0csaw4bubYyBraGkgdOG6oW8gbeG7m2lcbiAgICB0cnkge1xuICAgICAgYXdhaXQgUmVmcmVzaFRva2VuLmRlbGV0ZU1hbnkoeyB1c2VySWQ6IHVzZXIuX2lkLCB1c2VyTW9kZWw6IFwiVXNlclwiIH0pO1xuICAgICAgXG4gICAgICAvLyBTYXUga2hpIHjDs2EgdG9rZW5zIGPFqSwgdOG6oW8gdG9rZW4gbeG7m2lcbiAgICAgIGF3YWl0IFJlZnJlc2hUb2tlbi5jcmVhdGUoe1xuICAgICAgICB1c2VySWQ6IHVzZXIuX2lkLFxuICAgICAgICB1c2VyTW9kZWw6IFwiVXNlclwiLFxuICAgICAgICB0b2tlbjogcmVmcmVzaFRva2VuLFxuICAgICAgICBleHBpcmVzQXQ6IG5ldyBEYXRlKERhdGUubm93KCkgKyA3ICogMjQgKiA2MCAqIDYwICogMTAwMClcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKHRva2VuRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBtYW5hZ2luZyByZWZyZXNoIHRva2VuczpcIiwgdG9rZW5FcnJvcik7XG4gICAgICAvLyBDb250aW51ZSBldmVuIGlmIHRva2VuIHN0b3JhZ2UgZmFpbHNcbiAgICB9XG4gICAgXG4gICAgLy8gQ+G6rXAgbmjhuq10IGxhc3RMb2dpblxuICAgIHVzZXIubGFzdExvZ2luID0gbmV3IERhdGUoKTtcbiAgICBhd2FpdCB1c2VyLnNhdmUoKTtcbiAgICBcbiAgICAvLyBH4butaSByZXNwb25zZVxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICB0b2tlbixcbiAgICAgIHJlZnJlc2hUb2tlbixcbiAgICAgIHVzZXI6IHtcbiAgICAgICAgaWQ6IHVzZXIuX2lkLFxuICAgICAgICBuYW1lOiBgJHt1c2VyLmZpcnN0TmFtZX0gJHt1c2VyLmxhc3ROYW1lfWAsXG4gICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxuICAgICAgICB1c2VySW1hZ2U6IHVzZXIudXNlckltYWdlLFxuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgcGVybWlzc2lvbnM6IFtcIlhlbVwiXVxuICAgICAgfSxcbiAgICAgIG1lc3NhZ2U6IFwixJDEg25nIG5o4bqtcCBi4bqxbmcgRmFjZWJvb2sgdGjDoG5oIGPDtG5nIVwiXG4gICAgfSk7XG4gICAgXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkZhY2Vib29rIHRva2VuIGxvZ2luIGVycm9yOlwiLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIsSQxINuZyBuaOG6rXAgYuG6sW5nIEZhY2Vib29rIHRo4bqldCBi4bqhaS4gVnVpIGzDsm5nIHRo4butIGzhuqFpLlwiXG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIEVuZHBvaW50IHRvIGdldCB1c2VyIGF2YXRhclxuZXhwb3J0IGNvbnN0IGdldFVzZXJBdmF0YXIgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB1c2VySWQgPSByZXEucGFyYW1zLmlkO1xuICAgIGNvbnNvbGUubG9nKFwiRmV0Y2hpbmcgYXZhdGFyIGZvciB1c2VyIElEOlwiLCB1c2VySWQpO1xuICAgIFxuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBVc2VyLmZpbmRCeUlkKHVzZXJJZCkuc2VsZWN0KFwidXNlckltYWdlIGZpcnN0TmFtZSBsYXN0TmFtZSBlbWFpbCBhdXRoUHJvdmlkZXIgZmFjZWJvb2tJZFwiKTtcblxuICAgIGlmICghdXNlcikge1xuICAgICAgY29uc29sZS5sb2coXCJVc2VyIG5vdCBmb3VuZCBmb3IgSUQ6XCIsIHVzZXJJZCk7XG4gICAgICByZXR1cm4gcmVzLmpzb24oeyB1c2VySW1hZ2U6ICdodHRwczovL3d3dy5ncmF2YXRhci5jb20vYXZhdGFyLz9kPW1wJnM9MjU2JyB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhcIlVzZXIgZm91bmQ6XCIsIHVzZXIuZW1haWwsIFwiLSBJbWFnZTpcIiwgdXNlci51c2VySW1hZ2UpO1xuXG4gICAgLy8gTuG6v3UgbmfGsOG7nWkgZMO5bmcgxJFhbmcgc+G7rSBk4bulbmcgRmFjZWJvb2sgdsOgIGtow7RuZyBjw7Mg4bqjbmggxJHhuqFpIGRp4buHblxuICAgIGlmICh1c2VyLmF1dGhQcm92aWRlciA9PT0gJ2ZhY2Vib29rJyAmJiAoIXVzZXIudXNlckltYWdlIHx8IHVzZXIudXNlckltYWdlLmluY2x1ZGVzKCdwbGF0Zm9ybS1sb29rYXNpZGUuZmJzYnguY29tJykpKSB7XG4gICAgICBpZiAodXNlci5mYWNlYm9va0lkKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gVOG6oW8gbeG7mXQgYXZhdGFyIHThu5F0IGjGoW4gY2hvIG5nxrDhu51pIGTDuW5nIEZhY2Vib29rXG4gICAgICAgICAgY29uc3QgZmJBdmF0YXJVcmwgPSBgaHR0cHM6Ly9ncmFwaC5mYWNlYm9vay5jb20vJHt1c2VyLmZhY2Vib29rSWR9L3BpY3R1cmU/dHlwZT1sYXJnZWA7XG4gICAgICAgICAgcmV0dXJuIHJlcy5qc29uKHsgdXNlckltYWdlOiBmYkF2YXRhclVybCB9KTtcbiAgICAgICAgfSBjYXRjaCAoZmJFcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjcmVhdGluZyBGYWNlYm9vayBhdmF0YXIgVVJMOlwiLCBmYkVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gRmFsbGJhY2sgbuG6v3Uga2jDtG5nIGzhuqV5IMSRxrDhu6NjIOG6o25oIEZhY2Vib29rXG4gICAgICByZXR1cm4gcmVzLmpzb24oeyB1c2VySW1hZ2U6ICdodHRwczovL3d3dy5ncmF2YXRhci5jb20vYXZhdGFyLz9kPW1wJnM9MjU2JyB9KTtcbiAgICB9XG5cbiAgICAvLyBJZiB1c2VyIGhhcyBhIHVzZXJJbWFnZSB0aGF0IGlzIGEgVVJMLCByZXR1cm4gdGhlIFVSTCBkaXJlY3RseVxuICAgIGlmICh1c2VyLnVzZXJJbWFnZSAmJiAodXNlci51c2VySW1hZ2Uuc3RhcnRzV2l0aCgnaHR0cDovLycpIHx8IHVzZXIudXNlckltYWdlLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykpKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlJldHVybmluZyBleHRlcm5hbCBhdmF0YXIgVVJMOlwiLCB1c2VyLnVzZXJJbWFnZSk7XG4gICAgICByZXR1cm4gcmVzLmpzb24oeyB1c2VySW1hZ2U6IHVzZXIudXNlckltYWdlIH0pO1xuICAgIH1cblxuICAgIC8vIElmIHVzZXIgaGFzIGEgbG9jYWwgaW1hZ2UgKGUuZy4gdXBsb2FkZWQgZmlsZSBwYXRoKSwgc2VydmUgdGhhdFxuICAgIGlmICh1c2VyLnVzZXJJbWFnZSkge1xuICAgICAgY29uc29sZS5sb2coXCJTZXJ2aW5nIGxvY2FsIGF2YXRhclwiKTtcbiAgICAgIC8vIFlvdSBtaWdodCBuZWVkIHRvIGFkanVzdCB0aGlzIGRlcGVuZGluZyBvbiBob3cgeW91ciBpbWFnZXMgYXJlIHN0b3JlZFxuICAgICAgcmV0dXJuIHJlcy5zZW5kRmlsZSh1c2VyLnVzZXJJbWFnZSwgeyByb290OiBwcm9jZXNzLmN3ZCgpIH0pO1xuICAgIH1cblxuICAgIC8vIElmIG5vIGltYWdlIGlzIGZvdW5kLCByZXR1cm4gYSBkZWZhdWx0IGF2YXRhclxuICAgIGNvbnNvbGUubG9nKFwiTm8gYXZhdGFyIGZvdW5kLCB1c2luZyBkZWZhdWx0XCIpO1xuICAgIHJldHVybiByZXMuanNvbih7IHVzZXJJbWFnZTogJ2h0dHBzOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvP2Q9bXAmcz0yNTYnIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBmZXRjaGluZyB1c2VyIGF2YXRhcjpcIiwgZXJyb3IpO1xuICAgIHJldHVybiByZXMuanNvbih7IHVzZXJJbWFnZTogJ2h0dHBzOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvP2Q9bXAmcz0yNTYnIH0pO1xuICB9XG59O1xuXG4vLyBOZXcgY29udHJvbGxlciBmdW5jdGlvbiB0byBwcm92aWRlIFZBUElEIHB1YmxpYyBrZXlcbmV4cG9ydCBjb25zdCBnZXRWYXBpZFB1YmxpY0tleSA9IChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKFwiW2dldFZhcGlkUHVibGljS2V5XSDEkGFuZyBs4bqleSBWQVBJRCBwdWJsaWMga2V5IHThu6sgYmnhur9uIG3DtGkgdHLGsOG7nW5nLi4uXCIpO1xuICAgIFxuICAgIGNvbnN0IHZhcGlkUHVibGljS2V5ID0gcHJvY2Vzcy5lbnYuVkFQSURfUFVCTElDX0tFWTtcbiAgICBjb25zb2xlLmxvZyhcIltnZXRWYXBpZFB1YmxpY0tleV0gVkFQSURfUFVCTElDX0tFWTpcIiwgdmFwaWRQdWJsaWNLZXkgPyBcIkZvdW5kXCIgOiBcIk5vdCBmb3VuZFwiKTtcbiAgICBcbiAgICBpZiAoIXZhcGlkUHVibGljS2V5KSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiW2dldFZhcGlkUHVibGljS2V5XSBWQVBJRCBQdWJsaWMgS2V5IG5vdCBjb25maWd1cmVkIGluIGVudmlyb25tZW50IHZhcmlhYmxlc1wiKTtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6IFwiVkFQSUQgUHVibGljIEtleSBub3QgY29uZmlndXJlZCBvbiBzZXJ2ZXIuXCIgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIExvZyB0byBjb25maXJtIHRoZSBrZXkgaXMgdmFsaWQgKHNob3VsZCBiZSBCYXNlNjQgVVJMLXNhZmUgZW5jb2RlZClcbiAgICBjb25zdCBpc1ZhbGlkQmFzZTY0ID0gL15bQS1aYS16MC05XFwtX10rPSokLy50ZXN0KHZhcGlkUHVibGljS2V5KTtcbiAgICBjb25zb2xlLmxvZyhcIltnZXRWYXBpZFB1YmxpY0tleV0gS2V5IGFwcGVhcnMgdG8gYmUgdmFsaWQgQmFzZTY0OlwiLCBpc1ZhbGlkQmFzZTY0KTtcbiAgICBjb25zb2xlLmxvZyhcIltnZXRWYXBpZFB1YmxpY0tleV0gS2V5IGxlbmd0aDpcIiwgdmFwaWRQdWJsaWNLZXkubGVuZ3RoKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhcIltnZXRWYXBpZFB1YmxpY0tleV0gUmV0dXJuaW5nIFZBUElEIHB1YmxpYyBrZXkgdG8gY2xpZW50XCIpO1xuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgdmFwaWRQdWJsaWNLZXk6IHZhcGlkUHVibGljS2V5IH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJbZ2V0VmFwaWRQdWJsaWNLZXldIEVycm9yIHByb3ZpZGluZyBWQVBJRCBQdWJsaWMgS2V5OlwiLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgfVxufTtcblxuLy8gQ29udHJvbGxlciBmdW5jdGlvbiB0byBzdWJzY3JpYmUgYSB1c2VyIHRvIHB1c2ggbm90aWZpY2F0aW9uc1xuZXhwb3J0IGNvbnN0IHN1YnNjcmliZVRvUHVzaCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCBzdWJzY3JpcHRpb24gPSByZXEuYm9keTtcbiAgY29uc3QgdXNlcklkID0gcmVxLnVzZXIuaWQ7XG5cbiAgY29uc29sZS5sb2coYFtzdWJzY3JpYmVUb1B1c2hdIMSQYW5nIHjhu60gbMO9IHnDqnUgY+G6p3UgxJHEg25nIGvDvSB0aMO0bmcgYsOhbyBjaG8gdXNlciAke3VzZXJJZH1gKTtcbiAgY29uc29sZS5sb2coYFtzdWJzY3JpYmVUb1B1c2hdIEThu68gbGnhu4d1IHN1YnNjcmlwdGlvbjpgLCBKU09OLnN0cmluZ2lmeShzdWJzY3JpcHRpb24sIG51bGwsIDIpKTtcblxuICBpZiAoIXN1YnNjcmlwdGlvbiB8fCAhc3Vic2NyaXB0aW9uLmVuZHBvaW50KSB7XG4gICAgY29uc29sZS5lcnJvcihgW3N1YnNjcmliZVRvUHVzaF0gTWlzc2luZyBvciBpbnZhbGlkIHN1YnNjcmlwdGlvbiBvYmplY3RgKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBtZXNzYWdlOiBcIlB1c2ggc3Vic2NyaXB0aW9uIG9iamVjdCBpcyByZXF1aXJlZC5cIiB9KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgLy8gU2V0IHRpbWVvdXQgZm9yIE1vbmdvREIgb3BlcmF0aW9uc1xuICAgIGNvbnN0IHRpbWVvdXRQcm9taXNlID0gbmV3IFByb21pc2UoKF8sIHJlamVjdCkgPT4gXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IoJ0RhdGFiYXNlIG9wZXJhdGlvbiB0aW1lZCBvdXQnKSksIDUwMDApXG4gICAgKTtcblxuICAgIC8vIEZpbmQgdXNlciB3aXRoIHRpbWVvdXRcbiAgICBjb25zdCB1c2VyUHJvbWlzZSA9IFVzZXIuZmluZEJ5SWQodXNlcklkKTtcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgUHJvbWlzZS5yYWNlKFt1c2VyUHJvbWlzZSwgdGltZW91dFByb21pc2VdKTtcblxuICAgIGlmICghdXNlcikge1xuICAgICAgY29uc29sZS5lcnJvcihgW3N1YnNjcmliZVRvUHVzaF0gVXNlciBub3QgZm91bmQ6ICR7dXNlcklkfWApO1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJVc2VyIG5vdCBmb3VuZC5cIiB9KTtcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXplIHB1c2hTdWJzY3JpcHRpb25zIGFycmF5IGlmIG5vdCBleGlzdHNcbiAgICBpZiAoIXVzZXIucHVzaFN1YnNjcmlwdGlvbnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbc3Vic2NyaWJlVG9QdXNoXSBJbml0aWFsaXppbmcgcHVzaFN1YnNjcmlwdGlvbnMgYXJyYXkgZm9yIHVzZXI6ICR7dXNlcklkfWApO1xuICAgICAgdXNlci5wdXNoU3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBleGlzdGluZyBzdWJzY3JpcHRpb25cbiAgICBjb25zdCBleGlzdGluZ1N1YnNjcmlwdGlvbiA9IHVzZXIucHVzaFN1YnNjcmlwdGlvbnMuZmluZChcbiAgICAgIChzdWIpID0+IHN1Yi5lbmRwb2ludCA9PT0gc3Vic2NyaXB0aW9uLmVuZHBvaW50XG4gICAgKTtcblxuICAgIGlmIChleGlzdGluZ1N1YnNjcmlwdGlvbikge1xuICAgICAgY29uc29sZS5sb2coYFtzdWJzY3JpYmVUb1B1c2hdIFN1YnNjcmlwdGlvbiBhbHJlYWR5IGV4aXN0cyBmb3IgdXNlcjogJHt1c2VySWR9YCk7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBcbiAgICAgICAgbWVzc2FnZTogXCJTdWJzY3JpcHRpb24gYWxyZWFkeSBleGlzdHMuXCIsXG4gICAgICAgIHN1YnNjcmlwdGlvbkNvdW50OiB1c2VyLnB1c2hTdWJzY3JpcHRpb25zLmxlbmd0aFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgc3Vic2NyaXB0aW9uXG4gICAgaWYgKCFzdWJzY3JpcHRpb24ua2V5cyB8fCAhc3Vic2NyaXB0aW9uLmtleXMucDI1NmRoIHx8ICFzdWJzY3JpcHRpb24ua2V5cy5hdXRoKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbc3Vic2NyaWJlVG9QdXNoXSBJbnZhbGlkIHN1YnNjcmlwdGlvbiBvYmplY3QsIG1pc3NpbmcgcmVxdWlyZWQga2V5c2ApO1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgbWVzc2FnZTogXCJJbnZhbGlkIHN1YnNjcmlwdGlvbiBvYmplY3QuIE1pc3NpbmcgcmVxdWlyZWQga2V5cy5cIiB9KTtcbiAgICB9XG5cbiAgICAvLyBBZGQgbmV3IHN1YnNjcmlwdGlvblxuICAgIGNvbnNvbGUubG9nKGBbc3Vic2NyaWJlVG9QdXNoXSBBZGRpbmcgbmV3IHN1YnNjcmlwdGlvbiBmb3IgdXNlcjogJHt1c2VySWR9YCk7XG4gICAgdXNlci5wdXNoU3Vic2NyaXB0aW9ucy5wdXNoKHN1YnNjcmlwdGlvbik7XG5cbiAgICAvLyBTYXZlIHdpdGggdGltZW91dFxuICAgIGNvbnN0IHNhdmVQcm9taXNlID0gdXNlci5zYXZlKCk7XG4gICAgYXdhaXQgUHJvbWlzZS5yYWNlKFtzYXZlUHJvbWlzZSwgdGltZW91dFByb21pc2VdKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgW3N1YnNjcmliZVRvUHVzaF0gU3Vic2NyaXB0aW9uIHNhdmVkIHN1Y2Nlc3NmdWxseS4gVG90YWwgc3Vic2NyaXB0aW9uczogJHt1c2VyLnB1c2hTdWJzY3JpcHRpb25zLmxlbmd0aH1gKTtcblxuICAgIC8vIFNlbmQgcmVzcG9uc2UgaW1tZWRpYXRlbHkgYWZ0ZXIgc2F2aW5nXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oeyBcbiAgICAgIG1lc3NhZ2U6IFwiUHVzaCBzdWJzY3JpcHRpb24gc2F2ZWQgc3VjY2Vzc2Z1bGx5LlwiLFxuICAgICAgc3Vic2NyaXB0aW9uQ291bnQ6IHVzZXIucHVzaFN1YnNjcmlwdGlvbnMubGVuZ3RoXG4gICAgfSk7XG5cbiAgICAvLyBTZW5kIHRlc3Qgbm90aWZpY2F0aW9uIGFzeW5jaHJvbm91c2x5IGFmdGVyIHJlc3BvbnNlXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRlc3RQYXlsb2FkID0ge1xuICAgICAgICBub3RpZmljYXRpb246IHtcbiAgICAgICAgICB0aXRsZTogXCLEkMSDbmcga8O9IHRow6BuaCBjw7RuZ1wiLFxuICAgICAgICAgIGJvZHk6IFwiQuG6oW4gxJHDoyDEkcSDbmcga8O9IG5o4bqtbiB0aMO0bmcgYsOhbyB0aMOgbmggY8O0bmchXCIsXG4gICAgICAgICAgaWNvbjogXCIvTG9nby5wbmdcIixcbiAgICAgICAgICB2aWJyYXRlOiBbMTAwLCA1MCwgMTAwXSxcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICB1cmw6IFwiL1wiLFxuICAgICAgICAgICAgZGF0ZU9mQXJyaXZhbDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIHByaW1hcnlLZXk6IDEsXG4gICAgICAgICAgICB0eXBlOiBcInRlc3Rfbm90aWZpY2F0aW9uXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBcbiAgICAgIC8vIEFkZCByZXRyeSBsb2dpYyBmb3Igc2VuZGluZyBub3RpZmljYXRpb25cbiAgICAgIGxldCByZXRyaWVzID0gMztcbiAgICAgIHdoaWxlIChyZXRyaWVzID4gMCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbc3Vic2NyaWJlVG9QdXNoXSBTZW5kaW5nIHRlc3Qgbm90aWZpY2F0aW9uIHRvIG5ldyBzdWJzY3JpcHRpb24gKGF0dGVtcHQgJHs0LXJldHJpZXN9LzMpYCk7XG4gICAgICAgICAgYXdhaXQgd2VicHVzaC5zZW5kTm90aWZpY2F0aW9uKHN1YnNjcmlwdGlvbiwgSlNPTi5zdHJpbmdpZnkodGVzdFBheWxvYWQpKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW3N1YnNjcmliZVRvUHVzaF0gVGVzdCBub3RpZmljYXRpb24gc2VudCBzdWNjZXNzZnVsbHlgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICByZXRyaWVzLS07XG4gICAgICAgICAgaWYgKHJldHJpZXMgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtzdWJzY3JpYmVUb1B1c2hdIEZhaWxlZCB0byBzZW5kIHRlc3Qgbm90aWZpY2F0aW9uIGFmdGVyIDMgYXR0ZW1wdHM6YCwgZXJyb3IpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3N1YnNjcmliZVRvUHVzaF0gUmV0cnlpbmcgdGVzdCBub3RpZmljYXRpb24uLi5gKTtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDAwKSk7IC8vIFdhaXQgMXMgYmVmb3JlIHJldHJ5XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAobm90aWZpY2F0aW9uRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFtzdWJzY3JpYmVUb1B1c2hdIEVycm9yIGluIHRlc3Qgbm90aWZpY2F0aW9uIHByb2Nlc3M6YCwgbm90aWZpY2F0aW9uRXJyb3IpO1xuICAgICAgLy8gRG9uJ3QgdGhyb3cgZXJyb3Igc2luY2Ugd2UgYWxyZWFkeSBzZW50IHN1Y2Nlc3MgcmVzcG9uc2VcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgW3N1YnNjcmliZVRvUHVzaF0gRXJyb3Igc2F2aW5nIHB1c2ggc3Vic2NyaXB0aW9uOmAsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgbWVzc2FnZTogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3Igd2hpbGUgc2F2aW5nIHN1YnNjcmlwdGlvblwiLCBcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlIFxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBWYWxpZGF0ZSBQdXNoIFN1YnNjcmlwdGlvblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlU3Vic2NyaXB0aW9uID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBzdWJzY3JpcHRpb24gfSA9IHJlcS5ib2R5O1xuICAgIFxuICAgIGlmICghc3Vic2NyaXB0aW9uKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiU3Vic2NyaXB0aW9uIGRhdGEgaXMgcmVxdWlyZWRcIiBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHdlYnB1c2ggPSByZXF1aXJlKCd3ZWItcHVzaCcpO1xuICAgIFxuICAgIC8vIENvbmZpZ3VyZSB3ZWItcHVzaCB3aXRoIFZBUElEIGtleXNcbiAgICB3ZWJwdXNoLnNldFZhcGlkRGV0YWlscyhcbiAgICAgICdtYWlsdG86ZGFuaW5jLnN5c3RlbUBnbWFpbC5jb20nLFxuICAgICAgcHJvY2Vzcy5lbnYuVkFQSURfUFVCTElDX0tFWSxcbiAgICAgIHByb2Nlc3MuZW52LlZBUElEX1BSSVZBVEVfS0VZXG4gICAgKTtcbiAgICBcbiAgICAvLyBTZW5kIGEgc21hbGwgdGVzdCBub3RpZmljYXRpb24gcGF5bG9hZFxuICAgIGNvbnN0IHRlc3RQYXlsb2FkID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgdGl0bGU6IFwiVmFsaWRhdGlvbiBUZXN0XCIsXG4gICAgICBib2R5OiBcIlRoaXMgaXMgYSB0ZXN0IHRvIHZhbGlkYXRlIHlvdXIgc3Vic2NyaXB0aW9uXCIsXG4gICAgICBzaWxlbnQ6IHRydWVcbiAgICB9KTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8gVHJ5IHRvIHNlbmQgYSBub3RpZmljYXRpb24gdG8gY2hlY2sgaWYgdGhlIHN1YnNjcmlwdGlvbiBpcyB2YWxpZFxuICAgICAgYXdhaXQgd2VicHVzaC5zZW5kTm90aWZpY2F0aW9uKHN1YnNjcmlwdGlvbiwgdGVzdFBheWxvYWQpO1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHZhbGlkOiB0cnVlLFxuICAgICAgICBtZXNzYWdlOiBcIlN1YnNjcmlwdGlvbiBpcyB2YWxpZFwiIFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiVmFsaWRhdGlvbiBlcnJvcjpcIiwgZXJyb3IpO1xuICAgICAgXG4gICAgICAvLyBDaGVjayBmb3Igc3BlY2lmaWMgZXJyb3Igc3RhdHVzIGNvZGVzXG4gICAgICBpZiAoZXJyb3Iuc3RhdHVzQ29kZSA9PT0gNDA0IHx8IGVycm9yLnN0YXR1c0NvZGUgPT09IDQxMCkge1xuICAgICAgICAvLyA0MDQ6IE5vdCBGb3VuZCwgNDEwOiBHb25lIC0gU3Vic2NyaXB0aW9uIGhhcyBleHBpcmVkIG9yIGlzIGludmFsaWRcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgXG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICB2YWxpZDogZmFsc2UsXG4gICAgICAgICAgbWVzc2FnZTogXCJTdWJzY3JpcHRpb24gaGFzIGV4cGlyZWQgb3IgaXMgaW52YWxpZFwiLFxuICAgICAgICAgIGVycm9yOiBlcnJvci5ib2R5IHx8IGVycm9yLm1lc3NhZ2VcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKGVycm9yLnN0YXR1c0NvZGUgPT09IDQwMCkge1xuICAgICAgICAvLyBCYWQgcmVxdWVzdCAtIEludmFsaWQgc3Vic2NyaXB0aW9uXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IFxuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgdmFsaWQ6IGZhbHNlLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiSW52YWxpZCBzdWJzY3JpcHRpb24gZm9ybWF0XCIsXG4gICAgICAgICAgZXJyb3I6IGVycm9yLmJvZHkgfHwgZXJyb3IubWVzc2FnZVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE90aGVyIGVycm9yc1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIHZhbGlkOiBmYWxzZSxcbiAgICAgICAgICBtZXNzYWdlOiBcIkVycm9yIHZhbGlkYXRpbmcgc3Vic2NyaXB0aW9uXCIsXG4gICAgICAgICAgZXJyb3I6IGVycm9yLmJvZHkgfHwgZXJyb3IubWVzc2FnZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIlZhbGlkYXRlIHN1YnNjcmlwdGlvbiBlcnJvcjpcIiwgZXJyb3IpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIlNlcnZlciBlcnJvciB3aGlsZSB2YWxpZGF0aW5nIHN1YnNjcmlwdGlvblwiIFxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBU4bqhby9j4bqtcCBuaOG6rXQgxJHhu4thIGNo4buJIG3hurdjIMSR4buLbmggxJHGoW4gbOG6uyB04burIG3huqNuZyDEkeG7i2EgY2jhu4kgY2hvIHTDrW5oIHTGsMahbmcgdGjDrWNoIG5nxrDhu6NjXG5jb25zdCB1cGRhdGVEZWZhdWx0QWRkcmVzc0ZvckJhY2t3YXJkQ29tcGF0aWJpbGl0eSA9IGFzeW5jICh1c2VySWQpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhgW3VwZGF0ZURlZmF1bHRBZGRyZXNzRm9yQmFja3dhcmRDb21wYXRpYmlsaXR5XSBVcGRhdGluZyBsZWdhY3kgYWRkcmVzcyBmb3IgdXNlciAke3VzZXJJZH1gKTtcbiAgICBcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kQnlJZCh1c2VySWQpO1xuICAgIGlmICghdXNlcikge1xuICAgICAgY29uc29sZS5sb2coYFt1cGRhdGVEZWZhdWx0QWRkcmVzc0ZvckJhY2t3YXJkQ29tcGF0aWJpbGl0eV0gVXNlciBub3QgZm91bmQ6ICR7dXNlcklkfWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICAvLyBUw6xtIMSR4buLYSBjaOG7iSBt4bq3YyDEkeG7i25oIHRyb25nIG3huqNuZ1xuICAgIGNvbnN0IGRlZmF1bHRBZGRyZXNzID0gdXNlci5hZGRyZXNzZXMuZmluZChhZGRyID0+IGFkZHIuaXNEZWZhdWx0ID09PSB0cnVlKTtcbiAgICBcbiAgICBpZiAoZGVmYXVsdEFkZHJlc3MpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbdXBkYXRlRGVmYXVsdEFkZHJlc3NGb3JCYWNrd2FyZENvbXBhdGliaWxpdHldIEZvdW5kIGRlZmF1bHQgYWRkcmVzczogJHtkZWZhdWx0QWRkcmVzcy5mdWxsQWRkcmVzc31gKTtcbiAgICAgIFxuICAgICAgLy8gQ+G6rXAgbmjhuq10IHRyxrDhu51uZyBhZGRyZXNzIGxlZ2FjeSAtIMSR4bqjbSBi4bqjbyBraMO0bmcgcGjhuqNpIHVuZGVmaW5lZFxuICAgICAgdXNlci5hZGRyZXNzID0gZGVmYXVsdEFkZHJlc3MuZnVsbEFkZHJlc3MgfHwgJyc7XG4gICAgICBcbiAgICAgIC8vIEPhuq1wIG5o4bqtdCBjw6FjIHRyxrDhu51uZyByacOqbmcgbOG6uyBjaG8gxJHhu4thIGNo4buJIChu4bq/dSBjw7MpXG4gICAgICB1c2VyLmhvdXNlTnVtYmVyID0gZGVmYXVsdEFkZHJlc3MuaG91c2VOdW1iZXIgfHwgJyc7XG4gICAgICB1c2VyLndhcmQgPSBkZWZhdWx0QWRkcmVzcy53YXJkIHx8ICcnO1xuICAgICAgdXNlci5kaXN0cmljdCA9IGRlZmF1bHRBZGRyZXNzLmRpc3RyaWN0IHx8ICcnO1xuICAgICAgdXNlci5wcm92aW5jZSA9IGRlZmF1bHRBZGRyZXNzLnByb3ZpbmNlIHx8ICcnO1xuICAgICAgXG4gICAgICAvLyBTYW8gY2jDqXAgdOG7jWEgxJHhu5kgbuG6v3UgY8OzXG4gICAgICBpZiAoZGVmYXVsdEFkZHJlc3MuY29vcmRpbmF0ZXMgJiYgZGVmYXVsdEFkZHJlc3MuY29vcmRpbmF0ZXMubGF0ICYmIGRlZmF1bHRBZGRyZXNzLmNvb3JkaW5hdGVzLmxuZykge1xuICAgICAgICB1c2VyLmNvb3JkaW5hdGVzID0ge1xuICAgICAgICAgIGxhdDogZGVmYXVsdEFkZHJlc3MuY29vcmRpbmF0ZXMubGF0LFxuICAgICAgICAgIGxuZzogZGVmYXVsdEFkZHJlc3MuY29vcmRpbmF0ZXMubG5nXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIMSQ4bqjbSBi4bqjbyBmdWxsQWRkcmVzcyDEkcaw4bujYyBj4bqtcCBuaOG6rXRcbiAgICAgIHVzZXIuZnVsbEFkZHJlc3MgPSBkZWZhdWx0QWRkcmVzcy5mdWxsQWRkcmVzcyB8fCAnJztcbiAgICAgIFxuICAgICAgLy8gxJDDoW5oIGThuqV1IGzDoCDEkcOjIHPhu61hIMSR4buVaSDEkeG7gyDEkeG6o20gYuG6o28gbW9uZ29vc2UgY+G6rXAgbmjhuq10XG4gICAgICB1c2VyLm1hcmtNb2RpZmllZCgnYWRkcmVzcycpO1xuICAgICAgdXNlci5tYXJrTW9kaWZpZWQoJ2Nvb3JkaW5hdGVzJyk7XG4gICAgICBcbiAgICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuICAgICAgY29uc29sZS5sb2coYFt1cGRhdGVEZWZhdWx0QWRkcmVzc0ZvckJhY2t3YXJkQ29tcGF0aWJpbGl0eV0gVXBkYXRlZCBsZWdhY3kgYWRkcmVzcyBmaWVsZHMgZm9yIHVzZXIgJHt1c2VySWR9YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbdXBkYXRlRGVmYXVsdEFkZHJlc3NGb3JCYWNrd2FyZENvbXBhdGliaWxpdHldIE5vIGRlZmF1bHQgYWRkcmVzcyBmb3VuZCBmb3IgdXNlciAke3VzZXJJZH1gKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgW3VwZGF0ZURlZmF1bHRBZGRyZXNzRm9yQmFja3dhcmRDb21wYXRpYmlsaXR5XSBFcnJvciB1cGRhdGluZyBsZWdhY3kgYWRkcmVzczpgLCBlcnJvcik7XG4gIH1cbn07XG5cbi8vIFRow6ptIMSR4buLYSBjaOG7iSBt4bubaVxuZXhwb3J0IGNvbnN0IGFkZFVzZXJBZGRyZXNzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyB1c2VySWQgfSA9IHJlcS5wYXJhbXM7XG4gICAgY29uc3QgYWRkcmVzc0RhdGEgPSByZXEuYm9keTtcbiAgICBcbiAgICBpZiAoIWFkZHJlc3NEYXRhLmZ1bGxBZGRyZXNzKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJWdWkgbMOybmcgY3VuZyBj4bqlcCDEkeG7i2EgY2jhu4kgxJHhuqd5IMSR4bunXCJcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBVc2VyLmZpbmRCeUlkKHVzZXJJZCk7XG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgbmfGsOG7nWkgZMO5bmdcIlxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gTuG6v3UgxJHDonkgbMOgIMSR4buLYSBjaOG7iSDEkeG6p3UgdGnDqm4sIMSR4bq3dCBuw7MgbMOgbSBt4bq3YyDEkeG7i25oXG4gICAgaWYgKCF1c2VyLmFkZHJlc3NlcyB8fCB1c2VyLmFkZHJlc3Nlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGFkZHJlc3NEYXRhLmlzRGVmYXVsdCA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChhZGRyZXNzRGF0YS5pc0RlZmF1bHQpIHtcbiAgICAgIC8vIE7hur91IMSR4buLYSBjaOG7iSBt4bubaSBsw6AgbeG6t2MgxJHhu4tuaCwgY+G6rXAgbmjhuq10IHThuqV0IGPhuqMgY8OhYyDEkeG7i2EgY2jhu4kga2jDoWMgdGjDoG5oIGtow7RuZyBt4bq3YyDEkeG7i25oXG4gICAgICB1c2VyLmFkZHJlc3Nlcy5mb3JFYWNoKGFkZHIgPT4ge1xuICAgICAgICBhZGRyLmlzRGVmYXVsdCA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIE7hur91IGtow7RuZyBjw7MgdGjDtG5nIHRpbiBuZ8aw4budaSBuaOG6rW4sIHPhu60gZOG7pW5nIHRow7RuZyB0aW4gbmfGsOG7nWkgZMO5bmdcbiAgICBpZiAoIWFkZHJlc3NEYXRhLnJlY2VpdmVyTmFtZSkge1xuICAgICAgYWRkcmVzc0RhdGEucmVjZWl2ZXJOYW1lID0gYCR7dXNlci5maXJzdE5hbWV9ICR7dXNlci5sYXN0TmFtZX1gO1xuICAgIH1cbiAgICBcbiAgICBpZiAoIWFkZHJlc3NEYXRhLnJlY2VpdmVyUGhvbmUpIHtcbiAgICAgIGFkZHJlc3NEYXRhLnJlY2VpdmVyUGhvbmUgPSB1c2VyLnBob25lO1xuICAgIH1cblxuICAgIC8vIFRow6ptIMSR4buLYSBjaOG7iSBt4bubaSB2w6BvIG3huqNuZ1xuICAgIHVzZXIuYWRkcmVzc2VzLnB1c2goYWRkcmVzc0RhdGEpO1xuXG4gICAgLy8gTuG6v3UgxJHDonkgbMOgIMSR4buLYSBjaOG7iSBt4bq3YyDEkeG7i25oLCBj4bqtcCBuaOG6rXQgdHLGsOG7nW5nIGFkZHJlc3MgY8WpXG4gICAgaWYgKGFkZHJlc3NEYXRhLmlzRGVmYXVsdCB8fCB1c2VyLmFkZHJlc3Nlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGF3YWl0IHVwZGF0ZURlZmF1bHRBZGRyZXNzRm9yQmFja3dhcmRDb21wYXRpYmlsaXR5KHVzZXJJZCk7XG4gICAgfVxuXG4gICAgLy8gTMawdSBuZ8aw4budaSBkw7luZyDEkcOjIGPhuq1wIG5o4bqtdFxuICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwiVGjDqm0gxJHhu4thIGNo4buJIHRow6BuaCBjw7RuZ1wiLFxuICAgICAgYWRkcmVzc2VzOiB1c2VyLmFkZHJlc3Nlc1xuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgdGjDqm0gxJHhu4thIGNo4buJOlwiLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIHRow6ptIMSR4buLYSBjaOG7iVwiLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gTOG6pXkgdOG6pXQgY+G6oyDEkeG7i2EgY2jhu4kgY+G7p2EgbmfGsOG7nWkgZMO5bmdcbmV4cG9ydCBjb25zdCBnZXRVc2VyQWRkcmVzc2VzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyB1c2VySWQgfSA9IHJlcS5wYXJhbXM7XG4gICAgXG4gICAgbGV0IHVzZXIgPSBhd2FpdCBVc2VyLmZpbmRCeUlkKHVzZXJJZCk7XG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgbmfGsOG7nWkgZMO5bmdcIlxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIE1pZ3JhdGUgbGVnYWN5IGFkZHJlc3MgaWYgbmVlZGVkXG4gICAgdXNlciA9IGF3YWl0IG1pZ3JhdGVMZWdhY3lBZGRyZXNzKHVzZXIpO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGFkZHJlc3NlczogdXNlci5hZGRyZXNzZXMgfHwgW11cbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGzhuqV5IGRhbmggc8OhY2ggxJHhu4thIGNo4buJOlwiLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIGzhuqV5IGRhbmggc8OhY2ggxJHhu4thIGNo4buJXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBD4bqtcCBuaOG6rXQgxJHhu4thIGNo4buJXG5leHBvcnQgY29uc3QgdXBkYXRlVXNlckFkZHJlc3MgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHVzZXJJZCwgYWRkcmVzc0lkIH0gPSByZXEucGFyYW1zO1xuICAgIGNvbnN0IHVwZGF0ZWREYXRhID0gcmVxLmJvZHk7XG4gICAgXG4gICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuZmluZEJ5SWQodXNlcklkKTtcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBuZ8aw4budaSBkw7luZ1wiXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBUw6xtIMSR4buLYSBjaOG7iSBj4bqnbiBj4bqtcCBuaOG6rXRcbiAgICBjb25zdCBhZGRyZXNzSW5kZXggPSB1c2VyLmFkZHJlc3Nlcy5maW5kSW5kZXgoXG4gICAgICBhZGRyID0+IGFkZHIuX2lkLnRvU3RyaW5nKCkgPT09IGFkZHJlc3NJZFxuICAgICk7XG5cbiAgICBpZiAoYWRkcmVzc0luZGV4ID09PSAtMSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSR4buLYSBjaOG7iVwiXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBLaeG7g20gdHJhIG7hur91IMSR4buLYSBjaOG7iSDEkcaw4bujYyBj4bqtcCBuaOG6rXQgdHLhu58gdGjDoG5oIG3hurdjIMSR4buLbmhcbiAgICBpZiAodXBkYXRlZERhdGEuaXNEZWZhdWx0KSB7XG4gICAgICAvLyBD4bqtcCBuaOG6rXQgdOG6pXQgY+G6oyBjw6FjIMSR4buLYSBjaOG7iSBraMOhYyB0aMOgbmgga2jDtG5nIG3hurdjIMSR4buLbmhcbiAgICAgIHVzZXIuYWRkcmVzc2VzLmZvckVhY2goYWRkciA9PiB7XG4gICAgICAgIGFkZHIuaXNEZWZhdWx0ID0gZmFsc2U7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBD4bqtcCBuaOG6rXQgxJHhu4thIGNo4buJXG4gICAgT2JqZWN0LmtleXModXBkYXRlZERhdGEpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIHVzZXIuYWRkcmVzc2VzW2FkZHJlc3NJbmRleF1ba2V5XSA9IHVwZGF0ZWREYXRhW2tleV07XG4gICAgfSk7XG5cbiAgICAvLyBO4bq/dSDEkcOieSBsw6AgxJHhu4thIGNo4buJIG3hurdjIMSR4buLbmgsIGPhuq1wIG5o4bqtdCB0csaw4budbmcgYWRkcmVzcyBjxalcbiAgICBpZiAodXBkYXRlZERhdGEuaXNEZWZhdWx0KSB7XG4gICAgICBhd2FpdCB1cGRhdGVEZWZhdWx0QWRkcmVzc0ZvckJhY2t3YXJkQ29tcGF0aWJpbGl0eSh1c2VySWQpO1xuICAgIH1cblxuICAgIC8vIEzGsHUgdGhheSDEkeG7lWlcbiAgICBhd2FpdCB1c2VyLnNhdmUoKTtcblxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiBcIkPhuq1wIG5o4bqtdCDEkeG7i2EgY2jhu4kgdGjDoG5oIGPDtG5nXCIsXG4gICAgICBhZGRyZXNzZXM6IHVzZXIuYWRkcmVzc2VzXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgxJHhu4thIGNo4buJOlwiLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIGPhuq1wIG5o4bqtdCDEkeG7i2EgY2jhu4lcIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIFjDs2EgxJHhu4thIGNo4buJXG5leHBvcnQgY29uc3QgZGVsZXRlVXNlckFkZHJlc3MgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHVzZXJJZCwgYWRkcmVzc0lkIH0gPSByZXEucGFyYW1zO1xuICAgIFxuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBVc2VyLmZpbmRCeUlkKHVzZXJJZCk7XG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgbmfGsOG7nWkgZMO5bmdcIlxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVMOsbSDEkeG7i2EgY2jhu4kgY+G6p24geMOzYVxuICAgIGNvbnN0IGFkZHJlc3NJbmRleCA9IHVzZXIuYWRkcmVzc2VzLmZpbmRJbmRleChcbiAgICAgIGFkZHIgPT4gYWRkci5faWQudG9TdHJpbmcoKSA9PT0gYWRkcmVzc0lkXG4gICAgKTtcblxuICAgIGlmIChhZGRyZXNzSW5kZXggPT09IC0xKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHhu4thIGNo4buJXCJcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEtp4buDbSB0cmEgbuG6v3UgxJHhu4thIGNo4buJIGLhu4sgeMOzYSBsw6AgbeG6t2MgxJHhu4tuaFxuICAgIGNvbnN0IGlzRGVmYXVsdCA9IHVzZXIuYWRkcmVzc2VzW2FkZHJlc3NJbmRleF0uaXNEZWZhdWx0O1xuXG4gICAgLy8gWMOzYSDEkeG7i2EgY2jhu4kga2jhu49pIG3huqNuZ1xuICAgIHVzZXIuYWRkcmVzc2VzLnNwbGljZShhZGRyZXNzSW5kZXgsIDEpO1xuXG4gICAgLy8gTuG6v3UgxJHhu4thIGNo4buJIGLhu4sgeMOzYSBsw6AgbeG6t2MgxJHhu4tuaCB2w6AgduG6q24gY8OybiDEkeG7i2EgY2jhu4kga2jDoWMsIMSR4bq3dCDEkeG7i2EgY2jhu4kgxJHhuqd1IHRpw6puIGPDsm4gbOG6oWkgbMOgbSBt4bq3YyDEkeG7i25oXG4gICAgaWYgKGlzRGVmYXVsdCAmJiB1c2VyLmFkZHJlc3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICB1c2VyLmFkZHJlc3Nlc1swXS5pc0RlZmF1bHQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIE7hur91IMSRw6MgdGhheSDEkeG7lWkgxJHhu4thIGNo4buJIG3hurdjIMSR4buLbmgsIGPhuq1wIG5o4bqtdCB0csaw4budbmcgYWRkcmVzcyBjxalcbiAgICBpZiAoaXNEZWZhdWx0ICYmIHVzZXIuYWRkcmVzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIGF3YWl0IHVwZGF0ZURlZmF1bHRBZGRyZXNzRm9yQmFja3dhcmRDb21wYXRpYmlsaXR5KHVzZXJJZCk7XG4gICAgfVxuXG4gICAgLy8gTMawdSB0aGF5IMSR4buVaVxuICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwiWMOzYSDEkeG7i2EgY2jhu4kgdGjDoG5oIGPDtG5nXCIsXG4gICAgICBhZGRyZXNzZXM6IHVzZXIuYWRkcmVzc2VzXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB4w7NhIMSR4buLYSBjaOG7iTpcIiwgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSB4w7NhIMSR4buLYSBjaOG7iVwiLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gxJDhurd0IMSR4buLYSBjaOG7iSBt4bq3YyDEkeG7i25oXG5leHBvcnQgY29uc3Qgc2V0RGVmYXVsdEFkZHJlc3MgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHVzZXJJZCwgYWRkcmVzc0lkIH0gPSByZXEucGFyYW1zO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKGBbc2V0RGVmYXVsdEFkZHJlc3NdIFNldHRpbmcgYWRkcmVzcyAke2FkZHJlc3NJZH0gYXMgZGVmYXVsdCBmb3IgdXNlciAke3VzZXJJZH1gKTtcbiAgICBcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kQnlJZCh1c2VySWQpO1xuICAgIGlmICghdXNlcikge1xuICAgICAgY29uc29sZS5sb2coYFtzZXREZWZhdWx0QWRkcmVzc10gVXNlciBub3QgZm91bmQ6ICR7dXNlcklkfWApO1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IG5nxrDhu51pIGTDuW5nXCJcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEtp4buDbSB0cmEgeGVtIMSR4buLYSBjaOG7iSBjw7MgdOG7k24gdOG6oWkga2jDtG5nXG4gICAgY29uc3QgYWRkcmVzc0V4aXN0cyA9IHVzZXIuYWRkcmVzc2VzLnNvbWUoYWRkciA9PiBhZGRyLl9pZC50b1N0cmluZygpID09PSBhZGRyZXNzSWQpO1xuICAgIGlmICghYWRkcmVzc0V4aXN0cykge1xuICAgICAgY29uc29sZS5sb2coYFtzZXREZWZhdWx0QWRkcmVzc10gQWRkcmVzcyBub3QgZm91bmQ6ICR7YWRkcmVzc0lkfWApO1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSR4buLYSBjaOG7iVwiXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDEkOG6t3QgdOG6pXQgY+G6oyDEkeG7i2EgY2jhu4kgdGjDoG5oIGtow7RuZyBt4bq3YyDEkeG7i25oLCBzYXUgxJHDsyDEkeG6t3QgxJHhu4thIGNo4buJIMSRxrDhu6NjIGNo4buNbiB0aMOgbmggbeG6t2MgxJHhu4tuaFxuICAgIHVzZXIuYWRkcmVzc2VzLmZvckVhY2goYWRkciA9PiB7XG4gICAgICBjb25zdCBpc1NlbGVjdGVkID0gYWRkci5faWQudG9TdHJpbmcoKSA9PT0gYWRkcmVzc0lkO1xuICAgICAgYWRkci5pc0RlZmF1bHQgPSBpc1NlbGVjdGVkO1xuICAgICAgXG4gICAgICBpZiAoaXNTZWxlY3RlZCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW3NldERlZmF1bHRBZGRyZXNzXSBTZXR0aW5nIGFkZHJlc3MgYXMgZGVmYXVsdDogJHthZGRyLmZ1bGxBZGRyZXNzfWApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gxJDDoW5oIGThuqV1IG3huqNuZyBhZGRyZXNzZXMgxJHDoyDEkcaw4bujYyBz4butYSDEkeG7lWkgxJHhu4MgxJHhuqNtIGLhuqNvIG1vbmdvb3NlIGPhuq1wIG5o4bqtdFxuICAgIHVzZXIubWFya01vZGlmaWVkKCdhZGRyZXNzZXMnKTtcbiAgICBcbiAgICAvLyBMxrB1IHRoYXkgxJHhu5VpIHRyxrDhu5tjIGtoaSBj4bqtcCBuaOG6rXQgdMawxqFuZyB0aMOtY2ggbmfGsOG7o2NcbiAgICBhd2FpdCB1c2VyLnNhdmUoKTtcbiAgICBcbiAgICAvLyBD4bqtcCBuaOG6rXQgdHLGsOG7nW5nIGFkZHJlc3MgY8WpXG4gICAgYXdhaXQgdXBkYXRlRGVmYXVsdEFkZHJlc3NGb3JCYWNrd2FyZENvbXBhdGliaWxpdHkodXNlcklkKTtcblxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiBcIsSQ4bq3dCDEkeG7i2EgY2jhu4kgbeG6t2MgxJHhu4tuaCB0aMOgbmggY8O0bmdcIixcbiAgICAgIGFkZHJlc3NlczogdXNlci5hZGRyZXNzZXNcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbc2V0RGVmYXVsdEFkZHJlc3NdIEVycm9yIHNldHRpbmcgZGVmYXVsdCBhZGRyZXNzOmAsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgxJHhurd0IMSR4buLYSBjaOG7iSBt4bq3YyDEkeG7i25oXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBBZG1pbiBlbmRwb2ludCB0byBtaWdyYXRlIGFsbCBsZWdhY3kgYWRkcmVzc2VzXG5leHBvcnQgY29uc3QgbWlncmF0ZUFsbExlZ2FjeUFkZHJlc3NlcyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIC8vIEtp4buDbSB0cmEgcXV54buBbiBhZG1pbiAodGjhu7FjIHThur8gbsOqbiBz4butIGThu6VuZyBtaWRkbGV3YXJlKVxuICAgIGlmICghcmVxLnVzZXIgfHwgIXJlcS51c2VyLnJvbGUgfHwgcmVxLnVzZXIucm9sZSAhPT0gJ2FkbWluJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIGPDsyBxdXnhu4FuIHRo4buxYyBoaeG7h24gY2jhu6ljIG7Eg25nIG7DoHlcIlxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gTOG6pXkgdOG6pXQgY+G6oyB1c2VyIGPDsyDEkeG7i2EgY2jhu4kgY8WpXG4gICAgY29uc3QgdXNlcnMgPSBhd2FpdCBVc2VyLmZpbmQoeyBcbiAgICAgIGFkZHJlc3M6IHsgJGV4aXN0czogdHJ1ZSwgJG5lOiBcIlwiIH0sXG4gICAgICAkb3I6IFtcbiAgICAgICAgeyBhZGRyZXNzZXM6IHsgJGV4aXN0czogZmFsc2UgfSB9LFxuICAgICAgICB7IGFkZHJlc3NlczogeyAkc2l6ZTogMCB9IH1cbiAgICAgIF1cbiAgICB9KTtcblxuICAgIGxldCBtaWdyYXRlZENvdW50ID0gMDtcbiAgICBsZXQgc2tpcHBlZENvdW50ID0gMDtcbiAgICBsZXQgZXJyb3JDb3VudCA9IDA7XG4gICAgXG4gICAgLy8gWOG7rSBsw70gdOG7q25nIHVzZXJcbiAgICBmb3IgKGNvbnN0IHVzZXIgb2YgdXNlcnMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIEtp4buDbSB0cmEgbuG6v3UgbeG6o25nIGFkZHJlc3NlcyB0cuG7kW5nXG4gICAgICAgIGlmICghdXNlci5hZGRyZXNzZXMgfHwgdXNlci5hZGRyZXNzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgYXdhaXQgbWlncmF0ZUxlZ2FjeUFkZHJlc3ModXNlcik7XG4gICAgICAgICAgbWlncmF0ZWRDb3VudCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNraXBwZWRDb3VudCsrO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgbWlncmF0aW5nIGFkZHJlc3MgZm9yIHVzZXIgJHt1c2VyLl9pZH06YCwgZXJyKTtcbiAgICAgICAgZXJyb3JDb3VudCsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiBgxJDDoyBkaSBjaHV54buDbiAke21pZ3JhdGVkQ291bnR9IMSR4buLYSBjaOG7iSwgYuG7jyBxdWEgJHtza2lwcGVkQ291bnR9LCBs4buXaSAke2Vycm9yQ291bnR9YCxcbiAgICAgIHRvdGFsOiB1c2Vycy5sZW5ndGgsXG4gICAgICBtaWdyYXRlZDogbWlncmF0ZWRDb3VudCxcbiAgICAgIHNraXBwZWQ6IHNraXBwZWRDb3VudCxcbiAgICAgIGVycm9yczogZXJyb3JDb3VudFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgZGkgY2h1eeG7g24gZOG7ryBsaeG7h3UgxJHhu4thIGNo4buJOlwiLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIGRpIGNodXnhu4NuIGThu68gbGnhu4d1IMSR4buLYSBjaOG7iVwiLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICB9KTtcbiAgfVxufTtcbiJdLCJtYXBwaW5ncyI6Ijs7QUFFQSxJQUFBQSxhQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxTQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxhQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxTQUFBLEdBQUFKLE9BQUE7QUFDQSxJQUFBSyxhQUFBLEdBQUFMLE9BQUE7QUFDQSxJQUFBTSxXQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxPQUFBLEdBQUFSLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUSxrQkFBQSxHQUFBUixPQUFBO0FBQ0EsSUFBQVMsTUFBQSxHQUFBVixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVUsUUFBQSxHQUFBWCxzQkFBQSxDQUFBQyxP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