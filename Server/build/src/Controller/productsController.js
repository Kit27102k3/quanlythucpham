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
      } catch {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfY2xvdWRpbmFyeSIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX1Byb2R1Y3RzIiwiX0NhdGVnb3JpZXMiLCJfQmVzdFNlbGxpbmdQcm9kdWN0IiwiX2ZzIiwiX3BhdGgiLCJfbW9uZ29vc2UiLCJfYWRtaW5Nb2RlbCIsIl9ub3RpZmljYXRpb25TZXJ2aWNlIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwidXBkYXRlUHJvZHVjdEV4cGlyYXRpb25zIiwiY3VycmVudERhdGUiLCJEYXRlIiwiZGlzY291bnRFeHBpcmVkUHJvZHVjdHMiLCJQcm9kdWN0IiwiZmluZCIsImRpc2NvdW50RW5kRGF0ZSIsIiRsdCIsInByb2R1Y3REaXNjb3VudCIsIiRndCIsInByb2R1Y3QiLCJwcm9kdWN0UHJvbW9QcmljZSIsImRpc2NvdW50U3RhcnREYXRlIiwic2F2ZSIsImNvbnNvbGUiLCJsb2ciLCJwcm9kdWN0TmFtZSIsImV4cGlyeURhdGVQcm9kdWN0cyIsImV4cGlyeURhdGUiLCJwcm9kdWN0U3RhdHVzIiwiJG5lIiwicHJvZHVjdFN0b2NrIiwiZGlzY291bnRVcGRhdGVkIiwibGVuZ3RoIiwiZXhwaXJ5VXBkYXRlZCIsImVycm9yIiwibWVzc2FnZSIsImV4cG9ydHMiLCJjcmVhdGVQcm9kdWN0IiwicmVxIiwicmVzIiwiYm9keSIsImltYWdlVXJscyIsInN0YXR1cyIsImpzb24iLCJjYXRlZ29yeSIsIkNhdGVnb3J5IiwiZmluZE9uZSIsIm5hbWVDYXRlZ29yeSIsInByb2R1Y3RDYXRlZ29yeSIsInVwbG9hZGVkVXJscyIsIkFycmF5IiwiaXNBcnJheSIsImRlc2NyaXB0aW9ucyIsInByb2R1Y3REZXNjcmlwdGlvbiIsIkpTT04iLCJwYXJzZSIsInNwbGl0IiwibmV3UHJvZHVjdCIsInByb2R1Y3RJbWFnZXMiLCJwcm9kdWN0UHJpY2UiLCJOdW1iZXIiLCJwcm9kdWN0V2VpZ2h0IiwicHJvZHVjdFVuaXQiLCJzYXZlZFByb2R1Y3QiLCJzZW5kTmV3UHJvZHVjdE5vdGlmaWNhdGlvbiIsImNhdGNoIiwiYWRtaW5zVG9Ob3RpZnkiLCJBZG1pbiIsIiRvciIsInJvbGUiLCJwZXJtaXNzaW9ucyIsIiRpbiIsIiRleGlzdHMiLCJub3RpZmljYXRpb25QYXlsb2FkIiwidGl0bGUiLCJkYXRhIiwidXJsIiwiX2lkIiwicHJvZHVjdElkIiwiYWRtaW4iLCJzdWJzY3JpcHRpb24iLCJwdXNoU3Vic2NyaXB0aW9ucyIsInNlbmRQdXNoTm90aWZpY2F0aW9uIiwicHJvZHVjdFRvU2VuZCIsInRvT2JqZWN0IiwiU3RyaW5nIiwicHJvZHVjdFdhcnJhbnR5IiwidG9JU09TdHJpbmciLCJzdWNjZXNzIiwiZXJyb3JEZXRhaWxzIiwicHJvY2VzcyIsImVudiIsIk5PREVfRU5WIiwic3RhY2siLCJ1bmRlZmluZWQiLCJnZXRBbGxQcm9kdWN0cyIsInByb2R1Y3RzIiwicHJvZHVjdHNUb1NlbmQiLCJtYXAiLCJwcm9kdWN0T2JqIiwiZ2V0UHJvZHVjdEJ5U2x1ZyIsInNsdWciLCJwYXJhbXMiLCJwIiwidG9Mb3dlckNhc2UiLCJub3JtYWxpemUiLCJyZXBsYWNlIiwidXBkYXRlUHJvZHVjdCIsImlkIiwiZmluZEJ5SWQiLCJuZXdJbWFnZVVybHMiLCJleGlzdGluZ0ltYWdlcyIsImtlZXBJbWFnZXMiLCJmaWx0ZXIiLCJpbWciLCJpbmNsdWRlcyIsImltYWdlc1RvRGVsZXRlIiwiUHJvbWlzZSIsImFsbCIsInB1YmxpY0lkIiwicG9wIiwiY2xvdWRpbmFyeSIsInVwbG9hZGVyIiwiZGVzdHJveSIsImRlc2MiLCJ0cmltIiwidXBkYXRlZFByb2R1Y3QiLCJmaW5kQnlJZEFuZFVwZGF0ZSIsIm5ldyIsImRlbGV0ZVByb2R1Y3QiLCJmaW5kQnlJZEFuZERlbGV0ZSIsImdldFByb2R1Y3RCeUlkIiwiY2hlY2tBbmRVcGRhdGVFeHBpcmF0aW9ucyIsInJlc3VsdCIsInNlYXJjaFByb2R1Y3RzIiwibmFtZSIsInBhZ2UiLCJsaW1pdCIsInF1ZXJ5IiwicGFyc2VJbnQiLCJNYXRoIiwibWluIiwic2VhcmNoUXVlcnkiLCIkcmVnZXgiLCIkb3B0aW9ucyIsInByb2R1Y3RJbmZvIiwicHJvZHVjdEJyYW5kIiwicHJvZHVjdENvZGUiLCJwcm9kdWN0RGV0YWlscyIsInByb2R1Y3RPcmlnaW4iLCJzb3J0IiwiY3JlYXRlZEF0Iiwic2tpcCIsImxlYW4iLCJ0b3RhbCIsImNvdW50RG9jdW1lbnRzIiwidG90YWxQYWdlcyIsImNlaWwiLCJwYXRoIiwiZ2V0UHJvZHVjdEJ5Q2F0ZWdvcnkiLCJjYXRlZ29yeU5hbWUiLCJleGNsdWRlSWQiLCJ1cGRhdGVQcm9kdWN0Q2F0ZWdvcnkiLCJjYXRlZ29yeUlkIiwiZ2V0QmVzdFNlbGxpbmdQcm9kdWN0cyIsInBlcmlvZCIsImJlc3RTZWxsaW5nUHJvZHVjdHMiLCJCZXN0U2VsbGluZ1Byb2R1Y3QiLCJzb2xkQ291bnQiLCJwb3B1bGF0ZSIsInNlbGVjdCIsIm1vZGVsRXJyb3IiLCJub3JtYWxQcm9kdWN0cyIsInByb2R1Y3RFcnJvciIsImZvcm1hdHRlZFByb2R1Y3RzIiwiaXRlbSIsInRvdGFsUmV2ZW51ZSJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9Db250cm9sbGVyL3Byb2R1Y3RzQ29udHJvbGxlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKioqKioqKioqKioqKiAg4pyoIFdpbmRzdXJmIENvbW1hbmQg8J+MnyAgKioqKioqKioqKioqKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xuaW1wb3J0IGNsb3VkaW5hcnkgZnJvbSBcIi4uL2NvbmZpZy9jbG91ZGluYXJ5LmpzXCI7XG5pbXBvcnQgUHJvZHVjdCBmcm9tIFwiLi4vTW9kZWwvUHJvZHVjdHMuanNcIjtcbmltcG9ydCBDYXRlZ29yeSBmcm9tIFwiLi4vTW9kZWwvQ2F0ZWdvcmllcy5qc1wiO1xuaW1wb3J0IEJlc3RTZWxsaW5nUHJvZHVjdCBmcm9tIFwiLi4vTW9kZWwvQmVzdFNlbGxpbmdQcm9kdWN0LmpzXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IG1vbmdvb3NlIGZyb20gXCJtb25nb29zZVwiO1xuaW1wb3J0IEFkbWluIGZyb20gXCIuLi9Nb2RlbC9hZG1pbk1vZGVsLmpzXCI7IC8vIEltcG9ydCBBZG1pbiBtb2RlbFxuaW1wb3J0IHtcbiAgc2VuZFB1c2hOb3RpZmljYXRpb24sXG4gIHNlbmROZXdQcm9kdWN0Tm90aWZpY2F0aW9uLFxufSBmcm9tIFwiLi4vU2VydmljZXMvbm90aWZpY2F0aW9uU2VydmljZS5qc1wiOyAvLyBJbXBvcnQgdGjDqm0gc2VuZE5ld1Byb2R1Y3ROb3RpZmljYXRpb25cblxuLy8gVGjDqm0gaMOgbSBraeG7g20gdHJhIHbDoCBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSBz4bqjbiBwaOG6qW0gZOG7sWEgdsOgbyB0aOG7nWkgaOG6oW4gZ2nhuqNtIGdpw6EgdsOgIGjhuqFuIHPhu60gZOG7pW5nXG5leHBvcnQgY29uc3QgdXBkYXRlUHJvZHVjdEV4cGlyYXRpb25zID0gYXN5bmMgKCkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGN1cnJlbnREYXRlID0gbmV3IERhdGUoKTtcblxuICAgIC8vIEPhuq1wIG5o4bqtdCBnaeG6o20gZ2nDoSBj4bunYSBz4bqjbiBwaOG6qW0gxJHDoyBo4bq/dCB0aOG7nWkgaOG6oW4gZ2nhuqNtIGdpw6FcbiAgICBjb25zdCBkaXNjb3VudEV4cGlyZWRQcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuZmluZCh7XG4gICAgICBkaXNjb3VudEVuZERhdGU6IHsgJGx0OiBjdXJyZW50RGF0ZSB9LFxuICAgICAgcHJvZHVjdERpc2NvdW50OiB7ICRndDogMCB9LFxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIGRpc2NvdW50RXhwaXJlZFByb2R1Y3RzKSB7XG4gICAgICBwcm9kdWN0LnByb2R1Y3REaXNjb3VudCA9IDA7XG4gICAgICBwcm9kdWN0LnByb2R1Y3RQcm9tb1ByaWNlID0gMDtcbiAgICAgIHByb2R1Y3QuZGlzY291bnRTdGFydERhdGUgPSBudWxsO1xuICAgICAgcHJvZHVjdC5kaXNjb3VudEVuZERhdGUgPSBudWxsO1xuICAgICAgYXdhaXQgcHJvZHVjdC5zYXZlKCk7XG4gICAgICBjb25zb2xlLmxvZyhgxJDDoyBj4bqtcCBuaOG6rXQgZ2nDoSBn4buRYyBjaG8gc+G6o24gcGjhuqltOiAke3Byb2R1Y3QucHJvZHVjdE5hbWV9YCk7XG4gICAgfVxuXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgc+G6o24gcGjhuqltIMSRw6MgaOG6v3QgaOG6oW4gc+G7rSBk4bulbmdcbiAgICBjb25zdCBleHBpcnlEYXRlUHJvZHVjdHMgPSBhd2FpdCBQcm9kdWN0LmZpbmQoe1xuICAgICAgZXhwaXJ5RGF0ZTogeyAkbHQ6IGN1cnJlbnREYXRlIH0sXG4gICAgICBwcm9kdWN0U3RhdHVzOiB7ICRuZTogXCJI4bq/dCBow6BuZ1wiIH0sXG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IHByb2R1Y3Qgb2YgZXhwaXJ5RGF0ZVByb2R1Y3RzKSB7XG4gICAgICBwcm9kdWN0LnByb2R1Y3RTdGF0dXMgPSBcIkjhur90IGjDoG5nXCI7XG4gICAgICBwcm9kdWN0LnByb2R1Y3RTdG9jayA9IDA7XG4gICAgICBhd2FpdCBwcm9kdWN0LnNhdmUoKTtcbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgxJDDoyBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSBcIkjhur90IGjDoG5nXCIgY2hvIHPhuqNuIHBo4bqpbTogJHtwcm9kdWN0LnByb2R1Y3ROYW1lfWBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGRpc2NvdW50VXBkYXRlZDogZGlzY291bnRFeHBpcmVkUHJvZHVjdHMubGVuZ3RoLFxuICAgICAgZXhwaXJ5VXBkYXRlZDogZXhwaXJ5RGF0ZVByb2R1Y3RzLmxlbmd0aCxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IGjhuqFuIHPhuqNuIHBo4bqpbTpcIiwgZXJyb3IpO1xuICAgIHJldHVybiB7IGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVQcm9kdWN0ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgLy8gS2nhu4NtIHRyYSBu4bq/dSBraMO0bmcgY8OzIGltYWdlVXJsc1xuICAgIGlmICghcmVxLmJvZHkuaW1hZ2VVcmxzIHx8IHJlcS5ib2R5LmltYWdlVXJscy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiByZXNcbiAgICAgICAgLnN0YXR1cyg0MDApXG4gICAgICAgIC5qc29uKHsgbWVzc2FnZTogXCJWdWkgbMOybmcgdOG6o2kgbMOqbiDDrXQgbmjhuqV0IG3hu5l0IGjDrG5oIOG6o25oXCIgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgY2F0ZWdvcnkgPSBhd2FpdCBDYXRlZ29yeS5maW5kT25lKHtcbiAgICAgIG5hbWVDYXRlZ29yeTogcmVxLmJvZHkucHJvZHVjdENhdGVnb3J5LFxuICAgIH0pO1xuICAgIGlmICghY2F0ZWdvcnkpIHtcbiAgICAgIHJldHVybiByZXNcbiAgICAgICAgLnN0YXR1cyg0MDApXG4gICAgICAgIC5qc29uKHsgbWVzc2FnZTogXCJEYW5oIG3hu6VjIHPhuqNuIHBo4bqpbSBraMO0bmcgdOG7k24gdOG6oWlcIiB9KTtcbiAgICB9XG5cbiAgICAvLyBT4butIGThu6VuZyBVUkxzIMSRw6MgxJHGsOG7o2MgdXBsb2FkIHRow7RuZyBxdWEgQ2xvdWRpbmFyeSB3aWRnZXRcbiAgICBjb25zdCB1cGxvYWRlZFVybHMgPSBBcnJheS5pc0FycmF5KHJlcS5ib2R5LmltYWdlVXJscylcbiAgICAgID8gcmVxLmJvZHkuaW1hZ2VVcmxzXG4gICAgICA6IFtyZXEuYm9keS5pbWFnZVVybHNdO1xuXG4gICAgbGV0IGRlc2NyaXB0aW9ucyA9IFtdO1xuICAgIHRyeSB7XG4gICAgICBkZXNjcmlwdGlvbnMgPVxuICAgICAgICB0eXBlb2YgcmVxLmJvZHkucHJvZHVjdERlc2NyaXB0aW9uID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgPyBKU09OLnBhcnNlKHJlcS5ib2R5LnByb2R1Y3REZXNjcmlwdGlvbilcbiAgICAgICAgICA6IHJlcS5ib2R5LnByb2R1Y3REZXNjcmlwdGlvbjtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGRlc2NyaXB0aW9ucyA9IHJlcS5ib2R5LnByb2R1Y3REZXNjcmlwdGlvbi5zcGxpdChcIixcIik7XG4gICAgfVxuXG4gICAgLy8gWOG7rSBsw70gdGjDtG5nIHRpbiBuZ8OgeSBi4bqvdCDEkeG6p3UgdsOgIGvhur90IHRow7pjIGdp4bqjbSBnacOhXG4gICAgbGV0IGRpc2NvdW50U3RhcnREYXRlID0gbnVsbDtcbiAgICBsZXQgZGlzY291bnRFbmREYXRlID0gbnVsbDtcblxuICAgIGlmIChyZXEuYm9keS5kaXNjb3VudFN0YXJ0RGF0ZSkge1xuICAgICAgZGlzY291bnRTdGFydERhdGUgPSBuZXcgRGF0ZShyZXEuYm9keS5kaXNjb3VudFN0YXJ0RGF0ZSk7XG4gICAgfVxuXG4gICAgaWYgKHJlcS5ib2R5LmRpc2NvdW50RW5kRGF0ZSkge1xuICAgICAgZGlzY291bnRFbmREYXRlID0gbmV3IERhdGUocmVxLmJvZHkuZGlzY291bnRFbmREYXRlKTtcbiAgICB9XG5cbiAgICAvLyBY4butIGzDvSBo4bqhbiBz4butIGThu6VuZ1xuICAgIGxldCBleHBpcnlEYXRlID0gbnVsbDtcbiAgICBsZXQgcHJvZHVjdFN0YXR1cyA9IHJlcS5ib2R5LnByb2R1Y3RTdGF0dXMgfHwgXCJDw7JuIGjDoG5nXCI7XG5cbiAgICBpZiAocmVxLmJvZHkuZXhwaXJ5RGF0ZSkge1xuICAgICAgZXhwaXJ5RGF0ZSA9IG5ldyBEYXRlKHJlcS5ib2R5LmV4cGlyeURhdGUpO1xuXG4gICAgICAvLyBO4bq/dSBo4bqhbiBz4butIGThu6VuZyDEkcOjIHF1YSwgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgdGjDoG5oIFwiSOG6v3QgaMOgbmdcIlxuICAgICAgaWYgKGV4cGlyeURhdGUgPCBuZXcgRGF0ZSgpKSB7XG4gICAgICAgIHByb2R1Y3RTdGF0dXMgPSBcIkjhur90IGjDoG5nXCI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbmV3UHJvZHVjdCA9IG5ldyBQcm9kdWN0KHtcbiAgICAgIC4uLnJlcS5ib2R5LFxuICAgICAgcHJvZHVjdEltYWdlczogdXBsb2FkZWRVcmxzLFxuICAgICAgcHJvZHVjdERlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbnMsXG4gICAgICBwcm9kdWN0UHJpY2U6IE51bWJlcihyZXEuYm9keS5wcm9kdWN0UHJpY2UpLFxuICAgICAgcHJvZHVjdERpc2NvdW50OiBOdW1iZXIocmVxLmJvZHkucHJvZHVjdERpc2NvdW50KSB8fCAwLFxuICAgICAgcHJvZHVjdFN0b2NrOiBOdW1iZXIocmVxLmJvZHkucHJvZHVjdFN0b2NrKSB8fCAwLFxuICAgICAgcHJvZHVjdFdlaWdodDogTnVtYmVyKHJlcS5ib2R5LnByb2R1Y3RXZWlnaHQpIHx8IDAsXG4gICAgICBwcm9kdWN0Q2F0ZWdvcnk6IGNhdGVnb3J5Lm5hbWVDYXRlZ29yeSxcbiAgICAgIHByb2R1Y3RVbml0OiByZXEuYm9keS5wcm9kdWN0VW5pdCB8fCBcImdyYW1cIixcbiAgICAgIGRpc2NvdW50U3RhcnREYXRlLFxuICAgICAgZGlzY291bnRFbmREYXRlLFxuICAgICAgZXhwaXJ5RGF0ZSxcbiAgICAgIHByb2R1Y3RTdGF0dXMsXG4gICAgfSk7XG5cbiAgICAvLyBUw61uaCBwcm9kdWN0UHJvbW9QcmljZSB04burIHByb2R1Y3RQcmljZSB2w6AgcHJvZHVjdERpc2NvdW50XG4gICAgaWYgKG5ld1Byb2R1Y3QucHJvZHVjdERpc2NvdW50ID4gMCkge1xuICAgICAgbmV3UHJvZHVjdC5wcm9kdWN0UHJvbW9QcmljZSA9XG4gICAgICAgIG5ld1Byb2R1Y3QucHJvZHVjdFByaWNlICogKDEgLSBuZXdQcm9kdWN0LnByb2R1Y3REaXNjb3VudCAvIDEwMCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2F2ZWRQcm9kdWN0ID0gYXdhaXQgbmV3UHJvZHVjdC5zYXZlKCk7XG5cbiAgICAvLyAtLS0gUHVzaCBOb3RpZmljYXRpb24gTG9naWMgZm9yIE5ldyBQcm9kdWN0IC0tLVxuICAgIC8vIEfhu61pIHRow7RuZyBiw6FvIMSR4bq/biB04bqldCBj4bqjIG5nxrDhu51pIGTDuW5nIGPDsyDEkcSDbmcga8O9IG5o4bqtbiB0aMO0bmcgYsOhb1xuICAgIHNlbmROZXdQcm9kdWN0Tm90aWZpY2F0aW9uKHNhdmVkUHJvZHVjdCkuY2F0Y2goKGVycm9yKSA9PlxuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHNlbmRpbmcgcHJvZHVjdCBub3RpZmljYXRpb24gdG8gdXNlcnM6XCIsIGVycm9yKVxuICAgICk7XG5cbiAgICAvLyBOb3RpZmljYXRpb24gZm9yIGFkbWlucyAtIHbhuqtuIGdp4buvIGzhuqFpXG4gICAgY29uc3QgYWRtaW5zVG9Ob3RpZnkgPSBhd2FpdCBBZG1pbi5maW5kKHtcbiAgICAgICRvcjogW1xuICAgICAgICB7IHJvbGU6IFwiYWRtaW5cIiB9LCAvLyBBZG1pbiBnZXRzIGFsbCBub3RpZmljYXRpb25zXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcIm1hbmFnZXJcIixcbiAgICAgICAgICBwZXJtaXNzaW9uczogeyAkaW46IFtcIlF14bqjbiBsw70gc+G6o24gcGjhuqltXCIsIFwicHJvZHVjdHNcIl0gfSxcbiAgICAgICAgfSwgLy8gTWFuYWdlcnMgd2l0aCBwcm9kdWN0IHBlcm1pc3Npb25cbiAgICAgIF0sXG4gICAgICBcInB1c2hTdWJzY3JpcHRpb25zLjBcIjogeyAkZXhpc3RzOiB0cnVlIH0sIC8vIE9ubHkgdXNlcnMgd2l0aCBhdCBsZWFzdCBvbmUgc3Vic2NyaXB0aW9uXG4gICAgfSk7XG5cbiAgICBjb25zdCBub3RpZmljYXRpb25QYXlsb2FkID0ge1xuICAgICAgdGl0bGU6IFwiU+G6o24gcGjhuqltIG3hu5tpXCIsXG4gICAgICBib2R5OiBgU+G6o24gcGjhuqltIFwiJHtzYXZlZFByb2R1Y3QucHJvZHVjdE5hbWV9XCIgxJHDoyDEkcaw4bujYyB0aMOqbSBt4bubaS5gLFxuICAgICAgZGF0YToge1xuICAgICAgICB1cmw6IGAvYWRtaW4vcHJvZHVjdHMvZWRpdC8ke3NhdmVkUHJvZHVjdC5faWR9YCxcbiAgICAgICAgcHJvZHVjdElkOiBzYXZlZFByb2R1Y3QuX2lkLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCBhZG1pbiBvZiBhZG1pbnNUb05vdGlmeSkge1xuICAgICAgZm9yIChjb25zdCBzdWJzY3JpcHRpb24gb2YgYWRtaW4ucHVzaFN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgc2VuZFB1c2hOb3RpZmljYXRpb24oXG4gICAgICAgICAgYWRtaW4uX2lkLFxuICAgICAgICAgIHN1YnNjcmlwdGlvbixcbiAgICAgICAgICBub3RpZmljYXRpb25QYXlsb2FkXG4gICAgICAgICkuY2F0Y2goKGVycm9yKSA9PlxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBzZW5kaW5nIG5vdGlmaWNhdGlvbiB0byBhZG1pbjpcIiwgZXJyb3IpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIC0tLSBFbmQgUHVzaCBOb3RpZmljYXRpb24gTG9naWMgLS0tXG5cbiAgICAvLyBDaHV54buDbiDEkeG7lWkgZOG7ryBsaeG7h3Ugc+G7kSB0aMOgbmggY2h14buXaSB0csaw4bubYyBraGkgZ+G7rWkgduG7gSBjbGllbnRcbiAgICBjb25zdCBwcm9kdWN0VG9TZW5kID0gc2F2ZWRQcm9kdWN0LnRvT2JqZWN0KCk7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJpY2UgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJpY2UpO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdERpc2NvdW50ID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdERpc2NvdW50KTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RTdG9jayA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RTdG9jayk7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0V2VpZ2h0ID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFdlaWdodCk7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJvbW9QcmljZSA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcm9tb1ByaWNlKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RXYXJyYW50eSA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RXYXJyYW50eSk7XG5cbiAgICAvLyBGb3JtYXQgZGlzY291bnQgZGF0ZXNcbiAgICBpZiAocHJvZHVjdFRvU2VuZC5kaXNjb3VudFN0YXJ0RGF0ZSkge1xuICAgICAgcHJvZHVjdFRvU2VuZC5kaXNjb3VudFN0YXJ0RGF0ZSA9XG4gICAgICAgIHByb2R1Y3RUb1NlbmQuZGlzY291bnRTdGFydERhdGUudG9JU09TdHJpbmcoKTtcbiAgICB9XG4gICAgaWYgKHByb2R1Y3RUb1NlbmQuZGlzY291bnRFbmREYXRlKSB7XG4gICAgICBwcm9kdWN0VG9TZW5kLmRpc2NvdW50RW5kRGF0ZSA9XG4gICAgICAgIHByb2R1Y3RUb1NlbmQuZGlzY291bnRFbmREYXRlLnRvSVNPU3RyaW5nKCk7XG4gICAgfVxuICAgIC8vIEZvcm1hdCBleHBpcnkgZGF0ZVxuICAgIGlmIChwcm9kdWN0VG9TZW5kLmV4cGlyeURhdGUpIHtcbiAgICAgIHByb2R1Y3RUb1NlbmQuZXhwaXJ5RGF0ZSA9IHByb2R1Y3RUb1NlbmQuZXhwaXJ5RGF0ZS50b0lTT1N0cmluZygpO1xuICAgIH1cblxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbihwcm9kdWN0VG9TZW5kKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgaW4gY3JlYXRlUHJvZHVjdDpcIiwgZXJyb3IpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICBlcnJvckRldGFpbHM6XG4gICAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcImRldmVsb3BtZW50XCIgPyBlcnJvci5zdGFjayA6IHVuZGVmaW5lZCxcbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGdldEFsbFByb2R1Y3RzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgLy8gS2nhu4NtIHRyYSB2w6AgY+G6rXAgbmjhuq10IGjhuqFuIHPhu60gZOG7pW5nIHbDoCBnaeG6o20gZ2nDoSB0csaw4bubYyBraGkgdHLhuqMgduG7gSBkYW5oIHPDoWNoXG4gICAgYXdhaXQgdXBkYXRlUHJvZHVjdEV4cGlyYXRpb25zKCk7XG5cbiAgICBjb25zdCBwcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuZmluZCgpO1xuXG4gICAgLy8gQ2h1eeG7g24gxJHhu5VpIGThu68gbGnhu4d1IHPhu5EgdGjDoG5oIGNodeG7l2lcbiAgICBjb25zdCBwcm9kdWN0c1RvU2VuZCA9IHByb2R1Y3RzLm1hcCgocHJvZHVjdCkgPT4ge1xuICAgICAgY29uc3QgcHJvZHVjdE9iaiA9IHByb2R1Y3QudG9PYmplY3QoKTtcbiAgICAgIHByb2R1Y3RPYmoucHJvZHVjdFByaWNlID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdFByaWNlIHx8IFwiXCIpO1xuICAgICAgcHJvZHVjdE9iai5wcm9kdWN0RGlzY291bnQgPSBTdHJpbmcocHJvZHVjdE9iai5wcm9kdWN0RGlzY291bnQgfHwgXCJcIik7XG4gICAgICBwcm9kdWN0T2JqLnByb2R1Y3RTdG9jayA9IFN0cmluZyhwcm9kdWN0T2JqLnByb2R1Y3RTdG9jayB8fCBcIlwiKTtcbiAgICAgIHByb2R1Y3RPYmoucHJvZHVjdFdlaWdodCA9IFN0cmluZyhwcm9kdWN0T2JqLnByb2R1Y3RXZWlnaHQgfHwgXCJcIik7XG4gICAgICBwcm9kdWN0T2JqLnByb2R1Y3RQcm9tb1ByaWNlID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdFByb21vUHJpY2UgfHwgXCJcIik7XG4gICAgICBwcm9kdWN0T2JqLnByb2R1Y3RXYXJyYW50eSA9IFN0cmluZyhwcm9kdWN0T2JqLnByb2R1Y3RXYXJyYW50eSB8fCBcIlwiKTtcbiAgICAgIHJldHVybiBwcm9kdWN0T2JqO1xuICAgIH0pO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24ocHJvZHVjdHNUb1NlbmQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogXCJM4bqleSBkYW5oIHPDoWNoIHPhuqNuIHBo4bqpbSB0aOG6pXQgYuG6oWlcIiwgZXJyb3IgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBnZXRQcm9kdWN0QnlTbHVnID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IHsgc2x1ZyB9ID0gcmVxLnBhcmFtcztcbiAgdHJ5IHtcbiAgICAvLyBLaeG7g20gdHJhIHbDoCBj4bqtcCBuaOG6rXQgaOG6oW4gc+G7rSBk4bulbmcgdsOgIGdp4bqjbSBnacOhIHRyxrDhu5tjIGtoaSB0cuG6oyB24buBIHPhuqNuIHBo4bqpbVxuICAgIGF3YWl0IHVwZGF0ZVByb2R1Y3RFeHBpcmF0aW9ucygpO1xuXG4gICAgY29uc3QgcHJvZHVjdHMgPSBhd2FpdCBQcm9kdWN0LmZpbmQoKTtcbiAgICBjb25zdCBwcm9kdWN0ID0gcHJvZHVjdHMuZmluZChcbiAgICAgIChwKSA9PlxuICAgICAgICBwLnByb2R1Y3ROYW1lXG4gICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAubm9ybWFsaXplKFwiTkZEXCIpXG4gICAgICAgICAgLnJlcGxhY2UoL1tcXHUwMzAwLVxcdTAzNmZdL2csIFwiXCIpXG4gICAgICAgICAgLnJlcGxhY2UoL1teYS16MC05XSsvZywgXCItXCIpXG4gICAgICAgICAgLnJlcGxhY2UoLyheLXwtJCkvZywgXCJcIikgPT09IHNsdWdcbiAgICApO1xuXG4gICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW1cIiB9KTtcbiAgICB9XG5cbiAgICAvLyBDaHV54buDbiDEkeG7lWkgZOG7ryBsaeG7h3Ugc+G7kSB0aMOgbmggY2h14buXaVxuICAgIGNvbnN0IHByb2R1Y3RUb1NlbmQgPSBwcm9kdWN0LnRvT2JqZWN0KCk7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJpY2UgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJpY2UgfHwgXCJcIik7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0RGlzY291bnQgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0RGlzY291bnQgfHwgXCJcIik7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0U3RvY2sgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0U3RvY2sgfHwgXCJcIik7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0V2VpZ2h0ID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFdlaWdodCB8fCBcIlwiKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcm9tb1ByaWNlID0gU3RyaW5nKFxuICAgICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJvbW9QcmljZSB8fCBcIlwiXG4gICAgKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RXYXJyYW50eSA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RXYXJyYW50eSB8fCBcIlwiKTtcblxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHByb2R1Y3RUb1NlbmQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogXCJM4bqleSBjaGkgdGnhur90IHPhuqNuIHBo4bqpbSB0aOG6pXQgYuG6oWlcIiwgZXJyb3IgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCB1cGRhdGVQcm9kdWN0ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IHsgaWQgfSA9IHJlcS5wYXJhbXM7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQoaWQpO1xuICAgIGlmICghcHJvZHVjdCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltXCIgfSk7XG4gICAgfVxuXG4gICAgLy8gS2nhu4NtIHRyYSBkYW5oIG3hu6VjIG3hu5tpIG7hur91IGPDsyB0aGF5IMSR4buVaVxuICAgIGlmIChcbiAgICAgIHJlcS5ib2R5LnByb2R1Y3RDYXRlZ29yeSAmJlxuICAgICAgcmVxLmJvZHkucHJvZHVjdENhdGVnb3J5ICE9PSBwcm9kdWN0LnByb2R1Y3RDYXRlZ29yeVxuICAgICkge1xuICAgICAgY29uc3QgY2F0ZWdvcnkgPSBhd2FpdCBDYXRlZ29yeS5maW5kT25lKHtcbiAgICAgICAgbmFtZUNhdGVnb3J5OiByZXEuYm9keS5wcm9kdWN0Q2F0ZWdvcnksXG4gICAgICB9KTtcbiAgICAgIGlmICghY2F0ZWdvcnkpIHtcbiAgICAgICAgcmV0dXJuIHJlc1xuICAgICAgICAgIC5zdGF0dXMoNDAwKVxuICAgICAgICAgIC5qc29uKHsgbWVzc2FnZTogXCJEYW5oIG3hu6VjIHPhuqNuIHBo4bqpbSBraMO0bmcgdOG7k24gdOG6oWlcIiB9KTtcbiAgICAgIH1cbiAgICAgIHJlcS5ib2R5LnByb2R1Y3RDYXRlZ29yeSA9IGNhdGVnb3J5Lm5hbWVDYXRlZ29yeTtcbiAgICB9XG5cbiAgICAvLyBT4butIGThu6VuZyBVUkxzIMSRw6MgxJHGsOG7o2MgdXBsb2FkIHRow7RuZyBxdWEgQ2xvdWRpbmFyeSB3aWRnZXRcbiAgICBsZXQgbmV3SW1hZ2VVcmxzID0gW107XG4gICAgaWYgKHJlcS5ib2R5Lm5ld0ltYWdlVXJscyAmJiByZXEuYm9keS5uZXdJbWFnZVVybHMubGVuZ3RoID4gMCkge1xuICAgICAgbmV3SW1hZ2VVcmxzID0gQXJyYXkuaXNBcnJheShyZXEuYm9keS5uZXdJbWFnZVVybHMpXG4gICAgICAgID8gcmVxLmJvZHkubmV3SW1hZ2VVcmxzXG4gICAgICAgIDogW3JlcS5ib2R5Lm5ld0ltYWdlVXJsc107XG4gICAgfVxuXG4gICAgbGV0IGV4aXN0aW5nSW1hZ2VzID0gcHJvZHVjdC5wcm9kdWN0SW1hZ2VzIHx8IFtdO1xuICAgIGlmIChyZXEuYm9keS5rZWVwSW1hZ2VzKSB7XG4gICAgICBjb25zdCBrZWVwSW1hZ2VzID0gQXJyYXkuaXNBcnJheShyZXEuYm9keS5rZWVwSW1hZ2VzKVxuICAgICAgICA/IHJlcS5ib2R5LmtlZXBJbWFnZXNcbiAgICAgICAgOiBKU09OLnBhcnNlKHJlcS5ib2R5LmtlZXBJbWFnZXMpO1xuXG4gICAgICBleGlzdGluZ0ltYWdlcyA9IGV4aXN0aW5nSW1hZ2VzLmZpbHRlcigoaW1nKSA9PiBrZWVwSW1hZ2VzLmluY2x1ZGVzKGltZykpO1xuXG4gICAgICBjb25zdCBpbWFnZXNUb0RlbGV0ZSA9IHByb2R1Y3QucHJvZHVjdEltYWdlcy5maWx0ZXIoXG4gICAgICAgIChpbWcpID0+ICFrZWVwSW1hZ2VzLmluY2x1ZGVzKGltZylcbiAgICAgICk7XG5cbiAgICAgIC8vIFjDs2EgY8OhYyDhuqNuaCBraMO0bmcgZ2nhu68gbOG6oWlcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICBpbWFnZXNUb0RlbGV0ZS5tYXAoKGltZykgPT4ge1xuICAgICAgICAgIGNvbnN0IHB1YmxpY0lkID0gaW1nLnNwbGl0KFwiL1wiKS5wb3AoKS5zcGxpdChcIi5cIilbMF07XG4gICAgICAgICAgcmV0dXJuIGNsb3VkaW5hcnkudXBsb2FkZXIuZGVzdHJveShgcHJvZHVjdHMvJHtwdWJsaWNJZH1gKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbGV0IHByb2R1Y3REZXNjcmlwdGlvbiA9IHByb2R1Y3QucHJvZHVjdERlc2NyaXB0aW9uO1xuICAgIGlmIChyZXEuYm9keS5wcm9kdWN0RGVzY3JpcHRpb24pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHByb2R1Y3REZXNjcmlwdGlvbiA9IEpTT04ucGFyc2UocmVxLmJvZHkucHJvZHVjdERlc2NyaXB0aW9uKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBwcm9kdWN0RGVzY3JpcHRpb24gPSByZXEuYm9keS5wcm9kdWN0RGVzY3JpcHRpb25cbiAgICAgICAgICAuc3BsaXQoXCIuXCIpXG4gICAgICAgICAgLm1hcCgoZGVzYykgPT4gZGVzYy50cmltKCkpXG4gICAgICAgICAgLmZpbHRlcigoZGVzYykgPT4gZGVzYyAhPT0gXCJcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gWOG7rSBsw70gdGjDtG5nIHRpbiBuZ8OgeSBi4bqvdCDEkeG6p3UgdsOgIGvhur90IHRow7pjIGdp4bqjbSBnacOhXG4gICAgbGV0IGRpc2NvdW50U3RhcnREYXRlID0gcHJvZHVjdC5kaXNjb3VudFN0YXJ0RGF0ZTtcbiAgICBsZXQgZGlzY291bnRFbmREYXRlID0gcHJvZHVjdC5kaXNjb3VudEVuZERhdGU7XG5cbiAgICBpZiAocmVxLmJvZHkuZGlzY291bnRTdGFydERhdGUpIHtcbiAgICAgIGRpc2NvdW50U3RhcnREYXRlID0gbmV3IERhdGUocmVxLmJvZHkuZGlzY291bnRTdGFydERhdGUpO1xuICAgIH0gZWxzZSBpZiAocmVxLmJvZHkuZGlzY291bnRTdGFydERhdGUgPT09IG51bGwpIHtcbiAgICAgIGRpc2NvdW50U3RhcnREYXRlID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAocmVxLmJvZHkuZGlzY291bnRFbmREYXRlKSB7XG4gICAgICBkaXNjb3VudEVuZERhdGUgPSBuZXcgRGF0ZShyZXEuYm9keS5kaXNjb3VudEVuZERhdGUpO1xuICAgIH0gZWxzZSBpZiAocmVxLmJvZHkuZGlzY291bnRFbmREYXRlID09PSBudWxsKSB7XG4gICAgICBkaXNjb3VudEVuZERhdGUgPSBudWxsO1xuICAgIH1cblxuICAgIC8vIFjhu60gbMO9IGjhuqFuIHPhu60gZOG7pW5nXG4gICAgbGV0IGV4cGlyeURhdGUgPSBwcm9kdWN0LmV4cGlyeURhdGU7XG4gICAgbGV0IHByb2R1Y3RTdGF0dXMgPSByZXEuYm9keS5wcm9kdWN0U3RhdHVzIHx8IHByb2R1Y3QucHJvZHVjdFN0YXR1cztcblxuICAgIGlmIChyZXEuYm9keS5leHBpcnlEYXRlKSB7XG4gICAgICBleHBpcnlEYXRlID0gbmV3IERhdGUocmVxLmJvZHkuZXhwaXJ5RGF0ZSk7XG5cbiAgICAgIC8vIE7hur91IGjhuqFuIHPhu60gZOG7pW5nIMSRw6MgcXVhLCBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSB0aMOgbmggXCJI4bq/dCBow6BuZ1wiXG4gICAgICBpZiAoZXhwaXJ5RGF0ZSA8IG5ldyBEYXRlKCkpIHtcbiAgICAgICAgcHJvZHVjdFN0YXR1cyA9IFwiSOG6v3QgaMOgbmdcIjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHJlcS5ib2R5LmV4cGlyeURhdGUgPT09IG51bGwpIHtcbiAgICAgIGV4cGlyeURhdGUgPSBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRQcm9kdWN0ID0gYXdhaXQgUHJvZHVjdC5maW5kQnlJZEFuZFVwZGF0ZShcbiAgICAgIGlkLFxuICAgICAge1xuICAgICAgICAuLi5yZXEuYm9keSxcbiAgICAgICAgcHJvZHVjdEltYWdlczogWy4uLmV4aXN0aW5nSW1hZ2VzLCAuLi5uZXdJbWFnZVVybHNdLFxuICAgICAgICBwcm9kdWN0RGVzY3JpcHRpb24sXG4gICAgICAgIHByb2R1Y3RQcmljZTogTnVtYmVyKHJlcS5ib2R5LnByb2R1Y3RQcmljZSksXG4gICAgICAgIHByb2R1Y3REaXNjb3VudDogTnVtYmVyKHJlcS5ib2R5LnByb2R1Y3REaXNjb3VudCkgfHwgMCxcbiAgICAgICAgcHJvZHVjdFN0b2NrOiBOdW1iZXIocmVxLmJvZHkucHJvZHVjdFN0b2NrKSB8fCAwLFxuICAgICAgICBwcm9kdWN0V2VpZ2h0OiBOdW1iZXIocmVxLmJvZHkucHJvZHVjdFdlaWdodCkgfHwgMCxcbiAgICAgICAgcHJvZHVjdFdhcnJhbnR5OiBOdW1iZXIocmVxLmJvZHkucHJvZHVjdFdhcnJhbnR5KSB8fCAwLFxuICAgICAgICBwcm9kdWN0VW5pdDogcmVxLmJvZHkucHJvZHVjdFVuaXQgfHwgcHJvZHVjdC5wcm9kdWN0VW5pdCB8fCBcImdyYW1cIixcbiAgICAgICAgZGlzY291bnRTdGFydERhdGUsXG4gICAgICAgIGRpc2NvdW50RW5kRGF0ZSxcbiAgICAgICAgZXhwaXJ5RGF0ZSxcbiAgICAgICAgcHJvZHVjdFN0YXR1cyxcbiAgICAgIH0sXG4gICAgICB7IG5ldzogdHJ1ZSB9XG4gICAgKTtcblxuICAgIC8vIFTDrW5oIGzhuqFpIHByb2R1Y3RQcm9tb1ByaWNlIHNhdSBraGkgY+G6rXAgbmjhuq10XG4gICAgaWYgKHVwZGF0ZWRQcm9kdWN0LnByb2R1Y3REaXNjb3VudCA+IDApIHtcbiAgICAgIHVwZGF0ZWRQcm9kdWN0LnByb2R1Y3RQcm9tb1ByaWNlID1cbiAgICAgICAgdXBkYXRlZFByb2R1Y3QucHJvZHVjdFByaWNlICpcbiAgICAgICAgKDEgLSB1cGRhdGVkUHJvZHVjdC5wcm9kdWN0RGlzY291bnQgLyAxMDApO1xuICAgICAgYXdhaXQgdXBkYXRlZFByb2R1Y3Quc2F2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVkUHJvZHVjdC5wcm9kdWN0UHJvbW9QcmljZSA9IDA7XG4gICAgICBhd2FpdCB1cGRhdGVkUHJvZHVjdC5zYXZlKCk7XG4gICAgfVxuXG4gICAgLy8gQ2h1eeG7g24gxJHhu5VpIGThu68gbGnhu4d1IHPhu5EgdGjDoG5oIGNodeG7l2kgdHLGsOG7m2Mga2hpIGfhu61pIHbhu4EgY2xpZW50XG4gICAgY29uc3QgcHJvZHVjdFRvU2VuZCA9IHVwZGF0ZWRQcm9kdWN0LnRvT2JqZWN0KCk7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJpY2UgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJpY2UpO1xuICAgIHByb2R1Y3RUb1NlbmQucHJvZHVjdERpc2NvdW50ID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdERpc2NvdW50KTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RTdG9jayA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RTdG9jayk7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0V2VpZ2h0ID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFdlaWdodCk7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJvbW9QcmljZSA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcm9tb1ByaWNlKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RXYXJyYW50eSA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RXYXJyYW50eSk7XG5cbiAgICAvLyBGb3JtYXQgZGlzY291bnQgZGF0ZXNcbiAgICBpZiAocHJvZHVjdFRvU2VuZC5kaXNjb3VudFN0YXJ0RGF0ZSkge1xuICAgICAgcHJvZHVjdFRvU2VuZC5kaXNjb3VudFN0YXJ0RGF0ZSA9XG4gICAgICAgIHByb2R1Y3RUb1NlbmQuZGlzY291bnRTdGFydERhdGUudG9JU09TdHJpbmcoKTtcbiAgICB9XG4gICAgaWYgKHByb2R1Y3RUb1NlbmQuZGlzY291bnRFbmREYXRlKSB7XG4gICAgICBwcm9kdWN0VG9TZW5kLmRpc2NvdW50RW5kRGF0ZSA9XG4gICAgICAgIHByb2R1Y3RUb1NlbmQuZGlzY291bnRFbmREYXRlLnRvSVNPU3RyaW5nKCk7XG4gICAgfVxuICAgIC8vIEZvcm1hdCBleHBpcnkgZGF0ZVxuICAgIGlmIChwcm9kdWN0VG9TZW5kLmV4cGlyeURhdGUpIHtcbiAgICAgIHByb2R1Y3RUb1NlbmQuZXhwaXJ5RGF0ZSA9IHByb2R1Y3RUb1NlbmQuZXhwaXJ5RGF0ZS50b0lTT1N0cmluZygpO1xuICAgIH1cblxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiBcIkPhuq1wIG5o4bqtdCBz4bqjbiBwaOG6qW0gdGjDoG5oIGPDtG5nXCIsXG4gICAgICBwcm9kdWN0OiBwcm9kdWN0VG9TZW5kLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IHPhuqNuIHBo4bqpbTpcIiwgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJD4bqtcCBuaOG6rXQgc+G6o24gcGjhuqltIHRo4bqldCBi4bqhaVwiLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXG4gICAgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBkZWxldGVQcm9kdWN0ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IHsgaWQgfSA9IHJlcS5wYXJhbXM7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWRBbmREZWxldGUoaWQpO1xuICAgIGlmICghcHJvZHVjdCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltXCIgfSk7XG4gICAgfVxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgbWVzc2FnZTogXCJYw7NhIHPhuqNuIHBo4bqpbSB0aMOgbmggY8O0bmdcIiB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6IFwiWMOzYSBz4bqjbiBwaOG6qW0gdGjhuqV0IGLhuqFpXCIsIGVycm9yIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0UHJvZHVjdEJ5SWQgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgeyBpZCB9ID0gcmVxLnBhcmFtcztcbiAgdHJ5IHtcbiAgICAvLyBLaeG7g20gdHJhIHbDoCBj4bqtcCBuaOG6rXQgaOG6oW4gc+G7rSBk4bulbmcgdsOgIGdp4bqjbSBnacOhIHRyxrDhu5tjIGtoaSB0cuG6oyB24buBIGNoaSB0aeG6v3Qgc+G6o24gcGjhuqltXG4gICAgYXdhaXQgdXBkYXRlUHJvZHVjdEV4cGlyYXRpb25zKCk7XG5cbiAgICBjb25zdCBwcm9kdWN0ID0gYXdhaXQgUHJvZHVjdC5maW5kQnlJZChpZCk7XG4gICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW1cIiB9KTtcbiAgICB9XG5cbiAgICAvLyBDaHV54buDbiDEkeG7lWkgZOG7ryBsaeG7h3Ugc+G7kSB0aMOgbmggY2h14buXaVxuICAgIGNvbnN0IHByb2R1Y3RUb1NlbmQgPSBwcm9kdWN0LnRvT2JqZWN0KCk7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJpY2UgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJpY2UgfHwgXCJcIik7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0RGlzY291bnQgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0RGlzY291bnQgfHwgXCJcIik7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0U3RvY2sgPSBTdHJpbmcocHJvZHVjdFRvU2VuZC5wcm9kdWN0U3RvY2sgfHwgXCJcIik7XG4gICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0V2VpZ2h0ID0gU3RyaW5nKHByb2R1Y3RUb1NlbmQucHJvZHVjdFdlaWdodCB8fCBcIlwiKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RQcm9tb1ByaWNlID0gU3RyaW5nKFxuICAgICAgcHJvZHVjdFRvU2VuZC5wcm9kdWN0UHJvbW9QcmljZSB8fCBcIlwiXG4gICAgKTtcbiAgICBwcm9kdWN0VG9TZW5kLnByb2R1Y3RXYXJyYW50eSA9IFN0cmluZyhwcm9kdWN0VG9TZW5kLnByb2R1Y3RXYXJyYW50eSB8fCBcIlwiKTtcblxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHByb2R1Y3RUb1NlbmQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogXCJM4bqleSBjaGkgdGnhur90IHPhuqNuIHBo4bqpbSB0aOG6pXQgYuG6oWlcIiwgZXJyb3IgfSk7XG4gIH1cbn07XG5cbi8vIFRow6ptIEFQSSBlbmRwb2ludCDEkeG7gyBraeG7g20gdHJhIHbDoCBj4bqtcCBuaOG6rXQgaOG6oW4gc+G7rSBk4bulbmcgdsOgIGdp4bqjbSBnacOhXG5leHBvcnQgY29uc3QgY2hlY2tBbmRVcGRhdGVFeHBpcmF0aW9ucyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHVwZGF0ZVByb2R1Y3RFeHBpcmF0aW9ucygpO1xuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiBcIktp4buDbSB0cmEgdsOgIGPhuq1wIG5o4bqtdCBo4bqhbiBz4bqjbiBwaOG6qW0gdGjDoG5oIGPDtG5nXCIsXG4gICAgICByZXN1bHQsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIkPhuq1wIG5o4bqtdCBo4bqhbiBz4bqjbiBwaOG6qW0gdGjhuqV0IGLhuqFpXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IHNlYXJjaFByb2R1Y3RzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgbGV0IHsgbmFtZSwgcGFnZSA9IDEsIGxpbWl0ID0gMTAgfSA9IHJlcS5xdWVyeTtcbiAgICBwYWdlID0gcGFyc2VJbnQocGFnZSkgPiAwID8gcGFyc2VJbnQocGFnZSkgOiAxO1xuICAgIGxpbWl0ID0gTWF0aC5taW4ocGFyc2VJbnQobGltaXQpID4gMCA/IHBhcnNlSW50KGxpbWl0KSA6IDEwLCAxMDApO1xuXG4gICAgaWYgKCFuYW1lIHx8IHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBtZXNzYWdlOiBcIkludmFsaWQgc2VhcmNoIGlucHV0XCIgfSk7XG4gICAgfVxuICAgIGxldCBzZWFyY2hRdWVyeSA9IHtcbiAgICAgICRvcjogW1xuICAgICAgICB7IHByb2R1Y3ROYW1lOiB7ICRyZWdleDogbmFtZS50cmltKCksICRvcHRpb25zOiBcImlcIiB9IH0sXG4gICAgICAgIHsgcHJvZHVjdEluZm86IHsgJHJlZ2V4OiBuYW1lLnRyaW0oKSwgJG9wdGlvbnM6IFwiaVwiIH0gfSxcbiAgICAgICAgeyBwcm9kdWN0Q2F0ZWdvcnk6IHsgJHJlZ2V4OiBuYW1lLnRyaW0oKSwgJG9wdGlvbnM6IFwiaVwiIH0gfSxcbiAgICAgICAgeyBwcm9kdWN0QnJhbmQ6IHsgJHJlZ2V4OiBuYW1lLnRyaW0oKSwgJG9wdGlvbnM6IFwiaVwiIH0gfSxcbiAgICAgICAgeyBwcm9kdWN0Q29kZTogeyAkcmVnZXg6IG5hbWUudHJpbSgpLCAkb3B0aW9uczogXCJpXCIgfSB9LFxuICAgICAgICB7IHByb2R1Y3REZXRhaWxzOiB7ICRyZWdleDogbmFtZS50cmltKCksICRvcHRpb25zOiBcImlcIiB9IH0sXG4gICAgICAgIHsgcHJvZHVjdE9yaWdpbjogeyAkcmVnZXg6IG5hbWUudHJpbSgpLCAkb3B0aW9uczogXCJpXCIgfSB9LFxuICAgICAgXSxcbiAgICB9O1xuICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHNlYXJjaFF1ZXJ5KVxuICAgICAgLnNvcnQoeyBjcmVhdGVkQXQ6IC0xIH0pXG4gICAgICAuc2tpcCgocGFnZSAtIDEpICogbGltaXQpXG4gICAgICAubGltaXQobGltaXQpXG4gICAgICAubGVhbigpO1xuICAgIGNvbnN0IHRvdGFsID0gYXdhaXQgUHJvZHVjdC5jb3VudERvY3VtZW50cyhzZWFyY2hRdWVyeSk7XG5cbiAgICAvLyBDaHV54buDbiDEkeG7lWkgZOG7ryBsaeG7h3Ugc+G7kSB0aMOgbmggY2h14buXaVxuICAgIGNvbnN0IHByb2R1Y3RzVG9TZW5kID0gcHJvZHVjdHMubWFwKChwcm9kdWN0KSA9PiB7XG4gICAgICBwcm9kdWN0LnByb2R1Y3RQcmljZSA9IFN0cmluZyhwcm9kdWN0LnByb2R1Y3RQcmljZSB8fCBcIlwiKTtcbiAgICAgIHByb2R1Y3QucHJvZHVjdERpc2NvdW50ID0gU3RyaW5nKHByb2R1Y3QucHJvZHVjdERpc2NvdW50IHx8IFwiXCIpO1xuICAgICAgcHJvZHVjdC5wcm9kdWN0U3RvY2sgPSBTdHJpbmcocHJvZHVjdC5wcm9kdWN0U3RvY2sgfHwgXCJcIik7XG4gICAgICBwcm9kdWN0LnByb2R1Y3RXZWlnaHQgPSBTdHJpbmcocHJvZHVjdC5wcm9kdWN0V2VpZ2h0IHx8IFwiXCIpO1xuICAgICAgcHJvZHVjdC5wcm9kdWN0UHJvbW9QcmljZSA9IFN0cmluZyhwcm9kdWN0LnByb2R1Y3RQcm9tb1ByaWNlIHx8IFwiXCIpO1xuICAgICAgcHJvZHVjdC5wcm9kdWN0V2FycmFudHkgPSBTdHJpbmcocHJvZHVjdC5wcm9kdWN0V2FycmFudHkgfHwgXCJcIik7XG4gICAgICByZXR1cm4gcHJvZHVjdDtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBwcm9kdWN0czogcHJvZHVjdHNUb1NlbmQsXG4gICAgICB0b3RhbCxcbiAgICAgIHBhZ2UsXG4gICAgICB0b3RhbFBhZ2VzOiBNYXRoLmNlaWwodG90YWwgLyBsaW1pdCksXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGVycm9yLm5hbWUgPT09IFwiQ2FzdEVycm9yXCIgJiYgZXJyb3IucGF0aCA9PT0gXCJfaWRcIikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgbWVzc2FnZTogXCJJbnZhbGlkIHNlYXJjaCBwYXJhbWV0ZXJcIiB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc1xuICAgICAgLnN0YXR1cyg1MDApXG4gICAgICAuanNvbih7IG1lc3NhZ2U6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0UHJvZHVjdEJ5Q2F0ZWdvcnkgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjYXRlZ29yeU5hbWUgPSByZXEucGFyYW1zLmNhdGVnb3J5O1xuICAgIGNvbnN0IGV4Y2x1ZGVJZCA9IHJlcS5xdWVyeS5leGNsdWRlSWQ7XG5cbiAgICBsZXQgcXVlcnkgPSB7IHByb2R1Y3RDYXRlZ29yeTogY2F0ZWdvcnlOYW1lIH07XG4gICAgaWYgKGV4Y2x1ZGVJZCkge1xuICAgICAgcXVlcnkuX2lkID0geyAkbmU6IGV4Y2x1ZGVJZCB9O1xuICAgIH1cblxuICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHF1ZXJ5KTtcblxuICAgIC8vIENodXnhu4NuIMSR4buVaSBk4buvIGxp4buHdSBz4buRIHRow6BuaCBjaHXhu5dpXG4gICAgY29uc3QgcHJvZHVjdHNUb1NlbmQgPSBwcm9kdWN0cy5tYXAoKHByb2R1Y3QpID0+IHtcbiAgICAgIGNvbnN0IHByb2R1Y3RPYmogPSBwcm9kdWN0LnRvT2JqZWN0KCk7XG4gICAgICBwcm9kdWN0T2JqLnByb2R1Y3RQcmljZSA9IFN0cmluZyhwcm9kdWN0T2JqLnByb2R1Y3RQcmljZSB8fCBcIlwiKTtcbiAgICAgIHByb2R1Y3RPYmoucHJvZHVjdERpc2NvdW50ID0gU3RyaW5nKHByb2R1Y3RPYmoucHJvZHVjdERpc2NvdW50IHx8IFwiXCIpO1xuICAgICAgcHJvZHVjdE9iai5wcm9kdWN0U3RvY2sgPSBTdHJpbmcocHJvZHVjdE9iai5wcm9kdWN0U3RvY2sgfHwgXCJcIik7XG4gICAgICBwcm9kdWN0T2JqLnByb2R1Y3RXZWlnaHQgPSBTdHJpbmcocHJvZHVjdE9iai5wcm9kdWN0V2VpZ2h0IHx8IFwiXCIpO1xuICAgICAgcHJvZHVjdE9iai5wcm9kdWN0UHJvbW9QcmljZSA9IFN0cmluZyhwcm9kdWN0T2JqLnByb2R1Y3RQcm9tb1ByaWNlIHx8IFwiXCIpO1xuICAgICAgcHJvZHVjdE9iai5wcm9kdWN0V2FycmFudHkgPSBTdHJpbmcocHJvZHVjdE9iai5wcm9kdWN0V2FycmFudHkgfHwgXCJcIik7XG4gICAgICByZXR1cm4gcHJvZHVjdE9iajtcbiAgICB9KTtcblxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHByb2R1Y3RzVG9TZW5kKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXNcbiAgICAgIC5zdGF0dXMoNTAwKVxuICAgICAgLmpzb24oeyBtZXNzYWdlOiBcIkzhuqV5IHPhuqNuIHBo4bqpbSB0aGVvIGRhbmggbeG7pWMgdGjhuqV0IGLhuqFpXCIsIGVycm9yIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgdXBkYXRlUHJvZHVjdENhdGVnb3J5ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBwcm9kdWN0SWQgfSA9IHJlcS5wYXJhbXM7XG4gICAgY29uc3QgeyBjYXRlZ29yeUlkIH0gPSByZXEuYm9keTtcblxuICAgIGNvbnN0IGNhdGVnb3J5ID0gYXdhaXQgQ2F0ZWdvcnkuZmluZEJ5SWQoY2F0ZWdvcnlJZCk7XG4gICAgaWYgKCFjYXRlZ29yeSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgZGFuaCBt4bulY1wiIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHByb2R1Y3QgPSBhd2FpdCBQcm9kdWN0LmZpbmRCeUlkQW5kVXBkYXRlKFxuICAgICAgcHJvZHVjdElkLFxuICAgICAgeyBwcm9kdWN0Q2F0ZWdvcnk6IGNhdGVnb3J5SWQgfSxcbiAgICAgIHsgbmV3OiB0cnVlIH1cbiAgICApO1xuXG4gICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW1cIiB9KTtcbiAgICB9XG5cbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCJD4bqtcCBuaOG6rXQgZGFuaCBt4bulYyBz4bqjbiBwaOG6qW0gdGjDoG5oIGPDtG5nXCIsXG4gICAgICBwcm9kdWN0LFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBpbiB1cGRhdGVQcm9kdWN0Q2F0ZWdvcnk6XCIsIGVycm9yKTtcbiAgICByZXNcbiAgICAgIC5zdGF0dXMoNTAwKVxuICAgICAgLmpzb24oeyBtZXNzYWdlOiBcIkPhuq1wIG5o4bqtdCBkYW5oIG3hu6VjIHPhuqNuIHBo4bqpbSB0aOG6pXQgYuG6oWlcIiwgZXJyb3IgfSk7XG4gIH1cbn07XG5cbi8vIEzhuqV5IGRhbmggc8OhY2ggc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5XG5leHBvcnQgY29uc3QgZ2V0QmVzdFNlbGxpbmdQcm9kdWN0cyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGxpbWl0ID0gcGFyc2VJbnQocmVxLnF1ZXJ5LmxpbWl0KSB8fCA0O1xuICAgIGNvbnN0IHBlcmlvZCA9IHJlcS5xdWVyeS5wZXJpb2QgfHwgXCJhbGxcIjtcblxuICAgIFxuXG4gICAgLy8gVOG7sSB44butIGzDvSBs4bqleSBz4bqjbiBwaOG6qW0gdGjGsOG7nW5nIHRoYXkgdsOsIGTDuW5nIE1vZGVsLmdldEJlc3RTZWxsZXJzXG4gICAgbGV0IGJlc3RTZWxsaW5nUHJvZHVjdHMgPSBbXTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgYmVzdFNlbGxpbmdQcm9kdWN0cyA9IGF3YWl0IEJlc3RTZWxsaW5nUHJvZHVjdC5maW5kKClcbiAgICAgICAgLnNvcnQoeyBzb2xkQ291bnQ6IC0xIH0pXG4gICAgICAgIC5saW1pdChsaW1pdClcbiAgICAgICAgLnBvcHVsYXRlKHtcbiAgICAgICAgICBwYXRoOiAncHJvZHVjdElkJyxcbiAgICAgICAgICBzZWxlY3Q6ICdwcm9kdWN0TmFtZSBwcm9kdWN0UHJpY2UgcHJvZHVjdFN0YXR1cyBwcm9kdWN0SW1hZ2VzIHByb2R1Y3REaXNjb3VudCBwcm9kdWN0U3RvY2sgcHJvZHVjdENhdGVnb3J5J1xuICAgICAgICB9KTtcbiAgICAgIFxuICAgICBcbiAgICB9IGNhdGNoIChtb2RlbEVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiW2dldEJlc3RTZWxsaW5nUHJvZHVjdHNdIEzhu5dpIGtoaSB0cnV5IHbhuqVuIG1vZGVsIEJlc3RTZWxsaW5nUHJvZHVjdDpcIiwgbW9kZWxFcnJvcik7XG4gICAgfVxuICAgIFxuICAgIC8vIE7hur91IGtow7RuZyBjw7Mgc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5LCBs4bqleSBz4bqjbiBwaOG6qW0gdGjDtG5nIHRoxrDhu51uZ1xuICAgIGlmICghYmVzdFNlbGxpbmdQcm9kdWN0cyB8fCBiZXN0U2VsbGluZ1Byb2R1Y3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS5sb2coJ1tnZXRCZXN0U2VsbGluZ1Byb2R1Y3RzXSBLaMO0bmcgY8OzIGThu68gbGnhu4d1IHPhuqNuIHBo4bqpbSBiw6FuIGNo4bqheSwgbOG6pXkgc+G6o24gcGjhuqltIHRow7RuZyB0aMaw4budbmcuLi4nKTtcbiAgICAgIFxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgbm9ybWFsUHJvZHVjdHMgPSBhd2FpdCBQcm9kdWN0LmZpbmQoe1xuICAgICAgICAgIHByb2R1Y3RTdGF0dXM6IHsgJG5lOiAnSOG6v3QgaMOgbmcnIH0sXG4gICAgICAgICAgcHJvZHVjdFN0b2NrOiB7ICRndDogMCB9XG4gICAgICAgIH0pXG4gICAgICAgIC5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KVxuICAgICAgICAubGltaXQobGltaXQpO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coYFtnZXRCZXN0U2VsbGluZ1Byb2R1Y3RzXSBUw6xtIHRo4bqleSAke25vcm1hbFByb2R1Y3RzLmxlbmd0aH0gc+G6o24gcGjhuqltIHRow7RuZyB0aMaw4budbmcgxJHhu4MgdGhheSB0aOG6v2ApO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIG1lc3NhZ2U6IFwiVHLhuqMgduG7gSBz4bqjbiBwaOG6qW0gdGjDtG5nIHRoxrDhu51uZyB0aGF5IHRo4bq/XCIsXG4gICAgICAgICAgZGF0YTogbm9ybWFsUHJvZHVjdHNcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChwcm9kdWN0RXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIltnZXRCZXN0U2VsbGluZ1Byb2R1Y3RzXSBM4buXaSBraGkgbOG6pXkgc+G6o24gcGjhuqltIHRow7RuZyB0aMaw4budbmc6XCIsIHByb2R1Y3RFcnJvcik7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW0gbsOgb1wiLFxuICAgICAgICAgIGRhdGE6IFtdXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZvcm1hdCBk4buvIGxp4buHdSB0cuG6oyB24buBXG4gICAgY29uc3QgZm9ybWF0dGVkUHJvZHVjdHMgPSBiZXN0U2VsbGluZ1Byb2R1Y3RzLm1hcChpdGVtID0+IHtcbiAgICAgIC8vIE7hur91IHPhuqNuIHBo4bqpbSDEkcOjIMSRxrDhu6NjIHBvcHVsYXRlIMSR4bqneSDEkeG7p1xuICAgICAgaWYgKGl0ZW0ucHJvZHVjdElkICYmIHR5cGVvZiBpdGVtLnByb2R1Y3RJZCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHtcbiAgICAgICAgICAuLi5pdGVtLnByb2R1Y3RJZC50b09iamVjdCgpLFxuICAgICAgICAgIHNvbGRDb3VudDogaXRlbS5zb2xkQ291bnQsXG4gICAgICAgICAgdG90YWxSZXZlbnVlOiBpdGVtLnRvdGFsUmV2ZW51ZVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcHJvZHVjdDtcbiAgICAgIH0gXG4gICAgICAvLyBUcsaw4budbmcgaOG7o3AgcHJvZHVjdElkIGNo4buJIGzDoCBpZCwga2jDtG5nIMSRxrDhu6NjIHBvcHVsYXRlXG4gICAgICByZXR1cm4gaXRlbTtcbiAgICB9KS5maWx0ZXIoaXRlbSA9PiBpdGVtICE9PSBudWxsICYmIGl0ZW0gIT09IHVuZGVmaW5lZCk7XG5cbiAgICBjb25zb2xlLmxvZyhgW2dldEJlc3RTZWxsaW5nUHJvZHVjdHNdIFRy4bqjIHbhu4EgJHtmb3JtYXR0ZWRQcm9kdWN0cy5sZW5ndGh9IHPhuqNuIHBo4bqpbSBiw6FuIGNo4bqheSDEkcOjIMSR4buLbmggZOG6oW5nYCk7XG4gICAgXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiBcIkzhuqV5IGRhbmggc8OhY2ggc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5IHRow6BuaCBjw7RuZ1wiLFxuICAgICAgZGF0YTogZm9ybWF0dGVkUHJvZHVjdHNcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdbZ2V0QmVzdFNlbGxpbmdQcm9kdWN0c10gTOG7l2k6JywgZXJyb3IubWVzc2FnZSk7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgXG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSBs4bqleSBz4bqjbiBwaOG6qW0gYsOhbiBjaOG6oXlcIixcbiAgICAgIGRhdGE6IFtdIC8vIFRy4bqjIHbhu4EgbeG6o25nIHLhu5duZyB0aGF5IHbDrCBs4buXaSA1MDBcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqKioqKiogIDdjYWI4YWQ2LTQzNDUtNGZiNi05MmZmLTIxMjlmOGI4NTg0MiAgKioqKioqKi9cbiJdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsSUFBQUEsV0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsV0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsbUJBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLEdBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLEtBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLFNBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFPLFdBQUEsR0FBQVIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFRLG9CQUFBLEdBQUFSLE9BQUEsdUNBRzRDLFNBQUFELHVCQUFBVSxDQUFBLFVBQUFBLENBQUEsSUFBQUEsQ0FBQSxDQUFBQyxVQUFBLEdBQUFELENBQUEsS0FBQUUsT0FBQSxFQUFBRixDQUFBLEtBZDVDLHNEQUNBLG9DQUNBLDhCQVE0Qzs7O0FBSUM7O0FBRTdDO0FBQ08sTUFBTUcsd0JBQXdCLEdBQUcsTUFBQUEsQ0FBQSxLQUFZ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