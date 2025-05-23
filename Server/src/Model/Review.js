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
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ isPublished: 1 });

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
    
    // Cập nhật thống kê chi tiết trong ReviewStats
    // Sử dụng setTimeout để đảm bảo mô hình ReviewStats đã được đăng ký
    setTimeout(async () => {
      try {
        const ReviewStats = mongoose.model("ReviewStats");
        await ReviewStats.recalculateStats(productId);
      } catch (err) {
        console.error("Không thể cập nhật ReviewStats:", err.message);
      }
    }, 0);
  } catch (error) {
    console.error("Lỗi khi cập nhật đánh giá trung bình:", error);
  }
};

// Middleware để tự động tính lại điểm đánh giá sau khi lưu review
ReviewSchema.post("save", function() {
  this.constructor.calculateAverageRating(this.productId);
});

// Middleware để tự động tính lại điểm đánh giá sau khi xóa review
ReviewSchema.post("remove", function() {
  this.constructor.calculateAverageRating(this.productId);
});

// Middleware để tự động tính lại điểm đánh giá sau khi cập nhật review
ReviewSchema.post("findOneAndUpdate", async function(doc) {
  if (doc) {
    await mongoose.model("Review").calculateAverageRating(doc.productId);
  }
});

// Middleware để tự động tính lại điểm đánh giá sau khi thay đổi trạng thái public/private
ReviewSchema.pre("updateOne", async function() {
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (docToUpdate) {
    // Lưu lại productId để sử dụng sau khi cập nhật
    this._productId = docToUpdate.productId;
  }
});

ReviewSchema.post("updateOne", async function() {
  if (this._productId) {
    await mongoose.model("Review").calculateAverageRating(this._productId);
  }
});

const Review = mongoose.model("Review", ReviewSchema);

export default Review; 