"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _contactController = require("../Controller/contactController.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

// Get all contacts - bỏ middleware verifyToken để có thể truy cập không cần đăng nhập
router.get("/", _contactController.getContacts);

// Get a specific contact by ID - bỏ middleware verifyToken để có thể truy cập không cần đăng nhập
router.get("/:id", _contactController.getContactById);

// Create a new contact
router.post("/", _contactController.createContact);

// Update a contact - bỏ middleware verifyToken để có thể cập nhật không cần đăng nhập
router.put("/:id", _contactController.updateContact);

// Delete a contact - bỏ middleware verifyToken để có thể xóa không cần đăng nhập
router["delete"]("/:id", _contactController.deleteContact);

// Reply to a contact - không yêu cầu xác thực
router.post("/reply", _contactController.replyToContact);

// Test email configuration
router.get("/test-email/config", _contactController.testEmailConfig);
var _default = exports["default"] = router;