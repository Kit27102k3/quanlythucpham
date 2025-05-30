import Product from "../Model/Products.js";

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
export const detectProductIntent = (message) => {
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
 */
export const handleProductUsage = async (product) => {
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
 */
export const handleProductIntro = async (product) => {
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
 */
export const handleProductPrice = async (product) => {
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
 */
export const handleRelatedProducts = async (product) => {
  const category = product.productCategory;
  const relatedProducts = await Product.find({
    productCategory: category,
    _id: { $ne: product._id } // Loại trừ sản phẩm hiện tại
  }).limit(6);
  
  if (relatedProducts && relatedProducts.length > 0) {
    console.log(`Tìm thấy ${relatedProducts.length} sản phẩm liên quan trong danh mục "${category}"`);
    
    // Format products for display
    const formattedProducts = relatedProducts.map(p => ({
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
 */
export const handleProductOrigin = async (product) => {
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
 */
export const handleProductIngredients = async (product) => {
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
 */
export const handleProductExpiry = async (product) => {
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
 */
export const handleProductReviews = async (product) => {
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
 */
export const handleProductPageQuestions = async (message, productId) => {
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
    const product = await Product.findById(productId);
    
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
};
