// server/controllers/productController.js
import Product from "../Model/Products/Products.js";

// Tạo sản phẩm mới
export const createProduct = async (req, res) => {
  try {
    const {
      productName,
      productPrice,
      productCategory,
      productDescription,
      productBrand,
      productStatus,
      productDiscount,
      productInfo,
      productDetails,
      productStock,
      productCode,
      productWeight,
      productPromoPrice,
      productWarranty,
      productOrigin,
      productIntroduction,
    } = req.body;

    const productImages = req.files
      ? req.files.map((file) => file.filename)
      : [];

    if (!productName || !productPrice) {
      return res.status(400).json({ message: "Thiếu thông tin sản phẩm" });
    }

    const newProduct = new Product({
      productName,
      productPrice,
      productImages,
      productCategory,
      productDescription,
      productBrand,
      productStatus,
      productDiscount,
      productInfo,
      productDetails,
      productStock,
      productCode,
      productWeight,
      productPromoPrice,
      productWarranty,
      productOrigin,
      productIntroduction,
    });

    await newProduct.save();
    res.status(201).json({ product: newProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả sản phẩm
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Lấy danh sách sản phẩm thất bại", error });
  }
};

// Cập nhật sản phẩm
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    res.status(200).json({ message: "Cập nhật sản phẩm thành công", product });
  } catch (error) {
    res.status(400).json({ message: "Cập nhật sản phẩm thất bại", error });
  }
};

// Xóa sản phẩm
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
    const category = decodeURIComponent(req.params.category);
    const products = await Product.find({ productCategory: category });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
