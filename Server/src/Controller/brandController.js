import Brand from "../Model/Brand.js";
import { asyncHandler } from "../Middleware/asyncHandler.js";
import mongoose from "mongoose";

const generateUniqueBrandCode = async (name) => {
  const words = name.split(" ");
  let code = words
    .map((w) => w[0] && w[0].toUpperCase())
    .join("")
    .slice(0, 4);

  while (code.length < 4) {
    code += Math.floor(Math.random() * 10);
  }

  let tries = 0;
  while ((await Brand.findOne({ code })) && tries < 5) {
    code = code.slice(0, 3) + Math.floor(Math.random() * 10);
    tries++;
  }

  return code;
};

export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    
    return res.status(200).json({
      success: true,
      data: brands,
      message: "Lấy danh sách thương hiệu thành công",
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thương hiệu:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách thương hiệu",
      error: error.message,
    });
  }
};

export const getBrandById = asyncHandler(async (req, res) => {
  const { branchId, role } = req.user;

  const filter =
    role === "admin"
      ? { _id: req.params.id }
      : { _id: req.params.id, branchId };

  const brand = await Brand.findOne(filter).populate({
    path: "branchId",
    select: "name",
    model: "Branch",
  });

  if (!brand) {
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy thương hiệu" });
  }

  const formattedBrand = brand.toObject();
  if (formattedBrand.branchId && formattedBrand.branchId.name) {
    formattedBrand.branchName = formattedBrand.branchId.name;
  }

  res.status(200).json({ success: true, data: formattedBrand });
});

export const createBrand = asyncHandler(async (req, res) => {
  const { name, code, branchId: targetBranchId } = req.body;
  const { branchId: userBranchId, _id: adminId, role } = req.user;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng cung cấp tên thương hiệu" });
  }

  const finalBranchId =
    role === "admin" && targetBranchId ? targetBranchId : userBranchId;

  if (!finalBranchId) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Vui lòng chọn chi nhánh cho thương hiệu",
      });
  }

  let finalCode = code || (await generateUniqueBrandCode(name));

  const existing = await Brand.findOne({
    code: finalCode,
    branchId: finalBranchId,
  });

  if (existing) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Mã thương hiệu đã tồn tại trong chi nhánh này",
      });
  }

  const brandData = { ...req.body };
  delete brandData.branchId;

  const brand = await Brand.create({
    ...brandData,
    code: finalCode,
    branchId: finalBranchId,
    createdBy: adminId,
  });

  res.status(201).json({
    success: true,
    message: "Tạo thương hiệu thành công",
    data: brand,
  });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const { branchId: userBranchId, _id: adminId, role } = req.user;
  const { branchId: targetBranchId } = req.body;

  const filter =
    role === "admin"
      ? { _id: req.params.id }
      : { _id: req.params.id, branchId: userBranchId };

  const brand = await Brand.findOne(filter);

  if (!brand) {
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy thương hiệu" });
  }

  const finalBranchId =
    role === "admin" && targetBranchId ? targetBranchId : userBranchId;

  if (!finalBranchId) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Vui lòng chọn chi nhánh cho thương hiệu",
      });
  }

  const updateData = { ...req.body };
  delete updateData.branchId;

  updateData.branchId = finalBranchId;
  updateData.updatedBy = adminId;

  try {
    const updated = await Brand.findOneAndUpdate(
      { _id: brand._id },
      updateData,
      {
        new: true,
        runValidators: false,
      }
    );

    res
      .status(200)
      .json({ success: true, message: "Cập nhật thành công", data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thương hiệu",
      error: error.message,
    });
  }
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const { branchId, role } = req.user;

  const filter =
    role === "admin"
      ? { _id: req.params.id }
      : { _id: req.params.id, branchId };

  const brand = await Brand.findOne(filter);

  if (!brand) {
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy thương hiệu" });
  }

  await brand.deleteOne();
  res
    .status(200)
    .json({ success: true, message: "Xóa thương hiệu thành công" });
});

export const searchBrands = asyncHandler(async (req, res) => {
  const { query = "" } = req.query;
  const { branchId, role } = req.user;

  const regex = new RegExp(query, "i");

  const requestedBranchId = req.query.branchId;

  let baseFilter = {};

  if (role === "admin") {
    if (requestedBranchId) {
      baseFilter.branchId = requestedBranchId;
    }
  } else {
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin chi nhánh của bạn",
      });
    }
    baseFilter.branchId = branchId;
  }

  let searchQuery = Brand.find({
    ...baseFilter,
    $or: [
      { name: { $regex: regex } },
      { code: { $regex: regex } },
      { country: { $regex: regex } },
    ],
  }).sort({ createdAt: -1 });

  searchQuery = searchQuery.populate({
    path: "branchId",
    select: "name",
    model: "Branch",
  });

  const results = await searchQuery;

  const formattedResults = results.map((brand) => {
    const plainBrand = brand.toObject();
    if (plainBrand.branchId && plainBrand.branchId.name) {
      plainBrand.branchName = plainBrand.branchId.name;
    }
    return plainBrand;
  });

  res.status(200).json({ success: true, data: formattedResults });
});

export const resetBrandIndexes = asyncHandler(async (req, res) => {
  try {
    const result = await mongoose.connection.db
      .collection("brands")
      .dropIndexes();

    res.status(200).json({
      success: true,
      message: "Đã reset tất cả indexes của Brand collection",
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi reset indexes",
      error: error.message,
    });
  }
});
