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
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin không tồn tại" });
    }
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
                "Quản lý cài đặt"
            ];
        case "manager":
            return [
                "Thêm",
                "Xem",
                "Sửa",
                "Quản lý sản phẩm",
                "Quản lý đơn hàng",
                "Quản lý danh mục"
            ];
        case "staff":
            return [
                "Xem",
                "Thêm",
                "Sửa",
                "Quản lý sản phẩm"
            ];
        default:
            return ["Xem"];
    }
};

export const createAdmin = async (req, res) => {
    try {
        const { userName, password, fullName, email, phone, birthday, role, branchId } = req.body;
        
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
            permissions: getDefaultPermissions(role)
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
            .select('-password')
            .populate('branchId', 'name address phone');
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
      password 
    } = req.body;

    // Kiểm tra xem admin có tồn tại không
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy admin"
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
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    // Sử dụng validateModifiedOnly để chỉ validate các trường đã sửa
    const updatedAdmin = await admin.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin admin thành công",
      data: updatedAdmin
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin admin:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông tin admin",
      error: error.message
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
            .select('-password')
            .populate('branchId', 'name address phone');
        
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
    console.log(`Updated permissions for ${result.modifiedCount} users with role ${roleKey}`);

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