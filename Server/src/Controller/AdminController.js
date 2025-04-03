import Admin from "../Model/Admin.js";
import jwt from "jsonwebtoken";

// Login Admin
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "Tài khoản không tồn tại" });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không chính xác" });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(401).json({ message: "Tài khoản đã bị khóa" });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: admin._id,
        role: admin.role,
        position: admin.position
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role,
        position: admin.position,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all admins
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new admin
export const createAdmin = async (req, res) => {
  try {
    const { username, password, fullName, email, phone, birthday, role, position } = req.body;

    // Check if username exists
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
    }

    // Check if email exists
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const admin = new Admin({
      username,
      password,
      fullName,
      email,
      phone,
      birthday,
      role,
      position,
    });

    await admin.save();
    res.status(201).json({ message: "Tạo tài khoản thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update admin
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, birthday, role, position, isActive } = req.body;

    // Check if email exists for other admins
    const existingEmail = await Admin.findOne({ email, _id: { $ne: id } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    admin.fullName = fullName;
    admin.email = email;
    admin.phone = phone;
    admin.birthday = birthday;
    admin.role = role;
    admin.position = position;
    admin.isActive = isActive;

    await admin.save();
    res.json({ message: "Cập nhật tài khoản thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    await admin.deleteOne();
    res.json({ message: "Xóa tài khoản thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get admin by ID
export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 