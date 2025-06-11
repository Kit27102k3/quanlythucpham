/**
 * Xử lý câu hỏi về sản phẩm cụ thể
 * File này chứa các hàm để trả lời câu hỏi về sản phẩm
 */

import Product from "../../Model/Products.js";
import { getContext, saveContext } from "./chatbotController.js";
import { handleIntentWithProductCategory, handleIntentWithProductType, handleIntentWithProductBrand, handleIntentWithProductOrigin, handleIntentWithPriceRange } from "./ProductIntentHandlers.js";

/**
 * Định dạng số tiền sang VND
 * @param {number} amount - Số tiền
 * @returns {string} - Chuỗi tiền đã định dạng
 */
const formatCurrency = (amount) => {
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
export const detectProductPageIntent = (message) => {
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
 */
export const handleProductUsageQuestion = (product) => {
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
 */
export const handleProductIntroQuestion = (product) => {
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
 */
export const handleProductPriceQuestion = (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };
  
  const originalPrice = product.productPrice;
  const discount = product.productDiscount || 0;
  const promoPrice = product.productPromoPrice || (discount > 0 ? Math.round(originalPrice * (1 - discount/100)) : originalPrice);
  
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
 */
export const handleRelatedProductsQuestion = async (product) => {
  if (!product) return { success: false, message: 'Không tìm thấy thông tin sản phẩm' };
  
  try {
    // Tìm các sản phẩm cùng danh mục
    const relatedProducts = await Product.find({
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
    const formattedProducts = relatedProducts.map(p => ({
      id: p._id,
      name: p.productName,
      price: p.productPrice,
      discount: p.productDiscount || 0,
      promotionalPrice: p.productPromoPrice || (p.productDiscount ? Math.round(p.productPrice * (1 - p.productDiscount/100)) : p.productPrice),
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
 */
export const handleProductOriginQuestion = (product) => {
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
 */
export const handleProductIngredientsQuestion = (product) => {
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
 */
export const handleProductExpiryQuestion = (product) => {
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
 */
export const handleProductReviewsQuestion = (product) => {
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
 */
export const handleProductPageQuestion = async (message, product) => {
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
 */
const containsAny = (text, keywords) => {
  return keywords.some(keyword => text.includes(keyword));
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
  const promoPrice = product.productPromoPrice || (discount > 0 ? Math.round(originalPrice * (1 - discount/100)) : originalPrice);
  
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
    const similarProducts = await Product.find({
      $or: [
        { productCategory: category },
        { category: category }
      ],
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