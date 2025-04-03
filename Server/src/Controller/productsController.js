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

    const category = await Category.findById(req.body.productCategory);
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
    } catch (e) {
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
      productCategory: category._id
    });

    const savedProduct = await newProduct.save();
    return res.status(201).json(savedProduct);
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
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Lấy danh sách sản phẩm thất bại", error });
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
      } catch (e) {
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
        productPromoPrice: Number(req.body.productPromoPrice) || 0,
        productWarranty: Number(req.body.productWarranty) || 0,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      product: updatedProduct,
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
    res.status(200).json(product);
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
    return res.status(200).json({
      products,
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
    
    let query = { productCategory: category._id };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const products = await Product.find(query);
    res.status(200).json(products);
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
