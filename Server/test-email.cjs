const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

async function testEmailConfig() {
  const username = process.env.EMAIL_USERNAME;
  const password = process.env.EMAIL_PASSWORD;
  
  console.log("Email configuration:");
  console.log("EMAIL_USERNAME:", username || "Not set");
  console.log("EMAIL_PASSWORD:", password ? "Set (masked)" : "Not set");
  
  if (!username || !password) {
    console.error("Error: Email credentials are missing!");
    return;
  }
  
  try {
    // Cấu hình nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: username,
        pass: password
      }
    });
    
    // Kiểm tra kết nối
    console.log("Attempting to verify email connection...");
    const verifyResult = await transporter.verify();
    console.log("Verification successful!", verifyResult);
    
    // Gửi email thử nghiệm
    console.log("Attempting to send test email...");
    const info = await transporter.sendMail({
      from: username,
      to: username, // Gửi cho chính mình
      subject: "Test Email from Node.js",
      text: "This is a test email to verify the email configuration.",
      html: "<b>This is a test email to verify the email configuration.</b>"
    });
    
    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("Error testing email configuration:", error);
  }
}

testEmailConfig(); 