import mongoose from "mongoose";

const ReviewStatsSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingDistribution: {
      1: { type: Number, default: 0 }, // 1 star count
      2: { type: Number, default: 0 }, // 2 star count
      3: { type: Number, default: 0 }, // 3 star count
      4: { type: Number, default: 0 }, // 4 star count
      5: { type: Number, default: 0 }  // 5 star count
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    verifiedReviews: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Tạo index cho việc tìm kiếm nhanh hơn
ReviewStatsSchema.index({ productId: 1 });
ReviewStatsSchema.index({ averageRating: -1 });
ReviewStatsSchema.index({ totalReviews: -1 });

// Static method để cập nhật thống kê đánh giá cho một sản phẩm
ReviewStatsSchema.statics.updateReviewStats = async function(productId) {
  try {
    // Lấy thông tin từ model Review
    const Review = mongoose.model("Review");
    
    // Tìm tất cả đánh giá đã công khai cho sản phẩm này
    const reviews = await Review.find({
      productId: productId,
      isPublished: true
    });
    
    // Nếu không có đánh giá nào, xóa thống kê nếu tồn tại
    if (!reviews || reviews.length === 0) {
      await this.findOneAndDelete({ productId });
      // Cập nhật Product với averageRating = 0
      await mongoose.model("Product").findByIdAndUpdate(productId, {
        averageRating: 0,
        numOfReviews: 0
      });
      return;
    }
    
    // Tính toán thống kê
    const totalReviews = reviews.length;
    const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = ratingSum / totalReviews;
    const verifiedReviews = reviews.filter(review => review.isVerified).length;
    
    // Tạo phân phối đánh giá
    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[Math.floor(review.rating)]++;
      }
    });
    
    // Cập nhật hoặc tạo mới thống kê
    const stats = await this.findOneAndUpdate(
      { productId },
      {
        averageRating,
        ratingDistribution,
        totalReviews,
        verifiedReviews,
        lastUpdated: new Date()
      },
      { new: true, upsert: true }
    );
    
    // Cập nhật trực tiếp vào model Product
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      averageRating: averageRating,
      numOfReviews: totalReviews
    });
    
    return stats;
  } catch (error) {
    console.error("Lỗi khi cập nhật thống kê đánh giá:", error);
    throw error;
  }
};

// Tính toán thống kê theo thang điểm 5 sao
ReviewStatsSchema.methods.getStarPercentages = function() {
  const total = this.totalReviews || 1; // Tránh chia cho 0
  
  return {
    oneStar: Math.round((this.ratingDistribution[1] / total) * 100),
    twoStar: Math.round((this.ratingDistribution[2] / total) * 100),
    threeStar: Math.round((this.ratingDistribution[3] / total) * 100),
    fourStar: Math.round((this.ratingDistribution[4] / total) * 100),
    fiveStar: Math.round((this.ratingDistribution[5] / total) * 100)
  };
};

// Middleware để tính toán đánh giá khi có sự thay đổi trong Review
ReviewStatsSchema.statics.recalculateStats = async function(productId) {
  return await this.updateReviewStats(productId);
};

const ReviewStats = mongoose.model("ReviewStats", ReviewStatsSchema);

export default ReviewStats; 