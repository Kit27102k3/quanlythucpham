import Order from "../Model/Order.js";
import Product from "../Model/Products.js";
import User from "../Model/Register.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Lấy tổng doanh thu - đã cập nhật để sử dụng status correct và isPaid
    const totalRevenue = await Order.aggregate([
      { $match: { status: "completed", isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // Lấy tổng số đơn hàng
    const totalOrders = await Order.countDocuments();

    // Lấy tổng số sản phẩm
    const totalProducts = await Product.countDocuments();

    // Lấy tổng số khách hàng
    const totalCustomers = await User.countDocuments();

    // Lấy doanh thu theo ngày (7 ngày gần nhất) - sử dụng completedAt nếu có
    const dailyRevenue = await Order.aggregate([
      { $match: { status: "completed", isPaid: true } },
      {
        $group: {
          _id: {
            year: { $year: { $ifNull: ["$completedAt", "$updatedAt"] } },
            month: { $month: { $ifNull: ["$completedAt", "$updatedAt"] } },
            day: { $dayOfMonth: { $ifNull: ["$completedAt", "$updatedAt"] } },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } },
      { $limit: 7 },
    ]);

    // Lấy doanh thu theo tuần (4 tuần gần nhất) - sử dụng completedAt nếu có
    const weeklyRevenue = await Order.aggregate([
      { $match: { status: "completed", isPaid: true } },
      {
        $group: {
          _id: {
            year: { $year: { $ifNull: ["$completedAt", "$updatedAt"] } },
            week: { $week: { $ifNull: ["$completedAt", "$updatedAt"] } },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.week": -1 } },
      { $limit: 4 },
    ]);

    // Lấy doanh thu theo tháng (6 tháng gần nhất) - sử dụng completedAt nếu có
    const monthlyRevenue = await Order.aggregate([
      { $match: { status: "completed", isPaid: true } },
      {
        $group: {
          _id: {
            year: { $year: { $ifNull: ["$completedAt", "$updatedAt"] } },
            month: { $month: { $ifNull: ["$completedAt", "$updatedAt"] } },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 },
    ]);

    // Lấy thống kê sản phẩm theo danh mục
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: "$productCategory",
          name: { $first: "$productCategory" },
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          value: 1,
        },
      },
      {
        $sort: { value: -1 },
      },
    ]);

    // Khởi tạo biến để lưu kết quả cuối cùng
    let finalProductsByCategory = [];

    // Trong trường hợp không có dữ liệu phân loại
    if (!productsByCategory || productsByCategory.length === 0) {
      console.log("Không tìm thấy dữ liệu phân loại");

      const totalProducts = await Product.countDocuments();
      finalProductsByCategory = [
        { name: "Tất cả sản phẩm", value: totalProducts },
      ];
    } else {
      finalProductsByCategory = productsByCategory;
    }

    // Lấy top 5 sản phẩm bán chạy
    const topProducts = await Product.aggregate([
      {
        $project: {
          name: "$productName",
          soldQuantity: { $ifNull: ["$soldCount", 0] }, // Sử dụng trường đếm số lượng bán nếu có
        },
      },
      {
        $sort: { soldQuantity: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // Nếu không có dữ liệu hoặc dữ liệu trống, tạo dữ liệu mẫu
    let finalTopProducts =
      topProducts.length > 0
        ? topProducts
        : [{ name: "Chưa có dữ liệu bán hàng", soldQuantity: 0 }];

    // Lấy thống kê đơn hàng theo trạng thái
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          value: "$count",
        },
      },
    ]);

    const response = {
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders,
        totalProducts,
        totalCustomers,
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        productsByCategory: finalProductsByCategory,
        ordersByStatus,
        topProducts: finalTopProducts,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};
