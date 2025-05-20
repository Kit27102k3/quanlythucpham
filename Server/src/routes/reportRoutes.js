import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';
import Order from '../Model/Order.js';
import Product from '../Model/Products.js';
import User from '../Model/Register.js';
import { verifyToken as authMiddleware } from '../Middleware/authMiddleware.js';

// Lấy dữ liệu doanh thu theo khoảng thời gian (tuần/tháng/năm)
router.get('/revenue', authMiddleware, async (req, res) => {
  try {
    const { timeRange } = req.query;
    
    // Kiểm tra xem có order nào đã hoàn thành không
    const completedOrderCount = await Order.countDocuments({ status: 'completed' });
    
    // Nếu không có đơn hàng hoàn thành, trả về mảng trống
    if (completedOrderCount === 0) {
      return res.json([]);
    }
    
    let startDate, endDate;
    const currentDate = new Date();
    
    // Xác định khoảng thời gian dựa trên timeRange
    if (timeRange === 'week') {
      // Lấy dữ liệu 7 ngày gần nhất
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 7);
    } else if (timeRange === 'month') {
      // Lấy dữ liệu 30 ngày gần nhất
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 30);
    } else if (timeRange === 'year') {
      // Lấy dữ liệu 12 tháng gần nhất
      startDate = new Date(currentDate);
      startDate.setFullYear(currentDate.getFullYear() - 1);
    } else {
      return res.status(400).json({ message: 'Thông số không hợp lệ' });
    }

    // Truy vấn dữ liệu từ DB
    let revenueData;
    
    if (timeRange === 'week') {
      // Doanh thu theo ngày trong tuần
      revenueData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: currentDate },
            status: { $in: ['completed', 'delivered'] } // Tính cả đơn hàng đã hoàn thành và đã giao
          }
        },
        {
          $group: {
            _id: { $dayOfWeek: '$createdAt' },
            revenue: { $sum: '$totalAmount' }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            day: '$_id',
            revenue: 1
          }
        }
      ]);

      // Chuyển đổi định dạng dữ liệu cho phù hợp với frontend
      const daysOfWeek = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      
      // Tạo dữ liệu cho tất cả các ngày trong tuần, kể cả ngày không có doanh thu
      const completeData = [];
      for (let i = 1; i <= 7; i++) {
        const dayData = revenueData.find(item => item.day === i);
        completeData.push({
          name: daysOfWeek[i - 1],
          revenue: dayData ? dayData.revenue : 0
        });
      }
      revenueData = completeData;
    } else if (timeRange === 'month') {
      // Doanh thu theo ngày trong tháng
      revenueData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: currentDate },
            status: { $in: ['completed', 'delivered'] }
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: '$createdAt' },
            revenue: { $sum: '$totalAmount' }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            name: { $toString: '$_id' },
            revenue: 1
          }
        }
      ]);
      
      // Đảm bảo có dữ liệu cho mỗi ngày trong tháng
      if (revenueData.length === 0) {
        revenueData = Array.from({ length: 30 }, (_, i) => ({
          name: `${i + 1}`,
          revenue: 0
        }));
      }
    } else if (timeRange === 'year') {
      // Doanh thu theo tháng trong năm
      revenueData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: currentDate },
            status: { $in: ['completed', 'delivered'] }
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            revenue: { $sum: '$totalAmount' }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            month: '$_id',
            revenue: 1
          }
        }
      ]);

      // Chuyển đổi định dạng dữ liệu
      const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
                      
      // Tạo dữ liệu cho tất cả các tháng, kể cả tháng không có doanh thu
      const completeData = [];
      for (let i = 1; i <= 12; i++) {
        const monthData = revenueData.find(item => item.month === i);
        completeData.push({
          name: months[i - 1],
          revenue: monthData ? monthData.revenue : 0
        });
      }
      revenueData = completeData;
    }

    res.json(revenueData);
  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy dữ liệu doanh thu' });
  }
});

// Lấy danh sách sản phẩm bán chạy
router.get('/top-products', authMiddleware, async (req, res) => {
  try {
    // Kiểm tra xem có order nào không
    const orderCount = await Order.countDocuments({ status: 'completed' });
    if (orderCount === 0) {
      return res.json([]);
    }

    // Kiểm tra xem Product collection có sản phẩm nào không
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      return res.json([]);
    }

    // Lấy mẫu một đơn hàng để kiểm tra cấu trúc thực tế
    const sampleOrder = await Order.findOne({ status: 'completed' }).lean();

    const topProducts = await Order.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $unwind: {
          path: '$products',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $group: {
          _id: '$products.productId',
          name: { 
            $first: {
              $cond: [
                { $gt: [{ $size: '$productInfo' }, 0] },
                { $arrayElemAt: ['$productInfo.productName', 0] },
                'Sản phẩm không xác định'
              ]
            } 
          },
          sold: { $sum: '$products.quantity' },
          revenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } }
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          name: 1,
          sold: 1,
          revenue: 1
        }
      }
    ]);

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm bán chạy' });
  }
});

// Lấy dữ liệu tồn kho
router.get('/inventory', authMiddleware, async (req, res) => {
  try {
    console.log("Đang lấy dữ liệu tồn kho...");
    
    // Kiểm tra xem có sản phẩm nào không
    const productCount = await Product.countDocuments();
    console.log(`Số lượng sản phẩm: ${productCount}`);
    
    if (productCount === 0) {
      console.log("Không có sản phẩm nào trong hệ thống");
      return res.json([]);
    }
    
    // Lấy mẫu một sản phẩm để kiểm tra cấu trúc
    const sampleProduct = await Product.findOne().lean();
    console.log("Sample product structure:", JSON.stringify(sampleProduct, null, 2));
    
    // Lấy danh sách các danh mục
    const categories = await Product.distinct('productCategory');
    console.log("Product categories:", categories);
    
    if (!categories || categories.length === 0) {
      console.log("Không tìm thấy danh mục sản phẩm");
      return res.json([]);
    }

    // Tính tổng tồn kho theo danh mục
    const inventory = await Product.aggregate([
      {
        $group: {
          _id: '$productCategory',
          stock: { $sum: '$productStock' },
          lowStock: { $sum: { $cond: [{ $lt: ['$productStock', 10] }, 1, 0] } },
          value: { $sum: '$productStock' }
        }
      },
      {
        $sort: { stock: -1 }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          stock: 1,
          lowStock: 1,
          value: 1
        }
      }
    ]);

    // Log kết quả trước khi trả về
    console.log("Inventory data result:", inventory);
    
    if (inventory.length === 0) {
      console.log("Không tìm thấy dữ liệu tồn kho");
      return res.json([]);
    }
    
    res.json(inventory);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu tồn kho:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy dữ liệu tồn kho' });
  }
});

// Lấy dữ liệu người dùng
router.get('/users', authMiddleware, async (req, res) => {
  try {
    console.log("Đang lấy dữ liệu người dùng...");
    
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    
    // Tổng số người dùng
    const totalUsers = await User.countDocuments({});
    
    // Người dùng mới trong 30 ngày qua
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Người dùng hoạt động (có đơn hàng trong 30 ngày)
    const activeUsers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          userId: { $exists: true, $ne: null } // Đảm bảo userId tồn tại và không phải null
        }
      },
      {
        $group: {
          _id: '$userId'
        }
      },
      {
        $count: 'count'
      }
    ]);
    
    const activeUsersCount = activeUsers.length > 0 ? activeUsers[0].count : 0;
    
    // Khách vãng lai (có đơn hàng nhưng không có tài khoản)
    const guestOrders = await Order.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    const userData = [
      { name: 'Người dùng mới', count: newUsers, color: '#8884d8' },
      { name: 'Khách hàng thân thiết', count: activeUsersCount, color: '#82ca9d' },
      { name: 'Khách vãng lai', count: guestOrders, color: '#ffc658' }
    ];

    // Log kết quả trước khi trả về
    console.log("User data result:", userData);
    res.json(userData);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu người dùng:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy dữ liệu người dùng' });
  }
});

// Thêm endpoint kiểm tra cấu trúc Order
router.get('/test-structure', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().limit(1);
    const products = await Product.find().limit(1);
    const users = await User.find().limit(1);
    
    const orderCount = await Order.countDocuments();
    const productCount = await Product.countDocuments();
    const userCount = await User.countDocuments();
    
    const orderStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    const categories = await Category.find();
    
    res.json({ 
      message: "Cấu trúc dữ liệu đã được kiểm tra",
      orderCount,
      productCount,
      userCount,
      orderStatus,
      categories
    });
  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi khi kiểm tra cấu trúc dữ liệu' });
  }
});

export default router; 