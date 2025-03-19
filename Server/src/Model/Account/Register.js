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
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
