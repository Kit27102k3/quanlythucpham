"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.updateProductExpirations = exports.updateProductCategory = exports.updateProduct = exports.searchProducts = exports.getTopRatedProducts = exports.getProductBySlug = exports.getProductById = exports.getProductByCategory = exports.getBestSellingProducts = exports.getAllProducts = exports.deleteProduct = exports.createProduct = exports.checkAndUpdateExpirations = void 0;


var _cloudinary = _interopRequireDefault(require("../config/cloudinary.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _Categories = _interopRequireDefault(require("../Model/Categories.js"));
var _BestSellingProduct = _interopRequireDefault(require("../Model/BestSellingProduct.js"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _adminModel = _interopRequireDefault(require("../Model/adminModel.js"));
var _notificationService = require("../Services/notificationService.js"); /*************  ✨ Windsurf Command 🌟  *************/ /* eslint-disable no-unused-vars */ /* eslint-disable no-undef */ // Import Admin model


// Import thêm sendNewProductNotification

// Thêm hàm kiểm tra và cập nhật trạng thái sản phẩm dựa vào thời hạn giảm giá và hạn sử dụng
const updateProductExpirations = async () => {
  try {
    const currentDate = new Date();

    // Cập nhật giảm giá của sản phẩm đã hết thời hạn giảm giá
    const discountExpiredProducts = await _Products.default.find({
      discountEndDate: { $lt: currentDate },
      productDiscount: { $gt: 0 }
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
    const expiryDateProducts = await _Products.default.find({
      expiryDate: { $lt: currentDate },
      productStatus: { $ne: "Hết hàng" }
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
      expiryUpdated: expiryDateProducts.length
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật hạn sản phẩm:", error);
    return { error: error.message };
  }
};exports.updateProductExpirations = updateProductExpirations;

const createProduct = async (req, res) => {
  try {
    // Kiểm tra nếu không có imageUrls
    if (!req.body.imageUrls || req.body.imageUrls.length === 0) {
      return res.
      status(400).
      json({ message: "Vui lòng tải lên ít nhất một hình ảnh" });
    }

    const category = await _Categories.default.findOne({
      nameCategory: req.body.productCategory
    });
    if (!category) {
      return res.
      status(400).
      json({ message: "Danh mục sản phẩm không tồn tại" });
    }

    // Sử dụng URLs đã được upload thông qua Cloudinary widget
    const uploadedUrls = Array.isArray(req.body.imageUrls) ?
    req.body.imageUrls :
    [req.body.imageUrls];

    let descriptions = [];
    try {
      descriptions =
      typeof req.body.productDescription === "string" ?
      JSON.parse(req.body.productDescription) :
      req.body.productDescription;
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
        isDefault: option.isDefault || false
      }));

      // Đảm bảo có ít nhất một đơn vị mặc định
      const hasDefault = unitOptions.some((opt) => opt.isDefault);
      if (!hasDefault && unitOptions.length > 0) {
        unitOptions[0].isDefault = true;
      }
    }

    const newProduct = new _Products.default({
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
      unitOptions: unitOptions
    });

    // Tính productPromoPrice từ productPrice và productDiscount
    if (newProduct.productDiscount > 0) {
      newProduct.productPromoPrice =
      newProduct.productPrice * (1 - newProduct.productDiscount / 100);
    }

    const savedProduct = await newProduct.save();

    // --- Push Notification Logic for New Product ---
    // Gửi thông báo đến tất cả người dùng có đăng ký nhận thông báo
    (0, _notificationService.sendNewProductNotification)(savedProduct).catch((error) =>
    console.error("Error sending product notification to users:", error)
    );

    // Notification for admins - vẫn giữ lại
    const adminsToNotify = await _adminModel.default.find({
      $or: [
      { role: "admin" }, // Admin gets all notifications
      {
        role: "manager",
        permissions: { $in: ["Quản lý sản phẩm", "products"] }
      } // Managers with product permission
      ],
      "pushSubscriptions.0": { $exists: true } // Only users with at least one subscription
    });

    const notificationPayload = {
      title: "Sản phẩm mới",
      body: `Sản phẩm "${savedProduct.productName}" đã được thêm mới.`,
      data: {
        url: `/admin/products/edit/${savedProduct._id}`,
        productId: savedProduct._id
      }
    };

    for (const admin of adminsToNotify) {
      for (const subscription of admin.pushSubscriptions) {
        (0, _notificationService.sendPushNotification)(
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
      process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};exports.createProduct = createProduct;

const getAllProducts = async (req, res) => {
  try {
    // Kiểm tra và cập nhật hạn sử dụng và giảm giá trước khi trả về danh sách
    await updateProductExpirations();

    const products = await _Products.default.find();

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
};exports.getAllProducts = getAllProducts;

const getProductBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    // Kiểm tra và cập nhật hạn sử dụng và giảm giá trước khi trả về sản phẩm
    await updateProductExpirations();

    const products = await _Products.default.find();
    const product = products.find(
      (p) =>
      p.productName.
      toLowerCase().
      normalize("NFD").
      replace(/[\u0300-\u036f]/g, "").
      replace(/[^a-z0-9]+/g, "-").
      replace(/(^-|-$)/g, "") === slug
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
};exports.getProductBySlug = getProductBySlug;

const updateProduct = async (req, res) => {
  const { id } = req.params;
  try {var _Number, _Number2, _Number3, _Number4;
    const product = await _Products.default.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Kiểm tra danh mục mới nếu có thay đổi
    if (
    req.body.productCategory &&
    req.body.productCategory !== product.productCategory)
    {
      const category = await _Categories.default.findOne({
        nameCategory: req.body.productCategory
      });
      if (!category) {
        return res.
        status(400).
        json({ message: "Danh mục sản phẩm không tồn tại" });
      }
      req.body.productCategory = category.nameCategory;
    }

    // Sử dụng URLs đã được upload thông qua Cloudinary widget
    let newImageUrls = [];
    if (req.body.newImageUrls && req.body.newImageUrls.length > 0) {
      newImageUrls = Array.isArray(req.body.newImageUrls) ?
      req.body.newImageUrls :
      [req.body.newImageUrls];
    }

    let existingImages = product.productImages || [];
    if (req.body.keepImages) {
      const keepImages = Array.isArray(req.body.keepImages) ?
      req.body.keepImages :
      JSON.parse(req.body.keepImages);

      existingImages = existingImages.filter((img) => keepImages.includes(img));

      const imagesToDelete = product.productImages.filter(
        (img) => !keepImages.includes(img)
      );

      // Xóa các ảnh không giữ lại
      await Promise.all(
        imagesToDelete.map((img) => {
          const publicId = img.split("/").pop().split(".")[0];
          return _cloudinary.default.uploader.destroy(`products/${publicId}`);
        })
      );
    }

    let productDescription = product.productDescription;
    if (req.body.productDescription) {
      try {
        productDescription = JSON.parse(req.body.productDescription);
      } catch (error) {
        productDescription = req.body.productDescription.
        split(".").
        map((desc) => desc.trim()).
        filter((desc) => desc !== "");
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
        isDefault: option.isDefault || false
      }));

      // Đảm bảo có ít nhất một đơn vị mặc định
      const hasDefault = unitOptions.some((opt) => opt.isDefault);
      if (!hasDefault && unitOptions.length > 0) {
        unitOptions[0].isDefault = true;
      }
    }

    const updatedProduct = await _Products.default.findByIdAndUpdate(
      id,
      {
        ...req.body,
        productImages: [...existingImages, ...newImageUrls],
        productDescription,
        productPrice: Number(req.body.productPrice) || product.productPrice,
        productDiscount: (_Number =
        Number(req.body.productDiscount)) !== null && _Number !== void 0 ? _Number : product.productDiscount,
        productStock: (_Number2 = Number(req.body.productStock)) !== null && _Number2 !== void 0 ? _Number2 : product.productStock,
        productWeight: (_Number3 = Number(req.body.productWeight)) !== null && _Number3 !== void 0 ? _Number3 : product.productWeight,
        productWarranty: (_Number4 =
        Number(req.body.productWarranty)) !== null && _Number4 !== void 0 ? _Number4 : product.productWarranty,
        productUnit: req.body.productUnit || product.productUnit || "gram",
        discountStartDate,
        discountEndDate,
        expiryDate,
        productStatus,
        unitOptions: unitOptions
      },
      { new: true }
    );

    // Tính lại productPromoPrice sau khi cập nhật
    if (updatedProduct.productDiscount > 0) {
      updatedProduct.productPromoPrice =
      updatedProduct.productPrice * (
      1 - updatedProduct.productDiscount / 100);
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
      product: productToSend
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Cập nhật sản phẩm thất bại",
      error: error.message
    });
  }
};exports.updateProduct = updateProduct;

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await _Products.default.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    res.status(200).json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    res.status(500).json({ message: "Xóa sản phẩm thất bại", error });
  }
};exports.deleteProduct = deleteProduct;

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    // Kiểm tra và cập nhật hạn sử dụng và giảm giá trước khi trả về chi tiết sản phẩm
    await updateProductExpirations();

    const product = await _Products.default.findById(id);
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
exports.getProductById = getProductById;const checkAndUpdateExpirations = async (req, res) => {
  try {
    const result = await updateProductExpirations();
    res.status(200).json({
      success: true,
      message: "Kiểm tra và cập nhật hạn sản phẩm thành công",
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cập nhật hạn sản phẩm thất bại",
      error: error.message
    });
  }
};exports.checkAndUpdateExpirations = checkAndUpdateExpirations;

const searchProducts = async (req, res) => {
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
      { productOrigin: { $regex: name.trim(), $options: "i" } }]

    };
    const products = await _Products.default.find(searchQuery).
    sort({ createdAt: -1 }).
    skip((page - 1) * limit).
    limit(limit).
    lean();
    const total = await _Products.default.countDocuments(searchQuery);

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
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    if (error.name === "CastError" && error.path === "_id") {
      return res.status(400).json({ message: "Invalid search parameter" });
    }
    return res.
    status(500).
    json({ message: "Internal server error", error: error.message });
  }
};exports.searchProducts = searchProducts;

const getProductByCategory = async (req, res) => {
  try {
    const categoryName = req.params.category;
    const excludeId = req.query.excludeId;

    let query = { productCategory: categoryName };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const products = await _Products.default.find(query);

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
    res.
    status(500).
    json({ message: "Lấy sản phẩm theo danh mục thất bại", error });
  }
};exports.getProductByCategory = getProductByCategory;

const updateProductCategory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { categoryId } = req.body;

    const category = await _Categories.default.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    const product = await _Products.default.findByIdAndUpdate(
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
    res.
    status(500).
    json({ message: "Cập nhật danh mục sản phẩm thất bại", error });
  }
};

// Lấy danh sách sản phẩm bán chạy
exports.updateProductCategory = updateProductCategory;const getBestSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const period = req.query.period || "all";

    // Tự xử lý lấy sản phẩm thường thay vì dùng Model.getBestSellers
    let bestSellingProducts = [];

    try {
      bestSellingProducts = await _BestSellingProduct.default.find().
      sort({ soldCount: -1 }).
      limit(limit).
      populate({
        path: "productId",
        select:
        "productName productPrice productStatus productImages productDiscount productStock productCategory"
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
        const normalProducts = await _Products.default.find({
          productStatus: { $ne: "Hết hàng" },
          productStock: { $gt: 0 }
        }).
        sort({ createdAt: -1 }).
        limit(limit);

        console.log(
          `[getBestSellingProducts] Tìm thấy ${normalProducts.length} sản phẩm thông thường để thay thế`
        );

        return res.status(200).json({
          success: true,
          message: "Trả về sản phẩm thông thường thay thế",
          data: normalProducts
        });
      } catch (productError) {
        console.error(
          "[getBestSellingProducts] Lỗi khi lấy sản phẩm thông thường:",
          productError
        );
        return res.status(200).json({
          success: true,
          message: "Không tìm thấy sản phẩm nào",
          data: []
        });
      }
    }

    // Format dữ liệu trả về
    const formattedProducts = bestSellingProducts.
    map((item) => {
      // Nếu sản phẩm đã được populate đầy đủ
      if (item.productId && typeof item.productId === "object") {
        const product = {
          ...item.productId.toObject(),
          soldCount: item.soldCount,
          totalRevenue: item.totalRevenue
        };
        return product;
      }
      // Trường hợp productId chỉ là id, không được populate
      return item;
    }).
    filter((item) => item !== null && item !== undefined);

    console.log(
      `[getBestSellingProducts] Trả về ${formattedProducts.length} sản phẩm bán chạy đã định dạng`
    );

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm bán chạy thành công",
      data: formattedProducts
    });
  } catch (error) {
    console.error("[getBestSellingProducts] Lỗi:", error.message);
    return res.status(200).json({
      success: true,
      message: "Đã xảy ra lỗi khi lấy sản phẩm bán chạy",
      data: [] // Trả về mảng rỗng thay vì lỗi 500
    });
  }
};

// Lấy danh sách sản phẩm có đánh giá cao nhất
exports.getBestSellingProducts = getBestSellingProducts;const getTopRatedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;

    // Tìm sản phẩm có đánh giá cao nhất
    const topRatedProducts = await _Products.default.find({
      productStatus: { $ne: "Hết hàng" },
      productStock: { $gt: 0 },
      averageRating: { $gt: 0 } // Chỉ lấy sản phẩm có đánh giá
    }).
    sort({ averageRating: -1, numOfReviews: -1 }) // Sắp xếp theo đánh giá cao nhất, ưu tiên sản phẩm có nhiều đánh giá
    .limit(limit).
    select(
      "productName productPrice productStatus productImages productDiscount productStock productCategory averageRating numOfReviews"
    );

    // Nếu không có sản phẩm có đánh giá, lấy sản phẩm thông thường
    if (!topRatedProducts || topRatedProducts.length === 0) {
      try {
        const normalProducts = await _Products.default.find({
          productStatus: { $ne: "Hết hàng" },
          productStock: { $gt: 0 }
        }).
        sort({ createdAt: -1 }).
        limit(limit);

        return res.status(200).json({
          success: true,
          message: "Trả về sản phẩm thông thường thay thế",
          data: normalProducts
        });
      } catch (productError) {
        return res.status(200).json({
          success: true,
          message: "Không tìm thấy sản phẩm nào",
          data: []
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm có đánh giá cao nhất thành công",
      data: topRatedProducts
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      message: "Đã xảy ra lỗi khi lấy sản phẩm có đánh giá cao",
      data: [] // Trả về mảng rỗng thay vì lỗi 500
    });
  }
};

/*******  7cab8ad6-4345-4fb6-92ff-2129f8b85842  *******/exports.getTopRatedProducts = getTopRatedProducts;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfY2xvdWRpbmFyeSIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX1Byb2R1Y3RzIiwiX0NhdGVnb3JpZXMiLCJfQmVzdFNlbGxpbmdQcm9kdWN0IiwiX2ZzIiwiX3BhdGgiLCJfbW9uZ29vc2UiLCJfYWRtaW5Nb2RlbCIsIl9ub3RpZmljYXRpb25TZXJ2aWNlIiwidXBkYXRlUHJvZHVjdEV4cGlyYXRpb25zIiwiY3VycmVudERhdGUiLCJEYXRlIiwiZGlzY291bnRFeHBpcmVkUHJvZHVjdHMiLCJQcm9kdWN0IiwiZmluZCIsImRpc2NvdW50RW5kRGF0ZSIsIiRsdCIsInByb2R1Y3REaXNjb3VudCIsIiRndCIsInByb2R1Y3QiLCJwcm9kdWN0UHJvbW9QcmljZSIsImRpc2NvdW50U3RhcnREYXRlIiwic2F2ZSIsImNvbnNvbGUiLCJsb2ciLCJwcm9kdWN0TmFtZSIsImV4cGlyeURhdGVQcm9kdWN0cyIsImV4cGlyeURhdGUiLCJwcm9kdWN0U3RhdHVzIiwiJG5lIiwicHJvZHVjdFN0b2NrIiwiZGlzY291bnRVcGRhdGVkIiwibGVuZ3RoIiwiZXhwaXJ5VXBkYXRlZCIsImVycm9yIiwibWVzc2FnZSIsImV4cG9ydHMiLCJjcmVhdGVQcm9kdWN0IiwicmVxIiwicmVzIiwiYm9keSIsImltYWdlVXJscyIsInN0YXR1cyIsImpzb24iLCJjYXRlZ29yeSIsIkNhdGVnb3J5IiwiZmluZE9uZSIsIm5hbWVDYXRlZ29yeSIsInByb2R1Y3RDYXRlZ29yeSIsInVwbG9hZGVkVXJscyIsIkFycmF5IiwiaXNBcnJheSIsImRlc2NyaXB0aW9ucyIsInByb2R1Y3REZXNjcmlwdGlvbiIsIkpTT04iLCJwYXJzZSIsInNwbGl0IiwidW5pdE9wdGlvbnMiLCJtYXAiLCJvcHRpb24iLCJ1bml0IiwicHJpY2UiLCJjb252ZXJzaW9uUmF0ZSIsImluU3RvY2siLCJpc0RlZmF1bHQiLCJoYXNEZWZhdWx0Iiwic29tZSIsIm9wdCIsIm5ld1Byb2R1Y3QiLCJwcm9kdWN0SW1hZ2VzIiwicHJvZHVjdFByaWNlIiwiTnVtYmVyIiwicHJvZHVjdFdlaWdodCIsInByb2R1Y3RVbml0Iiwic2F2ZWRQcm9kdWN0Iiwic2VuZE5ld1Byb2R1Y3ROb3RpZmljYXRpb24iLCJjYXRjaCIsImFkbWluc1RvTm90aWZ5IiwiQWRtaW4iLCIkb3IiLCJyb2xlIiwicGVybWlzc2lvbnMiLCIkaW4iLCIkZXhpc3RzIiwibm90aWZpY2F0aW9uUGF5bG9hZCIsInRpdGxlIiwiZGF0YSIsInVybCIsIl9pZCIsInByb2R1Y3RJZCIsImFkbWluIiwic3Vic2NyaXB0aW9uIiwicHVzaFN1YnNjcmlwdGlvbnMiLCJzZW5kUHVzaE5vdGlmaWNhdGlvbiIsInByb2R1Y3RUb1NlbmQiLCJ0b09iamVjdCIsIlN0cmluZyIsInByb2R1Y3RXYXJyYW50eSIsInRvSVNPU3RyaW5nIiwic3VjY2VzcyIsImVycm9yRGV0YWlscyIsInByb2Nlc3MiLCJlbnYiLCJOT0RFX0VOViIsInN0YWNrIiwidW5kZWZpbmVkIiwiZ2V0QWxsUHJvZHVjdHMiLCJwcm9kdWN0cyIsInByb2R1Y3RzVG9TZW5kIiwicHJvZHVjdE9iaiIsImdldFByb2R1Y3RCeVNsdWciLCJzbHVnIiwicGFyYW1zIiwicCIsInRvTG93ZXJDYXNlIiwibm9ybWFsaXplIiwicmVwbGFjZSIsInVwZGF0ZVByb2R1Y3QiLCJpZCIsIl9OdW1iZXIiLCJfTnVtYmVyMiIsIl9OdW1iZXIzIiwiX051bWJlcjQiLCJmaW5kQnlJZCIsIm5ld0ltYWdlVXJscyIsImV4aXN0aW5nSW1hZ2VzIiwia2VlcEltYWdlcyIsImZpbHRlciIsImltZyIsImluY2x1ZGVzIiwiaW1hZ2VzVG9EZWxldGUiLCJQcm9taXNlIiwiYWxsIiwicHVibGljSWQiLCJwb3AiLCJjbG91ZGluYXJ5IiwidXBsb2FkZXIiLCJkZXN0cm95IiwiZGVzYyIsInRyaW0iLCJ1cGRhdGVkUHJvZHVjdCIsImZpbmRCeUlkQW5kVXBkYXRlIiwibmV3IiwiZGVsZXRlUHJvZHVjdCIsImZpbmRCeUlkQW5kRGVsZXRlIiwiZ2V0UHJvZHVjdEJ5SWQiLCJjaGVja0FuZFVwZGF0ZUV4cGlyYXRpb25zIiwicmVzdWx0Iiwic2VhcmNoUHJvZHVjdHMiLCJuYW1lIiwicGFnZSIsImxpbWl0IiwicXVlcnkiLCJwYXJzZUludCIsIk1hdGgiLCJtaW4iLCJzZWFyY2hRdWVyeSIsIiRyZWdleCIsIiRvcHRpb25zIiwicHJvZHVjdEluZm8iLCJwcm9kdWN0QnJhbmQiLCJwcm9kdWN0Q29kZSIsInByb2R1Y3REZXRhaWxzIiwicHJvZHVjdE9yaWdpbiIsInNvcnQiLCJjcmVhdGVkQXQiLCJza2lwIiwibGVhbiIsInRvdGFsIiwiY291bnREb2N1bWVudHMiLCJ0b3RhbFBhZ2VzIiwiY2VpbCIsInBhdGgiLCJnZXRQcm9kdWN0QnlDYXRlZ29yeSIsImNhdGVnb3J5TmFtZSIsImV4Y2x1ZGVJZCIsInVwZGF0ZVByb2R1Y3RDYXRlZ29yeSIsImNhdGVnb3J5SWQiLCJnZXRCZXN0U2VsbGluZ1Byb2R1Y3RzIiwicGVyaW9kIiwiYmVzdFNlbGxpbmdQcm9kdWN0cyIsIkJlc3RTZWxsaW5nUHJvZHVjdCIsInNvbGRDb3VudCIsInBvcHVsYXRlIiwic2VsZWN0IiwibW9kZWxFcnJvciIsIm5vcm1hbFByb2R1Y3RzIiwicHJvZHVjdEVycm9yIiwiZm9ybWF0dGVkUHJvZHVjdHMiLCJpdGVtIiwidG90YWxSZXZlbnVlIiwiZ2V0VG9wUmF0ZWRQcm9kdWN0cyIsInRvcFJhdGVkUHJvZHVjdHMiLCJhdmVyYWdlUmF0aW5nIiwibnVtT2ZSZXZpZXdzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL0NvbnRyb2xsZXIvcHJvZHVjdHNDb250cm9sbGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKioqKioqKioqKioqICDinKggV2luZHN1cmYgQ29tbWFuZCDwn4yfICAqKioqKioqKioqKioqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xyXG5pbXBvcnQgY2xvdWRpbmFyeSBmcm9tIFwiLi4vY29uZmlnL2Nsb3VkaW5hcnkuanNcIjtcclxuaW1wb3J0IFByb2R1Y3QgZnJvbSBcIi4uL01vZGVsL1Byb2R1Y3RzLmpzXCI7XHJcbmltcG9ydCBDYXRlZ29yeSBmcm9tIFwiLi4vTW9kZWwvQ2F0ZWdvcmllcy5qc1wiO1xyXG5pbXBvcnQgQmVzdFNlbGxpbmdQcm9kdWN0IGZyb20gXCIuLi9Nb2RlbC9CZXN0U2VsbGluZ1Byb2R1Y3QuanNcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgbW9uZ29vc2UgZnJvbSBcIm1vbmdvb3NlXCI7XHJcbmltcG9ydCBBZG1pbiBmcm9tIFwiLi4vTW9kZWwvYWRtaW5Nb2RlbC5qc1wiOyAvLyBJbXBvcnQgQWRtaW4gbW9kZWxcclxuaW1wb3J0IHtcclxuICBzZW5kUHVzaE5vdGlmaWNhdGlvbixcclxuICBzZW5kTmV3UHJvZHVjdE5vdGlmaWNhdGlvbixcclxufSBmcm9tIFwiLi4vU2VydmljZXMvbm90aWZpY2F0aW9uU2VydmljZS5qc1wiOyAvLyBJbXBvcnQgdGjDqm0gc2VuZE5ld1Byb2R1Y3ROb3RpZmljYXRpb25cclxuXHJcbi8vIFRow6ptIGjDoG0ga2nhu4NtIHRyYSB2w6AgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgc+G6o24gcGjhuqltIGThu7FhIHbDoG8gdGjhu51pIGjhuqFuIGdp4bqjbSBnacOhIHbDoCBo4bqhbiBz4butIGThu6VuZ1xyXG5leHBvcnQgY29uc3QgdXBkYXRlUHJvZHVjdEV4cGlyYXRpb25zID0gYXN5bmMgKCkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjdXJyZW50RGF0ZSA9IG5ldyBEYXRlKCk7XHJcblxyXG4gICAgLy8gQ+G6rXAgbmjhuq10IGdp4bqjbSBnacOhIGPhu6dhIHPhuqNuIHBo4bqpbSDEkcOjIGjhur90IHRo4budaSBo4bqhbiBnaeG6o20gZ2nDoVxyXG4gICAgY29uc3QgZGlzY291bnRFeHBpcmVkUHJvZHVjdHMgPSBhd2FpdCBQcm9kdWN0LmZpbmQoe1xyXG4gICAgICBkaXNjb3VudEVuZERhdGU6IHsgJGx0OiBjdXJyZW50RGF0ZSB9LFxyXG4gICAgICBwcm9kdWN0RGlzY291bnQ6IHsgJGd0OiAwIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IHByb2R1Y3Qgb2YgZGlzY291bnRFeHBpcmVkUHJvZHVjdHMpIHtcclxuICAgICAgcHJvZHVjdC5wcm9kdWN0RGlzY291bnQgPSAwO1xyXG4gICAgICBwcm9kdWN0LnByb2R1Y3RQcm9tb1ByaWNlID0gMDtcclxuICAgICAgcHJvZHVjdC5kaXNjb3VudFN0YXJ0RGF0ZSA9IG51bGw7XHJcbiAgICAgIHByb2R1Y3QuZGlzY291bnRFbmREYXRlID0gbnVsbDtcclxuICAgICAgYXdhaXQgcHJvZHVjdC5zYXZlKCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKGDEkMOjIGPhuq1wIG5o4bqtdCBnacOhIGfhu5FjIGNobyBz4bqjbiBwaOG6qW06ICR7cHJvZHVjdC5wcm9kdWN0TmFtZX1gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBD4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSBz4bqjbiBwaOG6qW0gxJHDoyBo4bq/dCBo4bqhbiBz4butIGThu6VuZ1xyXG4gICAgY29uc3QgZXhwaXJ5RGF0ZVByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHtcclxuICAgICAgZXhwaXJ5RGF0ZTogeyAkbHQ6IGN1cnJlbnREYXRlIH0sXHJcbiAgICAgIHByb2R1Y3RTdGF0dXM6IHsgJG5lOiBcIkjhur90IGjDoG5nXCIgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiBleHBpcnlEYXRlUHJvZHVjdHMpIHtcclxuICAgICAgcHJvZHVjdC5wcm9kdWN0U3RhdHVzID0gXCJI4bq/dCBow6BuZ1wiO1xyXG4gICAgICBwcm9kdWN0LnByb2R1Y3RTdG9jayA9IDA7XHJcbiAgICAgIGF3YWl0IHByb2R1Y3Quc2F2ZSgpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICBgxJDDoyBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSBcIkjhur90IGjDoG5nXCIgY2hvIHPhuqNuIHBo4bqpbTogJHtwcm9kdWN0LnByb2R1Y3ROYW1lfWBcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBkaXNjb3VudFVwZGF0ZWQ6IGRpc2NvdW50RXhwaXJlZFByb2R1Y3RzLmxlbmd0aCxcclxuICAgICAgZXhwaXJ5VXBkYXRlZDogZXhwaXJ5RGF0ZVByb2R1Y3RzLmxlbmd0aCxcclxuICAgIH07XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IGjhuqFuIHPhuqNuIHBo4bqpbTpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgY3JlYXRlUHJvZHVjdCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICAvLyBLaeG7g20gdHJhIG7hur91IGtow7RuZyBjw7MgaW1hZ2VVcmxzXHJcbiAgICBpZiAoIXJlcS5ib2R5LmltYWdlVXJscyB8fCByZXEuYm9keS5pbWFnZVVybHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiByZXNcclxuICAgICAgICAuc3RhdHVzKDQwMClcclxuICAgICAgICAuanNvbih7IG1lc3NhZ2U6IFwiVnVpIGzDsm5nIHThuqNpIGzDqm4gw610IG5o4bqldCBt4buZdCBow6xuaCDhuqNuaFwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNhdGVnb3J5ID0gYXdhaXQgQ2F0ZWdvcnkuZmluZE9uZSh7XHJcbiAgICAgIG5hbWVDYXRlZ29yeTogcmVxLmJvZHkucHJvZHVjdENhdGVnb3J5LFxyXG4gICAgfSk7XHJcbiAgICBpZiAoIWNhdGVnb3J5KSB7XHJcbiAgICAgIHJldHVybiByZXNcclxuICAgICAgICAuc3RhdHVzKDQwMClcclxuICAgICAgICAuanNvbih7IG1lc3NhZ2U6IFwiRGFuaCBt4bulYyBz4bqjbiBwaOG6qW0ga2jDtG5nIHThu5NuIHThuqFpXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU+G7rSBk4bulbmcgVVJMcyDEkcOjIMSRxrDhu6NjIHVwbG9hZCB0aMO0bmcgcXVhIENsb3VkaW5hcnkgd2lkZ2V0XHJcbiAgICBjb25zdCB1cGxvYWRlZFVybHMgPSBBcnJheS5pc0FycmF5KHJlcS5ib2R5LmltYWdlVXJscylcclxuICAgICAgPyByZXEuYm9keS5pbWFnZVVybHNcclxuICAgICAgOiBbcmVxLmJvZHkuaW1hZ2VVcmxzXTtcclxuXHJcbiAgICBsZXQgZGVzY3JpcHRpb25zID0gW107XHJcbiAgICB0cnkge1xyXG4gICAgICBkZXNjcmlwdGlvbnMgPVxyXG4gICAgICAgIHR5cGVvZiByZXEuYm9keS5wcm9kdWN0RGVzY3JpcHRpb24gPT09IFwic3RyaW5nXCJcclxuICAgICAgICAgID8gSlNPTi5wYXJzZShyZXEuYm9keS5wcm9kdWN0RGVzY3JpcHRpb24pXHJcbiAgICAgICAgICA6IHJlcS5ib2R5LnByb2R1Y3REZXNjcmlwdGlvbjtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIGRlc2NyaXB0aW9ucyA9IHJlcS5ib2R5LnByb2R1Y3REZXNjcmlwdGlvbi5zcGxpdChcIixcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gWOG7rSBsw70gdGjDtG5nIHRpbiBuZ8OgeSBi4bqvdCDEkeG6p3UgdsOgIGvhur90IHRow7pjIGdp4bqjbSBnacOhXHJcbiAgICBsZXQgZGlzY291bnRTdGFydERhdGUgPSBudWxsO1xyXG4gICAgbGV0IGRpc2NvdW50RW5kRGF0ZSA9IG51bGw7XHJcblxyXG4gICAgaWYgKHJlcS5ib2R5LmRpc2NvdW50U3RhcnREYXRlKSB7XHJcbiAgICAgIGRpc2NvdW50U3RhcnREYXRlID0gbmV3IERhdGUocmVxLmJvZHkuZGlzY291bnRTdGFydERhdGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXEuYm9keS5kaXNjb3VudEVuZERhdGUpIHtcclxuICAgICAgZGlzY291bnRFbmREYXRlID0gbmV3IERhdGUocmVxLmJvZHkuZGlzY291bnRFbmREYXRlKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBY4butIGzDvSBo4bqhbiBz4butIGThu6VuZ1xyXG4gICAgbGV0IGV4cGlyeURhdGUgPSBudWxsO1xyXG4gICAgbGV0IHByb2R1Y3RTdGF0dXMgPSByZXEuYm9keS5wcm9kdWN0U3RhdHVzIHx8IFwiQ8OybiBow6BuZ1wiO1xyXG5cclxuICAgIGlmIChyZXEuYm9keS5leHBpcnlEYXRlKSB7XHJcbiAgICAgIGV4cGlyeURhdGUgPSBuZXcgRGF0ZShyZXEuYm9keS5leHBpcnlEYXRlKTtcclxuXHJcbiAgICAgIC8vIE7hur91IGjhuqFuIHPhu60gZOG7pW5nIMSRw6MgcXVhLCBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aMOgbmggXCJI4bq/dCBow6BuZ1wiXHJcbiAgICAgIGlmIChleHBpcnlEYXRlIDwgbmV3IERhdGUoKSkge1xyXG4gICAgICAgIHByb2R1Y3RTdGF0dXMgPSBcIkjhur90IGjDoG5nXCI7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBWYWxpZGF0ZSB2w6AgY2h14bqpbiBi4buLIHVuaXRPcHRpb25zIG7hur91IGPDs1xyXG4gICAgbGV0IHVuaXRPcHRpb25zID0gW107XHJcbiAgICBpZiAocmVxLmJvZHkudW5pdE9wdGlvbnMgJiYgQXJyYXkuaXNBcnJheShyZXEuYm9keS51bml0T3B0aW9ucykpIHtcclxuICAgICAgdW5pdE9wdGlvbnMgPSByZXEuYm9keS51bml0T3B0aW9ucy5tYXAoKG9wdGlvbikgPT4gKHtcclxuICAgICAgICB1bml0OiBvcHRpb24udW5pdCxcclxuICAgICAgICBwcmljZTogb3B0aW9uLnByaWNlLFxyXG4gICAgICAgIGNvbnZlcnNpb25SYXRlOiBvcHRpb24uY29udmVyc2lvblJhdGUgfHwgMSxcclxuICAgICAgICBpblN0b2NrOiBvcHRpb24uaW5TdG9jayB8fCAwLFxyXG4gICAgICAgIGlzRGVmYXVsdDogb3B0aW9uLmlzRGVmYXVsdCB8fCBmYWxzZSxcclxuICAgICAgfSkpO1xyXG5cclxuICAgICAgLy8gxJDhuqNtIGLhuqNvIGPDsyDDrXQgbmjhuqV0IG3hu5l0IMSRxqFuIHbhu4sgbeG6t2MgxJHhu4tuaFxyXG4gICAgICBjb25zdCBoYXNEZWZhdWx0ID0gdW5pdE9wdGlvbnMuc29tZSgob3B0KSA9PiBvcHQuaXNEZWZhdWx0KTtcclxuICAgICAgaWYgKCFoYXNEZWZhdWx0ICYmIHVuaXRPcHRpb25zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB1bml0T3B0aW9uc1swXS5pc0RlZmF1bHQgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbmV3UHJvZHVjdCA9IG5ldyBQcm9kdWN0KHtcclxuICAgICAgLi4ucmVxLmJvZHksXHJcbiAgICAgIHByb2R1Y3RJbWFnZXM6IHVwbG9hZGVkVXJscyxcclxuICAgICAgcHJvZHVjdERlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbnMsXHJcbiAgICAgIHByb2R1Y3RQcmljZTogTnVtYmVyKHJlcS5ib2R5LnByb2R1Y3RQcmljZSksXHJcbiAgICAgIHByb2R1Y3REaXNjb3VudDogTnVtYmVyKHJlcS5ib2R5LnByb2R1Y3REaXNjb3VudCkgfHwgMCxcclxuICAgICAgcHJvZHVjdFN0b2NrOiBOdW1iZXIocmVxLmJvZHkucHJvZHVjdFN0b2NrKSB8fCAwLFxyXG4gICAgICBwcm9kdWN0V2VpZ2h0OiBOdW1iZXIocmVxLmJvZHkucHJvZHVjdFdlaWdodCkgfHwgMCxcclxuICAgICAgcHJvZHVjdENhdGVnb3J5OiBjYXRlZ29yeS5uYW1lQ2F0ZWdvcnksXHJcbiAgICAgIHByb2R1Y3RVbml0OiByZXEuYm9keS5wcm9kdWN0VW5pdCB8fCBcImdyYW1cIixcclxuICAgICAgZGlzY291bnRTdGFydERhdGUsXHJcbiAgICAgIGRpc2NvdW50RW5kRGF0ZSxcclxuICAgICAgZXhwaXJ5RGF0ZSxcclxuICAgICAgcHJvZHVjdFN0YXR1cyxcclxuICAgICAgdW5pdE9wdGlvbnM6IHVuaXRPcHRpb25zLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gVMOtbmggcHJvZHVjdFByb21vUHJpY2UgdOG7qyBwcm9kdWN0UHJpY2UgdsOgIHByb2R1Y3REaXNjb3VudFxyXG4gICAgaWYgKG5ld1Byb2R1Y3QucHJvZHVjdERpc2NvdW50ID4gMCkge1xyXG4gICAgICBuZXdQcm9kdWN0LnByb2R1Y3RQcm9tb1ByaWNlID1cclxuICAgICAgICBuZXdQcm9kdWN0LnByb2R1Y3RQcmljZSAqICgxIC0gbmV3UHJvZHVjdC5wcm9kdWN0RGlzY291bnQgLyAxMDApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNhdmVkUHJvZHVjdCA9IGF3YWl0IG5ld1Byb2R1Y3Quc2F2ZSgpO1xyXG5cclxuICAgIC8vIC0tLSBQdXNoIE5vdGlmaWNhdGlvbiBMb2dpYyBmb3IgTmV3IFByb2R1Y3QgLS0tXHJcbiAgICAvLyBH4butaSB0aMO0bmcgYsOhbyDEkeG6v24gdOG6pXQgY+G6oyBuZ8aw4budaSBkw7luZyBjw7MgxJHEg25nIGvDvSBuaOG6rW4gdGjDtG5nIGLDoW9cclxuICAgIHNlbmROZXdQcm9kdWN0Tm90aWZpY2F0aW9uKHNhdmVkUHJvZHVjdCkuY2F0Y2goKGVycm9yKSA9PlxyXG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3Igc2VuZGluZyBwcm9kdWN0IG5vdGlmaWNhdGlvbiB0byB1c2VyczpcIiwgZXJyb3IpXHJcbiAgICApO1xyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvbiBmb3IgYWRtaW5zIC0gduG6q24gZ2nhu68gbOG6oWlcclxuICAgIGNvbnN0IGFkbWluc1RvTm90aWZ5ID0gYXdhaXQgQWRtaW4uZmluZCh7XHJcbiAgICAgICRvcjogW1xyXG4gICAgICAgIHsgcm9sZTogXCJhZG1pblwiIH0sIC8vIEFkbWluIGdldHMgYWxsIG5vdGlmaWNhdGlvbnNcclxuICAgICAgICB7XHJcbiAgICAgICAgICByb2xlOiBcIm1hbmFnZXJcIixcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiB7ICRpbjogW1wiUXXhuqNuIGzDvSBz4bqjbiBwaOG6qW1cIiwgXCJwcm9kdWN0c1wiXSB9LFxyXG4gICAgICAgIH0sIC8vIE1hbmFnZXJzIHdpdGggcHJvZHVjdCBwZXJtaXNzaW9uXHJcbiAgICAgIF0sXHJcbiAgICAgIFwicHVzaFN1YnNjcmlwdGlvbnMuMFwiOiB7ICRleGlzdHM6IHRydWUgfSwgLy8gT25seSB1c2VycyB3aXRoIGF0IGxlYXN0IG9uZSBzdWJzY3JpcHRpb25cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IG5vdGlmaWNhdGlvblBheWxvYWQgPSB7XHJcbiAgICAgIHRpdGxlOiBcIlPhuqNuIHBo4bqpbSBt4bubaVwiLFxyXG4gICAgICBib2R5OiBgU+G6o24gcGjhuqltIFwiJHtzYXZlZFByb2R1Y3QucHJvZHVjdE5hbWV9XCIgxJHDoyDEkcaw4bujYyB0aMOqbSBt4bubaS5gLFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgdXJsOiBgL2FkbWluL3Byb2R1Y3RzL2VkaXQvJHtzYXZlZFByb2R1Y3QuX2lkfWAsXHJcbiAgICAgICAgcHJvZHVjdElkOiBzYXZlZFByb2R1Y3QuX2lkLFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGFkbWluIG9mIGFkbWluc1RvTm90aWZ5KSB7XHJcbiAgICAgIGZvciAoY29uc3Qgc3Vic2NyaXB0aW9uIG9mIGFkbWluLnB1c2hTdWJzY3JpcHRpb25zKSB7XHJcbiAgICAgICAgc2VuZFB1c2hOb3RpZmljYXRpb24oXHJcbiAgICAgICAgICBhZG1pbi5faWQsXHJcbiAgICAgICAgICBzdWJzY3JpcHRpb24sXHJcbiAgICAgICAgICBub3RpZmljYXRpb25QYXlsb2FkXHJcbiAgICAgICAgKS5jYXRjaCgoZXJyb3IpID0+XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3Igc2VuZGluZyBub3RpZmljYXRpb24gdG8gYWRtaW46XCIsIGVycm9yKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIC0tLSBFbmQgUHVzaCBOb3RpZmljYXRpb24gTG9naWMgLS0tXHJcblxyXG4gICAgLy8gQ2h1eeG7g24gxJHhu5VpIGThu68gbGnhu4d1IHPhu5EgdGjDoG5oIGNodeG7l2kgdHLGsOG7m2Mga2hpIGfhu61pIHbhu4EgY2xpZW50XHJcbiAgICBjb25zdCBwcm9kdWN0VG9TZW5kID0gc2F2ZWRQcm9kdWN0LnRvT2JqZWN0KCk7XHJcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcmljZSA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcmljZSk7XHJcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3REaXNjb3VudCA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3REaXNjb3VudCk7XHJcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RTdG9jayA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RTdG9jayk7XHJcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RXZWlnaHQgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0V2VpZ2h0KTtcclxuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFByb21vUHJpY2UgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJvbW9QcmljZSk7XHJcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RXYXJyYW50eSA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RXYXJyYW50eSk7XHJcblxyXG4gICAgLy8gRm9ybWF0IGRpc2NvdW50IGRhdGVzXHJcbiAgICBpZiAocHJvZHVjdFRvU2VuZC5kaXNjb3VudFN0YXJ0RGF0ZSkge1xyXG4gICAgICBwcm9kdWN0VG9TZW5kLmRpc2NvdW50U3RhcnREYXRlID1cclxuICAgICAgICBwcm9kdWN0VG9TZW5kLmRpc2NvdW50U3RhcnREYXRlLnRvSVNPU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBpZiAocHJvZHVjdFRvU2VuZC5kaXNjb3VudEVuZERhdGUpIHtcclxuICAgICAgcHJvZHVjdFRvU2VuZC5kaXNjb3VudEVuZERhdGUgPVxyXG4gICAgICAgIHByb2R1Y3RUb1NlbmQuZGlzY291bnRFbmREYXRlLnRvSVNPU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICAvLyBGb3JtYXQgZXhwaXJ5IGRhdGVcclxuICAgIGlmIChwcm9kdWN0VG9TZW5kLmV4cGlyeURhdGUpIHtcclxuICAgICAgcHJvZHVjdFRvU2VuZC5leHBpcnlEYXRlID0gcHJvZHVjdFRvU2VuZC5leHBpcnlEYXRlLnRvSVNPU3RyaW5nKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKHByb2R1Y3RUb1NlbmQpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgaW4gY3JlYXRlUHJvZHVjdDpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICAgIGVycm9yRGV0YWlsczpcclxuICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJkZXZlbG9wbWVudFwiID8gZXJyb3Iuc3RhY2sgOiB1bmRlZmluZWQsXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgZ2V0QWxsUHJvZHVjdHMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgLy8gS2nhu4NtIHRyYSB2w6AgY+G6rXAgbmjhuq10IGjhuqFuIHPhu60gZOG7pW5nIHbDoCBnaeG6o20gZ2nDoSB0csaw4bubYyBraGkgdHLhuqMgduG7gSBkYW5oIHPDoWNoXHJcbiAgICBhd2FpdCB1cGRhdGVQcm9kdWN0RXhwaXJhdGlvbnMoKTtcclxuXHJcbiAgICBjb25zdCBwcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuZmluZCgpO1xyXG5cclxuICAgIC8vIENodXnhu4NuIMSR4buVaSBk4buvIGxp4buHdSBz4buRIHRow6BuaCBjaHXhu5dpXHJcbiAgICBjb25zdCBwcm9kdWN0c1RvU2VuZCA9IHByb2R1Y3RzLm1hcCgocHJvZHVjdCkgPT4ge1xyXG4gICAgICBjb25zdCBwcm9kdWN0T2JqID0gcHJvZHVjdC50b09iamVjdCgpO1xyXG4gICAgICBwcm9kdWN0T2JqLnByb2R1Y3RQcmljZSA9IFN0cmluZyhwcm9kdWN0T2JqLnByb2R1Y3RQcmljZSB8fCBcIlwiKTtcclxuICAgICAgcHJvZHVjdE9iai5wcm9kdWN0RGlzY291bnQgPSBTdHJpbmcocHJvZHVjdE9iai5wcm9kdWN0RGlzY291bnQgfHwgXCJcIik7XHJcbiAgICAgIHByb2R1Y3RPYmoucHJvZHVjdFN0b2NrID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdFN0b2NrIHx8IFwiXCIpO1xyXG4gICAgICBwcm9kdWN0T2JqLnByb2R1Y3RXZWlnaHQgPSBTdHJpbmcocHJvZHVjdE9iai5wcm9kdWN0V2VpZ2h0IHx8IFwiXCIpO1xyXG4gICAgICBwcm9kdWN0T2JqLnByb2R1Y3RQcm9tb1ByaWNlID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdFByb21vUHJpY2UgfHwgXCJcIik7XHJcbiAgICAgIHByb2R1Y3RPYmoucHJvZHVjdFdhcnJhbnR5ID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdFdhcnJhbnR5IHx8IFwiXCIpO1xyXG4gICAgICByZXR1cm4gcHJvZHVjdE9iajtcclxuICAgIH0pO1xyXG5cclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHByb2R1Y3RzVG9TZW5kKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiBcIkzhuqV5IGRhbmggc8OhY2ggc+G6o24gcGjhuqltIHRo4bqldCBi4bqhaVwiLCBlcnJvciB9KTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgZ2V0UHJvZHVjdEJ5U2x1ZyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIGNvbnN0IHsgc2x1ZyB9ID0gcmVxLnBhcmFtcztcclxuICB0cnkge1xyXG4gICAgLy8gS2nhu4NtIHRyYSB2w6AgY+G6rXAgbmjhuq10IGjhuqFuIHPhu60gZOG7pW5nIHbDoCBnaeG6o20gZ2nDoSB0csaw4bubYyBraGkgdHLhuqMgduG7gSBz4bqjbiBwaOG6qW1cclxuICAgIGF3YWl0IHVwZGF0ZVByb2R1Y3RFeHBpcmF0aW9ucygpO1xyXG5cclxuICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKCk7XHJcbiAgICBjb25zdCBwcm9kdWN0ID0gcHJvZHVjdHMuZmluZChcclxuICAgICAgKHApID0+XHJcbiAgICAgICAgcC5wcm9kdWN0TmFtZVxyXG4gICAgICAgICAgLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgIC5ub3JtYWxpemUoXCJORkRcIilcclxuICAgICAgICAgIC5yZXBsYWNlKC9bXFx1MDMwMC1cXHUwMzZmXS9nLCBcIlwiKVxyXG4gICAgICAgICAgLnJlcGxhY2UoL1teYS16MC05XSsvZywgXCItXCIpXHJcbiAgICAgICAgICAucmVwbGFjZSgvKF4tfC0kKS9nLCBcIlwiKSA9PT0gc2x1Z1xyXG4gICAgKTtcclxuXHJcbiAgICBpZiAoIXByb2R1Y3QpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2h1eeG7g24gxJHhu5VpIGThu68gbGnhu4d1IHPhu5EgdGjDoG5oIGNodeG7l2lcclxuICAgIGNvbnN0IHByb2R1Y3RUb1NlbmQgPSBwcm9kdWN0LnRvT2JqZWN0KCk7XHJcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcmljZSA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcmljZSB8fCBcIlwiKTtcclxuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdERpc2NvdW50ID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdERpc2NvdW50IHx8IFwiXCIpO1xyXG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0U3RvY2sgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0U3RvY2sgfHwgXCJcIik7XHJcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RXZWlnaHQgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0V2VpZ2h0IHx8IFwiXCIpO1xyXG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJvbW9QcmljZSA9IFN0cmluZyhcclxuICAgICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJvbW9QcmljZSB8fCBcIlwiXHJcbiAgICApO1xyXG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0V2FycmFudHkgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0V2FycmFudHkgfHwgXCJcIik7XHJcblxyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24ocHJvZHVjdFRvU2VuZCk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogXCJM4bqleSBjaGkgdGnhur90IHPhuqNuIHBo4bqpbSB0aOG6pXQgYuG6oWlcIiwgZXJyb3IgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IHVwZGF0ZVByb2R1Y3QgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICBjb25zdCB7IGlkIH0gPSByZXEucGFyYW1zO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwcm9kdWN0ID0gYXdhaXQgUHJvZHVjdC5maW5kQnlJZChpZCk7XHJcbiAgICBpZiAoIXByb2R1Y3QpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gS2nhu4NtIHRyYSBkYW5oIG3hu6VjIG3hu5tpIG7hur91IGPDsyB0aGF5IMSR4buVaVxyXG4gICAgaWYgKFxyXG4gICAgICByZXEuYm9keS5wcm9kdWN0Q2F0ZWdvcnkgJiZcclxuICAgICAgcmVxLmJvZHkucHJvZHVjdENhdGVnb3J5ICE9PSBwcm9kdWN0LnByb2R1Y3RDYXRlZ29yeVxyXG4gICAgKSB7XHJcbiAgICAgIGNvbnN0IGNhdGVnb3J5ID0gYXdhaXQgQ2F0ZWdvcnkuZmluZE9uZSh7XHJcbiAgICAgICAgbmFtZUNhdGVnb3J5OiByZXEuYm9keS5wcm9kdWN0Q2F0ZWdvcnksXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoIWNhdGVnb3J5KSB7XHJcbiAgICAgICAgcmV0dXJuIHJlc1xyXG4gICAgICAgICAgLnN0YXR1cyg0MDApXHJcbiAgICAgICAgICAuanNvbih7IG1lc3NhZ2U6IFwiRGFuaCBt4bulYyBz4bqjbiBwaOG6qW0ga2jDtG5nIHThu5NuIHThuqFpXCIgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmVxLmJvZHkucHJvZHVjdENhdGVnb3J5ID0gY2F0ZWdvcnkubmFtZUNhdGVnb3J5O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFPhu60gZOG7pW5nIFVSTHMgxJHDoyDEkcaw4bujYyB1cGxvYWQgdGjDtG5nIHF1YSBDbG91ZGluYXJ5IHdpZGdldFxyXG4gICAgbGV0IG5ld0ltYWdlVXJscyA9IFtdO1xyXG4gICAgaWYgKHJlcS5ib2R5Lm5ld0ltYWdlVXJscyAmJiByZXEuYm9keS5uZXdJbWFnZVVybHMubGVuZ3RoID4gMCkge1xyXG4gICAgICBuZXdJbWFnZVVybHMgPSBBcnJheS5pc0FycmF5KHJlcS5ib2R5Lm5ld0ltYWdlVXJscylcclxuICAgICAgICA/IHJlcS5ib2R5Lm5ld0ltYWdlVXJsc1xyXG4gICAgICAgIDogW3JlcS5ib2R5Lm5ld0ltYWdlVXJsc107XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGV4aXN0aW5nSW1hZ2VzID0gcHJvZHVjdC5wcm9kdWN0SW1hZ2VzIHx8IFtdO1xyXG4gICAgaWYgKHJlcS5ib2R5LmtlZXBJbWFnZXMpIHtcclxuICAgICAgY29uc3Qga2VlcEltYWdlcyA9IEFycmF5LmlzQXJyYXkocmVxLmJvZHkua2VlcEltYWdlcylcclxuICAgICAgICA/IHJlcS5ib2R5LmtlZXBJbWFnZXNcclxuICAgICAgICA6IEpTT04ucGFyc2UocmVxLmJvZHkua2VlcEltYWdlcyk7XHJcblxyXG4gICAgICBleGlzdGluZ0ltYWdlcyA9IGV4aXN0aW5nSW1hZ2VzLmZpbHRlcigoaW1nKSA9PiBrZWVwSW1hZ2VzLmluY2x1ZGVzKGltZykpO1xyXG5cclxuICAgICAgY29uc3QgaW1hZ2VzVG9EZWxldGUgPSBwcm9kdWN0LnByb2R1Y3RJbWFnZXMuZmlsdGVyKFxyXG4gICAgICAgIChpbWcpID0+ICFrZWVwSW1hZ2VzLmluY2x1ZGVzKGltZylcclxuICAgICAgKTtcclxuXHJcbiAgICAgIC8vIFjDs2EgY8OhYyDhuqNuaCBraMO0bmcgZ2nhu68gbOG6oWlcclxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoXHJcbiAgICAgICAgaW1hZ2VzVG9EZWxldGUubWFwKChpbWcpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHB1YmxpY0lkID0gaW1nLnNwbGl0KFwiL1wiKS5wb3AoKS5zcGxpdChcIi5cIilbMF07XHJcbiAgICAgICAgICByZXR1cm4gY2xvdWRpbmFyeS51cGxvYWRlci5kZXN0cm95KGBwcm9kdWN0cy8ke3B1YmxpY0lkfWApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHByb2R1Y3REZXNjcmlwdGlvbiA9IHByb2R1Y3QucHJvZHVjdERlc2NyaXB0aW9uO1xyXG4gICAgaWYgKHJlcS5ib2R5LnByb2R1Y3REZXNjcmlwdGlvbikge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHByb2R1Y3REZXNjcmlwdGlvbiA9IEpTT04ucGFyc2UocmVxLmJvZHkucHJvZHVjdERlc2NyaXB0aW9uKTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBwcm9kdWN0RGVzY3JpcHRpb24gPSByZXEuYm9keS5wcm9kdWN0RGVzY3JpcHRpb25cclxuICAgICAgICAgIC5zcGxpdChcIi5cIilcclxuICAgICAgICAgIC5tYXAoKGRlc2MpID0+IGRlc2MudHJpbSgpKVxyXG4gICAgICAgICAgLmZpbHRlcigoZGVzYykgPT4gZGVzYyAhPT0gXCJcIik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBY4butIGzDvSB0aMO0bmcgdGluIG5nw6B5IGLhuq90IMSR4bqndSB2w6Aga+G6v3QgdGjDumMgZ2nhuqNtIGdpw6FcclxuICAgIGxldCBkaXNjb3VudFN0YXJ0RGF0ZSA9IHByb2R1Y3QuZGlzY291bnRTdGFydERhdGU7XHJcbiAgICBsZXQgZGlzY291bnRFbmREYXRlID0gcHJvZHVjdC5kaXNjb3VudEVuZERhdGU7XHJcblxyXG4gICAgaWYgKHJlcS5ib2R5LmRpc2NvdW50U3RhcnREYXRlKSB7XHJcbiAgICAgIGRpc2NvdW50U3RhcnREYXRlID0gbmV3IERhdGUocmVxLmJvZHkuZGlzY291bnRTdGFydERhdGUpO1xyXG4gICAgfSBlbHNlIGlmIChyZXEuYm9keS5kaXNjb3VudFN0YXJ0RGF0ZSA9PT0gbnVsbCkge1xyXG4gICAgICBkaXNjb3VudFN0YXJ0RGF0ZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlcS5ib2R5LmRpc2NvdW50RW5kRGF0ZSkge1xyXG4gICAgICBkaXNjb3VudEVuZERhdGUgPSBuZXcgRGF0ZShyZXEuYm9keS5kaXNjb3VudEVuZERhdGUpO1xyXG4gICAgfSBlbHNlIGlmIChyZXEuYm9keS5kaXNjb3VudEVuZERhdGUgPT09IG51bGwpIHtcclxuICAgICAgZGlzY291bnRFbmREYXRlID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBY4butIGzDvSBo4bqhbiBz4butIGThu6VuZ1xyXG4gICAgbGV0IGV4cGlyeURhdGUgPSBwcm9kdWN0LmV4cGlyeURhdGU7XHJcbiAgICBsZXQgcHJvZHVjdFN0YXR1cyA9IHJlcS5ib2R5LnByb2R1Y3RTdGF0dXMgfHwgcHJvZHVjdC5wcm9kdWN0U3RhdHVzO1xyXG5cclxuICAgIGlmIChyZXEuYm9keS5leHBpcnlEYXRlKSB7XHJcbiAgICAgIGV4cGlyeURhdGUgPSBuZXcgRGF0ZShyZXEuYm9keS5leHBpcnlEYXRlKTtcclxuXHJcbiAgICAgIC8vIE7hur91IGjhuqFuIHPhu60gZOG7pW5nIMSRw6MgcXVhLCBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aMOgbmggXCJI4bq/dCBow6BuZ1wiXHJcbiAgICAgIGlmIChleHBpcnlEYXRlIDwgbmV3IERhdGUoKSkge1xyXG4gICAgICAgIHByb2R1Y3RTdGF0dXMgPSBcIkjhur90IGjDoG5nXCI7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAocmVxLmJvZHkuZXhwaXJ5RGF0ZSA9PT0gbnVsbCkge1xyXG4gICAgICBleHBpcnlEYXRlID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBWYWxpZGF0ZSB2w6AgY2h14bqpbiBi4buLIHVuaXRPcHRpb25zIG7hur91IGPDs1xyXG4gICAgbGV0IHVuaXRPcHRpb25zID0gcHJvZHVjdC51bml0T3B0aW9ucyB8fCBbXTtcclxuICAgIGlmIChyZXEuYm9keS51bml0T3B0aW9ucyAmJiBBcnJheS5pc0FycmF5KHJlcS5ib2R5LnVuaXRPcHRpb25zKSkge1xyXG4gICAgICB1bml0T3B0aW9ucyA9IHJlcS5ib2R5LnVuaXRPcHRpb25zLm1hcCgob3B0aW9uKSA9PiAoe1xyXG4gICAgICAgIHVuaXQ6IG9wdGlvbi51bml0LFxyXG4gICAgICAgIHByaWNlOiBvcHRpb24ucHJpY2UsXHJcbiAgICAgICAgY29udmVyc2lvblJhdGU6IG9wdGlvbi5jb252ZXJzaW9uUmF0ZSB8fCAxLFxyXG4gICAgICAgIGluU3RvY2s6IG9wdGlvbi5pblN0b2NrIHx8IDAsXHJcbiAgICAgICAgaXNEZWZhdWx0OiBvcHRpb24uaXNEZWZhdWx0IHx8IGZhbHNlLFxyXG4gICAgICB9KSk7XHJcblxyXG4gICAgICAvLyDEkOG6o20gYuG6o28gY8OzIMOtdCBuaOG6pXQgbeG7mXQgxJHGoW4gduG7iyBt4bq3YyDEkeG7i25oXHJcbiAgICAgIGNvbnN0IGhhc0RlZmF1bHQgPSB1bml0T3B0aW9ucy5zb21lKChvcHQpID0+IG9wdC5pc0RlZmF1bHQpO1xyXG4gICAgICBpZiAoIWhhc0RlZmF1bHQgJiYgdW5pdE9wdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHVuaXRPcHRpb25zWzBdLmlzRGVmYXVsdCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB1cGRhdGVkUHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWRBbmRVcGRhdGUoXHJcbiAgICAgIGlkLFxyXG4gICAgICB7XHJcbiAgICAgICAgLi4ucmVxLmJvZHksXHJcbiAgICAgICAgcHJvZHVjdEltYWdlczogWy4uLmV4aXN0aW5nSW1hZ2VzLCAuLi5uZXdJbWFnZVVybHNdLFxyXG4gICAgICAgIHByb2R1Y3REZXNjcmlwdGlvbixcclxuICAgICAgICBwcm9kdWN0UHJpY2U6IE51bWJlcihyZXEuYm9keS5wcm9kdWN0UHJpY2UpIHx8IHByb2R1Y3QucHJvZHVjdFByaWNlLFxyXG4gICAgICAgIHByb2R1Y3REaXNjb3VudDpcclxuICAgICAgICAgIE51bWJlcihyZXEuYm9keS5wcm9kdWN0RGlzY291bnQpID8/IHByb2R1Y3QucHJvZHVjdERpc2NvdW50LFxyXG4gICAgICAgIHByb2R1Y3RTdG9jazogTnVtYmVyKHJlcS5ib2R5LnByb2R1Y3RTdG9jaykgPz8gcHJvZHVjdC5wcm9kdWN0U3RvY2ssXHJcbiAgICAgICAgcHJvZHVjdFdlaWdodDogTnVtYmVyKHJlcS5ib2R5LnByb2R1Y3RXZWlnaHQpID8/IHByb2R1Y3QucHJvZHVjdFdlaWdodCxcclxuICAgICAgICBwcm9kdWN0V2FycmFudHk6XHJcbiAgICAgICAgICBOdW1iZXIocmVxLmJvZHkucHJvZHVjdFdhcnJhbnR5KSA/PyBwcm9kdWN0LnByb2R1Y3RXYXJyYW50eSxcclxuICAgICAgICBwcm9kdWN0VW5pdDogcmVxLmJvZHkucHJvZHVjdFVuaXQgfHwgcHJvZHVjdC5wcm9kdWN0VW5pdCB8fCBcImdyYW1cIixcclxuICAgICAgICBkaXNjb3VudFN0YXJ0RGF0ZSxcclxuICAgICAgICBkaXNjb3VudEVuZERhdGUsXHJcbiAgICAgICAgZXhwaXJ5RGF0ZSxcclxuICAgICAgICBwcm9kdWN0U3RhdHVzLFxyXG4gICAgICAgIHVuaXRPcHRpb25zOiB1bml0T3B0aW9ucyxcclxuICAgICAgfSxcclxuICAgICAgeyBuZXc6IHRydWUgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBUw61uaCBs4bqhaSBwcm9kdWN0UHJvbW9QcmljZSBzYXUga2hpIGPhuq1wIG5o4bqtdFxyXG4gICAgaWYgKHVwZGF0ZWRQcm9kdWN0LnByb2R1Y3REaXNjb3VudCA+IDApIHtcclxuICAgICAgdXBkYXRlZFByb2R1Y3QucHJvZHVjdFByb21vUHJpY2UgPVxyXG4gICAgICAgIHVwZGF0ZWRQcm9kdWN0LnByb2R1Y3RQcmljZSAqXHJcbiAgICAgICAgKDEgLSB1cGRhdGVkUHJvZHVjdC5wcm9kdWN0RGlzY291bnQgLyAxMDApO1xyXG4gICAgICBhd2FpdCB1cGRhdGVkUHJvZHVjdC5zYXZlKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB1cGRhdGVkUHJvZHVjdC5wcm9kdWN0UHJvbW9QcmljZSA9IDA7XHJcbiAgICAgIGF3YWl0IHVwZGF0ZWRQcm9kdWN0LnNhdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDaHV54buDbiDEkeG7lWkgZOG7ryBsaeG7h3Ugc+G7kSB0aMOgbmggY2h14buXaSB0csaw4bubYyBraGkgZ+G7rWkgduG7gSBjbGllbnRcclxuICAgIGNvbnN0IHByb2R1Y3RUb1NlbmQgPSB1cGRhdGVkUHJvZHVjdC50b09iamVjdCgpO1xyXG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJpY2UgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJpY2UpO1xyXG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0RGlzY291bnQgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0RGlzY291bnQpO1xyXG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0U3RvY2sgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0U3RvY2spO1xyXG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0V2VpZ2h0ID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFdlaWdodCk7XHJcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcm9tb1ByaWNlID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFByb21vUHJpY2UpO1xyXG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0V2FycmFudHkgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0V2FycmFudHkpO1xyXG5cclxuICAgIC8vIEZvcm1hdCBkaXNjb3VudCBkYXRlc1xyXG4gICAgaWYgKHByb2R1Y3RUb1NlbmQuZGlzY291bnRTdGFydERhdGUpIHtcclxuICAgICAgcHJvZHVjdFRvU2VuZC5kaXNjb3VudFN0YXJ0RGF0ZSA9XHJcbiAgICAgICAgcHJvZHVjdFRvU2VuZC5kaXNjb3VudFN0YXJ0RGF0ZS50b0lTT1N0cmluZygpO1xyXG4gICAgfVxyXG4gICAgaWYgKHByb2R1Y3RUb1NlbmQuZGlzY291bnRFbmREYXRlKSB7XHJcbiAgICAgIHByb2R1Y3RUb1NlbmQuZGlzY291bnRFbmREYXRlID1cclxuICAgICAgICBwcm9kdWN0VG9TZW5kLmRpc2NvdW50RW5kRGF0ZS50b0lTT1N0cmluZygpO1xyXG4gICAgfVxyXG4gICAgLy8gRm9ybWF0IGV4cGlyeSBkYXRlXHJcbiAgICBpZiAocHJvZHVjdFRvU2VuZC5leHBpcnlEYXRlKSB7XHJcbiAgICAgIHByb2R1Y3RUb1NlbmQuZXhwaXJ5RGF0ZSA9IHByb2R1Y3RUb1NlbmQuZXhwaXJ5RGF0ZS50b0lTT1N0cmluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJD4bqtcCBuaOG6rXQgc+G6o24gcGjhuqltIHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgICBwcm9kdWN0OiBwcm9kdWN0VG9TZW5kLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IHPhuqNuIHBo4bqpbTpcIiwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCJD4bqtcCBuaOG6rXQgc+G6o24gcGjhuqltIHRo4bqldCBi4bqhaVwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBkZWxldGVQcm9kdWN0ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgY29uc3QgeyBpZCB9ID0gcmVxLnBhcmFtcztcclxuICB0cnkge1xyXG4gICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWRBbmREZWxldGUoaWQpO1xyXG4gICAgaWYgKCFwcm9kdWN0KSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbVwiIH0pO1xyXG4gICAgfVxyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oeyBtZXNzYWdlOiBcIljDs2Egc+G6o24gcGjhuqltIHRow6BuaCBjw7RuZ1wiIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6IFwiWMOzYSBz4bqjbiBwaOG6qW0gdGjhuqV0IGLhuqFpXCIsIGVycm9yIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBnZXRQcm9kdWN0QnlJZCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIGNvbnN0IHsgaWQgfSA9IHJlcS5wYXJhbXM7XHJcbiAgdHJ5IHtcclxuICAgIC8vIEtp4buDbSB0cmEgdsOgIGPhuq1wIG5o4bqtdCBo4bqhbiBz4butIGThu6VuZyB2w6AgZ2nhuqNtIGdpw6EgdHLGsOG7m2Mga2hpIHRy4bqjIHbhu4EgY2hpIHRp4bq/dCBz4bqjbiBwaOG6qW1cclxuICAgIGF3YWl0IHVwZGF0ZVByb2R1Y3RFeHBpcmF0aW9ucygpO1xyXG5cclxuICAgIGNvbnN0IHByb2R1Y3QgPSBhd2FpdCBQcm9kdWN0LmZpbmRCeUlkKGlkKTtcclxuICAgIGlmICghcHJvZHVjdCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW1cIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDaHV54buDbiDEkeG7lWkgZOG7ryBsaeG7h3Ugc+G7kSB0aMOgbmggY2h14buXaVxyXG4gICAgY29uc3QgcHJvZHVjdFRvU2VuZCA9IHByb2R1Y3QudG9PYmplY3QoKTtcclxuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFByaWNlID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFByaWNlIHx8IFwiXCIpO1xyXG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0RGlzY291bnQgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0RGlzY291bnQgfHwgXCJcIik7XHJcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RTdG9jayA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RTdG9jayB8fCBcIlwiKTtcclxuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFdlaWdodCA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RXZWlnaHQgfHwgXCJcIik7XHJcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcm9tb1ByaWNlID0gU3RyaW5nKFxyXG4gICAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcm9tb1ByaWNlIHx8IFwiXCJcclxuICAgICk7XHJcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RXYXJyYW50eSA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RXYXJyYW50eSB8fCBcIlwiKTtcclxuXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbihwcm9kdWN0VG9TZW5kKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiBcIkzhuqV5IGNoaSB0aeG6v3Qgc+G6o24gcGjhuqltIHRo4bqldCBi4bqhaVwiLCBlcnJvciB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBUaMOqbSBBUEkgZW5kcG9pbnQgxJHhu4Mga2nhu4NtIHRyYSB2w6AgY+G6rXAgbmjhuq10IGjhuqFuIHPhu60gZOG7pW5nIHbDoCBnaeG6o20gZ2nDoVxyXG5leHBvcnQgY29uc3QgY2hlY2tBbmRVcGRhdGVFeHBpcmF0aW9ucyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB1cGRhdGVQcm9kdWN0RXhwaXJhdGlvbnMoKTtcclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJLaeG7g20gdHJhIHbDoCBj4bqtcCBuaOG6rXQgaOG6oW4gc+G6o24gcGjhuqltIHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgICByZXN1bHQsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCJD4bqtcCBuaOG6rXQgaOG6oW4gc+G6o24gcGjhuqltIHRo4bqldCBi4bqhaVwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBzZWFyY2hQcm9kdWN0cyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBsZXQgeyBuYW1lLCBwYWdlID0gMSwgbGltaXQgPSAxMCB9ID0gcmVxLnF1ZXJ5O1xyXG4gICAgcGFnZSA9IHBhcnNlSW50KHBhZ2UpID4gMCA/IHBhcnNlSW50KHBhZ2UpIDogMTtcclxuICAgIGxpbWl0ID0gTWF0aC5taW4ocGFyc2VJbnQobGltaXQpID4gMCA/IHBhcnNlSW50KGxpbWl0KSA6IDEwLCAxMDApO1xyXG5cclxuICAgIGlmICghbmFtZSB8fCB0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBtZXNzYWdlOiBcIkludmFsaWQgc2VhcmNoIGlucHV0XCIgfSk7XHJcbiAgICB9XHJcbiAgICBsZXQgc2VhcmNoUXVlcnkgPSB7XHJcbiAgICAgICRvcjogW1xyXG4gICAgICAgIHsgcHJvZHVjdE5hbWU6IHsgJHJlZ2V4OiBuYW1lLnRyaW0oKSwgJG9wdGlvbnM6IFwiaVwiIH0gfSxcclxuICAgICAgICB7IHByb2R1Y3RJbmZvOiB7ICRyZWdleDogbmFtZS50cmltKCksICRvcHRpb25zOiBcImlcIiB9IH0sXHJcbiAgICAgICAgeyBwcm9kdWN0Q2F0ZWdvcnk6IHsgJHJlZ2V4OiBuYW1lLnRyaW0oKSwgJG9wdGlvbnM6IFwiaVwiIH0gfSxcclxuICAgICAgICB7IHByb2R1Y3RCcmFuZDogeyAkcmVnZXg6IG5hbWUudHJpbSgpLCAkb3B0aW9uczogXCJpXCIgfSB9LFxyXG4gICAgICAgIHsgcHJvZHVjdENvZGU6IHsgJHJlZ2V4OiBuYW1lLnRyaW0oKSwgJG9wdGlvbnM6IFwiaVwiIH0gfSxcclxuICAgICAgICB7IHByb2R1Y3REZXRhaWxzOiB7ICRyZWdleDogbmFtZS50cmltKCksICRvcHRpb25zOiBcImlcIiB9IH0sXHJcbiAgICAgICAgeyBwcm9kdWN0T3JpZ2luOiB7ICRyZWdleDogbmFtZS50cmltKCksICRvcHRpb25zOiBcImlcIiB9IH0sXHJcbiAgICAgIF0sXHJcbiAgICB9O1xyXG4gICAgY29uc3QgcHJvZHVjdHMgPSBhd2FpdCBQcm9kdWN0LmZpbmQoc2VhcmNoUXVlcnkpXHJcbiAgICAgIC5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KVxyXG4gICAgICAuc2tpcCgocGFnZSAtIDEpICogbGltaXQpXHJcbiAgICAgIC5saW1pdChsaW1pdClcclxuICAgICAgLmxlYW4oKTtcclxuICAgIGNvbnN0IHRvdGFsID0gYXdhaXQgUHJvZHVjdC5jb3VudERvY3VtZW50cyhzZWFyY2hRdWVyeSk7XHJcblxyXG4gICAgLy8gQ2h1eeG7g24gxJHhu5VpIGThu68gbGnhu4d1IHPhu5EgdGjDoG5oIGNodeG7l2lcclxuICAgIGNvbnN0IHByb2R1Y3RzVG9TZW5kID0gcHJvZHVjdHMubWFwKChwcm9kdWN0KSA9PiB7XHJcbiAgICAgIHByb2R1Y3QucHJvZHVjdFByaWNlID0gU3RyaW5nKHByb2R1Y3QucHJvZHVjdFByaWNlIHx8IFwiXCIpO1xyXG4gICAgICBwcm9kdWN0LnByb2R1Y3REaXNjb3VudCA9IFN0cmluZyhwcm9kdWN0LnByb2R1Y3REaXNjb3VudCB8fCBcIlwiKTtcclxuICAgICAgcHJvZHVjdC5wcm9kdWN0U3RvY2sgPSBTdHJpbmcocHJvZHVjdC5wcm9kdWN0U3RvY2sgfHwgXCJcIik7XHJcbiAgICAgIHByb2R1Y3QucHJvZHVjdFdlaWdodCA9IFN0cmluZyhwcm9kdWN0LnByb2R1Y3RXZWlnaHQgfHwgXCJcIik7XHJcbiAgICAgIHByb2R1Y3QucHJvZHVjdFByb21vUHJpY2UgPSBTdHJpbmcocHJvZHVjdC5wcm9kdWN0UHJvbW9QcmljZSB8fCBcIlwiKTtcclxuICAgICAgcHJvZHVjdC5wcm9kdWN0V2FycmFudHkgPSBTdHJpbmcocHJvZHVjdC5wcm9kdWN0V2FycmFudHkgfHwgXCJcIik7XHJcbiAgICAgIHJldHVybiBwcm9kdWN0O1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgcHJvZHVjdHM6IHByb2R1Y3RzVG9TZW5kLFxyXG4gICAgICB0b3RhbCxcclxuICAgICAgcGFnZSxcclxuICAgICAgdG90YWxQYWdlczogTWF0aC5jZWlsKHRvdGFsIC8gbGltaXQpLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGlmIChlcnJvci5uYW1lID09PSBcIkNhc3RFcnJvclwiICYmIGVycm9yLnBhdGggPT09IFwiX2lkXCIpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgbWVzc2FnZTogXCJJbnZhbGlkIHNlYXJjaCBwYXJhbWV0ZXJcIiB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgbWVzc2FnZTogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIiwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGdldFByb2R1Y3RCeUNhdGVnb3J5ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGNhdGVnb3J5TmFtZSA9IHJlcS5wYXJhbXMuY2F0ZWdvcnk7XHJcbiAgICBjb25zdCBleGNsdWRlSWQgPSByZXEucXVlcnkuZXhjbHVkZUlkO1xyXG5cclxuICAgIGxldCBxdWVyeSA9IHsgcHJvZHVjdENhdGVnb3J5OiBjYXRlZ29yeU5hbWUgfTtcclxuICAgIGlmIChleGNsdWRlSWQpIHtcclxuICAgICAgcXVlcnkuX2lkID0geyAkbmU6IGV4Y2x1ZGVJZCB9O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHF1ZXJ5KTtcclxuXHJcbiAgICAvLyBDaHV54buDbiDEkeG7lWkgZOG7ryBsaeG7h3Ugc+G7kSB0aMOgbmggY2h14buXaVxyXG4gICAgY29uc3QgcHJvZHVjdHNUb1NlbmQgPSBwcm9kdWN0cy5tYXAoKHByb2R1Y3QpID0+IHtcclxuICAgICAgY29uc3QgcHJvZHVjdE9iaiA9IHByb2R1Y3QudG9PYmplY3QoKTtcclxuICAgICAgcHJvZHVjdE9iai5wcm9kdWN0UHJpY2UgPSBTdHJpbmcocHJvZHVjdE9iai5wcm9kdWN0UHJpY2UgfHwgXCJcIik7XHJcbiAgICAgIHByb2R1Y3RPYmoucHJvZHVjdERpc2NvdW50ID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdERpc2NvdW50IHx8IFwiXCIpO1xyXG4gICAgICBwcm9kdWN0T2JqLnByb2R1Y3RTdG9jayA9IFN0cmluZyhwcm9kdWN0T2JqLnByb2R1Y3RTdG9jayB8fCBcIlwiKTtcclxuICAgICAgcHJvZHVjdE9iai5wcm9kdWN0V2VpZ2h0ID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdFdlaWdodCB8fCBcIlwiKTtcclxuICAgICAgcHJvZHVjdE9iai5wcm9kdWN0UHJvbW9QcmljZSA9IFN0cmluZyhwcm9kdWN0T2JqLnByb2R1Y3RQcm9tb1ByaWNlIHx8IFwiXCIpO1xyXG4gICAgICBwcm9kdWN0T2JqLnByb2R1Y3RXYXJyYW50eSA9IFN0cmluZyhwcm9kdWN0T2JqLnByb2R1Y3RXYXJyYW50eSB8fCBcIlwiKTtcclxuICAgICAgcmV0dXJuIHByb2R1Y3RPYmo7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbihwcm9kdWN0c1RvU2VuZCk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlc1xyXG4gICAgICAuc3RhdHVzKDUwMClcclxuICAgICAgLmpzb24oeyBtZXNzYWdlOiBcIkzhuqV5IHPhuqNuIHBo4bqpbSB0aGVvIGRhbmggbeG7pWMgdGjhuqV0IGLhuqFpXCIsIGVycm9yIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCB1cGRhdGVQcm9kdWN0Q2F0ZWdvcnkgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBwcm9kdWN0SWQgfSA9IHJlcS5wYXJhbXM7XHJcbiAgICBjb25zdCB7IGNhdGVnb3J5SWQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGNvbnN0IGNhdGVnb3J5ID0gYXdhaXQgQ2F0ZWdvcnkuZmluZEJ5SWQoY2F0ZWdvcnlJZCk7XHJcbiAgICBpZiAoIWNhdGVnb3J5KSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IGRhbmggbeG7pWNcIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwcm9kdWN0ID0gYXdhaXQgUHJvZHVjdC5maW5kQnlJZEFuZFVwZGF0ZShcclxuICAgICAgcHJvZHVjdElkLFxyXG4gICAgICB7IHByb2R1Y3RDYXRlZ29yeTogY2F0ZWdvcnlJZCB9LFxyXG4gICAgICB7IG5ldzogdHJ1ZSB9XHJcbiAgICApO1xyXG5cclxuICAgIGlmICghcHJvZHVjdCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW1cIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwiQ+G6rXAgbmjhuq10IGRhbmggbeG7pWMgc+G6o24gcGjhuqltIHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgICBwcm9kdWN0LFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBpbiB1cGRhdGVQcm9kdWN0Q2F0ZWdvcnk6XCIsIGVycm9yKTtcclxuICAgIHJlc1xyXG4gICAgICAuc3RhdHVzKDUwMClcclxuICAgICAgLmpzb24oeyBtZXNzYWdlOiBcIkPhuq1wIG5o4bqtdCBkYW5oIG3hu6VjIHPhuqNuIHBo4bqpbSB0aOG6pXQgYuG6oWlcIiwgZXJyb3IgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gTOG6pXkgZGFuaCBzw6FjaCBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXlcclxuZXhwb3J0IGNvbnN0IGdldEJlc3RTZWxsaW5nUHJvZHVjdHMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgbGltaXQgPSBwYXJzZUludChyZXEucXVlcnkubGltaXQpIHx8IDQ7XHJcbiAgICBjb25zdCBwZXJpb2QgPSByZXEucXVlcnkucGVyaW9kIHx8IFwiYWxsXCI7XHJcblxyXG4gICAgLy8gVOG7sSB44butIGzDvSBs4bqleSBz4bqjbiBwaOG6qW0gdGjGsOG7nW5nIHRoYXkgdsOsIGTDuW5nIE1vZGVsLmdldEJlc3RTZWxsZXJzXHJcbiAgICBsZXQgYmVzdFNlbGxpbmdQcm9kdWN0cyA9IFtdO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGJlc3RTZWxsaW5nUHJvZHVjdHMgPSBhd2FpdCBCZXN0U2VsbGluZ1Byb2R1Y3QuZmluZCgpXHJcbiAgICAgICAgLnNvcnQoeyBzb2xkQ291bnQ6IC0xIH0pXHJcbiAgICAgICAgLmxpbWl0KGxpbWl0KVxyXG4gICAgICAgIC5wb3B1bGF0ZSh7XHJcbiAgICAgICAgICBwYXRoOiBcInByb2R1Y3RJZFwiLFxyXG4gICAgICAgICAgc2VsZWN0OlxyXG4gICAgICAgICAgICBcInByb2R1Y3ROYW1lIHByb2R1Y3RQcmljZSBwcm9kdWN0U3RhdHVzIHByb2R1Y3RJbWFnZXMgcHJvZHVjdERpc2NvdW50IHByb2R1Y3RTdG9jayBwcm9kdWN0Q2F0ZWdvcnlcIixcclxuICAgICAgICB9KTtcclxuICAgIH0gY2F0Y2ggKG1vZGVsRXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICBcIltnZXRCZXN0U2VsbGluZ1Byb2R1Y3RzXSBM4buXaSBraGkgdHJ1eSB24bqlbiBtb2RlbCBCZXN0U2VsbGluZ1Byb2R1Y3Q6XCIsXHJcbiAgICAgICAgbW9kZWxFcnJvclxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE7hur91IGtow7RuZyBjw7Mgc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5LCBs4bqleSBz4bqjbiBwaOG6qW0gdGjDtG5nIHRoxrDhu51uZ1xyXG4gICAgaWYgKCFiZXN0U2VsbGluZ1Byb2R1Y3RzIHx8IGJlc3RTZWxsaW5nUHJvZHVjdHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgIFwiW2dldEJlc3RTZWxsaW5nUHJvZHVjdHNdIEtow7RuZyBjw7MgZOG7ryBsaeG7h3Ugc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5LCBs4bqleSBz4bqjbiBwaOG6qW0gdGjDtG5nIHRoxrDhu51uZy4uLlwiXHJcbiAgICAgICk7XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IG5vcm1hbFByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHtcclxuICAgICAgICAgIHByb2R1Y3RTdGF0dXM6IHsgJG5lOiBcIkjhur90IGjDoG5nXCIgfSxcclxuICAgICAgICAgIHByb2R1Y3RTdG9jazogeyAkZ3Q6IDAgfSxcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgLnNvcnQoeyBjcmVhdGVkQXQ6IC0xIH0pXHJcbiAgICAgICAgICAubGltaXQobGltaXQpO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgIGBbZ2V0QmVzdFNlbGxpbmdQcm9kdWN0c10gVMOsbSB0aOG6pXkgJHtub3JtYWxQcm9kdWN0cy5sZW5ndGh9IHPhuqNuIHBo4bqpbSB0aMO0bmcgdGjGsOG7nW5nIMSR4buDIHRoYXkgdGjhur9gXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICBtZXNzYWdlOiBcIlRy4bqjIHbhu4Egc+G6o24gcGjhuqltIHRow7RuZyB0aMaw4budbmcgdGhheSB0aOG6v1wiLFxyXG4gICAgICAgICAgZGF0YTogbm9ybWFsUHJvZHVjdHMsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKHByb2R1Y3RFcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICBcIltnZXRCZXN0U2VsbGluZ1Byb2R1Y3RzXSBM4buXaSBraGkgbOG6pXkgc+G6o24gcGjhuqltIHRow7RuZyB0aMaw4budbmc6XCIsXHJcbiAgICAgICAgICBwcm9kdWN0RXJyb3JcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltIG7DoG9cIixcclxuICAgICAgICAgIGRhdGE6IFtdLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRm9ybWF0IGThu68gbGnhu4d1IHRy4bqjIHbhu4FcclxuICAgIGNvbnN0IGZvcm1hdHRlZFByb2R1Y3RzID0gYmVzdFNlbGxpbmdQcm9kdWN0c1xyXG4gICAgICAubWFwKChpdGVtKSA9PiB7XHJcbiAgICAgICAgLy8gTuG6v3Ugc+G6o24gcGjhuqltIMSRw6MgxJHGsOG7o2MgcG9wdWxhdGUgxJHhuqd5IMSR4bunXHJcbiAgICAgICAgaWYgKGl0ZW0ucHJvZHVjdElkICYmIHR5cGVvZiBpdGVtLnByb2R1Y3RJZCA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgICAgY29uc3QgcHJvZHVjdCA9IHtcclxuICAgICAgICAgICAgLi4uaXRlbS5wcm9kdWN0SWQudG9PYmplY3QoKSxcclxuICAgICAgICAgICAgc29sZENvdW50OiBpdGVtLnNvbGRDb3VudCxcclxuICAgICAgICAgICAgdG90YWxSZXZlbnVlOiBpdGVtLnRvdGFsUmV2ZW51ZSxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICByZXR1cm4gcHJvZHVjdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gVHLGsOG7nW5nIGjhu6NwIHByb2R1Y3RJZCBjaOG7iSBsw6AgaWQsIGtow7RuZyDEkcaw4bujYyBwb3B1bGF0ZVxyXG4gICAgICAgIHJldHVybiBpdGVtO1xyXG4gICAgICB9KVxyXG4gICAgICAuZmlsdGVyKChpdGVtKSA9PiBpdGVtICE9PSBudWxsICYmIGl0ZW0gIT09IHVuZGVmaW5lZCk7XHJcblxyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgIGBbZ2V0QmVzdFNlbGxpbmdQcm9kdWN0c10gVHLhuqMgduG7gSAke2Zvcm1hdHRlZFByb2R1Y3RzLmxlbmd0aH0gc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5IMSRw6MgxJHhu4tuaCBk4bqhbmdgXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwiTOG6pXkgZGFuaCBzw6FjaCBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXkgdGjDoG5oIGPDtG5nXCIsXHJcbiAgICAgIGRhdGE6IGZvcm1hdHRlZFByb2R1Y3RzLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJbZ2V0QmVzdFNlbGxpbmdQcm9kdWN0c10gTOG7l2k6XCIsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSBs4bqleSBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXlcIixcclxuICAgICAgZGF0YTogW10sIC8vIFRy4bqjIHbhu4EgbeG6o25nIHLhu5duZyB0aGF5IHbDrCBs4buXaSA1MDBcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEzhuqV5IGRhbmggc8OhY2ggc+G6o24gcGjhuqltIGPDsyDEkcOhbmggZ2nDoSBjYW8gbmjhuqV0XHJcbmV4cG9ydCBjb25zdCBnZXRUb3BSYXRlZFByb2R1Y3RzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGxpbWl0ID0gcGFyc2VJbnQocmVxLnF1ZXJ5LmxpbWl0KSB8fCA0O1xyXG5cclxuICAgIC8vIFTDrG0gc+G6o24gcGjhuqltIGPDsyDEkcOhbmggZ2nDoSBjYW8gbmjhuqV0XHJcbiAgICBjb25zdCB0b3BSYXRlZFByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHtcclxuICAgICAgcHJvZHVjdFN0YXR1czogeyAkbmU6IFwiSOG6v3QgaMOgbmdcIiB9LFxyXG4gICAgICBwcm9kdWN0U3RvY2s6IHsgJGd0OiAwIH0sXHJcbiAgICAgIGF2ZXJhZ2VSYXRpbmc6IHsgJGd0OiAwIH0sIC8vIENo4buJIGzhuqV5IHPhuqNuIHBo4bqpbSBjw7MgxJHDoW5oIGdpw6FcclxuICAgIH0pXHJcbiAgICAgIC5zb3J0KHsgYXZlcmFnZVJhdGluZzogLTEsIG51bU9mUmV2aWV3czogLTEgfSkgLy8gU+G6r3AgeOG6v3AgdGhlbyDEkcOhbmggZ2nDoSBjYW8gbmjhuqV0LCDGsHUgdGnDqm4gc+G6o24gcGjhuqltIGPDsyBuaGnhu4F1IMSRw6FuaCBnacOhXHJcbiAgICAgIC5saW1pdChsaW1pdClcclxuICAgICAgLnNlbGVjdChcclxuICAgICAgICBcInByb2R1Y3ROYW1lIHByb2R1Y3RQcmljZSBwcm9kdWN0U3RhdHVzIHByb2R1Y3RJbWFnZXMgcHJvZHVjdERpc2NvdW50IHByb2R1Y3RTdG9jayBwcm9kdWN0Q2F0ZWdvcnkgYXZlcmFnZVJhdGluZyBudW1PZlJldmlld3NcIlxyXG4gICAgICApO1xyXG5cclxuICAgIC8vIE7hur91IGtow7RuZyBjw7Mgc+G6o24gcGjhuqltIGPDsyDEkcOhbmggZ2nDoSwgbOG6pXkgc+G6o24gcGjhuqltIHRow7RuZyB0aMaw4budbmdcclxuICAgIGlmICghdG9wUmF0ZWRQcm9kdWN0cyB8fCB0b3BSYXRlZFByb2R1Y3RzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IG5vcm1hbFByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHtcclxuICAgICAgICAgIHByb2R1Y3RTdGF0dXM6IHsgJG5lOiBcIkjhur90IGjDoG5nXCIgfSxcclxuICAgICAgICAgIHByb2R1Y3RTdG9jazogeyAkZ3Q6IDAgfSxcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgLnNvcnQoeyBjcmVhdGVkQXQ6IC0xIH0pXHJcbiAgICAgICAgICAubGltaXQobGltaXQpO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgIG1lc3NhZ2U6IFwiVHLhuqMgduG7gSBz4bqjbiBwaOG6qW0gdGjDtG5nIHRoxrDhu51uZyB0aGF5IHRo4bq/XCIsXHJcbiAgICAgICAgICBkYXRhOiBub3JtYWxQcm9kdWN0cyxcclxuICAgICAgICB9KTtcclxuICAgICAgfSBjYXRjaCAocHJvZHVjdEVycm9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW0gbsOgb1wiLFxyXG4gICAgICAgICAgZGF0YTogW10sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIkzhuqV5IGRhbmggc8OhY2ggc+G6o24gcGjhuqltIGPDsyDEkcOhbmggZ2nDoSBjYW8gbmjhuqV0IHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgICBkYXRhOiB0b3BSYXRlZFByb2R1Y3RzLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgbOG6pXkgc+G6o24gcGjhuqltIGPDsyDEkcOhbmggZ2nDoSBjYW9cIixcclxuICAgICAgZGF0YTogW10sIC8vIFRy4bqjIHbhu4EgbeG6o25nIHLhu5duZyB0aGF5IHbDrCBs4buXaSA1MDBcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKioqKioqICA3Y2FiOGFkNi00MzQ1LTRmYjYtOTJmZi0yMTI5ZjhiODU4NDIgICoqKioqKiovXHJcbiJdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsSUFBQUEsV0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsV0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsbUJBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLEdBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLEtBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLFNBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFPLFdBQUEsR0FBQVIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFRLG9CQUFBLEdBQUFSLE9BQUEsdUNBRzRDLENBZDVDLHNEQUNB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