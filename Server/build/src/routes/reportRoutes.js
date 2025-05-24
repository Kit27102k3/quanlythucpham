"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _express = _interopRequireDefault(require("express"));

var _mongoose = _interopRequireDefault(require("mongoose"));
var _Order = _interopRequireDefault(require("../Model/Order.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _Register = _interopRequireDefault(require("../Model/Register.js"));
var _authMiddleware = require("../Middleware/authMiddleware.js");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}const router = _express.default.Router();

// Lấy dữ liệu doanh thu theo khoảng thời gian (tuần/tháng/năm)
router.get('/revenue', _authMiddleware.verifyToken, async (req, res) => {
  try {
    const { timeRange } = req.query;

    // Kiểm tra xem có order nào đã hoàn thành không
    const completedOrderCount = await _Order.default.countDocuments({ status: 'completed' });

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
      revenueData = await _Order.default.aggregate([
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
      }]
      );

      // Chuyển đổi định dạng dữ liệu cho phù hợp với frontend
      const daysOfWeek = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

      // Tạo dữ liệu cho tất cả các ngày trong tuần, kể cả ngày không có doanh thu
      const completeData = [];
      for (let i = 1; i <= 7; i++) {
        const dayData = revenueData.find((item) => item.day === i);
        completeData.push({
          name: daysOfWeek[i - 1],
          revenue: dayData ? dayData.revenue : 0
        });
      }
      revenueData = completeData;
    } else if (timeRange === 'month') {
      // Doanh thu theo ngày trong tháng
      revenueData = await _Order.default.aggregate([
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
      }]
      );

      // Đảm bảo có dữ liệu cho mỗi ngày trong tháng
      if (revenueData.length === 0) {
        revenueData = Array.from({ length: 30 }, (_, i) => ({
          name: `${i + 1}`,
          revenue: 0
        }));
      }
    } else if (timeRange === 'year') {
      // Doanh thu theo tháng trong năm
      revenueData = await _Order.default.aggregate([
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
      }]
      );

      // Chuyển đổi định dạng dữ liệu
      const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

      // Tạo dữ liệu cho tất cả các tháng, kể cả tháng không có doanh thu
      const completeData = [];
      for (let i = 1; i <= 12; i++) {
        const monthData = revenueData.find((item) => item.month === i);
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
router.get('/top-products', _authMiddleware.verifyToken, async (req, res) => {
  try {
    // Kiểm tra xem có order nào không
    const orderCount = await _Order.default.countDocuments({ status: 'completed' });
    if (orderCount === 0) {
      return res.json([]);
    }

    // Kiểm tra xem Product collection có sản phẩm nào không
    const productCount = await _Products.default.countDocuments();
    if (productCount === 0) {
      return res.json([]);
    }

    // Lấy mẫu một đơn hàng để kiểm tra cấu trúc thực tế
    const sampleOrder = await _Order.default.findOne({ status: 'completed' }).lean();

    const topProducts = await _Order.default.aggregate([
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
            'Sản phẩm không xác định']

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
    }]
    );

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm bán chạy' });
  }
});

// Lấy dữ liệu tồn kho
router.get('/inventory', _authMiddleware.verifyToken, async (req, res) => {
  try {
    console.log("Đang lấy dữ liệu tồn kho...");

    // Kiểm tra xem có sản phẩm nào không
    const productCount = await _Products.default.countDocuments();
    console.log(`Số lượng sản phẩm: ${productCount}`);

    if (productCount === 0) {
      console.log("Không có sản phẩm nào trong hệ thống");
      return res.json([]);
    }

    // Lấy mẫu một sản phẩm để kiểm tra cấu trúc
    const sampleProduct = await _Products.default.findOne().lean();
    console.log("Sample product structure:", JSON.stringify(sampleProduct, null, 2));

    // Lấy danh sách các danh mục
    const categories = await _Products.default.distinct('productCategory');
    console.log("Product categories:", categories);

    if (!categories || categories.length === 0) {
      console.log("Không tìm thấy danh mục sản phẩm");
      return res.json([]);
    }

    // Tính tổng tồn kho theo danh mục
    const inventory = await _Products.default.aggregate([
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
    }]
    );

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
router.get('/users', _authMiddleware.verifyToken, async (req, res) => {
  try {
    console.log("Đang lấy dữ liệu người dùng...");

    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);

    // Tổng số người dùng
    const totalUsers = await _Register.default.countDocuments({});

    // Người dùng mới trong 30 ngày qua
    const newUsers = await _Register.default.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Người dùng hoạt động (có đơn hàng trong 30 ngày)
    const activeUsers = await _Order.default.aggregate([
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
    }]
    );

    const activeUsersCount = activeUsers.length > 0 ? activeUsers[0].count : 0;

    // Khách vãng lai (có đơn hàng nhưng không có tài khoản)
    const guestOrders = await _Order.default.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      $or: [
      { userId: { $exists: false } },
      { userId: null }]

    });

    const userData = [
    { name: 'Người dùng mới', count: newUsers, color: '#8884d8' },
    { name: 'Khách hàng thân thiết', count: activeUsersCount, color: '#82ca9d' },
    { name: 'Khách vãng lai', count: guestOrders, color: '#ffc658' }];


    // Log kết quả trước khi trả về
    console.log("User data result:", userData);
    res.json(userData);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu người dùng:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy dữ liệu người dùng' });
  }
});

// Thêm endpoint kiểm tra cấu trúc Order
router.get('/test-structure', _authMiddleware.verifyToken, async (req, res) => {
  try {
    const orders = await _Order.default.find().limit(1);
    const products = await _Products.default.find().limit(1);
    const users = await _Register.default.find().limit(1);

    const orderCount = await _Order.default.countDocuments();
    const productCount = await _Products.default.countDocuments();
    const userCount = await _Register.default.countDocuments();

    const orderStatus = await _Order.default.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }]
    );

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
});var _default = exports.default =

router;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXhwcmVzcyIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX21vbmdvb3NlIiwiX09yZGVyIiwiX1Byb2R1Y3RzIiwiX1JlZ2lzdGVyIiwiX2F1dGhNaWRkbGV3YXJlIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0Iiwicm91dGVyIiwiZXhwcmVzcyIsIlJvdXRlciIsImdldCIsImF1dGhNaWRkbGV3YXJlIiwicmVxIiwicmVzIiwidGltZVJhbmdlIiwicXVlcnkiLCJjb21wbGV0ZWRPcmRlckNvdW50IiwiT3JkZXIiLCJjb3VudERvY3VtZW50cyIsInN0YXR1cyIsImpzb24iLCJzdGFydERhdGUiLCJlbmREYXRlIiwiY3VycmVudERhdGUiLCJEYXRlIiwic2V0RGF0ZSIsImdldERhdGUiLCJzZXRGdWxsWWVhciIsImdldEZ1bGxZZWFyIiwibWVzc2FnZSIsInJldmVudWVEYXRhIiwiYWdncmVnYXRlIiwiJG1hdGNoIiwiY3JlYXRlZEF0IiwiJGd0ZSIsIiRsdGUiLCIkaW4iLCIkZ3JvdXAiLCJfaWQiLCIkZGF5T2ZXZWVrIiwicmV2ZW51ZSIsIiRzdW0iLCIkc29ydCIsIiRwcm9qZWN0IiwiZGF5IiwiZGF5c09mV2VlayIsImNvbXBsZXRlRGF0YSIsImkiLCJkYXlEYXRhIiwiZmluZCIsIml0ZW0iLCJwdXNoIiwibmFtZSIsIiRkYXlPZk1vbnRoIiwiJHRvU3RyaW5nIiwibGVuZ3RoIiwiQXJyYXkiLCJmcm9tIiwiXyIsIiRtb250aCIsIm1vbnRoIiwibW9udGhzIiwibW9udGhEYXRhIiwiZXJyb3IiLCJvcmRlckNvdW50IiwicHJvZHVjdENvdW50IiwiUHJvZHVjdCIsInNhbXBsZU9yZGVyIiwiZmluZE9uZSIsImxlYW4iLCJ0b3BQcm9kdWN0cyIsIiR1bndpbmQiLCJwYXRoIiwicHJlc2VydmVOdWxsQW5kRW1wdHlBcnJheXMiLCIkbG9va3VwIiwibG9jYWxGaWVsZCIsImZvcmVpZ25GaWVsZCIsImFzIiwiJGZpcnN0IiwiJGNvbmQiLCIkZ3QiLCIkc2l6ZSIsIiRhcnJheUVsZW1BdCIsInNvbGQiLCIkbXVsdGlwbHkiLCIkbGltaXQiLCJjb25zb2xlIiwibG9nIiwic2FtcGxlUHJvZHVjdCIsIkpTT04iLCJzdHJpbmdpZnkiLCJjYXRlZ29yaWVzIiwiZGlzdGluY3QiLCJpbnZlbnRvcnkiLCJzdG9jayIsImxvd1N0b2NrIiwiJGx0IiwidmFsdWUiLCJ0aGlydHlEYXlzQWdvIiwidG90YWxVc2VycyIsIlVzZXIiLCJuZXdVc2VycyIsImFjdGl2ZVVzZXJzIiwidXNlcklkIiwiJGV4aXN0cyIsIiRuZSIsIiRjb3VudCIsImFjdGl2ZVVzZXJzQ291bnQiLCJjb3VudCIsImd1ZXN0T3JkZXJzIiwiJG9yIiwidXNlckRhdGEiLCJjb2xvciIsIm9yZGVycyIsImxpbWl0IiwicHJvZHVjdHMiLCJ1c2VycyIsInVzZXJDb3VudCIsIm9yZGVyU3RhdHVzIiwiQ2F0ZWdvcnkiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcm91dGVzL3JlcG9ydFJvdXRlcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcclxuY29uc3Qgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcclxuaW1wb3J0IG1vbmdvb3NlIGZyb20gJ21vbmdvb3NlJztcclxuaW1wb3J0IE9yZGVyIGZyb20gJy4uL01vZGVsL09yZGVyLmpzJztcclxuaW1wb3J0IFByb2R1Y3QgZnJvbSAnLi4vTW9kZWwvUHJvZHVjdHMuanMnO1xyXG5pbXBvcnQgVXNlciBmcm9tICcuLi9Nb2RlbC9SZWdpc3Rlci5qcyc7XHJcbmltcG9ydCB7IHZlcmlmeVRva2VuIGFzIGF1dGhNaWRkbGV3YXJlIH0gZnJvbSAnLi4vTWlkZGxld2FyZS9hdXRoTWlkZGxld2FyZS5qcyc7XHJcblxyXG4vLyBM4bqleSBk4buvIGxp4buHdSBkb2FuaCB0aHUgdGhlbyBraG/huqNuZyB0aOG7nWkgZ2lhbiAodHXhuqduL3Row6FuZy9uxINtKVxyXG5yb3V0ZXIuZ2V0KCcvcmV2ZW51ZScsIGF1dGhNaWRkbGV3YXJlLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyB0aW1lUmFuZ2UgfSA9IHJlcS5xdWVyeTtcclxuICAgIFxyXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gY8OzIG9yZGVyIG7DoG8gxJHDoyBob8OgbiB0aMOgbmgga2jDtG5nXHJcbiAgICBjb25zdCBjb21wbGV0ZWRPcmRlckNvdW50ID0gYXdhaXQgT3JkZXIuY291bnREb2N1bWVudHMoeyBzdGF0dXM6ICdjb21wbGV0ZWQnIH0pO1xyXG4gICAgXHJcbiAgICAvLyBO4bq/dSBraMO0bmcgY8OzIMSRxqFuIGjDoG5nIGhvw6BuIHRow6BuaCwgdHLhuqMgduG7gSBt4bqjbmcgdHLhu5FuZ1xyXG4gICAgaWYgKGNvbXBsZXRlZE9yZGVyQ291bnQgPT09IDApIHtcclxuICAgICAgcmV0dXJuIHJlcy5qc29uKFtdKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgbGV0IHN0YXJ0RGF0ZSwgZW5kRGF0ZTtcclxuICAgIGNvbnN0IGN1cnJlbnREYXRlID0gbmV3IERhdGUoKTtcclxuICAgIFxyXG4gICAgLy8gWMOhYyDEkeG7i25oIGtob+G6o25nIHRo4budaSBnaWFuIGThu7FhIHRyw6puIHRpbWVSYW5nZVxyXG4gICAgaWYgKHRpbWVSYW5nZSA9PT0gJ3dlZWsnKSB7XHJcbiAgICAgIC8vIEzhuqV5IGThu68gbGnhu4d1IDcgbmfDoHkgZ+G6p24gbmjhuqV0XHJcbiAgICAgIHN0YXJ0RGF0ZSA9IG5ldyBEYXRlKGN1cnJlbnREYXRlKTtcclxuICAgICAgc3RhcnREYXRlLnNldERhdGUoY3VycmVudERhdGUuZ2V0RGF0ZSgpIC0gNyk7XHJcbiAgICB9IGVsc2UgaWYgKHRpbWVSYW5nZSA9PT0gJ21vbnRoJykge1xyXG4gICAgICAvLyBM4bqleSBk4buvIGxp4buHdSAzMCBuZ8OgeSBn4bqnbiBuaOG6pXRcclxuICAgICAgc3RhcnREYXRlID0gbmV3IERhdGUoY3VycmVudERhdGUpO1xyXG4gICAgICBzdGFydERhdGUuc2V0RGF0ZShjdXJyZW50RGF0ZS5nZXREYXRlKCkgLSAzMCk7XHJcbiAgICB9IGVsc2UgaWYgKHRpbWVSYW5nZSA9PT0gJ3llYXInKSB7XHJcbiAgICAgIC8vIEzhuqV5IGThu68gbGnhu4d1IDEyIHRow6FuZyBn4bqnbiBuaOG6pXRcclxuICAgICAgc3RhcnREYXRlID0gbmV3IERhdGUoY3VycmVudERhdGUpO1xyXG4gICAgICBzdGFydERhdGUuc2V0RnVsbFllYXIoY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKSAtIDEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgbWVzc2FnZTogJ1Row7RuZyBz4buRIGtow7RuZyBo4bujcCBs4buHJyB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUcnV5IHbhuqVuIGThu68gbGnhu4d1IHThu6sgREJcclxuICAgIGxldCByZXZlbnVlRGF0YTtcclxuICAgIFxyXG4gICAgaWYgKHRpbWVSYW5nZSA9PT0gJ3dlZWsnKSB7XHJcbiAgICAgIC8vIERvYW5oIHRodSB0aGVvIG5nw6B5IHRyb25nIHR14bqnblxyXG4gICAgICByZXZlbnVlRGF0YSA9IGF3YWl0IE9yZGVyLmFnZ3JlZ2F0ZShbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgJG1hdGNoOiB7XHJcbiAgICAgICAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGN1cnJlbnREYXRlIH0sXHJcbiAgICAgICAgICAgIHN0YXR1czogeyAkaW46IFsnY29tcGxldGVkJywgJ2RlbGl2ZXJlZCddIH0gLy8gVMOtbmggY+G6oyDEkcahbiBow6BuZyDEkcOjIGhvw6BuIHRow6BuaCB2w6AgxJHDoyBnaWFvXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAkZ3JvdXA6IHtcclxuICAgICAgICAgICAgX2lkOiB7ICRkYXlPZldlZWs6ICckY3JlYXRlZEF0JyB9LFxyXG4gICAgICAgICAgICByZXZlbnVlOiB7ICRzdW06ICckdG90YWxBbW91bnQnIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICRzb3J0OiB7IF9pZDogMSB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAkcHJvamVjdDoge1xyXG4gICAgICAgICAgICBfaWQ6IDAsXHJcbiAgICAgICAgICAgIGRheTogJyRfaWQnLFxyXG4gICAgICAgICAgICByZXZlbnVlOiAxXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICBdKTtcclxuXHJcbiAgICAgIC8vIENodXnhu4NuIMSR4buVaSDEkeG7i25oIGThuqFuZyBk4buvIGxp4buHdSBjaG8gcGjDuSBo4bujcCB24bubaSBmcm9udGVuZFxyXG4gICAgICBjb25zdCBkYXlzT2ZXZWVrID0gWydDTicsICdUaOG7qSAyJywgJ1Ro4bupIDMnLCAnVGjhu6kgNCcsICdUaOG7qSA1JywgJ1Ro4bupIDYnLCAnVGjhu6kgNyddO1xyXG4gICAgICBcclxuICAgICAgLy8gVOG6oW8gZOG7ryBsaeG7h3UgY2hvIHThuqV0IGPhuqMgY8OhYyBuZ8OgeSB0cm9uZyB0deG6p24sIGvhu4MgY+G6oyBuZ8OgeSBraMO0bmcgY8OzIGRvYW5oIHRodVxyXG4gICAgICBjb25zdCBjb21wbGV0ZURhdGEgPSBbXTtcclxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gNzsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgZGF5RGF0YSA9IHJldmVudWVEYXRhLmZpbmQoaXRlbSA9PiBpdGVtLmRheSA9PT0gaSk7XHJcbiAgICAgICAgY29tcGxldGVEYXRhLnB1c2goe1xyXG4gICAgICAgICAgbmFtZTogZGF5c09mV2Vla1tpIC0gMV0sXHJcbiAgICAgICAgICByZXZlbnVlOiBkYXlEYXRhID8gZGF5RGF0YS5yZXZlbnVlIDogMFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldmVudWVEYXRhID0gY29tcGxldGVEYXRhO1xyXG4gICAgfSBlbHNlIGlmICh0aW1lUmFuZ2UgPT09ICdtb250aCcpIHtcclxuICAgICAgLy8gRG9hbmggdGh1IHRoZW8gbmfDoHkgdHJvbmcgdGjDoW5nXHJcbiAgICAgIHJldmVudWVEYXRhID0gYXdhaXQgT3JkZXIuYWdncmVnYXRlKFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAkbWF0Y2g6IHtcclxuICAgICAgICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogY3VycmVudERhdGUgfSxcclxuICAgICAgICAgICAgc3RhdHVzOiB7ICRpbjogWydjb21wbGV0ZWQnLCAnZGVsaXZlcmVkJ10gfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgJGdyb3VwOiB7XHJcbiAgICAgICAgICAgIF9pZDogeyAkZGF5T2ZNb250aDogJyRjcmVhdGVkQXQnIH0sXHJcbiAgICAgICAgICAgIHJldmVudWU6IHsgJHN1bTogJyR0b3RhbEFtb3VudCcgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgJHNvcnQ6IHsgX2lkOiAxIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICRwcm9qZWN0OiB7XHJcbiAgICAgICAgICAgIF9pZDogMCxcclxuICAgICAgICAgICAgbmFtZTogeyAkdG9TdHJpbmc6ICckX2lkJyB9LFxyXG4gICAgICAgICAgICByZXZlbnVlOiAxXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICBdKTtcclxuICAgICAgXHJcbiAgICAgIC8vIMSQ4bqjbSBi4bqjbyBjw7MgZOG7ryBsaeG7h3UgY2hvIG3hu5dpIG5nw6B5IHRyb25nIHRow6FuZ1xyXG4gICAgICBpZiAocmV2ZW51ZURhdGEubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmV2ZW51ZURhdGEgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiAzMCB9LCAoXywgaSkgPT4gKHtcclxuICAgICAgICAgIG5hbWU6IGAke2kgKyAxfWAsXHJcbiAgICAgICAgICByZXZlbnVlOiAwXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKHRpbWVSYW5nZSA9PT0gJ3llYXInKSB7XHJcbiAgICAgIC8vIERvYW5oIHRodSB0aGVvIHRow6FuZyB0cm9uZyBuxINtXHJcbiAgICAgIHJldmVudWVEYXRhID0gYXdhaXQgT3JkZXIuYWdncmVnYXRlKFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAkbWF0Y2g6IHtcclxuICAgICAgICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogY3VycmVudERhdGUgfSxcclxuICAgICAgICAgICAgc3RhdHVzOiB7ICRpbjogWydjb21wbGV0ZWQnLCAnZGVsaXZlcmVkJ10gfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgJGdyb3VwOiB7XHJcbiAgICAgICAgICAgIF9pZDogeyAkbW9udGg6ICckY3JlYXRlZEF0JyB9LFxyXG4gICAgICAgICAgICByZXZlbnVlOiB7ICRzdW06ICckdG90YWxBbW91bnQnIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICRzb3J0OiB7IF9pZDogMSB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAkcHJvamVjdDoge1xyXG4gICAgICAgICAgICBfaWQ6IDAsXHJcbiAgICAgICAgICAgIG1vbnRoOiAnJF9pZCcsXHJcbiAgICAgICAgICAgIHJldmVudWU6IDFcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIF0pO1xyXG5cclxuICAgICAgLy8gQ2h1eeG7g24gxJHhu5VpIMSR4buLbmggZOG6oW5nIGThu68gbGnhu4d1XHJcbiAgICAgIGNvbnN0IG1vbnRocyA9IFsnVGjDoW5nIDEnLCAnVGjDoW5nIDInLCAnVGjDoW5nIDMnLCAnVGjDoW5nIDQnLCAnVGjDoW5nIDUnLCAnVGjDoW5nIDYnLCBcclxuICAgICAgICAgICAgICAgICAgICAgICdUaMOhbmcgNycsICdUaMOhbmcgOCcsICdUaMOhbmcgOScsICdUaMOhbmcgMTAnLCAnVGjDoW5nIDExJywgJ1Row6FuZyAxMiddO1xyXG4gICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgIC8vIFThuqFvIGThu68gbGnhu4d1IGNobyB04bqldCBj4bqjIGPDoWMgdGjDoW5nLCBr4buDIGPhuqMgdGjDoW5nIGtow7RuZyBjw7MgZG9hbmggdGh1XHJcbiAgICAgIGNvbnN0IGNvbXBsZXRlRGF0YSA9IFtdO1xyXG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSAxMjsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgbW9udGhEYXRhID0gcmV2ZW51ZURhdGEuZmluZChpdGVtID0+IGl0ZW0ubW9udGggPT09IGkpO1xyXG4gICAgICAgIGNvbXBsZXRlRGF0YS5wdXNoKHtcclxuICAgICAgICAgIG5hbWU6IG1vbnRoc1tpIC0gMV0sXHJcbiAgICAgICAgICByZXZlbnVlOiBtb250aERhdGEgPyBtb250aERhdGEucmV2ZW51ZSA6IDBcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICByZXZlbnVlRGF0YSA9IGNvbXBsZXRlRGF0YTtcclxuICAgIH1cclxuXHJcbiAgICByZXMuanNvbihyZXZlbnVlRGF0YSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogJ8SQw6MgeOG6o3kgcmEgbOG7l2kga2hpIGzhuqV5IGThu68gbGnhu4d1IGRvYW5oIHRodScgfSk7XHJcbiAgfVxyXG59KTtcclxuXHJcbi8vIEzhuqV5IGRhbmggc8OhY2ggc+G6o24gcGjhuqltIGLDoW4gY2jhuqF5XHJcbnJvdXRlci5nZXQoJy90b3AtcHJvZHVjdHMnLCBhdXRoTWlkZGxld2FyZSwgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIEtp4buDbSB0cmEgeGVtIGPDsyBvcmRlciBuw6BvIGtow7RuZ1xyXG4gICAgY29uc3Qgb3JkZXJDb3VudCA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHsgc3RhdHVzOiAnY29tcGxldGVkJyB9KTtcclxuICAgIGlmIChvcmRlckNvdW50ID09PSAwKSB7XHJcbiAgICAgIHJldHVybiByZXMuanNvbihbXSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gUHJvZHVjdCBjb2xsZWN0aW9uIGPDsyBz4bqjbiBwaOG6qW0gbsOgbyBraMO0bmdcclxuICAgIGNvbnN0IHByb2R1Y3RDb3VudCA9IGF3YWl0IFByb2R1Y3QuY291bnREb2N1bWVudHMoKTtcclxuICAgIGlmIChwcm9kdWN0Q291bnQgPT09IDApIHtcclxuICAgICAgcmV0dXJuIHJlcy5qc29uKFtdKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBM4bqleSBt4bqrdSBt4buZdCDEkcahbiBow6BuZyDEkeG7gyBraeG7g20gdHJhIGPhuqV1IHRyw7pjIHRo4buxYyB04bq/XHJcbiAgICBjb25zdCBzYW1wbGVPcmRlciA9IGF3YWl0IE9yZGVyLmZpbmRPbmUoeyBzdGF0dXM6ICdjb21wbGV0ZWQnIH0pLmxlYW4oKTtcclxuXHJcbiAgICBjb25zdCB0b3BQcm9kdWN0cyA9IGF3YWl0IE9yZGVyLmFnZ3JlZ2F0ZShbXHJcbiAgICAgIHtcclxuICAgICAgICAkbWF0Y2g6IHsgc3RhdHVzOiAnY29tcGxldGVkJyB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICAkdW53aW5kOiB7XHJcbiAgICAgICAgICBwYXRoOiAnJHByb2R1Y3RzJyxcclxuICAgICAgICAgIHByZXNlcnZlTnVsbEFuZEVtcHR5QXJyYXlzOiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgICRsb29rdXA6IHtcclxuICAgICAgICAgIGZyb206ICdwcm9kdWN0cycsXHJcbiAgICAgICAgICBsb2NhbEZpZWxkOiAncHJvZHVjdHMucHJvZHVjdElkJyxcclxuICAgICAgICAgIGZvcmVpZ25GaWVsZDogJ19pZCcsXHJcbiAgICAgICAgICBhczogJ3Byb2R1Y3RJbmZvJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgICRncm91cDoge1xyXG4gICAgICAgICAgX2lkOiAnJHByb2R1Y3RzLnByb2R1Y3RJZCcsXHJcbiAgICAgICAgICBuYW1lOiB7IFxyXG4gICAgICAgICAgICAkZmlyc3Q6IHtcclxuICAgICAgICAgICAgICAkY29uZDogW1xyXG4gICAgICAgICAgICAgICAgeyAkZ3Q6IFt7ICRzaXplOiAnJHByb2R1Y3RJbmZvJyB9LCAwXSB9LFxyXG4gICAgICAgICAgICAgICAgeyAkYXJyYXlFbGVtQXQ6IFsnJHByb2R1Y3RJbmZvLnByb2R1Y3ROYW1lJywgMF0gfSxcclxuICAgICAgICAgICAgICAgICdT4bqjbiBwaOG6qW0ga2jDtG5nIHjDoWMgxJHhu4tuaCdcclxuICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc29sZDogeyAkc3VtOiAnJHByb2R1Y3RzLnF1YW50aXR5JyB9LFxyXG4gICAgICAgICAgcmV2ZW51ZTogeyAkc3VtOiB7ICRtdWx0aXBseTogWyckcHJvZHVjdHMucHJpY2UnLCAnJHByb2R1Y3RzLnF1YW50aXR5J10gfSB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgJHNvcnQ6IHsgcmV2ZW51ZTogLTEgfVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgJGxpbWl0OiAxMFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgJHByb2plY3Q6IHtcclxuICAgICAgICAgIF9pZDogMCxcclxuICAgICAgICAgIG5hbWU6IDEsXHJcbiAgICAgICAgICBzb2xkOiAxLFxyXG4gICAgICAgICAgcmV2ZW51ZTogMVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgXSk7XHJcblxyXG4gICAgcmVzLmpzb24odG9wUHJvZHVjdHMpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6ICfEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSBs4bqleSBkYW5oIHPDoWNoIHPhuqNuIHBo4bqpbSBiw6FuIGNo4bqheScgfSk7XHJcbiAgfVxyXG59KTtcclxuXHJcbi8vIEzhuqV5IGThu68gbGnhu4d1IHThu5NuIGtob1xyXG5yb3V0ZXIuZ2V0KCcvaW52ZW50b3J5JywgYXV0aE1pZGRsZXdhcmUsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIsSQYW5nIGzhuqV5IGThu68gbGnhu4d1IHThu5NuIGtoby4uLlwiKTtcclxuICAgIFxyXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gY8OzIHPhuqNuIHBo4bqpbSBuw6BvIGtow7RuZ1xyXG4gICAgY29uc3QgcHJvZHVjdENvdW50ID0gYXdhaXQgUHJvZHVjdC5jb3VudERvY3VtZW50cygpO1xyXG4gICAgY29uc29sZS5sb2coYFPhu5EgbMaw4bujbmcgc+G6o24gcGjhuqltOiAke3Byb2R1Y3RDb3VudH1gKTtcclxuICAgIFxyXG4gICAgaWYgKHByb2R1Y3RDb3VudCA9PT0gMCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIktow7RuZyBjw7Mgc+G6o24gcGjhuqltIG7DoG8gdHJvbmcgaOG7hyB0aOG7kW5nXCIpO1xyXG4gICAgICByZXR1cm4gcmVzLmpzb24oW10pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBM4bqleSBt4bqrdSBt4buZdCBz4bqjbiBwaOG6qW0gxJHhu4Mga2nhu4NtIHRyYSBj4bqldSB0csO6Y1xyXG4gICAgY29uc3Qgc2FtcGxlUHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZE9uZSgpLmxlYW4oKTtcclxuICAgIGNvbnNvbGUubG9nKFwiU2FtcGxlIHByb2R1Y3Qgc3RydWN0dXJlOlwiLCBKU09OLnN0cmluZ2lmeShzYW1wbGVQcm9kdWN0LCBudWxsLCAyKSk7XHJcbiAgICBcclxuICAgIC8vIEzhuqV5IGRhbmggc8OhY2ggY8OhYyBkYW5oIG3hu6VjXHJcbiAgICBjb25zdCBjYXRlZ29yaWVzID0gYXdhaXQgUHJvZHVjdC5kaXN0aW5jdCgncHJvZHVjdENhdGVnb3J5Jyk7XHJcbiAgICBjb25zb2xlLmxvZyhcIlByb2R1Y3QgY2F0ZWdvcmllczpcIiwgY2F0ZWdvcmllcyk7XHJcbiAgICBcclxuICAgIGlmICghY2F0ZWdvcmllcyB8fCBjYXRlZ29yaWVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIktow7RuZyB0w6xtIHRo4bqleSBkYW5oIG3hu6VjIHPhuqNuIHBo4bqpbVwiKTtcclxuICAgICAgcmV0dXJuIHJlcy5qc29uKFtdKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUw61uaCB04buVbmcgdOG7k24ga2hvIHRoZW8gZGFuaCBt4bulY1xyXG4gICAgY29uc3QgaW52ZW50b3J5ID0gYXdhaXQgUHJvZHVjdC5hZ2dyZWdhdGUoW1xyXG4gICAgICB7XHJcbiAgICAgICAgJGdyb3VwOiB7XHJcbiAgICAgICAgICBfaWQ6ICckcHJvZHVjdENhdGVnb3J5JyxcclxuICAgICAgICAgIHN0b2NrOiB7ICRzdW06ICckcHJvZHVjdFN0b2NrJyB9LFxyXG4gICAgICAgICAgbG93U3RvY2s6IHsgJHN1bTogeyAkY29uZDogW3sgJGx0OiBbJyRwcm9kdWN0U3RvY2snLCAxMF0gfSwgMSwgMF0gfSB9LFxyXG4gICAgICAgICAgdmFsdWU6IHsgJHN1bTogJyRwcm9kdWN0U3RvY2snIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICAkc29ydDogeyBzdG9jazogLTEgfVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgJHByb2plY3Q6IHtcclxuICAgICAgICAgIF9pZDogMCxcclxuICAgICAgICAgIG5hbWU6ICckX2lkJyxcclxuICAgICAgICAgIHN0b2NrOiAxLFxyXG4gICAgICAgICAgbG93U3RvY2s6IDEsXHJcbiAgICAgICAgICB2YWx1ZTogMVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgXSk7XHJcblxyXG4gICAgLy8gTG9nIGvhur90IHF14bqjIHRyxrDhu5tjIGtoaSB0cuG6oyB24buBXHJcbiAgICBjb25zb2xlLmxvZyhcIkludmVudG9yeSBkYXRhIHJlc3VsdDpcIiwgaW52ZW50b3J5KTtcclxuICAgIFxyXG4gICAgaWYgKGludmVudG9yeS5sZW5ndGggPT09IDApIHtcclxuICAgICAgY29uc29sZS5sb2coXCJLaMO0bmcgdMOsbSB0aOG6pXkgZOG7ryBsaeG7h3UgdOG7k24ga2hvXCIpO1xyXG4gICAgICByZXR1cm4gcmVzLmpzb24oW10pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXMuanNvbihpbnZlbnRvcnkpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgbOG6pXkgZOG7ryBsaeG7h3UgdOG7k24ga2hvOicsIGVycm9yKTtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogJ8SQw6MgeOG6o3kgcmEgbOG7l2kga2hpIGzhuqV5IGThu68gbGnhu4d1IHThu5NuIGtobycgfSk7XHJcbiAgfVxyXG59KTtcclxuXHJcbi8vIEzhuqV5IGThu68gbGnhu4d1IG5nxrDhu51pIGTDuW5nXHJcbnJvdXRlci5nZXQoJy91c2VycycsIGF1dGhNaWRkbGV3YXJlLCBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc29sZS5sb2coXCLEkGFuZyBs4bqleSBk4buvIGxp4buHdSBuZ8aw4budaSBkw7luZy4uLlwiKTtcclxuICAgIFxyXG4gICAgY29uc3QgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgY29uc3QgdGhpcnR5RGF5c0FnbyA9IG5ldyBEYXRlKGN1cnJlbnREYXRlKTtcclxuICAgIHRoaXJ0eURheXNBZ28uc2V0RGF0ZShjdXJyZW50RGF0ZS5nZXREYXRlKCkgLSAzMCk7XHJcbiAgICBcclxuICAgIC8vIFThu5VuZyBz4buRIG5nxrDhu51pIGTDuW5nXHJcbiAgICBjb25zdCB0b3RhbFVzZXJzID0gYXdhaXQgVXNlci5jb3VudERvY3VtZW50cyh7fSk7XHJcbiAgICBcclxuICAgIC8vIE5nxrDhu51pIGTDuW5nIG3hu5tpIHRyb25nIDMwIG5nw6B5IHF1YVxyXG4gICAgY29uc3QgbmV3VXNlcnMgPSBhd2FpdCBVc2VyLmNvdW50RG9jdW1lbnRzKHtcclxuICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHRoaXJ0eURheXNBZ28gfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIE5nxrDhu51pIGTDuW5nIGhv4bqhdCDEkeG7mW5nIChjw7MgxJHGoW4gaMOgbmcgdHJvbmcgMzAgbmfDoHkpXHJcbiAgICBjb25zdCBhY3RpdmVVc2VycyA9IGF3YWl0IE9yZGVyLmFnZ3JlZ2F0ZShbXHJcbiAgICAgIHtcclxuICAgICAgICAkbWF0Y2g6IHtcclxuICAgICAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiB0aGlydHlEYXlzQWdvIH0sXHJcbiAgICAgICAgICB1c2VySWQ6IHsgJGV4aXN0czogdHJ1ZSwgJG5lOiBudWxsIH0gLy8gxJDhuqNtIGLhuqNvIHVzZXJJZCB04buTbiB04bqhaSB2w6Aga2jDtG5nIHBo4bqjaSBudWxsXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgJGdyb3VwOiB7XHJcbiAgICAgICAgICBfaWQ6ICckdXNlcklkJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgICRjb3VudDogJ2NvdW50J1xyXG4gICAgICB9XHJcbiAgICBdKTtcclxuICAgIFxyXG4gICAgY29uc3QgYWN0aXZlVXNlcnNDb3VudCA9IGFjdGl2ZVVzZXJzLmxlbmd0aCA+IDAgPyBhY3RpdmVVc2Vyc1swXS5jb3VudCA6IDA7XHJcbiAgICBcclxuICAgIC8vIEtow6FjaCB2w6NuZyBsYWkgKGPDsyDEkcahbiBow6BuZyBuaMawbmcga2jDtG5nIGPDsyB0w6BpIGtob+G6o24pXHJcbiAgICBjb25zdCBndWVzdE9yZGVycyA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKHtcclxuICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHRoaXJ0eURheXNBZ28gfSxcclxuICAgICAgJG9yOiBbXHJcbiAgICAgICAgeyB1c2VySWQ6IHsgJGV4aXN0czogZmFsc2UgfSB9LFxyXG4gICAgICAgIHsgdXNlcklkOiBudWxsIH1cclxuICAgICAgXVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgdXNlckRhdGEgPSBbXHJcbiAgICAgIHsgbmFtZTogJ05nxrDhu51pIGTDuW5nIG3hu5tpJywgY291bnQ6IG5ld1VzZXJzLCBjb2xvcjogJyM4ODg0ZDgnIH0sXHJcbiAgICAgIHsgbmFtZTogJ0tow6FjaCBow6BuZyB0aMOibiB0aGnhur90JywgY291bnQ6IGFjdGl2ZVVzZXJzQ291bnQsIGNvbG9yOiAnIzgyY2E5ZCcgfSxcclxuICAgICAgeyBuYW1lOiAnS2jDoWNoIHbDo25nIGxhaScsIGNvdW50OiBndWVzdE9yZGVycywgY29sb3I6ICcjZmZjNjU4JyB9XHJcbiAgICBdO1xyXG5cclxuICAgIC8vIExvZyBr4bq/dCBxdeG6oyB0csaw4bubYyBraGkgdHLhuqMgduG7gVxyXG4gICAgY29uc29sZS5sb2coXCJVc2VyIGRhdGEgcmVzdWx0OlwiLCB1c2VyRGF0YSk7XHJcbiAgICByZXMuanNvbih1c2VyRGF0YSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0zhu5dpIGtoaSBs4bqleSBk4buvIGxp4buHdSBuZ8aw4budaSBkw7luZzonLCBlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IG1lc3NhZ2U6ICfEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSBs4bqleSBk4buvIGxp4buHdSBuZ8aw4budaSBkw7luZycgfSk7XHJcbiAgfVxyXG59KTtcclxuXHJcbi8vIFRow6ptIGVuZHBvaW50IGtp4buDbSB0cmEgY+G6pXUgdHLDumMgT3JkZXJcclxucm91dGVyLmdldCgnL3Rlc3Qtc3RydWN0dXJlJywgYXV0aE1pZGRsZXdhcmUsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBvcmRlcnMgPSBhd2FpdCBPcmRlci5maW5kKCkubGltaXQoMSk7XHJcbiAgICBjb25zdCBwcm9kdWN0cyA9IGF3YWl0IFByb2R1Y3QuZmluZCgpLmxpbWl0KDEpO1xyXG4gICAgY29uc3QgdXNlcnMgPSBhd2FpdCBVc2VyLmZpbmQoKS5saW1pdCgxKTtcclxuICAgIFxyXG4gICAgY29uc3Qgb3JkZXJDb3VudCA9IGF3YWl0IE9yZGVyLmNvdW50RG9jdW1lbnRzKCk7XHJcbiAgICBjb25zdCBwcm9kdWN0Q291bnQgPSBhd2FpdCBQcm9kdWN0LmNvdW50RG9jdW1lbnRzKCk7XHJcbiAgICBjb25zdCB1c2VyQ291bnQgPSBhd2FpdCBVc2VyLmNvdW50RG9jdW1lbnRzKCk7XHJcbiAgICBcclxuICAgIGNvbnN0IG9yZGVyU3RhdHVzID0gYXdhaXQgT3JkZXIuYWdncmVnYXRlKFtcclxuICAgICAgeyAkZ3JvdXA6IHsgX2lkOiBcIiRzdGF0dXNcIiwgY291bnQ6IHsgJHN1bTogMSB9IH0gfVxyXG4gICAgXSk7XHJcbiAgICBcclxuICAgIGNvbnN0IGNhdGVnb3JpZXMgPSBhd2FpdCBDYXRlZ29yeS5maW5kKCk7XHJcbiAgICBcclxuICAgIHJlcy5qc29uKHsgXHJcbiAgICAgIG1lc3NhZ2U6IFwiQ+G6pXUgdHLDumMgZOG7ryBsaeG7h3UgxJHDoyDEkcaw4bujYyBraeG7g20gdHJhXCIsXHJcbiAgICAgIG9yZGVyQ291bnQsXHJcbiAgICAgIHByb2R1Y3RDb3VudCxcclxuICAgICAgdXNlckNvdW50LFxyXG4gICAgICBvcmRlclN0YXR1cyxcclxuICAgICAgY2F0ZWdvcmllc1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbWVzc2FnZTogJ8SQw6MgeOG6o3kgcmEgbOG7l2kga2hpIGtp4buDbSB0cmEgY+G6pXUgdHLDumMgZOG7ryBsaeG7h3UnIH0pO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7ICJdLCJtYXBwaW5ncyI6Im9HQUFBLElBQUFBLFFBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxNQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxTQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxTQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxlQUFBLEdBQUFMLE9BQUEsb0NBQWdGLFNBQUFELHVCQUFBTyxDQUFBLFVBQUFBLENBQUEsSUFBQUEsQ0FBQSxDQUFBQyxVQUFBLEdBQUFELENBQUEsS0FBQUUsT0FBQSxFQUFBRixDQUFBLElBTGhGLE1BQU1HLE1BQU0sR0FBR0MsZ0JBQU8sQ0FBQ0MsTUFBTSxDQUFDLENBQUM7O0FBTy9CO0FBQ0FGLE1BQU0sQ0FBQ0csR0FBRyxDQUFDLFVBQVUsRUFBRUMsMkJBQWMsRUFBRSxPQUFPQyxHQUFHLEVBQUVDLEdBQUcsS0FBSztFQUN6RCxJQUFJO0lBQ0YsTUFBTSxFQUFFQyxTQUFTLENBQUMsQ0FBQyxHQUFHRixHQUFHLENBQUNHLEtBQUs7O0lBRS9CO0lBQ0EsTUFBTUMsbUJBQW1CLEdBQUcsTUFBTUMsY0FBSyxDQUFDQyxjQUFjLENBQUMsRUFBRUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7O0lBRS9F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