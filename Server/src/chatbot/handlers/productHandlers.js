const Product = require('../../models/Product');
const { connectToDatabase } = require('../../config/db');
const { ObjectId } = require('mongodb');
const productHelper = require('../../util/productHelper');

// Xử lý yêu cầu về thông tin sản phẩm
const handleProductInfo = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);
    
    if (!product) {
      return 'Không tìm thấy thông tin sản phẩm này.';
    }
    
    return `${product.productName} - ${product.productInfo || 'Không có thông tin chi tiết.'}\n\nGiá: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.productPrice)}${product.productDiscount ? ` (giảm ${product.productDiscount}%)` : ''}`;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin sản phẩm:', error);
    return 'Đã xảy ra lỗi khi lấy thông tin sản phẩm.';
  }
};

// Xử lý yêu cầu về giá sản phẩm
const handleProductPrice = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);
    
    if (!product) {
      return 'Không tìm thấy thông tin sản phẩm này.';
    }
    
    let priceMessage = `Giá của sản phẩm "${product.productName}" là ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.productPrice)}`;
    
    if (product.productDiscount && product.productDiscount > 0) {
      const discountedPrice = product.productPrice * (1 - product.productDiscount / 100);
      priceMessage += ` (Đã giảm ${product.productDiscount}%, giá gốc: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.productPrice)})`;
    }
    
    return priceMessage;
  } catch (error) {
    console.error('Lỗi khi lấy giá sản phẩm:', error);
    return 'Đã xảy ra lỗi khi lấy thông tin giá sản phẩm.';
  }
};

// Xử lý yêu cầu về xuất xứ sản phẩm
const handleProductOrigin = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);
    
    if (!product) {
      return 'Không tìm thấy thông tin sản phẩm này.';
    }
    
    if (product.origin) {
      return `Xuất xứ của sản phẩm "${product.productName}" là: ${product.origin}`;
    } else {
      // Sử dụng helper để sinh thông tin xuất xứ
      return productHelper.generateOrigin(product);
    }
  } catch (error) {
    console.error('Lỗi khi lấy xuất xứ sản phẩm:', error);
    return 'Đã xảy ra lỗi khi lấy thông tin xuất xứ sản phẩm.';
  }
};

// Xử lý yêu cầu về công dụng sản phẩm
const handleProductUsage = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);
    
    if (!product) {
      return 'Không tìm thấy thông tin sản phẩm này.';
    }
    
    // Sử dụng helper để sinh công dụng sản phẩm
    return productHelper.generateProductUsage(product);
  } catch (error) {
    console.error('Lỗi khi lấy công dụng sản phẩm:', error);
    return 'Đã xảy ra lỗi khi lấy thông tin công dụng sản phẩm.';
  }
};

// Xử lý yêu cầu về cách sử dụng sản phẩm
const handleHowToUse = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);
    
    if (!product) {
      return 'Không tìm thấy thông tin sản phẩm này.';
    }
    
    // Sử dụng helper để sinh cách sử dụng sản phẩm
    return productHelper.generateHowToUse(product);
  } catch (error) {
    console.error('Lỗi khi lấy cách sử dụng sản phẩm:', error);
    return 'Đã xảy ra lỗi khi lấy thông tin cách sử dụng sản phẩm.';
  }
};

// Xử lý yêu cầu về thành phần sản phẩm
const handleIngredients = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);
    
    if (!product) {
      return 'Không tìm thấy thông tin sản phẩm này.';
    }
    
    // Sử dụng helper để sinh thông tin thành phần
    return productHelper.generateIngredients(product);
  } catch (error) {
    console.error('Lỗi khi lấy thành phần sản phẩm:', error);
    return 'Đã xảy ra lỗi khi lấy thông tin thành phần sản phẩm.';
  }
};

// Xử lý yêu cầu về các sản phẩm liên quan
const handleRelatedProducts = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);
    
    if (!product) {
      return 'Không tìm thấy thông tin sản phẩm này.';
    }
    
    // Tìm các sản phẩm cùng danh mục
    const relatedProducts = await Product.find({
      productCategory: product.productCategory,
      _id: { $ne: productId }
    }).limit(5);
    
    if (relatedProducts.length === 0) {
      return `Hiện không có sản phẩm nào tương tự với "${product.productName}".`;
    }
    
    // Thay đổi trả về đối tượng có chứa danh sách sản phẩm thay vì chuỗi text
    return {
      type: 'relatedProducts',
      text: `Các sản phẩm tương tự với "${product.productName}":`,
      products: relatedProducts
    };
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm liên quan:', error);
    return 'Đã xảy ra lỗi khi lấy thông tin sản phẩm liên quan.';
  }
};

// Xử lý yêu cầu về các sản phẩm đắt nhất
const handleMostExpensiveProduct = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);
    
    if (!product) {
      return 'Không tìm thấy thông tin sản phẩm này.';
    }
    
    // Tìm các sản phẩm đắt nhất trong cùng danh mục
    const mostExpensiveProducts = await Product.find({
      productCategory: product.productCategory
    }).sort({ productPrice: -1 }).limit(5);
    
    if (mostExpensiveProducts.length === 0) {
      return `Không tìm thấy sản phẩm nào trong danh mục của "${product.productName}".`;
    }
    
    let response = `Các sản phẩm cao cấp nhất trong danh mục của "${product.productName}":\n\n`;
    
    mostExpensiveProducts.forEach((item, index) => {
      response += `${index + 1}. ${item.productName} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.productPrice)}\n`;
    });
    
    return response;
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm đắt nhất:', error);
    return 'Đã xảy ra lỗi khi lấy thông tin sản phẩm đắt nhất.';
  }
};

// Xử lý yêu cầu về các sản phẩm rẻ nhất
const handleCheapestProduct = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);
    
    if (!product) {
      return 'Không tìm thấy thông tin sản phẩm này.';
    }
    
    // Tìm các sản phẩm rẻ nhất trong cùng danh mục
    const cheapestProducts = await Product.find({
      productCategory: product.productCategory,
      productPrice: { $gt: 0 } // Đảm bảo giá lớn hơn 0
    }).sort({ productPrice: 1 }).limit(5);
    
    if (cheapestProducts.length === 0) {
      return `Không tìm thấy sản phẩm nào trong danh mục của "${product.productName}".`;
    }
    
    let response = `Các sản phẩm giá rẻ nhất trong danh mục của "${product.productName}":\n\n`;
    
    cheapestProducts.forEach((item, index) => {
      response += `${index + 1}. ${item.productName} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.productPrice)}\n`;
    });
    
    return response;
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm rẻ nhất:', error);
    return 'Đã xảy ra lỗi khi lấy thông tin sản phẩm rẻ nhất.';
  }
};

module.exports = {
  handleProductInfo,
  handleProductPrice,
  handleProductOrigin,
  handleProductUsage,
  handleHowToUse,
  handleIngredients,
  handleRelatedProducts,
  handleMostExpensiveProduct,
  handleCheapestProduct
}; 