import Order from "../Model/Order.js";
import Product from "../Model/Products.js";
import User from "../Model/Register.js";

export const getDashboardStats = async (req, res) => {
    try {
        // Lấy tổng doanh thu
        const totalRevenue = await Order.aggregate([
            { $match: { status: "Đã giao hàng" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        // Lấy tổng số đơn hàng
        const totalOrders = await Order.countDocuments();

        // Lấy tổng số sản phẩm
        const totalProducts = await Product.countDocuments();

        // Lấy tổng số khách hàng
        const totalCustomers = await User.countDocuments();

        // Lấy doanh thu theo ngày (7 ngày gần nhất)
        const dailyRevenue = await Order.aggregate([
            { $match: { status: "Đã giao hàng" } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } },
            { $limit: 7 }
        ]);

        // Lấy doanh thu theo tuần (4 tuần gần nhất)
        const weeklyRevenue = await Order.aggregate([
            { $match: { status: "Đã giao hàng" } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        week: { $week: "$createdAt" }
                    },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": -1, "_id.week": -1 } },
            { $limit: 4 }
        ]);

        // Lấy doanh thu theo tháng (6 tháng gần nhất)
        const monthlyRevenue = await Order.aggregate([
            { $match: { status: "Đã giao hàng" } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 6 }
        ]);

        // Lấy thống kê sản phẩm theo danh mục
        const productsByCategory = await Product.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "productCategory",
                    foreignField: "_id",
                    as: "categoryInfo"
                }
            },
            { $unwind: "$categoryInfo" },
            {
                $group: {
                    _id: "$categoryInfo._id",
                    name: { $first: "$categoryInfo.name" },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    value: "$count"
                }
            }
        ]);

        // Lấy thống kê đơn hàng theo trạng thái
        const ordersByStatus = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    value: "$count"
                }
            }
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
                productsByCategory,
                ordersByStatus
            }
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Lỗi server khi lấy thống kê",
            error: error.message 
        });
    }
}; 