import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, require: false, default: "" },
    userImage: { type: String, required: false, default: "" },
    isBlocked: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    facebookId: { type: String, default: null },
    googleId: { type: String, default: null },
    authProvider: { type: String, enum: ['local', 'facebook', 'google'], default: 'local' }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
