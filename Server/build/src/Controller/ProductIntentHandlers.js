"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.handleRelatedProducts = exports.handleProductUsage = exports.handleProductReviews = exports.handleProductPrice = exports.handleProductPageQuestions = exports.handleProductOrigin = exports.handleProductIntro = exports.handleProductIngredients = exports.handleProductExpiry = exports.detectProductIntent = void 0;var _Products = _interopRequireDefault(require("../Model/Products.js"));

/**
 * Format currency to VND format
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted amount
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount || 0);
};

/**
 * Hàm phát hiện intent cho các câu hỏi liên quan đến sản phẩm đang xem
 * @param {string} message - Tin nhắn từ người dùng
 * @returns {object} - Intent được phát hiện
 */
const detectProductIntent = (message) => {
  if (!message || typeof message !== 'string') {
    return { name: 'unknown', confidence: 0 };
  }

  const lowerCaseMsg = message.toLowerCase().trim();

  // Phát hiện câu hỏi về công dụng sản phẩm
  if (lowerCaseMsg.includes("công dụng") ||
  lowerCaseMsg.includes("tác dụng") ||
  lowerCaseMsg.includes("sử dụng") ||
  lowerCaseMsg.includes("dùng như thế nào") ||
  lowerCaseMsg.includes("cách dùng") ||
  lowerCaseMsg.includes("dùng làm gì") ||
  lowerCaseMsg.includes("dùng để làm gì")) {
    return { name: 'productUsage', confidence: 0.9 };
  }

  // Phát hiện câu hỏi về giới thiệu sản phẩm
  if (lowerCaseMsg.includes("giới thiệu") ||
  lowerCaseMsg.includes("thông tin") ||
  lowerCaseMsg.includes("cho biết về") ||
  lowerCaseMsg.includes("mô tả") ||
  lowerCaseMsg.includes("kể về")) {
    return { name: 'productIntro', confidence: 0.9 };
  }

  // Phát hiện câu hỏi về giá sản phẩm
  if ((lowerCaseMsg.includes("giá") ||
  lowerCaseMsg.includes("bao nhiêu tiền") ||
  lowerCaseMsg.includes("giá bao nhiêu") ||
  lowerCaseMsg.includes("giá cả") ||
  lowerCaseMsg.includes("chi phí")) &&
  !lowerCaseMsg.includes("giá rẻ") &&
  !lowerCaseMsg.includes("giảm giá")) {
    return { name: 'productPrice', confidence: 0.9 };
  }

  // Phát hiện câu hỏi về sản phẩm liên quan
  if (lowerCaseMsg.includes("liên quan") ||
  lowerCaseMsg.includes("tương tự") ||
  lowerCaseMsg.includes("sản phẩm khác") ||
  lowerCaseMsg.includes("sản phẩm cùng loại") ||
  lowerCaseMsg.includes("thay thế") ||
  lowerCaseMsg.includes("gợi ý thêm")) {
    return { name: 'relatedProducts', confidence: 0.9 };
  }

  // Phát hiện câu hỏi về nguồn gốc/xuất xứ sản phẩm
  if (lowerCaseMsg.includes("xuất xứ") ||
  lowerCaseMsg.includes("nguồn gốc") ||
  lowerCaseMsg.includes("sản xuất ở đâu") ||
  lowerCaseMsg.includes("nước nào") ||
  lowerCaseMsg.includes("hãng nào")) {
    return { name: 'productOrigin', confidence: 0.9 };
  }

  // Phát hiện câu hỏi về thành phần sản phẩm
  if (lowerCaseMsg.includes("thành phần") ||
  lowerCaseMsg.includes("nguyên liệu") ||
  lowerCaseMsg.includes("có chứa") ||
  lowerCaseMsg.includes("làm từ") ||
  lowerCaseMsg.includes("được làm từ") ||
  lowerCaseMsg.includes("chất liệu")) {
    return { name: 'productIngredients', confidence: 0.9 };
  }

  // Phát hiện câu hỏi về date (hạn sử dụng)
  if (lowerCaseMsg.includes("hạn sử dụng") ||
  lowerCaseMsg.includes("date") ||
  lowerCaseMsg.includes("hết hạn") ||
  lowerCaseMsg.includes("dùng được bao lâu") ||
  lowerCaseMsg.includes("bảo quản")) {
    return { name: 'productExpiry', confidence: 0.9 };
  }

  // Phát hiện câu hỏi về đánh giá sản phẩm
  if (lowerCaseMsg.includes("đánh giá") ||
  lowerCaseMsg.includes("review") ||
  lowerCaseMsg.includes("feedback") ||
  lowerCaseMsg.includes("nhận xét") ||
  lowerCaseMsg.includes("tốt không") ||
  lowerCaseMsg.includes("có ngon không") ||
  lowerCaseMsg.includes("có tốt không")) {
    return { name: 'productReviews', confidence: 0.9 };
  }

  return { name: 'unknown', confidence: 0 };
};

/**
 * Xử lý câu hỏi về công dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.detectProductIntent = detectProductIntent;
const handleProductUsage = async (product) => {
  const usage = product.productDetails || "Chưa có thông tin chi tiết về công dụng sản phẩm này.";
  return {
    success: true,
    message: `<strong>Công dụng ${product.productName}:</strong><br>${usage}`,
    intent: "productUsage"
  };
};

/**
 * Xử lý câu hỏi về giới thiệu sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleProductUsage = handleProductUsage;
const handleProductIntro = async (product) => {
  const intro = product.productIntroduction || "Chưa có thông tin giới thiệu về sản phẩm này.";
  return {
    success: true,
    message: `<strong>Giới thiệu ${product.productName}:</strong><br>${intro}`,
    intent: "productIntro"
  };
};

/**
 * Xử lý câu hỏi về giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleProductIntro = handleProductIntro;
const handleProductPrice = async (product) => {
  const price = product.productPrice;
  const discountPercentage = product.productDiscount || 0;
  const hasDiscount = discountPercentage > 0;
  const promoPrice = hasDiscount ? product.productPromoPrice || Math.round(price * (1 - discountPercentage / 100)) : price;

  let priceInfo = `<strong>Giá ${product.productName}:</strong><br>`;
  if (hasDiscount) {
    priceInfo += `Giá gốc: <span style="text-decoration: line-through;">${formatCurrency(price)}</span><br>`;
    priceInfo += `Giá khuyến mãi: <strong style="color: red;">${formatCurrency(promoPrice)}</strong> (Giảm ${discountPercentage}%)`;
  } else {
    priceInfo += `<strong style="color: red;">${formatCurrency(price)}</strong>`;
  }

  return {
    success: true,
    message: priceInfo,
    intent: "productPrice"
  };
};

/**
 * Xử lý câu hỏi về sản phẩm liên quan
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleProductPrice = handleProductPrice;
const handleRelatedProducts = async (product) => {
  const category = product.productCategory;
  const relatedProducts = await _Products.default.find({
    productCategory: category,
    _id: { $ne: product._id } // Loại trừ sản phẩm hiện tại
  }).limit(6);

  if (relatedProducts && relatedProducts.length > 0) {
    console.log(`Tìm thấy ${relatedProducts.length} sản phẩm liên quan trong danh mục "${category}"`);

    // Format products for display
    const formattedProducts = relatedProducts.map((p) => ({
      id: p._id,
      name: p.productName,
      price: p.productPrice,
      discount: p.productDiscount,
      promotionalPrice: p.productDiscount ? Math.round(p.productPrice * (1 - p.productDiscount / 100)) : p.productPrice,
      image: p.productImages && p.productImages.length > 0 ? p.productImages[0] : "default-product.jpg",
      slug: p.productName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    }));

    return {
      success: true,
      message: `Các sản phẩm liên quan đến ${product.productName}:`,
      data: formattedProducts,
      type: 'relatedProducts',
      text: `Các sản phẩm liên quan đến ${product.productName}:`,
      intent: "relatedProducts"
    };
  } else {
    return {
      success: true,
      message: `Hiện tại không có sản phẩm nào khác trong danh mục "${category}".`,
      intent: "relatedProducts"
    };
  }
};

/**
 * Xử lý câu hỏi về xuất xứ sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleRelatedProducts = handleRelatedProducts;
const handleProductOrigin = async (product) => {
  let originInfo = '';

  if (product.productOrigin || product.origin) {
    originInfo = `<strong>Xuất xứ ${product.productName}:</strong><br>${product.productOrigin || product.origin}`;

    if (product.productBrand) {
      originInfo += `<br>Thương hiệu: ${product.productBrand}`;
    }

    if (product.productManufacturer) {
      originInfo += `<br>Nhà sản xuất: ${product.productManufacturer}`;
    }
  } else {
    originInfo = `<strong>Xuất xứ ${product.productName}:</strong><br>Thông tin về xuất xứ sản phẩm được ghi rõ trên bao bì.`;
  }

  return {
    success: true,
    message: originInfo,
    intent: "productOrigin"
  };
};

/**
 * Xử lý câu hỏi về thành phần sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleProductOrigin = handleProductOrigin;
const handleProductIngredients = async (product) => {
  let ingredientsInfo = '';

  if (product.productIngredients || product.ingredients) {
    ingredientsInfo = `<strong>Thành phần của ${product.productName}:</strong><br>${product.productIngredients || product.ingredients}`;
  } else {
    ingredientsInfo = `<strong>Thành phần của ${product.productName}:</strong><br>Thông tin chi tiết về thành phần sản phẩm được ghi rõ trên bao bì.`;
  }

  return {
    success: true,
    message: ingredientsInfo,
    intent: "productIngredients"
  };
};

/**
 * Xử lý câu hỏi về hạn sử dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleProductIngredients = handleProductIngredients;
const handleProductExpiry = async (product) => {
  let expiryInfo = '';

  if (product.expiryDate || product.productExpiry) {
    expiryInfo = `<strong>Hạn sử dụng ${product.productName}:</strong><br>${product.expiryDate || product.productExpiry}`;
  } else {
    expiryInfo = `<strong>Hạn sử dụng ${product.productName}:</strong><br>Thông tin về hạn sử dụng được in trên bao bì sản phẩm. 
    Vui lòng kiểm tra khi nhận hàng.`;
  }

  if (product.storageInfo || product.productStorage) {
    expiryInfo += `<br><br><strong>Hướng dẫn bảo quản:</strong><br>${product.storageInfo || product.productStorage}`;
  }

  return {
    success: true,
    message: expiryInfo,
    intent: "productExpiry"
  };
};

/**
 * Xử lý câu hỏi về đánh giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleProductExpiry = handleProductExpiry;
const handleProductReviews = async (product) => {
  let reviewInfo = '';

  if (product.averageRating) {
    reviewInfo = `<strong>Đánh giá ${product.productName}:</strong><br>
    Điểm đánh giá trung bình: ${product.averageRating}/5 sao`;

    if (product.numOfReviews) {
      reviewInfo += ` (${product.numOfReviews} lượt đánh giá)`;
    }
  } else {
    reviewInfo = `<strong>Đánh giá ${product.productName}:</strong><br>
    Sản phẩm này chưa có đánh giá. ${product.productName} là sản phẩm chất lượng cao, 
    được nhiều khách hàng tin dùng trong thời gian qua.`;
  }

  return {
    success: true,
    message: reviewInfo,
    intent: "productReviews"
  };
};

/**
 * Main handler cho các câu hỏi liên quan đến sản phẩm đang xem
 * @param {string} message - Tin nhắn từ người dùng
 * @param {string} productId - ID của sản phẩm đang xem
 * @returns {object} - Phản hồi
 */exports.handleProductReviews = handleProductReviews;
const handleProductPageQuestions = async (message, productId) => {
  if (!productId) {
    return null; // Không có productId, xử lý ở hàm gọi
  }

  try {
    console.log(`Đang xử lý câu hỏi cho sản phẩm ID: ${productId}`);

    // Phát hiện intent
    const intent = detectProductIntent(message);
    console.log("Product intent được phát hiện:", intent);

    if (intent.name === 'unknown') {
      return null; // Không phải intent liên quan đến sản phẩm, xử lý ở hàm gọi
    }

    // Lấy thông tin sản phẩm từ database
    const product = await _Products.default.findById(productId);

    if (!product) {
      console.log(`Không tìm thấy sản phẩm với ID: ${productId}`);
      return {
        success: true,
        message: "Xin lỗi, tôi không tìm thấy thông tin về sản phẩm này.",
        intent: "productNotFound"
      };
    }

    console.log(`Đã tìm thấy sản phẩm: ${product.productName}`);

    // Xử lý theo intent
    switch (intent.name) {
      case 'productUsage':
        return await handleProductUsage(product);
      case 'productIntro':
        return await handleProductIntro(product);
      case 'productPrice':
        return await handleProductPrice(product);
      case 'relatedProducts':
        return await handleRelatedProducts(product);
      case 'productOrigin':
        return await handleProductOrigin(product);
      case 'productIngredients':
        return await handleProductIngredients(product);
      case 'productExpiry':
        return await handleProductExpiry(product);
      case 'productReviews':
        return await handleProductReviews(product);
      default:
        return null;
    }
  } catch (error) {
    console.error("Lỗi khi xử lý câu hỏi về sản phẩm:", error);
    return {
      success: true,
      message: "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn.",
      intent: "error"
    };
  }
};exports.handleProductPageQuestions = handleProductPageQuestions;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfUHJvZHVjdHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsImZvcm1hdEN1cnJlbmN5IiwiYW1vdW50IiwiSW50bCIsIk51bWJlckZvcm1hdCIsImZvcm1hdCIsImRldGVjdFByb2R1Y3RJbnRlbnQiLCJtZXNzYWdlIiwibmFtZSIsImNvbmZpZGVuY2UiLCJsb3dlckNhc2VNc2ciLCJ0b0xvd2VyQ2FzZSIsInRyaW0iLCJpbmNsdWRlcyIsImV4cG9ydHMiLCJoYW5kbGVQcm9kdWN0VXNhZ2UiLCJwcm9kdWN0IiwidXNhZ2UiLCJwcm9kdWN0RGV0YWlscyIsInN1Y2Nlc3MiLCJwcm9kdWN0TmFtZSIsImludGVudCIsImhhbmRsZVByb2R1Y3RJbnRybyIsImludHJvIiwicHJvZHVjdEludHJvZHVjdGlvbiIsImhhbmRsZVByb2R1Y3RQcmljZSIsInByaWNlIiwicHJvZHVjdFByaWNlIiwiZGlzY291bnRQZXJjZW50YWdlIiwicHJvZHVjdERpc2NvdW50IiwiaGFzRGlzY291bnQiLCJwcm9tb1ByaWNlIiwicHJvZHVjdFByb21vUHJpY2UiLCJNYXRoIiwicm91bmQiLCJwcmljZUluZm8iLCJoYW5kbGVSZWxhdGVkUHJvZHVjdHMiLCJjYXRlZ29yeSIsInByb2R1Y3RDYXRlZ29yeSIsInJlbGF0ZWRQcm9kdWN0cyIsIlByb2R1Y3QiLCJmaW5kIiwiX2lkIiwiJG5lIiwibGltaXQiLCJsZW5ndGgiLCJjb25zb2xlIiwibG9nIiwiZm9ybWF0dGVkUHJvZHVjdHMiLCJtYXAiLCJwIiwiaWQiLCJkaXNjb3VudCIsInByb21vdGlvbmFsUHJpY2UiLCJpbWFnZSIsInByb2R1Y3RJbWFnZXMiLCJzbHVnIiwibm9ybWFsaXplIiwicmVwbGFjZSIsImRhdGEiLCJ0eXBlIiwidGV4dCIsImhhbmRsZVByb2R1Y3RPcmlnaW4iLCJvcmlnaW5JbmZvIiwicHJvZHVjdE9yaWdpbiIsIm9yaWdpbiIsInByb2R1Y3RCcmFuZCIsInByb2R1Y3RNYW51ZmFjdHVyZXIiLCJoYW5kbGVQcm9kdWN0SW5ncmVkaWVudHMiLCJpbmdyZWRpZW50c0luZm8iLCJwcm9kdWN0SW5ncmVkaWVudHMiLCJpbmdyZWRpZW50cyIsImhhbmRsZVByb2R1Y3RFeHBpcnkiLCJleHBpcnlJbmZvIiwiZXhwaXJ5RGF0ZSIsInByb2R1Y3RFeHBpcnkiLCJzdG9yYWdlSW5mbyIsInByb2R1Y3RTdG9yYWdlIiwiaGFuZGxlUHJvZHVjdFJldmlld3MiLCJyZXZpZXdJbmZvIiwiYXZlcmFnZVJhdGluZyIsIm51bU9mUmV2aWV3cyIsImhhbmRsZVByb2R1Y3RQYWdlUXVlc3Rpb25zIiwicHJvZHVjdElkIiwiZmluZEJ5SWQiLCJlcnJvciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9Db250cm9sbGVyL1Byb2R1Y3RJbnRlbnRIYW5kbGVycy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUHJvZHVjdCBmcm9tIFwiLi4vTW9kZWwvUHJvZHVjdHMuanNcIjtcclxuXHJcbi8qKlxyXG4gKiBGb3JtYXQgY3VycmVuY3kgdG8gVk5EIGZvcm1hdFxyXG4gKiBAcGFyYW0ge251bWJlcn0gYW1vdW50IC0gQW1vdW50IHRvIGZvcm1hdFxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAtIEZvcm1hdHRlZCBhbW91bnRcclxuICovXHJcbmNvbnN0IGZvcm1hdEN1cnJlbmN5ID0gKGFtb3VudCkgPT4ge1xyXG4gIHJldHVybiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ3ZpLVZOJykuZm9ybWF0KGFtb3VudCB8fCAwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBIw6BtIHBow6F0IGhp4buHbiBpbnRlbnQgY2hvIGPDoWMgY8OidSBo4buPaSBsacOqbiBxdWFuIMSR4bq/biBz4bqjbiBwaOG6qW0gxJFhbmcgeGVtXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gVGluIG5o4bqvbiB04burIG5nxrDhu51pIGTDuW5nXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gSW50ZW50IMSRxrDhu6NjIHBow6F0IGhp4buHblxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGRldGVjdFByb2R1Y3RJbnRlbnQgPSAobWVzc2FnZSkgPT4ge1xyXG4gIGlmICghbWVzc2FnZSB8fCB0eXBlb2YgbWVzc2FnZSAhPT0gJ3N0cmluZycpIHtcclxuICAgIHJldHVybiB7IG5hbWU6ICd1bmtub3duJywgY29uZmlkZW5jZTogMCB9O1xyXG4gIH1cclxuICBcclxuICBjb25zdCBsb3dlckNhc2VNc2cgPSBtZXNzYWdlLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xyXG4gIFxyXG4gIC8vIFBow6F0IGhp4buHbiBjw6J1IGjhu49pIHbhu4EgY8O0bmcgZOG7pW5nIHPhuqNuIHBo4bqpbVxyXG4gIGlmIChsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJjw7RuZyBk4bulbmdcIikgfHwgXHJcbiAgICAgIGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcInTDoWMgZOG7pW5nXCIpIHx8IFxyXG4gICAgICBsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJz4butIGThu6VuZ1wiKSB8fCBcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwiZMO5bmcgbmjGsCB0aOG6vyBuw6BvXCIpIHx8XHJcbiAgICAgIGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcImPDoWNoIGTDuW5nXCIpIHx8XHJcbiAgICAgIGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcImTDuW5nIGzDoG0gZ8OsXCIpIHx8XHJcbiAgICAgIGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcImTDuW5nIMSR4buDIGzDoG0gZ8OsXCIpKSB7XHJcbiAgICByZXR1cm4geyBuYW1lOiAncHJvZHVjdFVzYWdlJywgY29uZmlkZW5jZTogMC45IH07XHJcbiAgfVxyXG4gIFxyXG4gIC8vIFBow6F0IGhp4buHbiBjw6J1IGjhu49pIHbhu4EgZ2nhu5tpIHRoaeG7h3Ugc+G6o24gcGjhuqltXHJcbiAgaWYgKGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcImdp4bubaSB0aGnhu4d1XCIpIHx8IFxyXG4gICAgICBsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJ0aMO0bmcgdGluXCIpIHx8IFxyXG4gICAgICBsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJjaG8gYmnhur90IHbhu4FcIikgfHxcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwibcO0IHThuqNcIikgfHxcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwia+G7gyB24buBXCIpKSB7XHJcbiAgICByZXR1cm4geyBuYW1lOiAncHJvZHVjdEludHJvJywgY29uZmlkZW5jZTogMC45IH07XHJcbiAgfVxyXG4gIFxyXG4gIC8vIFBow6F0IGhp4buHbiBjw6J1IGjhu49pIHbhu4EgZ2nDoSBz4bqjbiBwaOG6qW1cclxuICBpZiAoKGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcImdpw6FcIikgfHwgXHJcbiAgICAgICBsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJiYW8gbmhpw6p1IHRp4buBblwiKSB8fCBcclxuICAgICAgIGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcImdpw6EgYmFvIG5oacOqdVwiKSB8fFxyXG4gICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwiZ2nDoSBj4bqjXCIpIHx8XHJcbiAgICAgICBsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJjaGkgcGjDrVwiKSkgJiZcclxuICAgICAgIWxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcImdpw6EgcuG6u1wiKSAmJlxyXG4gICAgICAhbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwiZ2nhuqNtIGdpw6FcIikpIHtcclxuICAgIHJldHVybiB7IG5hbWU6ICdwcm9kdWN0UHJpY2UnLCBjb25maWRlbmNlOiAwLjkgfTtcclxuICB9XHJcbiAgXHJcbiAgLy8gUGjDoXQgaGnhu4duIGPDonUgaOG7j2kgduG7gSBz4bqjbiBwaOG6qW0gbGnDqm4gcXVhblxyXG4gIGlmIChsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJsacOqbiBxdWFuXCIpIHx8IFxyXG4gICAgICBsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJ0xrDGoW5nIHThu7FcIikgfHwgXHJcbiAgICAgIGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcInPhuqNuIHBo4bqpbSBraMOhY1wiKSB8fFxyXG4gICAgICBsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJz4bqjbiBwaOG6qW0gY8O5bmcgbG/huqFpXCIpIHx8XHJcbiAgICAgIGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcInRoYXkgdGjhur9cIikgfHxcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwiZ+G7o2kgw70gdGjDqm1cIikpIHtcclxuICAgIHJldHVybiB7IG5hbWU6ICdyZWxhdGVkUHJvZHVjdHMnLCBjb25maWRlbmNlOiAwLjkgfTtcclxuICB9XHJcbiAgXHJcbiAgLy8gUGjDoXQgaGnhu4duIGPDonUgaOG7j2kgduG7gSBuZ3Xhu5NuIGfhu5FjL3h14bqldCB44bupIHPhuqNuIHBo4bqpbVxyXG4gIGlmIChsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJ4deG6pXQgeOG7qVwiKSB8fCBcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwibmd14buTbiBn4buRY1wiKSB8fCBcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwic+G6o24geHXhuqV0IOG7nyDEkcOidVwiKSB8fFxyXG4gICAgICBsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJuxrDhu5tjIG7DoG9cIikgfHxcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwiaMOjbmcgbsOgb1wiKSkge1xyXG4gICAgcmV0dXJuIHsgbmFtZTogJ3Byb2R1Y3RPcmlnaW4nLCBjb25maWRlbmNlOiAwLjkgfTtcclxuICB9XHJcblxyXG4gIC8vIFBow6F0IGhp4buHbiBjw6J1IGjhu49pIHbhu4EgdGjDoG5oIHBo4bqnbiBz4bqjbiBwaOG6qW1cclxuICBpZiAobG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwidGjDoG5oIHBo4bqnblwiKSB8fCBcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwibmd1ecOqbiBsaeG7h3VcIikgfHwgXHJcbiAgICAgIGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcImPDsyBjaOG7qWFcIikgfHxcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwibMOgbSB04burXCIpIHx8XHJcbiAgICAgIGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcIsSRxrDhu6NjIGzDoG0gdOG7q1wiKSB8fFxyXG4gICAgICBsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJjaOG6pXQgbGnhu4d1XCIpKSB7XHJcbiAgICByZXR1cm4geyBuYW1lOiAncHJvZHVjdEluZ3JlZGllbnRzJywgY29uZmlkZW5jZTogMC45IH07XHJcbiAgfVxyXG5cclxuICAvLyBQaMOhdCBoaeG7h24gY8OidSBo4buPaSB24buBIGRhdGUgKGjhuqFuIHPhu60gZOG7pW5nKVxyXG4gIGlmIChsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJo4bqhbiBz4butIGThu6VuZ1wiKSB8fCBcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwiZGF0ZVwiKSB8fCBcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwiaOG6v3QgaOG6oW5cIikgfHxcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwiZMO5bmcgxJHGsOG7o2MgYmFvIGzDonVcIikgfHxcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwiYuG6o28gcXXhuqNuXCIpKSB7XHJcbiAgICByZXR1cm4geyBuYW1lOiAncHJvZHVjdEV4cGlyeScsIGNvbmZpZGVuY2U6IDAuOSB9O1xyXG4gIH1cclxuXHJcbiAgLy8gUGjDoXQgaGnhu4duIGPDonUgaOG7j2kgduG7gSDEkcOhbmggZ2nDoSBz4bqjbiBwaOG6qW1cclxuICBpZiAobG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwixJHDoW5oIGdpw6FcIikgfHwgXHJcbiAgICAgIGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcInJldmlld1wiKSB8fCBcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwiZmVlZGJhY2tcIikgfHxcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwibmjhuq1uIHjDqXRcIikgfHxcclxuICAgICAgbG93ZXJDYXNlTXNnLmluY2x1ZGVzKFwidOG7kXQga2jDtG5nXCIpIHx8XHJcbiAgICAgIGxvd2VyQ2FzZU1zZy5pbmNsdWRlcyhcImPDsyBuZ29uIGtow7RuZ1wiKSB8fFxyXG4gICAgICBsb3dlckNhc2VNc2cuaW5jbHVkZXMoXCJjw7MgdOG7kXQga2jDtG5nXCIpKSB7XHJcbiAgICByZXR1cm4geyBuYW1lOiAncHJvZHVjdFJldmlld3MnLCBjb25maWRlbmNlOiAwLjkgfTtcclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIHsgbmFtZTogJ3Vua25vd24nLCBjb25maWRlbmNlOiAwIH07XHJcbn07XHJcblxyXG4vKipcclxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIGPDtG5nIGThu6VuZyBz4bqjbiBwaOG6qW1cclxuICogQHBhcmFtIHtvYmplY3R9IHByb2R1Y3QgLSBUaMO0bmcgdGluIHPhuqNuIHBo4bqpbVxyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaVxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGhhbmRsZVByb2R1Y3RVc2FnZSA9IGFzeW5jIChwcm9kdWN0KSA9PiB7XHJcbiAgY29uc3QgdXNhZ2UgPSBwcm9kdWN0LnByb2R1Y3REZXRhaWxzIHx8IFwiQ2jGsGEgY8OzIHRow7RuZyB0aW4gY2hpIHRp4bq/dCB24buBIGPDtG5nIGThu6VuZyBz4bqjbiBwaOG6qW0gbsOgeS5cIjtcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIG1lc3NhZ2U6IGA8c3Ryb25nPkPDtG5nIGThu6VuZyAke3Byb2R1Y3QucHJvZHVjdE5hbWV9Ojwvc3Ryb25nPjxicj4ke3VzYWdlfWAsXHJcbiAgICBpbnRlbnQ6IFwicHJvZHVjdFVzYWdlXCJcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBnaeG7m2kgdGhp4buHdSBz4bqjbiBwaOG6qW1cclxuICogQHBhcmFtIHtvYmplY3R9IHByb2R1Y3QgLSBUaMO0bmcgdGluIHPhuqNuIHBo4bqpbVxyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaVxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGhhbmRsZVByb2R1Y3RJbnRybyA9IGFzeW5jIChwcm9kdWN0KSA9PiB7XHJcbiAgY29uc3QgaW50cm8gPSBwcm9kdWN0LnByb2R1Y3RJbnRyb2R1Y3Rpb24gfHwgXCJDaMawYSBjw7MgdGjDtG5nIHRpbiBnaeG7m2kgdGhp4buHdSB24buBIHPhuqNuIHBo4bqpbSBuw6B5LlwiO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgbWVzc2FnZTogYDxzdHJvbmc+R2nhu5tpIHRoaeG7h3UgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfTo8L3N0cm9uZz48YnI+JHtpbnRyb31gLFxyXG4gICAgaW50ZW50OiBcInByb2R1Y3RJbnRyb1wiXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4EgZ2nDoSBz4bqjbiBwaOG6qW1cclxuICogQHBhcmFtIHtvYmplY3R9IHByb2R1Y3QgLSBUaMO0bmcgdGluIHPhuqNuIHBo4bqpbVxyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaVxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGhhbmRsZVByb2R1Y3RQcmljZSA9IGFzeW5jIChwcm9kdWN0KSA9PiB7XHJcbiAgY29uc3QgcHJpY2UgPSBwcm9kdWN0LnByb2R1Y3RQcmljZTtcclxuICBjb25zdCBkaXNjb3VudFBlcmNlbnRhZ2UgPSBwcm9kdWN0LnByb2R1Y3REaXNjb3VudCB8fCAwO1xyXG4gIGNvbnN0IGhhc0Rpc2NvdW50ID0gZGlzY291bnRQZXJjZW50YWdlID4gMDtcclxuICBjb25zdCBwcm9tb1ByaWNlID0gaGFzRGlzY291bnQgPyBwcm9kdWN0LnByb2R1Y3RQcm9tb1ByaWNlIHx8IE1hdGgucm91bmQocHJpY2UgKiAoMSAtIGRpc2NvdW50UGVyY2VudGFnZSAvIDEwMCkpIDogcHJpY2U7XHJcbiAgXHJcbiAgbGV0IHByaWNlSW5mbyA9IGA8c3Ryb25nPkdpw6EgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfTo8L3N0cm9uZz48YnI+YDtcclxuICBpZiAoaGFzRGlzY291bnQpIHtcclxuICAgIHByaWNlSW5mbyArPSBgR2nDoSBn4buRYzogPHNwYW4gc3R5bGU9XCJ0ZXh0LWRlY29yYXRpb246IGxpbmUtdGhyb3VnaDtcIj4ke2Zvcm1hdEN1cnJlbmN5KHByaWNlKX08L3NwYW4+PGJyPmA7XHJcbiAgICBwcmljZUluZm8gKz0gYEdpw6Ega2h1eeG6v24gbcOjaTogPHN0cm9uZyBzdHlsZT1cImNvbG9yOiByZWQ7XCI+JHtmb3JtYXRDdXJyZW5jeShwcm9tb1ByaWNlKX08L3N0cm9uZz4gKEdp4bqjbSAke2Rpc2NvdW50UGVyY2VudGFnZX0lKWA7XHJcbiAgfSBlbHNlIHtcclxuICAgIHByaWNlSW5mbyArPSBgPHN0cm9uZyBzdHlsZT1cImNvbG9yOiByZWQ7XCI+JHtmb3JtYXRDdXJyZW5jeShwcmljZSl9PC9zdHJvbmc+YDtcclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICBtZXNzYWdlOiBwcmljZUluZm8sXHJcbiAgICBpbnRlbnQ6IFwicHJvZHVjdFByaWNlXCJcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBz4bqjbiBwaOG6qW0gbGnDqm4gcXVhblxyXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvZHVjdCAtIFRow7RuZyB0aW4gc+G6o24gcGjhuqltXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgaGFuZGxlUmVsYXRlZFByb2R1Y3RzID0gYXN5bmMgKHByb2R1Y3QpID0+IHtcclxuICBjb25zdCBjYXRlZ29yeSA9IHByb2R1Y3QucHJvZHVjdENhdGVnb3J5O1xyXG4gIGNvbnN0IHJlbGF0ZWRQcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuZmluZCh7XHJcbiAgICBwcm9kdWN0Q2F0ZWdvcnk6IGNhdGVnb3J5LFxyXG4gICAgX2lkOiB7ICRuZTogcHJvZHVjdC5faWQgfSAvLyBMb+G6oWkgdHLhu6sgc+G6o24gcGjhuqltIGhp4buHbiB04bqhaVxyXG4gIH0pLmxpbWl0KDYpO1xyXG4gIFxyXG4gIGlmIChyZWxhdGVkUHJvZHVjdHMgJiYgcmVsYXRlZFByb2R1Y3RzLmxlbmd0aCA+IDApIHtcclxuICAgIGNvbnNvbGUubG9nKGBUw6xtIHRo4bqleSAke3JlbGF0ZWRQcm9kdWN0cy5sZW5ndGh9IHPhuqNuIHBo4bqpbSBsacOqbiBxdWFuIHRyb25nIGRhbmggbeG7pWMgXCIke2NhdGVnb3J5fVwiYCk7XHJcbiAgICBcclxuICAgIC8vIEZvcm1hdCBwcm9kdWN0cyBmb3IgZGlzcGxheVxyXG4gICAgY29uc3QgZm9ybWF0dGVkUHJvZHVjdHMgPSByZWxhdGVkUHJvZHVjdHMubWFwKHAgPT4gKHtcclxuICAgICAgaWQ6IHAuX2lkLFxyXG4gICAgICBuYW1lOiBwLnByb2R1Y3ROYW1lLFxyXG4gICAgICBwcmljZTogcC5wcm9kdWN0UHJpY2UsXHJcbiAgICAgIGRpc2NvdW50OiBwLnByb2R1Y3REaXNjb3VudCxcclxuICAgICAgcHJvbW90aW9uYWxQcmljZTogcC5wcm9kdWN0RGlzY291bnQgPyBNYXRoLnJvdW5kKHAucHJvZHVjdFByaWNlICogKDEgLSBwLnByb2R1Y3REaXNjb3VudCAvIDEwMCkpIDogcC5wcm9kdWN0UHJpY2UsXHJcbiAgICAgIGltYWdlOiBwLnByb2R1Y3RJbWFnZXMgJiYgcC5wcm9kdWN0SW1hZ2VzLmxlbmd0aCA+IDAgPyBwLnByb2R1Y3RJbWFnZXNbMF0gOiBcImRlZmF1bHQtcHJvZHVjdC5qcGdcIixcclxuICAgICAgc2x1ZzogcC5wcm9kdWN0TmFtZS50b0xvd2VyQ2FzZSgpLm5vcm1hbGl6ZShcIk5GRFwiKS5yZXBsYWNlKC9bXFx1MDMwMC1cXHUwMzZmXS9nLCBcIlwiKS5yZXBsYWNlKC9bXmEtejAtOV0rL2csIFwiLVwiKS5yZXBsYWNlKC8oXi18LSQpL2csIFwiXCIpXHJcbiAgICB9KSk7XHJcbiAgICBcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IGBDw6FjIHPhuqNuIHBo4bqpbSBsacOqbiBxdWFuIMSR4bq/biAke3Byb2R1Y3QucHJvZHVjdE5hbWV9OmAsXHJcbiAgICAgIGRhdGE6IGZvcm1hdHRlZFByb2R1Y3RzLFxyXG4gICAgICB0eXBlOiAncmVsYXRlZFByb2R1Y3RzJyxcclxuICAgICAgdGV4dDogYEPDoWMgc+G6o24gcGjhuqltIGxpw6puIHF1YW4gxJHhur9uICR7cHJvZHVjdC5wcm9kdWN0TmFtZX06YCxcclxuICAgICAgaW50ZW50OiBcInJlbGF0ZWRQcm9kdWN0c1wiXHJcbiAgICB9O1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBgSGnhu4duIHThuqFpIGtow7RuZyBjw7Mgc+G6o24gcGjhuqltIG7DoG8ga2jDoWMgdHJvbmcgZGFuaCBt4bulYyBcIiR7Y2F0ZWdvcnl9XCIuYCxcclxuICAgICAgaW50ZW50OiBcInJlbGF0ZWRQcm9kdWN0c1wiXHJcbiAgICB9O1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4EgeHXhuqV0IHjhu6kgc+G6o24gcGjhuqltXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9kdWN0IC0gVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW1cclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2lcclxuICovXHJcbmV4cG9ydCBjb25zdCBoYW5kbGVQcm9kdWN0T3JpZ2luID0gYXN5bmMgKHByb2R1Y3QpID0+IHtcclxuICBsZXQgb3JpZ2luSW5mbyA9ICcnO1xyXG4gIFxyXG4gIGlmIChwcm9kdWN0LnByb2R1Y3RPcmlnaW4gfHwgcHJvZHVjdC5vcmlnaW4pIHtcclxuICAgIG9yaWdpbkluZm8gPSBgPHN0cm9uZz5YdeG6pXQgeOG7qSAke3Byb2R1Y3QucHJvZHVjdE5hbWV9Ojwvc3Ryb25nPjxicj4ke3Byb2R1Y3QucHJvZHVjdE9yaWdpbiB8fCBwcm9kdWN0Lm9yaWdpbn1gO1xyXG4gICAgXHJcbiAgICBpZiAocHJvZHVjdC5wcm9kdWN0QnJhbmQpIHtcclxuICAgICAgb3JpZ2luSW5mbyArPSBgPGJyPlRoxrDGoW5nIGhp4buHdTogJHtwcm9kdWN0LnByb2R1Y3RCcmFuZH1gO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZiAocHJvZHVjdC5wcm9kdWN0TWFudWZhY3R1cmVyKSB7XHJcbiAgICAgIG9yaWdpbkluZm8gKz0gYDxicj5OaMOgIHPhuqNuIHh14bqldDogJHtwcm9kdWN0LnByb2R1Y3RNYW51ZmFjdHVyZXJ9YDtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgb3JpZ2luSW5mbyA9IGA8c3Ryb25nPlh14bqldCB44bupICR7cHJvZHVjdC5wcm9kdWN0TmFtZX06PC9zdHJvbmc+PGJyPlRow7RuZyB0aW4gduG7gSB4deG6pXQgeOG7qSBz4bqjbiBwaOG6qW0gxJHGsOG7o2MgZ2hpIHLDtSB0csOqbiBiYW8gYsOsLmA7XHJcbiAgfVxyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgbWVzc2FnZTogb3JpZ2luSW5mbyxcclxuICAgIGludGVudDogXCJwcm9kdWN0T3JpZ2luXCJcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSB0aMOgbmggcGjhuqduIHPhuqNuIHBo4bqpbVxyXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvZHVjdCAtIFRow7RuZyB0aW4gc+G6o24gcGjhuqltXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgaGFuZGxlUHJvZHVjdEluZ3JlZGllbnRzID0gYXN5bmMgKHByb2R1Y3QpID0+IHtcclxuICBsZXQgaW5ncmVkaWVudHNJbmZvID0gJyc7XHJcbiAgXHJcbiAgaWYgKHByb2R1Y3QucHJvZHVjdEluZ3JlZGllbnRzIHx8IHByb2R1Y3QuaW5ncmVkaWVudHMpIHtcclxuICAgIGluZ3JlZGllbnRzSW5mbyA9IGA8c3Ryb25nPlRow6BuaCBwaOG6p24gY+G7p2EgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfTo8L3N0cm9uZz48YnI+JHtwcm9kdWN0LnByb2R1Y3RJbmdyZWRpZW50cyB8fCBwcm9kdWN0LmluZ3JlZGllbnRzfWA7XHJcbiAgfSBlbHNlIHtcclxuICAgIGluZ3JlZGllbnRzSW5mbyA9IGA8c3Ryb25nPlRow6BuaCBwaOG6p24gY+G7p2EgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfTo8L3N0cm9uZz48YnI+VGjDtG5nIHRpbiBjaGkgdGnhur90IHbhu4EgdGjDoG5oIHBo4bqnbiBz4bqjbiBwaOG6qW0gxJHGsOG7o2MgZ2hpIHLDtSB0csOqbiBiYW8gYsOsLmA7XHJcbiAgfVxyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgbWVzc2FnZTogaW5ncmVkaWVudHNJbmZvLFxyXG4gICAgaW50ZW50OiBcInByb2R1Y3RJbmdyZWRpZW50c1wiXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4EgaOG6oW4gc+G7rSBk4bulbmcgc+G6o24gcGjhuqltXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9kdWN0IC0gVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW1cclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2lcclxuICovXHJcbmV4cG9ydCBjb25zdCBoYW5kbGVQcm9kdWN0RXhwaXJ5ID0gYXN5bmMgKHByb2R1Y3QpID0+IHtcclxuICBsZXQgZXhwaXJ5SW5mbyA9ICcnO1xyXG4gIFxyXG4gIGlmIChwcm9kdWN0LmV4cGlyeURhdGUgfHwgcHJvZHVjdC5wcm9kdWN0RXhwaXJ5KSB7XHJcbiAgICBleHBpcnlJbmZvID0gYDxzdHJvbmc+SOG6oW4gc+G7rSBk4bulbmcgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfTo8L3N0cm9uZz48YnI+JHtwcm9kdWN0LmV4cGlyeURhdGUgfHwgcHJvZHVjdC5wcm9kdWN0RXhwaXJ5fWA7XHJcbiAgfSBlbHNlIHtcclxuICAgIGV4cGlyeUluZm8gPSBgPHN0cm9uZz5I4bqhbiBz4butIGThu6VuZyAke3Byb2R1Y3QucHJvZHVjdE5hbWV9Ojwvc3Ryb25nPjxicj5UaMO0bmcgdGluIHbhu4EgaOG6oW4gc+G7rSBk4bulbmcgxJHGsOG7o2MgaW4gdHLDqm4gYmFvIGLDrCBz4bqjbiBwaOG6qW0uIFxyXG4gICAgVnVpIGzDsm5nIGtp4buDbSB0cmEga2hpIG5o4bqtbiBow6BuZy5gO1xyXG4gIH1cclxuICBcclxuICBpZiAocHJvZHVjdC5zdG9yYWdlSW5mbyB8fCBwcm9kdWN0LnByb2R1Y3RTdG9yYWdlKSB7XHJcbiAgICBleHBpcnlJbmZvICs9IGA8YnI+PGJyPjxzdHJvbmc+SMaw4bubbmcgZOG6q24gYuG6o28gcXXhuqNuOjwvc3Ryb25nPjxicj4ke3Byb2R1Y3Quc3RvcmFnZUluZm8gfHwgcHJvZHVjdC5wcm9kdWN0U3RvcmFnZX1gO1xyXG4gIH1cclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIG1lc3NhZ2U6IGV4cGlyeUluZm8sXHJcbiAgICBpbnRlbnQ6IFwicHJvZHVjdEV4cGlyeVwiXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4EgxJHDoW5oIGdpw6Egc+G6o24gcGjhuqltXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9kdWN0IC0gVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW1cclxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2lcclxuICovXHJcbmV4cG9ydCBjb25zdCBoYW5kbGVQcm9kdWN0UmV2aWV3cyA9IGFzeW5jIChwcm9kdWN0KSA9PiB7XHJcbiAgbGV0IHJldmlld0luZm8gPSAnJztcclxuICBcclxuICBpZiAocHJvZHVjdC5hdmVyYWdlUmF0aW5nKSB7XHJcbiAgICByZXZpZXdJbmZvID0gYDxzdHJvbmc+xJDDoW5oIGdpw6EgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfTo8L3N0cm9uZz48YnI+XHJcbiAgICDEkGnhu4NtIMSRw6FuaCBnacOhIHRydW5nIGLDrG5oOiAke3Byb2R1Y3QuYXZlcmFnZVJhdGluZ30vNSBzYW9gO1xyXG4gICAgXHJcbiAgICBpZiAocHJvZHVjdC5udW1PZlJldmlld3MpIHtcclxuICAgICAgcmV2aWV3SW5mbyArPSBgICgke3Byb2R1Y3QubnVtT2ZSZXZpZXdzfSBsxrDhu6N0IMSRw6FuaCBnacOhKWA7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldmlld0luZm8gPSBgPHN0cm9uZz7EkMOhbmggZ2nDoSAke3Byb2R1Y3QucHJvZHVjdE5hbWV9Ojwvc3Ryb25nPjxicj5cclxuICAgIFPhuqNuIHBo4bqpbSBuw6B5IGNoxrBhIGPDsyDEkcOhbmggZ2nDoS4gJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSBsw6Agc+G6o24gcGjhuqltIGNo4bqldCBsxrDhu6NuZyBjYW8sIFxyXG4gICAgxJHGsOG7o2Mgbmhp4buBdSBraMOhY2ggaMOgbmcgdGluIGTDuW5nIHRyb25nIHRo4budaSBnaWFuIHF1YS5gO1xyXG4gIH1cclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgc3VjY2VzczogdHJ1ZSxcclxuICAgIG1lc3NhZ2U6IHJldmlld0luZm8sXHJcbiAgICBpbnRlbnQ6IFwicHJvZHVjdFJldmlld3NcIlxyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogTWFpbiBoYW5kbGVyIGNobyBjw6FjIGPDonUgaOG7j2kgbGnDqm4gcXVhbiDEkeG6v24gc+G6o24gcGjhuqltIMSRYW5nIHhlbVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIFRpbiBuaOG6r24gdOG7qyBuZ8aw4budaSBkw7luZ1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvZHVjdElkIC0gSUQgY+G7p2Egc+G6o24gcGjhuqltIMSRYW5nIHhlbVxyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaVxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGhhbmRsZVByb2R1Y3RQYWdlUXVlc3Rpb25zID0gYXN5bmMgKG1lc3NhZ2UsIHByb2R1Y3RJZCkgPT4ge1xyXG4gIGlmICghcHJvZHVjdElkKSB7XHJcbiAgICByZXR1cm4gbnVsbDsgLy8gS2jDtG5nIGPDsyBwcm9kdWN0SWQsIHjhu60gbMO9IOG7nyBow6BtIGfhu41pXHJcbiAgfVxyXG4gIFxyXG4gIHRyeSB7XHJcbiAgICBjb25zb2xlLmxvZyhgxJBhbmcgeOG7rSBsw70gY8OidSBo4buPaSBjaG8gc+G6o24gcGjhuqltIElEOiAke3Byb2R1Y3RJZH1gKTtcclxuICAgIFxyXG4gICAgLy8gUGjDoXQgaGnhu4duIGludGVudFxyXG4gICAgY29uc3QgaW50ZW50ID0gZGV0ZWN0UHJvZHVjdEludGVudChtZXNzYWdlKTtcclxuICAgIGNvbnNvbGUubG9nKFwiUHJvZHVjdCBpbnRlbnQgxJHGsOG7o2MgcGjDoXQgaGnhu4duOlwiLCBpbnRlbnQpO1xyXG4gICAgXHJcbiAgICBpZiAoaW50ZW50Lm5hbWUgPT09ICd1bmtub3duJykge1xyXG4gICAgICByZXR1cm4gbnVsbDsgLy8gS2jDtG5nIHBo4bqjaSBpbnRlbnQgbGnDqm4gcXVhbiDEkeG6v24gc+G6o24gcGjhuqltLCB44butIGzDvSDhu58gaMOgbSBn4buNaVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBM4bqleSB0aMO0bmcgdGluIHPhuqNuIHBo4bqpbSB04burIGRhdGFiYXNlXHJcbiAgICBjb25zdCBwcm9kdWN0ID0gYXdhaXQgUHJvZHVjdC5maW5kQnlJZChwcm9kdWN0SWQpO1xyXG4gICAgXHJcbiAgICBpZiAoIXByb2R1Y3QpIHtcclxuICAgICAgY29uc29sZS5sb2coYEtow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW0gduG7m2kgSUQ6ICR7cHJvZHVjdElkfWApO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgbWVzc2FnZTogXCJYaW4gbOG7l2ksIHTDtGkga2jDtG5nIHTDrG0gdGjhuqV5IHRow7RuZyB0aW4gduG7gSBz4bqjbiBwaOG6qW0gbsOgeS5cIixcclxuICAgICAgICBpbnRlbnQ6IFwicHJvZHVjdE5vdEZvdW5kXCJcclxuICAgICAgfTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coYMSQw6MgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltOiAke3Byb2R1Y3QucHJvZHVjdE5hbWV9YCk7XHJcbiAgICBcclxuICAgIC8vIFjhu60gbMO9IHRoZW8gaW50ZW50XHJcbiAgICBzd2l0Y2ggKGludGVudC5uYW1lKSB7XHJcbiAgICAgIGNhc2UgJ3Byb2R1Y3RVc2FnZSc6XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZVByb2R1Y3RVc2FnZShwcm9kdWN0KTtcclxuICAgICAgY2FzZSAncHJvZHVjdEludHJvJzpcclxuICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlUHJvZHVjdEludHJvKHByb2R1Y3QpO1xyXG4gICAgICBjYXNlICdwcm9kdWN0UHJpY2UnOlxyXG4gICAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVQcm9kdWN0UHJpY2UocHJvZHVjdCk7XHJcbiAgICAgIGNhc2UgJ3JlbGF0ZWRQcm9kdWN0cyc6XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZVJlbGF0ZWRQcm9kdWN0cyhwcm9kdWN0KTtcclxuICAgICAgY2FzZSAncHJvZHVjdE9yaWdpbic6XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZVByb2R1Y3RPcmlnaW4ocHJvZHVjdCk7XHJcbiAgICAgIGNhc2UgJ3Byb2R1Y3RJbmdyZWRpZW50cyc6XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZVByb2R1Y3RJbmdyZWRpZW50cyhwcm9kdWN0KTtcclxuICAgICAgY2FzZSAncHJvZHVjdEV4cGlyeSc6XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZVByb2R1Y3RFeHBpcnkocHJvZHVjdCk7XHJcbiAgICAgIGNhc2UgJ3Byb2R1Y3RSZXZpZXdzJzpcclxuICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlUHJvZHVjdFJldmlld3MocHJvZHVjdCk7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgeOG7rSBsw70gY8OidSBo4buPaSB24buBIHPhuqNuIHBo4bqpbTpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJYaW4gbOG7l2ksIMSRw6MgeOG6o3kgcmEgbOG7l2kga2hpIHjhu60gbMO9IHnDqnUgY+G6p3UgY+G7p2EgYuG6oW4uXCIsXHJcbiAgICAgIGludGVudDogXCJlcnJvclwiXHJcbiAgICB9O1xyXG4gIH1cclxufTtcclxuIl0sIm1hcHBpbmdzIjoiK2RBQUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQyxjQUFjLEdBQUdBLENBQUNDLE1BQU0sS0FBSztFQUNqQyxPQUFPLElBQUlDLElBQUksQ0FBQ0MsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDQyxNQUFNLENBQUNILE1BQU0sSUFBSSxDQUFDLENBQUM7QUFDM0QsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ08sTUFBTUksbUJBQW1CLEdBQUdBLENBQUNDLE9BQU8sS0FBSztFQUM5QyxJQUFJLENBQUNBLE9BQU8sSUFBSSxPQUFPQSxPQUFP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