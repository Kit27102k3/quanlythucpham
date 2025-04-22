/*************  ✨ Windsurf Command 🌟  *************/
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import cloudinary from "../config/cloudinary.js";
import Product from "../Model/Products.js";
import Category from "../Model/Categories.js";
import BestSellingProduct from "../Model/BestSellingProduct.js";
import fs from "fs";
import path from "path";

export const createProduct = async (req, res) => {
  try {
    // Kiểm tra nếu không có imageUrls
    if (!req.body.imageUrls || req.body.imageUrls.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng tải lên ít nhất một hình ảnh" });
    }

    const category = await Category.findOne({ nameCategory: req.body.productCategory });
    if (!category) {
      return res.status(400).json({ message: "Danh mục sản phẩm không tồn tại" });
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
    } catch {
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
      discountEndDate
    });

    // Tính productPromoPrice từ productPrice và productDiscount
    if (newProduct.productDiscount > 0) {
      newProduct.productPromoPrice = newProduct.productPrice * (1 - newProduct.productDiscount / 100);
    }

    const savedProduct = await newProduct.save();
    
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
      productToSend.discountStartDate = productToSend.discountStartDate.toISOString();
    }
    if (productToSend.discountEndDate) {
      productToSend.discountEndDate = productToSend.discountEndDate.toISOString();
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
    const products = await Product.find();
    
    // Chuyển đổi dữ liệu số thành chuỗi
    const productsToSend = products.map(product => {
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
    const products = await Product.find();
    const product = products.find(p => 
      p.productName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === slug
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
    productToSend.productPromoPrice = String(productToSend.productPromoPrice || "");
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
    if (req.body.productCategory && req.body.productCategory !== product.productCategory) {
      const category = await Category.findOne({ nameCategory: req.body.productCategory });
      if (!category) {
        return res.status(400).json({ message: "Danh mục sản phẩm không tồn tại" });
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
      } catch {
        productDescription = req.body.productDescription
          .split(".")
          .map((desc) => desc.trim())
          .filter((desc) => desc !== "");
      }
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

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        ...req.body,
        productImages: [...existingImages, ...newImageUrls],
        productDescription,
        productPrice: Number(req.body.productPrice),
        productDiscount: Number(req.body.productDiscount) || 0,
        productStock: Number(req.body.productStock) || 0,
        productWeight: Number(req.body.productWeight) || 0,
        productWarranty: Number(req.body.productWarranty) || 0,
        productUnit: req.body.productUnit || product.productUnit || "gram",
        ...(discountStartDate && { discountStartDate }),
        ...(discountEndDate && { discountEndDate })
      },
      { new: true }
    );

    // Tính lại productPromoPrice sau khi cập nhật
    if (updatedProduct.productDiscount > 0) {
      updatedProduct.productPromoPrice = updatedProduct.productPrice * (1 - updatedProduct.productDiscount / 100);
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
      productToSend.discountStartDate = productToSend.discountStartDate.toISOString();
    }
    if (productToSend.discountEndDate) {
      productToSend.discountEndDate = productToSend.discountEndDate.toISOString();
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
    productToSend.productPromoPrice = String(productToSend.productPromoPrice || "");
    productToSend.productWarranty = String(productToSend.productWarranty || "");
    
    res.status(200).json(productToSend);
  } catch (error) {
    res.status(500).json({ message: "Lấy chi tiết sản phẩm thất bại", error });
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
    const productsToSend = products.map(product => {
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
    const productsToSend = products.map(product => {
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
    res.status(500).json({ message: "Lấy sản phẩm theo danh mục thất bại", error });
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
      product
    });
  } catch (error) {
    console.error("Error in updateProductCategory:", error);
    res.status(500).json({ message: "Cập nhật danh mục sản phẩm thất bại", error });
  }
};

// Lấy danh sách sản phẩm bán chạy
export const getBestSellingProducts = async (req, res) => {
  try {
    const { limit = 10, period = 'all' } = req.query;
    
    // Chuyển đổi limit từ string sang number
    const limitNum = parseInt(limit, 10) || 10;
    
    // Lấy danh sách sản phẩm bán chạy với giới hạn và khoảng thời gian
    const bestSellingProducts = await BestSellingProduct.getBestSellers(limitNum, period);
    
    // Kiểm tra xem các sản phẩm có còn tồn tại và còn hàng không
    const activeProducts = bestSellingProducts.filter(item => 
      item.productId && item.productId.productStatus !== "Hết hàng"
    );
    
    res.status(200).json({
      success: true,
      count: activeProducts.length,
      data: activeProducts
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm bán chạy:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách sản phẩm bán chạy",
      error: error.message
    });
  }
};

/*******  7cab8ad6-4345-4fb6-92ff-2129f8b85842  *******/