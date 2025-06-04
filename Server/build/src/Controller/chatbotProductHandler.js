"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.handleRelatedProductsQuestion = exports.handleProductUsageQuestion = exports.handleProductReviewsQuestion = exports.handleProductPriceQuestion = exports.handleProductPageQuestion = exports.handleProductOriginQuestion = exports.handleProductIntroQuestion = exports.handleProductIngredientsQuestion = exports.handleProductExpiryQuestion = exports.detectProductPageIntent = void 0;




var _Products = _interopRequireDefault(require("../Model/Products.js")); /**
 * Xử lý câu hỏi về sản phẩm cụ thể
 * File này chứa các hàm để trả lời câu hỏi về sản phẩm
 */ /**
 * Định dạng số tiền sang VND
 * @param {number} amount - Số tiền
 * @returns {string} - Chuỗi tiền đã định dạng
 */const formatCurrency = (amount) => {
  // Đảm bảo amount là số
  const validAmount = Number(amount) || 0;

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(validAmount);
};

/**
 * Nhận diện intent từ tin nhắn cho sản phẩm đang xem
 * @param {string} message - Tin nhắn từ người dùng
 * @returns {string} - Intent được phát hiện
 */
const detectProductPageIntent = (message) => {
  if (!message) return null;

  const lowerMessage = message.toLowerCase().trim();

  // Công dụng sản phẩm (productDetails)
  if (lowerMessage.includes('công dụng') ||
  lowerMessage.includes('tác dụng') ||
  lowerMessage.includes('dùng để làm gì') ||
  lowerMessage.includes('dùng làm gì') ||
  lowerMessage.includes('sử dụng') ||
  lowerMessage.includes('tác dụng gì')) {
    return 'productUsage';
  }

  // Giới thiệu sản phẩm (productIntroduction)
  if (lowerMessage.includes('giới thiệu') ||
  lowerMessage.includes('nói về') ||
  lowerMessage.includes('giới thiệu về') ||
  lowerMessage.includes('thông tin về') ||
  lowerMessage.includes('mô tả')) {
    return 'productIntro';
  }

  // Giá sản phẩm (productPrice, productPromoPrice)
  if (lowerMessage.includes('giá') ||
  lowerMessage.includes('bao nhiêu tiền') ||
  lowerMessage.includes('giá cả') ||
  lowerMessage.includes('giá bao nhiêu')) {
    return 'productPrice';
  }

  // Sản phẩm liên quan (productCategory)
  if (lowerMessage.includes('liên quan') ||
  lowerMessage.includes('tương tự') ||
  lowerMessage.includes('sản phẩm khác') ||
  lowerMessage.includes('sản phẩm cùng loại') ||
  lowerMessage.includes('còn gì khác') ||
  lowerMessage.includes('gợi ý')) {
    return 'relatedProducts';
  }

  // Xuất xứ sản phẩm
  if (lowerMessage.includes('xuất xứ') ||
  lowerMessage.includes('nguồn gốc') ||
  lowerMessage.includes('sản xuất ở đâu') ||
  lowerMessage.includes('nước nào') ||
  lowerMessage.includes('hãng nào')) {
    return 'productOrigin';
  }

  // Thành phần sản phẩm
  if (lowerMessage.includes('thành phần') ||
  lowerMessage.includes('nguyên liệu') ||
  lowerMessage.includes('có chứa') ||
  lowerMessage.includes('làm từ') ||
  lowerMessage.includes('được làm từ') ||
  lowerMessage.includes('chất liệu')) {
    return 'productIngredients';
  }

  // Hạn sử dụng sản phẩm
  if (lowerMessage.includes('hạn sử dụng') ||
  lowerMessage.includes('date') ||
  lowerMessage.includes('hết hạn') ||
  lowerMessage.includes('dùng được bao lâu') ||
  lowerMessage.includes('bảo quản')) {
    return 'productExpiry';
  }

  // Đánh giá sản phẩm
  if (lowerMessage.includes('đánh giá') ||
  lowerMessage.includes('review') ||
  lowerMessage.includes('feedback') ||
  lowerMessage.includes('nhận xét') ||
  lowerMessage.includes('tốt không') ||
  lowerMessage.includes('có ngon không') ||
  lowerMessage.includes('có tốt không')) {
    return 'productReviews';
  }

  return null;
};

/**
 * Xử lý câu hỏi về công dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.detectProductPageIntent = detectProductPageIntent;
const handleProductUsageQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };

  const usage = product.productDetails || 'Hiện chưa có thông tin chi tiết về công dụng của sản phẩm này.';

  return {
    success: true,
    message: `<strong>Công dụng của ${product.productName}:</strong><br>${usage}`,
    intent: 'productUsage'
  };
};

/**
 * Xử lý câu hỏi về giới thiệu sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleProductUsageQuestion = handleProductUsageQuestion;
const handleProductIntroQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };

  const intro = product.productIntroduction || 'Hiện chưa có thông tin giới thiệu về sản phẩm này.';

  return {
    success: true,
    message: `<strong>Giới thiệu về ${product.productName}:</strong><br>${intro}`,
    intent: 'productIntro'
  };
};

/**
 * Xử lý câu hỏi về giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleProductIntroQuestion = handleProductIntroQuestion;
const handleProductPriceQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };

  const originalPrice = product.productPrice;
  const discount = product.productDiscount || 0;
  const promoPrice = product.productPromoPrice || (discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice);

  let priceMessage = `<strong>Giá ${product.productName}:</strong><br>`;

  if (discount > 0) {
    priceMessage += `<span style="text-decoration: line-through;">${formatCurrency(originalPrice)}đ</span><br>`;
    priceMessage += `<strong style="color: red;">${formatCurrency(promoPrice)}đ</strong> (Giảm ${discount}%)`;
  } else {
    priceMessage += `<strong style="color: red;">${formatCurrency(originalPrice)}đ</strong>`;
  }

  return {
    success: true,
    message: priceMessage,
    intent: 'productPrice'
  };
};

/**
 * Xử lý câu hỏi về sản phẩm liên quan
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleProductPriceQuestion = handleProductPriceQuestion;
const handleRelatedProductsQuestion = async (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };

  try {
    // Tìm các sản phẩm cùng danh mục
    const relatedProducts = await _Products.default.find({
      productCategory: product.productCategory,
      _id: { $ne: product._id } // Loại trừ sản phẩm hiện tại
    }).limit(5);

    if (!relatedProducts || relatedProducts.length === 0) {
      return {
        success: true,
        message: `Hiện không có sản phẩm nào khác trong danh mục "${product.productCategory}".`,
        intent: 'relatedProducts'
      };
    }

    // Format sản phẩm để hiển thị
    const formattedProducts = relatedProducts.map((p) => ({
      id: p._id,
      name: p.productName,
      price: p.productPrice,
      discount: p.productDiscount || 0,
      promotionalPrice: p.productPromoPrice || (p.productDiscount ? Math.round(p.productPrice * (1 - p.productDiscount / 100)) : p.productPrice),
      image: p.productImages && p.productImages.length > 0 ? p.productImages[0] : 'default-product.jpg',
      description: p.productInfo || p.productDetails || ''
    }));

    return {
      success: true,
      message: `Các sản phẩm liên quan đến ${product.productName}:`,
      data: formattedProducts,
      type: 'relatedProducts',
      text: `Các sản phẩm liên quan đến ${product.productName}:`,
      intent: 'relatedProducts',
      nameCategory: `Sản phẩm cùng loại "${product.productCategory}"`
    };
  } catch (error) {
    console.error('Lỗi khi tìm sản phẩm liên quan:', error);
    return {
      success: false,
      message: 'Có lỗi xảy ra khi tìm sản phẩm liên quan.',
      intent: 'error'
    };
  }
};

/**
 * Xử lý câu hỏi về xuất xứ sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleRelatedProductsQuestion = handleRelatedProductsQuestion;
const handleProductOriginQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };

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
    intent: 'productOrigin'
  };
};

/**
 * Xử lý câu hỏi về thành phần sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleProductOriginQuestion = handleProductOriginQuestion;
const handleProductIngredientsQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };

  let ingredientsInfo = '';

  if (product.productIngredients || product.ingredients) {
    ingredientsInfo = `<strong>Thành phần của ${product.productName}:</strong><br>${product.productIngredients || product.ingredients}`;
  } else {
    ingredientsInfo = `<strong>Thành phần của ${product.productName}:</strong><br>Thông tin chi tiết về thành phần sản phẩm được ghi rõ trên bao bì.`;
  }

  return {
    success: true,
    message: ingredientsInfo,
    intent: 'productIngredients'
  };
};

/**
 * Xử lý câu hỏi về hạn sử dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleProductIngredientsQuestion = handleProductIngredientsQuestion;
const handleProductExpiryQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };

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
    intent: 'productExpiry'
  };
};

/**
 * Xử lý câu hỏi về đánh giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */exports.handleProductExpiryQuestion = handleProductExpiryQuestion;
const handleProductReviewsQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };

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
    intent: 'productReviews'
  };
};

/**
 * Xử lý câu hỏi về sản phẩm cụ thể
 * @param {string} message - Câu hỏi của người dùng
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi cho câu hỏi
 */exports.handleProductReviewsQuestion = handleProductReviewsQuestion;
const handleProductPageQuestion = async (message, product) => {
  try {
    if (!message || !product) {
      return {
        success: false,
        message: "Thông tin không đầy đủ"
      };
    }

    console.log(`Đang xử lý câu hỏi: "${message}" về sản phẩm ${product.productName}`);

    // Phát hiện intent từ message
    const productIntent = detectProductPageIntent(message);
    console.log("Sản phẩm intent được phát hiện:", productIntent);

    // Xử lý theo intent
    if (productIntent) {
      switch (productIntent) {
        case 'productUsage':
          return handleProductUsageQuestion(product);
        case 'productIntro':
          return handleProductIntroQuestion(product);
        case 'productPrice':
          return handleProductPriceQuestion(product);
        case 'relatedProducts':
          return await handleRelatedProductsQuestion(product);
        case 'productOrigin':
          return handleProductOriginQuestion(product);
        case 'productIngredients':
          return handleProductIngredientsQuestion(product);
        case 'productExpiry':
          return handleProductExpiryQuestion(product);
        case 'productReviews':
          return handleProductReviewsQuestion(product);
      }
    }

    const lowerMessage = message.toLowerCase();

    // Xử lý các loại câu hỏi khác nhau

    // Câu hỏi về công dụng
    if (containsAny(lowerMessage, ['công dụng', 'tác dụng', 'để làm gì', 'dùng để', 'dùng như thế nào', 'sử dụng', 'cách dùng'])) {
      return generateUsageResponse(product);
    }

    // Câu hỏi về giới thiệu sản phẩm
    if (containsAny(lowerMessage, ['giới thiệu', 'nói về', 'thông tin về', 'mô tả', 'sản phẩm này', 'thế nào'])) {
      return generateIntroductionResponse(product);
    }

    // Câu hỏi về giá cả
    if (containsAny(lowerMessage, ['giá bao nhiêu', 'bao nhiêu tiền', 'giá cả', 'giá tiền', 'giá'])) {
      return generatePriceResponse(product);
    }

    // Câu hỏi về xuất xứ, thành phần
    if (containsAny(lowerMessage, ['xuất xứ', 'sản xuất', 'thành phần', 'nguyên liệu', 'có chứa', 'bảo quản'])) {
      return generateOriginResponse(product);
    }

    // Câu hỏi về đánh giá sản phẩm
    if (containsAny(lowerMessage, ['review', 'đánh giá', 'nhận xét', 'phản hồi', 'ý kiến', 'tốt không', 'có tốt', 'có ngon'])) {
      return generateReviewResponse(product);
    }

    // Câu hỏi về tương tự sản phẩm
    if (containsAny(lowerMessage, ['sản phẩm tương tự', 'tương tự', 'giống', 'sản phẩm khác', 'thay thế', 'sản phẩm liên quan', 'liên quan'])) {
      return await generateSimilarProductsResponse(product);
    }

    // Câu hỏi khác về sản phẩm
    return {
      success: true,
      type: 'text',
      message: `Sản phẩm ${product.productName} thuộc danh mục ${product.productCategory || product.category} với giá ${formatCurrency(product.productPrice || product.price || 0)}. Bạn muốn biết thêm thông tin gì về sản phẩm này?`
    };

  } catch (error) {
    console.error("Lỗi khi xử lý câu hỏi sản phẩm:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi xử lý câu hỏi. Vui lòng thử lại sau."
    };
  }
};

/**
 * Kiểm tra xem chuỗi có chứa một trong các từ khóa không
 * @param {string} text - Chuỗi cần kiểm tra
 * @param {Array} keywords - Mảng các từ khóa
 * @returns {boolean} - Có chứa từ khóa hay không
 */exports.handleProductPageQuestion = handleProductPageQuestion;
const containsAny = (text, keywords) => {
  return keywords.some((keyword) => text.includes(keyword));
};

/**
 * Tạo phản hồi về công dụng sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
const generateUsageResponse = (product) => {
  let message = '';

  if (product.productDetails && product.productDetails.length > 0) {
    message = `${product.productName} ${product.productDetails}`;
  } else if (product.description && product.description.length > 0) {
    message = `${product.productName} dùng để ${product.description}`;
  } else {
    message = `${product.productName} là sản phẩm ${product.productCategory || product.category}. Bạn có thể sử dụng sản phẩm theo hướng dẫn trên bao bì.`;
  }

  return {
    success: true,
    type: 'text',
    message
  };
};

/**
 * Tạo phản hồi về giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
const generatePriceResponse = (product) => {
  // Lấy giá gốc và giá khuyến mãi nếu có
  const originalPrice = product.productPrice || product.price || 0;
  const discount = product.productDiscount || 0;
  const promoPrice = product.productPromoPrice || (discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice);

  let message = '';
  if (discount > 0) {
    message = `Giá của ${product.productName} là ${formatCurrency(promoPrice)}đ (Đã giảm ${discount}% từ ${formatCurrency(originalPrice)}đ).`;
  } else {
    message = `Giá của ${product.productName} là ${formatCurrency(originalPrice)}đ.`;
  }

  return {
    success: true,
    type: 'text',
    message
  };
};

/**
 * Tạo phản hồi về xuất xứ sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
const generateOriginResponse = (product) => {
  let message = '';

  if (product.productOrigin || product.origin) {
    message = `${product.productName} có xuất xứ từ ${product.productOrigin || product.origin}.`;

    // Thêm thông tin thương hiệu nếu có
    if (product.productBrand) {
      message += ` Sản phẩm thuộc thương hiệu ${product.productBrand}.`;
    }
  } else {
    message = `Thông tin chi tiết về xuất xứ và thành phần của ${product.productName} được ghi rõ trên bao bì sản phẩm.`;
  }

  return {
    success: true,
    type: 'text',
    message
  };
};

/**
 * Tạo phản hồi về đánh giá sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
const generateReviewResponse = (product) => {
  // Nếu có đánh giá thực tế từ database, có thể sử dụng thông tin đó
  let message = '';

  if (product.averageRating && product.averageRating > 0) {
    message = `${product.productName} có điểm đánh giá trung bình là ${product.averageRating}/5 sao từ ${product.numOfReviews || 0} lượt đánh giá.`;
  } else {
    message = `${product.productName} là một sản phẩm chất lượng cao thuộc danh mục ${product.productCategory || product.category}. `;

    if (product.productIntroduction) {
      message += product.productIntroduction;
    } else {
      message += `Khách hàng đánh giá rất tốt về sản phẩm này.`;
    }
  }

  return {
    success: true,
    type: 'text',
    message
  };
};

/**
 * Tạo phản hồi về sản phẩm tương tự
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
const generateSimilarProductsResponse = async (product) => {
  try {
    console.log("Tìm sản phẩm tương tự cho:", product.productName);

    const category = product.productCategory || product.category;

    if (!category) {
      console.error("Không tìm thấy danh mục cho sản phẩm:", product.productName);
      return {
        success: true,
        type: 'text',
        message: `Hiện tại chúng tôi không tìm thấy sản phẩm tương tự với ${product.productName}.`
      };
    }

    console.log("Tìm sản phẩm tương tự thuộc danh mục:", category);

    // Tìm các sản phẩm cùng danh mục
    const similarProducts = await _Products.default.find({
      $or: [
      { productCategory: category },
      { category: category }],

      _id: { $ne: product._id }
    }).limit(5);

    console.log(`Tìm thấy ${similarProducts.length} sản phẩm tương tự thuộc danh mục ${category}`);

    if (similarProducts && similarProducts.length > 0) {
      return {
        success: true,
        type: 'categoryQuery',
        message: `Đây là một số sản phẩm tương tự với ${product.productName}:`,
        data: similarProducts
      };
    } else {
      return {
        success: true,
        type: 'text',
        message: `Hiện tại chúng tôi không có sản phẩm tương tự với ${product.productName} thuộc danh mục ${category}.`
      };
    }
  } catch (error) {
    console.error("Lỗi khi tìm sản phẩm tương tự:", error);
    return {
      success: true,
      type: 'text',
      message: `Không thể tìm thấy sản phẩm tương tự với ${product.productName}. Xin lỗi vì sự bất tiện này.`
    };
  }
};

/**
 * Tạo phản hồi về giới thiệu sản phẩm
 * @param {object} product - Thông tin sản phẩm
 * @returns {object} - Phản hồi
 */
const generateIntroductionResponse = (product) => {
  let message = '';

  if (product.productIntroduction && product.productIntroduction.length > 0) {
    message = `Giới thiệu về ${product.productName}: ${product.productIntroduction}`;
  } else if (product.productInfo && product.productInfo.length > 0) {
    message = `Giới thiệu về ${product.productName}: ${product.productInfo}`;
  } else {
    message = `${product.productName} là sản phẩm ${product.productCategory || product.category}. Hiện chưa có thông tin giới thiệu chi tiết về sản phẩm này.`;
  }

  return {
    success: true,
    type: 'text',
    message
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfUHJvZHVjdHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsImZvcm1hdEN1cnJlbmN5IiwiYW1vdW50IiwidmFsaWRBbW91bnQiLCJOdW1iZXIiLCJJbnRsIiwiTnVtYmVyRm9ybWF0Iiwic3R5bGUiLCJjdXJyZW5jeSIsIm1heGltdW1GcmFjdGlvbkRpZ2l0cyIsImZvcm1hdCIsImRldGVjdFByb2R1Y3RQYWdlSW50ZW50IiwibWVzc2FnZSIsImxvd2VyTWVzc2FnZSIsInRvTG93ZXJDYXNlIiwidHJpbSIsImluY2x1ZGVzIiwiZXhwb3J0cyIsImhhbmRsZVByb2R1Y3RVc2FnZVF1ZXN0aW9uIiwicHJvZHVjdCIsInN1Y2Nlc3MiLCJ1c2FnZSIsInByb2R1Y3REZXRhaWxzIiwicHJvZHVjdE5hbWUiLCJpbnRlbnQiLCJoYW5kbGVQcm9kdWN0SW50cm9RdWVzdGlvbiIsImludHJvIiwicHJvZHVjdEludHJvZHVjdGlvbiIsImhhbmRsZVByb2R1Y3RQcmljZVF1ZXN0aW9uIiwib3JpZ2luYWxQcmljZSIsInByb2R1Y3RQcmljZSIsImRpc2NvdW50IiwicHJvZHVjdERpc2NvdW50IiwicHJvbW9QcmljZSIsInByb2R1Y3RQcm9tb1ByaWNlIiwiTWF0aCIsInJvdW5kIiwicHJpY2VNZXNzYWdlIiwiaGFuZGxlUmVsYXRlZFByb2R1Y3RzUXVlc3Rpb24iLCJyZWxhdGVkUHJvZHVjdHMiLCJQcm9kdWN0IiwiZmluZCIsInByb2R1Y3RDYXRlZ29yeSIsIl9pZCIsIiRuZSIsImxpbWl0IiwibGVuZ3RoIiwiZm9ybWF0dGVkUHJvZHVjdHMiLCJtYXAiLCJwIiwiaWQiLCJuYW1lIiwicHJpY2UiLCJwcm9tb3Rpb25hbFByaWNlIiwiaW1hZ2UiLCJwcm9kdWN0SW1hZ2VzIiwiZGVzY3JpcHRpb24iLCJwcm9kdWN0SW5mbyIsImRhdGEiLCJ0eXBlIiwidGV4dCIsIm5hbWVDYXRlZ29yeSIsImVycm9yIiwiY29uc29sZSIsImhhbmRsZVByb2R1Y3RPcmlnaW5RdWVzdGlvbiIsIm9yaWdpbkluZm8iLCJwcm9kdWN0T3JpZ2luIiwib3JpZ2luIiwicHJvZHVjdEJyYW5kIiwicHJvZHVjdE1hbnVmYWN0dXJlciIsImhhbmRsZVByb2R1Y3RJbmdyZWRpZW50c1F1ZXN0aW9uIiwiaW5ncmVkaWVudHNJbmZvIiwicHJvZHVjdEluZ3JlZGllbnRzIiwiaW5ncmVkaWVudHMiLCJoYW5kbGVQcm9kdWN0RXhwaXJ5UXVlc3Rpb24iLCJleHBpcnlJbmZvIiwiZXhwaXJ5RGF0ZSIsInByb2R1Y3RFeHBpcnkiLCJzdG9yYWdlSW5mbyIsInByb2R1Y3RTdG9yYWdlIiwiaGFuZGxlUHJvZHVjdFJldmlld3NRdWVzdGlvbiIsInJldmlld0luZm8iLCJhdmVyYWdlUmF0aW5nIiwibnVtT2ZSZXZpZXdzIiwiaGFuZGxlUHJvZHVjdFBhZ2VRdWVzdGlvbiIsImxvZyIsInByb2R1Y3RJbnRlbnQiLCJjb250YWluc0FueSIsImdlbmVyYXRlVXNhZ2VSZXNwb25zZSIsImdlbmVyYXRlSW50cm9kdWN0aW9uUmVzcG9uc2UiLCJnZW5lcmF0ZVByaWNlUmVzcG9uc2UiLCJnZW5lcmF0ZU9yaWdpblJlc3BvbnNlIiwiZ2VuZXJhdGVSZXZpZXdSZXNwb25zZSIsImdlbmVyYXRlU2ltaWxhclByb2R1Y3RzUmVzcG9uc2UiLCJjYXRlZ29yeSIsImtleXdvcmRzIiwic29tZSIsImtleXdvcmQiLCJzaW1pbGFyUHJvZHVjdHMiLCIkb3IiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQ29udHJvbGxlci9jaGF0Ym90UHJvZHVjdEhhbmRsZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4Egc+G6o24gcGjhuqltIGPhu6UgdGjhu4NcbiAqIEZpbGUgbsOgeSBjaOG7qWEgY8OhYyBow6BtIMSR4buDIHRy4bqjIGzhu51pIGPDonUgaOG7j2kgduG7gSBz4bqjbiBwaOG6qW1cbiAqL1xuXG5pbXBvcnQgUHJvZHVjdCBmcm9tIFwiLi4vTW9kZWwvUHJvZHVjdHMuanNcIjtcblxuLyoqXG4gKiDEkOG7i25oIGThuqFuZyBz4buRIHRp4buBbiBzYW5nIFZORFxuICogQHBhcmFtIHtudW1iZXJ9IGFtb3VudCAtIFPhu5EgdGnhu4FuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAtIENodeG7l2kgdGnhu4FuIMSRw6MgxJHhu4tuaCBk4bqhbmdcbiAqL1xuY29uc3QgZm9ybWF0Q3VycmVuY3kgPSAoYW1vdW50KSA9PiB7XG4gIC8vIMSQ4bqjbSBi4bqjbyBhbW91bnQgbMOgIHPhu5FcbiAgY29uc3QgdmFsaWRBbW91bnQgPSBOdW1iZXIoYW1vdW50KSB8fCAwO1xuICBcbiAgcmV0dXJuIG5ldyBJbnRsLk51bWJlckZvcm1hdCgndmktVk4nLCB7IFxuICAgIHN0eWxlOiAnY3VycmVuY3knLCBcbiAgICBjdXJyZW5jeTogJ1ZORCcsXG4gICAgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAwXG4gIH0pLmZvcm1hdCh2YWxpZEFtb3VudCk7XG59O1xuXG4vKipcbiAqIE5o4bqtbiBkaeG7h24gaW50ZW50IHThu6sgdGluIG5o4bqvbiBjaG8gc+G6o24gcGjhuqltIMSRYW5nIHhlbVxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBUaW4gbmjhuq9uIHThu6sgbmfGsOG7nWkgZMO5bmdcbiAqIEByZXR1cm5zIHtzdHJpbmd9IC0gSW50ZW50IMSRxrDhu6NjIHBow6F0IGhp4buHblxuICovXG5leHBvcnQgY29uc3QgZGV0ZWN0UHJvZHVjdFBhZ2VJbnRlbnQgPSAobWVzc2FnZSkgPT4ge1xuICBpZiAoIW1lc3NhZ2UpIHJldHVybiBudWxsO1xuICBcbiAgY29uc3QgbG93ZXJNZXNzYWdlID0gbWVzc2FnZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgXG4gIC8vIEPDtG5nIGThu6VuZyBz4bqjbiBwaOG6qW0gKHByb2R1Y3REZXRhaWxzKVxuICBpZiAobG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdjw7RuZyBk4bulbmcnKSB8fCBcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygndMOhYyBk4bulbmcnKSB8fCBcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnZMO5bmcgxJHhu4MgbMOgbSBnw6wnKSB8fFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdkw7luZyBsw6BtIGfDrCcpIHx8XG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ3Phu60gZOG7pW5nJykgfHwgXG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ3TDoWMgZOG7pW5nIGfDrCcpKSB7XG4gICAgcmV0dXJuICdwcm9kdWN0VXNhZ2UnO1xuICB9XG4gIFxuICAvLyBHaeG7m2kgdGhp4buHdSBz4bqjbiBwaOG6qW0gKHByb2R1Y3RJbnRyb2R1Y3Rpb24pXG4gIGlmIChsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2dp4bubaSB0aGnhu4d1JykgfHwgXG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ27Ds2kgduG7gScpIHx8IFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdnaeG7m2kgdGhp4buHdSB24buBJykgfHxcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygndGjDtG5nIHRpbiB24buBJykgfHxcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnbcO0IHThuqMnKSkge1xuICAgIHJldHVybiAncHJvZHVjdEludHJvJztcbiAgfVxuICBcbiAgLy8gR2nDoSBz4bqjbiBwaOG6qW0gKHByb2R1Y3RQcmljZSwgcHJvZHVjdFByb21vUHJpY2UpXG4gIGlmIChsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2dpw6EnKSB8fCBcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnYmFvIG5oacOqdSB0aeG7gW4nKSB8fCBcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnZ2nDoSBj4bqjJykgfHxcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnZ2nDoSBiYW8gbmhpw6p1JykpIHtcbiAgICByZXR1cm4gJ3Byb2R1Y3RQcmljZSc7XG4gIH1cbiAgXG4gIC8vIFPhuqNuIHBo4bqpbSBsacOqbiBxdWFuIChwcm9kdWN0Q2F0ZWdvcnkpXG4gIGlmIChsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2xpw6puIHF1YW4nKSB8fCBcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygndMawxqFuZyB04buxJykgfHwgXG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ3PhuqNuIHBo4bqpbSBraMOhYycpIHx8XG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ3PhuqNuIHBo4bqpbSBjw7luZyBsb+G6oWknKSB8fFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdjw7JuIGfDrCBraMOhYycpIHx8XG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2fhu6NpIMO9JykpIHtcbiAgICByZXR1cm4gJ3JlbGF0ZWRQcm9kdWN0cyc7XG4gIH1cbiAgXG4gIC8vIFh14bqldCB44bupIHPhuqNuIHBo4bqpbVxuICBpZiAobG93ZXJNZXNzYWdlLmluY2x1ZGVzKCd4deG6pXQgeOG7qScpIHx8IFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCduZ3Xhu5NuIGfhu5FjJykgfHwgXG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ3PhuqNuIHh14bqldCDhu58gxJHDonUnKSB8fFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCduxrDhu5tjIG7DoG8nKSB8fFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdow6NuZyBuw6BvJykpIHtcbiAgICByZXR1cm4gJ3Byb2R1Y3RPcmlnaW4nO1xuICB9XG4gIFxuICAvLyBUaMOgbmggcGjhuqduIHPhuqNuIHBo4bqpbVxuICBpZiAobG93ZXJNZXNzYWdlLmluY2x1ZGVzKCd0aMOgbmggcGjhuqduJykgfHwgXG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ25ndXnDqm4gbGnhu4d1JykgfHwgXG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2PDsyBjaOG7qWEnKSB8fFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdsw6BtIHThu6snKSB8fFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCfEkcaw4bujYyBsw6BtIHThu6snKSB8fFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdjaOG6pXQgbGnhu4d1JykpIHtcbiAgICByZXR1cm4gJ3Byb2R1Y3RJbmdyZWRpZW50cyc7XG4gIH1cbiAgXG4gIC8vIEjhuqFuIHPhu60gZOG7pW5nIHPhuqNuIHBo4bqpbVxuICBpZiAobG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdo4bqhbiBz4butIGThu6VuZycpIHx8IFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdkYXRlJykgfHwgXG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2jhur90IGjhuqFuJykgfHxcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnZMO5bmcgxJHGsOG7o2MgYmFvIGzDonUnKSB8fFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdi4bqjbyBxdeG6o24nKSkge1xuICAgIHJldHVybiAncHJvZHVjdEV4cGlyeSc7XG4gIH1cbiAgXG4gIC8vIMSQw6FuaCBnacOhIHPhuqNuIHBo4bqpbVxuICBpZiAobG93ZXJNZXNzYWdlLmluY2x1ZGVzKCfEkcOhbmggZ2nDoScpIHx8IFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCdyZXZpZXcnKSB8fCBcbiAgICAgIGxvd2VyTWVzc2FnZS5pbmNsdWRlcygnZmVlZGJhY2snKSB8fFxuICAgICAgbG93ZXJNZXNzYWdlLmluY2x1ZGVzKCduaOG6rW4geMOpdCcpIHx8XG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ3Thu5F0IGtow7RuZycpIHx8XG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2PDsyBuZ29uIGtow7RuZycpIHx8XG4gICAgICBsb3dlck1lc3NhZ2UuaW5jbHVkZXMoJ2PDsyB04buRdCBraMO0bmcnKSkge1xuICAgIHJldHVybiAncHJvZHVjdFJldmlld3MnO1xuICB9XG4gIFxuICByZXR1cm4gbnVsbDtcbn07XG5cbi8qKlxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIGPDtG5nIGThu6VuZyBz4bqjbiBwaOG6qW1cbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9kdWN0IC0gVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW1cbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpXG4gKi9cbmV4cG9ydCBjb25zdCBoYW5kbGVQcm9kdWN0VXNhZ2VRdWVzdGlvbiA9IChwcm9kdWN0KSA9PiB7XG4gIGlmICghcHJvZHVjdCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdLaMO0bmcgdMOsbSB0aOG6pXkgdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0nIH07XG4gIFxuICBjb25zdCB1c2FnZSA9IHByb2R1Y3QucHJvZHVjdERldGFpbHMgfHwgJ0hp4buHbiBjaMawYSBjw7MgdGjDtG5nIHRpbiBjaGkgdGnhur90IHbhu4EgY8O0bmcgZOG7pW5nIGPhu6dhIHPhuqNuIHBo4bqpbSBuw6B5Lic7XG4gIFxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgbWVzc2FnZTogYDxzdHJvbmc+Q8O0bmcgZOG7pW5nIGPhu6dhICR7cHJvZHVjdC5wcm9kdWN0TmFtZX06PC9zdHJvbmc+PGJyPiR7dXNhZ2V9YCxcbiAgICBpbnRlbnQ6ICdwcm9kdWN0VXNhZ2UnXG4gIH07XG59O1xuXG4vKipcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBnaeG7m2kgdGhp4buHdSBz4bqjbiBwaOG6qW1cbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9kdWN0IC0gVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW1cbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpXG4gKi9cbmV4cG9ydCBjb25zdCBoYW5kbGVQcm9kdWN0SW50cm9RdWVzdGlvbiA9IChwcm9kdWN0KSA9PiB7XG4gIGlmICghcHJvZHVjdCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdLaMO0bmcgdMOsbSB0aOG6pXkgdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0nIH07XG4gIFxuICBjb25zdCBpbnRybyA9IHByb2R1Y3QucHJvZHVjdEludHJvZHVjdGlvbiB8fCAnSGnhu4duIGNoxrBhIGPDsyB0aMO0bmcgdGluIGdp4bubaSB0aGnhu4d1IHbhu4Egc+G6o24gcGjhuqltIG7DoHkuJztcbiAgXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBtZXNzYWdlOiBgPHN0cm9uZz5HaeG7m2kgdGhp4buHdSB24buBICR7cHJvZHVjdC5wcm9kdWN0TmFtZX06PC9zdHJvbmc+PGJyPiR7aW50cm99YCxcbiAgICBpbnRlbnQ6ICdwcm9kdWN0SW50cm8nXG4gIH07XG59O1xuXG4vKipcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBnacOhIHPhuqNuIHBo4bqpbVxuICogQHBhcmFtIHtvYmplY3R9IHByb2R1Y3QgLSBUaMO0bmcgdGluIHPhuqNuIHBo4bqpbVxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2lcbiAqL1xuZXhwb3J0IGNvbnN0IGhhbmRsZVByb2R1Y3RQcmljZVF1ZXN0aW9uID0gKHByb2R1Y3QpID0+IHtcbiAgaWYgKCFwcm9kdWN0KSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ0tow7RuZyB0w6xtIHRo4bqleSB0aMO0bmcgdGluIHPhuqNuIHBo4bqpbScgfTtcbiAgXG4gIGNvbnN0IG9yaWdpbmFsUHJpY2UgPSBwcm9kdWN0LnByb2R1Y3RQcmljZTtcbiAgY29uc3QgZGlzY291bnQgPSBwcm9kdWN0LnByb2R1Y3REaXNjb3VudCB8fCAwO1xuICBjb25zdCBwcm9tb1ByaWNlID0gcHJvZHVjdC5wcm9kdWN0UHJvbW9QcmljZSB8fCAoZGlzY291bnQgPiAwID8gTWF0aC5yb3VuZChvcmlnaW5hbFByaWNlICogKDEgLSBkaXNjb3VudC8xMDApKSA6IG9yaWdpbmFsUHJpY2UpO1xuICBcbiAgbGV0IHByaWNlTWVzc2FnZSA9IGA8c3Ryb25nPkdpw6EgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfTo8L3N0cm9uZz48YnI+YDtcbiAgXG4gIGlmIChkaXNjb3VudCA+IDApIHtcbiAgICBwcmljZU1lc3NhZ2UgKz0gYDxzcGFuIHN0eWxlPVwidGV4dC1kZWNvcmF0aW9uOiBsaW5lLXRocm91Z2g7XCI+JHtmb3JtYXRDdXJyZW5jeShvcmlnaW5hbFByaWNlKX3EkTwvc3Bhbj48YnI+YDtcbiAgICBwcmljZU1lc3NhZ2UgKz0gYDxzdHJvbmcgc3R5bGU9XCJjb2xvcjogcmVkO1wiPiR7Zm9ybWF0Q3VycmVuY3kocHJvbW9QcmljZSl9xJE8L3N0cm9uZz4gKEdp4bqjbSAke2Rpc2NvdW50fSUpYDtcbiAgfSBlbHNlIHtcbiAgICBwcmljZU1lc3NhZ2UgKz0gYDxzdHJvbmcgc3R5bGU9XCJjb2xvcjogcmVkO1wiPiR7Zm9ybWF0Q3VycmVuY3kob3JpZ2luYWxQcmljZSl9xJE8L3N0cm9uZz5gO1xuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgbWVzc2FnZTogcHJpY2VNZXNzYWdlLFxuICAgIGludGVudDogJ3Byb2R1Y3RQcmljZSdcbiAgfTtcbn07XG5cbi8qKlxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIHPhuqNuIHBo4bqpbSBsacOqbiBxdWFuXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvZHVjdCAtIFRow7RuZyB0aW4gc+G6o24gcGjhuqltXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaVxuICovXG5leHBvcnQgY29uc3QgaGFuZGxlUmVsYXRlZFByb2R1Y3RzUXVlc3Rpb24gPSBhc3luYyAocHJvZHVjdCkgPT4ge1xuICBpZiAoIXByb2R1Y3QpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnS2jDtG5nIHTDrG0gdGjhuqV5IHRow7RuZyB0aW4gc+G6o24gcGjhuqltJyB9O1xuICBcbiAgdHJ5IHtcbiAgICAvLyBUw6xtIGPDoWMgc+G6o24gcGjhuqltIGPDuW5nIGRhbmggbeG7pWNcbiAgICBjb25zdCByZWxhdGVkUHJvZHVjdHMgPSBhd2FpdCBQcm9kdWN0LmZpbmQoe1xuICAgICAgcHJvZHVjdENhdGVnb3J5OiBwcm9kdWN0LnByb2R1Y3RDYXRlZ29yeSxcbiAgICAgIF9pZDogeyAkbmU6IHByb2R1Y3QuX2lkIH0gLy8gTG/huqFpIHRy4burIHPhuqNuIHBo4bqpbSBoaeG7h24gdOG6oWlcbiAgICB9KS5saW1pdCg1KTtcbiAgICBcbiAgICBpZiAoIXJlbGF0ZWRQcm9kdWN0cyB8fCByZWxhdGVkUHJvZHVjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBtZXNzYWdlOiBgSGnhu4duIGtow7RuZyBjw7Mgc+G6o24gcGjhuqltIG7DoG8ga2jDoWMgdHJvbmcgZGFuaCBt4bulYyBcIiR7cHJvZHVjdC5wcm9kdWN0Q2F0ZWdvcnl9XCIuYCxcbiAgICAgICAgaW50ZW50OiAncmVsYXRlZFByb2R1Y3RzJ1xuICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLy8gRm9ybWF0IHPhuqNuIHBo4bqpbSDEkeG7gyBoaeG7g24gdGjhu4tcbiAgICBjb25zdCBmb3JtYXR0ZWRQcm9kdWN0cyA9IHJlbGF0ZWRQcm9kdWN0cy5tYXAocCA9PiAoe1xuICAgICAgaWQ6IHAuX2lkLFxuICAgICAgbmFtZTogcC5wcm9kdWN0TmFtZSxcbiAgICAgIHByaWNlOiBwLnByb2R1Y3RQcmljZSxcbiAgICAgIGRpc2NvdW50OiBwLnByb2R1Y3REaXNjb3VudCB8fCAwLFxuICAgICAgcHJvbW90aW9uYWxQcmljZTogcC5wcm9kdWN0UHJvbW9QcmljZSB8fCAocC5wcm9kdWN0RGlzY291bnQgPyBNYXRoLnJvdW5kKHAucHJvZHVjdFByaWNlICogKDEgLSBwLnByb2R1Y3REaXNjb3VudC8xMDApKSA6IHAucHJvZHVjdFByaWNlKSxcbiAgICAgIGltYWdlOiBwLnByb2R1Y3RJbWFnZXMgJiYgcC5wcm9kdWN0SW1hZ2VzLmxlbmd0aCA+IDAgPyBwLnByb2R1Y3RJbWFnZXNbMF0gOiAnZGVmYXVsdC1wcm9kdWN0LmpwZycsXG4gICAgICBkZXNjcmlwdGlvbjogcC5wcm9kdWN0SW5mbyB8fCBwLnByb2R1Y3REZXRhaWxzIHx8ICcnXG4gICAgfSkpO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogYEPDoWMgc+G6o24gcGjhuqltIGxpw6puIHF1YW4gxJHhur9uICR7cHJvZHVjdC5wcm9kdWN0TmFtZX06YCxcbiAgICAgIGRhdGE6IGZvcm1hdHRlZFByb2R1Y3RzLFxuICAgICAgdHlwZTogJ3JlbGF0ZWRQcm9kdWN0cycsXG4gICAgICB0ZXh0OiBgQ8OhYyBz4bqjbiBwaOG6qW0gbGnDqm4gcXVhbiDEkeG6v24gJHtwcm9kdWN0LnByb2R1Y3ROYW1lfTpgLFxuICAgICAgaW50ZW50OiAncmVsYXRlZFByb2R1Y3RzJyxcbiAgICAgIG5hbWVDYXRlZ29yeTogYFPhuqNuIHBo4bqpbSBjw7luZyBsb+G6oWkgXCIke3Byb2R1Y3QucHJvZHVjdENhdGVnb3J5fVwiYFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIHTDrG0gc+G6o24gcGjhuqltIGxpw6puIHF1YW46JywgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6ICdDw7MgbOG7l2kgeOG6o3kgcmEga2hpIHTDrG0gc+G6o24gcGjhuqltIGxpw6puIHF1YW4uJyxcbiAgICAgIGludGVudDogJ2Vycm9yJ1xuICAgIH07XG4gIH1cbn07XG5cbi8qKlxuICogWOG7rSBsw70gY8OidSBo4buPaSB24buBIHh14bqldCB44bupIHPhuqNuIHBo4bqpbVxuICogQHBhcmFtIHtvYmplY3R9IHByb2R1Y3QgLSBUaMO0bmcgdGluIHPhuqNuIHBo4bqpbVxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2lcbiAqL1xuZXhwb3J0IGNvbnN0IGhhbmRsZVByb2R1Y3RPcmlnaW5RdWVzdGlvbiA9IChwcm9kdWN0KSA9PiB7XG4gIGlmICghcHJvZHVjdCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdLaMO0bmcgdMOsbSB0aOG6pXkgdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0nIH07XG4gIFxuICBsZXQgb3JpZ2luSW5mbyA9ICcnO1xuICBcbiAgaWYgKHByb2R1Y3QucHJvZHVjdE9yaWdpbiB8fCBwcm9kdWN0Lm9yaWdpbikge1xuICAgIG9yaWdpbkluZm8gPSBgPHN0cm9uZz5YdeG6pXQgeOG7qSAke3Byb2R1Y3QucHJvZHVjdE5hbWV9Ojwvc3Ryb25nPjxicj4ke3Byb2R1Y3QucHJvZHVjdE9yaWdpbiB8fCBwcm9kdWN0Lm9yaWdpbn1gO1xuICAgIFxuICAgIGlmIChwcm9kdWN0LnByb2R1Y3RCcmFuZCkge1xuICAgICAgb3JpZ2luSW5mbyArPSBgPGJyPlRoxrDGoW5nIGhp4buHdTogJHtwcm9kdWN0LnByb2R1Y3RCcmFuZH1gO1xuICAgIH1cbiAgICBcbiAgICBpZiAocHJvZHVjdC5wcm9kdWN0TWFudWZhY3R1cmVyKSB7XG4gICAgICBvcmlnaW5JbmZvICs9IGA8YnI+TmjDoCBz4bqjbiB4deG6pXQ6ICR7cHJvZHVjdC5wcm9kdWN0TWFudWZhY3R1cmVyfWA7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIG9yaWdpbkluZm8gPSBgPHN0cm9uZz5YdeG6pXQgeOG7qSAke3Byb2R1Y3QucHJvZHVjdE5hbWV9Ojwvc3Ryb25nPjxicj5UaMO0bmcgdGluIHbhu4EgeHXhuqV0IHjhu6kgc+G6o24gcGjhuqltIMSRxrDhu6NjIGdoaSByw7UgdHLDqm4gYmFvIGLDrC5gO1xuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgbWVzc2FnZTogb3JpZ2luSW5mbyxcbiAgICBpbnRlbnQ6ICdwcm9kdWN0T3JpZ2luJ1xuICB9O1xufTtcblxuLyoqXG4gKiBY4butIGzDvSBjw6J1IGjhu49pIHbhu4EgdGjDoG5oIHBo4bqnbiBz4bqjbiBwaOG6qW1cbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9kdWN0IC0gVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW1cbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpXG4gKi9cbmV4cG9ydCBjb25zdCBoYW5kbGVQcm9kdWN0SW5ncmVkaWVudHNRdWVzdGlvbiA9IChwcm9kdWN0KSA9PiB7XG4gIGlmICghcHJvZHVjdCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdLaMO0bmcgdMOsbSB0aOG6pXkgdGjDtG5nIHRpbiBz4bqjbiBwaOG6qW0nIH07XG4gIFxuICBsZXQgaW5ncmVkaWVudHNJbmZvID0gJyc7XG4gIFxuICBpZiAocHJvZHVjdC5wcm9kdWN0SW5ncmVkaWVudHMgfHwgcHJvZHVjdC5pbmdyZWRpZW50cykge1xuICAgIGluZ3JlZGllbnRzSW5mbyA9IGA8c3Ryb25nPlRow6BuaCBwaOG6p24gY+G7p2EgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfTo8L3N0cm9uZz48YnI+JHtwcm9kdWN0LnByb2R1Y3RJbmdyZWRpZW50cyB8fCBwcm9kdWN0LmluZ3JlZGllbnRzfWA7XG4gIH0gZWxzZSB7XG4gICAgaW5ncmVkaWVudHNJbmZvID0gYDxzdHJvbmc+VGjDoG5oIHBo4bqnbiBj4bunYSAke3Byb2R1Y3QucHJvZHVjdE5hbWV9Ojwvc3Ryb25nPjxicj5UaMO0bmcgdGluIGNoaSB0aeG6v3QgduG7gSB0aMOgbmggcGjhuqduIHPhuqNuIHBo4bqpbSDEkcaw4bujYyBnaGkgcsO1IHRyw6puIGJhbyBiw6wuYDtcbiAgfVxuICBcbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIG1lc3NhZ2U6IGluZ3JlZGllbnRzSW5mbyxcbiAgICBpbnRlbnQ6ICdwcm9kdWN0SW5ncmVkaWVudHMnXG4gIH07XG59O1xuXG4vKipcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBo4bqhbiBz4butIGThu6VuZyBz4bqjbiBwaOG6qW1cbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9kdWN0IC0gVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW1cbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpXG4gKi9cbmV4cG9ydCBjb25zdCBoYW5kbGVQcm9kdWN0RXhwaXJ5UXVlc3Rpb24gPSAocHJvZHVjdCkgPT4ge1xuICBpZiAoIXByb2R1Y3QpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnS2jDtG5nIHTDrG0gdGjhuqV5IHRow7RuZyB0aW4gc+G6o24gcGjhuqltJyB9O1xuICBcbiAgbGV0IGV4cGlyeUluZm8gPSAnJztcbiAgXG4gIGlmIChwcm9kdWN0LmV4cGlyeURhdGUgfHwgcHJvZHVjdC5wcm9kdWN0RXhwaXJ5KSB7XG4gICAgZXhwaXJ5SW5mbyA9IGA8c3Ryb25nPkjhuqFuIHPhu60gZOG7pW5nICR7cHJvZHVjdC5wcm9kdWN0TmFtZX06PC9zdHJvbmc+PGJyPiR7cHJvZHVjdC5leHBpcnlEYXRlIHx8IHByb2R1Y3QucHJvZHVjdEV4cGlyeX1gO1xuICB9IGVsc2Uge1xuICAgIGV4cGlyeUluZm8gPSBgPHN0cm9uZz5I4bqhbiBz4butIGThu6VuZyAke3Byb2R1Y3QucHJvZHVjdE5hbWV9Ojwvc3Ryb25nPjxicj5UaMO0bmcgdGluIHbhu4EgaOG6oW4gc+G7rSBk4bulbmcgxJHGsOG7o2MgaW4gdHLDqm4gYmFvIGLDrCBz4bqjbiBwaOG6qW0uIFxuICAgIFZ1aSBsw7JuZyBraeG7g20gdHJhIGtoaSBuaOG6rW4gaMOgbmcuYDtcbiAgfVxuICBcbiAgaWYgKHByb2R1Y3Quc3RvcmFnZUluZm8gfHwgcHJvZHVjdC5wcm9kdWN0U3RvcmFnZSkge1xuICAgIGV4cGlyeUluZm8gKz0gYDxicj48YnI+PHN0cm9uZz5IxrDhu5tuZyBk4bqrbiBi4bqjbyBxdeG6o246PC9zdHJvbmc+PGJyPiR7cHJvZHVjdC5zdG9yYWdlSW5mbyB8fCBwcm9kdWN0LnByb2R1Y3RTdG9yYWdlfWA7XG4gIH1cbiAgXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBtZXNzYWdlOiBleHBpcnlJbmZvLFxuICAgIGludGVudDogJ3Byb2R1Y3RFeHBpcnknXG4gIH07XG59O1xuXG4vKipcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSDEkcOhbmggZ2nDoSBz4bqjbiBwaOG6qW1cbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9kdWN0IC0gVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW1cbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpXG4gKi9cbmV4cG9ydCBjb25zdCBoYW5kbGVQcm9kdWN0UmV2aWV3c1F1ZXN0aW9uID0gKHByb2R1Y3QpID0+IHtcbiAgaWYgKCFwcm9kdWN0KSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ0tow7RuZyB0w6xtIHRo4bqleSB0aMO0bmcgdGluIHPhuqNuIHBo4bqpbScgfTtcbiAgXG4gIGxldCByZXZpZXdJbmZvID0gJyc7XG4gIFxuICBpZiAocHJvZHVjdC5hdmVyYWdlUmF0aW5nKSB7XG4gICAgcmV2aWV3SW5mbyA9IGA8c3Ryb25nPsSQw6FuaCBnacOhICR7cHJvZHVjdC5wcm9kdWN0TmFtZX06PC9zdHJvbmc+PGJyPlxuICAgIMSQaeG7g20gxJHDoW5oIGdpw6EgdHJ1bmcgYsOsbmg6ICR7cHJvZHVjdC5hdmVyYWdlUmF0aW5nfS81IHNhb2A7XG4gICAgXG4gICAgaWYgKHByb2R1Y3QubnVtT2ZSZXZpZXdzKSB7XG4gICAgICByZXZpZXdJbmZvICs9IGAgKCR7cHJvZHVjdC5udW1PZlJldmlld3N9IGzGsOG7o3QgxJHDoW5oIGdpw6EpYDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV2aWV3SW5mbyA9IGA8c3Ryb25nPsSQw6FuaCBnacOhICR7cHJvZHVjdC5wcm9kdWN0TmFtZX06PC9zdHJvbmc+PGJyPlxuICAgIFPhuqNuIHBo4bqpbSBuw6B5IGNoxrBhIGPDsyDEkcOhbmggZ2nDoS4gJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSBsw6Agc+G6o24gcGjhuqltIGNo4bqldCBsxrDhu6NuZyBjYW8sIFxuICAgIMSRxrDhu6NjIG5oaeG7gXUga2jDoWNoIGjDoG5nIHRpbiBkw7luZyB0cm9uZyB0aOG7nWkgZ2lhbiBxdWEuYDtcbiAgfVxuICBcbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIG1lc3NhZ2U6IHJldmlld0luZm8sXG4gICAgaW50ZW50OiAncHJvZHVjdFJldmlld3MnXG4gIH07XG59O1xuXG4vKipcbiAqIFjhu60gbMO9IGPDonUgaOG7j2kgduG7gSBz4bqjbiBwaOG6qW0gY+G7pSB0aOG7g1xuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBDw6J1IGjhu49pIGPhu6dhIG5nxrDhu51pIGTDuW5nXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvZHVjdCAtIFRow7RuZyB0aW4gc+G6o24gcGjhuqltXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaSBjaG8gY8OidSBo4buPaVxuICovXG5leHBvcnQgY29uc3QgaGFuZGxlUHJvZHVjdFBhZ2VRdWVzdGlvbiA9IGFzeW5jIChtZXNzYWdlLCBwcm9kdWN0KSA9PiB7XG4gIHRyeSB7XG4gICAgaWYgKCFtZXNzYWdlIHx8ICFwcm9kdWN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJUaMO0bmcgdGluIGtow7RuZyDEkeG6p3kgxJHhu6dcIlxuICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgY29uc29sZS5sb2coYMSQYW5nIHjhu60gbMO9IGPDonUgaOG7j2k6IFwiJHttZXNzYWdlfVwiIHbhu4Egc+G6o24gcGjhuqltICR7cHJvZHVjdC5wcm9kdWN0TmFtZX1gKTtcbiAgICBcbiAgICAvLyBQaMOhdCBoaeG7h24gaW50ZW50IHThu6sgbWVzc2FnZVxuICAgIGNvbnN0IHByb2R1Y3RJbnRlbnQgPSBkZXRlY3RQcm9kdWN0UGFnZUludGVudChtZXNzYWdlKTtcbiAgICBjb25zb2xlLmxvZyhcIlPhuqNuIHBo4bqpbSBpbnRlbnQgxJHGsOG7o2MgcGjDoXQgaGnhu4duOlwiLCBwcm9kdWN0SW50ZW50KTtcbiAgICBcbiAgICAvLyBY4butIGzDvSB0aGVvIGludGVudFxuICAgIGlmIChwcm9kdWN0SW50ZW50KSB7XG4gICAgICBzd2l0Y2ggKHByb2R1Y3RJbnRlbnQpIHtcbiAgICAgICAgY2FzZSAncHJvZHVjdFVzYWdlJzpcbiAgICAgICAgICByZXR1cm4gaGFuZGxlUHJvZHVjdFVzYWdlUXVlc3Rpb24ocHJvZHVjdCk7XG4gICAgICAgIGNhc2UgJ3Byb2R1Y3RJbnRybyc6XG4gICAgICAgICAgcmV0dXJuIGhhbmRsZVByb2R1Y3RJbnRyb1F1ZXN0aW9uKHByb2R1Y3QpO1xuICAgICAgICBjYXNlICdwcm9kdWN0UHJpY2UnOlxuICAgICAgICAgIHJldHVybiBoYW5kbGVQcm9kdWN0UHJpY2VRdWVzdGlvbihwcm9kdWN0KTtcbiAgICAgICAgY2FzZSAncmVsYXRlZFByb2R1Y3RzJzpcbiAgICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlUmVsYXRlZFByb2R1Y3RzUXVlc3Rpb24ocHJvZHVjdCk7XG4gICAgICAgIGNhc2UgJ3Byb2R1Y3RPcmlnaW4nOlxuICAgICAgICAgIHJldHVybiBoYW5kbGVQcm9kdWN0T3JpZ2luUXVlc3Rpb24ocHJvZHVjdCk7XG4gICAgICAgIGNhc2UgJ3Byb2R1Y3RJbmdyZWRpZW50cyc6XG4gICAgICAgICAgcmV0dXJuIGhhbmRsZVByb2R1Y3RJbmdyZWRpZW50c1F1ZXN0aW9uKHByb2R1Y3QpO1xuICAgICAgICBjYXNlICdwcm9kdWN0RXhwaXJ5JzpcbiAgICAgICAgICByZXR1cm4gaGFuZGxlUHJvZHVjdEV4cGlyeVF1ZXN0aW9uKHByb2R1Y3QpO1xuICAgICAgICBjYXNlICdwcm9kdWN0UmV2aWV3cyc6XG4gICAgICAgICAgcmV0dXJuIGhhbmRsZVByb2R1Y3RSZXZpZXdzUXVlc3Rpb24ocHJvZHVjdCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IGxvd2VyTWVzc2FnZSA9IG1lc3NhZ2UudG9Mb3dlckNhc2UoKTtcbiAgICBcbiAgICAvLyBY4butIGzDvSBjw6FjIGxv4bqhaSBjw6J1IGjhu49pIGtow6FjIG5oYXVcbiAgICBcbiAgICAvLyBDw6J1IGjhu49pIHbhu4EgY8O0bmcgZOG7pW5nXG4gICAgaWYgKGNvbnRhaW5zQW55KGxvd2VyTWVzc2FnZSwgWydjw7RuZyBk4bulbmcnLCAndMOhYyBk4bulbmcnLCAnxJHhu4MgbMOgbSBnw6wnLCAnZMO5bmcgxJHhu4MnLCAnZMO5bmcgbmjGsCB0aOG6vyBuw6BvJywgJ3Phu60gZOG7pW5nJywgJ2PDoWNoIGTDuW5nJ10pKSB7XG4gICAgICByZXR1cm4gZ2VuZXJhdGVVc2FnZVJlc3BvbnNlKHByb2R1Y3QpO1xuICAgIH1cbiAgICBcbiAgICAvLyBDw6J1IGjhu49pIHbhu4EgZ2nhu5tpIHRoaeG7h3Ugc+G6o24gcGjhuqltXG4gICAgaWYgKGNvbnRhaW5zQW55KGxvd2VyTWVzc2FnZSwgWydnaeG7m2kgdGhp4buHdScsICduw7NpIHbhu4EnLCAndGjDtG5nIHRpbiB24buBJywgJ23DtCB04bqjJywgJ3PhuqNuIHBo4bqpbSBuw6B5JywgJ3Ro4bq/IG7DoG8nXSkpIHtcbiAgICAgIHJldHVybiBnZW5lcmF0ZUludHJvZHVjdGlvblJlc3BvbnNlKHByb2R1Y3QpO1xuICAgIH1cbiAgICBcbiAgICAvLyBDw6J1IGjhu49pIHbhu4EgZ2nDoSBj4bqjXG4gICAgaWYgKGNvbnRhaW5zQW55KGxvd2VyTWVzc2FnZSwgWydnacOhIGJhbyBuaGnDqnUnLCAnYmFvIG5oacOqdSB0aeG7gW4nLCAnZ2nDoSBj4bqjJywgJ2dpw6EgdGnhu4FuJywgJ2dpw6EnXSkpIHtcbiAgICAgIHJldHVybiBnZW5lcmF0ZVByaWNlUmVzcG9uc2UocHJvZHVjdCk7XG4gICAgfVxuICAgIFxuICAgIC8vIEPDonUgaOG7j2kgduG7gSB4deG6pXQgeOG7qSwgdGjDoG5oIHBo4bqnblxuICAgIGlmIChjb250YWluc0FueShsb3dlck1lc3NhZ2UsIFsneHXhuqV0IHjhu6knLCAnc+G6o24geHXhuqV0JywgJ3Row6BuaCBwaOG6p24nLCAnbmd1ecOqbiBsaeG7h3UnLCAnY8OzIGNo4bupYScsICdi4bqjbyBxdeG6o24nXSkpIHtcbiAgICAgIHJldHVybiBnZW5lcmF0ZU9yaWdpblJlc3BvbnNlKHByb2R1Y3QpO1xuICAgIH1cbiAgICBcbiAgICAvLyBDw6J1IGjhu49pIHbhu4EgxJHDoW5oIGdpw6Egc+G6o24gcGjhuqltXG4gICAgaWYgKGNvbnRhaW5zQW55KGxvd2VyTWVzc2FnZSwgWydyZXZpZXcnLCAnxJHDoW5oIGdpw6EnLCAnbmjhuq1uIHjDqXQnLCAncGjhuqNuIGjhu5NpJywgJ8O9IGtp4bq/bicsICd04buRdCBraMO0bmcnLCAnY8OzIHThu5F0JywgJ2PDsyBuZ29uJ10pKSB7XG4gICAgICByZXR1cm4gZ2VuZXJhdGVSZXZpZXdSZXNwb25zZShwcm9kdWN0KTtcbiAgICB9XG4gICAgXG4gICAgLy8gQ8OidSBo4buPaSB24buBIHTGsMahbmcgdOG7sSBz4bqjbiBwaOG6qW1cbiAgICBpZiAoY29udGFpbnNBbnkobG93ZXJNZXNzYWdlLCBbJ3PhuqNuIHBo4bqpbSB0xrDGoW5nIHThu7EnLCAndMawxqFuZyB04buxJywgJ2dp4buRbmcnLCAnc+G6o24gcGjhuqltIGtow6FjJywgJ3RoYXkgdGjhur8nLCAnc+G6o24gcGjhuqltIGxpw6puIHF1YW4nLCAnbGnDqm4gcXVhbiddKSkge1xuICAgICAgcmV0dXJuIGF3YWl0IGdlbmVyYXRlU2ltaWxhclByb2R1Y3RzUmVzcG9uc2UocHJvZHVjdCk7XG4gICAgfVxuICAgIFxuICAgIC8vIEPDonUgaOG7j2kga2jDoWMgduG7gSBz4bqjbiBwaOG6qW1cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgIG1lc3NhZ2U6IGBT4bqjbiBwaOG6qW0gJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSB0aHXhu5ljIGRhbmggbeG7pWMgJHtwcm9kdWN0LnByb2R1Y3RDYXRlZ29yeSB8fCBwcm9kdWN0LmNhdGVnb3J5fSB24bubaSBnacOhICR7Zm9ybWF0Q3VycmVuY3kocHJvZHVjdC5wcm9kdWN0UHJpY2UgfHwgcHJvZHVjdC5wcmljZSB8fCAwKX0uIELhuqFuIG114buRbiBiaeG6v3QgdGjDqm0gdGjDtG5nIHRpbiBnw6wgduG7gSBz4bqjbiBwaOG6qW0gbsOgeT9gXG4gICAgfTtcbiAgICBcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIHjhu60gbMO9IGPDonUgaOG7j2kgc+G6o24gcGjhuqltOlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSB44butIGzDvSBjw6J1IGjhu49pLiBWdWkgbMOybmcgdGjhu60gbOG6oWkgc2F1LlwiXG4gICAgfTtcbiAgfVxufTtcblxuLyoqXG4gKiBLaeG7g20gdHJhIHhlbSBjaHXhu5dpIGPDsyBjaOG7qWEgbeG7mXQgdHJvbmcgY8OhYyB04burIGtow7NhIGtow7RuZ1xuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBDaHXhu5dpIGPhuqduIGtp4buDbSB0cmFcbiAqIEBwYXJhbSB7QXJyYXl9IGtleXdvcmRzIC0gTeG6o25nIGPDoWMgdOG7qyBraMOzYVxuICogQHJldHVybnMge2Jvb2xlYW59IC0gQ8OzIGNo4bupYSB04burIGtow7NhIGhheSBraMO0bmdcbiAqL1xuY29uc3QgY29udGFpbnNBbnkgPSAodGV4dCwga2V5d29yZHMpID0+IHtcbiAgcmV0dXJuIGtleXdvcmRzLnNvbWUoa2V5d29yZCA9PiB0ZXh0LmluY2x1ZGVzKGtleXdvcmQpKTtcbn07XG5cbi8qKlxuICogVOG6oW8gcGjhuqNuIGjhu5NpIHbhu4EgY8O0bmcgZOG7pW5nIHPhuqNuIHBo4bqpbVxuICogQHBhcmFtIHtvYmplY3R9IHByb2R1Y3QgLSBUaMO0bmcgdGluIHPhuqNuIHBo4bqpbVxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2lcbiAqL1xuY29uc3QgZ2VuZXJhdGVVc2FnZVJlc3BvbnNlID0gKHByb2R1Y3QpID0+IHtcbiAgbGV0IG1lc3NhZ2UgPSAnJztcbiAgXG4gIGlmIChwcm9kdWN0LnByb2R1Y3REZXRhaWxzICYmIHByb2R1Y3QucHJvZHVjdERldGFpbHMubGVuZ3RoID4gMCkge1xuICAgIG1lc3NhZ2UgPSBgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSAke3Byb2R1Y3QucHJvZHVjdERldGFpbHN9YDtcbiAgfSBlbHNlIGlmIChwcm9kdWN0LmRlc2NyaXB0aW9uICYmIHByb2R1Y3QuZGVzY3JpcHRpb24ubGVuZ3RoID4gMCkge1xuICAgIG1lc3NhZ2UgPSBgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSBkw7luZyDEkeG7gyAke3Byb2R1Y3QuZGVzY3JpcHRpb259YDtcbiAgfSBlbHNlIHtcbiAgICBtZXNzYWdlID0gYCR7cHJvZHVjdC5wcm9kdWN0TmFtZX0gbMOgIHPhuqNuIHBo4bqpbSAke3Byb2R1Y3QucHJvZHVjdENhdGVnb3J5IHx8IHByb2R1Y3QuY2F0ZWdvcnl9LiBC4bqhbiBjw7MgdGjhu4Mgc+G7rSBk4bulbmcgc+G6o24gcGjhuqltIHRoZW8gaMaw4bubbmcgZOG6q24gdHLDqm4gYmFvIGLDrC5gO1xuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgdHlwZTogJ3RleHQnLFxuICAgIG1lc3NhZ2VcbiAgfTtcbn07XG5cbi8qKlxuICogVOG6oW8gcGjhuqNuIGjhu5NpIHbhu4EgZ2nDoSBz4bqjbiBwaOG6qW1cbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9kdWN0IC0gVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW1cbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpXG4gKi9cbmNvbnN0IGdlbmVyYXRlUHJpY2VSZXNwb25zZSA9IChwcm9kdWN0KSA9PiB7XG4gIC8vIEzhuqV5IGdpw6EgZ+G7kWMgdsOgIGdpw6Ega2h1eeG6v24gbcOjaSBu4bq/dSBjw7NcbiAgY29uc3Qgb3JpZ2luYWxQcmljZSA9IHByb2R1Y3QucHJvZHVjdFByaWNlIHx8IHByb2R1Y3QucHJpY2UgfHwgMDtcbiAgY29uc3QgZGlzY291bnQgPSBwcm9kdWN0LnByb2R1Y3REaXNjb3VudCB8fCAwO1xuICBjb25zdCBwcm9tb1ByaWNlID0gcHJvZHVjdC5wcm9kdWN0UHJvbW9QcmljZSB8fCAoZGlzY291bnQgPiAwID8gTWF0aC5yb3VuZChvcmlnaW5hbFByaWNlICogKDEgLSBkaXNjb3VudC8xMDApKSA6IG9yaWdpbmFsUHJpY2UpO1xuICBcbiAgbGV0IG1lc3NhZ2UgPSAnJztcbiAgaWYgKGRpc2NvdW50ID4gMCkge1xuICAgIG1lc3NhZ2UgPSBgR2nDoSBj4bunYSAke3Byb2R1Y3QucHJvZHVjdE5hbWV9IGzDoCAke2Zvcm1hdEN1cnJlbmN5KHByb21vUHJpY2UpfcSRICjEkMOjIGdp4bqjbSAke2Rpc2NvdW50fSUgdOG7qyAke2Zvcm1hdEN1cnJlbmN5KG9yaWdpbmFsUHJpY2UpfcSRKS5gO1xuICB9IGVsc2Uge1xuICAgIG1lc3NhZ2UgPSBgR2nDoSBj4bunYSAke3Byb2R1Y3QucHJvZHVjdE5hbWV9IGzDoCAke2Zvcm1hdEN1cnJlbmN5KG9yaWdpbmFsUHJpY2UpfcSRLmA7XG4gIH1cbiAgXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICB0eXBlOiAndGV4dCcsXG4gICAgbWVzc2FnZVxuICB9O1xufTtcblxuLyoqXG4gKiBU4bqhbyBwaOG6o24gaOG7k2kgduG7gSB4deG6pXQgeOG7qSBz4bqjbiBwaOG6qW1cbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9kdWN0IC0gVGjDtG5nIHRpbiBz4bqjbiBwaOG6qW1cbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gUGjhuqNuIGjhu5NpXG4gKi9cbmNvbnN0IGdlbmVyYXRlT3JpZ2luUmVzcG9uc2UgPSAocHJvZHVjdCkgPT4ge1xuICBsZXQgbWVzc2FnZSA9ICcnO1xuICBcbiAgaWYgKHByb2R1Y3QucHJvZHVjdE9yaWdpbiB8fCBwcm9kdWN0Lm9yaWdpbikge1xuICAgIG1lc3NhZ2UgPSBgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSBjw7MgeHXhuqV0IHjhu6kgdOG7qyAke3Byb2R1Y3QucHJvZHVjdE9yaWdpbiB8fCBwcm9kdWN0Lm9yaWdpbn0uYDtcbiAgICBcbiAgICAvLyBUaMOqbSB0aMO0bmcgdGluIHRoxrDGoW5nIGhp4buHdSBu4bq/dSBjw7NcbiAgICBpZiAocHJvZHVjdC5wcm9kdWN0QnJhbmQpIHtcbiAgICAgIG1lc3NhZ2UgKz0gYCBT4bqjbiBwaOG6qW0gdGh14buZYyB0aMawxqFuZyBoaeG7h3UgJHtwcm9kdWN0LnByb2R1Y3RCcmFuZH0uYDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbWVzc2FnZSA9IGBUaMO0bmcgdGluIGNoaSB0aeG6v3QgduG7gSB4deG6pXQgeOG7qSB2w6AgdGjDoG5oIHBo4bqnbiBj4bunYSAke3Byb2R1Y3QucHJvZHVjdE5hbWV9IMSRxrDhu6NjIGdoaSByw7UgdHLDqm4gYmFvIGLDrCBz4bqjbiBwaOG6qW0uYDtcbiAgfVxuICBcbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIHR5cGU6ICd0ZXh0JyxcbiAgICBtZXNzYWdlXG4gIH07XG59O1xuXG4vKipcbiAqIFThuqFvIHBo4bqjbiBo4buTaSB24buBIMSRw6FuaCBnacOhIHPhuqNuIHBo4bqpbVxuICogQHBhcmFtIHtvYmplY3R9IHByb2R1Y3QgLSBUaMO0bmcgdGluIHPhuqNuIHBo4bqpbVxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2lcbiAqL1xuY29uc3QgZ2VuZXJhdGVSZXZpZXdSZXNwb25zZSA9IChwcm9kdWN0KSA9PiB7XG4gIC8vIE7hur91IGPDsyDEkcOhbmggZ2nDoSB0aOG7sWMgdOG6vyB04burIGRhdGFiYXNlLCBjw7MgdGjhu4Mgc+G7rSBk4bulbmcgdGjDtG5nIHRpbiDEkcOzXG4gIGxldCBtZXNzYWdlID0gJyc7XG4gIFxuICBpZiAocHJvZHVjdC5hdmVyYWdlUmF0aW5nICYmIHByb2R1Y3QuYXZlcmFnZVJhdGluZyA+IDApIHtcbiAgICBtZXNzYWdlID0gYCR7cHJvZHVjdC5wcm9kdWN0TmFtZX0gY8OzIMSRaeG7g20gxJHDoW5oIGdpw6EgdHJ1bmcgYsOsbmggbMOgICR7cHJvZHVjdC5hdmVyYWdlUmF0aW5nfS81IHNhbyB04burICR7cHJvZHVjdC5udW1PZlJldmlld3MgfHwgMH0gbMaw4bujdCDEkcOhbmggZ2nDoS5gO1xuICB9IGVsc2Uge1xuICAgIG1lc3NhZ2UgPSBgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSBsw6AgbeG7mXQgc+G6o24gcGjhuqltIGNo4bqldCBsxrDhu6NuZyBjYW8gdGh14buZYyBkYW5oIG3hu6VjICR7cHJvZHVjdC5wcm9kdWN0Q2F0ZWdvcnkgfHwgcHJvZHVjdC5jYXRlZ29yeX0uIGA7XG4gICAgXG4gICAgaWYgKHByb2R1Y3QucHJvZHVjdEludHJvZHVjdGlvbikge1xuICAgICAgbWVzc2FnZSArPSBwcm9kdWN0LnByb2R1Y3RJbnRyb2R1Y3Rpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIG1lc3NhZ2UgKz0gYEtow6FjaCBow6BuZyDEkcOhbmggZ2nDoSBy4bqldCB04buRdCB24buBIHPhuqNuIHBo4bqpbSBuw6B5LmA7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgdHlwZTogJ3RleHQnLFxuICAgIG1lc3NhZ2VcbiAgfTtcbn07XG5cbi8qKlxuICogVOG6oW8gcGjhuqNuIGjhu5NpIHbhu4Egc+G6o24gcGjhuqltIHTGsMahbmcgdOG7sVxuICogQHBhcmFtIHtvYmplY3R9IHByb2R1Y3QgLSBUaMO0bmcgdGluIHPhuqNuIHBo4bqpbVxuICogQHJldHVybnMge29iamVjdH0gLSBQaOG6o24gaOG7k2lcbiAqL1xuY29uc3QgZ2VuZXJhdGVTaW1pbGFyUHJvZHVjdHNSZXNwb25zZSA9IGFzeW5jIChwcm9kdWN0KSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coXCJUw6xtIHPhuqNuIHBo4bqpbSB0xrDGoW5nIHThu7EgY2hvOlwiLCBwcm9kdWN0LnByb2R1Y3ROYW1lKTtcbiAgICBcbiAgICBjb25zdCBjYXRlZ29yeSA9IHByb2R1Y3QucHJvZHVjdENhdGVnb3J5IHx8IHByb2R1Y3QuY2F0ZWdvcnk7XG4gICAgXG4gICAgaWYgKCFjYXRlZ29yeSkge1xuICAgICAgY29uc29sZS5lcnJvcihcIktow7RuZyB0w6xtIHRo4bqleSBkYW5oIG3hu6VjIGNobyBz4bqjbiBwaOG6qW06XCIsIHByb2R1Y3QucHJvZHVjdE5hbWUpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICBtZXNzYWdlOiBgSGnhu4duIHThuqFpIGNow7puZyB0w7RpIGtow7RuZyB0w6xtIHRo4bqleSBz4bqjbiBwaOG6qW0gdMawxqFuZyB04buxIHbhu5tpICR7cHJvZHVjdC5wcm9kdWN0TmFtZX0uYFxuICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgY29uc29sZS5sb2coXCJUw6xtIHPhuqNuIHBo4bqpbSB0xrDGoW5nIHThu7EgdGh14buZYyBkYW5oIG3hu6VjOlwiLCBjYXRlZ29yeSk7XG4gICAgXG4gICAgLy8gVMOsbSBjw6FjIHPhuqNuIHBo4bqpbSBjw7luZyBkYW5oIG3hu6VjXG4gICAgY29uc3Qgc2ltaWxhclByb2R1Y3RzID0gYXdhaXQgUHJvZHVjdC5maW5kKHtcbiAgICAgICRvcjogW1xuICAgICAgICB7IHByb2R1Y3RDYXRlZ29yeTogY2F0ZWdvcnkgfSxcbiAgICAgICAgeyBjYXRlZ29yeTogY2F0ZWdvcnkgfVxuICAgICAgXSxcbiAgICAgIF9pZDogeyAkbmU6IHByb2R1Y3QuX2lkIH1cbiAgICB9KS5saW1pdCg1KTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgVMOsbSB0aOG6pXkgJHtzaW1pbGFyUHJvZHVjdHMubGVuZ3RofSBz4bqjbiBwaOG6qW0gdMawxqFuZyB04buxIHRodeG7mWMgZGFuaCBt4bulYyAke2NhdGVnb3J5fWApO1xuICAgIFxuICAgIGlmIChzaW1pbGFyUHJvZHVjdHMgJiYgc2ltaWxhclByb2R1Y3RzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHR5cGU6ICdjYXRlZ29yeVF1ZXJ5JyxcbiAgICAgICAgbWVzc2FnZTogYMSQw6J5IGzDoCBt4buZdCBz4buRIHPhuqNuIHBo4bqpbSB0xrDGoW5nIHThu7EgduG7m2kgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfTpgLFxuICAgICAgICBkYXRhOiBzaW1pbGFyUHJvZHVjdHNcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgbWVzc2FnZTogYEhp4buHbiB04bqhaSBjaMO6bmcgdMO0aSBraMO0bmcgY8OzIHPhuqNuIHBo4bqpbSB0xrDGoW5nIHThu7EgduG7m2kgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfSB0aHXhu5ljIGRhbmggbeG7pWMgJHtjYXRlZ29yeX0uYFxuICAgICAgfTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB0w6xtIHPhuqNuIHBo4bqpbSB0xrDGoW5nIHThu7E6XCIsIGVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgIG1lc3NhZ2U6IGBLaMO0bmcgdGjhu4MgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltIHTGsMahbmcgdOG7sSB24bubaSAke3Byb2R1Y3QucHJvZHVjdE5hbWV9LiBYaW4gbOG7l2kgdsOsIHPhu7EgYuG6pXQgdGnhu4duIG7DoHkuYFxuICAgIH07XG4gIH1cbn07XG5cbi8qKlxuICogVOG6oW8gcGjhuqNuIGjhu5NpIHbhu4EgZ2nhu5tpIHRoaeG7h3Ugc+G6o24gcGjhuqltXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvZHVjdCAtIFRow7RuZyB0aW4gc+G6o24gcGjhuqltXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIFBo4bqjbiBo4buTaVxuICovXG5jb25zdCBnZW5lcmF0ZUludHJvZHVjdGlvblJlc3BvbnNlID0gKHByb2R1Y3QpID0+IHtcbiAgbGV0IG1lc3NhZ2UgPSAnJztcbiAgXG4gIGlmIChwcm9kdWN0LnByb2R1Y3RJbnRyb2R1Y3Rpb24gJiYgcHJvZHVjdC5wcm9kdWN0SW50cm9kdWN0aW9uLmxlbmd0aCA+IDApIHtcbiAgICBtZXNzYWdlID0gYEdp4bubaSB0aGnhu4d1IHbhu4EgJHtwcm9kdWN0LnByb2R1Y3ROYW1lfTogJHtwcm9kdWN0LnByb2R1Y3RJbnRyb2R1Y3Rpb259YDtcbiAgfSBlbHNlIGlmIChwcm9kdWN0LnByb2R1Y3RJbmZvICYmIHByb2R1Y3QucHJvZHVjdEluZm8ubGVuZ3RoID4gMCkge1xuICAgIG1lc3NhZ2UgPSBgR2nhu5tpIHRoaeG7h3UgduG7gSAke3Byb2R1Y3QucHJvZHVjdE5hbWV9OiAke3Byb2R1Y3QucHJvZHVjdEluZm99YDtcbiAgfSBlbHNlIHtcbiAgICBtZXNzYWdlID0gYCR7cHJvZHVjdC5wcm9kdWN0TmFtZX0gbMOgIHPhuqNuIHBo4bqpbSAke3Byb2R1Y3QucHJvZHVjdENhdGVnb3J5IHx8IHByb2R1Y3QuY2F0ZWdvcnl9LiBIaeG7h24gY2jGsGEgY8OzIHRow7RuZyB0aW4gZ2nhu5tpIHRoaeG7h3UgY2hpIHRp4bq/dCB24buBIHPhuqNuIHBo4bqpbSBuw6B5LmA7XG4gIH1cbiAgXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICB0eXBlOiAndGV4dCcsXG4gICAgbWVzc2FnZVxuICB9O1xufTsgIl0sIm1hcHBpbmdzIjoiOzs7OztBQUtBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQSwwQkFBMkMsQ0FMM0M7QUFDQTtB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