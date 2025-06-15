import Supplier from "../Model/Supplier.js";
import { asyncHandler } from "../Middleware/asyncHandler.js";
import mongoose from "mongoose";

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin
export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    
    return res.status(200).json({
      success: true,
      data: suppliers,
      message: "Lấy danh sách nhà cung cấp thành công",
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhà cung cấp:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách nhà cung cấp",
      error: error.message,
    });
  }
};

// @desc    Get a single supplier
// @route   GET /api/suppliers/:id
// @access  Private/Admin
export const getSupplierById = asyncHandler(async (req, res) => {
  const { branchId, role } = req.user;
  
  // Admin có thể xem bất kỳ nhà cung cấp nào, manager chỉ xem của chi nhánh mình
  const filter = role === 'admin' 
    ? { _id: req.params.id } 
    : { _id: req.params.id, branchId };
  
  const supplier = await Supplier.findOne(filter).populate({
    path: 'branchId',
    select: 'name',
    model: 'Branch'
  });

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy nhà cung cấp",
    });
  }
  
  // Format response để bao gồm tên chi nhánh
  const formattedSupplier = supplier.toObject();
  if (formattedSupplier.branchId && formattedSupplier.branchId.name) {
    formattedSupplier.branchName = formattedSupplier.branchId.name;
  }

  return res.status(200).json({
    success: true,
    data: formattedSupplier
  });
});

// @desc    Create a new supplier
// @route   POST /api/suppliers
// @access  Private/Admin
export const createSupplier = asyncHandler(async (req, res) => {
  const { name, phone, code: supplierCode, branchId: targetBranchId } = req.body;
  const { branchId: userBranchId, _id: adminId, role } = req.user;

  // Kiểm tra thông tin bắt buộc
  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp tên và số điện thoại",
    });
  }

  // Determine which branch to use
  // For admin, use the branch specified in request or default to user's branch
  // For manager, always use their own branch
  const finalBranchId = role === 'admin' && targetBranchId 
    ? targetBranchId 
    : userBranchId;
    
  if (!finalBranchId) {
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng chọn chi nhánh cho nhà cung cấp" });
  }

  // Nếu không có mã, tự động tạo mã ngẫu nhiên 6 chữ số
  let finalCode = supplierCode;
  if (!finalCode) {
    finalCode = "SUP" + Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Kiểm tra mã nhà cung cấp đã tồn tại TRONG CÙNG CHI NHÁNH
  const existing = await Supplier.findOne({ 
    code: finalCode,
    branchId: finalBranchId  // Chỉ kiểm tra trong cùng chi nhánh
  });
  
  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Mã nhà cung cấp đã tồn tại trong chi nhánh này",
    });
  }

  // Remove branchId from request body to avoid conflicts
  const supplierData = { ...req.body };
  delete supplierData.branchId;

  const supplier = await Supplier.create({
    ...supplierData,
    code: finalCode,
    branchId: finalBranchId,
    createdBy: adminId,
  });

  return res.status(201).json({
    success: true,
    message: "Thêm nhà cung cấp thành công",
    data: supplier,
  });
});

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin
export const updateSupplier = asyncHandler(async (req, res) => {
  const { branchId: userBranchId, _id: adminId, role } = req.user;
  const { branchId: targetBranchId } = req.body;
  
  // Admin có thể cập nhật bất kỳ nhà cung cấp nào, manager chỉ cập nhật của chi nhánh mình
  const filter = role === 'admin' 
    ? { _id: req.params.id } 
    : { _id: req.params.id, branchId: userBranchId };
    
  const supplier = await Supplier.findOne(filter);

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

  // Determine which branch to use
  const finalBranchId = role === 'admin' && targetBranchId 
    ? targetBranchId 
    : userBranchId;

  if (!finalBranchId) {
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng chọn chi nhánh cho nhà cung cấp" });
  }

  // Nếu không có mã, tự động tạo mã ngẫu nhiên
  let finalCode = req.body.code;
  if (!finalCode) {
    finalCode = "SUP" + Math.floor(1000 + Math.random() * 9000).toString();
    req.body.code = finalCode;
  }

  // Nếu cập nhật mã nhà cung cấp (code), phải kiểm tra xem mã đã tồn tại trong cùng chi nhánh chưa
  if (req.body.code && req.body.code !== supplier.code) {
    const existingSupplier = await Supplier.findOne({
      code: req.body.code,
      branchId: finalBranchId,
      _id: { $ne: req.params.id },
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: "Mã nhà cung cấp đã tồn tại trong chi nhánh này",
      });
    }
  }

  // Remove branchId from request body to avoid conflicts
  const updateData = { ...req.body };
  delete updateData.branchId;
  
  // Add the final values
  updateData.branchId = finalBranchId;
  updateData.updatedBy = adminId;

  try {
    // Sử dụng findOneAndUpdate thay vì findByIdAndUpdate để có thể bỏ qua validation
    const updated = await Supplier.findOneAndUpdate(
      { _id: supplier._id },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật nhà cung cấp thành công",
      data: updated,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật nhà cung cấp:", error);
    return res
      .status(500)
      .json({ 
        success: false, 
        message: "Lỗi khi cập nhật nhà cung cấp", 
        error: error.message 
      });
  }
});

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin
export const deleteSupplier = asyncHandler(async (req, res) => {
  const { branchId, role } = req.user;
  
  // Admin có thể xóa bất kỳ nhà cung cấp nào, manager chỉ xóa của chi nhánh mình
  const filter = role === 'admin' 
    ? { _id: req.params.id } 
    : { _id: req.params.id, branchId };
    
  const supplier = await Supplier.findOne(filter);

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
  const { branchId, role } = req.user;

  // Admin mặc định tìm tất cả hoặc theo filter branchId
  // Manager chỉ tìm theo branchId của mình
  const requestedBranchId = req.query.branchId;
  
  let baseFilter = {};
  
  if (role === 'admin') {
    // Admin có thể lọc theo chi nhánh cụ thể hoặc tìm tất cả
    if (requestedBranchId) {
      baseFilter.branchId = requestedBranchId;
    }
  } else {
    // Manager chỉ tìm được nhà cung cấp của chi nhánh mình
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin chi nhánh của bạn",
      });
    }
    baseFilter.branchId = branchId;
  }

  const searchCondition = {
    ...baseFilter,
    $or: [
      { name: { $regex: query, $options: "i" } },
      { code: { $regex: query, $options: "i" } },
      { contactPerson: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
  };

  let searchQuery = Supplier.find(searchCondition).sort({ createdAt: -1 });
  
  // Luôn populate thông tin chi nhánh để dễ hiển thị
  searchQuery = searchQuery.populate({
    path: 'branchId',
    select: 'name',
    model: 'Branch'
  });

  const results = await searchQuery;
  
  // Format response để bao gồm tên chi nhánh
  const formattedResults = results.map(supplier => {
    const plainSupplier = supplier.toObject();
    if (plainSupplier.branchId && plainSupplier.branchId.name) {
      plainSupplier.branchName = plainSupplier.branchId.name;
    }
    return plainSupplier;
  });

  return res.status(200).json({
    success: true,
    data: formattedResults
  });
});

// Thêm API endpoint để reset indexes
export const resetSupplierIndexes = asyncHandler(async (req, res) => {
  try {
    // Xóa tất cả indexes hiện tại (trừ _id)
    const result = await mongoose.connection.db.collection('suppliers').dropIndexes();
    
    console.log("Kết quả xóa indexes:", result);
    
    res.status(200).json({
      success: true,
      message: "Đã reset tất cả indexes của Supplier collection",
      result
    });
  } catch (error) {
    console.error("Lỗi khi reset indexes:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi reset indexes",
      error: error.message
    });
  }
}); 