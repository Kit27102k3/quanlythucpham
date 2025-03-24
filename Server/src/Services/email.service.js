import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // chỉ dùng cho môi trường dev
  },
});

export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Quản Lý Thực Phẩm" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "Mã OTP Đặt Lại Mật Khẩu",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Mã OTP Đặt Lại Mật Khẩu</h2>
          <p>Mã OTP của bạn là: <strong style="font-size: 1.5rem; color: #dc2626;">${otp}</strong></p>
          <p>Mã có hiệu lực trong 15 phút.</p>
          <p style="color: #ef4444; font-weight: bold;">Không chia sẻ mã này với bất kỳ ai.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", email);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Không thể gửi email xác nhận");
  }
};
