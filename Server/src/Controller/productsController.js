/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import cloudinary from "../config/cloudinary.js";
import Product from "../Model/Products.js";
import Category from "../Model/Categories.js";
import fs from "fs";
import path from "path";

export const createProduct = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng tải lên ít nhất một hình ảnh" });
    }

    const category = await Category.findOne({ nameCategory: req.body.productCategory });
    if (!category) {
      return res.status(400).json({ message: "Danh mục sản phẩm không tồn tại" });
    }

    const uploadedUrls = [];
    for (const file of req.files) {
      try {
        if (!fs.existsSync(file.path)) {
          throw new Error(`File not found: ${file.path}`);
        }
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
          resource_type: "auto",
          use_filename: true,
          unique_filename: false,
        });
        uploadedUrls.push(result.secure_url);
        fs.unlinkSync(file.path);
      } catch (uploadError) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw new Error(`Upload ảnh thất bại: ${uploadError.message}`);
      }
    }

    let descriptions = [];
    try {
      descriptions =
        typeof req.body.productDescription === "string"
          ? JSON.parse(req.body.productDescription)
          : req.body.productDescription;
    } catch {
      descriptions = req.body.productDescription.split(",");
    }

    const newProduct = new Product({
      ...req.body,
      productImages: uploadedUrls,
      productDescription: descriptions,
      productPrice: Number(req.body.productPrice),
      productDiscount: Number(req.body.productDiscount) || 0,
      productStock: Number(req.body.productStock) || 0,
      productWeight: Number(req.body.productWeight) || 0,
      productCategory: category.nameCategory
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
    
    return res.status(201).json(productToSend);
  } catch (error) {
    console.error("Error in createProduct:", error);

    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
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

    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadResults = await Promise.all(
        req.files.map((file) => {
          return cloudinary.uploader.upload(file.path, {
            folder: "products",
            resource_type: "image",
          });
        })
      );
      newImageUrls = uploadResults.map((result) => result.secure_url);

      req.files.forEach((file) => {
        fs.unlinkSync(file.path);
      });
    }

    let existingImages = product.productImages || [];
    if (req.body.keepImages) {
      const keepImages = JSON.parse(req.body.keepImages);
      existingImages = existingImages.filter((img) => keepImages.includes(img));

      const imagesToDelete = product.productImages.filter(
        (img) => !keepImages.includes(img)
      );

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

    res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      product: productToSend,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);

    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }

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
    const category = await Category.findOne({ nameCategory: categoryName });
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    
    let query = { productCategory: category.nameCategory };
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
