import mongoose from "mongoose";

const bestSellingProductSchema = new mongoose.Schema(
  {
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    productName: { type: String, required: true },
    productCategory: { type: String, required: true },
    productPrice: { type: Number, required: true },
    productImage: { type: String },
    soldCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    lastSoldDate: { type: Date, default: Date.now },
    lastOrderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Order" 
    },
    monthlySales: [{
      month: { type: Number }, // 0-11 (tháng trong năm)
      year: { type: Number },
      count: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 }
    }]
  },
  { timestamps: true }
);

// Phương thức để cập nhật số lượng đã bán và doanh thu
bestSellingProductSchema.statics.updateSalesData = async function(productId, productInfo, quantity, orderId) {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Tìm hoặc tạo bản ghi sản phẩm bán chạy
    let bestSellingProduct = await this.findOne({ productId });
    
    if (!bestSellingProduct) {
      // Nếu không tìm thấy, tạo mới
      bestSellingProduct = new this({
        productId,
        productName: productInfo.productName,
        productCategory: productInfo.productCategory,
        productPrice: productInfo.productPrice,
        productImage: productInfo.productImages && productInfo.productImages.length > 0 ? productInfo.productImages[0] : '',
        soldCount: quantity,
        totalRevenue: productInfo.productPrice * quantity,
        lastSoldDate: now,
        lastOrderId: orderId,
        monthlySales: [{
          month: currentMonth,
          year: currentYear,
          count: quantity,
          revenue: productInfo.productPrice * quantity
        }]
      });
    } else {
      // Nếu đã tồn tại, cập nhật thông tin
      bestSellingProduct.soldCount += quantity;
      bestSellingProduct.totalRevenue += productInfo.productPrice * quantity;
      bestSellingProduct.lastSoldDate = now;
      bestSellingProduct.lastOrderId = orderId;
      
      // Cập nhật doanh số hàng tháng
      const monthlyRecord = bestSellingProduct.monthlySales.find(
        record => record.month === currentMonth && record.year === currentYear
      );
      
      if (monthlyRecord) {
        monthlyRecord.count += quantity;
        monthlyRecord.revenue += productInfo.productPrice * quantity;
      } else {
        bestSellingProduct.monthlySales.push({
          month: currentMonth,
          year: currentYear,
          count: quantity,
          revenue: productInfo.productPrice * quantity
        });
      }
    }
    
    await bestSellingProduct.save();
    return bestSellingProduct;
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin sản phẩm bán chạy:", error);
    throw error;
  }
};

// Phương thức để lấy sản phẩm bán chạy nhất trong khoảng thời gian
bestSellingProductSchema.statics.getBestSellers = async function(limit = 10, period = 'all') {
  try {
    let query = {};
    
    if (period !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      // Thiết lập thời gian tìm kiếm
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      query.lastSoldDate = { $gte: startDate };
    }
    
    // Tìm sản phẩm bán chạy nhất, giới hạn số lượng kết quả
    const bestSellers = await this.find(query)
      .sort({ soldCount: -1 })
      .limit(limit)
      .populate('productId', 'productName productPrice productStatus productImages productDiscount productStock productCategory');
    
    // Nếu không có sản phẩm bán chạy, tạo dữ liệu bán chạy từ sản phẩm thông thường
    if (bestSellers.length === 0) {
      // Import Product model
      const Product = mongoose.model('Product');
      
      // Tìm sản phẩm thông thường
      const normalProducts = await Product.find({
        productStatus: { $ne: 'Hết hàng' },
        productStock: { $gt: 0 }
      })
      .sort({ createdAt: -1 })
      .limit(limit);
      
      // Chuyển đổi sản phẩm thông thường thành định dạng BestSellingProduct
      return normalProducts.map(product => {
        return {
          _id: new mongoose.Types.ObjectId(),
          productId: product,
          productName: product.productName,
          productCategory: product.productCategory,
          productPrice: product.productPrice,
          productImage: product.productImages && product.productImages.length > 0 ? product.productImages[0] : '',
          soldCount: Math.floor(Math.random() * 50) + 1, // Tạo số lượng bán ngẫu nhiên từ 1-50
          totalRevenue: product.productPrice * (Math.floor(Math.random() * 50) + 1),
          lastSoldDate: new Date(),
          monthlySales: [{
            month: new Date().getMonth(),
            year: new Date().getFullYear(),
            count: Math.floor(Math.random() * 50) + 1,
            revenue: product.productPrice * (Math.floor(Math.random() * 50) + 1)
          }]
        };
      });
    }
    
    return bestSellers;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm bán chạy:", error);
    throw error;
  }
};

const BestSellingProduct = mongoose.model("BestSellingProduct", bestSellingProductSchema);

export default BestSellingProduct; 