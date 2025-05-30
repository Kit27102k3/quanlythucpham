import express from "express";
import { 
  getContacts, 
  getContactById, 
  createContact, 
  updateContact, 
  deleteContact,
  replyToContact,
  testEmailConfig
} from "../Controller/contactController.js";

const router = express.Router();

// Get all contacts - bỏ middleware verifyToken để có thể truy cập không cần đăng nhập
router.get("/", getContacts);

// Get a specific contact by ID - bỏ middleware verifyToken để có thể truy cập không cần đăng nhập
router.get("/:id", getContactById);

// Create a new contact
router.post("/", createContact);

// Update a contact - bỏ middleware verifyToken để có thể cập nhật không cần đăng nhập
router.put("/:id", updateContact);

// Delete a contact - bỏ middleware verifyToken để có thể xóa không cần đăng nhập
router.delete("/:id", deleteContact);

// Reply to a contact - không yêu cầu xác thực
router.post("/reply", replyToContact);

// Test email configuration
router.get("/test-email/config", testEmailConfig);

export default router; 