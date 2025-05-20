import Brand from "../Model/Brand.js";
import { asyncHandler } from "../Middleware/asyncHandler.js";

// @desc    Get all brands
// @route   GET /api/brands
// @access  Private/Admin
export const getAllBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({}).sort({ createdAt: -1 });
  
  return res.status(200).json(brands);
});

// @desc    Get a single brand
// @route   GET /api/brands/:id
// @access  Private/Admin
export const getBrandById = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy thương hiệu",
    });
  }
  
  return res.status(200).json(brand);
});

// @desc    Create a new brand
// @route   POST /api/brands
// @access  Private/Admin
export const createBrand = asyncHandler(async (req, res) => {
  const { name } = req.body;
  let { code } = req.body;

  // Kiểm tra thông tin bắt buộc
  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp tên thương hiệu",
    });
  }

  // Nếu không có mã, tự động tạo mã ngẫu nhiên 4 chữ cái viết tắt từ tên
  if (!code) {
    // Lấy chữ cái đầu của mỗi từ trong tên thương hiệu
    const words = name.split(" ");
    let generatedCode = "";
    for (let i = 0; i < Math.min(words.length, 4); i++) {
      if (words[i].length > 0) {
        generatedCode += words[i][0].toUpperCase();
      }
    }
    
    // Nếu code có ít hơn 4 ký tự, thêm chữ cái từ từ đầu tiên
    while (generatedCode.length < 4) {
      if (words[0].length > generatedCode.length - 1) {
        generatedCode += words[0][generatedCode.length].toUpperCase();
      } else {
        // Nếu từ đầu tiên không đủ ký tự, thêm số ngẫu nhiên
        generatedCode += Math.floor(Math.random() * 10).toString();
      }
    }
    
    code = generatedCode;
    req.body.code = code;
  }

  // Kiểm tra xem code đã tồn tại chưa
  const existingBrand = await Brand.findOne({ code });
  if (existingBrand) {
    return res.status(400).json({
      success: false,
      message: "Mã thương hiệu đã tồn tại",
    });
  }

  // Thêm thông tin người tạo nếu có
  if (req.user && req.user._id) {
    req.body.createdBy = req.user._id;
  }

  const brand = await Brand.create(req.body);

  return res.status(201).json({
    success: true,
    message: "Thêm thương hiệu thành công",
    brand,
  });
});

// @desc    Update a brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
export const updateBrand = asyncHandler(async (req, res) => {
  let brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy thương hiệu",
    });
  }

  // Kiểm tra thông tin bắt buộc
  if (!req.body.name) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp tên thương hiệu",
    });
  }

  // Nếu cập nhật mã thương hiệu (code), phải kiểm tra xem mã đã tồn tại chưa
  if (req.body.code && req.body.code !== brand.code) {
    const existingBrand = await Brand.findOne({
      code: req.body.code,
      _id: { $ne: req.params.id },
    });

    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: "Mã thương hiệu đã tồn tại",
      });
    }
  }

  // Thêm thông tin người cập nhật nếu có
  if (req.user && req.user._id) {
    req.body.updatedBy = req.user._id;
  }

  brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    message: "Cập nhật thương hiệu thành công",
    brand,
  });
});

// @desc    Delete a brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
export const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy thương hiệu",
    });
  }

  await brand.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Xóa thương hiệu thành công",
  });
});

// @desc    Search brands
// @route   GET /api/brands/search
// @access  Private/Admin
export const searchBrands = asyncHandler(async (req, res) => {
  const { query = "" } = req.query;

  const searchCondition = {
    $or: [
      { name: { $regex: query, $options: "i" } },
      { code: { $regex: query, $options: "i" } },
      { country: { $regex: query, $options: "i" } },
    ],
  };

  const brands = await Brand.find(searchCondition).sort({ createdAt: -1 });

  return res.status(200).json(brands);
}); 