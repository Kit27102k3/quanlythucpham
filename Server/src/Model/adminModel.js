import mongoose from "mongoose";
import { genSalt, hash, compare } from "bcryptjs";

const AdminSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, "Tên đăng nhập là bắt buộc"],
      unique: true,
      trim: true,
      minlength: [4, "Tên đăng nhập phải có ít nhất 4 ký tự"],
      maxlength: [20, "Tên đăng nhập không quá 20 ký tự"],
    },
    password: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
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
    birthday: {
      type: Date,
      validate: {
        validator: function (value) {
          return value < new Date();
        },
        message: "Ngày sinh không hợp lệ",
      },
    },
    role: {
      type: String,
      enum: ["superadmin", "manager", "admin", "user"],
      required: true,
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

AdminSchema.pre("save", async function (next) {
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

export default mongoose.model("Admin", AdminSchema);
