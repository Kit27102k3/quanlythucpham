// File: RefreshToken.js
import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'userModel'
    },
    userModel: {
      type: String,
      required: true,
      enum: ['User', 'Admin']
    },
    token: { 
      type: String, 
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);


export default mongoose.model("RefreshToken", RefreshTokenSchema);