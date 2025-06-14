/* eslint-disable no-undef */
import Admin from "../Model/adminModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import RefreshToken from "../Model/RefreshToken.js";

dotenv.config();

export const adminLogin = async (req, res) => {
    try {
        const { userName, password } = req.body;

        console.log("Admin login attempt for:", userName);

        // Tìm admin theo username
        const admin = await Admin.findOne({ userName });
        if (!admin) {
            return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác" });
        }

        // Kiểm tra mật khẩu
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác" });
        }

        // Kiểm tra tài khoản có bị khóa không
        if (!admin.isActive) {
            return res.status(403).json({ message: "Tài khoản đã bị khóa" });
        }

        // Tạo access token với cả id và userId để đảm bảo tương thích
        const accessToken = jwt.sign(
            { 
                id: admin._id,          // Add id field for compatibility
                userId: admin._id,      // Keep userId for backward compatibility
                role: admin.role,
                permissions: admin.permissions
            },
            process.env.JWT_SECRET_ACCESS,
            { expiresIn: "1d" }
        );

        // Tạo refresh token
        const refreshToken = jwt.sign(
            { 
                id: admin._id,
                userId: admin._id 
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        // Xóa tất cả refresh token cũ của admin
        await RefreshToken.deleteMany({
            userId: admin._id,
            userModel: "Admin"
        });

        // Lưu refresh token mới
        await RefreshToken.create({
            userId: admin._id,
            userModel: "Admin",
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        // Cập nhật thời gian đăng nhập cuối
        admin.lastLogin = new Date();
        await admin.save();

        console.log("Admin login successful for:", userName);

        // Trả về thông tin admin và token
        res.status(200).json({
            accessToken,
            refreshToken,
            userId: admin._id,
            id: admin._id,
            role: admin.role,
            permissions: admin.permissions,
            fullName: admin.fullName,
            branchId: admin.branchId || null,
            message: "Đăng nhập thành công"
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: "Lỗi server khi đăng nhập" });
    }
}; 