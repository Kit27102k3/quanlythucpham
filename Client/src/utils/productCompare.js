/**
 * Tiện ích so sánh sản phẩm
 * Cung cấp các hàm để so sánh các thuộc tính giữa các sản phẩm
 */

/**
 * So sánh hai hoặc nhiều sản phẩm dựa trên các thuộc tính quan trọng
 * @param {Array} products - Mảng các sản phẩm cần so sánh
 * @returns {Object} - Kết quả so sánh dưới dạng đối tượng có cấu trúc
 */
export const compareProducts = (products) => {
  if (!products || products.length < 2) {
    return { error: "Cần ít nhất 2 sản phẩm để so sánh" };
  }

  // Các thuộc tính cần so sánh
  const comparisonFields = {
    basic: [
      { key: "productName", label: "Tên sản phẩm" },
      { key: "productBrand", label: "Thương hiệu" },
      { key: "productPrice", label: "Giá" },
      { key: "productDiscount", label: "Giảm giá (%)" },
      { key: "productOrigin", label: "Xuất xứ" },
    ],
    details: [
      { key: "productWeight", label: "Trọng lượng" },
      { key: "productUnit", label: "Đơn vị" },
      { key: "productStock", label: "Tồn kho" },
      { key: "averageRating", label: "Đánh giá trung bình" },
      { key: "soldCount", label: "Đã bán" },
    ],
    features: [
      { key: "productDescription", label: "Mô tả" },
    ]
  };

  // Kết quả so sánh
  const comparison = {
    products: products.map(p => ({
      id: p._id,
      name: p.productName,
      image: p.productImages && p.productImages.length > 0 ? p.productImages[0] : null
    })),
    basic: {},
    details: {},
    features: {},
    differences: [],
    advantages: {}
  };

  // So sánh các thuộc tính cơ bản
  comparisonFields.basic.forEach(field => {
    comparison.basic[field.key] = {
      label: field.label,
      values: products.map(p => p[field.key])
    };
  });

  // So sánh các thuộc tính chi tiết
  comparisonFields.details.forEach(field => {
    comparison.details[field.key] = {
      label: field.label,
      values: products.map(p => p[field.key])
    };
  });

  // So sánh các tính năng
  comparisonFields.features.forEach(field => {
    comparison.features[field.key] = {
      label: field.label,
      values: products.map(p => {
        if (field.key === "productDescription" && Array.isArray(p[field.key])) {
          return p[field.key];
        }
        return p[field.key];
      })
    };
  });

  // Phân tích sự khác biệt chính
  comparison.differences = analyzeDifferences(products);
  
  // Phân tích ưu điểm của từng sản phẩm
  products.forEach((product, index) => {
    comparison.advantages[product._id] = analyzeAdvantages(product, products.filter((_, i) => i !== index));
  });

  return comparison;
};

/**
 * Phân tích sự khác biệt chính giữa các sản phẩm
 * @param {Array} products - Mảng các sản phẩm cần so sánh
 * @returns {Array} - Mảng các khác biệt chính
 */
const analyzeDifferences = (products) => {
  const differences = [];

  // So sánh giá
  const prices = products.map(p => parseFloat(p.productPrice));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  if (maxPrice - minPrice > 0) {
    const priceDiff = ((maxPrice - minPrice) / minPrice * 100).toFixed(0);
    differences.push({
      type: "price",
      description: `Chênh lệch giá ${priceDiff}% giữa sản phẩm đắt nhất và rẻ nhất`
    });
  }

  // So sánh trọng lượng/dung tích
  const weights = products.map(p => parseFloat(p.productWeight)).filter(w => !isNaN(w));
  if (weights.length === products.length) {
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    
    if (maxWeight / minWeight > 1.2) { // Chênh lệch hơn 20%
      differences.push({
        type: "weight",
        description: `Sản phẩm có trọng lượng/dung tích khác nhau đáng kể`
      });
    }
  }

  // So sánh thương hiệu
  const brands = new Set(products.map(p => p.productBrand));
  if (brands.size > 1) {
    differences.push({
      type: "brand",
      description: `Sản phẩm đến từ các thương hiệu khác nhau: ${Array.from(brands).join(', ')}`
    });
  }

  // So sánh xuất xứ
  const origins = new Set(products.map(p => p.productOrigin).filter(Boolean));
  if (origins.size > 1) {
    differences.push({
      type: "origin",
      description: `Sản phẩm có xuất xứ khác nhau: ${Array.from(origins).join(', ')}`
    });
  }

  return differences;
};

/**
 * Phân tích ưu điểm của một sản phẩm so với các sản phẩm khác
 * @param {Object} product - Sản phẩm cần phân tích
 * @param {Array} otherProducts - Các sản phẩm khác để so sánh
 * @returns {Array} - Mảng các ưu điểm
 */
const analyzeAdvantages = (product, otherProducts) => {
  const advantages = [];

  // So sánh giá
  const thisPrice = parseFloat(product.productPrice);
  const otherPrices = otherProducts.map(p => parseFloat(p.productPrice));
  if (thisPrice < Math.min(...otherPrices)) {
    advantages.push({
      type: "price",
      description: "Giá thấp nhất trong các sản phẩm so sánh"
    });
  }

  // So sánh đánh giá
  const thisRating = parseFloat(product.averageRating) || 0;
  const otherRatings = otherProducts.map(p => parseFloat(p.averageRating) || 0);
  if (thisRating > Math.max(...otherRatings)) {
    advantages.push({
      type: "rating",
      description: "Đánh giá cao nhất trong các sản phẩm so sánh"
    });
  }

  // So sánh lượng bán
  const thisSold = parseInt(product.soldCount) || 0;
  const otherSold = otherProducts.map(p => parseInt(p.soldCount) || 0);
  if (thisSold > Math.max(...otherSold)) {
    advantages.push({
      type: "popularity",
      description: "Bán chạy nhất trong các sản phẩm so sánh"
    });
  }

  // So sánh giảm giá
  const thisDiscount = parseFloat(product.productDiscount) || 0;
  const otherDiscounts = otherProducts.map(p => parseFloat(p.productDiscount) || 0);
  if (thisDiscount > Math.max(...otherDiscounts)) {
    advantages.push({
      type: "discount",
      description: "Có mức giảm giá cao nhất"
    });
  }

  return advantages;
};

/**
 * Tạo nội dung tin nhắn so sánh sản phẩm dễ đọc
 * @param {Object} comparison - Kết quả so sánh từ hàm compareProducts
 * @returns {String} - Nội dung tin nhắn so sánh
 */
export const generateComparisonMessage = (comparison) => {
  if (comparison.error) {
    return comparison.error;
  }

  let message = "📊 *SO SÁNH SẢN PHẨM*\n\n";

  // Thêm tên sản phẩm
  message += "🔹 *Sản phẩm so sánh:*\n";
  comparison.products.forEach((product, index) => {
    message += `${index + 1}. ${product.name}\n`;
  });
  message += "\n";

  // Thêm thông tin cơ bản
  message += "🔹 *Thông tin cơ bản:*\n";
  Object.entries(comparison.basic).forEach(([key, field]) => {
    message += `- ${field.label}: `;
    field.values.forEach((value, index) => {
      if (index > 0) message += " | ";
      
      if (key === "productPrice") {
        message += `${formatCurrency(value)}`;
      } else if (key === "productDiscount" && value > 0) {
        message += `${value}%`;
      } else {
        message += `${value || "Không có"}`;
      }
    });
    message += "\n";
  });
  message += "\n";

  // Thêm sự khác biệt chính
  if (comparison.differences.length > 0) {
    message += "🔹 *Sự khác biệt chính:*\n";
    comparison.differences.forEach(diff => {
      message += `- ${diff.description}\n`;
    });
    message += "\n";
  }

  // Thêm ưu điểm của từng sản phẩm
  message += "🔹 *Ưu điểm nổi bật:*\n";
  comparison.products.forEach((product, index) => {
    const advantages = comparison.advantages[product.id];
    message += `${index + 1}. ${product.name}:\n`;
    
    if (advantages.length > 0) {
      advantages.forEach(adv => {
        message += `   ✓ ${adv.description}\n`;
      });
    } else {
      message += `   (Không có ưu điểm nổi bật)\n`;
    }
  });

  return message;
};

/**
 * Định dạng số tiền thành chuỗi tiền tệ VND
 * @param {Number} amount - Số tiền cần định dạng
 * @returns {String} - Chuỗi tiền tệ đã định dạng
 */
const formatCurrency = (amount) => {
  if (!amount) return "0 ₫";
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}; 