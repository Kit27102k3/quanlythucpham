import Supplier from "../Model/Supplier.js";
import { asyncHandler } from "../Middleware/asyncHandler.js";

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin
export const getAllSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
  
  return res.status(200).json(suppliers);
});

// @desc    Get a single supplier
// @route   GET /api/suppliers/:id
// @access  Private/Admin
export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy nhà cung cấp",
    });
  }
  
  return res.status(200).json(supplier);
});

// @desc    Create a new supplier
// @route   POST /api/suppliers
// @access  Private/Admin
export const createSupplier = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  let { code } = req.body;

  // Kiểm tra thông tin bắt buộc
  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp tên và số điện thoại",
    });
  }

  // Nếu không có mã, tự động tạo mã ngẫu nhiên 6 chữ số
  if (!code) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    req.body.code = code;
  }

  // Kiểm tra xem code đã tồn tại chưa
  const existingSupplier = await Supplier.findOne({ code });
  if (existingSupplier) {
    return res.status(400).json({
      success: false,
      message: "Mã nhà cung cấp đã tồn tại",
    });
  }

  // Thêm thông tin người tạo nếu có
  if (req.user && req.user._id) {
    req.body.createdBy = req.user._id;
  }

  const supplier = await Supplier.create(req.body);

  return res.status(201).json({
    success: true,
    message: "Thêm nhà cung cấp thành công",
    supplier,
  });
});

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin
export const updateSupplier = asyncHandler(async (req, res) => {
  let supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy nhà cung cấp",
    });
  }

  // Kiểm tra thông tin bắt buộc
  if (!req.body.name || !req.body.phone) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp tên và số điện thoại",
    });
  }

  // Nếu không có mã, tự động tạo mã ngẫu nhiên 6 chữ số
  if (!req.body.code) {
    req.body.code = Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Nếu cập nhật mã nhà cung cấp (code), phải kiểm tra xem mã đã tồn tại chưa
  if (req.body.code && req.body.code !== supplier.code) {
    const existingSupplier = await Supplier.findOne({
      code: req.body.code,
      _id: { $ne: req.params.id },
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: "Mã nhà cung cấp đã tồn tại",
      });
    }
  }

  // Thêm thông tin người cập nhật nếu có
  if (req.user && req.user._id) {
    req.body.updatedBy = req.user._id;
  }

  supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    message: "Cập nhật nhà cung cấp thành công",
    supplier,
  });
});

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin
export const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy nhà cung cấp",
    });
  }

  await supplier.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Xóa nhà cung cấp thành công",
  });
});

// @desc    Search suppliers
// @route   GET /api/suppliers/search
// @access  Private/Admin
export const searchSuppliers = asyncHandler(async (req, res) => {
  const { query = "" } = req.query;

  const searchCondition = {
    $or: [
      { name: { $regex: query, $options: "i" } },
      { code: { $regex: query, $options: "i" } },
      { contactPerson: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
  };

  const suppliers = await Supplier.find(searchCondition).sort({ createdAt: -1 });

  return res.status(200).json(suppliers);
}); 