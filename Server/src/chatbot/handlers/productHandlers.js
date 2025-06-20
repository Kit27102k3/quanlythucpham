import Product from "../../../Model/Products.js";
import { connectToDatabase } from "../../../config/db.js";
import productHelper from "../../../util/productHelper.js";

const handleProductInfo = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);

    if (!product) {
      return "Không tìm thấy thông tin sản phẩm này.";
    }

    return `${product.productName} - ${
      product.productInfo || "Không có thông tin chi tiết."
    }\n\nGiá: ${new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(product.productPrice)}${
      product.productDiscount ? ` (giảm ${product.productDiscount}%)` : ""
    }`;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin sản phẩm:", error);
    return "Đã xảy ra lỗi khi lấy thông tin sản phẩm.";
  }
};

const handleProductPrice = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);

    if (!product) {
      return "Không tìm thấy thông tin sản phẩm này.";
    }

    let priceMessage = `Giá của sản phẩm "${
      product.productName
    }" là ${new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(product.productPrice)}`;

    if (product.productDiscount && product.productDiscount > 0) {
      priceMessage += ` (Đã giảm ${
        product.productDiscount
      }%, giá gốc: ${new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(product.productPrice)})`;
    }

    return priceMessage;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin giá sản phẩm:", error);
    return "Đã xảy ra lỗi khi lấy thông tin giá sản phẩm.";
  }
};

const handleProductOrigin = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);

    if (!product) {
      return "Không tìm thấy thông tin sản phẩm này.";
    }

    if (product.origin) {
      return `Xuất xứ của sản phẩm "${product.productName}" là: ${product.origin}`;
    } else {
      return productHelper.generateOrigin(product);
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin xuất xứ sản phẩm:", error);
    return "Đã xảy ra lỗi khi lấy thông tin xuất xứ sản phẩm.";
  }
};

const handleProductUsage = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);

    if (!product) {
      return "Không tìm thấy thông tin sản phẩm này.";
    }

    return productHelper.generateProductUsage(product);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin công dụng sản phẩm:", error);
    return "Đã xảy ra lỗi khi lấy thông tin công dụng sản phẩm.";
  }
};

const handleHowToUse = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);

    if (!product) {
      return "Không tìm thấy thông tin sản phẩm này.";
    }

    return productHelper.generateHowToUse(product);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin cách sử dụng sản phẩm:", error);
    return "Đã xảy ra lỗi khi lấy thông tin cách sử dụng sản phẩm.";
  }
};

const handleIngredients = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);

    if (!product) {
      return "Không tìm thấy thông tin sản phẩm này.";
    }

    return productHelper.generateIngredients(product);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin thành phần sản phẩm:", error);
    return "Đã xảy ra lỗi khi lấy thông tin thành phần sản phẩm.";
  }
};

const handleRelatedProducts = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);

    if (!product) {
      return "Không tìm thấy thông tin sản phẩm này.";
    }

    const relatedProducts = await Product.find({
      productCategory: product.productCategory,
      _id: { $ne: productId },
    }).limit(5);

    if (relatedProducts.length === 0) {
      return `Hiện không có sản phẩm nào tương tự với "${product.productName}".`;
    }

    return {
      type: "relatedProducts",
      text: `Các sản phẩm tương tự với "${product.productName}":`,
      products: relatedProducts,
    };
  } catch (error) {
    console.error("Lỗi khi lấy thông tin sản phẩm liên quan:", error);
    return "Đã xảy ra lỗi khi lấy thông tin sản phẩm liên quan.";
  }
};

const handleMostExpensiveProduct = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);

    if (!product) {
      return "Không tìm thấy thông tin sản phẩm này.";
    }

    const mostExpensiveProducts = await Product.find({
      productCategory: product.productCategory,
    })
      .sort({ productPrice: -1 })
      .limit(5);

    if (mostExpensiveProducts.length === 0) {
      return `Không tìm thấy sản phẩm nào trong danh mục của "${product.productName}".`;
    }

    let response = `Các sản phẩm cao cấp nhất trong danh mục của "${product.productName}":\n\n`;

    mostExpensiveProducts.forEach((item, index) => {
      response += `${index + 1}. ${item.productName} - ${new Intl.NumberFormat(
        "vi-VN",
        { style: "currency", currency: "VND" }
      ).format(item.productPrice)}\n`;
    });

    return response;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin sản phẩm đắt nhất:", error);
    return "Đã xảy ra lỗi khi lấy thông tin sản phẩm đắt nhất.";
  }
};

const handleCheapestProduct = async (productId) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(productId);

    if (!product) {
      return "Không tìm thấy thông tin sản phẩm này.";
    }

    const cheapestProducts = await Product.find({
      productCategory: product.productCategory,
      productPrice: { $gt: 0 },
    })
      .sort({ productPrice: 1 })
      .limit(5);

    if (cheapestProducts.length === 0) {
      return `Không tìm thấy sản phẩm nào trong danh mục của "${product.productName}".`;
    }

    let response = `Các sản phẩm giá rẻ nhất trong danh mục của "${product.productName}":\n\n`;

    cheapestProducts.forEach((item, index) => {
      response += `${index + 1}. ${item.productName} - ${new Intl.NumberFormat(
        "vi-VN",
        { style: "currency", currency: "VND" }
      ).format(item.productPrice)}\n`;
    });

    return response;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin sản phẩm rẻ nhất:", error);
    return "Đã xảy ra lỗi khi lấy thông tin sản phẩm rẻ nhất.";
  }
};

export {
  handleProductInfo,
  handleProductPrice,
  handleProductOrigin,
  handleProductUsage,
  handleHowToUse,
  handleIngredients,
  handleRelatedProducts,
  handleMostExpensiveProduct,
  handleCheapestProduct,
};

export default {
  handleProductInfo,
  handleProductPrice,
  handleProductOrigin,
  handleProductUsage,
  handleHowToUse,
  handleIngredients,
  handleRelatedProducts,
  handleMostExpensiveProduct,
  handleCheapestProduct,
};
