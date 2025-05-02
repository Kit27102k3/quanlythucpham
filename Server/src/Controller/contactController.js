import Contact from "../models/Contact.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

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

    // Cấu hình nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Cấu hình email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: message.replace(/\n/g, '<br>')
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    // Cập nhật trạng thái liên hệ thành đã trả lời
    contact.isRead = true;
    contact.isReplied = true;
    await contact.save();

    res.status(200).json({ message: "Reply sent successfully" });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ message: "Failed to send reply", error: error.message });
  }
}; 