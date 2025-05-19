/* eslint-disable no-undef */
import Contact from "../Model/Contact.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { sendPushNotification } from "../Services/notificationService.js";
import Admin from "../Model/adminModel.js";

dotenv.config();

// Get all contacts
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }); // Sắp xếp theo thời gian mới nhất
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific contact by ID
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new contact
export const createContact = async (req, res) => {
  try {
    const { name, email, message, phone } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Please provide name, email and message" });
    }
    
    const newContact = new Contact({
      name,
      email,
      message,
      phone,
      isRead: false,
      isReplied: false
    });
    
    const savedContact = await newContact.save();

    // Gửi thông báo cho admin về liên hệ mới
    try {
      // Tìm tất cả admin có đăng ký nhận thông báo
      const adminsToNotify = await Admin.find({
        'pushSubscriptions.0': { $exists: true }
      });

      if (adminsToNotify && adminsToNotify.length > 0) {
        const notificationPayload = {
          title: 'Liên hệ mới',
          body: `${name} đã gửi một liên hệ mới qua website.`,
          data: {
            url: '/admin/contacts',
            type: 'new_contact'
          }
        };

        // Gửi thông báo đến từng admin
        for (const admin of adminsToNotify) {
          for (const subscription of admin.pushSubscriptions) {
            sendPushNotification(admin._id, subscription, notificationPayload)
              .catch(error => console.error('Error sending contact notification to admin:', error));
          }
        }
        console.log(`Đã gửi thông báo liên hệ mới đến ${adminsToNotify.length} admins`);
      }
    } catch (notificationError) {
      console.error('Lỗi khi gửi thông báo liên hệ mới:', notificationError);
      // Không ảnh hưởng đến việc trả về response
    }

    res.status(201).json(savedContact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a contact
export const updateContact = async (req, res) => {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!updatedContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    res.status(200).json(updatedContact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a contact
export const deleteContact = async (req, res) => {
  try {
    const deletedContact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!deletedContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reply to a contact by sending an email
export const replyToContact = async (req, res) => {
  try {
    const { contactId, to, subject, message } = req.body;

    if (!contactId || !to || !subject || !message) {
      return res.status(400).json({ message: "Please provide contactId, to, subject and message" });
    }

    // Kiểm tra xem liên hệ có tồn tại không
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Lấy thông tin email từ biến môi trường
    const emailUsername = process.env.EMAIL_USERNAME;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    if (!emailUsername || !emailPassword) {
      return res.status(500).json({
        message: "Email configuration is missing",
        error: "Missing email credentials in server configuration"
      });
    }

    // Cấu hình nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUsername,
        pass: emailPassword
      },
      debug: true, // Thêm để xem lỗi chi tiết hơn
    });

    console.log("Email configuration:", {
      emailUser: emailUsername ? "Set" : "Not set",
      emailPass: emailPassword ? "Set" : "Not set"
    });

    // Xác thực kết nối trước khi gửi
    try {
      await transporter.verify();
      console.log("Email transport verified successfully");
    } catch (verifyError) {
      console.error("Email transport verification failed:", verifyError);
      return res.status(500).json({
        message: "Email server configuration error",
        error: verifyError.message
      });
    }

    // Cấu hình email
    const mailOptions = {
      from: emailUsername,
      to: to,
      subject: subject,
      html: message.replace(/\n/g, '<br>')
    };

    // Gửi email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);

    // Cập nhật trạng thái liên hệ thành đã trả lời
    contact.isRead = true;
    contact.isReplied = true;
    await contact.save();

    res.status(200).json({ 
      message: "Reply sent successfully",
      messageId: info.messageId,
      deliveryStatus: info.response
    });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ message: "Failed to send reply", error: error.message });
  }
};

// Test email configuration
export const testEmailConfig = async (req, res) => {
  try {
    // Lấy thông tin cấu hình từ biến môi trường
    const emailUsername = process.env.EMAIL_USERNAME;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    if (!emailUsername || !emailPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Email configuration is missing", 
        config: {
          username: emailUsername ? "Set" : "Not set",
          password: emailPassword ? "Set" : "Not set"
        }
      });
    }
    
    // Cấu hình nodemailer transporter để kiểm tra
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUsername,
        pass: emailPassword
      }
    });
    
    // Kiểm tra kết nối
    await transporter.verify();
    
    res.status(200).json({ 
      success: true,
      message: "Email configuration is valid",
      email: emailUsername
    });
  } catch (error) {
    console.error("Error testing email config:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to verify email configuration", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 