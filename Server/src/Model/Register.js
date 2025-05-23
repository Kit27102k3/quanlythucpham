import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userImage: { type: String, required: false, default: "" },
    isBlocked: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    facebookId: { type: String, default: null },
    googleId: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ["local", "facebook", "google"],
      default: "local",
    },
    addresses: [
      {
        fullAddress: { type: String, required: true },
        houseNumber: { type: String, required: false },
        ward: { type: String, required: false },
        district: { type: String, required: false },
        province: { type: String, required: false },
        coordinates: {
          lat: { type: Number, required: false },
          lng: { type: Number, required: false },
        },
        isDefault: { type: Boolean, default: false },
        label: { type: String, required: false, default: "Nhà" },
        receiverName: { type: String, required: false },
        receiverPhone: { type: String, required: false },
      },
    ],
    pushSubscriptions: [
      {
        endpoint: { type: String, required: true },
        expirationTime: { type: Date, default: null },
        keys: {
          p256dh: { type: String, required: true },
          auth: { type: String, required: true },
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
