import axios from "axios";
import { API_URLS } from "../config/apiConfig";

// Hàm lấy đánh giá của một sản phẩm
const getProductReviews = async (productId) => {
  try {
    console.log("Fetching reviews for product:", productId);
    const response = await axios.get(`${API_URLS.REVIEWS}/product/${productId}`);
    console.log("Reviews API response:", response.data);
    
    // Nếu dữ liệu trả về trực tiếp là mảng (không nằm trong .data)
    if (Array.isArray(response.data)) {
      return {
        reviews: response.data,
        averageRating: calculateAverageRating(response.data)
      };
    }
    
    // Nếu dữ liệu nằm trong response.data.data
    if (response.data.data) {
      // Kiểm tra xem data có phải là mảng không
      if (Array.isArray(response.data.data)) {
        return {
          reviews: response.data.data,
          averageRating: calculateAverageRating(response.data.data)
        };
      }
      // Nếu data có cấu trúc reviews và averageRating
      return response.data.data;
    }
    
    // Fallback nếu không có cấu trúc nào phù hợp
    return {
      reviews: [],
      averageRating: 0
    };
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá sản phẩm:", error);
    if (error.response) {
      console.log("Error response data:", error.response.data);
      console.log("Error status:", error.response.status);
    }
    // Trả về mảng rỗng nếu có lỗi
    return {
      reviews: [],
      averageRating: 0
    };
  }
};

// Hàm tính điểm đánh giá trung bình
const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + Number(review.rating || 0), 0);
  return sum / reviews.length;
};

// Hàm thêm đánh giá mới
const addReview = async (reviewData) => {
  try {
    const token = localStorage.getItem("accessToken") || 
                 localStorage.getItem("token");
    if (!token) {
      throw new Error("Bạn cần đăng nhập để đánh giá sản phẩm");
    }

    // Đảm bảo dữ liệu đánh giá hợp lệ
    if (!reviewData.productId) {
      throw new Error("Thiếu thông tin sản phẩm");
    }

    if (!reviewData.rating || reviewData.rating < 0 || reviewData.rating > 5) {
      throw new Error("Đánh giá phải có giá trị từ 0 đến 5");
    }

    if (!reviewData.comment || reviewData.comment.trim() === '') {
      throw new Error("Vui lòng nhập nội dung đánh giá");
    }

    // Chuyển rating thành số
    const formattedData = {
      ...reviewData,
      rating: Number(reviewData.rating)
    };

    console.log("Sending review data:", formattedData);
    console.log("Token:", token);
    console.log("URL:", `${API_URLS.REVIEWS}/product/${reviewData.productId}`);

    const response = await axios.post(
      `${API_URLS.REVIEWS}/product/${reviewData.productId}`,
      formattedData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi thêm đánh giá:", error);
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};

// Hàm cập nhật đánh giá
const updateReview = async (reviewId, reviewData) => {
  try {
    const token = localStorage.getItem("accessToken") || 
                 localStorage.getItem("token");
    if (!token) {
      throw new Error("Bạn cần đăng nhập để cập nhật đánh giá");
    }

    const response = await axios.put(
      `${API_URLS.REVIEWS}/${reviewId}`,
      reviewData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật đánh giá:", error);
    throw error;
  }
};

// Hàm xóa đánh giá
const deleteReview = async (reviewId) => {
  try {
    const token = localStorage.getItem("accessToken") || 
                 localStorage.getItem("token");
    if (!token) {
      throw new Error("Bạn cần đăng nhập để xóa đánh giá");
    }

    const response = await axios.delete(`${API_URLS.REVIEWS}/${reviewId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi xóa đánh giá:", error);
    throw error;
  }
};

// API cho Admin
const getAllReviews = async (page = 1, limit = 10) => {
  try {
    // Sử dụng token đặc biệt cho admin TKhiem
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      throw new Error("Bạn cần đăng nhập với quyền admin để xem tất cả đánh giá");
    }

    console.log('Sử dụng token để xem đánh giá:', token);

    const response = await axios.get(
      `${API_URLS.REVIEWS}/admin/all?page=${page}&limit=${limit}&token=${token}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi lấy tất cả đánh giá:", error);
    throw error;
  }
};

// Hàm cập nhật trạng thái hiển thị của đánh giá (admin)
const toggleReviewStatus = async (reviewId) => {
  try {
    // Sử dụng token đặc biệt cho admin TKhiem
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      throw new Error("Bạn cần đăng nhập với quyền admin để thực hiện hành động này");
    }

    console.log('Sử dụng token để cập nhật trạng thái đánh giá:', token);

    const response = await axios.patch(
      `${API_URLS.REVIEWS}/admin/toggle/${reviewId}?token=${token}`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đánh giá:", error);
    throw error;
  }
};

// Thêm phản hồi cho đánh giá
export const addReplyToReview = async (reviewId, text) => {
  try {
    // Sử dụng token đặc biệt cho admin TKhiem
    const token = localStorage.getItem("accessToken");
    
    // Kiểm tra nếu token tồn tại
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }
    
    console.log('Using token for reply:', token);
    
    const response = await axios.post(
      `${API_URLS.REVIEWS}/${reviewId}/replies?token=${token}`,
      { text },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding reply to review:', error);
    throw error;
  }
};

// Cập nhật phản hồi
export const updateReply = async (reviewId, replyId, text) => {
  try {
    // Sử dụng token đặc biệt cho admin TKhiem
    const token = localStorage.getItem("accessToken");
    
    // Kiểm tra nếu token tồn tại
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }
    
    console.log('Using token for update reply:', token);
    
    const response = await axios.put(
      `${API_URLS.REVIEWS}/${reviewId}/replies/${replyId}?token=${token}`,
      { text },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating reply:', error);
    throw error;
  }
};

// Xóa phản hồi
export const deleteReply = async (reviewId, replyId) => {
  try {
    // Sử dụng token đặc biệt cho admin TKhiem
    const token = localStorage.getItem("accessToken");
    
    // Kiểm tra nếu token tồn tại
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }
    
    console.log('Using token for delete reply:', token);
    
    const response = await axios.delete(
      `${API_URLS.REVIEWS}/${reviewId}/replies/${replyId}?token=${token}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting reply:', error);
    throw error;
  }
};

const reviewsApi = {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview,
  getAllReviews,
  toggleReviewStatus,
  addReplyToReview,
  updateReply,
  deleteReply,
};

export default reviewsApi; 