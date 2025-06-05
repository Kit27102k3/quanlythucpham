/* eslint-disable no-useless-escape */
import mongoose from "mongoose";
import { genSalt, hash, compare } from "bcryptjs";

// Kiểm tra nếu model đã tồn tại
const Admin = mongoose.models.Admin || (() => {
  const AdminSchema = new mongoose.Schema(
    {
      // Hỗ trợ cả hai trường userName và username
      userName: {
        type: String,
        required: [true, "Tên đăng nhập là bắt buộc"],
        unique: true,
        trim: true,
        minlength: [4, "Tên đăng nhập phải có ít nhất 4 ký tự"],
        maxlength: [20, "Tên đăng nhập không quá 20 ký tự"],
      },
      // username sẽ được đặt bằng giá trị của userName
      username: {
        type: String,
        trim: true,
      },
      password: {
        type: String,
        required: [function() {
          // Chỉ yêu cầu mật khẩu khi tạo mới document
          return this.isNew;
        }, "Mật khẩu là bắt buộc"],
        minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
      },
      fullName: {
        type: String,
        required: [true, "Họ tên là bắt buộc"],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Số điện thoại là bắt buộc"],
        match: [/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"],
      },
      email: {
        type: String,
        required: [true, "Email là bắt buộc"],
        unique: true,
        lowercase: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          "Email không hợp lệ",
        ],
      },
      avatar: {
        type: String,
        default: "/images/avatar.png"
      },
      birthday: {
        type: Date,
        validate: {
          validator: function (value) {
            return !value || value < new Date();
          },
          message: "Ngày sinh không hợp lệ",
        },
      },
      role: {
        type: String,
        enum: ["superadmin", "manager", "admin", "user", "employee", "shipper", "staff"],
        required: true,
      },
      // Hỗ trợ thêm trường position cho tương thích
      position: {
        type: String,
        enum: ["admin", "manager", "employee", "staff", "shipper"],
        default: function() {
          // Lấy giá trị từ role nếu phù hợp
          return ["admin", "manager", "employee", "staff", "shipper"].includes(this.role) 
            ? this.role 
            : "staff";
        }
      },
      branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
      },
      permissions: {
        type: [String],
        enum: [
          "Thêm",
          "Xem",
          "Sửa",
          "Xóa",
          "Quản lý người dùng",
          "Quản lý sản phẩm",
          "Quản lý đơn hàng",
          "Quản lý danh mục",
          "Quản lý cài đặt",
          "reviews",
          "contacts",
          "messages",
          "orders",
          "employees",
          "customers",
          "dashboard",
          "products",
          "categories",
          "coupons",
          "tips",
          "reports",
          "settings",
          "delivery",
          "branches",
          "profile",
          "suppliers",
          "brands",
        ],
        default: ["Xem"],
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      lastLogin: Date,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

  // Đảm bảo username luôn được đồng bộ với userName
  AdminSchema.pre("validate", function(next) {
    if (this.userName && !this.username) {
      this.username = this.userName;
    }
    if (this.username && !this.userName) {
      this.userName = this.username;
    }
    next();
  });

  AdminSchema.pre("save", async function (next) {
    // Đảm bảo username và userName luôn đồng bộ
    if (this.userName) {
      this.username = this.userName;
    } else if (this.username) {
      this.userName = this.username;
    }

    // Chỉ hash mật khẩu khi mật khẩu thay đổi
    if (!this.isModified("password")) return next();

    try {
      const salt = await genSalt(10);
      this.password = await hash(this.password, salt);
      next();
    } catch (err) {
      next(err);
    }
  });

  AdminSchema.methods.comparePassword = async function (candidatePassword) {
    return await compare(candidatePassword, this.password);
  };

  AdminSchema.methods.toJSON = function () {
    const admin = this.toObject();
    delete admin.password;
    delete admin.__v;
    return admin;
  };

  return mongoose.model("Admin", AdminSchema);
})();

export default Admin;
