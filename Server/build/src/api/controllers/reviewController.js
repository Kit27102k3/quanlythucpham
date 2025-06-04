"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.updateReview = exports.replyToReview = exports.recalculateAllReviewStats = exports.getProductReviews = exports.getProductReviewStats = exports.deleteReview = exports.createReview = void 0;var _Review = _interopRequireDefault(require("../../Model/Review.js"));
var _Products = _interopRequireDefault(require("../../Model/Products.js"));
var _User = _interopRequireDefault(require("../../Model/User.js"));
var _ReviewStats = _interopRequireDefault(require("../../Model/ReviewStats.js"));
var _mongoose = _interopRequireDefault(require("mongoose"));

// Tạo đánh giá mới
const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await _Products.default.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    const existingReview = await _Review.default.findOne({ userId, productId });
    if (existingReview) {
      return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này rồi" });
    }

    // Lấy thông tin người dùng
    const user = await _User.default.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy thông tin người dùng" });
    }

    // Tạo đánh giá mới
    const newReview = new _Review.default({
      userId,
      productId,
      rating,
      comment,
      userName: user.username || `${user.firstName} ${user.lastName}`,
      userImage: user.avatar || "",
      // Kiểm tra xem người dùng đã mua sản phẩm chưa (có thể làm phức tạp hơn sau)
      isVerified: true
    });

    // Lưu đánh giá
    await newReview.save();

    // Cập nhật thống kê đánh giá
    await _ReviewStats.default.updateReviewStats(productId);

    res.status(201).json({
      success: true,
      data: newReview,
      message: "Đánh giá sản phẩm thành công"
    });
  } catch (error) {
    console.error("Lỗi khi tạo đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tạo đánh giá",
      error: error.message
    });
  }
};

// Lấy tất cả đánh giá của một sản phẩm
exports.createReview = createReview;const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    // Xác thực productId
    if (!_mongoose.default.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ"
      });
    }

    // Tìm tất cả đánh giá được công khai
    const reviews = await _Review.default.find({
      productId,
      isPublished: true
    }).
    sort(sort).
    skip((page - 1) * limit).
    limit(parseInt(limit)).
    populate("userId", "username firstName lastName avatar");

    // Đếm tổng số đánh giá
    const totalReviews = await _Review.default.countDocuments({
      productId,
      isPublished: true
    });

    // Lấy thống kê đánh giá
    let stats = await _ReviewStats.default.findOne({ productId });

    // Nếu chưa có thống kê, tạo mới
    if (!stats) {
      stats = await _ReviewStats.default.updateReviewStats(productId);
    }

    res.status(200).json({
      success: true,
      data: {
        reviews,
        totalReviews,
        stats: {
          averageRating: stats && stats.averageRating ? stats.averageRating : 0,
          totalReviews: stats && stats.totalReviews ? stats.totalReviews : 0,
          ratingDistribution: stats && stats.ratingDistribution ? stats.ratingDistribution : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          percentages: stats && typeof stats.getStarPercentages === 'function' ? stats.getStarPercentages() : {
            oneStar: 0,
            twoStar: 0,
            threeStar: 0,
            fourStar: 0,
            fiveStar: 0
          }
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalItems: totalReviews,
          itemsPerPage: parseInt(limit)
        }
      },
      message: "Lấy danh sách đánh giá thành công"
    });
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy đánh giá",
      error: error.message
    });
  }
};

// Cập nhật đánh giá
exports.getProductReviews = getProductReviews;const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Tìm đánh giá
    const review = await _Review.default.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá"
      });
    }

    // Kiểm tra quyền sở hữu
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật đánh giá này"
      });
    }

    // Cập nhật đánh giá
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    // Cập nhật thống kê đánh giá
    await _ReviewStats.default.updateReviewStats(review.productId);

    res.status(200).json({
      success: true,
      data: review,
      message: "Cập nhật đánh giá thành công"
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật đánh giá",
      error: error.message
    });
  }
};

// Xóa đánh giá
exports.updateReview = updateReview;const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Tìm đánh giá
    const review = await _Review.default.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá"
      });
    }

    // Kiểm tra quyền sở hữu hoặc admin
    if (review.userId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa đánh giá này"
      });
    }

    // Lưu lại productId trước khi xóa
    const productId = review.productId;

    // Xóa đánh giá
    await review.remove();

    // Cập nhật thống kê đánh giá
    await _ReviewStats.default.updateReviewStats(productId);

    res.status(200).json({
      success: true,
      message: "Xóa đánh giá thành công"
    });
  } catch (error) {
    console.error("Lỗi khi xóa đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa đánh giá",
      error: error.message
    });
  }
};

// Phản hồi đánh giá (dành cho admin)
exports.deleteReview = deleteReview;const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Nội dung phản hồi không được để trống"
      });
    }

    // Tìm đánh giá
    const review = await _Review.default.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá"
      });
    }

    // Lấy thông tin người dùng
    const user = await _User.default.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng"
      });
    }

    // Tạo phản hồi mới
    const reply = {
      userId,
      adminId: isAdmin ? userId : null,
      userName: user.username || `${user.firstName} ${user.lastName}`,
      text,
      isAdmin
    };

    // Thêm phản hồi vào mảng replies
    review.replies.push(reply);
    await review.save();

    res.status(201).json({
      success: true,
      data: review,
      message: "Phản hồi đánh giá thành công"
    });
  } catch (error) {
    console.error("Lỗi khi phản hồi đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi phản hồi đánh giá",
      error: error.message
    });
  }
};

// Lấy thống kê đánh giá của sản phẩm
exports.replyToReview = replyToReview;const getProductReviewStats = async (req, res) => {
  try {
    const { productId } = req.params;

    // Xác thực productId
    if (!_mongoose.default.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ"
      });
    }

    // Tìm hoặc tạo thống kê
    let stats = await _ReviewStats.default.findOne({ productId });

    // Nếu chưa có thống kê, tạo mới
    if (!stats) {
      stats = await _ReviewStats.default.updateReviewStats(productId);
    }

    // Nếu vẫn không có, trả về giá trị mặc định
    if (!stats) {
      return res.status(200).json({
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          percentages: {
            oneStar: 0,
            twoStar: 0,
            threeStar: 0,
            fourStar: 0,
            fiveStar: 0
          }
        },
        message: "Không có đánh giá nào cho sản phẩm này"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews,
        verifiedReviews: stats.verifiedReviews,
        ratingDistribution: stats.ratingDistribution,
        percentages: stats.getStarPercentages(),
        lastUpdated: stats.lastUpdated
      },
      message: "Lấy thống kê đánh giá thành công"
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy thống kê đánh giá",
      error: error.message
    });
  }
};

// Cập nhật lại tất cả thống kê đánh giá (route dành cho admin)
exports.getProductReviewStats = getProductReviewStats;const recalculateAllReviewStats = async (req, res) => {
  try {
    // Xác thực quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện tác vụ này"
      });
    }

    // Lấy tất cả sản phẩm có đánh giá
    const productsWithReviews = await _Review.default.distinct("productId");

    // Cập nhật từng sản phẩm
    const results = await Promise.all(
      productsWithReviews.map(async (productId) => {
        const stats = await _ReviewStats.default.updateReviewStats(productId);
        return { productId, success: !!stats };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalUpdated: results.filter((r) => r.success).length,
        totalProducts: results.length,
        results
      },
      message: "Cập nhật lại tất cả thống kê đánh giá thành công"
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật lại tất cả thống kê đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật lại tất cả thống kê đánh giá",
      error: error.message
    });
  }
};exports.recalculateAllReviewStats = recalculateAllReviewStats;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfUmV2aWV3IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfUHJvZHVjdHMiLCJfVXNlciIsIl9SZXZpZXdTdGF0cyIsIl9tb25nb29zZSIsImNyZWF0ZVJldmlldyIsInJlcSIsInJlcyIsInByb2R1Y3RJZCIsInJhdGluZyIsImNvbW1lbnQiLCJib2R5IiwidXNlcklkIiwidXNlciIsImlkIiwicHJvZHVjdCIsIlByb2R1Y3QiLCJmaW5kQnlJZCIsInN0YXR1cyIsImpzb24iLCJtZXNzYWdlIiwiZXhpc3RpbmdSZXZpZXciLCJSZXZpZXciLCJmaW5kT25lIiwiVXNlciIsIm5ld1JldmlldyIsInVzZXJOYW1lIiwidXNlcm5hbWUiLCJmaXJzdE5hbWUiLCJsYXN0TmFtZSIsInVzZXJJbWFnZSIsImF2YXRhciIsImlzVmVyaWZpZWQiLCJzYXZlIiwiUmV2aWV3U3RhdHMiLCJ1cGRhdGVSZXZpZXdTdGF0cyIsInN1Y2Nlc3MiLCJkYXRhIiwiZXJyb3IiLCJjb25zb2xlIiwiZXhwb3J0cyIsImdldFByb2R1Y3RSZXZpZXdzIiwicGFyYW1zIiwicGFnZSIsImxpbWl0Iiwic29ydCIsInF1ZXJ5IiwibW9uZ29vc2UiLCJUeXBlcyIsIk9iamVjdElkIiwiaXNWYWxpZCIsInJldmlld3MiLCJmaW5kIiwiaXNQdWJsaXNoZWQiLCJza2lwIiwicGFyc2VJbnQiLCJwb3B1bGF0ZSIsInRvdGFsUmV2aWV3cyIsImNvdW50RG9jdW1lbnRzIiwic3RhdHMiLCJhdmVyYWdlUmF0aW5nIiwicmF0aW5nRGlzdHJpYnV0aW9uIiwicGVyY2VudGFnZXMiLCJnZXRTdGFyUGVyY2VudGFnZXMiLCJvbmVTdGFyIiwidHdvU3RhciIsInRocmVlU3RhciIsImZvdXJTdGFyIiwiZml2ZVN0YXIiLCJwYWdpbmF0aW9uIiwiY3VycmVudFBhZ2UiLCJ0b3RhbFBhZ2VzIiwiTWF0aCIsImNlaWwiLCJ0b3RhbEl0ZW1zIiwiaXRlbXNQZXJQYWdlIiwidXBkYXRlUmV2aWV3IiwicmV2aWV3IiwidG9TdHJpbmciLCJkZWxldGVSZXZpZXciLCJyb2xlIiwicmVtb3ZlIiwicmVwbHlUb1JldmlldyIsInRleHQiLCJpc0FkbWluIiwicmVwbHkiLCJhZG1pbklkIiwicmVwbGllcyIsInB1c2giLCJnZXRQcm9kdWN0UmV2aWV3U3RhdHMiLCJ2ZXJpZmllZFJldmlld3MiLCJsYXN0VXBkYXRlZCIsInJlY2FsY3VsYXRlQWxsUmV2aWV3U3RhdHMiLCJwcm9kdWN0c1dpdGhSZXZpZXdzIiwiZGlzdGluY3QiLCJyZXN1bHRzIiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsInRvdGFsVXBkYXRlZCIsImZpbHRlciIsInIiLCJsZW5ndGgiLCJ0b3RhbFByb2R1Y3RzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaS9jb250cm9sbGVycy9yZXZpZXdDb250cm9sbGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZXZpZXcgZnJvbSBcIi4uLy4uL01vZGVsL1Jldmlldy5qc1wiO1xyXG5pbXBvcnQgUHJvZHVjdCBmcm9tIFwiLi4vLi4vTW9kZWwvUHJvZHVjdHMuanNcIjtcclxuaW1wb3J0IFVzZXIgZnJvbSBcIi4uLy4uL01vZGVsL1VzZXIuanNcIjtcclxuaW1wb3J0IFJldmlld1N0YXRzIGZyb20gXCIuLi8uLi9Nb2RlbC9SZXZpZXdTdGF0cy5qc1wiO1xyXG5pbXBvcnQgbW9uZ29vc2UgZnJvbSBcIm1vbmdvb3NlXCI7XHJcblxyXG4vLyBU4bqhbyDEkcOhbmggZ2nDoSBt4bubaVxyXG5leHBvcnQgY29uc3QgY3JlYXRlUmV2aWV3ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgcHJvZHVjdElkLCByYXRpbmcsIGNvbW1lbnQgfSA9IHJlcS5ib2R5O1xyXG4gICAgY29uc3QgdXNlcklkID0gcmVxLnVzZXIuaWQ7XHJcblxyXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gc+G6o24gcGjhuqltIGPDsyB04buTbiB04bqhaSBraMO0bmdcclxuICAgIGNvbnN0IHByb2R1Y3QgPSBhd2FpdCBQcm9kdWN0LmZpbmRCeUlkKHByb2R1Y3RJZCk7XHJcbiAgICBpZiAoIXByb2R1Y3QpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gbmfGsOG7nWkgZMO5bmcgxJHDoyDEkcOhbmggZ2nDoSBz4bqjbiBwaOG6qW0gbsOgeSBjaMawYVxyXG4gICAgY29uc3QgZXhpc3RpbmdSZXZpZXcgPSBhd2FpdCBSZXZpZXcuZmluZE9uZSh7IHVzZXJJZCwgcHJvZHVjdElkIH0pO1xyXG4gICAgaWYgKGV4aXN0aW5nUmV2aWV3KSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IG1lc3NhZ2U6IFwiQuG6oW4gxJHDoyDEkcOhbmggZ2nDoSBz4bqjbiBwaOG6qW0gbsOgeSBy4buTaVwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEzhuqV5IHRow7RuZyB0aW4gbmfGsOG7nWkgZMO5bmdcclxuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBVc2VyLmZpbmRCeUlkKHVzZXJJZCk7XHJcbiAgICBpZiAoIXVzZXIpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgdGjDtG5nIHRpbiBuZ8aw4budaSBkw7luZ1wiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFThuqFvIMSRw6FuaCBnacOhIG3hu5tpXHJcbiAgICBjb25zdCBuZXdSZXZpZXcgPSBuZXcgUmV2aWV3KHtcclxuICAgICAgdXNlcklkLFxyXG4gICAgICBwcm9kdWN0SWQsXHJcbiAgICAgIHJhdGluZyxcclxuICAgICAgY29tbWVudCxcclxuICAgICAgdXNlck5hbWU6IHVzZXIudXNlcm5hbWUgfHwgYCR7dXNlci5maXJzdE5hbWV9ICR7dXNlci5sYXN0TmFtZX1gLFxyXG4gICAgICB1c2VySW1hZ2U6IHVzZXIuYXZhdGFyIHx8IFwiXCIsXHJcbiAgICAgIC8vIEtp4buDbSB0cmEgeGVtIG5nxrDhu51pIGTDuW5nIMSRw6MgbXVhIHPhuqNuIHBo4bqpbSBjaMawYSAoY8OzIHRo4buDIGzDoG0gcGjhu6ljIHThuqFwIGjGoW4gc2F1KVxyXG4gICAgICBpc1ZlcmlmaWVkOiB0cnVlLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTMawdSDEkcOhbmggZ2nDoVxyXG4gICAgYXdhaXQgbmV3UmV2aWV3LnNhdmUoKTtcclxuXHJcbiAgICAvLyBD4bqtcCBuaOG6rXQgdGjhu5FuZyBrw6ogxJHDoW5oIGdpw6FcclxuICAgIGF3YWl0IFJldmlld1N0YXRzLnVwZGF0ZVJldmlld1N0YXRzKHByb2R1Y3RJZCk7XHJcblxyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBkYXRhOiBuZXdSZXZpZXcsXHJcbiAgICAgIG1lc3NhZ2U6IFwixJDDoW5oIGdpw6Egc+G6o24gcGjhuqltIHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgdOG6oW8gxJHDoW5oIGdpw6E6XCIsIGVycm9yKTtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwiQ8OzIGzhu5dpIHjhuqN5IHJhIGtoaSB04bqhbyDEkcOhbmggZ2nDoVwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEzhuqV5IHThuqV0IGPhuqMgxJHDoW5oIGdpw6EgY+G7p2EgbeG7mXQgc+G6o24gcGjhuqltXHJcbmV4cG9ydCBjb25zdCBnZXRQcm9kdWN0UmV2aWV3cyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IHByb2R1Y3RJZCB9ID0gcmVxLnBhcmFtcztcclxuICAgIGNvbnN0IHsgcGFnZSA9IDEsIGxpbWl0ID0gMTAsIHNvcnQgPSBcIi1jcmVhdGVkQXRcIiB9ID0gcmVxLnF1ZXJ5O1xyXG5cclxuICAgIC8vIFjDoWMgdGjhu7FjIHByb2R1Y3RJZFxyXG4gICAgaWYgKCFtb25nb29zZS5UeXBlcy5PYmplY3RJZC5pc1ZhbGlkKHByb2R1Y3RJZCkpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIklEIHPhuqNuIHBo4bqpbSBraMO0bmcgaOG7o3AgbOG7h1wiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUw6xtIHThuqV0IGPhuqMgxJHDoW5oIGdpw6EgxJHGsOG7o2MgY8O0bmcga2hhaVxyXG4gICAgY29uc3QgcmV2aWV3cyA9IGF3YWl0IFJldmlldy5maW5kKHtcclxuICAgICAgcHJvZHVjdElkLFxyXG4gICAgICBpc1B1Ymxpc2hlZDogdHJ1ZSxcclxuICAgIH0pXHJcbiAgICAgIC5zb3J0KHNvcnQpXHJcbiAgICAgIC5za2lwKChwYWdlIC0gMSkgKiBsaW1pdClcclxuICAgICAgLmxpbWl0KHBhcnNlSW50KGxpbWl0KSlcclxuICAgICAgLnBvcHVsYXRlKFwidXNlcklkXCIsIFwidXNlcm5hbWUgZmlyc3ROYW1lIGxhc3ROYW1lIGF2YXRhclwiKTtcclxuXHJcbiAgICAvLyDEkOG6v20gdOG7lW5nIHPhu5EgxJHDoW5oIGdpw6FcclxuICAgIGNvbnN0IHRvdGFsUmV2aWV3cyA9IGF3YWl0IFJldmlldy5jb3VudERvY3VtZW50cyh7XHJcbiAgICAgIHByb2R1Y3RJZCxcclxuICAgICAgaXNQdWJsaXNoZWQ6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBM4bqleSB0aOG7kW5nIGvDqiDEkcOhbmggZ2nDoVxyXG4gICAgbGV0IHN0YXRzID0gYXdhaXQgUmV2aWV3U3RhdHMuZmluZE9uZSh7IHByb2R1Y3RJZCB9KTtcclxuICAgIFxyXG4gICAgLy8gTuG6v3UgY2jGsGEgY8OzIHRo4buRbmcga8OqLCB04bqhbyBt4bubaVxyXG4gICAgaWYgKCFzdGF0cykge1xyXG4gICAgICBzdGF0cyA9IGF3YWl0IFJldmlld1N0YXRzLnVwZGF0ZVJldmlld1N0YXRzKHByb2R1Y3RJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgcmV2aWV3cyxcclxuICAgICAgICB0b3RhbFJldmlld3MsXHJcbiAgICAgICAgc3RhdHM6IHtcclxuICAgICAgICAgIGF2ZXJhZ2VSYXRpbmc6IHN0YXRzICYmIHN0YXRzLmF2ZXJhZ2VSYXRpbmcgPyBzdGF0cy5hdmVyYWdlUmF0aW5nIDogMCxcclxuICAgICAgICAgIHRvdGFsUmV2aWV3czogc3RhdHMgJiYgc3RhdHMudG90YWxSZXZpZXdzID8gc3RhdHMudG90YWxSZXZpZXdzIDogMCxcclxuICAgICAgICAgIHJhdGluZ0Rpc3RyaWJ1dGlvbjogc3RhdHMgJiYgc3RhdHMucmF0aW5nRGlzdHJpYnV0aW9uID8gc3RhdHMucmF0aW5nRGlzdHJpYnV0aW9uIDogeyAxOiAwLCAyOiAwLCAzOiAwLCA0OiAwLCA1OiAwIH0sXHJcbiAgICAgICAgICBwZXJjZW50YWdlczogc3RhdHMgJiYgdHlwZW9mIHN0YXRzLmdldFN0YXJQZXJjZW50YWdlcyA9PT0gJ2Z1bmN0aW9uJyA/IHN0YXRzLmdldFN0YXJQZXJjZW50YWdlcygpIDoge1xyXG4gICAgICAgICAgICBvbmVTdGFyOiAwLFxyXG4gICAgICAgICAgICB0d29TdGFyOiAwLFxyXG4gICAgICAgICAgICB0aHJlZVN0YXI6IDAsXHJcbiAgICAgICAgICAgIGZvdXJTdGFyOiAwLFxyXG4gICAgICAgICAgICBmaXZlU3RhcjogMCxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBhZ2luYXRpb246IHtcclxuICAgICAgICAgIGN1cnJlbnRQYWdlOiBwYXJzZUludChwYWdlKSxcclxuICAgICAgICAgIHRvdGFsUGFnZXM6IE1hdGguY2VpbCh0b3RhbFJldmlld3MgLyBsaW1pdCksXHJcbiAgICAgICAgICB0b3RhbEl0ZW1zOiB0b3RhbFJldmlld3MsXHJcbiAgICAgICAgICBpdGVtc1BlclBhZ2U6IHBhcnNlSW50KGxpbWl0KSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBtZXNzYWdlOiBcIkzhuqV5IGRhbmggc8OhY2ggxJHDoW5oIGdpw6EgdGjDoG5oIGPDtG5nXCIsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBs4bqleSDEkcOhbmggZ2nDoTpcIiwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCJDw7MgbOG7l2kgeOG6o3kgcmEga2hpIGzhuqV5IMSRw6FuaCBnacOhXCIsXHJcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gQ+G6rXAgbmjhuq10IMSRw6FuaCBnacOhXHJcbmV4cG9ydCBjb25zdCB1cGRhdGVSZXZpZXcgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBpZCB9ID0gcmVxLnBhcmFtcztcclxuICAgIGNvbnN0IHsgcmF0aW5nLCBjb21tZW50IH0gPSByZXEuYm9keTtcclxuICAgIGNvbnN0IHVzZXJJZCA9IHJlcS51c2VyLmlkO1xyXG5cclxuICAgIC8vIFTDrG0gxJHDoW5oIGdpw6FcclxuICAgIGNvbnN0IHJldmlldyA9IGF3YWl0IFJldmlldy5maW5kQnlJZChpZCk7XHJcbiAgICBpZiAoIXJldmlldykge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRw6FuaCBnacOhXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEtp4buDbSB0cmEgcXV54buBbiBz4bufIGjhu691XHJcbiAgICBpZiAocmV2aWV3LnVzZXJJZC50b1N0cmluZygpICE9PSB1c2VySWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIkLhuqFuIGtow7RuZyBjw7MgcXV54buBbiBj4bqtcCBuaOG6rXQgxJHDoW5oIGdpw6EgbsOgeVwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBD4bqtcCBuaOG6rXQgxJHDoW5oIGdpw6FcclxuICAgIHJldmlldy5yYXRpbmcgPSByYXRpbmcgfHwgcmV2aWV3LnJhdGluZztcclxuICAgIHJldmlldy5jb21tZW50ID0gY29tbWVudCB8fCByZXZpZXcuY29tbWVudDtcclxuICAgIGF3YWl0IHJldmlldy5zYXZlKCk7XHJcblxyXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRo4buRbmcga8OqIMSRw6FuaCBnacOhXHJcbiAgICBhd2FpdCBSZXZpZXdTdGF0cy51cGRhdGVSZXZpZXdTdGF0cyhyZXZpZXcucHJvZHVjdElkKTtcclxuXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGRhdGE6IHJldmlldyxcclxuICAgICAgbWVzc2FnZTogXCJD4bqtcCBuaOG6rXQgxJHDoW5oIGdpw6EgdGjDoG5oIGPDtG5nXCIsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgxJHDoW5oIGdpw6E6XCIsIGVycm9yKTtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwiQ8OzIGzhu5dpIHjhuqN5IHJhIGtoaSBj4bqtcCBuaOG6rXQgxJHDoW5oIGdpw6FcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBYw7NhIMSRw6FuaCBnacOhXHJcbmV4cG9ydCBjb25zdCBkZWxldGVSZXZpZXcgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBpZCB9ID0gcmVxLnBhcmFtcztcclxuICAgIGNvbnN0IHVzZXJJZCA9IHJlcS51c2VyLmlkO1xyXG5cclxuICAgIC8vIFTDrG0gxJHDoW5oIGdpw6FcclxuICAgIGNvbnN0IHJldmlldyA9IGF3YWl0IFJldmlldy5maW5kQnlJZChpZCk7XHJcbiAgICBpZiAoIXJldmlldykge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRw6FuaCBnacOhXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEtp4buDbSB0cmEgcXV54buBbiBz4bufIGjhu691IGhv4bq3YyBhZG1pblxyXG4gICAgaWYgKHJldmlldy51c2VySWQudG9TdHJpbmcoKSAhPT0gdXNlcklkICYmIHJlcS51c2VyLnJvbGUgIT09IFwiYWRtaW5cIikge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiQuG6oW4ga2jDtG5nIGPDsyBxdXnhu4FuIHjDs2EgxJHDoW5oIGdpw6EgbsOgeVwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBMxrB1IGzhuqFpIHByb2R1Y3RJZCB0csaw4bubYyBraGkgeMOzYVxyXG4gICAgY29uc3QgcHJvZHVjdElkID0gcmV2aWV3LnByb2R1Y3RJZDtcclxuXHJcbiAgICAvLyBYw7NhIMSRw6FuaCBnacOhXHJcbiAgICBhd2FpdCByZXZpZXcucmVtb3ZlKCk7XHJcblxyXG4gICAgLy8gQ+G6rXAgbmjhuq10IHRo4buRbmcga8OqIMSRw6FuaCBnacOhXHJcbiAgICBhd2FpdCBSZXZpZXdTdGF0cy51cGRhdGVSZXZpZXdTdGF0cyhwcm9kdWN0SWQpO1xyXG5cclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJYw7NhIMSRw6FuaCBnacOhIHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgeMOzYSDEkcOhbmggZ2nDoTpcIiwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCJDw7MgbOG7l2kgeOG6o3kgcmEga2hpIHjDs2EgxJHDoW5oIGdpw6FcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBQaOG6o24gaOG7k2kgxJHDoW5oIGdpw6EgKGTDoG5oIGNobyBhZG1pbilcclxuZXhwb3J0IGNvbnN0IHJlcGx5VG9SZXZpZXcgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBpZCB9ID0gcmVxLnBhcmFtcztcclxuICAgIGNvbnN0IHsgdGV4dCB9ID0gcmVxLmJvZHk7XHJcbiAgICBjb25zdCB1c2VySWQgPSByZXEudXNlci5pZDtcclxuICAgIGNvbnN0IGlzQWRtaW4gPSByZXEudXNlci5yb2xlID09PSBcImFkbWluXCI7XHJcblxyXG4gICAgaWYgKCF0ZXh0KSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJO4buZaSBkdW5nIHBo4bqjbiBo4buTaSBraMO0bmcgxJHGsOG7o2MgxJHhu4MgdHLhu5FuZ1wiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUw6xtIMSRw6FuaCBnacOhXHJcbiAgICBjb25zdCByZXZpZXcgPSBhd2FpdCBSZXZpZXcuZmluZEJ5SWQoaWQpO1xyXG4gICAgaWYgKCFyZXZpZXcpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSDEkcOhbmggZ2nDoVwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBM4bqleSB0aMO0bmcgdGluIG5nxrDhu51pIGTDuW5nXHJcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kQnlJZCh1c2VySWQpO1xyXG4gICAgaWYgKCF1c2VyKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgdGjDtG5nIHRpbiBuZ8aw4budaSBkw7luZ1wiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBU4bqhbyBwaOG6o24gaOG7k2kgbeG7m2lcclxuICAgIGNvbnN0IHJlcGx5ID0ge1xyXG4gICAgICB1c2VySWQsXHJcbiAgICAgIGFkbWluSWQ6IGlzQWRtaW4gPyB1c2VySWQgOiBudWxsLFxyXG4gICAgICB1c2VyTmFtZTogdXNlci51c2VybmFtZSB8fCBgJHt1c2VyLmZpcnN0TmFtZX0gJHt1c2VyLmxhc3ROYW1lfWAsXHJcbiAgICAgIHRleHQsXHJcbiAgICAgIGlzQWRtaW4sXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFRow6ptIHBo4bqjbiBo4buTaSB2w6BvIG3huqNuZyByZXBsaWVzXHJcbiAgICByZXZpZXcucmVwbGllcy5wdXNoKHJlcGx5KTtcclxuICAgIGF3YWl0IHJldmlldy5zYXZlKCk7XHJcblxyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBkYXRhOiByZXZpZXcsXHJcbiAgICAgIG1lc3NhZ2U6IFwiUGjhuqNuIGjhu5NpIMSRw6FuaCBnacOhIHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgcGjhuqNuIGjhu5NpIMSRw6FuaCBnacOhOlwiLCBlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIkPDsyBs4buXaSB44bqjeSByYSBraGkgcGjhuqNuIGjhu5NpIMSRw6FuaCBnacOhXCIsXHJcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gTOG6pXkgdGjhu5FuZyBrw6ogxJHDoW5oIGdpw6EgY+G7p2Egc+G6o24gcGjhuqltXHJcbmV4cG9ydCBjb25zdCBnZXRQcm9kdWN0UmV2aWV3U3RhdHMgPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBwcm9kdWN0SWQgfSA9IHJlcS5wYXJhbXM7XHJcblxyXG4gICAgLy8gWMOhYyB0aOG7sWMgcHJvZHVjdElkXHJcbiAgICBpZiAoIW1vbmdvb3NlLlR5cGVzLk9iamVjdElkLmlzVmFsaWQocHJvZHVjdElkKSkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiSUQgc+G6o24gcGjhuqltIGtow7RuZyBo4bujcCBs4buHXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFTDrG0gaG/hurdjIHThuqFvIHRo4buRbmcga8OqXHJcbiAgICBsZXQgc3RhdHMgPSBhd2FpdCBSZXZpZXdTdGF0cy5maW5kT25lKHsgcHJvZHVjdElkIH0pO1xyXG4gICAgXHJcbiAgICAvLyBO4bq/dSBjaMawYSBjw7MgdGjhu5FuZyBrw6osIHThuqFvIG3hu5tpXHJcbiAgICBpZiAoIXN0YXRzKSB7XHJcbiAgICAgIHN0YXRzID0gYXdhaXQgUmV2aWV3U3RhdHMudXBkYXRlUmV2aWV3U3RhdHMocHJvZHVjdElkKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBO4bq/dSB24bqrbiBraMO0bmcgY8OzLCB0cuG6oyB24buBIGdpw6EgdHLhu4sgbeG6t2MgxJHhu4tuaFxyXG4gICAgaWYgKCFzdGF0cykge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgYXZlcmFnZVJhdGluZzogMCxcclxuICAgICAgICAgIHRvdGFsUmV2aWV3czogMCxcclxuICAgICAgICAgIHJhdGluZ0Rpc3RyaWJ1dGlvbjogeyAxOiAwLCAyOiAwLCAzOiAwLCA0OiAwLCA1OiAwIH0sXHJcbiAgICAgICAgICBwZXJjZW50YWdlczoge1xyXG4gICAgICAgICAgICBvbmVTdGFyOiAwLFxyXG4gICAgICAgICAgICB0d29TdGFyOiAwLFxyXG4gICAgICAgICAgICB0aHJlZVN0YXI6IDAsXHJcbiAgICAgICAgICAgIGZvdXJTdGFyOiAwLFxyXG4gICAgICAgICAgICBmaXZlU3RhcjogMCxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIGPDsyDEkcOhbmggZ2nDoSBuw6BvIGNobyBz4bqjbiBwaOG6qW0gbsOgeVwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGRhdGE6IHtcclxuICAgICAgICBhdmVyYWdlUmF0aW5nOiBzdGF0cy5hdmVyYWdlUmF0aW5nLFxyXG4gICAgICAgIHRvdGFsUmV2aWV3czogc3RhdHMudG90YWxSZXZpZXdzLFxyXG4gICAgICAgIHZlcmlmaWVkUmV2aWV3czogc3RhdHMudmVyaWZpZWRSZXZpZXdzLFxyXG4gICAgICAgIHJhdGluZ0Rpc3RyaWJ1dGlvbjogc3RhdHMucmF0aW5nRGlzdHJpYnV0aW9uLFxyXG4gICAgICAgIHBlcmNlbnRhZ2VzOiBzdGF0cy5nZXRTdGFyUGVyY2VudGFnZXMoKSxcclxuICAgICAgICBsYXN0VXBkYXRlZDogc3RhdHMubGFzdFVwZGF0ZWRcclxuICAgICAgfSxcclxuICAgICAgbWVzc2FnZTogXCJM4bqleSB0aOG7kW5nIGvDqiDEkcOhbmggZ2nDoSB0aMOgbmggY8O0bmdcIixcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGzhuqV5IHRo4buRbmcga8OqIMSRw6FuaCBnacOhOlwiLCBlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIkPDsyBs4buXaSB44bqjeSByYSBraGkgbOG6pXkgdGjhu5FuZyBrw6ogxJHDoW5oIGdpw6FcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBD4bqtcCBuaOG6rXQgbOG6oWkgdOG6pXQgY+G6oyB0aOG7kW5nIGvDqiDEkcOhbmggZ2nDoSAocm91dGUgZMOgbmggY2hvIGFkbWluKVxyXG5leHBvcnQgY29uc3QgcmVjYWxjdWxhdGVBbGxSZXZpZXdTdGF0cyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICAvLyBYw6FjIHRo4buxYyBxdXnhu4FuIGFkbWluXHJcbiAgICBpZiAocmVxLnVzZXIucm9sZSAhPT0gXCJhZG1pblwiKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJC4bqhbiBraMO0bmcgY8OzIHF1eeG7gW4gdGjhu7FjIGhp4buHbiB0w6FjIHbhu6UgbsOgeVwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBM4bqleSB04bqldCBj4bqjIHPhuqNuIHBo4bqpbSBjw7MgxJHDoW5oIGdpw6FcclxuICAgIGNvbnN0IHByb2R1Y3RzV2l0aFJldmlld3MgPSBhd2FpdCBSZXZpZXcuZGlzdGluY3QoXCJwcm9kdWN0SWRcIik7XHJcbiAgICBcclxuICAgIC8vIEPhuq1wIG5o4bqtdCB04burbmcgc+G6o24gcGjhuqltXHJcbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXHJcbiAgICAgIHByb2R1Y3RzV2l0aFJldmlld3MubWFwKGFzeW5jIChwcm9kdWN0SWQpID0+IHtcclxuICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IFJldmlld1N0YXRzLnVwZGF0ZVJldmlld1N0YXRzKHByb2R1Y3RJZCk7XHJcbiAgICAgICAgcmV0dXJuIHsgcHJvZHVjdElkLCBzdWNjZXNzOiAhIXN0YXRzIH07XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG5cclxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgZGF0YToge1xyXG4gICAgICAgIHRvdGFsVXBkYXRlZDogcmVzdWx0cy5maWx0ZXIociA9PiByLnN1Y2Nlc3MpLmxlbmd0aCxcclxuICAgICAgICB0b3RhbFByb2R1Y3RzOiByZXN1bHRzLmxlbmd0aCxcclxuICAgICAgICByZXN1bHRzXHJcbiAgICAgIH0sXHJcbiAgICAgIG1lc3NhZ2U6IFwiQ+G6rXAgbmjhuq10IGzhuqFpIHThuqV0IGPhuqMgdGjhu5FuZyBrw6ogxJHDoW5oIGdpw6EgdGjDoG5oIGPDtG5nXCIsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgbOG6oWkgdOG6pXQgY+G6oyB0aOG7kW5nIGvDqiDEkcOhbmggZ2nDoTpcIiwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCJDw7MgbOG7l2kgeOG6o3kgcmEga2hpIGPhuq1wIG5o4bqtdCBs4bqhaSB04bqldCBj4bqjIHRo4buRbmcga8OqIMSRw6FuaCBnacOhXCIsXHJcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59OyAiXSwibWFwcGluZ3MiOiJvV0FBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxLQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxZQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxTQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7O0FBRUE7QUFDTyxNQUFNSyxZQUFZLEdBQUcsTUFBQUEsQ0FBT0MsR0FBRyxFQUFFQyxHQUFHLEtBQUs7RUFDOUMsSUFBSTtJQUNGLE1BQU0sRUFBRUMsU0FBUyxFQUFFQyxNQUFNLEVBQUVDLE9BQU8sQ0FBQyxDQUFDLEdBQUdKLEdB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