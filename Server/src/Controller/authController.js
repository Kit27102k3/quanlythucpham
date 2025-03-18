import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../Model/Account/Register.js";

export const register = async (req, res) => {
  try {
    const {
      email,
      phone,
      firstName,
      lastName,
      userName,
      address,
      password,
      userImage,
    } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      phone,
      firstName,
      lastName,
      userName,
      address,
      password: hashedPassword,
      userImage,
    });
    await newUser.save();
    res.status(201).json({ message: "Người dùng đã đăng ký thành công!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const {
      email,
      phone,
      firstName,
      lastName,
      address,
      userName,
      password,
      userImage,
    } = req.body;
    const user = await User.findOne({ userName });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không hợp lệ" });
    }

    const accessToken = jwt.sign({ id: user._id }, "SECRET_ACCESS", {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id: user._id }, "SECRET_REFRESH", {
      expiresIn: "7d",
    });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ accessToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    jwt.verify(refreshToken, "SECRET_REFRESH", async (err, decode) => {
      if (err)
        return res.status(403).json({ message: "Invalid refresh token" });

      const user = await User.findOne({ _id: decode.id });
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ message: "Invalid token" });
      }

      const newAccessToken = jwt.sign({ id: user._id }, "SECRET_ACCESS", {
        expiresIn: "15m",
      });

      const newRefreshToken = jwt.sign({ id: user._id }, "SECRET_REFRESH", {
        expiresIn: "7d",
      });

      user.refreshToken = newRefreshToken;
      await user.save();

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });

      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    // const { refreshToken } = req.body;
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No token" });

    const user = await User.findOne({ refreshToken });
    if (!user)
      return res.status(400).json({ message: "Invalid refresh token" });

    user.refreshToken = "";
    await user.save();

    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
