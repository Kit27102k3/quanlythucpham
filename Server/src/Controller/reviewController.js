/* eslint-disable no-undef */
import mongoose from "mongoose";
import Review from "../Model/Review.js";
import User from "../Model/Register.js";
import Product from "../Model/Products.js";
import { getTokenFrom } from "../utils/tokenExtractor.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendReviewReplyNotification } from "../Services/notificationService.js";

// Khởi tạo cấu hình dotenv
dotenv.config();

// Lấy JWT_SECRET từ biến môi trường - process is available in Node.js by default
const JWT_SECRET = process.env.JWT_SECRET_ACCESS || "SECRET_ACCESS";

// Lấy tất cả đánh giá cho một sản phẩm
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Kiểm tra productId có đúng định dạng không
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID sản phẩm không hợp lệ" 
      });
    }

    // Tìm tất cả đánh giá của sản phẩm, sort theo thời gian mới nhất
    const reviews = await Review.find({ 
      productId,
      isPublished: true 
    }).sort({ createdAt: -1 });

    // Lấy thông tin chi tiết sản phẩm
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy sản phẩm" 
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating: product.averageRating || 0,
        numOfReviews: product.numOfReviews || 0
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy đánh giá",
      error: error.message
    });
  }
};

// Thêm đánh giá mới
export const addReview = async (req, res) => {
  try {
    const { rating, comment, productId, userName } = req.body;

    // Xác thực người dùng từ token
    const token = getTokenFrom(req);
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Bạn cần đăng nhập để đánh giá sản phẩm" 
      });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);
    if (!decodedToken.id) {
      return res.status(401).json({ 
        success: false, 
        message: "Token không hợp lệ" 
      });
    }

    const userId = decodedToken.id;

    // Kiểm tra người dùng có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy người dùng" 
      });
    }

    // Kiểm tra sản phẩm có tồn tại không
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID sản phẩm không hợp lệ" 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy sản phẩm" 
      });
    }

    // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: "Bạn đã đánh giá sản phẩm này rồi" 
      });
    }

    // Tạo đánh giá mới
    const newReview = new Review({
      userId,
      productId,
      rating: parseFloat(rating) || 5, // Đảm bảo rating là số float, mặc định là 5
      comment,
      userName: userName || `${user.firstName} ${user.lastName}`,
      userImage: user.userImage || "",
      // Có thể kiểm tra xem người dùng đã mua sản phẩm chưa và đặt isVerified
    });

    // Lưu đánh giá
    await newReview.save();

    return res.status(201).json({
      success: true,
      message: "Đánh giá của bạn đã được ghi nhận",
      data: newReview
    });
  } catch (error) {
    console.error("Lỗi khi thêm đánh giá:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi thêm đánh giá",
      error: error.message
    });
  }
};

// Cập nhật đánh giá
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    // Xác thực người dùng
    const token = getTokenFrom(req);
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Không có quyền cập nhật đánh giá" 
      });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);
    const userId = decodedToken.id;

    // Kiểm tra xem đánh giá có tồn tại không
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID đánh giá không hợp lệ" 
      });
    }

    // Tìm đánh giá
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đánh giá" 
      });
    }

    // Kiểm tra quyền cập nhật
    if (review.userId.toString() !== userId && !decodedToken.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn không có quyền cập nhật đánh giá này" 
      });
    }

    // Cập nhật đánh giá
    review.rating = parseFloat(rating) || review.rating; // Sử dụng giá trị cũ nếu không có giá trị mới
    review.comment = comment;
    await review.save();

    return res.status(200).json({
      success: true,
      message: "Đánh giá đã được cập nhật",
      data: review
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật đánh giá:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật đánh giá",
      error: error.message
    });
  }
};

// Xóa đánh giá
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Xác thực người dùng
    const token = getTokenFrom(req);
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Không có quyền xóa đánh giá" 
      });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);
    const userId = decodedToken.id;

    // Kiểm tra xem đánh giá có tồn tại không
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID đánh giá không hợp lệ" 
      });
    }

    // Tìm đánh giá
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đánh giá" 
      });
    }

    // Kiểm tra quyền xóa
    if (review.userId.toString() !== userId && !decodedToken.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn không có quyền xóa đánh giá này" 
      });
    }

    // Lưu productId trước khi xóa để cập nhật lại rating
    const productId = review.productId;

    // Xóa đánh giá
    await Review.findByIdAndDelete(reviewId);

    // Cập nhật lại rating cho sản phẩm
    await Review.calculateAverageRating(productId);

    return res.status(200).json({
      success: true,
      message: "Đánh giá đã được xóa thành công"
    });
  } catch (error) {
    console.error("Lỗi khi xóa đánh giá:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa đánh giá",
      error: error.message
    });
  }
};

// API cho Admin: Lấy tất cả đánh giá
export const getAllReviews = async (req, res) => {
  try {
    // Lấy token từ query parameter hoặc từ authorization header
    let token = req.query.token || getTokenFrom(req);

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Không có quyền truy cập" 
      });
    }

    // Trường hợp đặc biệt - token hardcoded cho admin TKhiem
    if (token === "admin-token-for-TKhiem") {
     
      
      // Bỏ qua xác thực JWT, trực tiếp lấy dữ liệu
      // Phân trang
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Tìm tất cả đánh giá
      const reviews = await Review.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'productId',
          select: 'productName productImages price category'
        });

      // Đếm tổng số đánh giá
      const total = await Review.countDocuments();

      return res.status(200).json({
        success: true,
        data: {
          reviews,
          pagination: {
            total,
            page,
            pages: Math.ceil(total / limit)
          }
        }
      });
    }

    // Kiểm tra xem token có hợp lệ không trước khi verify
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ 
        success: false, 
        message: "Token không hợp lệ" 
      });
    }

    try {
      // Verify token trong block try-catch riêng để xử lý lỗi verify
      const decodedToken = jwt.verify(token, JWT_SECRET);
      
      // Kiểm tra quyền admin hoặc manager
      if (!decodedToken.isAdmin && decodedToken.role !== "manager") {
        return res.status(403).json({ 
          success: false, 
          message: "Chỉ admin hoặc manager mới có quyền xem tất cả đánh giá" 
        });
      }

      // Phân trang
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Tìm tất cả đánh giá
      const reviews = await Review.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'productId',
          select: 'productName productImages price category'
        });

      // Đếm tổng số đánh giá
      const total = await Review.countDocuments();

      return res.status(200).json({
        success: true,
        data: {
          reviews,
          pagination: {
            total,
            page,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (verifyError) {
      console.error("Lỗi xác thực token:", verifyError);
      return res.status(401).json({ 
        success: false, 
        message: "Token không hợp lệ hoặc đã hết hạn",
        error: verifyError.message
      });
    }
  } catch (error) {
    console.error("Lỗi khi lấy tất cả đánh giá:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy tất cả đánh giá",
      error: error.message
    });
  }
};

// API cho Admin: Cập nhật trạng thái hiển thị của đánh giá
export const toggleReviewPublishStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Lấy token từ query parameter hoặc từ authorization header
    let token = req.query.token || getTokenFrom(req);

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Không có quyền truy cập" 
      });
    }

    // Trường hợp đặc biệt - token hardcoded cho admin TKhiem
    if (token === "admin-token-for-TKhiem") {
     
      
      // Bỏ qua xác thực JWT, trực tiếp cập nhật
      // Kiểm tra xem đánh giá có tồn tại không
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID đánh giá không hợp lệ" 
        });
      }

      // Tìm đánh giá
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ 
          success: false, 
          message: "Không tìm thấy đánh giá" 
        });
      }

      // Lưu productId trước khi cập nhật
      const productId = review.productId;

      // Cập nhật trạng thái hiển thị
      review.isPublished = !review.isPublished;
      await review.save();

      // Cập nhật lại rating cho sản phẩm
      await Review.calculateAverageRating(productId);

      return res.status(200).json({
        success: true,
        message: `Đánh giá đã được ${review.isPublished ? 'hiển thị' : 'ẩn'} thành công`,
        data: review
      });
    }

    // Kiểm tra xem token có hợp lệ không trước khi verify
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ 
        success: false, 
        message: "Token không hợp lệ" 
      });
    }

    try {
      // Verify token trong block try-catch riêng để xử lý lỗi verify
      const decodedToken = jwt.verify(token, JWT_SECRET);
      
      // Kiểm tra quyền admin
      if (!decodedToken.isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: "Chỉ admin mới có quyền cập nhật trạng thái đánh giá" 
        });
      }

      // Kiểm tra xem đánh giá có tồn tại không
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID đánh giá không hợp lệ" 
        });
      }

      // Tìm đánh giá
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ 
          success: false, 
          message: "Không tìm thấy đánh giá" 
        });
      }

      // Lưu productId trước khi cập nhật
      const productId = review.productId;

      // Cập nhật trạng thái hiển thị
      review.isPublished = !review.isPublished;
      await review.save();

      // Cập nhật lại rating cho sản phẩm
      await Review.calculateAverageRating(productId);

      return res.status(200).json({
        success: true,
        message: `Đánh giá đã được ${review.isPublished ? 'hiển thị' : 'ẩn'} thành công`,
        data: review
      });
    } catch (verifyError) {
      console.error("Lỗi xác thực token:", verifyError);
      return res.status(401).json({ 
        success: false, 
        message: "Token không hợp lệ hoặc đã hết hạn",
        error: verifyError.message
      });
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đánh giá:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật trạng thái đánh giá",
      error: error.message
    });
  }
};

// Thêm phản hồi cho đánh giá
export const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text } = req.body;
    
    console.log("Request body:", req.body);
    
    if (!text || !text.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Nội dung phản hồi không được để trống" 
      });
    }

    // Lấy token từ query parameter hoặc từ authorization header
    let token = req.query.token || getTokenFrom(req);
    console.log("Token from request:", token);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Không có quyền trả lời đánh giá" 
      });
    }
    
    // Trường hợp đặc biệt - token hardcoded cho admin TKhiem
    if (token === "admin-token-for-TKhiem") {
     
      
      // Kiểm tra xem đánh giá có tồn tại không
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID đánh giá không hợp lệ" 
        });
      }

      // Tìm đánh giá
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ 
          success: false, 
          message: "Không tìm thấy đánh giá" 
        });
      }
      
      // Tạo phản hồi mới với vai trò admin - sử dụng ID hợp lệ
      const adminId = new mongoose.Types.ObjectId("65f62e09ac3ea4ad23023293"); // Sử dụng ID admin cố định
      const reply = {
        userId: adminId, // Sử dụng ObjectId hợp lệ
        userName: "Admin",
        text: text.trim(),
        isAdmin: true
      };

      // Thêm phản hồi vào danh sách
      review.replies.push(reply);
      await review.save();

      // Gửi thông báo khi admin phản hồi đánh giá của người dùng
      if (reply.isAdmin && review.userId) {
        try {
          await sendReviewReplyNotification(review.userId, review, text)
            .catch(error => console.error('Error sending review reply notification:', error));
        } catch (notificationError) {
          console.error('Lỗi khi gửi thông báo phản hồi đánh giá:', notificationError);
          // Không ảnh hưởng đến việc trả về response
        }
      }

      return res.status(201).json({
        success: true,
        message: "Đã thêm phản hồi thành công",
        data: review
      });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
      
      
      if (!decodedToken.id) {
        return res.status(401).json({ 
          success: false, 
          message: "Token không hợp lệ" 
        });
      }
    } catch (error) {
      console.error("Lỗi xác thực token:", error);
      return res.status(401).json({ 
        success: false, 
        message: "Token không hợp lệ hoặc đã hết hạn", 
        error: error.message 
      });
    }

    const userId = decodedToken.id;
    console.log("User ID from token:", userId);

    // Kiểm tra xem đánh giá có tồn tại không
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID đánh giá không hợp lệ" 
      });
    }

    // Tìm đánh giá
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đánh giá" 
      });
    }

    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy người dùng" 
      });
    }

    // Bỏ kiểm tra quyền trả lời - cho phép bất kỳ người dùng nào đã đăng nhập đều có thể trả lời
    // Vẫn phân biệt vai trò admin/người dùng để hiển thị khác nhau
    const isAdmin = decodedToken.isAdmin || decodedToken.role === 'admin';
    
    // Tạo phản hồi mới
    const reply = {
      userId: userId,
      userName: isAdmin ? 'Admin' : `${user.firstName} ${user.lastName}`,
      text: text.trim(),
      isAdmin: isAdmin
    };

    if (isAdmin) {
      reply.adminId = userId;
    }

    // In ra thông tin phản hồi trước khi lưu
    console.log("Reply to be added:", reply);

    // Thêm phản hồi vào danh sách
    review.replies.push(reply);
    await review.save();

    // Gửi thông báo khi admin phản hồi đánh giá của người dùng
    if (isAdmin && review.userId) {
      try {
        await sendReviewReplyNotification(review.userId, review, text)
          .catch(error => console.error('Error sending review reply notification:', error));
      } catch (notificationError) {
        console.error('Lỗi khi gửi thông báo phản hồi đánh giá:', notificationError);
        // Không ảnh hưởng đến việc trả về response
      }
    }

    return res.status(201).json({
      success: true,
      message: "Đã thêm phản hồi thành công",
      data: review
    });

  } catch (error) {
    console.error("Lỗi khi thêm phản hồi cho đánh giá:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi thêm phản hồi",
      error: error.message
    });
  }
};

// Chỉnh sửa phản hồi
export const editReply = async (req, res) => {
  try {
    const { reviewId, replyId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Nội dung phản hồi không được để trống" 
      });
    }

    // Lấy token từ query parameter hoặc từ authorization header
    let token = req.query.token || getTokenFrom(req);
    console.log("Token from request:", token);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Không có quyền chỉnh sửa phản hồi" 
      });
    }
    
    // Trường hợp đặc biệt - token hardcoded cho admin TKhiem
    if (token === "admin-token-for-TKhiem") {
     
      
      // Kiểm tra xem đánh giá có tồn tại không
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID đánh giá không hợp lệ" 
        });
      }

      // Tìm đánh giá
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ 
          success: false, 
          message: "Không tìm thấy đánh giá" 
        });
      }

      // Tìm phản hồi cần chỉnh sửa
      const reply = review.replies.id(replyId);
      if (!reply) {
        return res.status(404).json({ 
          success: false, 
          message: "Không tìm thấy phản hồi" 
        });
      }

      // Cập nhật phản hồi với quyền admin
      reply.text = text.trim();
      await review.save();

      return res.status(200).json({
        success: true,
        message: "Đã cập nhật phản hồi thành công",
        data: review
      });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
      if (!decodedToken.id) {
        return res.status(401).json({ 
          success: false, 
          message: "Token không hợp lệ" 
        });
      }
    } catch (error) {
      console.error("Lỗi xác thực token:", error);
      return res.status(401).json({ 
        success: false, 
        message: "Token không hợp lệ hoặc đã hết hạn", 
        error: error.message 
      });
    }

    const userId = decodedToken.id;

    // Kiểm tra xem đánh giá có tồn tại không
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID đánh giá không hợp lệ" 
      });
    }

    // Tìm đánh giá
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đánh giá" 
      });
    }

    // Tìm phản hồi cần chỉnh sửa
    const reply = review.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy phản hồi" 
      });
    }

    // Kiểm tra quyền chỉnh sửa (chỉ cho phép người viết phản hồi hoặc admin)
    const isAdmin = decodedToken.isAdmin || decodedToken.role === 'admin';
    const isOwner = reply.userId.toString() === userId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa phản hồi này"
      });
    }

    // Cập nhật phản hồi
    reply.text = text.trim();
    await review.save();

    return res.status(200).json({
      success: true,
      message: "Đã cập nhật phản hồi thành công",
      data: review
    });

  } catch (error) {
    console.error("Lỗi khi chỉnh sửa phản hồi:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi chỉnh sửa phản hồi",
      error: error.message
    });
  }
};

// Xóa phản hồi
export const deleteReply = async (req, res) => {
  try {
    const { reviewId, replyId } = req.params;

    // Lấy token từ query parameter hoặc từ authorization header
    let token = req.query.token || getTokenFrom(req);
    console.log("Token from request:", token);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Không có quyền xóa phản hồi" 
      });
    }
    
    // Trường hợp đặc biệt - token hardcoded cho admin TKhiem
    if (token === "admin-token-for-TKhiem") {
     
      
      // Kiểm tra xem đánh giá có tồn tại không
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID đánh giá không hợp lệ" 
        });
      }

      // Tìm đánh giá
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ 
          success: false, 
          message: "Không tìm thấy đánh giá" 
        });
      }

      // Tìm phản hồi cần xóa
      const reply = review.replies.id(replyId);
      if (!reply) {
        return res.status(404).json({ 
          success: false, 
          message: "Không tìm thấy phản hồi" 
        });
      }

      // Xóa phản hồi với quyền admin
      review.replies.pull(replyId);
      await review.save();

      return res.status(200).json({
        success: true,
        message: "Đã xóa phản hồi thành công"
      });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
      if (!decodedToken.id) {
        return res.status(401).json({ 
          success: false, 
          message: "Token không hợp lệ" 
        });
      }
    } catch (error) {
      console.error("Lỗi xác thực token:", error);
      return res.status(401).json({ 
        success: false, 
        message: "Token không hợp lệ hoặc đã hết hạn", 
        error: error.message 
      });
    }

    const userId = decodedToken.id;

    // Kiểm tra xem đánh giá có tồn tại không
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID đánh giá không hợp lệ" 
      });
    }

    // Tìm đánh giá
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đánh giá" 
      });
    }

    // Tìm phản hồi cần xóa
    const reply = review.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy phản hồi" 
      });
    }

    // Kiểm tra quyền xóa (chỉ cho phép người viết phản hồi hoặc admin)
    const isAdmin = decodedToken.isAdmin || decodedToken.role === 'admin';
    const isOwner = reply.userId.toString() === userId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa phản hồi này"
      });
    }

    // Xóa phản hồi
    review.replies.pull(replyId);
    await review.save();

    return res.status(200).json({
      success: true,
      message: "Đã xóa phản hồi thành công"
    });

  } catch (error) {
    console.error("Lỗi khi xóa phản hồi:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa phản hồi",
      error: error.message
    });
  }
}; 