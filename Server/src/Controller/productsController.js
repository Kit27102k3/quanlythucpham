/*************  ✨ Windsurf Command 🌟  *************/
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import cloudinary from "../config/cloudinary.js";
import Product from "../Model/Products.js";
import Category from "../Model/Categories.js";
import BestSellingProduct from "../Model/BestSellingProduct.js";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Admin from "../Model/adminModel.js"; // Import Admin model
import {
  sendPushNotification,
  sendNewProductNotification,
} from "../Services/notificationService.js"; // Import thêm sendNewProductNotification

// Thêm hàm kiểm tra và cập nhật trạng thái sản phẩm dựa vào thời hạn giảm giá và hạn sử dụng
export const updateProductExpirations = async () => {
  try {
    const currentDate = new Date();

    // Cập nhật giảm giá của sản phẩm đã hết thời hạn giảm giá
    const discountExpiredProducts = await Product.find({
      discountEndDate: { $lt: currentDate },
      productDiscount: { $gt: 0 },
    });

    for (const product of discountExpiredProducts) {
      product.productDiscount = 0;
      product.productPromoPrice = 0;
      product.discountStartDate = null;
      product.discountEndDate = null;
      await product.save();
      console.log(`Đã cập nhật giá gốc cho sản phẩm: ${product.productName}`);
    }

    // Cập nhật trạng thái sản phẩm đã hết hạn sử dụng
    const expiryDateProducts = await Product.find({
      expiryDate: { $lt: currentDate },
      productStatus: { $ne: "Hết hàng" },
    });

    for (const product of expiryDateProducts) {
      product.productStatus = "Hết hàng";
      product.productStock = 0;
      await product.save();
      console.log(
        `Đã cập nhật trạng thái "Hết hàng" cho sản phẩm: ${product.productName}`
      );
    }

    return {
      discountUpdated: discountExpiredProducts.length,
      expiryUpdated: expiryDateProducts.length,
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật hạn sản phẩm:", error);
    return { error: error.message };
  }
};

export const createProduct = async (req, res) => {
  try {
    // Kiểm tra nếu không có imageUrls
    if (!req.body.imageUrls || req.body.imageUrls.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng tải lên ít nhất một hình ảnh" });
    }

    const category = await Category.findOne({
      nameCategory: req.body.productCategory,
    });
    if (!category) {
      return res
        .status(400)
        .json({ message: "Danh mục sản phẩm không tồn tại" });
    }

    // Sử dụng URLs đã được upload thông qua Cloudinary widget
    const uploadedUrls = Array.isArray(req.body.imageUrls)
      ? req.body.imageUrls
      : [req.body.imageUrls];

    let descriptions = [];
    try {
      descriptions =
        typeof req.body.productDescription === "string"
          ? JSON.parse(req.body.productDescription)
          : req.body.productDescription;
    } catch (error) {
      descriptions = req.body.productDescription.split(",");
    }

    // Xử lý thông tin ngày bắt đầu và kết thúc giảm giá
    let discountStartDate = null;
    let discountEndDate = null;

    if (req.body.discountStartDate) {
      discountStartDate = new Date(req.body.discountStartDate);
    }

    if (req.body.discountEndDate) {
      discountEndDate = new Date(req.body.discountEndDate);
    }

    // Xử lý hạn sử dụng
    let expiryDate = null;
    let productStatus = req.body.productStatus || "Còn hàng";

    if (req.body.expiryDate) {
      expiryDate = new Date(req.body.expiryDate);

      // Nếu hạn sử dụng đã qua, cập nhật trạng thái thành "Hết hàng"
      if (expiryDate < new Date()) {
        productStatus = "Hết hàng";
      }
    }

    // Validate và chuẩn bị unitOptions nếu có
    let unitOptions = [];
    if (req.body.unitOptions && Array.isArray(req.body.unitOptions)) {
      unitOptions = req.body.unitOptions.map((option) => ({
        unit: option.unit,
        price: option.price,
        conversionRate: option.conversionRate || 1,
        inStock: option.inStock || 0,
        isDefault: option.isDefault || false,
      }));

      // Đảm bảo có ít nhất một đơn vị mặc định
      const hasDefault = unitOptions.some((opt) => opt.isDefault);
      if (!hasDefault && unitOptions.length > 0) {
        unitOptions[0].isDefault = true;
      }
    }

    const newProduct = new Product({
      ...req.body,
      productImages: uploadedUrls,
      productDescription: descriptions,
      productPrice: Number(req.body.productPrice),
      productDiscount: Number(req.body.productDiscount) || 0,
      productStock: Number(req.body.productStock) || 0,
      productWeight: Number(req.body.productWeight) || 0,
      productCategory: category.nameCategory,
      productUnit: req.body.productUnit || "gram",
      discountStartDate,
      discountEndDate,
      expiryDate,
      productStatus,
      unitOptions: unitOptions,
    });

    // Tính productPromoPrice từ productPrice và productDiscount
    if (newProduct.productDiscount > 0) {
      newProduct.productPromoPrice =
        newProduct.productPrice * (1 - newProduct.productDiscount / 100);
    }

    const savedProduct = await newProduct.save();

    // --- Push Notification Logic for New Product ---
    // Gửi thông báo đến tất cả người dùng có đăng ký nhận thông báo
    sendNewProductNotification(savedProduct).catch((error) =>
      console.error("Error sending product notification to users:", error)
    );

    // Notification for admins - vẫn giữ lại
    const adminsToNotify = await Admin.find({
      $or: [
        { role: "admin" }, // Admin gets all notifications
        {
          role: "manager",
          permissions: { $in: ["Quản lý sản phẩm", "products"] },
        }, // Managers with product permission
      ],
      "pushSubscriptions.0": { $exists: true }, // Only users with at least one subscription
    });

    const notificationPayload = {
      title: "Sản phẩm mới",
      body: `Sản phẩm "${savedProduct.productName}" đã được thêm mới.`,
      data: {
        url: `/admin/products/edit/${savedProduct._id}`,
        productId: savedProduct._id,
      },
    };

    for (const admin of adminsToNotify) {
      for (const subscription of admin.pushSubscriptions) {
        sendPushNotification(
          admin._id,
          subscription,
          notificationPayload
        ).catch((error) =>
          console.error("Error sending notification to admin:", error)
        );
      }
    }
    // --- End Push Notification Logic ---

    // Chuyển đổi dữ liệu số thành chuỗi trước khi gửi về client
    const productToSend = savedProduct.toObject();
    productToSend.productPrice = String(productToSend.productPrice);
    productToSend.productDiscount = String(productToSend.productDiscount);
    productToSend.productStock = String(productToSend.productStock);
    productToSend.productWeight = String(productToSend.productWeight);
    productToSend.productPromoPrice = String(productToSend.productPromoPrice);
    productToSend.productWarranty = String(productToSend.productWarranty);

    // Format discount dates
    if (productToSend.discountStartDate) {
      productToSend.discountStartDate =
        productToSend.discountStartDate.toISOString();
    }
    if (productToSend.discountEndDate) {
      productToSend.discountEndDate =
        productToSend.discountEndDate.toISOString();
    }
    // Format expiry date
    if (productToSend.expiryDate) {
      productToSend.expiryDate = productToSend.expiryDate.toISOString();
    }

    return res.status(201).json(productToSend);
  } catch (error) {
    console.error("Error in createProduct:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      errorDetails:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    // Kiểm tra và cập nhật hạn sử dụng và giảm giá trước khi trả về danh sách
    await updateProductExpirations();

    const products = await Product.find();

    // Chuyển đổi dữ liệu số thành chuỗi
    const productsToSend = products.map((product) => {
      const productObj = product.toObject();
      productObj.productPrice = String(productObj.productPrice || "");
      productObj.productDiscount = String(productObj.productDiscount || "");
      productObj.productStock = String(productObj.productStock || "");
      productObj.productWeight = String(productObj.productWeight || "");
      productObj.productPromoPrice = String(productObj.productPromoPrice || "");
      productObj.productWarranty = String(productObj.productWarranty || "");
      return productObj;
    });

    res.status(200).json(productsToSend);
  } catch (error) {
    res.status(500).json({ message: "Lấy danh sách sản phẩm thất bại", error });
  }
};

export const getProductBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    // Kiểm tra và cập nhật hạn sử dụng và giảm giá trước khi trả về sản phẩm
    await updateProductExpirations();

    const products = await Product.find();
    const product = products.find(
      (p) =>
        p.productName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") === slug
    );

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Chuyển đổi dữ liệu số thành chuỗi
    const productToSend = product.toObject();
    productToSend.productPrice = String(productToSend.productPrice || "");
    productToSend.productDiscount = String(productToSend.productDiscount || "");
    productToSend.productStock = String(productToSend.productStock || "");
    productToSend.productWeight = String(productToSend.productWeight || "");
    productToSend.productPromoPrice = String(
      productToSend.productPromoPrice || ""
    );
    productToSend.productWarranty = String(productToSend.productWarranty || "");

    res.status(200).json(productToSend);
  } catch (error) {
    res.status(500).json({ message: "Lấy chi tiết sản phẩm thất bại", error });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Kiểm tra danh mục mới nếu có thay đổi
    if (
      req.body.productCategory &&
      req.body.productCategory !== product.productCategory
    ) {
      const category = await Category.findOne({
        nameCategory: req.body.productCategory,
      });
      if (!category) {
        return res
          .status(400)
          .json({ message: "Danh mục sản phẩm không tồn tại" });
      }
      req.body.productCategory = category.nameCategory;
    }

    // Sử dụng URLs đã được upload thông qua Cloudinary widget
    let newImageUrls = [];
    if (req.body.newImageUrls && req.body.newImageUrls.length > 0) {
      newImageUrls = Array.isArray(req.body.newImageUrls)
        ? req.body.newImageUrls
        : [req.body.newImageUrls];
    }

    let existingImages = product.productImages || [];
    if (req.body.keepImages) {
      const keepImages = Array.isArray(req.body.keepImages)
        ? req.body.keepImages
        : JSON.parse(req.body.keepImages);

      existingImages = existingImages.filter((img) => keepImages.includes(img));

      const imagesToDelete = product.productImages.filter(
        (img) => !keepImages.includes(img)
      );

      // Xóa các ảnh không giữ lại
      await Promise.all(
        imagesToDelete.map((img) => {
          const publicId = img.split("/").pop().split(".")[0];
          return cloudinary.uploader.destroy(`products/${publicId}`);
        })
      );
    }

    let productDescription = product.productDescription;
    if (req.body.productDescription) {
      try {
        productDescription = JSON.parse(req.body.productDescription);
      } catch (error) {
        productDescription = req.body.productDescription
          .split(".")
          .map((desc) => desc.trim())
          .filter((desc) => desc !== "");
      }
    }

    // Xử lý thông tin ngày bắt đầu và kết thúc giảm giá
    let discountStartDate = product.discountStartDate;
    let discountEndDate = product.discountEndDate;

    if (req.body.discountStartDate) {
      discountStartDate = new Date(req.body.discountStartDate);
    } else if (req.body.discountStartDate === null) {
      discountStartDate = null;
    }

    if (req.body.discountEndDate) {
      discountEndDate = new Date(req.body.discountEndDate);
    } else if (req.body.discountEndDate === null) {
      discountEndDate = null;
    }

    // Xử lý hạn sử dụng
    let expiryDate = product.expiryDate;
    let productStatus = req.body.productStatus || product.productStatus;

    if (req.body.expiryDate) {
      expiryDate = new Date(req.body.expiryDate);

      // Nếu hạn sử dụng đã qua, cập nhật trạng thái thành "Hết hàng"
      if (expiryDate < new Date()) {
        productStatus = "Hết hàng";
      }
    } else if (req.body.expiryDate === null) {
      expiryDate = null;
    }

    // Validate và chuẩn bị unitOptions nếu có
    let unitOptions = product.unitOptions || [];
    if (req.body.unitOptions && Array.isArray(req.body.unitOptions)) {
      unitOptions = req.body.unitOptions.map((option) => ({
        unit: option.unit,
        price: option.price,
        conversionRate: option.conversionRate || 1,
        inStock: option.inStock || 0,
        isDefault: option.isDefault || false,
      }));

      // Đảm bảo có ít nhất một đơn vị mặc định
      const hasDefault = unitOptions.some((opt) => opt.isDefault);
      if (!hasDefault && unitOptions.length > 0) {
        unitOptions[0].isDefault = true;
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        ...req.body,
        productImages: [...existingImages, ...newImageUrls],
        productDescription,
        productPrice: Number(req.body.productPrice) || product.productPrice,
        productDiscount:
          Number(req.body.productDiscount) ?? product.productDiscount,
        productStock: Number(req.body.productStock) ?? product.productStock,
        productWeight: Number(req.body.productWeight) ?? product.productWeight,
        productWarranty:
          Number(req.body.productWarranty) ?? product.productWarranty,
        productUnit: req.body.productUnit || product.productUnit || "gram",
        discountStartDate,
        discountEndDate,
        expiryDate,
        productStatus,
        unitOptions: unitOptions,
      },
      { new: true }
    );

    // Tính lại productPromoPrice sau khi cập nhật
    if (updatedProduct.productDiscount > 0) {
      updatedProduct.productPromoPrice =
        updatedProduct.productPrice *
        (1 - updatedProduct.productDiscount / 100);
      await updatedProduct.save();
    } else {
      updatedProduct.productPromoPrice = 0;
      await updatedProduct.save();
    }

    // Chuyển đổi dữ liệu số thành chuỗi trước khi gửi về client
    const productToSend = updatedProduct.toObject();
    productToSend.productPrice = String(productToSend.productPrice);
    productToSend.productDiscount = String(productToSend.productDiscount);
    productToSend.productStock = String(productToSend.productStock);
    productToSend.productWeight = String(productToSend.productWeight);
    productToSend.productPromoPrice = String(productToSend.productPromoPrice);
    productToSend.productWarranty = String(productToSend.productWarranty);

    // Format discount dates
    if (productToSend.discountStartDate) {
      productToSend.discountStartDate =
        productToSend.discountStartDate.toISOString();
    }
    if (productToSend.discountEndDate) {
      productToSend.discountEndDate =
        productToSend.discountEndDate.toISOString();
    }
    // Format expiry date
    if (productToSend.expiryDate) {
      productToSend.expiryDate = productToSend.expiryDate.toISOString();
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      product: productToSend,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Cập nhật sản phẩm thất bại",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    res.status(200).json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    res.status(500).json({ message: "Xóa sản phẩm thất bại", error });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    // Kiểm tra và cập nhật hạn sử dụng và giảm giá trước khi trả về chi tiết sản phẩm
    await updateProductExpirations();

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Chuyển đổi dữ liệu số thành chuỗi
    const productToSend = product.toObject();
    productToSend.productPrice = String(productToSend.productPrice || "");
    productToSend.productDiscount = String(productToSend.productDiscount || "");
    productToSend.productStock = String(productToSend.productStock || "");
    productToSend.productWeight = String(productToSend.productWeight || "");
    productToSend.productPromoPrice = String(
      productToSend.productPromoPrice || ""
    );
    productToSend.productWarranty = String(productToSend.productWarranty || "");

    res.status(200).json(productToSend);
  } catch (error) {
    res.status(500).json({ message: "Lấy chi tiết sản phẩm thất bại", error });
  }
};

// Thêm API endpoint để kiểm tra và cập nhật hạn sử dụng và giảm giá
export const checkAndUpdateExpirations = async (req, res) => {
  try {
    const result = await updateProductExpirations();
    res.status(200).json({
      success: true,
      message: "Kiểm tra và cập nhật hạn sản phẩm thành công",
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cập nhật hạn sản phẩm thất bại",
      error: error.message,
    });
  }
};

export const searchProducts = async (req, res) => {
  try {
    let { name, page = 1, limit = 10 } = req.query;
    page = parseInt(page) > 0 ? parseInt(page) : 1;
    limit = Math.min(parseInt(limit) > 0 ? parseInt(limit) : 10, 100);

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Invalid search input" });
    }
    let searchQuery = {
      $or: [
        { productName: { $regex: name.trim(), $options: "i" } },
        { productInfo: { $regex: name.trim(), $options: "i" } },
        { productCategory: { $regex: name.trim(), $options: "i" } },
        { productBrand: { $regex: name.trim(), $options: "i" } },
        { productCode: { $regex: name.trim(), $options: "i" } },
        { productDetails: { $regex: name.trim(), $options: "i" } },
        { productOrigin: { $regex: name.trim(), $options: "i" } },
      ],
    };
    const products = await Product.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await Product.countDocuments(searchQuery);

    // Chuyển đổi dữ liệu số thành chuỗi
    const productsToSend = products.map((product) => {
      product.productPrice = String(product.productPrice || "");
      product.productDiscount = String(product.productDiscount || "");
      product.productStock = String(product.productStock || "");
      product.productWeight = String(product.productWeight || "");
      product.productPromoPrice = String(product.productPromoPrice || "");
      product.productWarranty = String(product.productWarranty || "");
      return product;
    });

    return res.status(200).json({
      products: productsToSend,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error.name === "CastError" && error.path === "_id") {
      return res.status(400).json({ message: "Invalid search parameter" });
    }
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getProductByCategory = async (req, res) => {
  try {
    const categoryName = req.params.category;
    const excludeId = req.query.excludeId;

    let query = { productCategory: categoryName };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const products = await Product.find(query);

    // Chuyển đổi dữ liệu số thành chuỗi
    const productsToSend = products.map((product) => {
      const productObj = product.toObject();
      productObj.productPrice = String(productObj.productPrice || "");
      productObj.productDiscount = String(productObj.productDiscount || "");
      productObj.productStock = String(productObj.productStock || "");
      productObj.productWeight = String(productObj.productWeight || "");
      productObj.productPromoPrice = String(productObj.productPromoPrice || "");
      productObj.productWarranty = String(productObj.productWarranty || "");
      return productObj;
    });

    res.status(200).json(productsToSend);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lấy sản phẩm theo danh mục thất bại", error });
  }
};

export const updateProductCategory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { categoryId } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { productCategory: categoryId },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật danh mục sản phẩm thành công",
      product,
    });
  } catch (error) {
    console.error("Error in updateProductCategory:", error);
    res
      .status(500)
      .json({ message: "Cập nhật danh mục sản phẩm thất bại", error });
  }
};

// Lấy danh sách sản phẩm bán chạy
export const getBestSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const period = req.query.period || "all";

    // Tự xử lý lấy sản phẩm thường thay vì dùng Model.getBestSellers
    let bestSellingProducts = [];

    try {
      bestSellingProducts = await BestSellingProduct.find()
        .sort({ soldCount: -1 })
        .limit(limit)
        .populate({
          path: "productId",
          select:
            "productName productPrice productStatus productImages productDiscount productStock productCategory",
        });
    } catch (modelError) {
      console.error(
        "[getBestSellingProducts] Lỗi khi truy vấn model BestSellingProduct:",
        modelError
      );
    }

    // Nếu không có sản phẩm bán chạy, lấy sản phẩm thông thường
    if (!bestSellingProducts || bestSellingProducts.length === 0) {
      console.log(
        "[getBestSellingProducts] Không có dữ liệu sản phẩm bán chạy, lấy sản phẩm thông thường..."
      );

      try {
        const normalProducts = await Product.find({
          productStatus: { $ne: "Hết hàng" },
          productStock: { $gt: 0 },
        })
          .sort({ createdAt: -1 })
          .limit(limit);

        console.log(
          `[getBestSellingProducts] Tìm thấy ${normalProducts.length} sản phẩm thông thường để thay thế`
        );

        return res.status(200).json({
          success: true,
          message: "Trả về sản phẩm thông thường thay thế",
          data: normalProducts,
        });
      } catch (productError) {
        console.error(
          "[getBestSellingProducts] Lỗi khi lấy sản phẩm thông thường:",
          productError
        );
        return res.status(200).json({
          success: true,
          message: "Không tìm thấy sản phẩm nào",
          data: [],
        });
      }
    }

    // Format dữ liệu trả về
    const formattedProducts = bestSellingProducts
      .map((item) => {
        // Nếu sản phẩm đã được populate đầy đủ
        if (item.productId && typeof item.productId === "object") {
          const product = {
            ...item.productId.toObject(),
            soldCount: item.soldCount,
            totalRevenue: item.totalRevenue,
          };
          return product;
        }
        // Trường hợp productId chỉ là id, không được populate
        return item;
      })
      .filter((item) => item !== null && item !== undefined);

    console.log(
      `[getBestSellingProducts] Trả về ${formattedProducts.length} sản phẩm bán chạy đã định dạng`
    );

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm bán chạy thành công",
      data: formattedProducts,
    });
  } catch (error) {
    console.error("[getBestSellingProducts] Lỗi:", error.message);
    return res.status(200).json({
      success: true,
      message: "Đã xảy ra lỗi khi lấy sản phẩm bán chạy",
      data: [], // Trả về mảng rỗng thay vì lỗi 500
    });
  }
};

// Lấy danh sách sản phẩm có đánh giá cao nhất
export const getTopRatedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;

    // Tìm sản phẩm có đánh giá cao nhất
    const topRatedProducts = await Product.find({
      productStatus: { $ne: "Hết hàng" },
      productStock: { $gt: 0 },
      averageRating: { $gt: 0 }, // Chỉ lấy sản phẩm có đánh giá
    })
      .sort({ averageRating: -1, numOfReviews: -1 }) // Sắp xếp theo đánh giá cao nhất, ưu tiên sản phẩm có nhiều đánh giá
      .limit(limit)
      .select(
        "productName productPrice productStatus productImages productDiscount productStock productCategory averageRating numOfReviews"
      );

    // Nếu không có sản phẩm có đánh giá, lấy sản phẩm thông thường
    if (!topRatedProducts || topRatedProducts.length === 0) {
      try {
        const normalProducts = await Product.find({
          productStatus: { $ne: "Hết hàng" },
          productStock: { $gt: 0 },
        })
          .sort({ createdAt: -1 })
          .limit(limit);

        return res.status(200).json({
          success: true,
          message: "Trả về sản phẩm thông thường thay thế",
          data: normalProducts,
        });
      } catch (productError) {
        return res.status(200).json({
          success: true,
          message: "Không tìm thấy sản phẩm nào",
          data: [],
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm có đánh giá cao nhất thành công",
      data: topRatedProducts,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      message: "Đã xảy ra lỗi khi lấy sản phẩm có đánh giá cao",
      data: [], // Trả về mảng rỗng thay vì lỗi 500
    });
  }
};

/*******  7cab8ad6-4345-4fb6-92ff-2129f8b85842  *******/
