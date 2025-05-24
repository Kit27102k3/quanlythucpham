"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.updateReview = exports.toggleReviewPublishStatus = exports.replyToReview = exports.getProductReviews = exports.getAllReviews = exports.editReply = exports.deleteReview = exports.deleteReply = exports.addReview = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
var _Review = _interopRequireDefault(require("../Model/Review.js"));
var _Register = _interopRequireDefault(require("../Model/Register.js"));
var _Products = _interopRequireDefault(require("../Model/Products.js"));
var _tokenExtractor = require("../utils/tokenExtractor.js");
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _notificationService = require("../Services/notificationService.js");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} /* eslint-disable no-undef */

// Khởi tạo cấu hình dotenv
_dotenv.default.config();

// Lấy JWT_SECRET từ biến môi trường - process is available in Node.js by default
const JWT_SECRET = process.env.JWT_SECRET_ACCESS || "SECRET_ACCESS";

// Lấy tất cả đánh giá cho một sản phẩm
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    // Kiểm tra productId có đúng định dạng không
    if (!_mongoose.default.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ"
      });
    }

    // Tìm tất cả đánh giá của sản phẩm, sort theo thời gian mới nhất
    const reviews = await _Review.default.find({
      productId,
      isPublished: true
    }).sort({ createdAt: -1 });

    // Lấy thông tin chi tiết sản phẩm
    const product = await _Products.default.findById(productId);
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
exports.getProductReviews = getProductReviews;const addReview = async (req, res) => {
  try {
    const { rating, comment, productId, userName } = req.body;

    // Xác thực người dùng từ token
    const token = (0, _tokenExtractor.getTokenFrom)(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để đánh giá sản phẩm"
      });
    }

    const decodedToken = _jsonwebtoken.default.verify(token, JWT_SECRET);
    if (!decodedToken.id) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ"
      });
    }

    const userId = decodedToken.id;

    // Kiểm tra người dùng có tồn tại không
    const user = await _Register.default.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    // Kiểm tra sản phẩm có tồn tại không
    if (!_mongoose.default.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ"
      });
    }

    const product = await _Products.default.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm"
      });
    }

    // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    const existingReview = await _Review.default.findOne({ userId, productId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá sản phẩm này rồi"
      });
    }

    // Tạo đánh giá mới
    const newReview = new _Review.default({
      userId,
      productId,
      rating: parseFloat(rating) || 5, // Đảm bảo rating là số float, mặc định là 5
      comment,
      userName: userName || `${user.firstName} ${user.lastName}`,
      userImage: user.userImage || ""
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
exports.addReview = addReview;const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    // Xác thực người dùng
    const token = (0, _tokenExtractor.getTokenFrom)(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không có quyền cập nhật đánh giá"
      });
    }

    const decodedToken = _jsonwebtoken.default.verify(token, JWT_SECRET);
    const userId = decodedToken.id;

    // Kiểm tra xem đánh giá có tồn tại không
    if (!_mongoose.default.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "ID đánh giá không hợp lệ"
      });
    }

    // Tìm đánh giá
    const review = await _Review.default.findById(reviewId);
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
exports.updateReview = updateReview;const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Xác thực người dùng
    const token = (0, _tokenExtractor.getTokenFrom)(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không có quyền xóa đánh giá"
      });
    }

    const decodedToken = _jsonwebtoken.default.verify(token, JWT_SECRET);
    const userId = decodedToken.id;

    // Kiểm tra xem đánh giá có tồn tại không
    if (!_mongoose.default.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "ID đánh giá không hợp lệ"
      });
    }

    // Tìm đánh giá
    const review = await _Review.default.findById(reviewId);
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
    await _Review.default.findByIdAndDelete(reviewId);

    // Cập nhật lại rating cho sản phẩm
    await _Review.default.calculateAverageRating(productId);

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
exports.deleteReview = deleteReview;const getAllReviews = async (req, res) => {
  try {
    // Lấy token từ query parameter hoặc từ authorization header
    let token = req.query.token || (0, _tokenExtractor.getTokenFrom)(req);

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
      const reviews = await _Review.default.find().
      sort({ createdAt: -1 }).
      skip(skip).
      limit(limit).
      populate({
        path: 'productId',
        select: 'productName productImages price category'
      });

      // Đếm tổng số đánh giá
      const total = await _Review.default.countDocuments();

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
      const decodedToken = _jsonwebtoken.default.verify(token, JWT_SECRET);

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
      const reviews = await _Review.default.find().
      sort({ createdAt: -1 }).
      skip(skip).
      limit(limit).
      populate({
        path: 'productId',
        select: 'productName productImages price category'
      });

      // Đếm tổng số đánh giá
      const total = await _Review.default.countDocuments();

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
exports.getAllReviews = getAllReviews;const toggleReviewPublishStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Lấy token từ query parameter hoặc từ authorization header
    let token = req.query.token || (0, _tokenExtractor.getTokenFrom)(req);

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
      if (!_mongoose.default.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "ID đánh giá không hợp lệ"
        });
      }

      // Tìm đánh giá
      const review = await _Review.default.findById(reviewId);
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
      await _Review.default.calculateAverageRating(productId);

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
      const decodedToken = _jsonwebtoken.default.verify(token, JWT_SECRET);

      // Kiểm tra quyền admin
      if (!decodedToken.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền cập nhật trạng thái đánh giá"
        });
      }

      // Kiểm tra xem đánh giá có tồn tại không
      if (!_mongoose.default.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "ID đánh giá không hợp lệ"
        });
      }

      // Tìm đánh giá
      const review = await _Review.default.findById(reviewId);
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
      await _Review.default.calculateAverageRating(productId);

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
exports.toggleReviewPublishStatus = toggleReviewPublishStatus;const replyToReview = async (req, res) => {
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
    let token = req.query.token || (0, _tokenExtractor.getTokenFrom)(req);
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
      if (!_mongoose.default.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "ID đánh giá không hợp lệ"
        });
      }

      // Tìm đánh giá
      const review = await _Review.default.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đánh giá"
        });
      }

      // Tạo phản hồi mới với vai trò admin - sử dụng ID hợp lệ
      const adminId = new _mongoose.default.Types.ObjectId("65f62e09ac3ea4ad23023293"); // Sử dụng ID admin cố định
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
          await (0, _notificationService.sendReviewReplyNotification)(review.userId, review, text).
          catch((error) => console.error('Error sending review reply notification:', error));

          console.log(`Đã gửi thông báo phản hồi đánh giá đến user ${review.userId}`);
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
      decodedToken = _jsonwebtoken.default.verify(token, JWT_SECRET);


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
    if (!_mongoose.default.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "ID đánh giá không hợp lệ"
      });
    }

    // Tìm đánh giá
    const review = await _Review.default.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá"
      });
    }

    // Kiểm tra xem người dùng có tồn tại không
    const user = await _Register.default.findById(userId);
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
        await (0, _notificationService.sendReviewReplyNotification)(review.userId, review, text).
        catch((error) => console.error('Error sending review reply notification:', error));

        console.log(`Đã gửi thông báo phản hồi đánh giá đến user ${review.userId}`);
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
exports.replyToReview = replyToReview;const editReply = async (req, res) => {
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
    let token = req.query.token || (0, _tokenExtractor.getTokenFrom)(req);
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
      if (!_mongoose.default.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "ID đánh giá không hợp lệ"
        });
      }

      // Tìm đánh giá
      const review = await _Review.default.findById(reviewId);
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
      decodedToken = _jsonwebtoken.default.verify(token, JWT_SECRET);
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
    if (!_mongoose.default.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "ID đánh giá không hợp lệ"
      });
    }

    // Tìm đánh giá
    const review = await _Review.default.findById(reviewId);
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
exports.editReply = editReply;const deleteReply = async (req, res) => {
  try {
    const { reviewId, replyId } = req.params;

    // Lấy token từ query parameter hoặc từ authorization header
    let token = req.query.token || (0, _tokenExtractor.getTokenFrom)(req);
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
      if (!_mongoose.default.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "ID đánh giá không hợp lệ"
        });
      }

      // Tìm đánh giá
      const review = await _Review.default.findById(reviewId);
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
      decodedToken = _jsonwebtoken.default.verify(token, JWT_SECRET);
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
    if (!_mongoose.default.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "ID đánh giá không hợp lệ"
      });
    }

    // Tìm đánh giá
    const review = await _Review.default.findById(reviewId);
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
};exports.deleteReply = deleteReply;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfbW9uZ29vc2UiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9SZXZpZXciLCJfUmVnaXN0ZXIiLCJfUHJvZHVjdHMiLCJfdG9rZW5FeHRyYWN0b3IiLCJfanNvbndlYnRva2VuIiwiX2RvdGVudiIsIl9ub3RpZmljYXRpb25TZXJ2aWNlIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiZG90ZW52IiwiY29uZmlnIiwiSldUX1NFQ1JFVCIsInByb2Nlc3MiLCJlbnYiLCJKV1RfU0VDUkVUX0FDQ0VTUyIsImdldFByb2R1Y3RSZXZpZXdzIiwicmVxIiwicmVzIiwicHJvZHVjdElkIiwicGFyYW1zIiwibW9uZ29vc2UiLCJUeXBlcyIsIk9iamVjdElkIiwiaXNWYWxpZCIsInN0YXR1cyIsImpzb24iLCJzdWNjZXNzIiwibWVzc2FnZSIsInJldmlld3MiLCJSZXZpZXciLCJmaW5kIiwiaXNQdWJsaXNoZWQiLCJzb3J0IiwiY3JlYXRlZEF0IiwicHJvZHVjdCIsIlByb2R1Y3QiLCJmaW5kQnlJZCIsImRhdGEiLCJhdmVyYWdlUmF0aW5nIiwibnVtT2ZSZXZpZXdzIiwiZXJyb3IiLCJjb25zb2xlIiwiZXhwb3J0cyIsImFkZFJldmlldyIsInJhdGluZyIsImNvbW1lbnQiLCJ1c2VyTmFtZSIsImJvZHkiLCJ0b2tlbiIsImdldFRva2VuRnJvbSIsImRlY29kZWRUb2tlbiIsImp3dCIsInZlcmlmeSIsImlkIiwidXNlcklkIiwidXNlciIsIlVzZXIiLCJleGlzdGluZ1JldmlldyIsImZpbmRPbmUiLCJuZXdSZXZpZXciLCJwYXJzZUZsb2F0IiwiZmlyc3ROYW1lIiwibGFzdE5hbWUiLCJ1c2VySW1hZ2UiLCJzYXZlIiwidXBkYXRlUmV2aWV3IiwicmV2aWV3SWQiLCJyZXZpZXciLCJ0b1N0cmluZyIsImlzQWRtaW4iLCJkZWxldGVSZXZpZXciLCJmaW5kQnlJZEFuZERlbGV0ZSIsImNhbGN1bGF0ZUF2ZXJhZ2VSYXRpbmciLCJnZXRBbGxSZXZpZXdzIiwicXVlcnkiLCJwYWdlIiwicGFyc2VJbnQiLCJsaW1pdCIsInNraXAiLCJwb3B1bGF0ZSIsInBhdGgiLCJzZWxlY3QiLCJ0b3RhbCIsImNvdW50RG9jdW1lbnRzIiwicGFnaW5hdGlvbiIsInBhZ2VzIiwiTWF0aCIsImNlaWwiLCJyb2xlIiwidmVyaWZ5RXJyb3IiLCJ0b2dnbGVSZXZpZXdQdWJsaXNoU3RhdHVzIiwicmVwbHlUb1JldmlldyIsInRleHQiLCJsb2ciLCJ0cmltIiwiYWRtaW5JZCIsInJlcGx5IiwicmVwbGllcyIsInB1c2giLCJzZW5kUmV2aWV3UmVwbHlOb3RpZmljYXRpb24iLCJjYXRjaCIsIm5vdGlmaWNhdGlvbkVycm9yIiwiZWRpdFJlcGx5IiwicmVwbHlJZCIsImlzT3duZXIiLCJkZWxldGVSZXBseSIsInB1bGwiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQ29udHJvbGxlci9yZXZpZXdDb250cm9sbGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVmICovXG5pbXBvcnQgbW9uZ29vc2UgZnJvbSBcIm1vbmdvb3NlXCI7XG5pbXBvcnQgUmV2aWV3IGZyb20gXCIuLi9Nb2RlbC9SZXZpZXcuanNcIjtcbmltcG9ydCBVc2VyIGZyb20gXCIuLi9Nb2RlbC9SZWdpc3Rlci5qc1wiO1xuaW1wb3J0IFByb2R1Y3QgZnJvbSBcIi4uL01vZGVsL1Byb2R1Y3RzLmpzXCI7XG5pbXBvcnQgeyBnZXRUb2tlbkZyb20gfSBmcm9tIFwiLi4vdXRpbHMvdG9rZW5FeHRyYWN0b3IuanNcIjtcbmltcG9ydCBqd3QgZnJvbSBcImpzb253ZWJ0b2tlblwiO1xuaW1wb3J0IGRvdGVudiBmcm9tIFwiZG90ZW52XCI7XG5pbXBvcnQgeyBzZW5kUmV2aWV3UmVwbHlOb3RpZmljYXRpb24gfSBmcm9tIFwiLi4vU2VydmljZXMvbm90aWZpY2F0aW9uU2VydmljZS5qc1wiO1xuXG4vLyBLaOG7n2kgdOG6oW8gY+G6pXUgaMOsbmggZG90ZW52XG5kb3RlbnYuY29uZmlnKCk7XG5cbi8vIEzhuqV5IEpXVF9TRUNSRVQgdOG7qyBiaeG6v24gbcO0aSB0csaw4budbmcgLSBwcm9jZXNzIGlzIGF2YWlsYWJsZSBpbiBOb2RlLmpzIGJ5IGRlZmF1bHRcbmNvbnN0IEpXVF9TRUNSRVQgPSBwcm9jZXNzLmVudi5KV1RfU0VDUkVUX0FDQ0VTUyB8fCBcIlNFQ1JFVF9BQ0NFU1NcIjtcblxuLy8gTOG6pXkgdOG6pXQgY+G6oyDEkcOhbmggZ2nDoSBjaG8gbeG7mXQgc+G6o24gcGjhuqltXG5leHBvcnQgY29uc3QgZ2V0UHJvZHVjdFJldmlld3MgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHByb2R1Y3RJZCB9ID0gcmVxLnBhcmFtcztcbiAgICBcbiAgICAvLyBLaeG7g20gdHJhIHByb2R1Y3RJZCBjw7MgxJHDum5nIMSR4buLbmggZOG6oW5nIGtow7RuZ1xuICAgIGlmICghbW9uZ29vc2UuVHlwZXMuT2JqZWN0SWQuaXNWYWxpZChwcm9kdWN0SWQpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICBtZXNzYWdlOiBcIklEIHPhuqNuIHBo4bqpbSBraMO0bmcgaOG7o3AgbOG7h1wiIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVMOsbSB04bqldCBj4bqjIMSRw6FuaCBnacOhIGPhu6dhIHPhuqNuIHBo4bqpbSwgc29ydCB0aGVvIHRo4budaSBnaWFuIG3hu5tpIG5o4bqldFxuICAgIGNvbnN0IHJldmlld3MgPSBhd2FpdCBSZXZpZXcuZmluZCh7IFxuICAgICAgcHJvZHVjdElkLFxuICAgICAgaXNQdWJsaXNoZWQ6IHRydWUgXG4gICAgfSkuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSk7XG5cbiAgICAvLyBM4bqleSB0aMO0bmcgdGluIGNoaSB0aeG6v3Qgc+G6o24gcGjhuqltXG4gICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQocHJvZHVjdElkKTtcbiAgICBpZiAoIXByb2R1Y3QpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IHPhuqNuIHBo4bqpbVwiIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHJldmlld3MsXG4gICAgICAgIGF2ZXJhZ2VSYXRpbmc6IHByb2R1Y3QuYXZlcmFnZVJhdGluZyB8fCAwLFxuICAgICAgICBudW1PZlJldmlld3M6IHByb2R1Y3QubnVtT2ZSZXZpZXdzIHx8IDBcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGzhuqV5IMSRw6FuaCBnacOhOlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSBs4bqleSDEkcOhbmggZ2nDoVwiLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gVGjDqm0gxJHDoW5oIGdpw6EgbeG7m2lcbmV4cG9ydCBjb25zdCBhZGRSZXZpZXcgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHJhdGluZywgY29tbWVudCwgcHJvZHVjdElkLCB1c2VyTmFtZSB9ID0gcmVxLmJvZHk7XG5cbiAgICAvLyBYw6FjIHRo4buxYyBuZ8aw4budaSBkw7luZyB04burIHRva2VuXG4gICAgY29uc3QgdG9rZW4gPSBnZXRUb2tlbkZyb20ocmVxKTtcbiAgICBpZiAoIXRva2VuKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICBtZXNzYWdlOiBcIkLhuqFuIGPhuqduIMSRxINuZyBuaOG6rXAgxJHhu4MgxJHDoW5oIGdpw6Egc+G6o24gcGjhuqltXCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNvZGVkVG9rZW4gPSBqd3QudmVyaWZ5KHRva2VuLCBKV1RfU0VDUkVUKTtcbiAgICBpZiAoIWRlY29kZWRUb2tlbi5pZCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJUb2tlbiBraMO0bmcgaOG7o3AgbOG7h1wiIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgdXNlcklkID0gZGVjb2RlZFRva2VuLmlkO1xuXG4gICAgLy8gS2nhu4NtIHRyYSBuZ8aw4budaSBkw7luZyBjw7MgdOG7k24gdOG6oWkga2jDtG5nXG4gICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuZmluZEJ5SWQodXNlcklkKTtcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IG5nxrDhu51pIGTDuW5nXCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBLaeG7g20gdHJhIHPhuqNuIHBo4bqpbSBjw7MgdOG7k24gdOG6oWkga2jDtG5nXG4gICAgaWYgKCFtb25nb29zZS5UeXBlcy5PYmplY3RJZC5pc1ZhbGlkKHByb2R1Y3RJZCkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgIG1lc3NhZ2U6IFwiSUQgc+G6o24gcGjhuqltIGtow7RuZyBo4bujcCBs4buHXCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9kdWN0ID0gYXdhaXQgUHJvZHVjdC5maW5kQnlJZChwcm9kdWN0SWQpO1xuICAgIGlmICghcHJvZHVjdCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgc+G6o24gcGjhuqltXCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBLaeG7g20gdHJhIHhlbSBuZ8aw4budaSBkw7luZyDEkcOjIMSRw6FuaCBnacOhIHPhuqNuIHBo4bqpbSBuw6B5IGNoxrBhXG4gICAgY29uc3QgZXhpc3RpbmdSZXZpZXcgPSBhd2FpdCBSZXZpZXcuZmluZE9uZSh7IHVzZXJJZCwgcHJvZHVjdElkIH0pO1xuICAgIGlmIChleGlzdGluZ1Jldmlldykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJC4bqhbiDEkcOjIMSRw6FuaCBnacOhIHPhuqNuIHBo4bqpbSBuw6B5IHLhu5NpXCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBU4bqhbyDEkcOhbmggZ2nDoSBt4bubaVxuICAgIGNvbnN0IG5ld1JldmlldyA9IG5ldyBSZXZpZXcoe1xuICAgICAgdXNlcklkLFxuICAgICAgcHJvZHVjdElkLFxuICAgICAgcmF0aW5nOiBwYXJzZUZsb2F0KHJhdGluZykgfHwgNSwgLy8gxJDhuqNtIGLhuqNvIHJhdGluZyBsw6Agc+G7kSBmbG9hdCwgbeG6t2MgxJHhu4tuaCBsw6AgNVxuICAgICAgY29tbWVudCxcbiAgICAgIHVzZXJOYW1lOiB1c2VyTmFtZSB8fCBgJHt1c2VyLmZpcnN0TmFtZX0gJHt1c2VyLmxhc3ROYW1lfWAsXG4gICAgICB1c2VySW1hZ2U6IHVzZXIudXNlckltYWdlIHx8IFwiXCIsXG4gICAgICAvLyBDw7MgdGjhu4Mga2nhu4NtIHRyYSB4ZW0gbmfGsOG7nWkgZMO5bmcgxJHDoyBtdWEgc+G6o24gcGjhuqltIGNoxrBhIHbDoCDEkeG6t3QgaXNWZXJpZmllZFxuICAgIH0pO1xuXG4gICAgLy8gTMawdSDEkcOhbmggZ2nDoVxuICAgIGF3YWl0IG5ld1Jldmlldy5zYXZlKCk7XG5cbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDEpLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwixJDDoW5oIGdpw6EgY+G7p2EgYuG6oW4gxJHDoyDEkcaw4bujYyBnaGkgbmjhuq1uXCIsXG4gICAgICBkYXRhOiBuZXdSZXZpZXdcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIHRow6ptIMSRw6FuaCBnacOhOlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSB0aMOqbSDEkcOhbmggZ2nDoVwiLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gQ+G6rXAgbmjhuq10IMSRw6FuaCBnacOhXG5leHBvcnQgY29uc3QgdXBkYXRlUmV2aWV3ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyByZXZpZXdJZCB9ID0gcmVxLnBhcmFtcztcbiAgICBjb25zdCB7IHJhdGluZywgY29tbWVudCB9ID0gcmVxLmJvZHk7XG5cbiAgICAvLyBYw6FjIHRo4buxYyBuZ8aw4budaSBkw7luZ1xuICAgIGNvbnN0IHRva2VuID0gZ2V0VG9rZW5Gcm9tKHJlcSk7XG4gICAgaWYgKCF0b2tlbikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgY8OzIHF1eeG7gW4gY+G6rXAgbmjhuq10IMSRw6FuaCBnacOhXCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNvZGVkVG9rZW4gPSBqd3QudmVyaWZ5KHRva2VuLCBKV1RfU0VDUkVUKTtcbiAgICBjb25zdCB1c2VySWQgPSBkZWNvZGVkVG9rZW4uaWQ7XG5cbiAgICAvLyBLaeG7g20gdHJhIHhlbSDEkcOhbmggZ2nDoSBjw7MgdOG7k24gdOG6oWkga2jDtG5nXG4gICAgaWYgKCFtb25nb29zZS5UeXBlcy5PYmplY3RJZC5pc1ZhbGlkKHJldmlld0lkKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJJRCDEkcOhbmggZ2nDoSBraMO0bmcgaOG7o3AgbOG7h1wiIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVMOsbSDEkcOhbmggZ2nDoVxuICAgIGNvbnN0IHJldmlldyA9IGF3YWl0IFJldmlldy5maW5kQnlJZChyZXZpZXdJZCk7XG4gICAgaWYgKCFyZXZpZXcpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRw6FuaCBnacOhXCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBLaeG7g20gdHJhIHF1eeG7gW4gY+G6rXAgbmjhuq10XG4gICAgaWYgKHJldmlldy51c2VySWQudG9TdHJpbmcoKSAhPT0gdXNlcklkICYmICFkZWNvZGVkVG9rZW4uaXNBZG1pbikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJC4bqhbiBraMO0bmcgY8OzIHF1eeG7gW4gY+G6rXAgbmjhuq10IMSRw6FuaCBnacOhIG7DoHlcIiBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEPhuq1wIG5o4bqtdCDEkcOhbmggZ2nDoVxuICAgIHJldmlldy5yYXRpbmcgPSBwYXJzZUZsb2F0KHJhdGluZykgfHwgcmV2aWV3LnJhdGluZzsgLy8gU+G7rSBk4bulbmcgZ2nDoSB0cuG7iyBjxakgbuG6v3Uga2jDtG5nIGPDsyBnacOhIHRy4buLIG3hu5tpXG4gICAgcmV2aWV3LmNvbW1lbnQgPSBjb21tZW50O1xuICAgIGF3YWl0IHJldmlldy5zYXZlKCk7XG5cbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwixJDDoW5oIGdpw6EgxJHDoyDEkcaw4bujYyBj4bqtcCBuaOG6rXRcIixcbiAgICAgIGRhdGE6IHJldmlld1xuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IMSRw6FuaCBnacOhOlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgxJHDoW5oIGdpw6FcIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIFjDs2EgxJHDoW5oIGdpw6FcbmV4cG9ydCBjb25zdCBkZWxldGVSZXZpZXcgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHJldmlld0lkIH0gPSByZXEucGFyYW1zO1xuXG4gICAgLy8gWMOhYyB0aOG7sWMgbmfGsOG7nWkgZMO5bmdcbiAgICBjb25zdCB0b2tlbiA9IGdldFRva2VuRnJvbShyZXEpO1xuICAgIGlmICghdG9rZW4pIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIGPDsyBxdXnhu4FuIHjDs2EgxJHDoW5oIGdpw6FcIiBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IGp3dC52ZXJpZnkodG9rZW4sIEpXVF9TRUNSRVQpO1xuICAgIGNvbnN0IHVzZXJJZCA9IGRlY29kZWRUb2tlbi5pZDtcblxuICAgIC8vIEtp4buDbSB0cmEgeGVtIMSRw6FuaCBnacOhIGPDsyB04buTbiB04bqhaSBraMO0bmdcbiAgICBpZiAoIW1vbmdvb3NlLlR5cGVzLk9iamVjdElkLmlzVmFsaWQocmV2aWV3SWQpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICBtZXNzYWdlOiBcIklEIMSRw6FuaCBnacOhIGtow7RuZyBo4bujcCBs4buHXCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBUw6xtIMSRw6FuaCBnacOhXG4gICAgY29uc3QgcmV2aWV3ID0gYXdhaXQgUmV2aWV3LmZpbmRCeUlkKHJldmlld0lkKTtcbiAgICBpZiAoIXJldmlldykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHDoW5oIGdpw6FcIiBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEtp4buDbSB0cmEgcXV54buBbiB4w7NhXG4gICAgaWYgKHJldmlldy51c2VySWQudG9TdHJpbmcoKSAhPT0gdXNlcklkICYmICFkZWNvZGVkVG9rZW4uaXNBZG1pbikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJC4bqhbiBraMO0bmcgY8OzIHF1eeG7gW4geMOzYSDEkcOhbmggZ2nDoSBuw6B5XCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBMxrB1IHByb2R1Y3RJZCB0csaw4bubYyBraGkgeMOzYSDEkeG7gyBj4bqtcCBuaOG6rXQgbOG6oWkgcmF0aW5nXG4gICAgY29uc3QgcHJvZHVjdElkID0gcmV2aWV3LnByb2R1Y3RJZDtcblxuICAgIC8vIFjDs2EgxJHDoW5oIGdpw6FcbiAgICBhd2FpdCBSZXZpZXcuZmluZEJ5SWRBbmREZWxldGUocmV2aWV3SWQpO1xuXG4gICAgLy8gQ+G6rXAgbmjhuq10IGzhuqFpIHJhdGluZyBjaG8gc+G6o24gcGjhuqltXG4gICAgYXdhaXQgUmV2aWV3LmNhbGN1bGF0ZUF2ZXJhZ2VSYXRpbmcocHJvZHVjdElkKTtcblxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCLEkMOhbmggZ2nDoSDEkcOjIMSRxrDhu6NjIHjDs2EgdGjDoG5oIGPDtG5nXCJcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIHjDs2EgxJHDoW5oIGdpw6E6XCIsIGVycm9yKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIHjDs2EgxJHDoW5oIGdpw6FcIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIEFQSSBjaG8gQWRtaW46IEzhuqV5IHThuqV0IGPhuqMgxJHDoW5oIGdpw6FcbmV4cG9ydCBjb25zdCBnZXRBbGxSZXZpZXdzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgLy8gTOG6pXkgdG9rZW4gdOG7qyBxdWVyeSBwYXJhbWV0ZXIgaG/hurdjIHThu6sgYXV0aG9yaXphdGlvbiBoZWFkZXJcbiAgICBsZXQgdG9rZW4gPSByZXEucXVlcnkudG9rZW4gfHwgZ2V0VG9rZW5Gcm9tKHJlcSk7XG5cbiAgICBpZiAoIXRva2VuKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyBjw7MgcXV54buBbiB0cnV5IGPhuq1wXCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBUcsaw4budbmcgaOG7o3AgxJHhurdjIGJp4buHdCAtIHRva2VuIGhhcmRjb2RlZCBjaG8gYWRtaW4gVEtoaWVtXG4gICAgaWYgKHRva2VuID09PSBcImFkbWluLXRva2VuLWZvci1US2hpZW1cIikge1xuICAgICBcbiAgICAgIFxuICAgICAgLy8gQuG7jyBxdWEgeMOhYyB0aOG7sWMgSldULCB0cuG7sWMgdGnhur9wIGzhuqV5IGThu68gbGnhu4d1XG4gICAgICAvLyBQaMOibiB0cmFuZ1xuICAgICAgY29uc3QgcGFnZSA9IHBhcnNlSW50KHJlcS5xdWVyeS5wYWdlKSB8fCAxO1xuICAgICAgY29uc3QgbGltaXQgPSBwYXJzZUludChyZXEucXVlcnkubGltaXQpIHx8IDEwO1xuICAgICAgY29uc3Qgc2tpcCA9IChwYWdlIC0gMSkgKiBsaW1pdDtcblxuICAgICAgLy8gVMOsbSB04bqldCBj4bqjIMSRw6FuaCBnacOhXG4gICAgICBjb25zdCByZXZpZXdzID0gYXdhaXQgUmV2aWV3LmZpbmQoKVxuICAgICAgICAuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSlcbiAgICAgICAgLnNraXAoc2tpcClcbiAgICAgICAgLmxpbWl0KGxpbWl0KVxuICAgICAgICAucG9wdWxhdGUoe1xuICAgICAgICAgIHBhdGg6ICdwcm9kdWN0SWQnLFxuICAgICAgICAgIHNlbGVjdDogJ3Byb2R1Y3ROYW1lIHByb2R1Y3RJbWFnZXMgcHJpY2UgY2F0ZWdvcnknXG4gICAgICAgIH0pO1xuXG4gICAgICAvLyDEkOG6v20gdOG7lW5nIHPhu5EgxJHDoW5oIGdpw6FcbiAgICAgIGNvbnN0IHRvdGFsID0gYXdhaXQgUmV2aWV3LmNvdW50RG9jdW1lbnRzKCk7XG5cbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICByZXZpZXdzLFxuICAgICAgICAgIHBhZ2luYXRpb246IHtcbiAgICAgICAgICAgIHRvdGFsLFxuICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgIHBhZ2VzOiBNYXRoLmNlaWwodG90YWwgLyBsaW1pdClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEtp4buDbSB0cmEgeGVtIHRva2VuIGPDsyBo4bujcCBs4buHIGtow7RuZyB0csaw4bubYyBraGkgdmVyaWZ5XG4gICAgaWYgKCF0b2tlbiB8fCB0b2tlbiA9PT0gJ3VuZGVmaW5lZCcgfHwgdG9rZW4gPT09ICdudWxsJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJUb2tlbiBraMO0bmcgaOG7o3AgbOG7h1wiIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIFZlcmlmeSB0b2tlbiB0cm9uZyBibG9jayB0cnktY2F0Y2ggcmnDqm5nIMSR4buDIHjhu60gbMO9IGzhu5dpIHZlcmlmeVxuICAgICAgY29uc3QgZGVjb2RlZFRva2VuID0gand0LnZlcmlmeSh0b2tlbiwgSldUX1NFQ1JFVCk7XG4gICAgICBcbiAgICAgIC8vIEtp4buDbSB0cmEgcXV54buBbiBhZG1pbiBob+G6t2MgbWFuYWdlclxuICAgICAgaWYgKCFkZWNvZGVkVG9rZW4uaXNBZG1pbiAmJiBkZWNvZGVkVG9rZW4ucm9sZSAhPT0gXCJtYW5hZ2VyXCIpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICAgIG1lc3NhZ2U6IFwiQ2jhu4kgYWRtaW4gaG/hurdjIG1hbmFnZXIgbeG7m2kgY8OzIHF1eeG7gW4geGVtIHThuqV0IGPhuqMgxJHDoW5oIGdpw6FcIiBcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFBow6JuIHRyYW5nXG4gICAgICBjb25zdCBwYWdlID0gcGFyc2VJbnQocmVxLnF1ZXJ5LnBhZ2UpIHx8IDE7XG4gICAgICBjb25zdCBsaW1pdCA9IHBhcnNlSW50KHJlcS5xdWVyeS5saW1pdCkgfHwgMTA7XG4gICAgICBjb25zdCBza2lwID0gKHBhZ2UgLSAxKSAqIGxpbWl0O1xuXG4gICAgICAvLyBUw6xtIHThuqV0IGPhuqMgxJHDoW5oIGdpw6FcbiAgICAgIGNvbnN0IHJldmlld3MgPSBhd2FpdCBSZXZpZXcuZmluZCgpXG4gICAgICAgIC5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KVxuICAgICAgICAuc2tpcChza2lwKVxuICAgICAgICAubGltaXQobGltaXQpXG4gICAgICAgIC5wb3B1bGF0ZSh7XG4gICAgICAgICAgcGF0aDogJ3Byb2R1Y3RJZCcsXG4gICAgICAgICAgc2VsZWN0OiAncHJvZHVjdE5hbWUgcHJvZHVjdEltYWdlcyBwcmljZSBjYXRlZ29yeSdcbiAgICAgICAgfSk7XG5cbiAgICAgIC8vIMSQ4bq/bSB04buVbmcgc+G7kSDEkcOhbmggZ2nDoVxuICAgICAgY29uc3QgdG90YWwgPSBhd2FpdCBSZXZpZXcuY291bnREb2N1bWVudHMoKTtcblxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIHJldmlld3MsXG4gICAgICAgICAgcGFnaW5hdGlvbjoge1xuICAgICAgICAgICAgdG90YWwsXG4gICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgcGFnZXM6IE1hdGguY2VpbCh0b3RhbCAvIGxpbWl0KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9IGNhdGNoICh2ZXJpZnlFcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIHjDoWMgdGjhu7FjIHRva2VuOlwiLCB2ZXJpZnlFcnJvcik7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICBtZXNzYWdlOiBcIlRva2VuIGtow7RuZyBo4bujcCBs4buHIGhv4bq3YyDEkcOjIGjhur90IGjhuqFuXCIsXG4gICAgICAgIGVycm9yOiB2ZXJpZnlFcnJvci5tZXNzYWdlXG4gICAgICB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBs4bqleSB04bqldCBj4bqjIMSRw6FuaCBnacOhOlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSBs4bqleSB04bqldCBj4bqjIMSRw6FuaCBnacOhXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBBUEkgY2hvIEFkbWluOiBD4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSBoaeG7g24gdGjhu4sgY+G7p2EgxJHDoW5oIGdpw6FcbmV4cG9ydCBjb25zdCB0b2dnbGVSZXZpZXdQdWJsaXNoU3RhdHVzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyByZXZpZXdJZCB9ID0gcmVxLnBhcmFtcztcblxuICAgIC8vIEzhuqV5IHRva2VuIHThu6sgcXVlcnkgcGFyYW1ldGVyIGhv4bq3YyB04burIGF1dGhvcml6YXRpb24gaGVhZGVyXG4gICAgbGV0IHRva2VuID0gcmVxLnF1ZXJ5LnRva2VuIHx8IGdldFRva2VuRnJvbShyZXEpO1xuXG4gICAgaWYgKCF0b2tlbikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgY8OzIHF1eeG7gW4gdHJ1eSBj4bqtcFwiIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVHLGsOG7nW5nIGjhu6NwIMSR4bq3YyBiaeG7h3QgLSB0b2tlbiBoYXJkY29kZWQgY2hvIGFkbWluIFRLaGllbVxuICAgIGlmICh0b2tlbiA9PT0gXCJhZG1pbi10b2tlbi1mb3ItVEtoaWVtXCIpIHtcbiAgICAgXG4gICAgICBcbiAgICAgIC8vIELhu48gcXVhIHjDoWMgdGjhu7FjIEpXVCwgdHLhu7FjIHRp4bq/cCBj4bqtcCBuaOG6rXRcbiAgICAgIC8vIEtp4buDbSB0cmEgeGVtIMSRw6FuaCBnacOhIGPDsyB04buTbiB04bqhaSBraMO0bmdcbiAgICAgIGlmICghbW9uZ29vc2UuVHlwZXMuT2JqZWN0SWQuaXNWYWxpZChyZXZpZXdJZCkpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICAgIG1lc3NhZ2U6IFwiSUQgxJHDoW5oIGdpw6Ega2jDtG5nIGjhu6NwIGzhu4dcIiBcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFTDrG0gxJHDoW5oIGdpw6FcbiAgICAgIGNvbnN0IHJldmlldyA9IGF3YWl0IFJldmlldy5maW5kQnlJZChyZXZpZXdJZCk7XG4gICAgICBpZiAoIXJldmlldykge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHDoW5oIGdpw6FcIiBcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEzGsHUgcHJvZHVjdElkIHRyxrDhu5tjIGtoaSBj4bqtcCBuaOG6rXRcbiAgICAgIGNvbnN0IHByb2R1Y3RJZCA9IHJldmlldy5wcm9kdWN0SWQ7XG5cbiAgICAgIC8vIEPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIGhp4buDbiB0aOG7i1xuICAgICAgcmV2aWV3LmlzUHVibGlzaGVkID0gIXJldmlldy5pc1B1Ymxpc2hlZDtcbiAgICAgIGF3YWl0IHJldmlldy5zYXZlKCk7XG5cbiAgICAgIC8vIEPhuq1wIG5o4bqtdCBs4bqhaSByYXRpbmcgY2hvIHPhuqNuIHBo4bqpbVxuICAgICAgYXdhaXQgUmV2aWV3LmNhbGN1bGF0ZUF2ZXJhZ2VSYXRpbmcocHJvZHVjdElkKTtcblxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgbWVzc2FnZTogYMSQw6FuaCBnacOhIMSRw6MgxJHGsOG7o2MgJHtyZXZpZXcuaXNQdWJsaXNoZWQgPyAnaGnhu4NuIHRo4buLJyA6ICfhuqluJ30gdGjDoG5oIGPDtG5nYCxcbiAgICAgICAgZGF0YTogcmV2aWV3XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBLaeG7g20gdHJhIHhlbSB0b2tlbiBjw7MgaOG7o3AgbOG7hyBraMO0bmcgdHLGsOG7m2Mga2hpIHZlcmlmeVxuICAgIGlmICghdG9rZW4gfHwgdG9rZW4gPT09ICd1bmRlZmluZWQnIHx8IHRva2VuID09PSAnbnVsbCcpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgIG1lc3NhZ2U6IFwiVG9rZW4ga2jDtG5nIGjhu6NwIGzhu4dcIiBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAvLyBWZXJpZnkgdG9rZW4gdHJvbmcgYmxvY2sgdHJ5LWNhdGNoIHJpw6puZyDEkeG7gyB44butIGzDvSBs4buXaSB2ZXJpZnlcbiAgICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IGp3dC52ZXJpZnkodG9rZW4sIEpXVF9TRUNSRVQpO1xuICAgICAgXG4gICAgICAvLyBLaeG7g20gdHJhIHF1eeG7gW4gYWRtaW5cbiAgICAgIGlmICghZGVjb2RlZFRva2VuLmlzQWRtaW4pIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICAgIG1lc3NhZ2U6IFwiQ2jhu4kgYWRtaW4gbeG7m2kgY8OzIHF1eeG7gW4gY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHDoW5oIGdpw6FcIiBcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEtp4buDbSB0cmEgeGVtIMSRw6FuaCBnacOhIGPDsyB04buTbiB04bqhaSBraMO0bmdcbiAgICAgIGlmICghbW9uZ29vc2UuVHlwZXMuT2JqZWN0SWQuaXNWYWxpZChyZXZpZXdJZCkpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICAgIG1lc3NhZ2U6IFwiSUQgxJHDoW5oIGdpw6Ega2jDtG5nIGjhu6NwIGzhu4dcIiBcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFTDrG0gxJHDoW5oIGdpw6FcbiAgICAgIGNvbnN0IHJldmlldyA9IGF3YWl0IFJldmlldy5maW5kQnlJZChyZXZpZXdJZCk7XG4gICAgICBpZiAoIXJldmlldykge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHDoW5oIGdpw6FcIiBcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEzGsHUgcHJvZHVjdElkIHRyxrDhu5tjIGtoaSBj4bqtcCBuaOG6rXRcbiAgICAgIGNvbnN0IHByb2R1Y3RJZCA9IHJldmlldy5wcm9kdWN0SWQ7XG5cbiAgICAgIC8vIEPhuq1wIG5o4bqtdCB0cuG6oW5nIHRow6FpIGhp4buDbiB0aOG7i1xuICAgICAgcmV2aWV3LmlzUHVibGlzaGVkID0gIXJldmlldy5pc1B1Ymxpc2hlZDtcbiAgICAgIGF3YWl0IHJldmlldy5zYXZlKCk7XG5cbiAgICAgIC8vIEPhuq1wIG5o4bqtdCBs4bqhaSByYXRpbmcgY2hvIHPhuqNuIHBo4bqpbVxuICAgICAgYXdhaXQgUmV2aWV3LmNhbGN1bGF0ZUF2ZXJhZ2VSYXRpbmcocHJvZHVjdElkKTtcblxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgbWVzc2FnZTogYMSQw6FuaCBnacOhIMSRw6MgxJHGsOG7o2MgJHtyZXZpZXcuaXNQdWJsaXNoZWQgPyAnaGnhu4NuIHRo4buLJyA6ICfhuqluJ30gdGjDoG5oIGPDtG5nYCxcbiAgICAgICAgZGF0YTogcmV2aWV3XG4gICAgICB9KTtcbiAgICB9IGNhdGNoICh2ZXJpZnlFcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIHjDoWMgdGjhu7FjIHRva2VuOlwiLCB2ZXJpZnlFcnJvcik7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICBtZXNzYWdlOiBcIlRva2VuIGtow7RuZyBo4bujcCBs4buHIGhv4bq3YyDEkcOjIGjhur90IGjhuqFuXCIsXG4gICAgICAgIGVycm9yOiB2ZXJpZnlFcnJvci5tZXNzYWdlXG4gICAgICB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgdHLhuqFuZyB0aMOhaSDEkcOhbmggZ2nDoTpcIiwgZXJyb3IpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgY+G6rXAgbmjhuq10IHRy4bqhbmcgdGjDoWkgxJHDoW5oIGdpw6FcIixcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIFRow6ptIHBo4bqjbiBo4buTaSBjaG8gxJHDoW5oIGdpw6FcbmV4cG9ydCBjb25zdCByZXBseVRvUmV2aWV3ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyByZXZpZXdJZCB9ID0gcmVxLnBhcmFtcztcbiAgICBjb25zdCB7IHRleHQgfSA9IHJlcS5ib2R5O1xuICAgIFxuICAgIGNvbnNvbGUubG9nKFwiUmVxdWVzdCBib2R5OlwiLCByZXEuYm9keSk7XG4gICAgXG4gICAgaWYgKCF0ZXh0IHx8ICF0ZXh0LnRyaW0oKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJO4buZaSBkdW5nIHBo4bqjbiBo4buTaSBraMO0bmcgxJHGsOG7o2MgxJHhu4MgdHLhu5FuZ1wiIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gTOG6pXkgdG9rZW4gdOG7qyBxdWVyeSBwYXJhbWV0ZXIgaG/hurdjIHThu6sgYXV0aG9yaXphdGlvbiBoZWFkZXJcbiAgICBsZXQgdG9rZW4gPSByZXEucXVlcnkudG9rZW4gfHwgZ2V0VG9rZW5Gcm9tKHJlcSk7XG4gICAgY29uc29sZS5sb2coXCJUb2tlbiBmcm9tIHJlcXVlc3Q6XCIsIHRva2VuKTtcbiAgICBcbiAgICBpZiAoIXRva2VuKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyBjw7MgcXV54buBbiB0cuG6oyBs4budaSDEkcOhbmggZ2nDoVwiIFxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIFRyxrDhu51uZyBo4bujcCDEkeG6t2MgYmnhu4d0IC0gdG9rZW4gaGFyZGNvZGVkIGNobyBhZG1pbiBUS2hpZW1cbiAgICBpZiAodG9rZW4gPT09IFwiYWRtaW4tdG9rZW4tZm9yLVRLaGllbVwiKSB7XG4gICAgIFxuICAgICAgXG4gICAgICAvLyBLaeG7g20gdHJhIHhlbSDEkcOhbmggZ2nDoSBjw7MgdOG7k24gdOG6oWkga2jDtG5nXG4gICAgICBpZiAoIW1vbmdvb3NlLlR5cGVzLk9iamVjdElkLmlzVmFsaWQocmV2aWV3SWQpKSB7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICBtZXNzYWdlOiBcIklEIMSRw6FuaCBnacOhIGtow7RuZyBo4bujcCBs4buHXCIgXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBUw6xtIMSRw6FuaCBnacOhXG4gICAgICBjb25zdCByZXZpZXcgPSBhd2FpdCBSZXZpZXcuZmluZEJ5SWQocmV2aWV3SWQpO1xuICAgICAgaWYgKCFyZXZpZXcpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IMSRw6FuaCBnacOhXCIgXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBU4bqhbyBwaOG6o24gaOG7k2kgbeG7m2kgduG7m2kgdmFpIHRyw7IgYWRtaW4gLSBz4butIGThu6VuZyBJRCBo4bujcCBs4buHXG4gICAgICBjb25zdCBhZG1pbklkID0gbmV3IG1vbmdvb3NlLlR5cGVzLk9iamVjdElkKFwiNjVmNjJlMDlhYzNlYTRhZDIzMDIzMjkzXCIpOyAvLyBT4butIGThu6VuZyBJRCBhZG1pbiBj4buRIMSR4buLbmhcbiAgICAgIGNvbnN0IHJlcGx5ID0ge1xuICAgICAgICB1c2VySWQ6IGFkbWluSWQsIC8vIFPhu60gZOG7pW5nIE9iamVjdElkIGjhu6NwIGzhu4dcbiAgICAgICAgdXNlck5hbWU6IFwiQWRtaW5cIixcbiAgICAgICAgdGV4dDogdGV4dC50cmltKCksXG4gICAgICAgIGlzQWRtaW46IHRydWVcbiAgICAgIH07XG5cbiAgICAgIC8vIFRow6ptIHBo4bqjbiBo4buTaSB2w6BvIGRhbmggc8OhY2hcbiAgICAgIHJldmlldy5yZXBsaWVzLnB1c2gocmVwbHkpO1xuICAgICAgYXdhaXQgcmV2aWV3LnNhdmUoKTtcblxuICAgICAgLy8gR+G7rWkgdGjDtG5nIGLDoW8ga2hpIGFkbWluIHBo4bqjbiBo4buTaSDEkcOhbmggZ2nDoSBj4bunYSBuZ8aw4budaSBkw7luZ1xuICAgICAgaWYgKHJlcGx5LmlzQWRtaW4gJiYgcmV2aWV3LnVzZXJJZCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHNlbmRSZXZpZXdSZXBseU5vdGlmaWNhdGlvbihyZXZpZXcudXNlcklkLCByZXZpZXcsIHRleHQpXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5lcnJvcignRXJyb3Igc2VuZGluZyByZXZpZXcgcmVwbHkgbm90aWZpY2F0aW9uOicsIGVycm9yKSk7XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc29sZS5sb2coYMSQw6MgZ+G7rWkgdGjDtG5nIGLDoW8gcGjhuqNuIGjhu5NpIMSRw6FuaCBnacOhIMSR4bq/biB1c2VyICR7cmV2aWV3LnVzZXJJZH1gKTtcbiAgICAgICAgfSBjYXRjaCAobm90aWZpY2F0aW9uRXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdM4buXaSBraGkgZ+G7rWkgdGjDtG5nIGLDoW8gcGjhuqNuIGjhu5NpIMSRw6FuaCBnacOhOicsIG5vdGlmaWNhdGlvbkVycm9yKTtcbiAgICAgICAgICAvLyBLaMO0bmcg4bqjbmggaMaw4bufbmcgxJHhur9uIHZp4buHYyB0cuG6oyB24buBIHJlc3BvbnNlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgbWVzc2FnZTogXCLEkMOjIHRow6ptIHBo4bqjbiBo4buTaSB0aMOgbmggY8O0bmdcIixcbiAgICAgICAgZGF0YTogcmV2aWV3XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsZXQgZGVjb2RlZFRva2VuO1xuICAgIHRyeSB7XG4gICAgICBkZWNvZGVkVG9rZW4gPSBqd3QudmVyaWZ5KHRva2VuLCBKV1RfU0VDUkVUKTtcbiAgICAgIFxuICAgICAgXG4gICAgICBpZiAoIWRlY29kZWRUb2tlbi5pZCkge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgbWVzc2FnZTogXCJUb2tlbiBraMO0bmcgaOG7o3AgbOG7h1wiIFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIHjDoWMgdGjhu7FjIHRva2VuOlwiLCBlcnJvcik7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICBtZXNzYWdlOiBcIlRva2VuIGtow7RuZyBo4bujcCBs4buHIGhv4bq3YyDEkcOjIGjhur90IGjhuqFuXCIsIFxuICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHVzZXJJZCA9IGRlY29kZWRUb2tlbi5pZDtcbiAgICBjb25zb2xlLmxvZyhcIlVzZXIgSUQgZnJvbSB0b2tlbjpcIiwgdXNlcklkKTtcblxuICAgIC8vIEtp4buDbSB0cmEgeGVtIMSRw6FuaCBnacOhIGPDsyB04buTbiB04bqhaSBraMO0bmdcbiAgICBpZiAoIW1vbmdvb3NlLlR5cGVzLk9iamVjdElkLmlzVmFsaWQocmV2aWV3SWQpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICBtZXNzYWdlOiBcIklEIMSRw6FuaCBnacOhIGtow7RuZyBo4bujcCBs4buHXCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBUw6xtIMSRw6FuaCBnacOhXG4gICAgY29uc3QgcmV2aWV3ID0gYXdhaXQgUmV2aWV3LmZpbmRCeUlkKHJldmlld0lkKTtcbiAgICBpZiAoIXJldmlldykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHDoW5oIGdpw6FcIiBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEtp4buDbSB0cmEgeGVtIG5nxrDhu51pIGTDuW5nIGPDsyB04buTbiB04bqhaSBraMO0bmdcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kQnlJZCh1c2VySWQpO1xuICAgIGlmICghdXNlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgbmfGsOG7nWkgZMO5bmdcIiBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIELhu48ga2nhu4NtIHRyYSBxdXnhu4FuIHRy4bqjIGzhu51pIC0gY2hvIHBow6lwIGLhuqV0IGvhu7MgbmfGsOG7nWkgZMO5bmcgbsOgbyDEkcOjIMSRxINuZyBuaOG6rXAgxJHhu4F1IGPDsyB0aOG7gyB0cuG6oyBs4budaVxuICAgIC8vIFbhuqtuIHBow6JuIGJp4buHdCB2YWkgdHLDsiBhZG1pbi9uZ8aw4budaSBkw7luZyDEkeG7gyBoaeG7g24gdGjhu4sga2jDoWMgbmhhdVxuICAgIGNvbnN0IGlzQWRtaW4gPSBkZWNvZGVkVG9rZW4uaXNBZG1pbiB8fCBkZWNvZGVkVG9rZW4ucm9sZSA9PT0gJ2FkbWluJztcbiAgICBcbiAgICAvLyBU4bqhbyBwaOG6o24gaOG7k2kgbeG7m2lcbiAgICBjb25zdCByZXBseSA9IHtcbiAgICAgIHVzZXJJZDogdXNlcklkLFxuICAgICAgdXNlck5hbWU6IGlzQWRtaW4gPyAnQWRtaW4nIDogYCR7dXNlci5maXJzdE5hbWV9ICR7dXNlci5sYXN0TmFtZX1gLFxuICAgICAgdGV4dDogdGV4dC50cmltKCksXG4gICAgICBpc0FkbWluOiBpc0FkbWluXG4gICAgfTtcblxuICAgIGlmIChpc0FkbWluKSB7XG4gICAgICByZXBseS5hZG1pbklkID0gdXNlcklkO1xuICAgIH1cblxuICAgIC8vIEluIHJhIHRow7RuZyB0aW4gcGjhuqNuIGjhu5NpIHRyxrDhu5tjIGtoaSBsxrB1XG4gICAgY29uc29sZS5sb2coXCJSZXBseSB0byBiZSBhZGRlZDpcIiwgcmVwbHkpO1xuXG4gICAgLy8gVGjDqm0gcGjhuqNuIGjhu5NpIHbDoG8gZGFuaCBzw6FjaFxuICAgIHJldmlldy5yZXBsaWVzLnB1c2gocmVwbHkpO1xuICAgIGF3YWl0IHJldmlldy5zYXZlKCk7XG5cbiAgICAvLyBH4butaSB0aMO0bmcgYsOhbyBraGkgYWRtaW4gcGjhuqNuIGjhu5NpIMSRw6FuaCBnacOhIGPhu6dhIG5nxrDhu51pIGTDuW5nXG4gICAgaWYgKGlzQWRtaW4gJiYgcmV2aWV3LnVzZXJJZCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgc2VuZFJldmlld1JlcGx5Tm90aWZpY2F0aW9uKHJldmlldy51c2VySWQsIHJldmlldywgdGV4dClcbiAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5lcnJvcignRXJyb3Igc2VuZGluZyByZXZpZXcgcmVwbHkgbm90aWZpY2F0aW9uOicsIGVycm9yKSk7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhgxJDDoyBn4butaSB0aMO0bmcgYsOhbyBwaOG6o24gaOG7k2kgxJHDoW5oIGdpw6EgxJHhur9uIHVzZXIgJHtyZXZpZXcudXNlcklkfWApO1xuICAgICAgfSBjYXRjaCAobm90aWZpY2F0aW9uRXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTOG7l2kga2hpIGfhu61pIHRow7RuZyBiw6FvIHBo4bqjbiBo4buTaSDEkcOhbmggZ2nDoTonLCBub3RpZmljYXRpb25FcnJvcik7XG4gICAgICAgIC8vIEtow7RuZyDhuqNuaCBoxrDhu59uZyDEkeG6v24gdmnhu4djIHRy4bqjIHbhu4EgcmVzcG9uc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDEpLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB0aMOqbSBwaOG6o24gaOG7k2kgdGjDoG5oIGPDtG5nXCIsXG4gICAgICBkYXRhOiByZXZpZXdcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgdGjDqm0gcGjhuqNuIGjhu5NpIGNobyDEkcOhbmggZ2nDoTpcIiwgZXJyb3IpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwixJDDoyB44bqjeSByYSBs4buXaSBraGkgdGjDqm0gcGjhuqNuIGjhu5NpXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBDaOG7iW5oIHPhu61hIHBo4bqjbiBo4buTaVxuZXhwb3J0IGNvbnN0IGVkaXRSZXBseSA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgcmV2aWV3SWQsIHJlcGx5SWQgfSA9IHJlcS5wYXJhbXM7XG4gICAgY29uc3QgeyB0ZXh0IH0gPSByZXEuYm9keTtcblxuICAgIGlmICghdGV4dCB8fCAhdGV4dC50cmltKCkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgIG1lc3NhZ2U6IFwiTuG7mWkgZHVuZyBwaOG6o24gaOG7k2kga2jDtG5nIMSRxrDhu6NjIMSR4buDIHRy4buRbmdcIiBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEzhuqV5IHRva2VuIHThu6sgcXVlcnkgcGFyYW1ldGVyIGhv4bq3YyB04burIGF1dGhvcml6YXRpb24gaGVhZGVyXG4gICAgbGV0IHRva2VuID0gcmVxLnF1ZXJ5LnRva2VuIHx8IGdldFRva2VuRnJvbShyZXEpO1xuICAgIGNvbnNvbGUubG9nKFwiVG9rZW4gZnJvbSByZXF1ZXN0OlwiLCB0b2tlbik7XG4gICAgXG4gICAgaWYgKCF0b2tlbikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgY8OzIHF1eeG7gW4gY2jhu4luaCBz4butYSBwaOG6o24gaOG7k2lcIiBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBUcsaw4budbmcgaOG7o3AgxJHhurdjIGJp4buHdCAtIHRva2VuIGhhcmRjb2RlZCBjaG8gYWRtaW4gVEtoaWVtXG4gICAgaWYgKHRva2VuID09PSBcImFkbWluLXRva2VuLWZvci1US2hpZW1cIikge1xuICAgICBcbiAgICAgIFxuICAgICAgLy8gS2nhu4NtIHRyYSB4ZW0gxJHDoW5oIGdpw6EgY8OzIHThu5NuIHThuqFpIGtow7RuZ1xuICAgICAgaWYgKCFtb25nb29zZS5UeXBlcy5PYmplY3RJZC5pc1ZhbGlkKHJldmlld0lkKSkge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgbWVzc2FnZTogXCJJRCDEkcOhbmggZ2nDoSBraMO0bmcgaOG7o3AgbOG7h1wiIFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gVMOsbSDEkcOhbmggZ2nDoVxuICAgICAgY29uc3QgcmV2aWV3ID0gYXdhaXQgUmV2aWV3LmZpbmRCeUlkKHJldmlld0lkKTtcbiAgICAgIGlmICghcmV2aWV3KSB7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSDEkcOhbmggZ2nDoVwiIFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gVMOsbSBwaOG6o24gaOG7k2kgY+G6p24gY2jhu4luaCBz4butYVxuICAgICAgY29uc3QgcmVwbHkgPSByZXZpZXcucmVwbGllcy5pZChyZXBseUlkKTtcbiAgICAgIGlmICghcmVwbHkpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IHBo4bqjbiBo4buTaVwiIFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gQ+G6rXAgbmjhuq10IHBo4bqjbiBo4buTaSB24bubaSBxdXnhu4FuIGFkbWluXG4gICAgICByZXBseS50ZXh0ID0gdGV4dC50cmltKCk7XG4gICAgICBhd2FpdCByZXZpZXcuc2F2ZSgpO1xuXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBtZXNzYWdlOiBcIsSQw6MgY+G6rXAgbmjhuq10IHBo4bqjbiBo4buTaSB0aMOgbmggY8O0bmdcIixcbiAgICAgICAgZGF0YTogcmV2aWV3XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsZXQgZGVjb2RlZFRva2VuO1xuICAgIHRyeSB7XG4gICAgICBkZWNvZGVkVG9rZW4gPSBqd3QudmVyaWZ5KHRva2VuLCBKV1RfU0VDUkVUKTtcbiAgICAgIGlmICghZGVjb2RlZFRva2VuLmlkKSB7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICBtZXNzYWdlOiBcIlRva2VuIGtow7RuZyBo4bujcCBs4buHXCIgXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kgeMOhYyB0aOG7sWMgdG9rZW46XCIsIGVycm9yKTtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgIG1lc3NhZ2U6IFwiVG9rZW4ga2jDtG5nIGjhu6NwIGzhu4cgaG/hurdjIMSRw6MgaOG6v3QgaOG6oW5cIiwgXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgdXNlcklkID0gZGVjb2RlZFRva2VuLmlkO1xuXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gxJHDoW5oIGdpw6EgY8OzIHThu5NuIHThuqFpIGtow7RuZ1xuICAgIGlmICghbW9uZ29vc2UuVHlwZXMuT2JqZWN0SWQuaXNWYWxpZChyZXZpZXdJZCkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgIG1lc3NhZ2U6IFwiSUQgxJHDoW5oIGdpw6Ega2jDtG5nIGjhu6NwIGzhu4dcIiBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFTDrG0gxJHDoW5oIGdpw6FcbiAgICBjb25zdCByZXZpZXcgPSBhd2FpdCBSZXZpZXcuZmluZEJ5SWQocmV2aWV3SWQpO1xuICAgIGlmICghcmV2aWV3KSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSDEkcOhbmggZ2nDoVwiIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVMOsbSBwaOG6o24gaOG7k2kgY+G6p24gY2jhu4luaCBz4butYVxuICAgIGNvbnN0IHJlcGx5ID0gcmV2aWV3LnJlcGxpZXMuaWQocmVwbHlJZCk7XG4gICAgaWYgKCFyZXBseSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgcGjhuqNuIGjhu5NpXCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBLaeG7g20gdHJhIHF1eeG7gW4gY2jhu4luaCBz4butYSAoY2jhu4kgY2hvIHBow6lwIG5nxrDhu51pIHZp4bq/dCBwaOG6o24gaOG7k2kgaG/hurdjIGFkbWluKVxuICAgIGNvbnN0IGlzQWRtaW4gPSBkZWNvZGVkVG9rZW4uaXNBZG1pbiB8fCBkZWNvZGVkVG9rZW4ucm9sZSA9PT0gJ2FkbWluJztcbiAgICBjb25zdCBpc093bmVyID0gcmVwbHkudXNlcklkLnRvU3RyaW5nKCkgPT09IHVzZXJJZDtcbiAgICBcbiAgICBpZiAoIWlzQWRtaW4gJiYgIWlzT3duZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIkLhuqFuIGtow7RuZyBjw7MgcXV54buBbiBjaOG7iW5oIHPhu61hIHBo4bqjbiBo4buTaSBuw6B5XCJcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEPhuq1wIG5o4bqtdCBwaOG6o24gaOG7k2lcbiAgICByZXBseS50ZXh0ID0gdGV4dC50cmltKCk7XG4gICAgYXdhaXQgcmV2aWV3LnNhdmUoKTtcblxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIGPhuq1wIG5o4bqtdCBwaOG6o24gaOG7k2kgdGjDoG5oIGPDtG5nXCIsXG4gICAgICBkYXRhOiByZXZpZXdcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgY2jhu4luaCBz4butYSBwaOG6o24gaOG7k2k6XCIsIGVycm9yKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIsSQw6MgeOG6o3kgcmEgbOG7l2kga2hpIGNo4buJbmggc+G7rWEgcGjhuqNuIGjhu5NpXCIsXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBYw7NhIHBo4bqjbiBo4buTaVxuZXhwb3J0IGNvbnN0IGRlbGV0ZVJlcGx5ID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyByZXZpZXdJZCwgcmVwbHlJZCB9ID0gcmVxLnBhcmFtcztcblxuICAgIC8vIEzhuqV5IHRva2VuIHThu6sgcXVlcnkgcGFyYW1ldGVyIGhv4bq3YyB04burIGF1dGhvcml6YXRpb24gaGVhZGVyXG4gICAgbGV0IHRva2VuID0gcmVxLnF1ZXJ5LnRva2VuIHx8IGdldFRva2VuRnJvbShyZXEpO1xuICAgIGNvbnNvbGUubG9nKFwiVG9rZW4gZnJvbSByZXF1ZXN0OlwiLCB0b2tlbik7XG4gICAgXG4gICAgaWYgKCF0b2tlbikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgY8OzIHF1eeG7gW4geMOzYSBwaOG6o24gaOG7k2lcIiBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBUcsaw4budbmcgaOG7o3AgxJHhurdjIGJp4buHdCAtIHRva2VuIGhhcmRjb2RlZCBjaG8gYWRtaW4gVEtoaWVtXG4gICAgaWYgKHRva2VuID09PSBcImFkbWluLXRva2VuLWZvci1US2hpZW1cIikge1xuICAgICBcbiAgICAgIFxuICAgICAgLy8gS2nhu4NtIHRyYSB4ZW0gxJHDoW5oIGdpw6EgY8OzIHThu5NuIHThuqFpIGtow7RuZ1xuICAgICAgaWYgKCFtb25nb29zZS5UeXBlcy5PYmplY3RJZC5pc1ZhbGlkKHJldmlld0lkKSkge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgbWVzc2FnZTogXCJJRCDEkcOhbmggZ2nDoSBraMO0bmcgaOG7o3AgbOG7h1wiIFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gVMOsbSDEkcOhbmggZ2nDoVxuICAgICAgY29uc3QgcmV2aWV3ID0gYXdhaXQgUmV2aWV3LmZpbmRCeUlkKHJldmlld0lkKTtcbiAgICAgIGlmICghcmV2aWV3KSB7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSDEkcOhbmggZ2nDoVwiIFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gVMOsbSBwaOG6o24gaOG7k2kgY+G6p24geMOzYVxuICAgICAgY29uc3QgcmVwbHkgPSByZXZpZXcucmVwbGllcy5pZChyZXBseUlkKTtcbiAgICAgIGlmICghcmVwbHkpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IHBo4bqjbiBo4buTaVwiIFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gWMOzYSBwaOG6o24gaOG7k2kgduG7m2kgcXV54buBbiBhZG1pblxuICAgICAgcmV2aWV3LnJlcGxpZXMucHVsbChyZXBseUlkKTtcbiAgICAgIGF3YWl0IHJldmlldy5zYXZlKCk7XG5cbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIG1lc3NhZ2U6IFwixJDDoyB4w7NhIHBo4bqjbiBo4buTaSB0aMOgbmggY8O0bmdcIlxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbGV0IGRlY29kZWRUb2tlbjtcbiAgICB0cnkge1xuICAgICAgZGVjb2RlZFRva2VuID0gand0LnZlcmlmeSh0b2tlbiwgSldUX1NFQ1JFVCk7XG4gICAgICBpZiAoIWRlY29kZWRUb2tlbi5pZCkge1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgbWVzc2FnZTogXCJUb2tlbiBraMO0bmcgaOG7o3AgbOG7h1wiIFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkzhu5dpIHjDoWMgdGjhu7FjIHRva2VuOlwiLCBlcnJvcik7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICBtZXNzYWdlOiBcIlRva2VuIGtow7RuZyBo4bujcCBs4buHIGhv4bq3YyDEkcOjIGjhur90IGjhuqFuXCIsIFxuICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHVzZXJJZCA9IGRlY29kZWRUb2tlbi5pZDtcblxuICAgIC8vIEtp4buDbSB0cmEgeGVtIMSRw6FuaCBnacOhIGPDsyB04buTbiB04bqhaSBraMO0bmdcbiAgICBpZiAoIW1vbmdvb3NlLlR5cGVzLk9iamVjdElkLmlzVmFsaWQocmV2aWV3SWQpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICBtZXNzYWdlOiBcIklEIMSRw6FuaCBnacOhIGtow7RuZyBo4bujcCBs4buHXCIgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBUw6xtIMSRw6FuaCBnacOhXG4gICAgY29uc3QgcmV2aWV3ID0gYXdhaXQgUmV2aWV3LmZpbmRCeUlkKHJldmlld0lkKTtcbiAgICBpZiAoIXJldmlldykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgxJHDoW5oIGdpw6FcIiBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFTDrG0gcGjhuqNuIGjhu5NpIGPhuqduIHjDs2FcbiAgICBjb25zdCByZXBseSA9IHJldmlldy5yZXBsaWVzLmlkKHJlcGx5SWQpO1xuICAgIGlmICghcmVwbHkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IHBo4bqjbiBo4buTaVwiIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gS2nhu4NtIHRyYSBxdXnhu4FuIHjDs2EgKGNo4buJIGNobyBwaMOpcCBuZ8aw4budaSB2aeG6v3QgcGjhuqNuIGjhu5NpIGhv4bq3YyBhZG1pbilcbiAgICBjb25zdCBpc0FkbWluID0gZGVjb2RlZFRva2VuLmlzQWRtaW4gfHwgZGVjb2RlZFRva2VuLnJvbGUgPT09ICdhZG1pbic7XG4gICAgY29uc3QgaXNPd25lciA9IHJlcGx5LnVzZXJJZC50b1N0cmluZygpID09PSB1c2VySWQ7XG4gICAgXG4gICAgaWYgKCFpc0FkbWluICYmICFpc093bmVyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJC4bqhbiBraMO0bmcgY8OzIHF1eeG7gW4geMOzYSBwaOG6o24gaOG7k2kgbsOgeVwiXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBYw7NhIHBo4bqjbiBo4buTaVxuICAgIHJldmlldy5yZXBsaWVzLnB1bGwocmVwbHlJZCk7XG4gICAgYXdhaXQgcmV2aWV3LnNhdmUoKTtcblxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjDs2EgcGjhuqNuIGjhu5NpIHRow6BuaCBjw7RuZ1wiXG4gICAgfSk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIHjDs2EgcGjhuqNuIGjhu5NpOlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCLEkMOjIHjhuqN5IHJhIGzhu5dpIGtoaSB4w7NhIHBo4bqjbiBo4buTaVwiLFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICB9KTtcbiAgfVxufTsgIl0sIm1hcHBpbmdzIjoiO0FBQ0EsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsT0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsU0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsU0FBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksZUFBQSxHQUFBSixPQUFB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