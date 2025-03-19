import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../Model/Account/Register.js";
import RefreshToken from "../Model/Account/RefreshToken.js";

export const register = async (req, res) => {
  try {
    const {
      email,
      phone,
      firstName,
      lastName,
      userName,
      password,
      address,
      userImage,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      phone,
      firstName,
      lastName,
      userName,
      password: hashedPassword,
      address,
      userImage,
    });
    await newUser.save();

    const refreshToken = jwt.sign({ id: newUser._id }, "SECRET_REFRESH", {
      expiresIn: "7d",
    });
    await RefreshToken.create({ userId: newUser._id, token: refreshToken });

    res
      .status(201)
      .json({
        message: "User registered successfully",
        userId: newUser._id,
        refreshToken,
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const accessToken = jwt.sign({ id: user._id }, "SECRET_ACCESS", {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id: user._id }, "SECRET_REFRESH", {
      expiresIn: "7d",
    });

    await RefreshToken.deleteMany({ userId: user._id });
    await RefreshToken.create({ userId: user._id, token: refreshToken });

    res.status(200).json({ accessToken, refreshToken, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const tokenRecord = await RefreshToken.findOne({ token: refreshToken });
    if (!tokenRecord) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    jwt.verify(refreshToken, "SECRET_REFRESH", async (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ message: "Invalid or expired refresh token" });
      }

      const newAccessToken = jwt.sign({ id: decoded.id }, "SECRET_ACCESS", {
        expiresIn: "15m",
      });
      const newRefreshToken = jwt.sign({ id: decoded.id }, "SECRET_REFRESH", {
        expiresIn: "7d",
      });

      tokenRecord.token = newRefreshToken;
      await tokenRecord.save();

      res
        .status(200)
        .json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    await RefreshToken.findOneAndDelete({ token: refreshToken });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
