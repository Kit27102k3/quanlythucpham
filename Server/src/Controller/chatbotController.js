// Thêm hàm xử lý so sánh sản phẩm
export const handleProductComparison = async (req, res) => {
  try {
    const { userId, productIds, message } = req.body;
    console.log(`Xử lý yêu cầu so sánh sản phẩm từ user ${userId}`);

    let products = [];

    // Nếu có danh sách productIds được gửi lên
    if (productIds && Array.isArray(productIds) && productIds.length >= 2) {
      console.log(`So sánh các sản phẩm với ID: ${productIds.join(", ")}`);
      products = await Product.find({ _id: { $in: productIds } });
    }
    // Nếu không có productIds nhưng có userId, tìm sản phẩm từ ngữ cảnh
    else if (userId) {
      const context = getContext(userId);

      if (context && context.lastProducts && context.lastProducts.length >= 2) {
        console.log(
          `Sử dụng sản phẩm từ ngữ cảnh: ${context.lastProducts.length} sản phẩm`
        );
        // Lấy tối đa 3 sản phẩm từ ngữ cảnh
        products = context.lastProducts.slice(0, 3);
      } else if (context && context.lastProduct) {
        // Nếu chỉ có 1 sản phẩm trong ngữ cảnh, tìm thêm sản phẩm tương tự
        try {
          const similarProducts = await Product.find({
            productCategory: context.lastProduct.productCategory,
            _id: { $ne: context.lastProduct._id },
          }).limit(2);

          if (similarProducts && similarProducts.length > 0) {
            products = [context.lastProduct, ...similarProducts];
            console.log(
              `Sử dụng 1 sản phẩm từ ngữ cảnh và ${similarProducts.length} sản phẩm tương tự`
            );
          } else {
            console.log("Không tìm thấy sản phẩm tương tự để so sánh");
          }
        } catch (error) {
          console.error("Lỗi khi tìm sản phẩm tương tự:", error);
        }
      }
    }

    // Nếu không tìm thấy đủ sản phẩm để so sánh
    if (!products || products.length < 2) {
      console.log("Không đủ sản phẩm để so sánh");
      return res.status(200).json({
        success: false,
        message:
          "Không tìm thấy đủ sản phẩm để so sánh. Vui lòng xem và chọn ít nhất 2 sản phẩm để so sánh.",
      });
    }

    console.log(`Tiến hành so sánh ${products.length} sản phẩm`);

    // So sánh sản phẩm
    let comparison;
    let comparisonMessage;

    try {
      // Nếu có đúng 2 sản phẩm, sử dụng hàm generateSimpleComparison
      if (products.length === 2) {
        console.log("Sử dụng so sánh chi tiết cho 2 sản phẩm");
        comparisonMessage = generateSimpleComparison(products);
        
        // Chuẩn bị thông tin sản phẩm đầy đủ để hiển thị
        const productData = products.map(p => {
          const imageData = getProductImageData(p);
          return {
            id: p._id,
            name: p.productName,
            price: p.productPrice,
            ...imageData
          };
        });
        
        comparison = {
          products: productData,
          type: "simple_comparison",
          message: comparisonMessage,
        };
      } else {
        // Nếu có nhiều hơn 2 sản phẩm, sử dụng hàm compareProducts hiện tại
        comparison = compareProducts(products);
        comparisonMessage = generateComparisonMessage(comparison);
      }
    } catch (error) {
      console.error("Lỗi khi so sánh sản phẩm:", error);
      return res.status(200).json({
        success: false,
        message: `Lỗi khi so sánh sản phẩm: ${error.message}`,
      });
    }

    // Lưu kết quả so sánh vào ngữ cảnh
    if (userId) {
      saveContext(userId, {
        lastComparison: comparison,
        lastProducts: products,
        lastProduct: products[0],
        lastQuery: message || "So sánh sản phẩm",
      });
    }

    return res.status(200).json({
      success: true,
      type: "comparison",
      message: comparisonMessage,
      data: comparison,
    });
  } catch (error) {
    console.error("Lỗi khi so sánh sản phẩm:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi so sánh sản phẩm.",
    });
  }
};

// Hàm trích xuất dữ liệu hình ảnh từ sản phẩm
const getProductImageData = (product) => {
  const imageData = {};
  
  // Thêm đường dẫn hình ảnh từ mọi nguồn có thể
  if (product.productImages && product.productImages.length > 0) {
    imageData.image = product.productImages[0];
  }
  
  if (product.productImageURLs && product.productImageURLs.length > 0) {
    imageData.imageUrl = product.productImageURLs[0];
  }
  
  if (product.productImageBase64) {
    imageData.imageBase64 = product.productImageBase64;
  }
  
  // Thêm các trường hình ảnh khác nếu có
  if (product.imageURLs && product.imageURLs.length > 0) {
    imageData.imageUrl = imageData.imageUrl || product.imageURLs[0];
  }
  
  if (product.imageUrl) {
    imageData.imageUrl = imageData.imageUrl || product.imageUrl;
  }
  
  if (product.image) {
    imageData.image = imageData.image || product.image;
  }
  
  if (product.thumbnailUrl) {
    imageData.thumbnailUrl = product.thumbnailUrl;
  }
  
  return imageData;
};

// Hàm so sánh sản phẩm
const compareProducts = (products) => {
  // Đảm bảo có ít nhất 2 sản phẩm để so sánh
  if (!products || products.length < 2) {
    throw new Error("Cần ít nhất 2 sản phẩm để so sánh");
  }

  // Giới hạn số lượng sản phẩm so sánh
  const productsToCompare = products.slice(0, 3);

  // Các thuộc tính cần so sánh
  const comparisonAttributes = [
    { key: "productName", label: "Tên sản phẩm" },
    { key: "productBrand", label: "Thương hiệu" },
    { key: "productCategory", label: "Danh mục" },
    { key: "productPrice", label: "Giá" },
    { key: "productDiscount", label: "Giảm giá" },
    { key: "averageRating", label: "Đánh giá" },
    { key: "productStock", label: "Số lượng tồn kho" },
    { key: "productWeight", label: "Trọng lượng" },
    { key: "productOrigin", label: "Xuất xứ" },
    { key: "productDescription", label: "Mô tả" },
  ];

  // Tạo bảng so sánh
  const comparisonTable = comparisonAttributes.map((attr) => {
    const row = {
      attribute: attr.label,
      values: {},
    };

    // Lấy giá trị của thuộc tính cho từng sản phẩm
    productsToCompare.forEach((product) => {
      let value = product[attr.key];

      // Xử lý các trường hợp đặc biệt
      if (attr.key === "productPrice") {
        // Định dạng giá tiền
        value = formatCurrency(value);
      } else if (attr.key === "productDiscount") {
        // Định dạng phần trăm giảm giá
        value = value ? `${value}%` : "0%";
      } else if (attr.key === "averageRating") {
        // Định dạng đánh giá
        value = value ? `${value}/5` : "Chưa có đánh giá";
      } else if (attr.key === "productDescription") {
        // Rút gọn mô tả
        value = value
          ? value.length > 100
            ? value.substring(0, 100) + "..."
            : value
          : "Không có mô tả";
      } else if (!value) {
        // Giá trị mặc định nếu không có dữ liệu
        value = "Không có thông tin";
      }

      row.values[product._id] = value;
    });

    return row;
  });

  // Phân tích sự khác biệt giữa các sản phẩm
  const differences = analyzeDifferences(productsToCompare);

  // Phân tích ưu điểm của từng sản phẩm
  const advantages = {};
  productsToCompare.forEach((product) => {
    const otherProducts = productsToCompare.filter(
      (p) => p._id !== product._id
    );
    advantages[product._id] = analyzeAdvantages(product, otherProducts);
  });

  // Chuẩn bị thông tin sản phẩm đầy đủ để hiển thị
  const productData = productsToCompare.map(p => {
    const imageData = getProductImageData(p);
    return {
      id: p._id,
      name: p.productName,
      price: p.productPrice,
      ...imageData
    };
  });

  return {
    products: productData,
    comparisonTable,
    differences,
    advantages,
  };
}; 