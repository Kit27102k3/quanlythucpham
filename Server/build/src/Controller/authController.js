"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.validateSubscription = exports.updateUserAddress = exports.updateUser = exports.subscribeToPush = exports.setDefaultAddress = exports.resetPassword = exports.requestPasswordReset = exports.register = exports.refreshToken = exports.migrateAllLegacyAddresses = exports.logout = exports.login = exports.googleLogin = exports.getVapidPublicKey = exports.getUserProfile = exports.getUserAvatar = exports.getUserAddresses = exports.getAllUser = exports.facebookTokenLogin = exports.facebookLogin = exports.facebookCallback = exports.deleteUserAddress = exports.blockUser = exports.addUserAddress = void 0;

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
var _webPush = _interopRequireDefault(require("web-push")); /* eslint-disable no-undef */ /* eslint-disable no-unused-vars */

// Load environment variables
_dotenv.default.config();

// Fallback secret keys in case environment variables aren't set
const JWT_SECRET_ACCESS =
process.env.JWT_SECRET_ACCESS || "a5e2c2e7-bf3a-4aa1-b5e2-eab36d9db2ea";
const JWT_REFRESH_SECRET =
process.env.JWT_REFRESH_SECRET ||
"7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5d6f7e8c9d0a1b2";

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
      await _RefreshToken.default.deleteMany({
        userId: foundUser._id,
        userModel: "User"
      });

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
        houseNumber: user.houseNumber || "",
        ward: user.ward || "",
        district: user.district || "",
        province: user.province || "",
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
    const {
      currentPassword,
      newPassword,
      firstName,
      lastName,
      phone,
      address,
      userImage
    } = req.body;

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
      message: isBlocked ?
      "Đã chặn người dùng thành công" :
      "Đã bỏ chặn người dùng thành công",
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
    const fbResponse = await _axios.default.get(
      `https://graph.facebook.com/v18.0/${userID}`,
      {
        params: {
          fields: "id,email,first_name,last_name,picture",
          access_token: accessToken
        }
      }
    );

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
      const hashedPassword = await _bcryptjs.default.hash(randomPassword, 10);

      // Use default avatar instead of Facebook profile pic
      const profileImageUrl = ""; // Don't store Facebook profile URL

      user = new _Register.default({
        email: email || `${id}@facebook.com`,
        phone: "0000000000", // Placeholder phone number
        firstName: first_name || "Facebook",
        lastName: last_name || "User",
        userName: uniqueUsername,
        password: hashedPassword,
        userImage: profileImageUrl,
        facebookId: id,
        authProvider: "facebook"
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
          user.authProvider = "google";
          await user.save();
        }
      }

      // Nếu vẫn không tìm thấy user, tạo mới
      if (!user) {
        // Tạo username ngẫu nhiên nếu không có
        const uniqueUsername = `google_${sub.slice(-8)}_${Date.now().
        toString().
        slice(-4)}`;

        // Tạo mật khẩu ngẫu nhiên
        const randomPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await _bcryptjs.default.hash(randomPassword, 10);

        user = new _Register.default({
          email: email,
          phone: "0000000000", // Placeholder phone number
          firstName: given_name || "Google",
          lastName: family_name || "User",
          userName: uniqueUsername,
          password: hashedPassword,
          userImage: picture || "",
          googleId: sub,
          authProvider: "google"
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
      return res.redirect("/dang-nhap?error=no_code");
    }

    // Exchange code for access token
    const tokenResponse = await _axios.default.get(
      "https://graph.facebook.com/oauth/access_token",
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
          code
        }
      }
    );

    if (!tokenResponse.data.access_token) {
      return res.redirect("/dang-nhap?error=token_exchange_failed");
    }

    const accessToken = tokenResponse.data.access_token;

    // Get user data with access token
    const userDataResponse = await _axios.default.get("https://graph.facebook.com/me", {
      params: {
        fields: "id,first_name,last_name,email,picture",
        access_token: accessToken
      }
    });

    if (!userDataResponse.data.id) {
      return res.redirect("/dang-nhap?error=user_data_failed");
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
      const profileImageUrl = "";

      user = new _Register.default({
        email: `${uniqueUsername}@facebook.com`,
        phone: "0000000000", // Placeholder phone number
        firstName: first_name || "Facebook",
        lastName: last_name || "User",
        userName: uniqueUsername,
        password: hashedPassword,
        userImage: profileImageUrl,
        facebookId: id,
        authProvider: "facebook"
      });

      await user.save();
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return res.redirect("/dang-nhap?error=account_blocked");
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
    res.redirect(
      `/dang-nhap/success?token=${token}&refreshToken=${refreshToken}&userId=${
      user._id}&name=${
      encodeURIComponent(
        `${user.firstName} ${user.lastName}`
      )}&role=user`
    );
  } catch (error) {
    console.error("Facebook callback error:", error);
    res.redirect("/dang-nhap?error=server_error");
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
        fields:
        "id,first_name,last_name,email,picture{url,width,height,is_silhouette}",
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
    let profileImageUrl = "";
    if (picture && picture.data && !picture.data.is_silhouette) {
      try {
        // Thử lấy ảnh lớn hơn từ Facebook Graph API
        const pictureResponse = await _axios.default.get(
          `https://graph.facebook.com/v18.0/${id}/picture`,
          {
            params: {
              type: "large",
              redirect: "false",
              access_token: accessToken
            }
          }
        );

        if (
        pictureResponse.data &&
        pictureResponse.data.data &&
        pictureResponse.data.data.url)
        {
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
        phone: "0000000000", // Placeholder phone number
        firstName: first_name || "Facebook",
        lastName: last_name || "User",
        userName: uniqueUsername,
        password: hashedPassword,
        userImage: profileImageUrl,
        facebookId: id,
        authProvider: "facebook"
      });

      await user.save();
    } else {
      // Cập nhật avatar nếu người dùng đã tồn tại
      if (
      profileImageUrl &&
      profileImageUrl !== "https://www.gravatar.com/avatar/?d=mp&s=256")
      {
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

    const user = await _Register.default.findById(userId).select(
      "userImage firstName lastName email authProvider facebookId"
    );

    if (!user) {
      console.log("User not found for ID:", userId);
      return res.json({
        userImage: "https://www.gravatar.com/avatar/?d=mp&s=256"
      });
    }

    console.log("User found:", user.email, "- Image:", user.userImage);

    // Nếu người dùng đang sử dụng Facebook và không có ảnh đại diện
    if (
    user.authProvider === "facebook" && (
    !user.userImage ||
    user.userImage.includes("platform-lookaside.fbsbx.com")))
    {
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
        userImage: "https://www.gravatar.com/avatar/?d=mp&s=256"
      });
    }

    // If user has a userImage that is a URL, return the URL directly
    if (
    user.userImage && (
    user.userImage.startsWith("http://") ||
    user.userImage.startsWith("https://")))
    {
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
      userImage: "https://www.gravatar.com/avatar/?d=mp&s=256"
    });
  } catch (error) {
    console.error("Error fetching user avatar:", error);
    return res.json({
      userImage: "https://www.gravatar.com/avatar/?d=mp&s=256"
    });
  }
};

// New controller function to provide VAPID public key
exports.getUserAvatar = getUserAvatar;const getVapidPublicKey = (req, res) => {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      return res.
      status(500).
      json({ message: "VAPID Public Key not configured on server." });
    }

    // Log to confirm the key is valid (should be Base64 URL-safe encoded)
    const isValidBase64 = /^[A-Za-z0-9\-_]+=*$/.test(vapidPublicKey);

    res.status(200).json({ vapidPublicKey: vapidPublicKey });
  } catch (error) {
    res.
    status(500).
    json({ message: "Internal server error", error: error.message });
  }
};

// Controller function to subscribe a user to push notifications
exports.getVapidPublicKey = getVapidPublicKey;const subscribeToPush = async (req, res) => {
  const subscription = req.body;
  const userId = req.user.id;

  if (!subscription || !subscription.endpoint) {
    return res.
    status(400).
    json({ message: "Push subscription object is required." });
  }

  try {
    // Set timeout for MongoDB operations
    const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Database operation timed out")), 5000)
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
        subscriptionCount: user.pushSubscriptions.length
      });
    }

    // Validate subscription
    if (
    !subscription.keys ||
    !subscription.keys.p256dh ||
    !subscription.keys.auth)
    {
      console.error(
        `[subscribeToPush] Invalid subscription object, missing required keys`
      );
      return res.
      status(400).
      json({
        message: "Invalid subscription object. Missing required keys."
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
          await _webPush.default.sendNotification(
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
    console.log(
      `[updateDefaultAddressForBackwardCompatibility] Updating legacy address for user ${userId}`
    );

    const user = await _Register.default.findById(userId);
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
      defaultAddress.coordinates.lng)
      {
        user.coordinates = {
          lat: defaultAddress.coordinates.lat,
          lng: defaultAddress.coordinates.lng
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

    console.log(
      `[setDefaultAddress] Setting address ${addressId} as default for user ${userId}`
    );

    const user = await _Register.default.findById(userId);
    if (!user) {
      console.log(`[setDefaultAddress] User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
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
        message: "Không tìm thấy địa chỉ"
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
    if (!req.user || !req.user.role || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thực hiện chức năng này"
      });
    }

    // Lấy tất cả user có địa chỉ cũ
    const users = await _Register.default.find({
      address: { $exists: true, $ne: "" },
      $or: [{ addresses: { $exists: false } }, { addresses: { $size: 0 } }]
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfanNvbndlYnRva2VuIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfYmNyeXB0anMiLCJfUmVnaXN0ZXIiLCJfUmVmcmVzaFRva2VuIiwiX290cFVudGlsIiwiX2VtYWlsU2VydmljZSIsIl9hZG1pbk1vZGVsIiwiX2RvdGVudiIsIl9nb29nbGVBdXRoTGlicmFyeSIsIl9heGlvcyIsIl93ZWJQdXNoIiwiZG90ZW52IiwiY29uZmlnIiwiSldUX1NFQ1JFVF9BQ0NFU1MiLCJwcm9jZXNzIiwiZW52IiwiSldUX1JFRlJFU0hfU0VDUkVUIiwiZ29vZ2xlQ2xpZW50IiwiT0F1dGgyQ2xpZW50IiwiR09PR0xFX0NMSUVOVF9JRCIsInJlZ2lzdGVyIiwicmVxIiwicmVzIiwiZW1haWwiLCJwaG9uZSIsImZpcnN0TmFtZSIsImxhc3ROYW1lIiwidXNlck5hbWUiLCJwYXNzd29yZCIsImFkZHJlc3MiLCJ1c2VySW1hZ2UiLCJib2R5IiwiZXhpc3RpbmdFbWFpbCIsIlVzZXIiLCJmaW5kT25lIiwic3RhdHVzIiwianNvbiIsIm1lc3NhZ2UiLCJleGlzdGluZ1VzZXJuYW1lIiwiaGFzaGVkUGFzc3dvcmQiLCJiY3J5cHQiLCJoYXNoIiwibmV3VXNlciIsInNhdmUiLCJyZWZyZXNoVG9rZW4iLCJqd3QiLCJzaWduIiwiaWQiLCJfaWQiLCJleHBpcmVzSW4iLCJSZWZyZXNoVG9rZW4iLCJjcmVhdGUiLCJ1c2VySWQiLCJ1c2VyTW9kZWwiLCJ0b2tlbiIsImV4cGlyZXNBdCIsIkRhdGUiLCJub3ciLCJhY2Nlc3NUb2tlbiIsInJvbGUiLCJwZXJtaXNzaW9ucyIsInN1Y2Nlc3MiLCJmdWxsTmFtZSIsImVycm9yIiwiY29uc29sZSIsImV4cG9ydHMiLCJsb2dpbiIsInVzZXJuYW1lIiwidXNlcl9uYW1lIiwidXNlcm5hbWVUb1VzZSIsImZvdW5kVXNlciIsIiRvciIsImlzQmxvY2tlZCIsImlzUGFzc3dvcmRWYWxpZCIsImNvbXBhcmUiLCJkZWxldGVNYW55IiwidG9rZW5FcnJvciIsImxhc3RMb2dpbiIsInVzZXIiLCJkZWNvZGVkIiwidmVyaWZ5Iiwic3RvcmVkVG9rZW4iLCJmaW5kQnlJZCIsIkFkbWluIiwibmV3QWNjZXNzVG9rZW4iLCJuYW1lIiwiZmluZE9uZUFuZERlbGV0ZSIsImxvZ291dCIsIm1pZ3JhdGVMZWdhY3lBZGRyZXNzIiwiYWRkcmVzc2VzIiwibGVuZ3RoIiwibG9nIiwibmV3QWRkcmVzcyIsImZ1bGxBZGRyZXNzIiwiaG91c2VOdW1iZXIiLCJ3YXJkIiwiZGlzdHJpY3QiLCJwcm92aW5jZSIsImNvb3JkaW5hdGVzIiwiaXNEZWZhdWx0IiwibGFiZWwiLCJyZWNlaXZlck5hbWUiLCJyZWNlaXZlclBob25lIiwiZ2V0VXNlclByb2ZpbGUiLCJwYXJhbXMiLCJzZWxlY3QiLCJnZXRBbGxVc2VyIiwiZmluZCIsInVwZGF0ZVVzZXIiLCJjdXJyZW50UGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsImlzTWF0Y2giLCJ0ZXN0Iiwic2FsdCIsImdlblNhbHQiLCJ1bmRlZmluZWQiLCJlcnIiLCJyZXF1ZXN0UGFzc3dvcmRSZXNldCIsIm90cCIsImdlbmVyYXRlT1RQIiwib3RwRXhwaXJlcyIsInJlc2V0UGFzc3dvcmRUb2tlbiIsInJlc2V0UGFzc3dvcmRFeHBpcmVzIiwic2VuZE9UUEVtYWlsIiwicmVzZXRQYXNzd29yZCIsIiRndCIsImJsb2NrVXNlciIsImZhY2Vib29rTG9naW4iLCJ1c2VySUQiLCJmYlJlc3BvbnNlIiwiYXhpb3MiLCJnZXQiLCJmaWVsZHMiLCJhY2Nlc3NfdG9rZW4iLCJkYXRhIiwiZmlyc3RfbmFtZSIsImxhc3RfbmFtZSIsInBpY3R1cmUiLCJmYWNlYm9va0lkIiwiYXV0aFByb3ZpZGVyIiwidW5pcXVlVXNlcm5hbWUiLCJ0b1N0cmluZyIsInNsaWNlIiwicmFuZG9tUGFzc3dvcmQiLCJNYXRoIiwicmFuZG9tIiwicHJvZmlsZUltYWdlVXJsIiwiZ29vZ2xlTG9naW4iLCJjcmVkZW50aWFsIiwidGlja2V0IiwidmVyaWZ5SWRUb2tlbiIsImlkVG9rZW4iLCJhdWRpZW5jZSIsInBheWxvYWQiLCJnZXRQYXlsb2FkIiwic3ViIiwiZ2l2ZW5fbmFtZSIsImZhbWlseV9uYW1lIiwiZ29vZ2xlSWQiLCJmYWNlYm9va0NhbGxiYWNrIiwiY29kZSIsInF1ZXJ5IiwicmVkaXJlY3QiLCJ0b2tlblJlc3BvbnNlIiwiY2xpZW50X2lkIiwiRkFDRUJPT0tfQVBQX0lEIiwiY2xpZW50X3NlY3JldCIsIkZBQ0VCT09LX0FQUF9TRUNSRVQiLCJyZWRpcmVjdF91cmkiLCJGQUNFQk9PS19DQUxMQkFDS19VUkwiLCJ1c2VyRGF0YVJlc3BvbnNlIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiZmFjZWJvb2tUb2tlbkxvZ2luIiwiaGFzUGljdHVyZSIsImlzX3NpbGhvdWV0dGUiLCJwaWN0dXJlUmVzcG9uc2UiLCJ0eXBlIiwidXJsIiwicGljdHVyZUVycm9yIiwidXNlckVtYWlsIiwiZ2V0VXNlckF2YXRhciIsImluY2x1ZGVzIiwiZmJBdmF0YXJVcmwiLCJmYkVycm9yIiwic3RhcnRzV2l0aCIsInNlbmRGaWxlIiwicm9vdCIsImN3ZCIsImdldFZhcGlkUHVibGljS2V5IiwidmFwaWRQdWJsaWNLZXkiLCJWQVBJRF9QVUJMSUNfS0VZIiwiaXNWYWxpZEJhc2U2NCIsInN1YnNjcmliZVRvUHVzaCIsInN1YnNjcmlwdGlvbiIsImVuZHBvaW50IiwidGltZW91dFByb21pc2UiLCJQcm9taXNlIiwiXyIsInJlamVjdCIsInNldFRpbWVvdXQiLCJFcnJvciIsInVzZXJQcm9taXNlIiwicmFjZSIsInB1c2hTdWJzY3JpcHRpb25zIiwiZXhpc3RpbmdTdWJzY3JpcHRpb24iLCJzdWJzY3JpcHRpb25Db3VudCIsImtleXMiLCJwMjU2ZGgiLCJhdXRoIiwicHVzaCIsInNhdmVQcm9taXNlIiwidGVzdFBheWxvYWQiLCJub3RpZmljYXRpb24iLCJ0aXRsZSIsImljb24iLCJ2aWJyYXRlIiwiZGF0ZU9mQXJyaXZhbCIsInByaW1hcnlLZXkiLCJyZXRyaWVzIiwid2VicHVzaCIsInNlbmROb3RpZmljYXRpb24iLCJKU09OIiwic3RyaW5naWZ5IiwicmVzb2x2ZSIsIm5vdGlmaWNhdGlvbkVycm9yIiwidmFsaWRhdGVTdWJzY3JpcHRpb24iLCJzZXRWYXBpZERldGFpbHMiLCJWQVBJRF9QUklWQVRFX0tFWSIsInNpbGVudCIsInZhbGlkIiwic3RhdHVzQ29kZSIsInVwZGF0ZURlZmF1bHRBZGRyZXNzRm9yQmFja3dhcmRDb21wYXRpYmlsaXR5IiwiZGVmYXVsdEFkZHJlc3MiLCJhZGRyIiwibGF0IiwibG5nIiwibWFya01vZGlmaWVkIiwiYWRkVXNlckFkZHJlc3MiLCJhZGRyZXNzRGF0YSIsImZvckVhY2giLCJnZXRVc2VyQWRkcmVzc2VzIiwidXBkYXRlVXNlckFkZHJlc3MiLCJhZGRyZXNzSWQiLCJ1cGRhdGVkRGF0YSIsImFkZHJlc3NJbmRleCIsImZpbmRJbmRleCIsIk9iamVjdCIsImtleSIsImRlbGV0ZVVzZXJBZGRyZXNzIiwic3BsaWNlIiwic2V0RGVmYXVsdEFkZHJlc3MiLCJhZGRyZXNzRXhpc3RzIiwic29tZSIsImlzU2VsZWN0ZWQiLCJtaWdyYXRlQWxsTGVnYWN5QWRkcmVzc2VzIiwidXNlcnMiLCIkZXhpc3RzIiwiJG5lIiwiJHNpemUiLCJtaWdyYXRlZENvdW50Iiwic2tpcHBlZENvdW50IiwiZXJyb3JDb3VudCIsInRvdGFsIiwibWlncmF0ZWQiLCJza2lwcGVkIiwiZXJyb3JzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL0NvbnRyb2xsZXIvYXV0aENvbnRyb2xsZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cclxuLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cclxuaW1wb3J0IGp3dCBmcm9tIFwianNvbndlYnRva2VuXCI7XHJcbmltcG9ydCBiY3J5cHQgZnJvbSBcImJjcnlwdGpzXCI7XHJcbmltcG9ydCBVc2VyIGZyb20gXCIuLi9Nb2RlbC9SZWdpc3Rlci5qc1wiO1xyXG5pbXBvcnQgUmVmcmVzaFRva2VuIGZyb20gXCIuLi9Nb2RlbC9SZWZyZXNoVG9rZW4uanNcIjtcclxuaW1wb3J0IHsgZ2VuZXJhdGVPVFAgfSBmcm9tIFwiLi4vdXRpbHMvb3RwLnVudGlsLmpzXCI7XHJcbmltcG9ydCB7IHNlbmRPVFBFbWFpbCB9IGZyb20gXCIuLi9TZXJ2aWNlcy9lbWFpbC5zZXJ2aWNlLmpzXCI7XHJcbmltcG9ydCBBZG1pbiBmcm9tIFwiLi4vTW9kZWwvYWRtaW5Nb2RlbC5qc1wiO1xyXG5pbXBvcnQgZG90ZW52IGZyb20gXCJkb3RlbnZcIjtcclxuaW1wb3J0IHsgT0F1dGgyQ2xpZW50IH0gZnJvbSBcImdvb2dsZS1hdXRoLWxpYnJhcnlcIjtcclxuaW1wb3J0IGF4aW9zIGZyb20gXCJheGlvc1wiO1xyXG5pbXBvcnQgd2VicHVzaCBmcm9tIFwid2ViLXB1c2hcIjtcclxuXHJcbi8vIExvYWQgZW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbmRvdGVudi5jb25maWcoKTtcclxuXHJcbi8vIEZhbGxiYWNrIHNlY3JldCBrZXlzIGluIGNhc2UgZW52aXJvbm1lbnQgdmFyaWFibGVzIGFyZW4ndCBzZXRcclxuY29uc3QgSldUX1NFQ1JFVF9BQ0NFU1MgPVxyXG4gIHByb2Nlc3MuZW52LkpXVF9TRUNSRVRfQUNDRVNTIHx8IFwiYTVlMmMyZTctYmYzYS00YWExLWI1ZTItZWFiMzZkOWRiMmVhXCI7XHJcbmNvbnN0IEpXVF9SRUZSRVNIX1NFQ1JFVCA9XHJcbiAgcHJvY2Vzcy5lbnYuSldUX1JFRlJFU0hfU0VDUkVUIHx8XHJcbiAgXCI3ZjhlOWQwYzFiMmEzZjRlNWQ2YzdiOGE5ZjBlMWQyYzNiNGE1ZDZmN2U4YzlkMGExYjJcIjtcclxuXHJcbi8vIEdvb2dsZSBPQXV0aCBjbGllbnRcclxuY29uc3QgZ29vZ2xlQ2xpZW50ID0gbmV3IE9BdXRoMkNsaWVudChwcm9jZXNzLmVudi5HT09HTEVfQ0xJRU5UX0lEKTtcclxuXHJcbmV4cG9ydCBjb25zdCByZWdpc3RlciA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7XHJcbiAgICAgIGVtYWlsLFxyXG4gICAgICBwaG9uZSxcclxuICAgICAgZmlyc3ROYW1lLFxyXG4gICAgICBsYXN0TmFtZSxcclxuICAgICAgdXNlck5hbWUsXHJcbiAgICAgIHBhc3N3b3JkLFxyXG4gICAgICBhZGRyZXNzLFxyXG4gICAgICB1c2VySW1hZ2UsXHJcbiAgICB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgLy8gS2nhu4NtIHRyYSBlbWFpbCDEkcOjIHThu5NuIHThuqFpXHJcbiAgICBjb25zdCBleGlzdGluZ0VtYWlsID0gYXdhaXQgVXNlci5maW5kT25lKHsgZW1haWwgfSk7XHJcbiAgICBpZiAoZXhpc3RpbmdFbWFpbCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBtZXNzYWdlOiBcIkVtYWlsIMSRw6MgxJHGsOG7o2Mgc+G7rSBk4bulbmdcIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBLaeG7g20gdHJhIHVzZXJuYW1lIMSRw6MgdOG7k24gdOG6oWlcclxuICAgIGNvbnN0IGV4aXN0aW5nVXNlcm5hbWUgPSBhd2FpdCBVc2VyLmZpbmRPbmUoeyB1c2VyTmFtZSB9KTtcclxuICAgIGlmIChleGlzdGluZ1VzZXJuYW1lKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IG1lc3NhZ2U6IFwiVMOqbiDEkcSDbmcgbmjhuq1wIMSRw6MgxJHGsOG7o2Mgc+G7rSBk4bulbmdcIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBCxINtIG3huq10IGto4bqpdVxyXG4gICAgY29uc3QgaGFzaGVkUGFzc3dvcmQgPSBhd2FpdCBiY3J5cHQuaGFzaChwYXNzd29yZCwgMTApO1xyXG5cclxuICAgIC8vIFThuqFvIHVzZXIgbeG7m2lcclxuICAgIGNvbnN0IG5ld1VzZXIgPSBuZXcgVXNlcih7XHJcbiAgICAgIGVtYWlsLFxyXG4gICAgICBwaG9uZSxcclxuICAgICAgZmlyc3ROYW1lLFxyXG4gICAgICBsYXN0TmFtZSxcclxuICAgICAgdXNlck5hbWUsXHJcbiAgICAgIHBhc3N3b3JkOiBoYXNoZWRQYXNzd29yZCxcclxuICAgICAgYWRkcmVzcyxcclxuICAgICAgdXNlckltYWdlLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTMawdSB1c2VyIHbDoG8gZGF0YWJhc2VcclxuICAgIGF3YWl0IG5ld1VzZXIuc2F2ZSgpO1xyXG5cclxuICAgIC8vIFThuqFvIHJlZnJlc2ggdG9rZW4gduG7m2kgc2VjcmV0IGtleSB04burIGJp4bq/biBtw7RpIHRyxrDhu51uZ1xyXG4gICAgY29uc3QgcmVmcmVzaFRva2VuID0gand0LnNpZ24oXHJcbiAgICAgIHsgaWQ6IG5ld1VzZXIuX2lkIH0sXHJcbiAgICAgIHByb2Nlc3MuZW52LkpXVF9SRUZSRVNIX1NFQ1JFVCB8fCBcIlNFQ1JFVF9SRUZSRVNIXCIsIC8vIEZhbGxiYWNrIG7hur91IGtow7RuZyBjw7MgYmnhur9uIG3DtGkgdHLGsOG7nW5nXHJcbiAgICAgIHsgZXhwaXJlc0luOiBcIjdkXCIgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBMxrB1IHJlZnJlc2ggdG9rZW4gdsOgbyBkYXRhYmFzZSB24bubaSB0aOG7nWkgZ2lhbiBo4bq/dCBo4bqhblxyXG4gICAgYXdhaXQgUmVmcmVzaFRva2VuLmNyZWF0ZSh7XHJcbiAgICAgIHVzZXJJZDogbmV3VXNlci5faWQsXHJcbiAgICAgIHVzZXJNb2RlbDogXCJVc2VyXCIsXHJcbiAgICAgIHRva2VuOiByZWZyZXNoVG9rZW4sXHJcbiAgICAgIGV4cGlyZXNBdDogbmV3IERhdGUoRGF0ZS5ub3coKSArIDcgKiAyNCAqIDYwICogNjAgKiAxMDAwKSwgLy8gNyBuZ8OgeVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gVOG6oW8gYWNjZXNzIHRva2VuIGNobyBuZ8aw4budaSBkw7luZyBt4bubaVxyXG4gICAgY29uc3QgYWNjZXNzVG9rZW4gPSBqd3Quc2lnbihcclxuICAgICAge1xyXG4gICAgICAgIGlkOiBuZXdVc2VyLl9pZCxcclxuICAgICAgICByb2xlOiBcInVzZXJcIixcclxuICAgICAgICBwZXJtaXNzaW9uczogW1wiWGVtXCJdLFxyXG4gICAgICB9LFxyXG4gICAgICBwcm9jZXNzLmVudi5KV1RfU0VDUkVUX0FDQ0VTUyB8fCBcIlNFQ1JFVF9BQ0NFU1NcIiwgLy8gRmFsbGJhY2sgbuG6v3Uga2jDtG5nIGPDsyBiaeG6v24gbcO0aSB0csaw4budbmdcclxuICAgICAgeyBleHBpcmVzSW46IFwiMWRcIiB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFRy4bqjIHbhu4EgdGjDtG5nIHRpbiDEkcSDbmcga8O9IHRow6BuaCBjw7RuZ1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIsSQxINuZyBrw70gbmfGsOG7nWkgZMO5bmcgdGjDoG5oIGPDtG5nXCIsXHJcbiAgICAgIHVzZXJJZDogbmV3VXNlci5faWQsXHJcbiAgICAgIGFjY2Vzc1Rva2VuLFxyXG4gICAgICByZWZyZXNoVG9rZW4sXHJcbiAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICBwZXJtaXNzaW9uczogW1wiWGVtXCJdLFxyXG4gICAgICBmdWxsTmFtZTogYCR7bmV3VXNlci5maXJzdE5hbWV9ICR7bmV3VXNlci5sYXN0TmFtZX1gLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJSZWdpc3RyYXRpb24gZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgxJHEg25nIGvDvSBuZ8aw4budaSBkw7luZ1wiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBsb2dpbiA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IHVzZXJuYW1lLCB1c2VyTmFtZSwgdXNlcl9uYW1lLCBwYXNzd29yZCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgLy8gTm9ybWFsaXplIHVzZXJuYW1lIHZhcmlhbnRzIChkYXRhYmFzZSBtaWdodCBoYXZlIGVpdGhlciB1c2VybmFtZSBvciB1c2VyTmFtZSlcclxuICAgIGNvbnN0IHVzZXJuYW1lVG9Vc2UgPSB1c2VybmFtZSB8fCB1c2VyTmFtZSB8fCB1c2VyX25hbWU7XHJcblxyXG4gICAgaWYgKCF1c2VybmFtZVRvVXNlIHx8ICFwYXNzd29yZCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiVnVpIGzDsm5nIGN1bmcgY+G6pXAgdMOqbiBuZ8aw4budaSBkw7luZyB2w6AgbeG6rXQga2jhuql1XCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvdW5kVXNlciA9IGF3YWl0IFVzZXIuZmluZE9uZSh7XHJcbiAgICAgICRvcjogW1xyXG4gICAgICAgIHsgdXNlck5hbWU6IHVzZXJuYW1lVG9Vc2UgfSxcclxuICAgICAgICB7IHVzZXJuYW1lOiB1c2VybmFtZVRvVXNlIH0sXHJcbiAgICAgICAgeyBlbWFpbDogdXNlcm5hbWVUb1VzZSB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKCFmb3VuZFVzZXIpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIk5nxrDhu51pIGTDuW5nIGtow7RuZyB04buTbiB04bqhaVwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZm91bmRVc2VyLmlzQmxvY2tlZCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiVMOgaSBraG/huqNuIMSRw6MgYuG7iyBraMOzYS4gVnVpIGzDsm5nIGxpw6puIGjhu4cgcXXhuqNuIHRy4buLIHZpw6puLlwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpc1Bhc3N3b3JkVmFsaWQgPSBhd2FpdCBiY3J5cHQuY29tcGFyZShwYXNzd29yZCwgZm91bmRVc2VyLnBhc3N3b3JkKTtcclxuXHJcbiAgICBpZiAoIWlzUGFzc3dvcmRWYWxpZCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiTeG6rXQga2jhuql1IGtow7RuZyDEkcO6bmdcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYWNjZXNzVG9rZW4gPSBqd3Quc2lnbihcclxuICAgICAge1xyXG4gICAgICAgIGlkOiBmb3VuZFVzZXIuX2lkLFxyXG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICAgIHBlcm1pc3Npb25zOiBbXCJYZW1cIl0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHByb2Nlc3MuZW52LkpXVF9TRUNSRVRfQUNDRVNTLFxyXG4gICAgICB7IGV4cGlyZXNJbjogXCIxZFwiIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR2VuZXJhdGUgcmVmcmVzaCB0b2tlbiB3aXRoIGV4dGVuZGVkIGV4cGlyeVxyXG4gICAgY29uc3QgcmVmcmVzaFRva2VuID0gand0LnNpZ24oXHJcbiAgICAgIHsgaWQ6IGZvdW5kVXNlci5faWQgfSxcclxuICAgICAgcHJvY2Vzcy5lbnYuSldUX1JFRlJFU0hfU0VDUkVULFxyXG4gICAgICB7IGV4cGlyZXNJbjogXCI3ZFwiIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gWMOzYSByZWZyZXNoIHRva2VucyBjxakgY+G7p2EgdXNlciBuw6B5IHRyxrDhu5tjIGtoaSB04bqhbyBt4bubaVxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgUmVmcmVzaFRva2VuLmRlbGV0ZU1hbnkoe1xyXG4gICAgICAgIHVzZXJJZDogZm91bmRVc2VyLl9pZCxcclxuICAgICAgICB1c2VyTW9kZWw6IFwiVXNlclwiLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIFNhdSBraGkgeMOzYSB0b2tlbnMgY8WpLCB04bqhbyB0b2tlbiBt4bubaVxyXG4gICAgICBhd2FpdCBSZWZyZXNoVG9rZW4uY3JlYXRlKHtcclxuICAgICAgICB1c2VySWQ6IGZvdW5kVXNlci5faWQsXHJcbiAgICAgICAgdXNlck1vZGVsOiBcIlVzZXJcIixcclxuICAgICAgICB0b2tlbjogcmVmcmVzaFRva2VuLFxyXG4gICAgICAgIGV4cGlyZXNBdDogbmV3IERhdGUoRGF0ZS5ub3coKSArIDcgKiAyNCAqIDYwICogNjAgKiAxMDAwKSxcclxuICAgICAgfSk7XHJcbiAgICB9IGNhdGNoICh0b2tlbkVycm9yKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBtYW5hZ2luZyByZWZyZXNoIHRva2VuczpcIiwgdG9rZW5FcnJvcik7XHJcbiAgICAgIC8vIENvbnRpbnVlIGV2ZW4gaWYgdG9rZW4gc3RvcmFnZSBmYWlsc1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFVwZGF0ZSBsYXN0IGxvZ2luIHRpbWVcclxuICAgIGZvdW5kVXNlci5sYXN0TG9naW4gPSBuZXcgRGF0ZSgpO1xyXG4gICAgYXdhaXQgZm91bmRVc2VyLnNhdmUoKTtcclxuXHJcbiAgICAvLyBGb3JtYXQgcmVzcG9uc2VcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDEg25nIG5o4bqtcCB0aMOgbmggY8O0bmdcIixcclxuICAgICAgdG9rZW46IGFjY2Vzc1Rva2VuLFxyXG4gICAgICByZWZyZXNoVG9rZW4sXHJcbiAgICAgIHVzZXI6IHtcclxuICAgICAgICBpZDogZm91bmRVc2VyLl9pZCxcclxuICAgICAgICB1c2VyTmFtZTogZm91bmRVc2VyLnVzZXJOYW1lLFxyXG4gICAgICAgIGVtYWlsOiBmb3VuZFVzZXIuZW1haWwsXHJcbiAgICAgICAgZmlyc3ROYW1lOiBmb3VuZFVzZXIuZmlyc3ROYW1lLFxyXG4gICAgICAgIGxhc3ROYW1lOiBmb3VuZFVzZXIubGFzdE5hbWUsXHJcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkxvZ2luIGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCJM4buXaSDEkcSDbmcgbmjhuq1wOiBcIiArIGVycm9yLm1lc3NhZ2UsXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgcmVmcmVzaFRva2VuID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgY29uc3QgeyByZWZyZXNoVG9rZW4gfSA9IHJlcS5ib2R5O1xyXG5cclxuICBpZiAoIXJlZnJlc2hUb2tlbikge1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgbWVzc2FnZTogXCJSZWZyZXNoIHRva2VuIGlzIHJlcXVpcmVkXCIgfSk7XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgLy8gVmVyaWZ5IHJlZnJlc2ggdG9rZW5cclxuICAgIGNvbnN0IGRlY29kZWQgPSBqd3QudmVyaWZ5KHJlZnJlc2hUb2tlbiwgcHJvY2Vzcy5lbnYuSldUX1JFRlJFU0hfU0VDUkVUKTtcclxuXHJcbiAgICAvLyBDaGVjayBpZiByZWZyZXNoIHRva2VuIGV4aXN0cyBpbiBkYXRhYmFzZVxyXG4gICAgY29uc3Qgc3RvcmVkVG9rZW4gPSBhd2FpdCBSZWZyZXNoVG9rZW4uZmluZE9uZSh7XHJcbiAgICAgIHRva2VuOiByZWZyZXNoVG9rZW4sXHJcbiAgICAgIHVzZXJJZDogZGVjb2RlZC5pZCxcclxuICAgIH0pO1xyXG5cclxuICAgIGlmICghc3RvcmVkVG9rZW4pIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgbWVzc2FnZTogXCJJbnZhbGlkIHJlZnJlc2ggdG9rZW5cIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaW5kIHVzZXIgKGVpdGhlciBVc2VyIG9yIEFkbWluKVxyXG4gICAgbGV0IHVzZXIgPVxyXG4gICAgICAoYXdhaXQgVXNlci5maW5kQnlJZChkZWNvZGVkLmlkKSkgfHwgKGF3YWl0IEFkbWluLmZpbmRCeUlkKGRlY29kZWQuaWQpKTtcclxuXHJcbiAgICBpZiAoIXVzZXIpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJVc2VyIG5vdCBmb3VuZFwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdlbmVyYXRlIG5ldyBhY2Nlc3MgdG9rZW5cclxuICAgIGNvbnN0IG5ld0FjY2Vzc1Rva2VuID0gand0LnNpZ24oXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogdXNlci5faWQsXHJcbiAgICAgICAgcm9sZTogdXNlci5yb2xlLFxyXG4gICAgICAgIHBlcm1pc3Npb25zOiB1c2VyLnBlcm1pc3Npb25zIHx8IFtdLFxyXG4gICAgICB9LFxyXG4gICAgICBwcm9jZXNzLmVudi5KV1RfU0VDUkVUX0FDQ0VTUyxcclxuICAgICAgeyBleHBpcmVzSW46IFwiMWhcIiB9XHJcbiAgICApO1xyXG5cclxuICAgIHJlcy5qc29uKHtcclxuICAgICAgYWNjZXNzVG9rZW46IG5ld0FjY2Vzc1Rva2VuLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGlmIChlcnJvci5uYW1lID09PSBcIlRva2VuRXhwaXJlZEVycm9yXCIpIHtcclxuICAgICAgLy8gUmVtb3ZlIGV4cGlyZWQgcmVmcmVzaCB0b2tlbiBmcm9tIGRhdGFiYXNlXHJcbiAgICAgIGF3YWl0IFJlZnJlc2hUb2tlbi5maW5kT25lQW5kRGVsZXRlKHsgdG9rZW46IHJlZnJlc2hUb2tlbiB9KTtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgbWVzc2FnZTogXCJSZWZyZXNoIHRva2VuIGV4cGlyZWRcIiB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7IG1lc3NhZ2U6IFwiSW52YWxpZCByZWZyZXNoIHRva2VuXCIgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGxvZ291dCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IHJlZnJlc2hUb2tlbiB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgaWYgKCFyZWZyZXNoVG9rZW4pIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgbWVzc2FnZTogXCJObyByZWZyZXNoIHRva2VuIHByb3ZpZGVkXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXdhaXQgUmVmcmVzaFRva2VuLmZpbmRPbmVBbmREZWxldGUoeyB0b2tlbjogcmVmcmVzaFRva2VuIH0pO1xyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oeyBtZXNzYWdlOiBcIkxvZ2dlZCBvdXQgc3VjY2Vzc2Z1bGx5XCIgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogZXJyb3IubWVzc2FnZSB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBNaWdyYXRlIHNpbmdsZSBhZGRyZXNzIHRvIGFkZHJlc3NlcyBhcnJheVxyXG5jb25zdCBtaWdyYXRlTGVnYWN5QWRkcmVzcyA9IGFzeW5jICh1c2VyKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIENoZWNrIGlmIGFkZHJlc3NlcyBhcnJheSBpcyBlbXB0eSBidXQgbGVnYWN5IGFkZHJlc3MgZXhpc3RzXHJcbiAgICBpZiAoKCF1c2VyLmFkZHJlc3NlcyB8fCB1c2VyLmFkZHJlc3Nlcy5sZW5ndGggPT09IDApICYmIHVzZXIuYWRkcmVzcykge1xyXG4gICAgICBjb25zb2xlLmxvZyhgTWlncmF0aW5nIGxlZ2FjeSBhZGRyZXNzIGZvciB1c2VyOiAke3VzZXIuX2lkfWApO1xyXG5cclxuICAgICAgLy8gQ3JlYXRlIG5ldyBhZGRyZXNzIG9iamVjdCBmcm9tIGxlZ2FjeSBmaWVsZHNcclxuICAgICAgY29uc3QgbmV3QWRkcmVzcyA9IHtcclxuICAgICAgICBmdWxsQWRkcmVzczogdXNlci5mdWxsQWRkcmVzcyB8fCB1c2VyLmFkZHJlc3MsXHJcbiAgICAgICAgaG91c2VOdW1iZXI6IHVzZXIuaG91c2VOdW1iZXIgfHwgXCJcIixcclxuICAgICAgICB3YXJkOiB1c2VyLndhcmQgfHwgXCJcIixcclxuICAgICAgICBkaXN0cmljdDogdXNlci5kaXN0cmljdCB8fCBcIlwiLFxyXG4gICAgICAgIHByb3ZpbmNlOiB1c2VyLnByb3ZpbmNlIHx8IFwiXCIsXHJcbiAgICAgICAgY29vcmRpbmF0ZXM6IHVzZXIuY29vcmRpbmF0ZXMgfHwge30sXHJcbiAgICAgICAgaXNEZWZhdWx0OiB0cnVlLFxyXG4gICAgICAgIGxhYmVsOiBcIk5ow6BcIixcclxuICAgICAgICByZWNlaXZlck5hbWU6IGAke3VzZXIuZmlyc3ROYW1lfSAke3VzZXIubGFzdE5hbWV9YCxcclxuICAgICAgICByZWNlaXZlclBob25lOiB1c2VyLnBob25lLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gQWRkIHRvIGFkZHJlc3NlcyBhcnJheVxyXG4gICAgICB1c2VyLmFkZHJlc3NlcyA9IFtuZXdBZGRyZXNzXTtcclxuICAgICAgYXdhaXQgdXNlci5zYXZlKCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBMZWdhY3kgYWRkcmVzcyBtaWdyYXRlZCBzdWNjZXNzZnVsbHkgZm9yIHVzZXI6ICR7dXNlci5faWR9YCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdXNlcjtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIG1pZ3JhdGluZyBsZWdhY3kgYWRkcmVzczpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHVzZXI7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gQWRkIHRoZSBtaWdyYXRpb24gbG9naWMgdG8gZ2V0VXNlclByb2ZpbGVcclxuZXhwb3J0IGNvbnN0IGdldFVzZXJQcm9maWxlID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHVzZXJJZCA9IHJlcS5wYXJhbXMuaWQ7XHJcbiAgICBsZXQgdXNlciA9IGF3YWl0IFVzZXIuZmluZEJ5SWQodXNlcklkKS5zZWxlY3QoXCItcGFzc3dvcmRcIik7XHJcblxyXG4gICAgaWYgKCF1c2VyKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6IFwiVXNlciBub3QgZm91bmRcIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNaWdyYXRlIGxlZ2FjeSBhZGRyZXNzIGlmIG5lZWRlZFxyXG4gICAgdXNlciA9IGF3YWl0IG1pZ3JhdGVMZWdhY3lBZGRyZXNzKHVzZXIpO1xyXG5cclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHVzZXIpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGdldEFsbFVzZXIgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuZmluZCgpO1xyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24odXNlcik7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogZXJyb3IubWVzc2FnZSB9KTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgdXBkYXRlVXNlciA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IHVzZXJJZCB9ID0gcmVxLnBhcmFtcztcclxuICAgIGNvbnN0IHtcclxuICAgICAgY3VycmVudFBhc3N3b3JkLFxyXG4gICAgICBuZXdQYXNzd29yZCxcclxuICAgICAgZmlyc3ROYW1lLFxyXG4gICAgICBsYXN0TmFtZSxcclxuICAgICAgcGhvbmUsXHJcbiAgICAgIGFkZHJlc3MsXHJcbiAgICAgIHVzZXJJbWFnZSxcclxuICAgIH0gPSByZXEuYm9keTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhcIlVwZGF0aW5nIHVzZXIgcHJvZmlsZTpcIiwgdXNlcklkKTtcclxuICAgIGNvbnNvbGUubG9nKFwiUmVxdWVzdCBib2R5OlwiLCByZXEuYm9keSk7XHJcblxyXG4gICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuZmluZEJ5SWQodXNlcklkKTtcclxuICAgIGlmICghdXNlcikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IG5nxrDhu51pIGTDuW5nXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFjhu60gbMO9IGPhuq1wIG5o4bqtdCBt4bqtdCBraOG6qXUgbuG6v3UgY8OzXHJcbiAgICBpZiAobmV3UGFzc3dvcmQpIHtcclxuICAgICAgaWYgKCFjdXJyZW50UGFzc3dvcmQpIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICBtZXNzYWdlOiBcIlZ1aSBsw7JuZyBjdW5nIGPhuqVwIG3huq10IGto4bqpdSBoaeG7h24gdOG6oWlcIixcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgaXNNYXRjaCA9IGF3YWl0IGJjcnlwdC5jb21wYXJlKGN1cnJlbnRQYXNzd29yZCwgdXNlci5wYXNzd29yZCk7XHJcbiAgICAgIGlmICghaXNNYXRjaCkge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7XHJcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgIG1lc3NhZ2U6IFwiTeG6rXQga2jhuql1IGhp4buHbiB04bqhaSBraMO0bmcgY2jDrW5oIHjDoWNcIixcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG5ld1Bhc3N3b3JkLmxlbmd0aCA8IDgpIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICBtZXNzYWdlOiBcIk3huq10IGto4bqpdSBt4bubaSBwaOG6o2kgY8OzIMOtdCBuaOG6pXQgOCBrw70gdOG7sVwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghL1tBLVpdLy50ZXN0KG5ld1Bhc3N3b3JkKSkge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgIG1lc3NhZ2U6IFwiTeG6rXQga2jhuql1IG3hu5tpIGPhuqduIMOtdCBuaOG6pXQgMSBjaOG7ryBob2FcIixcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIS9bMC05XS8udGVzdChuZXdQYXNzd29yZCkpIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICBtZXNzYWdlOiBcIk3huq10IGto4bqpdSBt4bubaSBj4bqnbiDDrXQgbmjhuqV0IDEgY2jhu68gc+G7kVwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghL1shQCMkJV4mKl0vLnRlc3QobmV3UGFzc3dvcmQpKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgbWVzc2FnZTogXCJN4bqtdCBraOG6qXUgbeG7m2kgY+G6p24gw610IG5o4bqldCAxIGvDvSB04buxIMSR4bq3YyBiaeG7h3RcIixcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc2FsdCA9IGF3YWl0IGJjcnlwdC5nZW5TYWx0KDEwKTtcclxuICAgICAgdXNlci5wYXNzd29yZCA9IGF3YWl0IGJjcnlwdC5oYXNoKG5ld1Bhc3N3b3JkLCBzYWx0KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBY4butIGzDvSBj4bqtcCBuaOG6rXQgdGjDtG5nIHRpbiBjw6EgbmjDom5cclxuICAgIGlmIChmaXJzdE5hbWUgIT09IHVuZGVmaW5lZCkgdXNlci5maXJzdE5hbWUgPSBmaXJzdE5hbWU7XHJcbiAgICBpZiAobGFzdE5hbWUgIT09IHVuZGVmaW5lZCkgdXNlci5sYXN0TmFtZSA9IGxhc3ROYW1lO1xyXG4gICAgaWYgKHBob25lICE9PSB1bmRlZmluZWQpIHVzZXIucGhvbmUgPSBwaG9uZTtcclxuICAgIGlmIChhZGRyZXNzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZyBhZGRyZXNzIHRvOlwiLCBhZGRyZXNzKTtcclxuICAgICAgdXNlci5hZGRyZXNzID0gYWRkcmVzcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBY4butIGzDvSBj4bqtcCBuaOG6rXQgYXZhdGFyIG7hur91IGPDs1xyXG4gICAgaWYgKHVzZXJJbWFnZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiVXBkYXRpbmcgdXNlciBpbWFnZSB0bzpcIiwgdXNlckltYWdlKTtcclxuICAgICAgdXNlci51c2VySW1hZ2UgPSB1c2VySW1hZ2U7XHJcbiAgICB9XHJcblxyXG4gICAgYXdhaXQgdXNlci5zYXZlKCk7XHJcbiAgICBjb25zb2xlLmxvZyhcIlVzZXIgdXBkYXRlZCBzdWNjZXNzZnVsbHk6XCIsIHVzZXIpO1xyXG5cclxuICAgIC8vIFRy4bqjIHbhu4EgdGjDtG5nIHRpbiBuZ8aw4budaSBkw7luZyDEkcOjIMSRxrDhu6NjIGPhuq1wIG5o4bqtdFxyXG4gICAgcmVzLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIkPhuq1wIG5o4bqtdCB0aMO0bmcgdGluIHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgICB1c2VyOiB7XHJcbiAgICAgICAgX2lkOiB1c2VyLl9pZCxcclxuICAgICAgICBmaXJzdE5hbWU6IHVzZXIuZmlyc3ROYW1lLFxyXG4gICAgICAgIGxhc3ROYW1lOiB1c2VyLmxhc3ROYW1lLFxyXG4gICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxyXG4gICAgICAgIHBob25lOiB1c2VyLnBob25lLFxyXG4gICAgICAgIGFkZHJlc3M6IHVzZXIuYWRkcmVzcyxcclxuICAgICAgICB1c2VySW1hZ2U6IHVzZXIudXNlckltYWdlLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgdXBkYXRpbmcgdXNlcjpcIiwgZXJyKTtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgY+G6rXAgbmjhuq10IHRow7RuZyB0aW5cIixcclxuICAgICAgZXJyb3I6IGVyci5tZXNzYWdlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IHJlcXVlc3RQYXNzd29yZFJlc2V0ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgZW1haWwgfSA9IHJlcS5ib2R5O1xyXG4gICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuZmluZE9uZSh7IGVtYWlsIH0pO1xyXG4gICAgaWYgKCF1c2VyKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJFbWFpbCBjaMawYSDEkcaw4bujYyDEkcSDbmcga8O9IHRyb25nIGjhu4cgdGjhu5FuZ1wiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGNvbnN0IG90cCA9IGdlbmVyYXRlT1RQKCk7XHJcbiAgICBjb25zdCBvdHBFeHBpcmVzID0gbmV3IERhdGUoRGF0ZS5ub3coKSArIDE1ICogNjAgKiAxMDAwKTtcclxuXHJcbiAgICB1c2VyLnJlc2V0UGFzc3dvcmRUb2tlbiA9IG90cDtcclxuICAgIHVzZXIucmVzZXRQYXNzd29yZEV4cGlyZXMgPSBvdHBFeHBpcmVzO1xyXG4gICAgYXdhaXQgdXNlci5zYXZlKCk7XHJcblxyXG4gICAgYXdhaXQgc2VuZE9UUEVtYWlsKGVtYWlsLCBvdHApO1xyXG5cclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJNw6MgT1RQIMSRw6MgxJHGsOG7o2MgZ+G7rWkgxJHhur9uIGVtYWlsIGPhu6dhIGLhuqFuXCIsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGluIHJlcXVlc3RQYXNzd29yZFJlc2V0OlwiLCBlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIHjhu60gbMO9IHnDqnUgY+G6p3VcIixcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCByZXNldFBhc3N3b3JkID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgZW1haWwsIG90cCwgbmV3UGFzc3dvcmQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmICghZW1haWwgfHwgIW90cCB8fCAhbmV3UGFzc3dvcmQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIlRoaeG6v3UgdGjDtG5nIHRpbiBj4bqnbiB0aGnhur90XCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFTDrG0gbmfGsOG7nWkgZMO5bmcgZOG7sWEgdHLDqm4gZW1haWwgdsOgIE9UUCBo4bujcCBs4buHXHJcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHtcclxuICAgICAgZW1haWwsXHJcbiAgICAgIHJlc2V0UGFzc3dvcmRUb2tlbjogb3RwLFxyXG4gICAgICByZXNldFBhc3N3b3JkRXhwaXJlczogeyAkZ3Q6IERhdGUubm93KCkgfSwgLy8gT1RQIGPDsm4gaOG6oW4gc+G7rSBk4bulbmdcclxuICAgIH0pO1xyXG5cclxuICAgIGlmICghdXNlcikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiTcOjIE9UUCBraMO0bmcgaOG7o3AgbOG7hyBob+G6t2MgxJHDoyBo4bq/dCBo4bqhblwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBLaeG7g20gdHJhIMSR4buZIG3huqFuaCBj4bunYSBt4bqtdCBraOG6qXUgbeG7m2lcclxuICAgIGlmIChuZXdQYXNzd29yZC5sZW5ndGggPCA4KSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJN4bqtdCBraOG6qXUgbeG7m2kgcGjhuqNpIGPDsyDDrXQgbmjhuqV0IDgga8O9IHThu7FcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAoIS9bQS1aXS8udGVzdChuZXdQYXNzd29yZCkpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIk3huq10IGto4bqpdSBt4bubaSBj4bqnbiDDrXQgbmjhuqV0IDEgY2jhu68gaG9hXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKCEvWzAtOV0vLnRlc3QobmV3UGFzc3dvcmQpKSB7XHJcbiAgICAgIHJldHVybiByZXNcclxuICAgICAgICAuc3RhdHVzKDQwMClcclxuICAgICAgICAuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIk3huq10IGto4bqpdSBt4bubaSBj4bqnbiDDrXQgbmjhuqV0IDEgY2jhu68gc+G7kVwiIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKCEvWyFAIyQlXiYqXS8udGVzdChuZXdQYXNzd29yZCkpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIk3huq10IGto4bqpdSBt4bubaSBj4bqnbiDDrXQgbmjhuqV0IDEga8O9IHThu7EgxJHhurdjIGJp4buHdFwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYXNoIG3huq10IGto4bqpdSBt4bubaVxyXG4gICAgY29uc3Qgc2FsdCA9IGF3YWl0IGJjcnlwdC5nZW5TYWx0KDEwKTtcclxuICAgIHVzZXIucGFzc3dvcmQgPSBhd2FpdCBiY3J5cHQuaGFzaChuZXdQYXNzd29yZCwgc2FsdCk7XHJcblxyXG4gICAgLy8gWMOzYSBPVFAgc2F1IGtoaSBz4butIGThu6VuZ1xyXG4gICAgdXNlci5yZXNldFBhc3N3b3JkVG9rZW4gPSBudWxsO1xyXG4gICAgdXNlci5yZXNldFBhc3N3b3JkRXhwaXJlcyA9IG51bGw7XHJcblxyXG4gICAgYXdhaXQgdXNlci5zYXZlKCk7XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCLEkOG6t3QgbOG6oWkgbeG6rXQga2jhuql1IHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIMSR4bq3dCBs4bqhaSBt4bqtdCBraOG6qXVcIixcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFjhu60gbMO9IGNo4bq3bi9i4buPIGNo4bq3biBuZ8aw4budaSBkw7luZ1xyXG5leHBvcnQgY29uc3QgYmxvY2tVc2VyID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgdXNlcklkIH0gPSByZXEucGFyYW1zO1xyXG4gICAgY29uc3QgeyBpc0Jsb2NrZWQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmIChpc0Jsb2NrZWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiVGhp4bq/dSB0aMO0bmcgdGluIHRy4bqhbmcgdGjDoWkgY2jhurduIG5nxrDhu51pIGTDuW5nXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBVc2VyLmZpbmRCeUlkKHVzZXJJZCk7XHJcbiAgICBpZiAoIXVzZXIpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBuZ8aw4budaSBkw7luZ1wiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBD4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSBjaOG6t25cclxuICAgIHVzZXIuaXNCbG9ja2VkID0gaXNCbG9ja2VkO1xyXG4gICAgYXdhaXQgdXNlci5zYXZlKCk7XHJcblxyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBpc0Jsb2NrZWRcclxuICAgICAgICA/IFwixJDDoyBjaOG6t24gbmfGsOG7nWkgZMO5bmcgdGjDoG5oIGPDtG5nXCJcclxuICAgICAgICA6IFwixJDDoyBi4buPIGNo4bq3biBuZ8aw4budaSBkw7luZyB0aMOgbmggY8O0bmdcIixcclxuICAgICAgdXNlcjoge1xyXG4gICAgICAgIF9pZDogdXNlci5faWQsXHJcbiAgICAgICAgaXNCbG9ja2VkOiB1c2VyLmlzQmxvY2tlZCxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIHjhu60gbMO9IHnDqnUgY+G6p3VcIixcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEjDoG0gxJHEg25nIG5o4bqtcCBi4bqxbmcgRmFjZWJvb2tcclxuZXhwb3J0IGNvbnN0IGZhY2Vib29rTG9naW4gPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBhY2Nlc3NUb2tlbiwgdXNlcklEIH0gPSByZXEuYm9keTtcclxuXHJcbiAgICBpZiAoIWFjY2Vzc1Rva2VuIHx8ICF1c2VySUQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIlRoaeG6v3UgdGjDtG5nIHRpbiB4w6FjIHRo4buxYyB04burIEZhY2Vib29rXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFjDoWMgdGjhu7FjIHRva2VuIEZhY2Vib29rIGLhurFuZyBjw6FjaCBn4buNaSBBUEkgY+G7p2EgRmFjZWJvb2tcclxuICAgIGNvbnN0IGZiUmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoXHJcbiAgICAgIGBodHRwczovL2dyYXBoLmZhY2Vib29rLmNvbS92MTguMC8ke3VzZXJJRH1gLFxyXG4gICAgICB7XHJcbiAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICBmaWVsZHM6IFwiaWQsZW1haWwsZmlyc3RfbmFtZSxsYXN0X25hbWUscGljdHVyZVwiLFxyXG4gICAgICAgICAgYWNjZXNzX3Rva2VuOiBhY2Nlc3NUb2tlbixcclxuICAgICAgICB9LFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIGlmICghZmJSZXNwb25zZS5kYXRhIHx8ICFmYlJlc3BvbnNlLmRhdGEuaWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0aOG7gyB4w6FjIHRo4buxYyB24bubaSBGYWNlYm9va1wiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGlkLCBlbWFpbCwgZmlyc3RfbmFtZSwgbGFzdF9uYW1lLCBwaWN0dXJlIH0gPSBmYlJlc3BvbnNlLmRhdGE7XHJcblxyXG4gICAgLy8gVMOsbSB1c2VyIHbhu5tpIEZhY2Vib29rSURcclxuICAgIGxldCB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgZmFjZWJvb2tJZDogaWQgfSk7XHJcblxyXG4gICAgLy8gTuG6v3UgdXNlciBraMO0bmcgdOG7k24gdOG6oWkgbmjGsG5nIGVtYWlsIMSRw6MgdOG7k24gdOG6oWksIGxpw6puIGvhur90IHTDoGkga2hv4bqjbiDEkcOzXHJcbiAgICBpZiAoIXVzZXIgJiYgZW1haWwpIHtcclxuICAgICAgdXNlciA9IGF3YWl0IFVzZXIuZmluZE9uZSh7IGVtYWlsIH0pO1xyXG4gICAgICBpZiAodXNlcikge1xyXG4gICAgICAgIC8vIExpw6puIGvhur90IHTDoGkga2hv4bqjbiDEkcOjIHThu5NuIHThuqFpIHbhu5tpIEZhY2Vib29rXHJcbiAgICAgICAgdXNlci5mYWNlYm9va0lkID0gaWQ7XHJcbiAgICAgICAgdXNlci5hdXRoUHJvdmlkZXIgPSBcImZhY2Vib29rXCI7XHJcbiAgICAgICAgYXdhaXQgdXNlci5zYXZlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBO4bq/dSB24bqrbiBraMO0bmcgdMOsbSB0aOG6pXkgdXNlciwgdOG6oW8gbeG7m2lcclxuICAgIGlmICghdXNlcikge1xyXG4gICAgICAvLyBU4bqhbyB1c2VybmFtZSBuZ+G6q3Ugbmhpw6puIG7hur91IGtow7RuZyBjw7NcclxuICAgICAgY29uc3QgdW5pcXVlVXNlcm5hbWUgPSBgZmJfJHtpZH1fJHtEYXRlLm5vdygpLnRvU3RyaW5nKCkuc2xpY2UoLTQpfWA7XHJcblxyXG4gICAgICAvLyBU4bqhbyBt4bqtdCBraOG6qXUgbmfhuqt1IG5oacOqblxyXG4gICAgICBjb25zdCByYW5kb21QYXNzd29yZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKC0xMCk7XHJcbiAgICAgIGNvbnN0IGhhc2hlZFBhc3N3b3JkID0gYXdhaXQgYmNyeXB0Lmhhc2gocmFuZG9tUGFzc3dvcmQsIDEwKTtcclxuXHJcbiAgICAgIC8vIFVzZSBkZWZhdWx0IGF2YXRhciBpbnN0ZWFkIG9mIEZhY2Vib29rIHByb2ZpbGUgcGljXHJcbiAgICAgIGNvbnN0IHByb2ZpbGVJbWFnZVVybCA9IFwiXCI7IC8vIERvbid0IHN0b3JlIEZhY2Vib29rIHByb2ZpbGUgVVJMXHJcblxyXG4gICAgICB1c2VyID0gbmV3IFVzZXIoe1xyXG4gICAgICAgIGVtYWlsOiBlbWFpbCB8fCBgJHtpZH1AZmFjZWJvb2suY29tYCxcclxuICAgICAgICBwaG9uZTogXCIwMDAwMDAwMDAwXCIsIC8vIFBsYWNlaG9sZGVyIHBob25lIG51bWJlclxyXG4gICAgICAgIGZpcnN0TmFtZTogZmlyc3RfbmFtZSB8fCBcIkZhY2Vib29rXCIsXHJcbiAgICAgICAgbGFzdE5hbWU6IGxhc3RfbmFtZSB8fCBcIlVzZXJcIixcclxuICAgICAgICB1c2VyTmFtZTogdW5pcXVlVXNlcm5hbWUsXHJcbiAgICAgICAgcGFzc3dvcmQ6IGhhc2hlZFBhc3N3b3JkLFxyXG4gICAgICAgIHVzZXJJbWFnZTogcHJvZmlsZUltYWdlVXJsLFxyXG4gICAgICAgIGZhY2Vib29rSWQ6IGlkLFxyXG4gICAgICAgIGF1dGhQcm92aWRlcjogXCJmYWNlYm9va1wiLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEtp4buDbSB0cmEgbuG6v3UgdMOgaSBraG/huqNuIGLhu4sgY2jhurduXHJcbiAgICBpZiAodXNlci5pc0Jsb2NrZWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIlTDoGkga2hv4bqjbiDEkcOjIGLhu4sga2jDs2EuIFZ1aSBsw7JuZyBsacOqbiBo4buHIHF14bqjbiB0cuG7iyB2acOqbi5cIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVOG6oW8gdG9rZW5zXHJcbiAgICBjb25zdCB0b2tlbiA9IGp3dC5zaWduKFxyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6IHVzZXIuX2lkLFxyXG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICAgIHBlcm1pc3Npb25zOiBbXCJYZW1cIl0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHByb2Nlc3MuZW52LkpXVF9TRUNSRVRfQUNDRVNTLFxyXG4gICAgICB7IGV4cGlyZXNJbjogXCIxZFwiIH1cclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgcmVmcmVzaFRva2VuID0gand0LnNpZ24oXHJcbiAgICAgIHsgaWQ6IHVzZXIuX2lkIH0sXHJcbiAgICAgIHByb2Nlc3MuZW52LkpXVF9SRUZSRVNIX1NFQ1JFVCxcclxuICAgICAgeyBleHBpcmVzSW46IFwiN2RcIiB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEzGsHUgcmVmcmVzaCB0b2tlblxyXG4gICAgYXdhaXQgUmVmcmVzaFRva2VuLmNyZWF0ZSh7XHJcbiAgICAgIHVzZXJJZDogdXNlci5faWQsXHJcbiAgICAgIHVzZXJNb2RlbDogXCJVc2VyXCIsXHJcbiAgICAgIHRva2VuOiByZWZyZXNoVG9rZW4sXHJcbiAgICAgIGV4cGlyZXNBdDogbmV3IERhdGUoRGF0ZS5ub3coKSArIDcgKiAyNCAqIDYwICogNjAgKiAxMDAwKSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEPhuq1wIG5o4bqtdCBsYXN0TG9naW5cclxuICAgIHVzZXIubGFzdExvZ2luID0gbmV3IERhdGUoKTtcclxuICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xyXG5cclxuICAgIC8vIEfhu61pIHJlc3BvbnNlXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIHRva2VuLFxyXG4gICAgICByZWZyZXNoVG9rZW4sXHJcbiAgICAgIHVzZXI6IHtcclxuICAgICAgICBpZDogdXNlci5faWQsXHJcbiAgICAgICAgbmFtZTogYCR7dXNlci5maXJzdE5hbWV9ICR7dXNlci5sYXN0TmFtZX1gLFxyXG4gICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxyXG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICAgIHBlcm1pc3Npb25zOiBbXCJYZW1cIl0sXHJcbiAgICAgIH0sXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDEg25nIG5o4bqtcCBi4bqxbmcgRmFjZWJvb2sgdGjDoG5oIGPDtG5nIVwiLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJGYWNlYm9vayBsb2dpbiBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCLEkMSDbmcgbmjhuq1wIGLhurFuZyBGYWNlYm9vayB0aOG6pXQgYuG6oWkuIFZ1aSBsw7JuZyB0aOG7rSBs4bqhaS5cIixcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEjDoG0gxJHEg25nIG5o4bqtcCBi4bqxbmcgR29vZ2xlXHJcbmV4cG9ydCBjb25zdCBnb29nbGVMb2dpbiA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IGNyZWRlbnRpYWwgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmICghY3JlZGVudGlhbCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiVGhp4bq/dSB0aMO0bmcgdGluIHjDoWMgdGjhu7FjIHThu6sgR29vZ2xlXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKFwiR29vZ2xlIGxvZ2luIHdpdGggY2xpZW50SUQ6XCIsIHByb2Nlc3MuZW52LkdPT0dMRV9DTElFTlRfSUQpO1xyXG5cclxuICAgIC8vIFjDoWMgdGjhu7FjIEdvb2dsZSBJRCB0b2tlblxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgdGlja2V0ID0gYXdhaXQgZ29vZ2xlQ2xpZW50LnZlcmlmeUlkVG9rZW4oe1xyXG4gICAgICAgIGlkVG9rZW46IGNyZWRlbnRpYWwsXHJcbiAgICAgICAgYXVkaWVuY2U6IHByb2Nlc3MuZW52LkdPT0dMRV9DTElFTlRfSUQsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgY29uc3QgcGF5bG9hZCA9IHRpY2tldC5nZXRQYXlsb2FkKCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiR29vZ2xlIHBheWxvYWQgdmVyaWZpZWQgc3VjY2Vzc2Z1bGx5OlwiLCBwYXlsb2FkLnN1Yik7XHJcblxyXG4gICAgICBjb25zdCB7IHN1YiwgZW1haWwsIGdpdmVuX25hbWUsIGZhbWlseV9uYW1lLCBwaWN0dXJlIH0gPSBwYXlsb2FkO1xyXG5cclxuICAgICAgLy8gVMOsbSB1c2VyIHbhu5tpIEdvb2dsZUlEXHJcbiAgICAgIGxldCB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgZ29vZ2xlSWQ6IHN1YiB9KTtcclxuXHJcbiAgICAgIC8vIE7hur91IHVzZXIga2jDtG5nIHThu5NuIHThuqFpIG5oxrBuZyBlbWFpbCDEkcOjIHThu5NuIHThuqFpLCBsacOqbiBr4bq/dCB0w6BpIGtob+G6o24gxJHDs1xyXG4gICAgICBpZiAoIXVzZXIgJiYgZW1haWwpIHtcclxuICAgICAgICB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgZW1haWwgfSk7XHJcbiAgICAgICAgaWYgKHVzZXIpIHtcclxuICAgICAgICAgIC8vIExpw6puIGvhur90IHTDoGkga2hv4bqjbiDEkcOjIHThu5NuIHThuqFpIHbhu5tpIEdvb2dsZVxyXG4gICAgICAgICAgdXNlci5nb29nbGVJZCA9IHN1YjtcclxuICAgICAgICAgIHVzZXIuYXV0aFByb3ZpZGVyID0gXCJnb29nbGVcIjtcclxuICAgICAgICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTuG6v3UgduG6q24ga2jDtG5nIHTDrG0gdGjhuqV5IHVzZXIsIHThuqFvIG3hu5tpXHJcbiAgICAgIGlmICghdXNlcikge1xyXG4gICAgICAgIC8vIFThuqFvIHVzZXJuYW1lIG5n4bqrdSBuaGnDqm4gbuG6v3Uga2jDtG5nIGPDs1xyXG4gICAgICAgIGNvbnN0IHVuaXF1ZVVzZXJuYW1lID0gYGdvb2dsZV8ke3N1Yi5zbGljZSgtOCl9XyR7RGF0ZS5ub3coKVxyXG4gICAgICAgICAgLnRvU3RyaW5nKClcclxuICAgICAgICAgIC5zbGljZSgtNCl9YDtcclxuXHJcbiAgICAgICAgLy8gVOG6oW8gbeG6rXQga2jhuql1IG5n4bqrdSBuaGnDqm5cclxuICAgICAgICBjb25zdCByYW5kb21QYXNzd29yZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKC0xMCk7XHJcbiAgICAgICAgY29uc3QgaGFzaGVkUGFzc3dvcmQgPSBhd2FpdCBiY3J5cHQuaGFzaChyYW5kb21QYXNzd29yZCwgMTApO1xyXG5cclxuICAgICAgICB1c2VyID0gbmV3IFVzZXIoe1xyXG4gICAgICAgICAgZW1haWw6IGVtYWlsLFxyXG4gICAgICAgICAgcGhvbmU6IFwiMDAwMDAwMDAwMFwiLCAvLyBQbGFjZWhvbGRlciBwaG9uZSBudW1iZXJcclxuICAgICAgICAgIGZpcnN0TmFtZTogZ2l2ZW5fbmFtZSB8fCBcIkdvb2dsZVwiLFxyXG4gICAgICAgICAgbGFzdE5hbWU6IGZhbWlseV9uYW1lIHx8IFwiVXNlclwiLFxyXG4gICAgICAgICAgdXNlck5hbWU6IHVuaXF1ZVVzZXJuYW1lLFxyXG4gICAgICAgICAgcGFzc3dvcmQ6IGhhc2hlZFBhc3N3b3JkLFxyXG4gICAgICAgICAgdXNlckltYWdlOiBwaWN0dXJlIHx8IFwiXCIsXHJcbiAgICAgICAgICBnb29nbGVJZDogc3ViLFxyXG4gICAgICAgICAgYXV0aFByb3ZpZGVyOiBcImdvb2dsZVwiLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBhd2FpdCB1c2VyLnNhdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gS2nhu4NtIHRyYSBu4bq/dSB0w6BpIGtob+G6o24gYuG7iyBjaOG6t25cclxuICAgICAgaWYgKHVzZXIuaXNCbG9ja2VkKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHtcclxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgbWVzc2FnZTogXCJUw6BpIGtob+G6o24gxJHDoyBi4buLIGtow7NhLiBWdWkgbMOybmcgbGnDqm4gaOG7hyBxdeG6o24gdHLhu4sgdmnDqm4uXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFThuqFvIHRva2Vuc1xyXG4gICAgICBjb25zdCB0b2tlbiA9IGp3dC5zaWduKFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiB1c2VyLl9pZCxcclxuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtcIlhlbVwiXSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHByb2Nlc3MuZW52LkpXVF9TRUNSRVRfQUNDRVNTLFxyXG4gICAgICAgIHsgZXhwaXJlc0luOiBcIjFkXCIgfVxyXG4gICAgICApO1xyXG5cclxuICAgICAgY29uc3QgcmVmcmVzaFRva2VuID0gand0LnNpZ24oXHJcbiAgICAgICAgeyBpZDogdXNlci5faWQgfSxcclxuICAgICAgICBwcm9jZXNzLmVudi5KV1RfUkVGUkVTSF9TRUNSRVQsXHJcbiAgICAgICAgeyBleHBpcmVzSW46IFwiN2RcIiB9XHJcbiAgICAgICk7XHJcblxyXG4gICAgICAvLyBMxrB1IHJlZnJlc2ggdG9rZW5cclxuICAgICAgYXdhaXQgUmVmcmVzaFRva2VuLmNyZWF0ZSh7XHJcbiAgICAgICAgdXNlcklkOiB1c2VyLl9pZCxcclxuICAgICAgICB1c2VyTW9kZWw6IFwiVXNlclwiLFxyXG4gICAgICAgIHRva2VuOiByZWZyZXNoVG9rZW4sXHJcbiAgICAgICAgZXhwaXJlc0F0OiBuZXcgRGF0ZShEYXRlLm5vdygpICsgNyAqIDI0ICogNjAgKiA2MCAqIDEwMDApLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIEPhuq1wIG5o4bqtdCBsYXN0TG9naW5cclxuICAgICAgdXNlci5sYXN0TG9naW4gPSBuZXcgRGF0ZSgpO1xyXG4gICAgICBhd2FpdCB1c2VyLnNhdmUoKTtcclxuXHJcbiAgICAgIC8vIEfhu61pIHJlc3BvbnNlXHJcbiAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIHRva2VuLFxyXG4gICAgICAgIHJlZnJlc2hUb2tlbixcclxuICAgICAgICB1c2VyOiB7XHJcbiAgICAgICAgICBpZDogdXNlci5faWQsXHJcbiAgICAgICAgICBuYW1lOiBgJHt1c2VyLmZpcnN0TmFtZX0gJHt1c2VyLmxhc3ROYW1lfWAsXHJcbiAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcclxuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtcIlhlbVwiXSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIG1lc3NhZ2U6IFwixJDEg25nIG5o4bqtcCBi4bqxbmcgR29vZ2xlIHRow6BuaCBjw7RuZyFcIixcclxuICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiR29vZ2xlIGxvZ2luIGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIsSQxINuZyBuaOG6rXAgYuG6sW5nIEdvb2dsZSB0aOG6pXQgYuG6oWkuIFZ1aSBsw7JuZyB0aOG7rSBs4bqhaS5cIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJHb29nbGUgbG9naW4gZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDEg25nIG5o4bqtcCBi4bqxbmcgR29vZ2xlIHRo4bqldCBi4bqhaS4gVnVpIGzDsm5nIHRo4butIGzhuqFpLlwiLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gSMOgbSB44butIGzDvSBjYWxsYmFjayB04burIEZhY2Vib29rIE9BdXRoXHJcbmV4cG9ydCBjb25zdCBmYWNlYm9va0NhbGxiYWNrID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIENvZGUgZnJvbSBhdXRoZW50aWNhdGlvbiBjYWxsYmFja1xyXG4gICAgY29uc3QgeyBjb2RlIH0gPSByZXEucXVlcnk7XHJcblxyXG4gICAgaWYgKCFjb2RlKSB7XHJcbiAgICAgIHJldHVybiByZXMucmVkaXJlY3QoXCIvZGFuZy1uaGFwP2Vycm9yPW5vX2NvZGVcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRXhjaGFuZ2UgY29kZSBmb3IgYWNjZXNzIHRva2VuXHJcbiAgICBjb25zdCB0b2tlblJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KFxyXG4gICAgICBcImh0dHBzOi8vZ3JhcGguZmFjZWJvb2suY29tL29hdXRoL2FjY2Vzc190b2tlblwiLFxyXG4gICAgICB7XHJcbiAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkZBQ0VCT09LX0FQUF9JRCxcclxuICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkZBQ0VCT09LX0FQUF9TRUNSRVQsXHJcbiAgICAgICAgICByZWRpcmVjdF91cmk6IHByb2Nlc3MuZW52LkZBQ0VCT09LX0NBTExCQUNLX1VSTCxcclxuICAgICAgICAgIGNvZGUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAoIXRva2VuUmVzcG9uc2UuZGF0YS5hY2Nlc3NfdG9rZW4pIHtcclxuICAgICAgcmV0dXJuIHJlcy5yZWRpcmVjdChcIi9kYW5nLW5oYXA/ZXJyb3I9dG9rZW5fZXhjaGFuZ2VfZmFpbGVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGFjY2Vzc1Rva2VuID0gdG9rZW5SZXNwb25zZS5kYXRhLmFjY2Vzc190b2tlbjtcclxuXHJcbiAgICAvLyBHZXQgdXNlciBkYXRhIHdpdGggYWNjZXNzIHRva2VuXHJcbiAgICBjb25zdCB1c2VyRGF0YVJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KFwiaHR0cHM6Ly9ncmFwaC5mYWNlYm9vay5jb20vbWVcIiwge1xyXG4gICAgICBwYXJhbXM6IHtcclxuICAgICAgICBmaWVsZHM6IFwiaWQsZmlyc3RfbmFtZSxsYXN0X25hbWUsZW1haWwscGljdHVyZVwiLFxyXG4gICAgICAgIGFjY2Vzc190b2tlbjogYWNjZXNzVG9rZW4sXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoIXVzZXJEYXRhUmVzcG9uc2UuZGF0YS5pZCkge1xyXG4gICAgICByZXR1cm4gcmVzLnJlZGlyZWN0KFwiL2RhbmctbmhhcD9lcnJvcj11c2VyX2RhdGFfZmFpbGVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHsgaWQsIGZpcnN0X25hbWUsIGxhc3RfbmFtZSwgZW1haWwgfSA9IHVzZXJEYXRhUmVzcG9uc2UuZGF0YTtcclxuXHJcbiAgICAvLyBMb29rIGZvciB1c2VyIHdpdGggRmFjZWJvb2sgSURcclxuICAgIGxldCB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgZmFjZWJvb2tJZDogaWQgfSk7XHJcblxyXG4gICAgLy8gSWYgdXNlciBub3QgZm91bmQgYnV0IHdlIGhhdmUgYW4gZW1haWwsIGxvb2sgZm9yIHVzZXIgd2l0aCB0aGF0IGVtYWlsXHJcbiAgICBpZiAoIXVzZXIgJiYgZW1haWwpIHtcclxuICAgICAgdXNlciA9IGF3YWl0IFVzZXIuZmluZE9uZSh7IGVtYWlsIH0pO1xyXG5cclxuICAgICAgLy8gSWYgZm91bmQgYnkgZW1haWwsIHVwZGF0ZSB0aGUgRmFjZWJvb2sgSURcclxuICAgICAgaWYgKHVzZXIpIHtcclxuICAgICAgICB1c2VyLmZhY2Vib29rSWQgPSBpZDtcclxuICAgICAgICBhd2FpdCB1c2VyLnNhdmUoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHN0aWxsIG5vIHVzZXIsIGNyZWF0ZSBhIG5ldyBvbmVcclxuICAgIGlmICghdXNlcikge1xyXG4gICAgICBjb25zdCB1bmlxdWVVc2VybmFtZSA9IGBmYl8ke2lkfV8ke0RhdGUubm93KCkudG9TdHJpbmcoKS5zbGljZSgtNCl9YDtcclxuICAgICAgY29uc3QgcmFuZG9tUGFzc3dvcmQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgtMTApO1xyXG4gICAgICBjb25zdCBoYXNoZWRQYXNzd29yZCA9IGF3YWl0IGJjcnlwdC5oYXNoKHJhbmRvbVBhc3N3b3JkLCAxMCk7XHJcblxyXG4gICAgICAvLyBVc2UgZGVmYXVsdCBhdmF0YXIgaW5zdGVhZCBvZiBGYWNlYm9vayBpbWFnZVxyXG4gICAgICBjb25zdCBwcm9maWxlSW1hZ2VVcmwgPSBcIlwiO1xyXG5cclxuICAgICAgdXNlciA9IG5ldyBVc2VyKHtcclxuICAgICAgICBlbWFpbDogYCR7dW5pcXVlVXNlcm5hbWV9QGZhY2Vib29rLmNvbWAsXHJcbiAgICAgICAgcGhvbmU6IFwiMDAwMDAwMDAwMFwiLCAvLyBQbGFjZWhvbGRlciBwaG9uZSBudW1iZXJcclxuICAgICAgICBmaXJzdE5hbWU6IGZpcnN0X25hbWUgfHwgXCJGYWNlYm9va1wiLFxyXG4gICAgICAgIGxhc3ROYW1lOiBsYXN0X25hbWUgfHwgXCJVc2VyXCIsXHJcbiAgICAgICAgdXNlck5hbWU6IHVuaXF1ZVVzZXJuYW1lLFxyXG4gICAgICAgIHBhc3N3b3JkOiBoYXNoZWRQYXNzd29yZCxcclxuICAgICAgICB1c2VySW1hZ2U6IHByb2ZpbGVJbWFnZVVybCxcclxuICAgICAgICBmYWNlYm9va0lkOiBpZCxcclxuICAgICAgICBhdXRoUHJvdmlkZXI6IFwiZmFjZWJvb2tcIixcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBhd2FpdCB1c2VyLnNhdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayBpZiBhY2NvdW50IGlzIGJsb2NrZWRcclxuICAgIGlmICh1c2VyLmlzQmxvY2tlZCkge1xyXG4gICAgICByZXR1cm4gcmVzLnJlZGlyZWN0KFwiL2RhbmctbmhhcD9lcnJvcj1hY2NvdW50X2Jsb2NrZWRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ3JlYXRlIHRva2Vuc1xyXG4gICAgY29uc3QgdG9rZW4gPSBqd3Quc2lnbihcclxuICAgICAge1xyXG4gICAgICAgIGlkOiB1c2VyLl9pZCxcclxuICAgICAgICByb2xlOiBcInVzZXJcIixcclxuICAgICAgICBwZXJtaXNzaW9uczogW1wiWGVtXCJdLFxyXG4gICAgICB9LFxyXG4gICAgICBwcm9jZXNzLmVudi5KV1RfU0VDUkVUX0FDQ0VTUyxcclxuICAgICAgeyBleHBpcmVzSW46IFwiMWRcIiB9XHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IHJlZnJlc2hUb2tlbiA9IGp3dC5zaWduKFxyXG4gICAgICB7IGlkOiB1c2VyLl9pZCB9LFxyXG4gICAgICBwcm9jZXNzLmVudi5KV1RfUkVGUkVTSF9TRUNSRVQsXHJcbiAgICAgIHsgZXhwaXJlc0luOiBcIjdkXCIgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBYw7NhIHJlZnJlc2ggdG9rZW5zIGPFqSBj4bunYSB1c2VyIG7DoHkgdHLGsOG7m2Mga2hpIHThuqFvIG3hu5tpXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBSZWZyZXNoVG9rZW4uZGVsZXRlTWFueSh7IHVzZXJJZDogdXNlci5faWQsIHVzZXJNb2RlbDogXCJVc2VyXCIgfSk7XHJcblxyXG4gICAgICAvLyBTYXUga2hpIHjDs2EgdG9rZW5zIGPFqSwgdOG6oW8gdG9rZW4gbeG7m2lcclxuICAgICAgYXdhaXQgUmVmcmVzaFRva2VuLmNyZWF0ZSh7XHJcbiAgICAgICAgdXNlcklkOiB1c2VyLl9pZCxcclxuICAgICAgICB1c2VyTW9kZWw6IFwiVXNlclwiLFxyXG4gICAgICAgIHRva2VuOiByZWZyZXNoVG9rZW4sXHJcbiAgICAgICAgZXhwaXJlc0F0OiBuZXcgRGF0ZShEYXRlLm5vdygpICsgNyAqIDI0ICogNjAgKiA2MCAqIDEwMDApLFxyXG4gICAgICB9KTtcclxuICAgIH0gY2F0Y2ggKHRva2VuRXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIG1hbmFnaW5nIHJlZnJlc2ggdG9rZW5zOlwiLCB0b2tlbkVycm9yKTtcclxuICAgICAgLy8gQ29udGludWUgZXZlbiBpZiB0b2tlbiBzdG9yYWdlIGZhaWxzXHJcbiAgICB9XHJcblxyXG4gICAgLy8gVXBkYXRlIGxhc3QgbG9naW5cclxuICAgIHVzZXIubGFzdExvZ2luID0gbmV3IERhdGUoKTtcclxuICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xyXG5cclxuICAgIC8vIFJlZGlyZWN0IHdpdGggdG9rZW5zIGFzIFVSTCBwYXJhbWV0ZXJzXHJcbiAgICByZXMucmVkaXJlY3QoXHJcbiAgICAgIGAvZGFuZy1uaGFwL3N1Y2Nlc3M/dG9rZW49JHt0b2tlbn0mcmVmcmVzaFRva2VuPSR7cmVmcmVzaFRva2VufSZ1c2VySWQ9JHtcclxuICAgICAgICB1c2VyLl9pZFxyXG4gICAgICB9Jm5hbWU9JHtlbmNvZGVVUklDb21wb25lbnQoXHJcbiAgICAgICAgYCR7dXNlci5maXJzdE5hbWV9ICR7dXNlci5sYXN0TmFtZX1gXHJcbiAgICAgICl9JnJvbGU9dXNlcmBcclxuICAgICk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJGYWNlYm9vayBjYWxsYmFjayBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmVzLnJlZGlyZWN0KFwiL2RhbmctbmhhcD9lcnJvcj1zZXJ2ZXJfZXJyb3JcIik7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gSMOgbSDEkcSDbmcgbmjhuq1wIGLhurFuZyBGYWNlYm9vayB0b2tlblxyXG5leHBvcnQgY29uc3QgZmFjZWJvb2tUb2tlbkxvZ2luID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgYWNjZXNzVG9rZW4gfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmICghYWNjZXNzVG9rZW4pIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIlRoaeG6v3UgYWNjZXNzIHRva2VuXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEzhuqV5IHRow7RuZyB0aW4gdOG7qyBGYWNlYm9vayBi4bqxbmcgYWNjZXNzIHRva2VuXHJcbiAgICBjb25zdCBmYlJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGBodHRwczovL2dyYXBoLmZhY2Vib29rLmNvbS92MTguMC9tZWAsIHtcclxuICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgZmllbGRzOlxyXG4gICAgICAgICAgXCJpZCxmaXJzdF9uYW1lLGxhc3RfbmFtZSxlbWFpbCxwaWN0dXJle3VybCx3aWR0aCxoZWlnaHQsaXNfc2lsaG91ZXR0ZX1cIixcclxuICAgICAgICBhY2Nlc3NfdG9rZW46IGFjY2Vzc1Rva2VuLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKCFmYlJlc3BvbnNlLmRhdGEgfHwgIWZiUmVzcG9uc2UuZGF0YS5pZCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHRo4buDIHjDoWMgdGjhu7FjIHbhu5tpIEZhY2Vib29rXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHsgaWQsIGZpcnN0X25hbWUsIGxhc3RfbmFtZSwgZW1haWwsIHBpY3R1cmUgfSA9IGZiUmVzcG9uc2UuZGF0YTtcclxuXHJcbiAgICAvLyBMb2cgdGjDtG5nIHRpbiBuaOG6rW4gxJHGsOG7o2MgdOG7qyBGYWNlYm9va1xyXG4gICAgY29uc29sZS5sb2coXCJGYWNlYm9vayBkYXRhIHJlY2VpdmVkOlwiLCB7XHJcbiAgICAgIGlkLFxyXG4gICAgICBmaXJzdF9uYW1lLFxyXG4gICAgICBsYXN0X25hbWUsXHJcbiAgICAgIGVtYWlsOiBlbWFpbCB8fCBcIk5vIGVtYWlsIHByb3ZpZGVkIGJ5IEZhY2Vib29rXCIsXHJcbiAgICAgIGhhc1BpY3R1cmU6ICEhcGljdHVyZSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEzhuqV5IOG6o25oIGNo4bqldCBsxrDhu6NuZyBjYW8gaMahbiB04burIEZhY2Vib29rIG7hur91IGPDs1xyXG4gICAgbGV0IHByb2ZpbGVJbWFnZVVybCA9IFwiXCI7XHJcbiAgICBpZiAocGljdHVyZSAmJiBwaWN0dXJlLmRhdGEgJiYgIXBpY3R1cmUuZGF0YS5pc19zaWxob3VldHRlKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gVGjhu60gbOG6pXkg4bqjbmggbOG7m24gaMahbiB04burIEZhY2Vib29rIEdyYXBoIEFQSVxyXG4gICAgICAgIGNvbnN0IHBpY3R1cmVSZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChcclxuICAgICAgICAgIGBodHRwczovL2dyYXBoLmZhY2Vib29rLmNvbS92MTguMC8ke2lkfS9waWN0dXJlYCxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICAgICAgdHlwZTogXCJsYXJnZVwiLFxyXG4gICAgICAgICAgICAgIHJlZGlyZWN0OiBcImZhbHNlXCIsXHJcbiAgICAgICAgICAgICAgYWNjZXNzX3Rva2VuOiBhY2Nlc3NUb2tlbixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBwaWN0dXJlUmVzcG9uc2UuZGF0YSAmJlxyXG4gICAgICAgICAgcGljdHVyZVJlc3BvbnNlLmRhdGEuZGF0YSAmJlxyXG4gICAgICAgICAgcGljdHVyZVJlc3BvbnNlLmRhdGEuZGF0YS51cmxcclxuICAgICAgICApIHtcclxuICAgICAgICAgIHByb2ZpbGVJbWFnZVVybCA9IHBpY3R1cmVSZXNwb25zZS5kYXRhLmRhdGEudXJsO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgIFwiUmV0cmlldmVkIGxhcmdlciBGYWNlYm9vayBwcm9maWxlIGltYWdlOlwiLFxyXG4gICAgICAgICAgICBwcm9maWxlSW1hZ2VVcmxcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChwaWN0dXJlRXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZmV0Y2hpbmcgbGFyZ2VyIHBpY3R1cmU6XCIsIHBpY3R1cmVFcnJvcik7XHJcbiAgICAgICAgLy8gRmFsbGJhY2sgdG8gb3JpZ2luYWwgcGljdHVyZSBpZiBhdmFpbGFibGVcclxuICAgICAgICBpZiAocGljdHVyZSAmJiBwaWN0dXJlLmRhdGEgJiYgcGljdHVyZS5kYXRhLnVybCkge1xyXG4gICAgICAgICAgcHJvZmlsZUltYWdlVXJsID0gcGljdHVyZS5kYXRhLnVybDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBGYWxsYmFjayB0byBkZWZhdWx0IGF2YXRhciBpZiBubyBGYWNlYm9vayBpbWFnZVxyXG4gICAgaWYgKCFwcm9maWxlSW1hZ2VVcmwpIHtcclxuICAgICAgcHJvZmlsZUltYWdlVXJsID0gXCJodHRwczovL3d3dy5ncmF2YXRhci5jb20vYXZhdGFyLz9kPW1wJnM9MjU2XCI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVMOsbSB1c2VyIHbhu5tpIEZhY2Vib29rSURcclxuICAgIGxldCB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgZmFjZWJvb2tJZDogaWQgfSk7XHJcblxyXG4gICAgLy8gTuG6v3Uga2jDtG5nIHTDrG0gdGjhuqV5IHRoZW8gZmFjZWJvb2tJZCB2w6AgY8OzIGVtYWlsLCB0aOG7rSB0w6xtIHRoZW8gZW1haWxcclxuICAgIGlmICghdXNlciAmJiBlbWFpbCkge1xyXG4gICAgICB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgZW1haWwgfSk7XHJcbiAgICAgIC8vIE7hur91IHTDrG0gdGjhuqV5IHRoZW8gZW1haWwsIGPhuq1wIG5o4bqtdCBmYWNlYm9va0lkXHJcbiAgICAgIGlmICh1c2VyKSB7XHJcbiAgICAgICAgdXNlci5mYWNlYm9va0lkID0gaWQ7XHJcbiAgICAgICAgYXdhaXQgdXNlci5zYXZlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBO4bq/dSB24bqrbiBraMO0bmcgdMOsbSB0aOG6pXkgdXNlciwgdOG6oW8gbeG7m2lcclxuICAgIGlmICghdXNlcikge1xyXG4gICAgICAvLyBU4bqhbyB1c2VybmFtZSBuZ+G6q3Ugbmhpw6puIG7hur91IGtow7RuZyBjw7NcclxuICAgICAgY29uc3QgdW5pcXVlVXNlcm5hbWUgPSBgZmJfJHtpZH1fJHtEYXRlLm5vdygpLnRvU3RyaW5nKCkuc2xpY2UoLTQpfWA7XHJcblxyXG4gICAgICAvLyBU4bqhbyBt4bqtdCBraOG6qXUgbmfhuqt1IG5oacOqblxyXG4gICAgICBjb25zdCByYW5kb21QYXNzd29yZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKC0xMCk7XHJcbiAgICAgIGNvbnN0IGhhc2hlZFBhc3N3b3JkID0gYXdhaXQgYmNyeXB0Lmhhc2gocmFuZG9tUGFzc3dvcmQsIDEwKTtcclxuXHJcbiAgICAgIC8vIFThuqFvIGVtYWlsIGdp4bqjIG7hur91IGtow7RuZyBjw7MgZW1haWwgdOG7qyBGYWNlYm9va1xyXG4gICAgICBjb25zdCB1c2VyRW1haWwgPSBlbWFpbCB8fCBgJHt1bmlxdWVVc2VybmFtZX1AZmFjZWJvb2sudXNlcmA7XHJcblxyXG4gICAgICB1c2VyID0gbmV3IFVzZXIoe1xyXG4gICAgICAgIGVtYWlsOiB1c2VyRW1haWwsXHJcbiAgICAgICAgcGhvbmU6IFwiMDAwMDAwMDAwMFwiLCAvLyBQbGFjZWhvbGRlciBwaG9uZSBudW1iZXJcclxuICAgICAgICBmaXJzdE5hbWU6IGZpcnN0X25hbWUgfHwgXCJGYWNlYm9va1wiLFxyXG4gICAgICAgIGxhc3ROYW1lOiBsYXN0X25hbWUgfHwgXCJVc2VyXCIsXHJcbiAgICAgICAgdXNlck5hbWU6IHVuaXF1ZVVzZXJuYW1lLFxyXG4gICAgICAgIHBhc3N3b3JkOiBoYXNoZWRQYXNzd29yZCxcclxuICAgICAgICB1c2VySW1hZ2U6IHByb2ZpbGVJbWFnZVVybCxcclxuICAgICAgICBmYWNlYm9va0lkOiBpZCxcclxuICAgICAgICBhdXRoUHJvdmlkZXI6IFwiZmFjZWJvb2tcIixcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBhd2FpdCB1c2VyLnNhdmUoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIEPhuq1wIG5o4bqtdCBhdmF0YXIgbuG6v3UgbmfGsOG7nWkgZMO5bmcgxJHDoyB04buTbiB04bqhaVxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgcHJvZmlsZUltYWdlVXJsICYmXHJcbiAgICAgICAgcHJvZmlsZUltYWdlVXJsICE9PSBcImh0dHBzOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvP2Q9bXAmcz0yNTZcIlxyXG4gICAgICApIHtcclxuICAgICAgICB1c2VyLnVzZXJJbWFnZSA9IHByb2ZpbGVJbWFnZVVybDtcclxuICAgICAgICBhd2FpdCB1c2VyLnNhdmUoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEtp4buDbSB0cmEgbuG6v3UgdMOgaSBraG/huqNuIGLhu4sgY2jhurduXHJcbiAgICBpZiAodXNlci5pc0Jsb2NrZWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIlTDoGkga2hv4bqjbiDEkcOjIGLhu4sga2jDs2EuIFZ1aSBsw7JuZyBsacOqbiBo4buHIHF14bqjbiB0cuG7iyB2acOqbi5cIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVOG6oW8gdG9rZW5zXHJcbiAgICBjb25zdCB0b2tlbiA9IGp3dC5zaWduKFxyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6IHVzZXIuX2lkLFxyXG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICAgIHBlcm1pc3Npb25zOiBbXCJYZW1cIl0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHByb2Nlc3MuZW52LkpXVF9TRUNSRVRfQUNDRVNTLFxyXG4gICAgICB7IGV4cGlyZXNJbjogXCIxZFwiIH1cclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgcmVmcmVzaFRva2VuID0gand0LnNpZ24oXHJcbiAgICAgIHsgaWQ6IHVzZXIuX2lkIH0sXHJcbiAgICAgIHByb2Nlc3MuZW52LkpXVF9SRUZSRVNIX1NFQ1JFVCxcclxuICAgICAgeyBleHBpcmVzSW46IFwiN2RcIiB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFjDs2EgcmVmcmVzaCB0b2tlbnMgY8WpIGPhu6dhIHVzZXIgbsOgeSB0csaw4bubYyBraGkgdOG6oW8gbeG7m2lcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IFJlZnJlc2hUb2tlbi5kZWxldGVNYW55KHsgdXNlcklkOiB1c2VyLl9pZCwgdXNlck1vZGVsOiBcIlVzZXJcIiB9KTtcclxuXHJcbiAgICAgIC8vIFNhdSBraGkgeMOzYSB0b2tlbnMgY8WpLCB04bqhbyB0b2tlbiBt4bubaVxyXG4gICAgICBhd2FpdCBSZWZyZXNoVG9rZW4uY3JlYXRlKHtcclxuICAgICAgICB1c2VySWQ6IHVzZXIuX2lkLFxyXG4gICAgICAgIHVzZXJNb2RlbDogXCJVc2VyXCIsXHJcbiAgICAgICAgdG9rZW46IHJlZnJlc2hUb2tlbixcclxuICAgICAgICBleHBpcmVzQXQ6IG5ldyBEYXRlKERhdGUubm93KCkgKyA3ICogMjQgKiA2MCAqIDYwICogMTAwMCksXHJcbiAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAodG9rZW5FcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgbWFuYWdpbmcgcmVmcmVzaCB0b2tlbnM6XCIsIHRva2VuRXJyb3IpO1xyXG4gICAgICAvLyBDb250aW51ZSBldmVuIGlmIHRva2VuIHN0b3JhZ2UgZmFpbHNcclxuICAgIH1cclxuXHJcbiAgICAvLyBD4bqtcCBuaOG6rXQgbGFzdExvZ2luXHJcbiAgICB1c2VyLmxhc3RMb2dpbiA9IG5ldyBEYXRlKCk7XHJcbiAgICBhd2FpdCB1c2VyLnNhdmUoKTtcclxuXHJcbiAgICAvLyBH4butaSByZXNwb25zZVxyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICB0b2tlbixcclxuICAgICAgcmVmcmVzaFRva2VuLFxyXG4gICAgICB1c2VyOiB7XHJcbiAgICAgICAgaWQ6IHVzZXIuX2lkLFxyXG4gICAgICAgIG5hbWU6IGAke3VzZXIuZmlyc3ROYW1lfSAke3VzZXIubGFzdE5hbWV9YCxcclxuICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcclxuICAgICAgICB1c2VySW1hZ2U6IHVzZXIudXNlckltYWdlLFxyXG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICAgIHBlcm1pc3Npb25zOiBbXCJYZW1cIl0sXHJcbiAgICAgIH0sXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDEg25nIG5o4bqtcCBi4bqxbmcgRmFjZWJvb2sgdGjDoG5oIGPDtG5nIVwiLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJGYWNlYm9vayB0b2tlbiBsb2dpbiBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCLEkMSDbmcgbmjhuq1wIGLhurFuZyBGYWNlYm9vayB0aOG6pXQgYuG6oWkuIFZ1aSBsw7JuZyB0aOG7rSBs4bqhaS5cIixcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEVuZHBvaW50IHRvIGdldCB1c2VyIGF2YXRhclxyXG5leHBvcnQgY29uc3QgZ2V0VXNlckF2YXRhciA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB1c2VySWQgPSByZXEucGFyYW1zLmlkO1xyXG4gICAgY29uc29sZS5sb2coXCJGZXRjaGluZyBhdmF0YXIgZm9yIHVzZXIgSUQ6XCIsIHVzZXJJZCk7XHJcblxyXG4gICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuZmluZEJ5SWQodXNlcklkKS5zZWxlY3QoXHJcbiAgICAgIFwidXNlckltYWdlIGZpcnN0TmFtZSBsYXN0TmFtZSBlbWFpbCBhdXRoUHJvdmlkZXIgZmFjZWJvb2tJZFwiXHJcbiAgICApO1xyXG5cclxuICAgIGlmICghdXNlcikge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlVzZXIgbm90IGZvdW5kIGZvciBJRDpcIiwgdXNlcklkKTtcclxuICAgICAgcmV0dXJuIHJlcy5qc29uKHtcclxuICAgICAgICB1c2VySW1hZ2U6IFwiaHR0cHM6Ly93d3cuZ3JhdmF0YXIuY29tL2F2YXRhci8/ZD1tcCZzPTI1NlwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zb2xlLmxvZyhcIlVzZXIgZm91bmQ6XCIsIHVzZXIuZW1haWwsIFwiLSBJbWFnZTpcIiwgdXNlci51c2VySW1hZ2UpO1xyXG5cclxuICAgIC8vIE7hur91IG5nxrDhu51pIGTDuW5nIMSRYW5nIHPhu60gZOG7pW5nIEZhY2Vib29rIHbDoCBraMO0bmcgY8OzIOG6o25oIMSR4bqhaSBkaeG7h25cclxuICAgIGlmIChcclxuICAgICAgdXNlci5hdXRoUHJvdmlkZXIgPT09IFwiZmFjZWJvb2tcIiAmJlxyXG4gICAgICAoIXVzZXIudXNlckltYWdlIHx8XHJcbiAgICAgICAgdXNlci51c2VySW1hZ2UuaW5jbHVkZXMoXCJwbGF0Zm9ybS1sb29rYXNpZGUuZmJzYnguY29tXCIpKVxyXG4gICAgKSB7XHJcbiAgICAgIGlmICh1c2VyLmZhY2Vib29rSWQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgLy8gVOG6oW8gbeG7mXQgYXZhdGFyIHThu5F0IGjGoW4gY2hvIG5nxrDhu51pIGTDuW5nIEZhY2Vib29rXHJcbiAgICAgICAgICBjb25zdCBmYkF2YXRhclVybCA9IGBodHRwczovL2dyYXBoLmZhY2Vib29rLmNvbS8ke3VzZXIuZmFjZWJvb2tJZH0vcGljdHVyZT90eXBlPWxhcmdlYDtcclxuICAgICAgICAgIHJldHVybiByZXMuanNvbih7IHVzZXJJbWFnZTogZmJBdmF0YXJVcmwgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZmJFcnJvcikge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNyZWF0aW5nIEZhY2Vib29rIGF2YXRhciBVUkw6XCIsIGZiRXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICAvLyBGYWxsYmFjayBu4bq/dSBraMO0bmcgbOG6pXkgxJHGsOG7o2Mg4bqjbmggRmFjZWJvb2tcclxuICAgICAgcmV0dXJuIHJlcy5qc29uKHtcclxuICAgICAgICB1c2VySW1hZ2U6IFwiaHR0cHM6Ly93d3cuZ3JhdmF0YXIuY29tL2F2YXRhci8/ZD1tcCZzPTI1NlwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiB1c2VyIGhhcyBhIHVzZXJJbWFnZSB0aGF0IGlzIGEgVVJMLCByZXR1cm4gdGhlIFVSTCBkaXJlY3RseVxyXG4gICAgaWYgKFxyXG4gICAgICB1c2VyLnVzZXJJbWFnZSAmJlxyXG4gICAgICAodXNlci51c2VySW1hZ2Uuc3RhcnRzV2l0aChcImh0dHA6Ly9cIikgfHxcclxuICAgICAgICB1c2VyLnVzZXJJbWFnZS5zdGFydHNXaXRoKFwiaHR0cHM6Ly9cIikpXHJcbiAgICApIHtcclxuICAgICAgY29uc29sZS5sb2coXCJSZXR1cm5pbmcgZXh0ZXJuYWwgYXZhdGFyIFVSTDpcIiwgdXNlci51c2VySW1hZ2UpO1xyXG4gICAgICByZXR1cm4gcmVzLmpzb24oeyB1c2VySW1hZ2U6IHVzZXIudXNlckltYWdlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHVzZXIgaGFzIGEgbG9jYWwgaW1hZ2UgKGUuZy4gdXBsb2FkZWQgZmlsZSBwYXRoKSwgc2VydmUgdGhhdFxyXG4gICAgaWYgKHVzZXIudXNlckltYWdlKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiU2VydmluZyBsb2NhbCBhdmF0YXJcIik7XHJcbiAgICAgIC8vIFlvdSBtaWdodCBuZWVkIHRvIGFkanVzdCB0aGlzIGRlcGVuZGluZyBvbiBob3cgeW91ciBpbWFnZXMgYXJlIHN0b3JlZFxyXG4gICAgICByZXR1cm4gcmVzLnNlbmRGaWxlKHVzZXIudXNlckltYWdlLCB7IHJvb3Q6IHByb2Nlc3MuY3dkKCkgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgbm8gaW1hZ2UgaXMgZm91bmQsIHJldHVybiBhIGRlZmF1bHQgYXZhdGFyXHJcbiAgICBjb25zb2xlLmxvZyhcIk5vIGF2YXRhciBmb3VuZCwgdXNpbmcgZGVmYXVsdFwiKTtcclxuICAgIHJldHVybiByZXMuanNvbih7XHJcbiAgICAgIHVzZXJJbWFnZTogXCJodHRwczovL3d3dy5ncmF2YXRhci5jb20vYXZhdGFyLz9kPW1wJnM9MjU2XCIsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGZldGNoaW5nIHVzZXIgYXZhdGFyOlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLmpzb24oe1xyXG4gICAgICB1c2VySW1hZ2U6IFwiaHR0cHM6Ly93d3cuZ3JhdmF0YXIuY29tL2F2YXRhci8/ZD1tcCZzPTI1NlwiLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gTmV3IGNvbnRyb2xsZXIgZnVuY3Rpb24gdG8gcHJvdmlkZSBWQVBJRCBwdWJsaWMga2V5XHJcbmV4cG9ydCBjb25zdCBnZXRWYXBpZFB1YmxpY0tleSA9IChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB2YXBpZFB1YmxpY0tleSA9IHByb2Nlc3MuZW52LlZBUElEX1BVQkxJQ19LRVk7XHJcblxyXG4gICAgaWYgKCF2YXBpZFB1YmxpY0tleSkge1xyXG4gICAgICByZXR1cm4gcmVzXHJcbiAgICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgICAgLmpzb24oeyBtZXNzYWdlOiBcIlZBUElEIFB1YmxpYyBLZXkgbm90IGNvbmZpZ3VyZWQgb24gc2VydmVyLlwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIExvZyB0byBjb25maXJtIHRoZSBrZXkgaXMgdmFsaWQgKHNob3VsZCBiZSBCYXNlNjQgVVJMLXNhZmUgZW5jb2RlZClcclxuICAgIGNvbnN0IGlzVmFsaWRCYXNlNjQgPSAvXltBLVphLXowLTlcXC1fXSs9KiQvLnRlc3QodmFwaWRQdWJsaWNLZXkpO1xyXG5cclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgdmFwaWRQdWJsaWNLZXk6IHZhcGlkUHVibGljS2V5IH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgbWVzc2FnZTogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIiwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gQ29udHJvbGxlciBmdW5jdGlvbiB0byBzdWJzY3JpYmUgYSB1c2VyIHRvIHB1c2ggbm90aWZpY2F0aW9uc1xyXG5leHBvcnQgY29uc3Qgc3Vic2NyaWJlVG9QdXNoID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgY29uc3Qgc3Vic2NyaXB0aW9uID0gcmVxLmJvZHk7XHJcbiAgY29uc3QgdXNlcklkID0gcmVxLnVzZXIuaWQ7XHJcblxyXG4gIGlmICghc3Vic2NyaXB0aW9uIHx8ICFzdWJzY3JpcHRpb24uZW5kcG9pbnQpIHtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg0MDApXHJcbiAgICAgIC5qc29uKHsgbWVzc2FnZTogXCJQdXNoIHN1YnNjcmlwdGlvbiBvYmplY3QgaXMgcmVxdWlyZWQuXCIgfSk7XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgLy8gU2V0IHRpbWVvdXQgZm9yIE1vbmdvREIgb3BlcmF0aW9uc1xyXG4gICAgY29uc3QgdGltZW91dFByb21pc2UgPSBuZXcgUHJvbWlzZSgoXywgcmVqZWN0KSA9PlxyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IoXCJEYXRhYmFzZSBvcGVyYXRpb24gdGltZWQgb3V0XCIpKSwgNTAwMClcclxuICAgICk7XHJcblxyXG4gICAgLy8gRmluZCB1c2VyIHdpdGggdGltZW91dFxyXG4gICAgY29uc3QgdXNlclByb21pc2UgPSBVc2VyLmZpbmRCeUlkKHVzZXJJZCk7XHJcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgUHJvbWlzZS5yYWNlKFt1c2VyUHJvbWlzZSwgdGltZW91dFByb21pc2VdKTtcclxuXHJcbiAgICBpZiAoIXVzZXIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgW3N1YnNjcmliZVRvUHVzaF0gVXNlciBub3QgZm91bmQ6ICR7dXNlcklkfWApO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIlVzZXIgbm90IGZvdW5kLlwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEluaXRpYWxpemUgcHVzaFN1YnNjcmlwdGlvbnMgYXJyYXkgaWYgbm90IGV4aXN0c1xyXG4gICAgaWYgKCF1c2VyLnB1c2hTdWJzY3JpcHRpb25zKSB7XHJcbiAgICAgIHVzZXIucHVzaFN1YnNjcmlwdGlvbnMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayBmb3IgZXhpc3Rpbmcgc3Vic2NyaXB0aW9uXHJcbiAgICBjb25zdCBleGlzdGluZ1N1YnNjcmlwdGlvbiA9IHVzZXIucHVzaFN1YnNjcmlwdGlvbnMuZmluZChcclxuICAgICAgKHN1YikgPT4gc3ViLmVuZHBvaW50ID09PSBzdWJzY3JpcHRpb24uZW5kcG9pbnRcclxuICAgICk7XHJcblxyXG4gICAgaWYgKGV4aXN0aW5nU3Vic2NyaXB0aW9uKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgIGBbc3Vic2NyaWJlVG9QdXNoXSBTdWJzY3JpcHRpb24gYWxyZWFkeSBleGlzdHMgZm9yIHVzZXI6ICR7dXNlcklkfWBcclxuICAgICAgKTtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICBtZXNzYWdlOiBcIlN1YnNjcmlwdGlvbiBhbHJlYWR5IGV4aXN0cy5cIixcclxuICAgICAgICBzdWJzY3JpcHRpb25Db3VudDogdXNlci5wdXNoU3Vic2NyaXB0aW9ucy5sZW5ndGgsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFZhbGlkYXRlIHN1YnNjcmlwdGlvblxyXG4gICAgaWYgKFxyXG4gICAgICAhc3Vic2NyaXB0aW9uLmtleXMgfHxcclxuICAgICAgIXN1YnNjcmlwdGlvbi5rZXlzLnAyNTZkaCB8fFxyXG4gICAgICAhc3Vic2NyaXB0aW9uLmtleXMuYXV0aFxyXG4gICAgKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgYFtzdWJzY3JpYmVUb1B1c2hdIEludmFsaWQgc3Vic2NyaXB0aW9uIG9iamVjdCwgbWlzc2luZyByZXF1aXJlZCBrZXlzYFxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm4gcmVzXHJcbiAgICAgICAgLnN0YXR1cyg0MDApXHJcbiAgICAgICAgLmpzb24oe1xyXG4gICAgICAgICAgbWVzc2FnZTogXCJJbnZhbGlkIHN1YnNjcmlwdGlvbiBvYmplY3QuIE1pc3NpbmcgcmVxdWlyZWQga2V5cy5cIixcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgbmV3IHN1YnNjcmlwdGlvblxyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgIGBbc3Vic2NyaWJlVG9QdXNoXSBBZGRpbmcgbmV3IHN1YnNjcmlwdGlvbiBmb3IgdXNlcjogJHt1c2VySWR9YFxyXG4gICAgKTtcclxuICAgIHVzZXIucHVzaFN1YnNjcmlwdGlvbnMucHVzaChzdWJzY3JpcHRpb24pO1xyXG5cclxuICAgIC8vIFNhdmUgd2l0aCB0aW1lb3V0XHJcbiAgICBjb25zdCBzYXZlUHJvbWlzZSA9IHVzZXIuc2F2ZSgpO1xyXG4gICAgYXdhaXQgUHJvbWlzZS5yYWNlKFtzYXZlUHJvbWlzZSwgdGltZW91dFByb21pc2VdKTtcclxuXHJcbiAgICAvLyBTZW5kIHJlc3BvbnNlIGltbWVkaWF0ZWx5IGFmdGVyIHNhdmluZ1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oe1xyXG4gICAgICBtZXNzYWdlOiBcIlB1c2ggc3Vic2NyaXB0aW9uIHNhdmVkIHN1Y2Nlc3NmdWxseS5cIixcclxuICAgICAgc3Vic2NyaXB0aW9uQ291bnQ6IHVzZXIucHVzaFN1YnNjcmlwdGlvbnMubGVuZ3RoLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2VuZCB0ZXN0IG5vdGlmaWNhdGlvbiBhc3luY2hyb25vdXNseSBhZnRlciByZXNwb25zZVxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgdGVzdFBheWxvYWQgPSB7XHJcbiAgICAgICAgbm90aWZpY2F0aW9uOiB7XHJcbiAgICAgICAgICB0aXRsZTogXCLEkMSDbmcga8O9IHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgICAgICAgYm9keTogXCJC4bqhbiDEkcOjIMSRxINuZyBrw70gbmjhuq1uIHRow7RuZyBiw6FvIHRow6BuaCBjw7RuZyFcIixcclxuICAgICAgICAgIGljb246IFwiL0xvZ28ucG5nXCIsXHJcbiAgICAgICAgICB2aWJyYXRlOiBbMTAwLCA1MCwgMTAwXSxcclxuICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgdXJsOiBcIi9cIixcclxuICAgICAgICAgICAgZGF0ZU9mQXJyaXZhbDogRGF0ZS5ub3coKSxcclxuICAgICAgICAgICAgcHJpbWFyeUtleTogMSxcclxuICAgICAgICAgICAgdHlwZTogXCJ0ZXN0X25vdGlmaWNhdGlvblwiLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gQWRkIHJldHJ5IGxvZ2ljIGZvciBzZW5kaW5nIG5vdGlmaWNhdGlvblxyXG4gICAgICBsZXQgcmV0cmllcyA9IDM7XHJcbiAgICAgIHdoaWxlIChyZXRyaWVzID4gMCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBhd2FpdCB3ZWJwdXNoLnNlbmROb3RpZmljYXRpb24oXHJcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbixcclxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkodGVzdFBheWxvYWQpXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coYFtzdWJzY3JpYmVUb1B1c2hdIFRlc3Qgbm90aWZpY2F0aW9uIHNlbnQgc3VjY2Vzc2Z1bGx5YCk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgcmV0cmllcy0tO1xyXG4gICAgICAgICAgaWYgKHJldHJpZXMgPT09IDApIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICBgW3N1YnNjcmliZVRvUHVzaF0gRmFpbGVkIHRvIHNlbmQgdGVzdCBub3RpZmljYXRpb24gYWZ0ZXIgMyBhdHRlbXB0czpgLFxyXG4gICAgICAgICAgICAgIGVycm9yXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3N1YnNjcmliZVRvUHVzaF0gUmV0cnlpbmcgdGVzdCBub3RpZmljYXRpb24uLi5gKTtcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwMCkpOyAvLyBXYWl0IDFzIGJlZm9yZSByZXRyeVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAobm90aWZpY2F0aW9uRXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICBgW3N1YnNjcmliZVRvUHVzaF0gRXJyb3IgaW4gdGVzdCBub3RpZmljYXRpb24gcHJvY2VzczpgLFxyXG4gICAgICAgIG5vdGlmaWNhdGlvbkVycm9yXHJcbiAgICAgICk7XHJcbiAgICAgIC8vIERvbid0IHRocm93IGVycm9yIHNpbmNlIHdlIGFscmVhZHkgc2VudCBzdWNjZXNzIHJlc3BvbnNlXHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoYFtzdWJzY3JpYmVUb1B1c2hdIEVycm9yIHNhdmluZyBwdXNoIHN1YnNjcmlwdGlvbjpgLCBlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIG1lc3NhZ2U6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yIHdoaWxlIHNhdmluZyBzdWJzY3JpcHRpb25cIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBWYWxpZGF0ZSBQdXNoIFN1YnNjcmlwdGlvblxyXG5leHBvcnQgY29uc3QgdmFsaWRhdGVTdWJzY3JpcHRpb24gPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBzdWJzY3JpcHRpb24gfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmICghc3Vic2NyaXB0aW9uKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJTdWJzY3JpcHRpb24gZGF0YSBpcyByZXF1aXJlZFwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB3ZWJwdXNoID0gcmVxdWlyZShcIndlYi1wdXNoXCIpO1xyXG5cclxuICAgIC8vIENvbmZpZ3VyZSB3ZWItcHVzaCB3aXRoIFZBUElEIGtleXNcclxuICAgIHdlYnB1c2guc2V0VmFwaWREZXRhaWxzKFxyXG4gICAgICBcIm1haWx0bzpkYW5pbmMuc3lzdGVtQGdtYWlsLmNvbVwiLFxyXG4gICAgICBwcm9jZXNzLmVudi5WQVBJRF9QVUJMSUNfS0VZLFxyXG4gICAgICBwcm9jZXNzLmVudi5WQVBJRF9QUklWQVRFX0tFWVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBTZW5kIGEgc21hbGwgdGVzdCBub3RpZmljYXRpb24gcGF5bG9hZFxyXG4gICAgY29uc3QgdGVzdFBheWxvYWQgPSBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgIHRpdGxlOiBcIlZhbGlkYXRpb24gVGVzdFwiLFxyXG4gICAgICBib2R5OiBcIlRoaXMgaXMgYSB0ZXN0IHRvIHZhbGlkYXRlIHlvdXIgc3Vic2NyaXB0aW9uXCIsXHJcbiAgICAgIHNpbGVudDogdHJ1ZSxcclxuICAgIH0pO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIFRyeSB0byBzZW5kIGEgbm90aWZpY2F0aW9uIHRvIGNoZWNrIGlmIHRoZSBzdWJzY3JpcHRpb24gaXMgdmFsaWRcclxuICAgICAgYXdhaXQgd2VicHVzaC5zZW5kTm90aWZpY2F0aW9uKHN1YnNjcmlwdGlvbiwgdGVzdFBheWxvYWQpO1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgdmFsaWQ6IHRydWUsXHJcbiAgICAgICAgbWVzc2FnZTogXCJTdWJzY3JpcHRpb24gaXMgdmFsaWRcIixcclxuICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlZhbGlkYXRpb24gZXJyb3I6XCIsIGVycm9yKTtcclxuXHJcbiAgICAgIC8vIENoZWNrIGZvciBzcGVjaWZpYyBlcnJvciBzdGF0dXMgY29kZXNcclxuICAgICAgaWYgKGVycm9yLnN0YXR1c0NvZGUgPT09IDQwNCB8fCBlcnJvci5zdGF0dXNDb2RlID09PSA0MTApIHtcclxuICAgICAgICAvLyA0MDQ6IE5vdCBGb3VuZCwgNDEwOiBHb25lIC0gU3Vic2NyaXB0aW9uIGhhcyBleHBpcmVkIG9yIGlzIGludmFsaWRcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgIHZhbGlkOiBmYWxzZSxcclxuICAgICAgICAgIG1lc3NhZ2U6IFwiU3Vic2NyaXB0aW9uIGhhcyBleHBpcmVkIG9yIGlzIGludmFsaWRcIixcclxuICAgICAgICAgIGVycm9yOiBlcnJvci5ib2R5IHx8IGVycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSBpZiAoZXJyb3Iuc3RhdHVzQ29kZSA9PT0gNDAwKSB7XHJcbiAgICAgICAgLy8gQmFkIHJlcXVlc3QgLSBJbnZhbGlkIHN1YnNjcmlwdGlvblxyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgdmFsaWQ6IGZhbHNlLFxyXG4gICAgICAgICAgbWVzc2FnZTogXCJJbnZhbGlkIHN1YnNjcmlwdGlvbiBmb3JtYXRcIixcclxuICAgICAgICAgIGVycm9yOiBlcnJvci5ib2R5IHx8IGVycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gT3RoZXIgZXJyb3JzXHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICB2YWxpZDogZmFsc2UsXHJcbiAgICAgICAgICBtZXNzYWdlOiBcIkVycm9yIHZhbGlkYXRpbmcgc3Vic2NyaXB0aW9uXCIsXHJcbiAgICAgICAgICBlcnJvcjogZXJyb3IuYm9keSB8fCBlcnJvci5tZXNzYWdlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJWYWxpZGF0ZSBzdWJzY3JpcHRpb24gZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIlNlcnZlciBlcnJvciB3aGlsZSB2YWxpZGF0aW5nIHN1YnNjcmlwdGlvblwiLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gVOG6oW8vY+G6rXAgbmjhuq10IMSR4buLYSBjaOG7iSBt4bq3YyDEkeG7i25oIMSRxqFuIGzhursgdOG7qyBt4bqjbmcgxJHhu4thIGNo4buJIGNobyB0w61uaCB0xrDGoW5nIHRow61jaCBuZ8aw4bujY1xyXG5jb25zdCB1cGRhdGVEZWZhdWx0QWRkcmVzc0ZvckJhY2t3YXJkQ29tcGF0aWJpbGl0eSA9IGFzeW5jICh1c2VySWQpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgIGBbdXBkYXRlRGVmYXVsdEFkZHJlc3NGb3JCYWNrd2FyZENvbXBhdGliaWxpdHldIFVwZGF0aW5nIGxlZ2FjeSBhZGRyZXNzIGZvciB1c2VyICR7dXNlcklkfWBcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuZmluZEJ5SWQodXNlcklkKTtcclxuICAgIGlmICghdXNlcikge1xyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICBgW3VwZGF0ZURlZmF1bHRBZGRyZXNzRm9yQmFja3dhcmRDb21wYXRpYmlsaXR5XSBVc2VyIG5vdCBmb3VuZDogJHt1c2VySWR9YFxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVMOsbSDEkeG7i2EgY2jhu4kgbeG6t2MgxJHhu4tuaCB0cm9uZyBt4bqjbmdcclxuICAgIGNvbnN0IGRlZmF1bHRBZGRyZXNzID0gdXNlci5hZGRyZXNzZXMuZmluZChcclxuICAgICAgKGFkZHIpID0+IGFkZHIuaXNEZWZhdWx0ID09PSB0cnVlXHJcbiAgICApO1xyXG5cclxuICAgIGlmIChkZWZhdWx0QWRkcmVzcykge1xyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICBgW3VwZGF0ZURlZmF1bHRBZGRyZXNzRm9yQmFja3dhcmRDb21wYXRpYmlsaXR5XSBGb3VuZCBkZWZhdWx0IGFkZHJlc3M6ICR7ZGVmYXVsdEFkZHJlc3MuZnVsbEFkZHJlc3N9YFxyXG4gICAgICApO1xyXG5cclxuICAgICAgLy8gQ+G6rXAgbmjhuq10IHRyxrDhu51uZyBhZGRyZXNzIGxlZ2FjeSAtIMSR4bqjbSBi4bqjbyBraMO0bmcgcGjhuqNpIHVuZGVmaW5lZFxyXG4gICAgICB1c2VyLmFkZHJlc3MgPSBkZWZhdWx0QWRkcmVzcy5mdWxsQWRkcmVzcyB8fCBcIlwiO1xyXG5cclxuICAgICAgLy8gQ+G6rXAgbmjhuq10IGPDoWMgdHLGsOG7nW5nIHJpw6puZyBs4bq7IGNobyDEkeG7i2EgY2jhu4kgKG7hur91IGPDsylcclxuICAgICAgdXNlci5ob3VzZU51bWJlciA9IGRlZmF1bHRBZGRyZXNzLmhvdXNlTnVtYmVyIHx8IFwiXCI7XHJcbiAgICAgIHVzZXIud2FyZCA9IGRlZmF1bHRBZGRyZXNzLndhcmQgfHwgXCJcIjtcclxuICAgICAgdXNlci5kaXN0cmljdCA9IGRlZmF1bHRBZGRyZXNzLmRpc3RyaWN0IHx8IFwiXCI7XHJcbiAgICAgIHVzZXIucHJvdmluY2UgPSBkZWZhdWx0QWRkcmVzcy5wcm92aW5jZSB8fCBcIlwiO1xyXG5cclxuICAgICAgLy8gU2FvIGNow6lwIHThu41hIMSR4buZIG7hur91IGPDs1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgZGVmYXVsdEFkZHJlc3MuY29vcmRpbmF0ZXMgJiZcclxuICAgICAgICBkZWZhdWx0QWRkcmVzcy5jb29yZGluYXRlcy5sYXQgJiZcclxuICAgICAgICBkZWZhdWx0QWRkcmVzcy5jb29yZGluYXRlcy5sbmdcclxuICAgICAgKSB7XHJcbiAgICAgICAgdXNlci5jb29yZGluYXRlcyA9IHtcclxuICAgICAgICAgIGxhdDogZGVmYXVsdEFkZHJlc3MuY29vcmRpbmF0ZXMubGF0LFxyXG4gICAgICAgICAgbG5nOiBkZWZhdWx0QWRkcmVzcy5jb29yZGluYXRlcy5sbmcsXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gxJDhuqNtIGLhuqNvIGZ1bGxBZGRyZXNzIMSRxrDhu6NjIGPhuq1wIG5o4bqtdFxyXG4gICAgICB1c2VyLmZ1bGxBZGRyZXNzID0gZGVmYXVsdEFkZHJlc3MuZnVsbEFkZHJlc3MgfHwgXCJcIjtcclxuXHJcbiAgICAgIC8vIMSQw6FuaCBk4bqldSBsw6AgxJHDoyBz4butYSDEkeG7lWkgxJHhu4MgxJHhuqNtIGLhuqNvIG1vbmdvb3NlIGPhuq1wIG5o4bqtdFxyXG4gICAgICB1c2VyLm1hcmtNb2RpZmllZChcImFkZHJlc3NcIik7XHJcbiAgICAgIHVzZXIubWFya01vZGlmaWVkKFwiY29vcmRpbmF0ZXNcIik7XHJcblxyXG4gICAgICBhd2FpdCB1c2VyLnNhdmUoKTtcclxuICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgYFt1cGRhdGVEZWZhdWx0QWRkcmVzc0ZvckJhY2t3YXJkQ29tcGF0aWJpbGl0eV0gVXBkYXRlZCBsZWdhY3kgYWRkcmVzcyBmaWVsZHMgZm9yIHVzZXIgJHt1c2VySWR9YFxyXG4gICAgICApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgYFt1cGRhdGVEZWZhdWx0QWRkcmVzc0ZvckJhY2t3YXJkQ29tcGF0aWJpbGl0eV0gTm8gZGVmYXVsdCBhZGRyZXNzIGZvdW5kIGZvciB1c2VyICR7dXNlcklkfWBcclxuICAgICAgKTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcclxuICAgICAgYFt1cGRhdGVEZWZhdWx0QWRkcmVzc0ZvckJhY2t3YXJkQ29tcGF0aWJpbGl0eV0gRXJyb3IgdXBkYXRpbmcgbGVnYWN5IGFkZHJlc3M6YCxcclxuICAgICAgZXJyb3JcclxuICAgICk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gVGjDqm0gxJHhu4thIGNo4buJIG3hu5tpXHJcbmV4cG9ydCBjb25zdCBhZGRVc2VyQWRkcmVzcyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IHVzZXJJZCB9ID0gcmVxLnBhcmFtcztcclxuICAgIGNvbnN0IGFkZHJlc3NEYXRhID0gcmVxLmJvZHk7XHJcblxyXG4gICAgaWYgKCFhZGRyZXNzRGF0YS5mdWxsQWRkcmVzcykge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiVnVpIGzDsm5nIGN1bmcgY+G6pXAgxJHhu4thIGNo4buJIMSR4bqneSDEkeG7p1wiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kQnlJZCh1c2VySWQpO1xyXG4gICAgaWYgKCF1c2VyKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgbmfGsOG7nWkgZMO5bmdcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTuG6v3UgxJHDonkgbMOgIMSR4buLYSBjaOG7iSDEkeG6p3UgdGnDqm4sIMSR4bq3dCBuw7MgbMOgbSBt4bq3YyDEkeG7i25oXHJcbiAgICBpZiAoIXVzZXIuYWRkcmVzc2VzIHx8IHVzZXIuYWRkcmVzc2VzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBhZGRyZXNzRGF0YS5pc0RlZmF1bHQgPSB0cnVlO1xyXG4gICAgfSBlbHNlIGlmIChhZGRyZXNzRGF0YS5pc0RlZmF1bHQpIHtcclxuICAgICAgLy8gTuG6v3UgxJHhu4thIGNo4buJIG3hu5tpIGzDoCBt4bq3YyDEkeG7i25oLCBj4bqtcCBuaOG6rXQgdOG6pXQgY+G6oyBjw6FjIMSR4buLYSBjaOG7iSBraMOhYyB0aMOgbmgga2jDtG5nIG3hurdjIMSR4buLbmhcclxuICAgICAgdXNlci5hZGRyZXNzZXMuZm9yRWFjaCgoYWRkcikgPT4ge1xyXG4gICAgICAgIGFkZHIuaXNEZWZhdWx0ID0gZmFsc2U7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE7hur91IGtow7RuZyBjw7MgdGjDtG5nIHRpbiBuZ8aw4budaSBuaOG6rW4sIHPhu60gZOG7pW5nIHRow7RuZyB0aW4gbmfGsOG7nWkgZMO5bmdcclxuICAgIGlmICghYWRkcmVzc0RhdGEucmVjZWl2ZXJOYW1lKSB7XHJcbiAgICAgIGFkZHJlc3NEYXRhLnJlY2VpdmVyTmFtZSA9IGAke3VzZXIuZmlyc3ROYW1lfSAke3VzZXIubGFzdE5hbWV9YDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWFkZHJlc3NEYXRhLnJlY2VpdmVyUGhvbmUpIHtcclxuICAgICAgYWRkcmVzc0RhdGEucmVjZWl2ZXJQaG9uZSA9IHVzZXIucGhvbmU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVGjDqm0gxJHhu4thIGNo4buJIG3hu5tpIHbDoG8gbeG6o25nXHJcbiAgICB1c2VyLmFkZHJlc3Nlcy5wdXNoKGFkZHJlc3NEYXRhKTtcclxuXHJcbiAgICAvLyBO4bq/dSDEkcOieSBsw6AgxJHhu4thIGNo4buJIG3hurdjIMSR4buLbmgsIGPhuq1wIG5o4bqtdCB0csaw4budbmcgYWRkcmVzcyBjxalcclxuICAgIGlmIChhZGRyZXNzRGF0YS5pc0RlZmF1bHQgfHwgdXNlci5hZGRyZXNzZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgIGF3YWl0IHVwZGF0ZURlZmF1bHRBZGRyZXNzRm9yQmFja3dhcmRDb21wYXRpYmlsaXR5KHVzZXJJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTMawdSBuZ8aw4budaSBkw7luZyDEkcOjIGPhuq1wIG5o4bqtdFxyXG4gICAgYXdhaXQgdXNlci5zYXZlKCk7XHJcblxyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIlRow6ptIMSR4buLYSBjaOG7iSB0aMOgbmggY8O0bmdcIixcclxuICAgICAgYWRkcmVzc2VzOiB1c2VyLmFkZHJlc3NlcyxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIHRow6ptIMSR4buLYSBjaOG7iTpcIiwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSB0aMOqbSDEkeG7i2EgY2jhu4lcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBM4bqleSB04bqldCBj4bqjIMSR4buLYSBjaOG7iSBj4bunYSBuZ8aw4budaSBkw7luZ1xyXG5leHBvcnQgY29uc3QgZ2V0VXNlckFkZHJlc3NlcyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IHVzZXJJZCB9ID0gcmVxLnBhcmFtcztcclxuXHJcbiAgICBsZXQgdXNlciA9IGF3YWl0IFVzZXIuZmluZEJ5SWQodXNlcklkKTtcclxuICAgIGlmICghdXNlcikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IG5nxrDhu51pIGTDuW5nXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1pZ3JhdGUgbGVnYWN5IGFkZHJlc3MgaWYgbmVlZGVkXHJcbiAgICB1c2VyID0gYXdhaXQgbWlncmF0ZUxlZ2FjeUFkZHJlc3ModXNlcik7XHJcblxyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBhZGRyZXNzZXM6IHVzZXIuYWRkcmVzc2VzIHx8IFtdLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgbOG6pXkgZGFuaCBzw6FjaCDEkeG7i2EgY2jhu4k6XCIsIGVycm9yKTtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgbOG6pXkgZGFuaCBzw6FjaCDEkeG7i2EgY2jhu4lcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBD4bqtcCBuaOG6rXQgxJHhu4thIGNo4buJXHJcbmV4cG9ydCBjb25zdCB1cGRhdGVVc2VyQWRkcmVzcyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IHVzZXJJZCwgYWRkcmVzc0lkIH0gPSByZXEucGFyYW1zO1xyXG4gICAgY29uc3QgdXBkYXRlZERhdGEgPSByZXEuYm9keTtcclxuXHJcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kQnlJZCh1c2VySWQpO1xyXG4gICAgaWYgKCF1c2VyKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgbmfGsOG7nWkgZMO5bmdcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVMOsbSDEkeG7i2EgY2jhu4kgY+G6p24gY+G6rXAgbmjhuq10XHJcbiAgICBjb25zdCBhZGRyZXNzSW5kZXggPSB1c2VyLmFkZHJlc3Nlcy5maW5kSW5kZXgoXHJcbiAgICAgIChhZGRyKSA9PiBhZGRyLl9pZC50b1N0cmluZygpID09PSBhZGRyZXNzSWRcclxuICAgICk7XHJcblxyXG4gICAgaWYgKGFkZHJlc3NJbmRleCA9PT0gLTEpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSDEkeG7i2EgY2jhu4lcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gS2nhu4NtIHRyYSBu4bq/dSDEkeG7i2EgY2jhu4kgxJHGsOG7o2MgY+G6rXAgbmjhuq10IHRy4bufIHRow6BuaCBt4bq3YyDEkeG7i25oXHJcbiAgICBpZiAodXBkYXRlZERhdGEuaXNEZWZhdWx0KSB7XHJcbiAgICAgIC8vIEPhuq1wIG5o4bqtdCB04bqldCBj4bqjIGPDoWMgxJHhu4thIGNo4buJIGtow6FjIHRow6BuaCBraMO0bmcgbeG6t2MgxJHhu4tuaFxyXG4gICAgICB1c2VyLmFkZHJlc3Nlcy5mb3JFYWNoKChhZGRyKSA9PiB7XHJcbiAgICAgICAgYWRkci5pc0RlZmF1bHQgPSBmYWxzZTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ+G6rXAgbmjhuq10IMSR4buLYSBjaOG7iVxyXG4gICAgT2JqZWN0LmtleXModXBkYXRlZERhdGEpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICB1c2VyLmFkZHJlc3Nlc1thZGRyZXNzSW5kZXhdW2tleV0gPSB1cGRhdGVkRGF0YVtrZXldO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTuG6v3UgxJHDonkgbMOgIMSR4buLYSBjaOG7iSBt4bq3YyDEkeG7i25oLCBj4bqtcCBuaOG6rXQgdHLGsOG7nW5nIGFkZHJlc3MgY8WpXHJcbiAgICBpZiAodXBkYXRlZERhdGEuaXNEZWZhdWx0KSB7XHJcbiAgICAgIGF3YWl0IHVwZGF0ZURlZmF1bHRBZGRyZXNzRm9yQmFja3dhcmRDb21wYXRpYmlsaXR5KHVzZXJJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTMawdSB0aGF5IMSR4buVaVxyXG4gICAgYXdhaXQgdXNlci5zYXZlKCk7XHJcblxyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIkPhuq1wIG5o4bqtdCDEkeG7i2EgY2jhu4kgdGjDoG5oIGPDtG5nXCIsXHJcbiAgICAgIGFkZHJlc3NlczogdXNlci5hZGRyZXNzZXMsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgxJHhu4thIGNo4buJOlwiLCBlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIGPhuq1wIG5o4bqtdCDEkeG7i2EgY2jhu4lcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBYw7NhIMSR4buLYSBjaOG7iVxyXG5leHBvcnQgY29uc3QgZGVsZXRlVXNlckFkZHJlc3MgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyB1c2VySWQsIGFkZHJlc3NJZCB9ID0gcmVxLnBhcmFtcztcclxuXHJcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kQnlJZCh1c2VySWQpO1xyXG4gICAgaWYgKCF1c2VyKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgbmfGsOG7nWkgZMO5bmdcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVMOsbSDEkeG7i2EgY2jhu4kgY+G6p24geMOzYVxyXG4gICAgY29uc3QgYWRkcmVzc0luZGV4ID0gdXNlci5hZGRyZXNzZXMuZmluZEluZGV4KFxyXG4gICAgICAoYWRkcikgPT4gYWRkci5faWQudG9TdHJpbmcoKSA9PT0gYWRkcmVzc0lkXHJcbiAgICApO1xyXG5cclxuICAgIGlmIChhZGRyZXNzSW5kZXggPT09IC0xKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHhu4thIGNo4buJXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEtp4buDbSB0cmEgbuG6v3UgxJHhu4thIGNo4buJIGLhu4sgeMOzYSBsw6AgbeG6t2MgxJHhu4tuaFxyXG4gICAgY29uc3QgaXNEZWZhdWx0ID0gdXNlci5hZGRyZXNzZXNbYWRkcmVzc0luZGV4XS5pc0RlZmF1bHQ7XHJcblxyXG4gICAgLy8gWMOzYSDEkeG7i2EgY2jhu4kga2jhu49pIG3huqNuZ1xyXG4gICAgdXNlci5hZGRyZXNzZXMuc3BsaWNlKGFkZHJlc3NJbmRleCwgMSk7XHJcblxyXG4gICAgLy8gTuG6v3UgxJHhu4thIGNo4buJIGLhu4sgeMOzYSBsw6AgbeG6t2MgxJHhu4tuaCB2w6AgduG6q24gY8OybiDEkeG7i2EgY2jhu4kga2jDoWMsIMSR4bq3dCDEkeG7i2EgY2jhu4kgxJHhuqd1IHRpw6puIGPDsm4gbOG6oWkgbMOgbSBt4bq3YyDEkeG7i25oXHJcbiAgICBpZiAoaXNEZWZhdWx0ICYmIHVzZXIuYWRkcmVzc2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgdXNlci5hZGRyZXNzZXNbMF0uaXNEZWZhdWx0ID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBO4bq/dSDEkcOjIHRoYXkgxJHhu5VpIMSR4buLYSBjaOG7iSBt4bq3YyDEkeG7i25oLCBj4bqtcCBuaOG6rXQgdHLGsOG7nW5nIGFkZHJlc3MgY8WpXHJcbiAgICBpZiAoaXNEZWZhdWx0ICYmIHVzZXIuYWRkcmVzc2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgYXdhaXQgdXBkYXRlRGVmYXVsdEFkZHJlc3NGb3JCYWNrd2FyZENvbXBhdGliaWxpdHkodXNlcklkKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBMxrB1IHRoYXkgxJHhu5VpXHJcbiAgICBhd2FpdCB1c2VyLnNhdmUoKTtcclxuXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwiWMOzYSDEkeG7i2EgY2jhu4kgdGjDoG5oIGPDtG5nXCIsXHJcbiAgICAgIGFkZHJlc3NlczogdXNlci5hZGRyZXNzZXMsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB4w7NhIMSR4buLYSBjaOG7iTpcIiwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSB4w7NhIMSR4buLYSBjaOG7iVwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIMSQ4bq3dCDEkeG7i2EgY2jhu4kgbeG6t2MgxJHhu4tuaFxyXG5leHBvcnQgY29uc3Qgc2V0RGVmYXVsdEFkZHJlc3MgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyB1c2VySWQsIGFkZHJlc3NJZCB9ID0gcmVxLnBhcmFtcztcclxuXHJcbiAgICBjb25zb2xlLmxvZyhcclxuICAgICAgYFtzZXREZWZhdWx0QWRkcmVzc10gU2V0dGluZyBhZGRyZXNzICR7YWRkcmVzc0lkfSBhcyBkZWZhdWx0IGZvciB1c2VyICR7dXNlcklkfWBcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuZmluZEJ5SWQodXNlcklkKTtcclxuICAgIGlmICghdXNlcikge1xyXG4gICAgICBjb25zb2xlLmxvZyhgW3NldERlZmF1bHRBZGRyZXNzXSBVc2VyIG5vdCBmb3VuZDogJHt1c2VySWR9YCk7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgbmfGsOG7nWkgZMO5bmdcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gxJHhu4thIGNo4buJIGPDsyB04buTbiB04bqhaSBraMO0bmdcclxuICAgIGNvbnN0IGFkZHJlc3NFeGlzdHMgPSB1c2VyLmFkZHJlc3Nlcy5zb21lKFxyXG4gICAgICAoYWRkcikgPT4gYWRkci5faWQudG9TdHJpbmcoKSA9PT0gYWRkcmVzc0lkXHJcbiAgICApO1xyXG4gICAgaWYgKCFhZGRyZXNzRXhpc3RzKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBbc2V0RGVmYXVsdEFkZHJlc3NdIEFkZHJlc3Mgbm90IGZvdW5kOiAke2FkZHJlc3NJZH1gKTtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSDEkeG7i2EgY2jhu4lcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gxJDhurd0IHThuqV0IGPhuqMgxJHhu4thIGNo4buJIHRow6BuaCBraMO0bmcgbeG6t2MgxJHhu4tuaCwgc2F1IMSRw7MgxJHhurd0IMSR4buLYSBjaOG7iSDEkcaw4bujYyBjaOG7jW4gdGjDoG5oIG3hurdjIMSR4buLbmhcclxuICAgIHVzZXIuYWRkcmVzc2VzLmZvckVhY2goKGFkZHIpID0+IHtcclxuICAgICAgY29uc3QgaXNTZWxlY3RlZCA9IGFkZHIuX2lkLnRvU3RyaW5nKCkgPT09IGFkZHJlc3NJZDtcclxuICAgICAgYWRkci5pc0RlZmF1bHQgPSBpc1NlbGVjdGVkO1xyXG5cclxuICAgICAgaWYgKGlzU2VsZWN0ZWQpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgIGBbc2V0RGVmYXVsdEFkZHJlc3NdIFNldHRpbmcgYWRkcmVzcyBhcyBkZWZhdWx0OiAke2FkZHIuZnVsbEFkZHJlc3N9YFxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIMSQw6FuaCBk4bqldSBt4bqjbmcgYWRkcmVzc2VzIMSRw6MgxJHGsOG7o2Mgc+G7rWEgxJHhu5VpIMSR4buDIMSR4bqjbSBi4bqjbyBtb25nb29zZSBj4bqtcCBuaOG6rXRcclxuICAgIHVzZXIubWFya01vZGlmaWVkKFwiYWRkcmVzc2VzXCIpO1xyXG5cclxuICAgIC8vIEzGsHUgdGhheSDEkeG7lWkgdHLGsOG7m2Mga2hpIGPhuq1wIG5o4bqtdCB0xrDGoW5nIHRow61jaCBuZ8aw4bujY1xyXG4gICAgYXdhaXQgdXNlci5zYXZlKCk7XHJcblxyXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRyxrDhu51uZyBhZGRyZXNzIGPFqVxyXG4gICAgYXdhaXQgdXBkYXRlRGVmYXVsdEFkZHJlc3NGb3JCYWNrd2FyZENvbXBhdGliaWxpdHkodXNlcklkKTtcclxuXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDhurd0IMSR4buLYSBjaOG7iSBt4bq3YyDEkeG7i25oIHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgICBhZGRyZXNzZXM6IHVzZXIuYWRkcmVzc2VzLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoYFtzZXREZWZhdWx0QWRkcmVzc10gRXJyb3Igc2V0dGluZyBkZWZhdWx0IGFkZHJlc3M6YCwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSDEkeG6t3QgxJHhu4thIGNo4buJIG3hurdjIMSR4buLbmhcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBBZG1pbiBlbmRwb2ludCB0byBtaWdyYXRlIGFsbCBsZWdhY3kgYWRkcmVzc2VzXHJcbmV4cG9ydCBjb25zdCBtaWdyYXRlQWxsTGVnYWN5QWRkcmVzc2VzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIEtp4buDbSB0cmEgcXV54buBbiBhZG1pbiAodGjhu7FjIHThur8gbsOqbiBz4butIGThu6VuZyBtaWRkbGV3YXJlKVxyXG4gICAgaWYgKCFyZXEudXNlciB8fCAhcmVxLnVzZXIucm9sZSB8fCByZXEudXNlci5yb2xlICE9PSBcImFkbWluXCIpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyBjw7MgcXV54buBbiB0aOG7sWMgaGnhu4duIGNo4bupYyBuxINuZyBuw6B5XCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEzhuqV5IHThuqV0IGPhuqMgdXNlciBjw7MgxJHhu4thIGNo4buJIGPFqVxyXG4gICAgY29uc3QgdXNlcnMgPSBhd2FpdCBVc2VyLmZpbmQoe1xyXG4gICAgICBhZGRyZXNzOiB7ICRleGlzdHM6IHRydWUsICRuZTogXCJcIiB9LFxyXG4gICAgICAkb3I6IFt7IGFkZHJlc3NlczogeyAkZXhpc3RzOiBmYWxzZSB9IH0sIHsgYWRkcmVzc2VzOiB7ICRzaXplOiAwIH0gfV0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBsZXQgbWlncmF0ZWRDb3VudCA9IDA7XHJcbiAgICBsZXQgc2tpcHBlZENvdW50ID0gMDtcclxuICAgIGxldCBlcnJvckNvdW50ID0gMDtcclxuXHJcbiAgICAvLyBY4butIGzDvSB04burbmcgdXNlclxyXG4gICAgZm9yIChjb25zdCB1c2VyIG9mIHVzZXJzKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gS2nhu4NtIHRyYSBu4bq/dSBt4bqjbmcgYWRkcmVzc2VzIHRy4buRbmdcclxuICAgICAgICBpZiAoIXVzZXIuYWRkcmVzc2VzIHx8IHVzZXIuYWRkcmVzc2VzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgYXdhaXQgbWlncmF0ZUxlZ2FjeUFkZHJlc3ModXNlcik7XHJcbiAgICAgICAgICBtaWdyYXRlZENvdW50Kys7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHNraXBwZWRDb3VudCsrO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgbWlncmF0aW5nIGFkZHJlc3MgZm9yIHVzZXIgJHt1c2VyLl9pZH06YCwgZXJyKTtcclxuICAgICAgICBlcnJvckNvdW50Kys7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IGDEkMOjIGRpIGNodXnhu4NuICR7bWlncmF0ZWRDb3VudH0gxJHhu4thIGNo4buJLCBi4buPIHF1YSAke3NraXBwZWRDb3VudH0sIGzhu5dpICR7ZXJyb3JDb3VudH1gLFxyXG4gICAgICB0b3RhbDogdXNlcnMubGVuZ3RoLFxyXG4gICAgICBtaWdyYXRlZDogbWlncmF0ZWRDb3VudCxcclxuICAgICAgc2tpcHBlZDogc2tpcHBlZENvdW50LFxyXG4gICAgICBlcnJvcnM6IGVycm9yQ291bnQsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBkaSBjaHV54buDbiBk4buvIGxp4buHdSDEkeG7i2EgY2jhu4k6XCIsIGVycm9yKTtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgZGkgY2h1eeG7g24gZOG7ryBsaeG7h3UgxJHhu4thIGNo4buJXCIs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Q0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUV2SyxTQUFTLEVBQUUsRUFBRXlLLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEUsQ0FBQyxDQUFDOztJQUVGLElBQUlDLGFBQWEsR0FBRyxDQUFDO0lBQ3JCLElBQUlDLFlBQVksR0FBRyxDQUFDO0lBQ3BCLElBQUlDLFVBQVUsR0FBRyxDQUFDOztJQUVsQjtJQUNBLEtBQUssTUFBTXZMLElBQUksSUFBSWlMLEtBQUssRUFBRTtNQUN4QixJQUFJO1FBQ0Y7UUFDQSxJQUFJLENBQUNqTCxJQUFJLENBQUNXLFNBQVMsSUFBSVgsSUFBSSxDQUFDVyxTQUFTLENBQUNDLE1BQU0sS0FBSyxDQUFDLEVBQUU7VUFDbEQsTUFBTUYsb0JBQW9CLENBQUNWLElBQUksQ0FBQztVQUNoQ3FMLGFBQWEsRUFBRTtRQUNqQixDQUFDLE1BQU07VUFDTEMsWUFBWSxFQUFFO1FBQ2hCO01BQ0YsQ0FBQyxDQUFDLE9BQU9oSixHQUFHLEVBQUU7UUFDWnBELE9BQU8sQ0FBQ0QsS0FBSyxDQUFDLG9DQUFvQ2UsSUFBSSxDQUFDOUIsR0FBRyxHQUFHLEVBQUVvRSxHQUFHLENBQUM7UUFDbkVpSixVQUFVLEVBQUU7TUFDZDtJQUNGOztJQUVBL08sR0FBRyxDQUFDYSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztNQUNuQnlCLE9BQU8sRUFBRSxJQUFJO01BQ2J4QixPQUFPLEVBQUUsZ0JBQWdCOE4sYUFBYSxvQkFBb0JDLFlBQVksU0FBU0MsVUFBVSxFQUFFO01BQzNGQyxLQUFLLEVBQUVQLEtBQUssQ0FBQ3JLLE1BQU07TUFDbkI2SyxRQUFRLEVBQUVKLGFBQWE7TUFDdkJLLE9BQU8sRUFBRUosWUFBWTtNQUNyQkssTUFBTSxFQUFFSjtJQUNWLENBQUMsQ0FBQztFQUNKLENBQUMsQ0FBQyxPQUFPdE0sS0FBSyxFQUFFO0lBQ2RDLE9BQU8sQ0FBQ0QsS0FBSyxDQUFDLG9DQUFvQyxFQUFFQSxLQUFLLENBQUM7SUFDMUR6QyxHQUFHLENBQUNhLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO01BQ25CeUIsT0FBTyxFQUFFLEtBQUs7TUFDZHhCLE9BQU8sRUFBRSw2Q0FBNkM7TUFDdEQwQixLQUFLLEVBQUVBLEtBQUssQ0FBQzFCO0lBQ2YsQ0FBQyxDQUFDO0VBQ0o7QUFDRixDQUFDLENBQUM0QixPQUFBLENBQUE2TCx5QkFBQSxHQUFBQSx5QkFBQSIsImlnbm9yZUxpc3QiOltdfQ==