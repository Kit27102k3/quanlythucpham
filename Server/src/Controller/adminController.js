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
        const { userName, password, fullName, email, phone, birthday, role } = req.body;
        
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
        const admins = await Admin.find().select('-password');
        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // Nếu có thay đổi mật khẩu, hash mật khẩu mới
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        // Cập nhật quyền nếu thay đổi role
        if (updateData.role) {
            updateData.permissions = getDefaultPermissions(updateData.role);
        }

        const admin = await Admin.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).select('-password');

        if (!admin) {
            return res.status(404).json({ message: "Không tìm thấy admin" });
        }

        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ message: error.message });
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