import mongoose from "mongoose";

// Schema cho phản hồi đánh giá
const ReplySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true
  },
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Admin"
  },
  userName: { 
    type: String, 
    required: true 
  },
  text: { 
    type: String, 
    required: true,
    trim: true 
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5,
      default: 5
    },
    comment: { 
      type: String, 
      required: true,
      trim: true 
    },
    userName: { 
      type: String, 
      required: true 
    },
    userImage: { 
      type: String, 
      default: "" 
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    }, // Người dùng đã mua sản phẩm chưa
    isPublished: { 
      type: Boolean, 
      default: true 
    }, // Admin có thể ẩn đánh giá không phù hợp
    replies: [ReplySchema], // Mảng các phản hồi cho đánh giá này
  },
  { timestamps: true }
);

// Tạo index cho việc tìm kiếm nhanh hơn
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
ReviewSchema.index({ productId: 1, createdAt: -1 });
ReviewSchema.index({ rating: -1 });

// Static method để tính điểm đánh giá trung bình cho một sản phẩm
ReviewSchema.statics.calculateAverageRating = async function (productId) {
  const result = await this.aggregate([
    {
      $match: { 
        productId: new mongoose.Types.ObjectId(productId),
        isPublished: true
      }
    },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        numOfReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    if (result.length > 0) {
      await mongoose.model("Product").findByIdAndUpdate(productId, {
        averageRating: result[0].averageRating,
        numOfReviews: result[0].numOfReviews
      });
    } else {
      await mongoose.model("Product").findByIdAndUpdate(productId, {
        averageRating: 0,
        numOfReviews: 0
      });
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật đánh giá trung bình:", error);
  }
};

// Middleware để tự động tính lại điểm đánh giá sau khi lưu/xóa review
ReviewSchema.post("save", function() {
  this.constructor.calculateAverageRating(this.productId);
});

ReviewSchema.post("remove", function() {
  this.constructor.calculateAverageRating(this.productId);
});

const Review = mongoose.model("Review", ReviewSchema);

export default Review; 