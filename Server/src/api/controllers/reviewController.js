import Review from "../../Model/Review.js";
import Product from "../../Model/Products.js";
import User from "../../Model/User.js";
import ReviewStats from "../../Model/ReviewStats.js";
import mongoose from "mongoose";

// Tạo đánh giá mới
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này rồi" });
    }

    // Lấy thông tin người dùng
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy thông tin người dùng" });
    }

    // Tạo đánh giá mới
    const newReview = new Review({
      userId,
      productId,
      rating,
      comment,
      userName: user.username || `${user.firstName} ${user.lastName}`,
      userImage: user.avatar || "",
      // Kiểm tra xem người dùng đã mua sản phẩm chưa (có thể làm phức tạp hơn sau)
      isVerified: true,
    });

    // Lưu đánh giá
    await newReview.save();

    // Cập nhật thống kê đánh giá
    await ReviewStats.updateReviewStats(productId);

    res.status(201).json({
      success: true,
      data: newReview,
      message: "Đánh giá sản phẩm thành công",
    });
  } catch (error) {
    console.error("Lỗi khi tạo đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tạo đánh giá",
      error: error.message,
    });
  }
};

// Lấy tất cả đánh giá của một sản phẩm
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    // Xác thực productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ",
      });
    }

    // Tìm tất cả đánh giá được công khai
    const reviews = await Review.find({
      productId,
      isPublished: true,
    })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("userId", "username firstName lastName avatar");

    // Đếm tổng số đánh giá
    const totalReviews = await Review.countDocuments({
      productId,
      isPublished: true,
    });

    // Lấy thống kê đánh giá
    let stats = await ReviewStats.findOne({ productId });
    
    // Nếu chưa có thống kê, tạo mới
    if (!stats) {
      stats = await ReviewStats.updateReviewStats(productId);
    }

    res.status(200).json({
      success: true,
      data: {
        reviews,
        totalReviews,
        stats: {
          averageRating: stats?.averageRating || 0,
          totalReviews: stats?.totalReviews || 0,
          ratingDistribution: stats?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          percentages: stats?.getStarPercentages() || {
            oneStar: 0,
            twoStar: 0,
            threeStar: 0,
            fourStar: 0,
            fiveStar: 0,
          }
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalItems: totalReviews,
          itemsPerPage: parseInt(limit),
        },
      },
      message: "Lấy danh sách đánh giá thành công",
    });
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy đánh giá",
      error: error.message,
    });
  }
};

// Cập nhật đánh giá
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Tìm đánh giá
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    // Kiểm tra quyền sở hữu
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật đánh giá này",
      });
    }

    // Cập nhật đánh giá
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    // Cập nhật thống kê đánh giá
    await ReviewStats.updateReviewStats(review.productId);

    res.status(200).json({
      success: true,
      data: review,
      message: "Cập nhật đánh giá thành công",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật đánh giá",
      error: error.message,
    });
  }
};

// Xóa đánh giá
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Tìm đánh giá
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    // Kiểm tra quyền sở hữu hoặc admin
    if (review.userId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa đánh giá này",
      });
    }

    // Lưu lại productId trước khi xóa
    const productId = review.productId;

    // Xóa đánh giá
    await review.remove();

    // Cập nhật thống kê đánh giá
    await ReviewStats.updateReviewStats(productId);

    res.status(200).json({
      success: true,
      message: "Xóa đánh giá thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa đánh giá",
      error: error.message,
    });
  }
};

// Phản hồi đánh giá (dành cho admin)
export const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Nội dung phản hồi không được để trống",
      });
    }

    // Tìm đánh giá
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    // Lấy thông tin người dùng
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    // Tạo phản hồi mới
    const reply = {
      userId,
      adminId: isAdmin ? userId : null,
      userName: user.username || `${user.firstName} ${user.lastName}`,
      text,
      isAdmin,
    };

    // Thêm phản hồi vào mảng replies
    review.replies.push(reply);
    await review.save();

    res.status(201).json({
      success: true,
      data: review,
      message: "Phản hồi đánh giá thành công",
    });
  } catch (error) {
    console.error("Lỗi khi phản hồi đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi phản hồi đánh giá",
      error: error.message,
    });
  }
};

// Lấy thống kê đánh giá của sản phẩm
export const getProductReviewStats = async (req, res) => {
  try {
    const { productId } = req.params;

    // Xác thực productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ",
      });
    }

    // Tìm hoặc tạo thống kê
    let stats = await ReviewStats.findOne({ productId });
    
    // Nếu chưa có thống kê, tạo mới
    if (!stats) {
      stats = await ReviewStats.updateReviewStats(productId);
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
            fiveStar: 0,
          }
        },
        message: "Không có đánh giá nào cho sản phẩm này",
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
      message: "Lấy thống kê đánh giá thành công",
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy thống kê đánh giá",
      error: error.message,
    });
  }
};

// Cập nhật lại tất cả thống kê đánh giá (route dành cho admin)
export const recalculateAllReviewStats = async (req, res) => {
  try {
    // Xác thực quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện tác vụ này",
      });
    }

    // Lấy tất cả sản phẩm có đánh giá
    const productsWithReviews = await Review.distinct("productId");
    
    // Cập nhật từng sản phẩm
    const results = await Promise.all(
      productsWithReviews.map(async (productId) => {
        const stats = await ReviewStats.updateReviewStats(productId);
        return { productId, success: !!stats };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalUpdated: results.filter(r => r.success).length,
        totalProducts: results.length,
        results
      },
      message: "Cập nhật lại tất cả thống kê đánh giá thành công",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật lại tất cả thống kê đánh giá:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật lại tất cả thống kê đánh giá",
      error: error.message,
    });
  }
}; 