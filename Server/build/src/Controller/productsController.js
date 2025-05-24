"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.updateProductExpirations = exports.updateProductCategory = exports.updateProduct = exports.searchProducts = exports.getProductBySlug = exports.getProductById = exports.getProductByCategory = exports.getBestSellingProducts = exports.getAllProducts = exports.deleteProduct = exports.createProduct = exports.checkAndUpdateExpirations = void 0;


var _cloudinary = _interopRequireDefault(require("../config/cloudinary.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _Categories = _interopRequireDefault(require("../Model/Categories.js"));
var _BestSellingProduct = _interopRequireDefault(require("../Model/BestSellingProduct.js"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _adminModel = _interopRequireDefault(require("../Model/adminModel.js"));
var _notificationService = require("../Services/notificationService.js");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} /*************  ✨ Windsurf Command 🌟  *************/ /* eslint-disable no-unused-vars */ /* eslint-disable no-undef */ // Import Admin model


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
      productStatus
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
  try {
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

    const updatedProduct = await _Products.default.findByIdAndUpdate(
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
        discountStartDate,
        discountEndDate,
        expiryDate,
        productStatus
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
        path: 'productId',
        select: 'productName productPrice productStatus productImages productDiscount productStock productCategory'
      });


    } catch (modelError) {
      console.error("[getBestSellingProducts] Lỗi khi truy vấn model BestSellingProduct:", modelError);
    }

    // Nếu không có sản phẩm bán chạy, lấy sản phẩm thông thường
    if (!bestSellingProducts || bestSellingProducts.length === 0) {
      console.log('[getBestSellingProducts] Không có dữ liệu sản phẩm bán chạy, lấy sản phẩm thông thường...');

      try {
        const normalProducts = await _Products.default.find({
          productStatus: { $ne: 'Hết hàng' },
          productStock: { $gt: 0 }
        }).
        sort({ createdAt: -1 }).
        limit(limit);

        console.log(`[getBestSellingProducts] Tìm thấy ${normalProducts.length} sản phẩm thông thường để thay thế`);

        return res.status(200).json({
          success: true,
          message: "Trả về sản phẩm thông thường thay thế",
          data: normalProducts
        });
      } catch (productError) {
        console.error("[getBestSellingProducts] Lỗi khi lấy sản phẩm thông thường:", productError);
        return res.status(200).json({
          success: true,
          message: "Không tìm thấy sản phẩm nào",
          data: []
        });
      }
    }

    // Format dữ liệu trả về
    const formattedProducts = bestSellingProducts.map((item) => {
      // Nếu sản phẩm đã được populate đầy đủ
      if (item.productId && typeof item.productId === 'object') {
        const product = {
          ...item.productId.toObject(),
          soldCount: item.soldCount,
          totalRevenue: item.totalRevenue
        };
        return product;
      }
      // Trường hợp productId chỉ là id, không được populate
      return item;
    }).filter((item) => item !== null && item !== undefined);

    console.log(`[getBestSellingProducts] Trả về ${formattedProducts.length} sản phẩm bán chạy đã định dạng`);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm bán chạy thành công",
      data: formattedProducts
    });
  } catch (error) {
    console.error('[getBestSellingProducts] Lỗi:', error.message);
    return res.status(200).json({
      success: true,
      message: "Đã xảy ra lỗi khi lấy sản phẩm bán chạy",
      data: [] // Trả về mảng rỗng thay vì lỗi 500
    });
  }
};

/*******  7cab8ad6-4345-4fb6-92ff-2129f8b85842  *******/exports.getBestSellingProducts = getBestSellingProducts;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfY2xvdWRpbmFyeSIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX1Byb2R1Y3RzIiwiX0NhdGVnb3JpZXMiLCJfQmVzdFNlbGxpbmdQcm9kdWN0IiwiX2ZzIiwiX3BhdGgiLCJfbW9uZ29vc2UiLCJfYWRtaW5Nb2RlbCIsIl9ub3RpZmljYXRpb25TZXJ2aWNlIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwidXBkYXRlUHJvZHVjdEV4cGlyYXRpb25zIiwiY3VycmVudERhdGUiLCJEYXRlIiwiZGlzY291bnRFeHBpcmVkUHJvZHVjdHMiLCJQcm9kdWN0IiwiZmluZCIsImRpc2NvdW50RW5kRGF0ZSIsIiRsdCIsInByb2R1Y3REaXNjb3VudCIsIiRndCIsInByb2R1Y3QiLCJwcm9kdWN0UHJvbW9QcmljZSIsImRpc2NvdW50U3RhcnREYXRlIiwic2F2ZSIsImNvbnNvbGUiLCJsb2ciLCJwcm9kdWN0TmFtZSIsImV4cGlyeURhdGVQcm9kdWN0cyIsImV4cGlyeURhdGUiLCJwcm9kdWN0U3RhdHVzIiwiJG5lIiwicHJvZHVjdFN0b2NrIiwiZGlzY291bnRVcGRhdGVkIiwibGVuZ3RoIiwiZXhwaXJ5VXBkYXRlZCIsImVycm9yIiwibWVzc2FnZSIsImV4cG9ydHMiLCJjcmVhdGVQcm9kdWN0IiwicmVxIiwicmVzIiwiYm9keSIsImltYWdlVXJscyIsInN0YXR1cyIsImpzb24iLCJjYXRlZ29yeSIsIkNhdGVnb3J5IiwiZmluZE9uZSIsIm5hbWVDYXRlZ29yeSIsInByb2R1Y3RDYXRlZ29yeSIsInVwbG9hZGVkVXJscyIsIkFycmF5IiwiaXNBcnJheSIsImRlc2NyaXB0aW9ucyIsInByb2R1Y3REZXNjcmlwdGlvbiIsIkpTT04iLCJwYXJzZSIsInNwbGl0IiwibmV3UHJvZHVjdCIsInByb2R1Y3RJbWFnZXMiLCJwcm9kdWN0UHJpY2UiLCJOdW1iZXIiLCJwcm9kdWN0V2VpZ2h0IiwicHJvZHVjdFVuaXQiLCJzYXZlZFByb2R1Y3QiLCJzZW5kTmV3UHJvZHVjdE5vdGlmaWNhdGlvbiIsImNhdGNoIiwiYWRtaW5zVG9Ob3RpZnkiLCJBZG1pbiIsIiRvciIsInJvbGUiLCJwZXJtaXNzaW9ucyIsIiRpbiIsIiRleGlzdHMiLCJub3RpZmljYXRpb25QYXlsb2FkIiwidGl0bGUiLCJkYXRhIiwidXJsIiwiX2lkIiwicHJvZHVjdElkIiwiYWRtaW4iLCJzdWJzY3JpcHRpb24iLCJwdXNoU3Vic2NyaXB0aW9ucyIsInNlbmRQdXNoTm90aWZpY2F0aW9uIiwicHJvZHVjdFRvU2VuZCIsInRvT2JqZWN0IiwiU3RyaW5nIiwicHJvZHVjdFdhcnJhbnR5IiwidG9JU09TdHJpbmciLCJzdWNjZXNzIiwiZXJyb3JEZXRhaWxzIiwicHJvY2VzcyIsImVudiIsIk5PREVfRU5WIiwic3RhY2siLCJ1bmRlZmluZWQiLCJnZXRBbGxQcm9kdWN0cyIsInByb2R1Y3RzIiwicHJvZHVjdHNUb1NlbmQiLCJtYXAiLCJwcm9kdWN0T2JqIiwiZ2V0UHJvZHVjdEJ5U2x1ZyIsInNsdWciLCJwYXJhbXMiLCJwIiwidG9Mb3dlckNhc2UiLCJub3JtYWxpemUiLCJyZXBsYWNlIiwidXBkYXRlUHJvZHVjdCIsImlkIiwiZmluZEJ5SWQiLCJuZXdJbWFnZVVybHMiLCJleGlzdGluZ0ltYWdlcyIsImtlZXBJbWFnZXMiLCJmaWx0ZXIiLCJpbWciLCJpbmNsdWRlcyIsImltYWdlc1RvRGVsZXRlIiwiUHJvbWlzZSIsImFsbCIsInB1YmxpY0lkIiwicG9wIiwiY2xvdWRpbmFyeSIsInVwbG9hZGVyIiwiZGVzdHJveSIsImRlc2MiLCJ0cmltIiwidXBkYXRlZFByb2R1Y3QiLCJmaW5kQnlJZEFuZFVwZGF0ZSIsIm5ldyIsImRlbGV0ZVByb2R1Y3QiLCJmaW5kQnlJZEFuZERlbGV0ZSIsImdldFByb2R1Y3RCeUlkIiwiY2hlY2tBbmRVcGRhdGVFeHBpcmF0aW9ucyIsInJlc3VsdCIsInNlYXJjaFByb2R1Y3RzIiwibmFtZSIsInBhZ2UiLCJsaW1pdCIsInF1ZXJ5IiwicGFyc2VJbnQiLCJNYXRoIiwibWluIiwic2VhcmNoUXVlcnkiLCIkcmVnZXgiLCIkb3B0aW9ucyIsInByb2R1Y3RJbmZvIiwicHJvZHVjdEJyYW5kIiwicHJvZHVjdENvZGUiLCJwcm9kdWN0RGV0YWlscyIsInByb2R1Y3RPcmlnaW4iLCJzb3J0IiwiY3JlYXRlZEF0Iiwic2tpcCIsImxlYW4iLCJ0b3RhbCIsImNvdW50RG9jdW1lbnRzIiwidG90YWxQYWdlcyIsImNlaWwiLCJwYXRoIiwiZ2V0UHJvZHVjdEJ5Q2F0ZWdvcnkiLCJjYXRlZ29yeU5hbWUiLCJleGNsdWRlSWQiLCJ1cGRhdGVQcm9kdWN0Q2F0ZWdvcnkiLCJjYXRlZ29yeUlkIiwiZ2V0QmVzdFNlbGxpbmdQcm9kdWN0cyIsInBlcmlvZCIsImJlc3RTZWxsaW5nUHJvZHVjdHMiLCJCZXN0U2VsbGluZ1Byb2R1Y3QiLCJzb2xkQ291bnQiLCJwb3B1bGF0ZSIsInNlbGVjdCIsIm1vZGVsRXJyb3IiLCJub3JtYWxQcm9kdWN0cyIsInByb2R1Y3RFcnJvciIsImZvcm1hdHRlZFByb2R1Y3RzIiwiaXRlbSIsInRvdGFsUmV2ZW51ZSJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9Db250cm9sbGVyL3Byb2R1Y3RzQ29udHJvbGxlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKioqKioqKioqKioqKiAg4pyoIFdpbmRzdXJmIENvbW1hbmQg8J+MnyAgKioqKioqKioqKioqKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xuaW1wb3J0IGNsb3VkaW5hcnkgZnJvbSBcIi4uL2NvbmZpZy9jbG91ZGluYXJ5LmpzXCI7XG5pbXBvcnQgUHJvZHVjdCBmcm9tIFwiLi4vTW9kZWwvUHJvZHVjdHMuanNcIjtcbmltcG9ydCBDYXRlZ29yeSBmcm9tIFwiLi4vTW9kZWwvQ2F0ZWdvcmllcy5qc1wiO1xuaW1wb3J0IEJlc3RTZWxsaW5nUHJvZHVjdCBmcm9tIFwiLi4vTW9kZWwvQmVzdFNlbGxpbmdQcm9kdWN0LmpzXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IG1vbmdvb3NlIGZyb20gXCJtb25nb29zZVwiO1xuaW1wb3J0IEFkbWluIGZyb20gXCIuLi9Nb2RlbC9hZG1pbk1vZGVsLmpzXCI7IC8vIEltcG9ydCBBZG1pbiBtb2RlbFxuaW1wb3J0IHtcbiAgc2VuZFB1c2hOb3RpZmljYXRpb24sXG4gIHNlbmROZXdQcm9kdWN0Tm90aWZpY2F0aW9uLFxufSBmcm9tIFwiLi4vU2VydmljZXMvbm90aWZpY2F0aW9uU2VydmljZS5qc1wiOyAvLyBJbXBvcnQgdGjDqm0gc2VuZE5ld1Byb2R1Y3ROb3RpZmljYXRpb25cblxuLy8gVGjDqm0gaMOgbSBraeG7g20gdHJhIHbDoCBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSBz4bqjbiBwaOG6qW0gZOG7sWEgdsOgbyB0aOG7nWkgaOG6oW4gZ2nhuqNtIGdpw6EgdsOgIGjhuqFuIHPhu60gZOG7pW5nXG5leHBvcnQgY29uc3QgdXBkYXRlUHJvZHVjdEV4cGlyYXRpb25zID0gYXN5bmMgKCkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGN1cnJlbnREYXRlID0gbmV3IERhdGUoKTtcblxuICAgIC8vIEPhuq1wIG5o4bqtdCBnaeG6o20gZ2nDoSBj4bunYSBz4bqjbiBwaOG6qW0gxJHDoyBo4bq/dCB0aOG7nWkgaOG6oW4gZ2nhuqNtIGdpw6FcbiAgICBjb25zdCBkaXNjb3VudEV4cGlyZWRQcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuZmluZCh7XG4gICAgICBkaXNjb3VudEVuZERhdGU6IHsgJGx0OiBjdXJyZW50RGF0ZSB9LFxuICAgICAgcHJvZHVjdERpc2NvdW50OiB7ICRndDogMCB9LFxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIGRpc2NvdW50RXhwaXJlZFByb2R1Y3RzKSB7XG4gICAgICBwcm9kdWN0LnByb2R1Y3REaXNjb3VudCA9IDA7XG4gICAgICBwcm9kdWN0LnByb2R1Y3RQcm9tb1ByaWNlID0gMDtcbiAgICAgIHByb2R1Y3QuZGlzY291bnRTdGFydERhdGUgPSBudWxsO1xuICAgICAgcHJvZHVjdC5kaXNjb3VudEVuZERhdGUgPSBudWxsO1xuICAgICAgYXdhaXQgcHJvZHVjdC5zYXZlKCk7XG4gICAgICBjb25zb2xlLmxvZyhgxJDDoyBj4bqtcCBuaOG6rXQgZ2nDoSBn4buRYyBjaG8gc+G6o24gcGjhuqltOiAke3Byb2R1Y3QucHJvZHVjdE5hbWV9YCk7XG4gICAgfVxuXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgc+G6o24gcGjhuqltIMSRw6MgaOG6v3QgaOG6oW4gc+G7rSBk4bulbmdcbiAgICBjb25zdCBleHBpcnlEYXRlUHJvZHVjdHMgPSBhd2FpdCBQcm9kdWN0LmZpbmQoe1xuICAgICAgZXhwaXJ5RGF0ZTogeyAkbHQ6IGN1cnJlbnREYXRlIH0sXG4gICAgICBwcm9kdWN0U3RhdHVzOiB7ICRuZTogXCJI4bq/dCBow6BuZ1wiIH0sXG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IHByb2R1Y3Qgb2YgZXhwaXJ5RGF0ZVByb2R1Y3RzKSB7XG4gICAgICBwcm9kdWN0LnByb2R1Y3RTdGF0dXMgPSBcIkjhur90IGjDoG5nXCI7XG4gICAgICBwcm9kdWN0LnByb2R1Y3RTdG9jayA9IDA7XG4gICAgICBhd2FpdCBwcm9kdWN0LnNhdmUoKTtcbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgxJDDoyBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSBcIkjhur90IGjDoG5nXCIgY2hvIHPhuqNuIHBo4bqpbTogJHtwcm9kdWN0LnByb2R1Y3ROYW1lfWBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGRpc2NvdW50VXBkYXRlZDogZGlzY291bnRFeHBpcmVkUHJvZHVjdHMubGVuZ3RoLFxuICAgICAgZXhwaXJ5VXBkYXRlZDogZXhwaXJ5RGF0ZVByb2R1Y3RzLmxlbmd0aCxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IGjhuqFuIHPhuqNuIHBo4bqpbTpcIiwgZXJyb3IpO1xuICAgIHJldHVybiB7IGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVQcm9kdWN0ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgLy8gS2nhu4NtIHRyYSBu4bq/dSBraMO0bmcgY8OzIGltYWdlVXJsc1xuICAgIGlmICghcmVxLmJvZHkuaW1hZ2VVcmxzIHx8IHJlcS5ib2R5LmltYWdlVXJscy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiByZXNcbiAgICAgICAgLnN0YXR1cyg0MDApXG4gICAgICAgIC5qc29uKHsgbWVzc2FnZTogXCJWdWkgbMOybmcgdOG6o2kgbMOqbiDDrXQgbmjhuqV0IG3hu5l0IGjDrG5oIOG6o25oXCIgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgY2F0ZWdvcnkgPSBhd2FpdCBDYXRlZ29yeS5maW5kT25lKHtcbiAgICAgIG5hbWVDYXRlZ29yeTogcmVxLmJvZHkucHJvZHVjdENhdGVnb3J5LFxuICAgIH0pO1xuICAgIGlmICghY2F0ZWdvcnkpIHtcbiAgICAgIHJldHVybiByZXNcbiAgICAgICAgLnN0YXR1cyg0MDApXG4gICAgICAgIC5qc29uKHsgbWVzc2FnZTogXCJEYW5oIG3hu6VjIHPhuqNuIHBo4bqpbSBraMO0bmcgdOG7k24gdOG6oWlcIiB9KTtcbiAgICB9XG5cbiAgICAvLyBT4butIGThu6VuZyBVUkxzIMSRw6MgxJHGsOG7o2MgdXBsb2FkIHRow7RuZyBxdWEgQ2xvdWRpbmFyeSB3aWRnZXRcbiAgICBjb25zdCB1cGxvYWRlZFVybHMgPSBBcnJheS5pc0FycmF5KHJlcS5ib2R5LmltYWdlVXJscylcbiAgICAgID8gcmVxLmJvZHkuaW1hZ2VVcmxzXG4gICAgICA6IFtyZXEuYm9keS5pbWFnZVVybHNdO1xuXG4gICAgbGV0IGRlc2NyaXB0aW9ucyA9IFtdO1xuICAgIHRyeSB7XG4gICAgICBkZXNjcmlwdGlvbnMgPVxuICAgICAgICB0eXBlb2YgcmVxLmJvZHkucHJvZHVjdERlc2NyaXB0aW9uID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgPyBKU09OLnBhcnNlKHJlcS5ib2R5LnByb2R1Y3REZXNjcmlwdGlvbilcbiAgICAgICAgICA6IHJlcS5ib2R5LnByb2R1Y3REZXNjcmlwdGlvbjtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgZGVzY3JpcHRpb25zID0gcmVxLmJvZHkucHJvZHVjdERlc2NyaXB0aW9uLnNwbGl0KFwiLFwiKTtcbiAgICB9XG5cbiAgICAvLyBY4butIGzDvSB0aMO0bmcgdGluIG5nw6B5IGLhuq90IMSR4bqndSB2w6Aga+G6v3QgdGjDumMgZ2nhuqNtIGdpw6FcbiAgICBsZXQgZGlzY291bnRTdGFydERhdGUgPSBudWxsO1xuICAgIGxldCBkaXNjb3VudEVuZERhdGUgPSBudWxsO1xuXG4gICAgaWYgKHJlcS5ib2R5LmRpc2NvdW50U3RhcnREYXRlKSB7XG4gICAgICBkaXNjb3VudFN0YXJ0RGF0ZSA9IG5ldyBEYXRlKHJlcS5ib2R5LmRpc2NvdW50U3RhcnREYXRlKTtcbiAgICB9XG5cbiAgICBpZiAocmVxLmJvZHkuZGlzY291bnRFbmREYXRlKSB7XG4gICAgICBkaXNjb3VudEVuZERhdGUgPSBuZXcgRGF0ZShyZXEuYm9keS5kaXNjb3VudEVuZERhdGUpO1xuICAgIH1cblxuICAgIC8vIFjhu60gbMO9IGjhuqFuIHPhu60gZOG7pW5nXG4gICAgbGV0IGV4cGlyeURhdGUgPSBudWxsO1xuICAgIGxldCBwcm9kdWN0U3RhdHVzID0gcmVxLmJvZHkucHJvZHVjdFN0YXR1cyB8fCBcIkPDsm4gaMOgbmdcIjtcblxuICAgIGlmIChyZXEuYm9keS5leHBpcnlEYXRlKSB7XG4gICAgICBleHBpcnlEYXRlID0gbmV3IERhdGUocmVxLmJvZHkuZXhwaXJ5RGF0ZSk7XG5cbiAgICAgIC8vIE7hur91IGjhuqFuIHPhu60gZOG7pW5nIMSRw6MgcXVhLCBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aMOgbmggXCJI4bq/dCBow6BuZ1wiXG4gICAgICBpZiAoZXhwaXJ5RGF0ZSA8IG5ldyBEYXRlKCkpIHtcbiAgICAgICAgcHJvZHVjdFN0YXR1cyA9IFwiSOG6v3QgaMOgbmdcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBuZXdQcm9kdWN0ID0gbmV3IFByb2R1Y3Qoe1xuICAgICAgLi4ucmVxLmJvZHksXG4gICAgICBwcm9kdWN0SW1hZ2VzOiB1cGxvYWRlZFVybHMsXG4gICAgICBwcm9kdWN0RGVzY3JpcHRpb246IGRlc2NyaXB0aW9ucyxcbiAgICAgIHByb2R1Y3RQcmljZTogTnVtYmVyKHJlcS5ib2R5LnByb2R1Y3RQcmljZSksXG4gICAgICBwcm9kdWN0RGlzY291bnQ6IE51bWJlcihyZXEuYm9keS5wcm9kdWN0RGlzY291bnQpIHx8IDAsXG4gICAgICBwcm9kdWN0U3RvY2s6IE51bWJlcihyZXEuYm9keS5wcm9kdWN0U3RvY2spIHx8IDAsXG4gICAgICBwcm9kdWN0V2VpZ2h0OiBOdW1iZXIocmVxLmJvZHkucHJvZHVjdFdlaWdodCkgfHwgMCxcbiAgICAgIHByb2R1Y3RDYXRlZ29yeTogY2F0ZWdvcnkubmFtZUNhdGVnb3J5LFxuICAgICAgcHJvZHVjdFVuaXQ6IHJlcS5ib2R5LnByb2R1Y3RVbml0IHx8IFwiZ3JhbVwiLFxuICAgICAgZGlzY291bnRTdGFydERhdGUsXG4gICAgICBkaXNjb3VudEVuZERhdGUsXG4gICAgICBleHBpcnlEYXRlLFxuICAgICAgcHJvZHVjdFN0YXR1cyxcbiAgICB9KTtcblxuICAgIC8vIFTDrW5oIHByb2R1Y3RQcm9tb1ByaWNlIHThu6sgcHJvZHVjdFByaWNlIHbDoCBwcm9kdWN0RGlzY291bnRcbiAgICBpZiAobmV3UHJvZHVjdC5wcm9kdWN0RGlzY291bnQgPiAwKSB7XG4gICAgICBuZXdQcm9kdWN0LnByb2R1Y3RQcm9tb1ByaWNlID1cbiAgICAgICAgbmV3UHJvZHVjdC5wcm9kdWN0UHJpY2UgKiAoMSAtIG5ld1Byb2R1Y3QucHJvZHVjdERpc2NvdW50IC8gMTAwKTtcbiAgICB9XG5cbiAgICBjb25zdCBzYXZlZFByb2R1Y3QgPSBhd2FpdCBuZXdQcm9kdWN0LnNhdmUoKTtcblxuICAgIC8vIC0tLSBQdXNoIE5vdGlmaWNhdGlvbiBMb2dpYyBmb3IgTmV3IFByb2R1Y3QgLS0tXG4gICAgLy8gR+G7rWkgdGjDtG5nIGLDoW8gxJHhur9uIHThuqV0IGPhuqMgbmfGsOG7nWkgZMO5bmcgY8OzIMSRxINuZyBrw70gbmjhuq1uIHRow7RuZyBiw6FvXG4gICAgc2VuZE5ld1Byb2R1Y3ROb3RpZmljYXRpb24oc2F2ZWRQcm9kdWN0KS5jYXRjaCgoZXJyb3IpID0+XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3Igc2VuZGluZyBwcm9kdWN0IG5vdGlmaWNhdGlvbiB0byB1c2VyczpcIiwgZXJyb3IpXG4gICAgKTtcblxuICAgIC8vIE5vdGlmaWNhdGlvbiBmb3IgYWRtaW5zIC0gduG6q24gZ2nhu68gbOG6oWlcbiAgICBjb25zdCBhZG1pbnNUb05vdGlmeSA9IGF3YWl0IEFkbWluLmZpbmQoe1xuICAgICAgJG9yOiBbXG4gICAgICAgIHsgcm9sZTogXCJhZG1pblwiIH0sIC8vIEFkbWluIGdldHMgYWxsIG5vdGlmaWNhdGlvbnNcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwibWFuYWdlclwiLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiB7ICRpbjogW1wiUXXhuqNuIGzDvSBz4bqjbiBwaOG6qW1cIiwgXCJwcm9kdWN0c1wiXSB9LFxuICAgICAgICB9LCAvLyBNYW5hZ2VycyB3aXRoIHByb2R1Y3QgcGVybWlzc2lvblxuICAgICAgXSxcbiAgICAgIFwicHVzaFN1YnNjcmlwdGlvbnMuMFwiOiB7ICRleGlzdHM6IHRydWUgfSwgLy8gT25seSB1c2VycyB3aXRoIGF0IGxlYXN0IG9uZSBzdWJzY3JpcHRpb25cbiAgICB9KTtcblxuICAgIGNvbnN0IG5vdGlmaWNhdGlvblBheWxvYWQgPSB7XG4gICAgICB0aXRsZTogXCJT4bqjbiBwaOG6qW0gbeG7m2lcIixcbiAgICAgIGJvZHk6IGBT4bqjbiBwaOG6qW0gXCIke3NhdmVkUHJvZHVjdC5wcm9kdWN0TmFtZX1cIiDEkcOjIMSRxrDhu6NjIHRow6ptIG3hu5tpLmAsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHVybDogYC9hZG1pbi9wcm9kdWN0cy9lZGl0LyR7c2F2ZWRQcm9kdWN0Ll9pZH1gLFxuICAgICAgICBwcm9kdWN0SWQ6IHNhdmVkUHJvZHVjdC5faWQsXG4gICAgICB9LFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IGFkbWluIG9mIGFkbWluc1RvTm90aWZ5KSB7XG4gICAgICBmb3IgKGNvbnN0IHN1YnNjcmlwdGlvbiBvZiBhZG1pbi5wdXNoU3Vic2NyaXB0aW9ucykge1xuICAgICAgICBzZW5kUHVzaE5vdGlmaWNhdGlvbihcbiAgICAgICAgICBhZG1pbi5faWQsXG4gICAgICAgICAgc3Vic2NyaXB0aW9uLFxuICAgICAgICAgIG5vdGlmaWNhdGlvblBheWxvYWRcbiAgICAgICAgKS5jYXRjaCgoZXJyb3IpID0+XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHNlbmRpbmcgbm90aWZpY2F0aW9uIHRvIGFkbWluOlwiLCBlcnJvcilcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gLS0tIEVuZCBQdXNoIE5vdGlmaWNhdGlvbiBMb2dpYyAtLS1cblxuICAgIC8vIENodXnhu4NuIMSR4buVaSBk4buvIGxp4buHdSBz4buRIHRow6BuaCBjaHXhu5dpIHRyxrDhu5tjIGtoaSBn4butaSB24buBIGNsaWVudFxuICAgIGNvbnN0IHByb2R1Y3RUb1NlbmQgPSBzYXZlZFByb2R1Y3QudG9PYmplY3QoKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcmljZSA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcmljZSk7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0RGlzY291bnQgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0RGlzY291bnQpO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFN0b2NrID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFN0b2NrKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RXZWlnaHQgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0V2VpZ2h0KTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcm9tb1ByaWNlID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFByb21vUHJpY2UpO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFdhcnJhbnR5ID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFdhcnJhbnR5KTtcblxuICAgIC8vIEZvcm1hdCBkaXNjb3VudCBkYXRlc1xuICAgIGlmIChwcm9kdWN0VG9TZW5kLmRpc2NvdW50U3RhcnREYXRlKSB7XG4gICAgICBwcm9kdWN0VG9TZW5kLmRpc2NvdW50U3RhcnREYXRlID1cbiAgICAgICAgcHJvZHVjdFRvU2VuZC5kaXNjb3VudFN0YXJ0RGF0ZS50b0lTT1N0cmluZygpO1xuICAgIH1cbiAgICBpZiAocHJvZHVjdFRvU2VuZC5kaXNjb3VudEVuZERhdGUpIHtcbiAgICAgIHByb2R1Y3RUb1NlbmQuZGlzY291bnRFbmREYXRlID1cbiAgICAgICAgcHJvZHVjdFRvU2VuZC5kaXNjb3VudEVuZERhdGUudG9JU09TdHJpbmcoKTtcbiAgICB9XG4gICAgLy8gRm9ybWF0IGV4cGlyeSBkYXRlXG4gICAgaWYgKHByb2R1Y3RUb1NlbmQuZXhwaXJ5RGF0ZSkge1xuICAgICAgcHJvZHVjdFRvU2VuZC5leHBpcnlEYXRlID0gcHJvZHVjdFRvU2VuZC5leHBpcnlEYXRlLnRvSVNPU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKHByb2R1Y3RUb1NlbmQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBpbiBjcmVhdGVQcm9kdWN0OlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgIGVycm9yRGV0YWlsczpcbiAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIiA/IGVycm9yLnN0YWNrIDogdW5kZWZpbmVkLFxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0QWxsUHJvZHVjdHMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICAvLyBLaeG7g20gdHJhIHbDoCBj4bqtcCBuaOG6rXQgaOG6oW4gc+G7rSBk4bulbmcgdsOgIGdp4bqjbSBnacOhIHRyxrDhu5tjIGtoaSB0cuG6oyB24buBIGRhbmggc8OhY2hcbiAgICBhd2FpdCB1cGRhdGVQcm9kdWN0RXhwaXJhdGlvbnMoKTtcblxuICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKCk7XG5cbiAgICAvLyBDaHV54buDbiDEkeG7lWkgZOG7ryBsaeG7h3Ugc+G7kSB0aMOgbmggY2h14buXaVxuICAgIGNvbnN0IHByb2R1Y3RzVG9TZW5kID0gcHJvZHVjdHMubWFwKChwcm9kdWN0KSA9PiB7XG4gICAgICBjb25zdCBwcm9kdWN0T2JqID0gcHJvZHVjdC50b09iamVjdCgpO1xuICAgICAgcHJvZHVjdE9iai5wcm9kdWN0UHJpY2UgPSBTdHJpbmcocHJvZHVjdE9iai5wcm9kdWN0UHJpY2UgfHwgXCJcIik7XG4gICAgICBwcm9kdWN0T2JqLnByb2R1Y3REaXNjb3VudCA9IFN0cmluZyhwcm9kdWN0T2JqLnByb2R1Y3REaXNjb3VudCB8fCBcIlwiKTtcbiAgICAgIHByb2R1Y3RPYmoucHJvZHVjdFN0b2NrID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdFN0b2NrIHx8IFwiXCIpO1xuICAgICAgcHJvZHVjdE9iai5wcm9kdWN0V2VpZ2h0ID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdFdlaWdodCB8fCBcIlwiKTtcbiAgICAgIHByb2R1Y3RPYmoucHJvZHVjdFByb21vUHJpY2UgPSBTdHJpbmcocHJvZHVjdE9iai5wcm9kdWN0UHJvbW9QcmljZSB8fCBcIlwiKTtcbiAgICAgIHByb2R1Y3RPYmoucHJvZHVjdFdhcnJhbnR5ID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdFdhcnJhbnR5IHx8IFwiXCIpO1xuICAgICAgcmV0dXJuIHByb2R1Y3RPYmo7XG4gICAgfSk7XG5cbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbihwcm9kdWN0c1RvU2VuZCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiBcIkzhuqV5IGRhbmggc8OhY2ggc+G6o24gcGjhuqltIHRo4bqldCBi4bqhaVwiLCBlcnJvciB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGdldFByb2R1Y3RCeVNsdWcgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgeyBzbHVnIH0gPSByZXEucGFyYW1zO1xuICB0cnkge1xuICAgIC8vIEtp4buDbSB0cmEgdsOgIGPhuq1wIG5o4bqtdCBo4bqhbiBz4butIGThu6VuZyB2w6AgZ2nhuqNtIGdpw6EgdHLGsOG7m2Mga2hpIHRy4bqjIHbhu4Egc+G6o24gcGjhuqltXG4gICAgYXdhaXQgdXBkYXRlUHJvZHVjdEV4cGlyYXRpb25zKCk7XG5cbiAgICBjb25zdCBwcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuZmluZCgpO1xuICAgIGNvbnN0IHByb2R1Y3QgPSBwcm9kdWN0cy5maW5kKFxuICAgICAgKHApID0+XG4gICAgICAgIHAucHJvZHVjdE5hbWVcbiAgICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAgIC5ub3JtYWxpemUoXCJORkRcIilcbiAgICAgICAgICAucmVwbGFjZSgvW1xcdTAzMDAtXFx1MDM2Zl0vZywgXCJcIilcbiAgICAgICAgICAucmVwbGFjZSgvW15hLXowLTldKy9nLCBcIi1cIilcbiAgICAgICAgICAucmVwbGFjZSgvKF4tfC0kKS9nLCBcIlwiKSA9PT0gc2x1Z1xuICAgICk7XG5cbiAgICBpZiAoIXByb2R1Y3QpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbVwiIH0pO1xuICAgIH1cblxuICAgIC8vIENodXnhu4NuIMSR4buVaSBk4buvIGxp4buHdSBz4buRIHRow6BuaCBjaHXhu5dpXG4gICAgY29uc3QgcHJvZHVjdFRvU2VuZCA9IHByb2R1Y3QudG9PYmplY3QoKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcmljZSA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcmljZSB8fCBcIlwiKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3REaXNjb3VudCA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3REaXNjb3VudCB8fCBcIlwiKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RTdG9jayA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RTdG9jayB8fCBcIlwiKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RXZWlnaHQgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0V2VpZ2h0IHx8IFwiXCIpO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFByb21vUHJpY2UgPSBTdHJpbmcoXG4gICAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcm9tb1ByaWNlIHx8IFwiXCJcbiAgICApO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFdhcnJhbnR5ID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFdhcnJhbnR5IHx8IFwiXCIpO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24ocHJvZHVjdFRvU2VuZCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiBcIkzhuqV5IGNoaSB0aeG6v3Qgc+G6o24gcGjhuqltIHRo4bqldCBi4bqhaVwiLCBlcnJvciB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IHVwZGF0ZVByb2R1Y3QgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgeyBpZCB9ID0gcmVxLnBhcmFtcztcbiAgdHJ5IHtcbiAgICBjb25zdCBwcm9kdWN0ID0gYXdhaXQgUHJvZHVjdC5maW5kQnlJZChpZCk7XG4gICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW1cIiB9KTtcbiAgICB9XG5cbiAgICAvLyBLaeG7g20gdHJhIGRhbmggbeG7pWMgbeG7m2kgbuG6v3UgY8OzIHRoYXkgxJHhu5VpXG4gICAgaWYgKFxuICAgICAgcmVxLmJvZHkucHJvZHVjdENhdGVnb3J5ICYmXG4gICAgICByZXEuYm9keS5wcm9kdWN0Q2F0ZWdvcnkgIT09IHByb2R1Y3QucHJvZHVjdENhdGVnb3J5XG4gICAgKSB7XG4gICAgICBjb25zdCBjYXRlZ29yeSA9IGF3YWl0IENhdGVnb3J5LmZpbmRPbmUoe1xuICAgICAgICBuYW1lQ2F0ZWdvcnk6IHJlcS5ib2R5LnByb2R1Y3RDYXRlZ29yeSxcbiAgICAgIH0pO1xuICAgICAgaWYgKCFjYXRlZ29yeSkge1xuICAgICAgICByZXR1cm4gcmVzXG4gICAgICAgICAgLnN0YXR1cyg0MDApXG4gICAgICAgICAgLmpzb24oeyBtZXNzYWdlOiBcIkRhbmggbeG7pWMgc+G6o24gcGjhuqltIGtow7RuZyB04buTbiB04bqhaVwiIH0pO1xuICAgICAgfVxuICAgICAgcmVxLmJvZHkucHJvZHVjdENhdGVnb3J5ID0gY2F0ZWdvcnkubmFtZUNhdGVnb3J5O1xuICAgIH1cblxuICAgIC8vIFPhu60gZOG7pW5nIFVSTHMgxJHDoyDEkcaw4bujYyB1cGxvYWQgdGjDtG5nIHF1YSBDbG91ZGluYXJ5IHdpZGdldFxuICAgIGxldCBuZXdJbWFnZVVybHMgPSBbXTtcbiAgICBpZiAocmVxLmJvZHkubmV3SW1hZ2VVcmxzICYmIHJlcS5ib2R5Lm5ld0ltYWdlVXJscy5sZW5ndGggPiAwKSB7XG4gICAgICBuZXdJbWFnZVVybHMgPSBBcnJheS5pc0FycmF5KHJlcS5ib2R5Lm5ld0ltYWdlVXJscylcbiAgICAgICAgPyByZXEuYm9keS5uZXdJbWFnZVVybHNcbiAgICAgICAgOiBbcmVxLmJvZHkubmV3SW1hZ2VVcmxzXTtcbiAgICB9XG5cbiAgICBsZXQgZXhpc3RpbmdJbWFnZXMgPSBwcm9kdWN0LnByb2R1Y3RJbWFnZXMgfHwgW107XG4gICAgaWYgKHJlcS5ib2R5LmtlZXBJbWFnZXMpIHtcbiAgICAgIGNvbnN0IGtlZXBJbWFnZXMgPSBBcnJheS5pc0FycmF5KHJlcS5ib2R5LmtlZXBJbWFnZXMpXG4gICAgICAgID8gcmVxLmJvZHkua2VlcEltYWdlc1xuICAgICAgICA6IEpTT04ucGFyc2UocmVxLmJvZHkua2VlcEltYWdlcyk7XG5cbiAgICAgIGV4aXN0aW5nSW1hZ2VzID0gZXhpc3RpbmdJbWFnZXMuZmlsdGVyKChpbWcpID0+IGtlZXBJbWFnZXMuaW5jbHVkZXMoaW1nKSk7XG5cbiAgICAgIGNvbnN0IGltYWdlc1RvRGVsZXRlID0gcHJvZHVjdC5wcm9kdWN0SW1hZ2VzLmZpbHRlcihcbiAgICAgICAgKGltZykgPT4gIWtlZXBJbWFnZXMuaW5jbHVkZXMoaW1nKVxuICAgICAgKTtcblxuICAgICAgLy8gWMOzYSBjw6FjIOG6o25oIGtow7RuZyBnaeG7ryBs4bqhaVxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIGltYWdlc1RvRGVsZXRlLm1hcCgoaW1nKSA9PiB7XG4gICAgICAgICAgY29uc3QgcHVibGljSWQgPSBpbWcuc3BsaXQoXCIvXCIpLnBvcCgpLnNwbGl0KFwiLlwiKVswXTtcbiAgICAgICAgICByZXR1cm4gY2xvdWRpbmFyeS51cGxvYWRlci5kZXN0cm95KGBwcm9kdWN0cy8ke3B1YmxpY0lkfWApO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBsZXQgcHJvZHVjdERlc2NyaXB0aW9uID0gcHJvZHVjdC5wcm9kdWN0RGVzY3JpcHRpb247XG4gICAgaWYgKHJlcS5ib2R5LnByb2R1Y3REZXNjcmlwdGlvbikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcHJvZHVjdERlc2NyaXB0aW9uID0gSlNPTi5wYXJzZShyZXEuYm9keS5wcm9kdWN0RGVzY3JpcHRpb24pO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcHJvZHVjdERlc2NyaXB0aW9uID0gcmVxLmJvZHkucHJvZHVjdERlc2NyaXB0aW9uXG4gICAgICAgICAgLnNwbGl0KFwiLlwiKVxuICAgICAgICAgIC5tYXAoKGRlc2MpID0+IGRlc2MudHJpbSgpKVxuICAgICAgICAgIC5maWx0ZXIoKGRlc2MpID0+IGRlc2MgIT09IFwiXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFjhu60gbMO9IHRow7RuZyB0aW4gbmfDoHkgYuG6r3QgxJHhuqd1IHbDoCBr4bq/dCB0aMO6YyBnaeG6o20gZ2nDoVxuICAgIGxldCBkaXNjb3VudFN0YXJ0RGF0ZSA9IHByb2R1Y3QuZGlzY291bnRTdGFydERhdGU7XG4gICAgbGV0IGRpc2NvdW50RW5kRGF0ZSA9IHByb2R1Y3QuZGlzY291bnRFbmREYXRlO1xuXG4gICAgaWYgKHJlcS5ib2R5LmRpc2NvdW50U3RhcnREYXRlKSB7XG4gICAgICBkaXNjb3VudFN0YXJ0RGF0ZSA9IG5ldyBEYXRlKHJlcS5ib2R5LmRpc2NvdW50U3RhcnREYXRlKTtcbiAgICB9IGVsc2UgaWYgKHJlcS5ib2R5LmRpc2NvdW50U3RhcnREYXRlID09PSBudWxsKSB7XG4gICAgICBkaXNjb3VudFN0YXJ0RGF0ZSA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHJlcS5ib2R5LmRpc2NvdW50RW5kRGF0ZSkge1xuICAgICAgZGlzY291bnRFbmREYXRlID0gbmV3IERhdGUocmVxLmJvZHkuZGlzY291bnRFbmREYXRlKTtcbiAgICB9IGVsc2UgaWYgKHJlcS5ib2R5LmRpc2NvdW50RW5kRGF0ZSA9PT0gbnVsbCkge1xuICAgICAgZGlzY291bnRFbmREYXRlID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBY4butIGzDvSBo4bqhbiBz4butIGThu6VuZ1xuICAgIGxldCBleHBpcnlEYXRlID0gcHJvZHVjdC5leHBpcnlEYXRlO1xuICAgIGxldCBwcm9kdWN0U3RhdHVzID0gcmVxLmJvZHkucHJvZHVjdFN0YXR1cyB8fCBwcm9kdWN0LnByb2R1Y3RTdGF0dXM7XG5cbiAgICBpZiAocmVxLmJvZHkuZXhwaXJ5RGF0ZSkge1xuICAgICAgZXhwaXJ5RGF0ZSA9IG5ldyBEYXRlKHJlcS5ib2R5LmV4cGlyeURhdGUpO1xuXG4gICAgICAvLyBO4bq/dSBo4bqhbiBz4butIGThu6VuZyDEkcOjIHF1YSwgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgdGjDoG5oIFwiSOG6v3QgaMOgbmdcIlxuICAgICAgaWYgKGV4cGlyeURhdGUgPCBuZXcgRGF0ZSgpKSB7XG4gICAgICAgIHByb2R1Y3RTdGF0dXMgPSBcIkjhur90IGjDoG5nXCI7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChyZXEuYm9keS5leHBpcnlEYXRlID09PSBudWxsKSB7XG4gICAgICBleHBpcnlEYXRlID0gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkUHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWRBbmRVcGRhdGUoXG4gICAgICBpZCxcbiAgICAgIHtcbiAgICAgICAgLi4ucmVxLmJvZHksXG4gICAgICAgIHByb2R1Y3RJbWFnZXM6IFsuLi5leGlzdGluZ0ltYWdlcywgLi4ubmV3SW1hZ2VVcmxzXSxcbiAgICAgICAgcHJvZHVjdERlc2NyaXB0aW9uLFxuICAgICAgICBwcm9kdWN0UHJpY2U6IE51bWJlcihyZXEuYm9keS5wcm9kdWN0UHJpY2UpLFxuICAgICAgICBwcm9kdWN0RGlzY291bnQ6IE51bWJlcihyZXEuYm9keS5wcm9kdWN0RGlzY291bnQpIHx8IDAsXG4gICAgICAgIHByb2R1Y3RTdG9jazogTnVtYmVyKHJlcS5ib2R5LnByb2R1Y3RTdG9jaykgfHwgMCxcbiAgICAgICAgcHJvZHVjdFdlaWdodDogTnVtYmVyKHJlcS5ib2R5LnByb2R1Y3RXZWlnaHQpIHx8IDAsXG4gICAgICAgIHByb2R1Y3RXYXJyYW50eTogTnVtYmVyKHJlcS5ib2R5LnByb2R1Y3RXYXJyYW50eSkgfHwgMCxcbiAgICAgICAgcHJvZHVjdFVuaXQ6IHJlcS5ib2R5LnByb2R1Y3RVbml0IHx8IHByb2R1Y3QucHJvZHVjdFVuaXQgfHwgXCJncmFtXCIsXG4gICAgICAgIGRpc2NvdW50U3RhcnREYXRlLFxuICAgICAgICBkaXNjb3VudEVuZERhdGUsXG4gICAgICAgIGV4cGlyeURhdGUsXG4gICAgICAgIHByb2R1Y3RTdGF0dXMsXG4gICAgICB9LFxuICAgICAgeyBuZXc6IHRydWUgfVxuICAgICk7XG5cbiAgICAvLyBUw61uaCBs4bqhaSBwcm9kdWN0UHJvbW9QcmljZSBzYXUga2hpIGPhuq1wIG5o4bqtdFxuICAgIGlmICh1cGRhdGVkUHJvZHVjdC5wcm9kdWN0RGlzY291bnQgPiAwKSB7XG4gICAgICB1cGRhdGVkUHJvZHVjdC5wcm9kdWN0UHJvbW9QcmljZSA9XG4gICAgICAgIHVwZGF0ZWRQcm9kdWN0LnByb2R1Y3RQcmljZSAqXG4gICAgICAgICgxIC0gdXBkYXRlZFByb2R1Y3QucHJvZHVjdERpc2NvdW50IC8gMTAwKTtcbiAgICAgIGF3YWl0IHVwZGF0ZWRQcm9kdWN0LnNhdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlZFByb2R1Y3QucHJvZHVjdFByb21vUHJpY2UgPSAwO1xuICAgICAgYXdhaXQgdXBkYXRlZFByb2R1Y3Quc2F2ZSgpO1xuICAgIH1cblxuICAgIC8vIENodXnhu4NuIMSR4buVaSBk4buvIGxp4buHdSBz4buRIHRow6BuaCBjaHXhu5dpIHRyxrDhu5tjIGtoaSBn4butaSB24buBIGNsaWVudFxuICAgIGNvbnN0IHByb2R1Y3RUb1NlbmQgPSB1cGRhdGVkUHJvZHVjdC50b09iamVjdCgpO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFByaWNlID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFByaWNlKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3REaXNjb3VudCA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3REaXNjb3VudCk7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0U3RvY2sgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0U3RvY2spO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFdlaWdodCA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RXZWlnaHQpO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFByb21vUHJpY2UgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJvbW9QcmljZSk7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0V2FycmFudHkgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0V2FycmFudHkpO1xuXG4gICAgLy8gRm9ybWF0IGRpc2NvdW50IGRhdGVzXG4gICAgaWYgKHByb2R1Y3RUb1NlbmQuZGlzY291bnRTdGFydERhdGUpIHtcbiAgICAgIHByb2R1Y3RUb1NlbmQuZGlzY291bnRTdGFydERhdGUgPVxuICAgICAgICBwcm9kdWN0VG9TZW5kLmRpc2NvdW50U3RhcnREYXRlLnRvSVNPU3RyaW5nKCk7XG4gICAgfVxuICAgIGlmIChwcm9kdWN0VG9TZW5kLmRpc2NvdW50RW5kRGF0ZSkge1xuICAgICAgcHJvZHVjdFRvU2VuZC5kaXNjb3VudEVuZERhdGUgPVxuICAgICAgICBwcm9kdWN0VG9TZW5kLmRpc2NvdW50RW5kRGF0ZS50b0lTT1N0cmluZygpO1xuICAgIH1cbiAgICAvLyBGb3JtYXQgZXhwaXJ5IGRhdGVcbiAgICBpZiAocHJvZHVjdFRvU2VuZC5leHBpcnlEYXRlKSB7XG4gICAgICBwcm9kdWN0VG9TZW5kLmV4cGlyeURhdGUgPSBwcm9kdWN0VG9TZW5kLmV4cGlyeURhdGUudG9JU09TdHJpbmcoKTtcbiAgICB9XG5cbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCJD4bqtcCBuaOG6rXQgc+G6o24gcGjhuqltIHRow6BuaCBjw7RuZ1wiLFxuICAgICAgcHJvZHVjdDogcHJvZHVjdFRvU2VuZCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGPhuq1wIG5o4bqtdCBz4bqjbiBwaOG6qW06XCIsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwiQ+G6rXAgbmjhuq10IHPhuqNuIHBo4bqpbSB0aOG6pXQgYuG6oWlcIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgZGVsZXRlUHJvZHVjdCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCB7IGlkIH0gPSByZXEucGFyYW1zO1xuICB0cnkge1xuICAgIGNvbnN0IHByb2R1Y3QgPSBhd2FpdCBQcm9kdWN0LmZpbmRCeUlkQW5kRGVsZXRlKGlkKTtcbiAgICBpZiAoIXByb2R1Y3QpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbVwiIH0pO1xuICAgIH1cbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7IG1lc3NhZ2U6IFwiWMOzYSBz4bqjbiBwaOG6qW0gdGjDoG5oIGPDtG5nXCIgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiBcIljDs2Egc+G6o24gcGjhuqltIHRo4bqldCBi4bqhaVwiLCBlcnJvciB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGdldFByb2R1Y3RCeUlkID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IHsgaWQgfSA9IHJlcS5wYXJhbXM7XG4gIHRyeSB7XG4gICAgLy8gS2nhu4NtIHRyYSB2w6AgY+G6rXAgbmjhuq10IGjhuqFuIHPhu60gZOG7pW5nIHbDoCBnaeG6o20gZ2nDoSB0csaw4bubYyBraGkgdHLhuqMgduG7gSBjaGkgdGnhur90IHPhuqNuIHBo4bqpbVxuICAgIGF3YWl0IHVwZGF0ZVByb2R1Y3RFeHBpcmF0aW9ucygpO1xuXG4gICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQoaWQpO1xuICAgIGlmICghcHJvZHVjdCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltXCIgfSk7XG4gICAgfVxuXG4gICAgLy8gQ2h1eeG7g24gxJHhu5VpIGThu68gbGnhu4d1IHPhu5EgdGjDoG5oIGNodeG7l2lcbiAgICBjb25zdCBwcm9kdWN0VG9TZW5kID0gcHJvZHVjdC50b09iamVjdCgpO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFByaWNlID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFByaWNlIHx8IFwiXCIpO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdERpc2NvdW50ID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdERpc2NvdW50IHx8IFwiXCIpO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFN0b2NrID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFN0b2NrIHx8IFwiXCIpO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFdlaWdodCA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RXZWlnaHQgfHwgXCJcIik7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJvbW9QcmljZSA9IFN0cmluZyhcbiAgICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdFByb21vUHJpY2UgfHwgXCJcIlxuICAgICk7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0V2FycmFudHkgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0V2FycmFudHkgfHwgXCJcIik7XG5cbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbihwcm9kdWN0VG9TZW5kKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6IFwiTOG6pXkgY2hpIHRp4bq/dCBz4bqjbiBwaOG6qW0gdGjhuqV0IGLhuqFpXCIsIGVycm9yIH0pO1xuICB9XG59O1xuXG4vLyBUaMOqbSBBUEkgZW5kcG9pbnQgxJHhu4Mga2nhu4NtIHRyYSB2w6AgY+G6rXAgbmjhuq10IGjhuqFuIHPhu60gZOG7pW5nIHbDoCBnaeG6o20gZ2nDoVxuZXhwb3J0IGNvbnN0IGNoZWNrQW5kVXBkYXRlRXhwaXJhdGlvbnMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB1cGRhdGVQcm9kdWN0RXhwaXJhdGlvbnMoKTtcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCJLaeG7g20gdHJhIHbDoCBj4bqtcCBuaOG6rXQgaOG6oW4gc+G6o24gcGjhuqltIHRow6BuaCBjw7RuZ1wiLFxuICAgICAgcmVzdWx0LFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJD4bqtcCBuaOG6rXQgaOG6oW4gc+G6o24gcGjhuqltIHRo4bqldCBi4bqhaVwiLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXG4gICAgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBzZWFyY2hQcm9kdWN0cyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGxldCB7IG5hbWUsIHBhZ2UgPSAxLCBsaW1pdCA9IDEwIH0gPSByZXEucXVlcnk7XG4gICAgcGFnZSA9IHBhcnNlSW50KHBhZ2UpID4gMCA/IHBhcnNlSW50KHBhZ2UpIDogMTtcbiAgICBsaW1pdCA9IE1hdGgubWluKHBhcnNlSW50KGxpbWl0KSA+IDAgPyBwYXJzZUludChsaW1pdCkgOiAxMCwgMTAwKTtcblxuICAgIGlmICghbmFtZSB8fCB0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgbWVzc2FnZTogXCJJbnZhbGlkIHNlYXJjaCBpbnB1dFwiIH0pO1xuICAgIH1cbiAgICBsZXQgc2VhcmNoUXVlcnkgPSB7XG4gICAgICAkb3I6IFtcbiAgICAgICAgeyBwcm9kdWN0TmFtZTogeyAkcmVnZXg6IG5hbWUudHJpbSgpLCAkb3B0aW9uczogXCJpXCIgfSB9LFxuICAgICAgICB7IHByb2R1Y3RJbmZvOiB7ICRyZWdleDogbmFtZS50cmltKCksICRvcHRpb25zOiBcImlcIiB9IH0sXG4gICAgICAgIHsgcHJvZHVjdENhdGVnb3J5OiB7ICRyZWdleDogbmFtZS50cmltKCksICRvcHRpb25zOiBcImlcIiB9IH0sXG4gICAgICAgIHsgcHJvZHVjdEJyYW5kOiB7ICRyZWdleDogbmFtZS50cmltKCksICRvcHRpb25zOiBcImlcIiB9IH0sXG4gICAgICAgIHsgcHJvZHVjdENvZGU6IHsgJHJlZ2V4OiBuYW1lLnRyaW0oKSwgJG9wdGlvbnM6IFwiaVwiIH0gfSxcbiAgICAgICAgeyBwcm9kdWN0RGV0YWlsczogeyAkcmVnZXg6IG5hbWUudHJpbSgpLCAkb3B0aW9uczogXCJpXCIgfSB9LFxuICAgICAgICB7IHByb2R1Y3RPcmlnaW46IHsgJHJlZ2V4OiBuYW1lLnRyaW0oKSwgJG9wdGlvbnM6IFwiaVwiIH0gfSxcbiAgICAgIF0sXG4gICAgfTtcbiAgICBjb25zdCBwcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuZmluZChzZWFyY2hRdWVyeSlcbiAgICAgIC5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KVxuICAgICAgLnNraXAoKHBhZ2UgLSAxKSAqIGxpbWl0KVxuICAgICAgLmxpbWl0KGxpbWl0KVxuICAgICAgLmxlYW4oKTtcbiAgICBjb25zdCB0b3RhbCA9IGF3YWl0IFByb2R1Y3QuY291bnREb2N1bWVudHMoc2VhcmNoUXVlcnkpO1xuXG4gICAgLy8gQ2h1eeG7g24gxJHhu5VpIGThu68gbGnhu4d1IHPhu5EgdGjDoG5oIGNodeG7l2lcbiAgICBjb25zdCBwcm9kdWN0c1RvU2VuZCA9IHByb2R1Y3RzLm1hcCgocHJvZHVjdCkgPT4ge1xuICAgICAgcHJvZHVjdC5wcm9kdWN0UHJpY2UgPSBTdHJpbmcocHJvZHVjdC5wcm9kdWN0UHJpY2UgfHwgXCJcIik7XG4gICAgICBwcm9kdWN0LnByb2R1Y3REaXNjb3VudCA9IFN0cmluZyhwcm9kdWN0LnByb2R1Y3REaXNjb3VudCB8fCBcIlwiKTtcbiAgICAgIHByb2R1Y3QucHJvZHVjdFN0b2NrID0gU3RyaW5nKHByb2R1Y3QucHJvZHVjdFN0b2NrIHx8IFwiXCIpO1xuICAgICAgcHJvZHVjdC5wcm9kdWN0V2VpZ2h0ID0gU3RyaW5nKHByb2R1Y3QucHJvZHVjdFdlaWdodCB8fCBcIlwiKTtcbiAgICAgIHByb2R1Y3QucHJvZHVjdFByb21vUHJpY2UgPSBTdHJpbmcocHJvZHVjdC5wcm9kdWN0UHJvbW9QcmljZSB8fCBcIlwiKTtcbiAgICAgIHByb2R1Y3QucHJvZHVjdFdhcnJhbnR5ID0gU3RyaW5nKHByb2R1Y3QucHJvZHVjdFdhcnJhbnR5IHx8IFwiXCIpO1xuICAgICAgcmV0dXJuIHByb2R1Y3Q7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgcHJvZHVjdHM6IHByb2R1Y3RzVG9TZW5kLFxuICAgICAgdG90YWwsXG4gICAgICBwYWdlLFxuICAgICAgdG90YWxQYWdlczogTWF0aC5jZWlsKHRvdGFsIC8gbGltaXQpLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChlcnJvci5uYW1lID09PSBcIkNhc3RFcnJvclwiICYmIGVycm9yLnBhdGggPT09IFwiX2lkXCIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IG1lc3NhZ2U6IFwiSW52YWxpZCBzZWFyY2ggcGFyYW1ldGVyXCIgfSk7XG4gICAgfVxuICAgIHJldHVybiByZXNcbiAgICAgIC5zdGF0dXMoNTAwKVxuICAgICAgLmpzb24oeyBtZXNzYWdlOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGdldFByb2R1Y3RCeUNhdGVnb3J5ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgY2F0ZWdvcnlOYW1lID0gcmVxLnBhcmFtcy5jYXRlZ29yeTtcbiAgICBjb25zdCBleGNsdWRlSWQgPSByZXEucXVlcnkuZXhjbHVkZUlkO1xuXG4gICAgbGV0IHF1ZXJ5ID0geyBwcm9kdWN0Q2F0ZWdvcnk6IGNhdGVnb3J5TmFtZSB9O1xuICAgIGlmIChleGNsdWRlSWQpIHtcbiAgICAgIHF1ZXJ5Ll9pZCA9IHsgJG5lOiBleGNsdWRlSWQgfTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuZmluZChxdWVyeSk7XG5cbiAgICAvLyBDaHV54buDbiDEkeG7lWkgZOG7ryBsaeG7h3Ugc+G7kSB0aMOgbmggY2h14buXaVxuICAgIGNvbnN0IHByb2R1Y3RzVG9TZW5kID0gcHJvZHVjdHMubWFwKChwcm9kdWN0KSA9PiB7XG4gICAgICBjb25zdCBwcm9kdWN0T2JqID0gcHJvZHVjdC50b09iamVjdCgpO1xuICAgICAgcHJvZHVjdE9iai5wcm9kdWN0UHJpY2UgPSBTdHJpbmcocHJvZHVjdE9iai5wcm9kdWN0UHJpY2UgfHwgXCJcIik7XG4gICAgICBwcm9kdWN0T2JqLnByb2R1Y3REaXNjb3VudCA9IFN0cmluZyhwcm9kdWN0T2JqLnByb2R1Y3REaXNjb3VudCB8fCBcIlwiKTtcbiAgICAgIHByb2R1Y3RPYmoucHJvZHVjdFN0b2NrID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdFN0b2NrIHx8IFwiXCIpO1xuICAgICAgcHJvZHVjdE9iai5wcm9kdWN0V2VpZ2h0ID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdFdlaWdodCB8fCBcIlwiKTtcbiAgICAgIHByb2R1Y3RPYmoucHJvZHVjdFByb21vUHJpY2UgPSBTdHJpbmcocHJvZHVjdE9iai5wcm9kdWN0UHJvbW9QcmljZSB8fCBcIlwiKTtcbiAgICAgIHByb2R1Y3RPYmoucHJvZHVjdFdhcnJhbnR5ID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdFdhcnJhbnR5IHx8IFwiXCIpO1xuICAgICAgcmV0dXJuIHByb2R1Y3RPYmo7XG4gICAgfSk7XG5cbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbihwcm9kdWN0c1RvU2VuZCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmVzXG4gICAgICAuc3RhdHVzKDUwMClcbiAgICAgIC5qc29uKHsgbWVzc2FnZTogXCJM4bqleSBz4bqjbiBwaOG6qW0gdGhlbyBkYW5oIG3hu6VjIHRo4bqldCBi4bqhaVwiLCBlcnJvciB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IHVwZGF0ZVByb2R1Y3RDYXRlZ29yeSA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgcHJvZHVjdElkIH0gPSByZXEucGFyYW1zO1xuICAgIGNvbnN0IHsgY2F0ZWdvcnlJZCB9ID0gcmVxLmJvZHk7XG5cbiAgICBjb25zdCBjYXRlZ29yeSA9IGF3YWl0IENhdGVnb3J5LmZpbmRCeUlkKGNhdGVnb3J5SWQpO1xuICAgIGlmICghY2F0ZWdvcnkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IGRhbmggbeG7pWNcIiB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9kdWN0ID0gYXdhaXQgUHJvZHVjdC5maW5kQnlJZEFuZFVwZGF0ZShcbiAgICAgIHByb2R1Y3RJZCxcbiAgICAgIHsgcHJvZHVjdENhdGVnb3J5OiBjYXRlZ29yeUlkIH0sXG4gICAgICB7IG5ldzogdHJ1ZSB9XG4gICAgKTtcblxuICAgIGlmICghcHJvZHVjdCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltXCIgfSk7XG4gICAgfVxuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwiQ+G6rXAgbmjhuq10IGRhbmggbeG7pWMgc+G6o24gcGjhuqltIHRow6BuaCBjw7RuZ1wiLFxuICAgICAgcHJvZHVjdCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgaW4gdXBkYXRlUHJvZHVjdENhdGVnb3J5OlwiLCBlcnJvcik7XG4gICAgcmVzXG4gICAgICAuc3RhdHVzKDUwMClcbiAgICAgIC5qc29uKHsgbWVzc2FnZTogXCJD4bqtcCBuaOG6rXQgZGFuaCBt4bulYyBz4bqjbiBwaOG6qW0gdGjhuqV0IGLhuqFpXCIsIGVycm9yIH0pO1xuICB9XG59O1xuXG4vLyBM4bqleSBkYW5oIHPDoWNoIHPhuqNuIHBo4bqpbSBiw6FuIGNo4bqheVxuZXhwb3J0IGNvbnN0IGdldEJlc3RTZWxsaW5nUHJvZHVjdHMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBsaW1pdCA9IHBhcnNlSW50KHJlcS5xdWVyeS5saW1pdCkgfHwgNDtcbiAgICBjb25zdCBwZXJpb2QgPSByZXEucXVlcnkucGVyaW9kIHx8IFwiYWxsXCI7XG5cbiAgICBcblxuICAgIC8vIFThu7EgeOG7rSBsw70gbOG6pXkgc+G6o24gcGjhuqltIHRoxrDhu51uZyB0aGF5IHbDrCBkw7luZyBNb2RlbC5nZXRCZXN0U2VsbGVyc1xuICAgIGxldCBiZXN0U2VsbGluZ1Byb2R1Y3RzID0gW107XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIGJlc3RTZWxsaW5nUHJvZHVjdHMgPSBhd2FpdCBCZXN0U2VsbGluZ1Byb2R1Y3QuZmluZCgpXG4gICAgICAgIC5zb3J0KHsgc29sZENvdW50OiAtMSB9KVxuICAgICAgICAubGltaXQobGltaXQpXG4gICAgICAgIC5wb3B1bGF0ZSh7XG4gICAgICAgICAgcGF0aDogJ3Byb2R1Y3RJZCcsXG4gICAgICAgICAgc2VsZWN0OiAncHJvZHVjdE5hbWUgcHJvZHVjdFByaWNlIHByb2R1Y3RTdGF0dXMgcHJvZHVjdEltYWdlcyBwcm9kdWN0RGlzY291bnQgcHJvZHVjdFN0b2NrIHByb2R1Y3RDYXRlZ29yeSdcbiAgICAgICAgfSk7XG4gICAgICBcbiAgICAgXG4gICAgfSBjYXRjaCAobW9kZWxFcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIltnZXRCZXN0U2VsbGluZ1Byb2R1Y3RzXSBM4buXaSBraGkgdHJ1eSB24bqlbiBtb2RlbCBCZXN0U2VsbGluZ1Byb2R1Y3Q6XCIsIG1vZGVsRXJyb3IpO1xuICAgIH1cbiAgICBcbiAgICAvLyBO4bq/dSBraMO0bmcgY8OzIHPhuqNuIHBo4bqpbSBiw6FuIGNo4bqheSwgbOG6pXkgc+G6o24gcGjhuqltIHRow7RuZyB0aMaw4budbmdcbiAgICBpZiAoIWJlc3RTZWxsaW5nUHJvZHVjdHMgfHwgYmVzdFNlbGxpbmdQcm9kdWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbZ2V0QmVzdFNlbGxpbmdQcm9kdWN0c10gS2jDtG5nIGPDsyBk4buvIGxp4buHdSBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXksIGzhuqV5IHPhuqNuIHBo4bqpbSB0aMO0bmcgdGjGsOG7nW5nLi4uJyk7XG4gICAgICBcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG5vcm1hbFByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHtcbiAgICAgICAgICBwcm9kdWN0U3RhdHVzOiB7ICRuZTogJ0jhur90IGjDoG5nJyB9LFxuICAgICAgICAgIHByb2R1Y3RTdG9jazogeyAkZ3Q6IDAgfVxuICAgICAgICB9KVxuICAgICAgICAuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSlcbiAgICAgICAgLmxpbWl0KGxpbWl0KTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKGBbZ2V0QmVzdFNlbGxpbmdQcm9kdWN0c10gVMOsbSB0aOG6pXkgJHtub3JtYWxQcm9kdWN0cy5sZW5ndGh9IHPhuqNuIHBo4bqpbSB0aMO0bmcgdGjGsOG7nW5nIMSR4buDIHRoYXkgdGjhur9gKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICBtZXNzYWdlOiBcIlRy4bqjIHbhu4Egc+G6o24gcGjhuqltIHRow7RuZyB0aMaw4budbmcgdGhheSB0aOG6v1wiLFxuICAgICAgICAgIGRhdGE6IG5vcm1hbFByb2R1Y3RzXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAocHJvZHVjdEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbZ2V0QmVzdFNlbGxpbmdQcm9kdWN0c10gTOG7l2kga2hpIGzhuqV5IHPhuqNuIHBo4bqpbSB0aMO0bmcgdGjGsOG7nW5nOlwiLCBwcm9kdWN0RXJyb3IpO1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltIG7DoG9cIixcbiAgICAgICAgICBkYXRhOiBbXVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGb3JtYXQgZOG7ryBsaeG7h3UgdHLhuqMgduG7gVxuICAgIGNvbnN0IGZvcm1hdHRlZFByb2R1Y3RzID0gYmVzdFNlbGxpbmdQcm9kdWN0cy5tYXAoaXRlbSA9PiB7XG4gICAgICAvLyBO4bq/dSBz4bqjbiBwaOG6qW0gxJHDoyDEkcaw4bujYyBwb3B1bGF0ZSDEkeG6p3kgxJHhu6dcbiAgICAgIGlmIChpdGVtLnByb2R1Y3RJZCAmJiB0eXBlb2YgaXRlbS5wcm9kdWN0SWQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB7XG4gICAgICAgICAgLi4uaXRlbS5wcm9kdWN0SWQudG9PYmplY3QoKSxcbiAgICAgICAgICBzb2xkQ291bnQ6IGl0ZW0uc29sZENvdW50LFxuICAgICAgICAgIHRvdGFsUmV2ZW51ZTogaXRlbS50b3RhbFJldmVudWVcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHByb2R1Y3Q7XG4gICAgICB9IFxuICAgICAgLy8gVHLGsOG7nW5nIGjhu6NwIHByb2R1Y3RJZCBjaOG7iSBsw6AgaWQsIGtow7RuZyDEkcaw4bujYyBwb3B1bGF0ZVxuICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfSkuZmlsdGVyKGl0ZW0gPT4gaXRlbSAhPT0gbnVsbCAmJiBpdGVtICE9PSB1bmRlZmluZWQpO1xuXG4gICAgY29uc29sZS5sb2coYFtnZXRCZXN0U2VsbGluZ1Byb2R1Y3RzXSBUcuG6oyB24buBICR7Zm9ybWF0dGVkUHJvZHVjdHMubGVuZ3RofSBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXkgxJHDoyDEkeG7i25oIGThuqFuZ2ApO1xuICAgIFxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCJM4bqleSBkYW5oIHPDoWNoIHPhuqNuIHBo4bqpbSBiw6FuIGNo4bqheSB0aMOgbmggY8O0bmdcIixcbiAgICAgIGRhdGE6IGZvcm1hdHRlZFByb2R1Y3RzXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignW2dldEJlc3RTZWxsaW5nUHJvZHVjdHNdIEzhu5dpOicsIGVycm9yLm1lc3NhZ2UpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IFxuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgbOG6pXkgc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5XCIsXG4gICAgICBkYXRhOiBbXSAvLyBUcuG6oyB24buBIG3huqNuZyBy4buXbmcgdGhheSB2w6wgbOG7l2kgNTAwXG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKioqKioqICA3Y2FiOGFkNi00MzQ1LTRmYjYtOTJmZi0yMTI5ZjhiODU4NDIgICoqKioqKiovXG4iXSwibWFwcGluZ3MiOiI7OztBQUdBLElBQUFBLFdBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFdBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLG1CQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxHQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxLQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxTQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxXQUFBLEdBQUFSLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUSxvQkFBQSxHQUFBUixPQUFBLHVDQUc0QyxTQUFBRCx1QkFBQVUsQ0FBQSxVQUFBQSxDQUFBLElBQUFBLENBQUEsQ0FBQUMsVUFBQSxHQUFBRCxDQUFBLEtBQUFFLE9BQUEsRUFBQUYsQ0FBQSxLQWQ1QyxzREFDQSxvQ0FDQSw4QkFRNEM7OztBQUlDOztBQUU3QztBQUNPLE1BQU1HLHdCQUF3QixHQUFH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