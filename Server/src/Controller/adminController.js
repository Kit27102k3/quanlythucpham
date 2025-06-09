/* eslint-disable no-undef */
// File: adminAuthController.js
import Admin from "../Model/adminModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const adminLogin = async (req, res) => {
  try {
    const { userName, password } = req.body;

    // Kiểm tra admin tồn tại
    const admin = await Admin.findOne({ userName });
    if (!admin) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu không chính xác" });
    }

    // Kiểm tra tài khoản có active không
    if (!admin.isActive) {
      return res.status(403).json({ message: "Tài khoản đã bị vô hiệu hóa" });
    }

    // Tạo token
    const accessToken = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        permissions: admin.permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { id: admin._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Cập nhật last login
    admin.lastLogin = new Date();
    await admin.save();

    res.status(200).json({
      accessToken,
      refreshToken,
      userId: admin._id,
      role: admin.role,
      permissions: admin.permissions,
      fullName: admin.fullName,
      branchId: admin.branchId || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    // Use either id or userId from the user object
    const adminId = req.user.id || req.user.userId;

    console.log("Request user object:", req.user);
    console.log("Admin ID for profile lookup:", adminId);

    if (!adminId) {
      console.error("No admin ID found in token");
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy ID người dùng trong token",
      });
    }

    console.log("Finding admin with ID:", adminId);

    const admin = await Admin.findById(adminId)
      .select("-password")
      .populate("branchId", "name address phone");

    if (!admin) {
      console.error(`Admin with ID ${adminId} not found`);
      return res.status(404).json({
        success: false,
        message: "Admin không tồn tại",
      });
    }

    console.log("Found admin:", admin);

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin admin thành công",
      data: admin,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin admin:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin admin",
      error: error.message,
    });
  }
};

// Hàm helper để lấy quyền mặc định theo role
const getDefaultPermissions = (role) => {
  switch (role) {
    case "admin":
      return [
        "Thêm",
        "Xem",
        "Sửa",
        "Xóa",
        "Quản lý người dùng",
        "Quản lý sản phẩm",
        "Quản lý đơn hàng",
        "Quản lý danh mục",
        "Quản lý cài đặt",
      ];
    case "manager":
      return [
        "Thêm",
        "Xem",
        "Sửa",
        "Quản lý sản phẩm",
        "Quản lý đơn hàng",
        "Quản lý danh mục",
      ];
    case "staff":
      return ["Xem", "Thêm", "Sửa", "Quản lý sản phẩm"];
    default:
      return ["Xem"];
  }
};

export const createAdmin = async (req, res) => {
  try {
    const {
      userName,
      password,
      fullName,
      email,
      phone,
      birthday,
      role,
      branchId,
    } = req.body;

    // Kiểm tra email đã tồn tại
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Kiểm tra username đã tồn tại
    const existingUsername = await Admin.findOne({ userName });
    if (existingUsername) {
      return res.status(400).json({ message: "Tên đăng nhập đã được sử dụng" });
    }

    // Tạo admin mới
    const newAdmin = new Admin({
      userName,
      password,
      fullName,
      email,
      phone,
      birthday,
      role,
      branchId: branchId || null,
      permissions: getDefaultPermissions(role),
    });

    const admin = await newAdmin.save();
    res.status(201).json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select("-password")
      .populate("branchId", "name address phone");
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      userName,
      fullName,
      phone,
      email,
      birthday,
      role,
      permissions,
      branchId,
      isActive,
      password,
    } = req.body;

    // Kiểm tra xem admin có tồn tại không
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy admin",
      });
    }

    // Cập nhật thông tin cơ bản
    if (userName) admin.userName = userName;
    if (fullName) admin.fullName = fullName;
    if (phone) admin.phone = phone;
    if (email) admin.email = email;
    if (birthday) admin.birthday = birthday;
    if (role) admin.role = role;
    if (permissions) admin.permissions = permissions;
    if (branchId !== undefined) admin.branchId = branchId;
    if (isActive !== undefined) admin.isActive = isActive;

    // Cập nhật mật khẩu nếu có
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    // Sử dụng validateModifiedOnly để chỉ validate các trường đã sửa
    const updatedAdmin = await admin.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin admin thành công",
      data: updatedAdmin,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin admin:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông tin admin",
      error: error.message,
    });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return res.status(404).json({ message: "Không tìm thấy admin" });
    }

    res.status(200).json({ message: "Xóa admin thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id)
      .select("-password")
      .populate("branchId", "name address phone");

    if (!admin) {
      return res.status(404).json({ message: "Admin không tồn tại" });
    }

    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRolePermissions = async (req, res) => {
  try {
    const { roleKey } = req.params;
    const { permissions } = req.body;

    // Kiểm tra xem mảng permissions có hợp lệ không
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: "Permissions phải là một mảng" });
    }

    // Tìm tất cả admin/manager/employee với roleKey và cập nhật quyền
    const result = await Admin.updateMany(
      { role: roleKey },
      { $set: { permissions: permissions } }
    );

    // Optional: Log số lượng documents đã được cập nhật
    console.log(
      `Updated permissions for ${result.modifiedCount} users with role ${roleKey}`
    );

    res.status(200).json({
      success: true,
      message: `Cập nhật quyền cho vai trò ${roleKey} thành công.`, // Message tiếng Việt
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating role permissions:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật quyền vai trò" });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    // Use either id or userId from the user object
    const adminId = req.user.id || req.user.userId;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy ID người dùng trong token",
      });
    }

    const { fullName, email, phone, userName, birthday, avatar, branchId } =
      req.body;

    console.log("Updating admin profile with data:", req.body);
    console.log("Admin ID:", adminId);

    // Kiểm tra xem admin có tồn tại không
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    // Kiểm tra email đã tồn tại chưa (nếu thay đổi)
    if (email && email !== admin.email) {
      const existingEmail = await Admin.findOne({
        email,
        _id: { $ne: adminId },
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email đã được sử dụng bởi tài khoản khác",
        });
      }
    }

    // Kiểm tra username đã tồn tại chưa (nếu thay đổi)
    if (userName && userName !== admin.userName) {
      const existingUsername = await Admin.findOne({
        userName,
        _id: { $ne: adminId },
      });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "Tên đăng nhập đã được sử dụng bởi tài khoản khác",
        });
      }
    }

    // Cập nhật thông tin
    if (fullName) admin.fullName = fullName;
    if (email) admin.email = email;
    if (phone) admin.phone = phone;
    if (userName) admin.userName = userName;
    if (birthday) admin.birthday = birthday;
    if (avatar !== undefined) admin.avatar = avatar;
    if (branchId) admin.branchId = branchId;

    console.log("Updated admin object before save:", admin);

    // Lưu thay đổi
    const updatedAdmin = await admin.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      data: updatedAdmin,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin cá nhân:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông tin cá nhân",
      error: error.message,
    });
  }
};

export const changeAdminPassword = async (req, res) => {
  try {
    // Use either id or userId from the user object
    const adminId = req.user.id || req.user.userId;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy ID người dùng trong token",
      });
    }

    const { oldPassword, newPassword } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp mật khẩu cũ và mật khẩu mới",
      });
    }

    // Kiểm tra mật khẩu mới có đủ độ dài không
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    // Tìm admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await admin.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không chính xác",
      });
    }

    // Cập nhật mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi đổi mật khẩu",
      error: error.message,
    });
  }
};

// Controller/adminController.js
export const getAdminsByBranchAndRole = async (req, res) => {
  try {
    const { branchId, userRole } = req.query;
    const filter = {};

    if (branchId) {
      filter.branchId = branchId;
    }

    if (userRole) {
      filter.userRole = userRole;
    }

    const admins = await Admin.find(filter)
      .populate("branchId", "name address")
      .select("-password");

    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

