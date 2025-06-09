import apiClient from "./axios";
import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

// Hàm lấy đánh giá của một sản phẩm
const getProductReviews = async (productId) => {
  try {
    const response = await apiClient.get(`/api/reviews/product/${productId}`);

    if (Array.isArray(response.data)) {
      return {
        reviews: response.data,
        averageRating: calculateAverageRating(response.data),
      };
    }

    // Nếu dữ liệu nằm trong response.data.data
    if (response.data.data) {
      // Kiểm tra xem data có phải là mảng không
      if (Array.isArray(response.data.data)) {
        return {
          reviews: response.data.data,
          averageRating: calculateAverageRating(response.data.data),
        };
      }
      // Nếu data có cấu trúc reviews và averageRating
      return response.data.data;
    }

    // Fallback nếu không có cấu trúc nào phù hợp
    return {
      reviews: [],
      averageRating: 0,
    };
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá sản phẩm:", error);
    return {
      reviews: [],
      averageRating: 0,
    };
  }
};

// Hàm tính điểm đánh giá trung bình
const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce(
    (total, review) => total + Number(review.rating || 0),
    0
  );
  return sum / reviews.length;
};

// Hàm thêm đánh giá mới
const addReview = async (reviewData) => {
  try {
    // Kiểm tra cả hai loại token
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
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

    if (!reviewData.comment || reviewData.comment.trim() === "") {
      throw new Error("Vui lòng nhập nội dung đánh giá");
    }

    // Chuyển rating thành số
    const formattedData = {
      ...reviewData,
      rating: Number(reviewData.rating),
    };

    // Sử dụng apiClient để tự động gắn token
    const response = await apiClient.post(
      `/api/reviews/product/${reviewData.productId}`,
      formattedData
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
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Bạn cần đăng nhập để cập nhật đánh giá");
    }

    const response = await apiClient.put(
      `/api/reviews/${reviewId}`,
      reviewData
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
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Bạn cần đăng nhập để xóa đánh giá");
    }

    const response = await apiClient.delete(`/api/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi xóa đánh giá:", error);
    throw error;
  }
};

// API cho Admin
const getAllReviews = async (page = 1, limit = 10) => {
  try {
    // Kiểm tra cả token thông thường và admin-token đặc biệt
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    const adminToken =
      localStorage.getItem("adminToken") ||
      (token === "admin-token-for-TKhiem" ? token : null);

    if (!token && !adminToken) {
      throw new Error(
        "Bạn cần đăng nhập với quyền admin để xem tất cả đánh giá"
      );
    }

    // Thêm header đặc biệt cho admin token nếu cần
    const headers = {};
    if (adminToken === "admin-token-for-TKhiem") {
      headers["admin-token"] = adminToken;
    }

    const response = await apiClient.get(
      `/api/reviews/admin/all?page=${page}&limit=${limit}`,
      { headers }
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
    // Kiểm tra cả token thông thường và admin-token đặc biệt
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    const adminToken =
      localStorage.getItem("adminToken") ||
      (token === "admin-token-for-TKhiem" ? token : null);

    if (!token && !adminToken) {
      throw new Error(
        "Bạn cần đăng nhập với quyền admin để thực hiện hành động này"
      );
    }

    // Thêm header đặc biệt cho admin token nếu cần
    const headers = {};
    if (adminToken === "admin-token-for-TKhiem") {
      headers["admin-token"] = adminToken;
    }

    const response = await apiClient.patch(
      `/api/reviews/admin/toggle/${reviewId}`,
      {},
      { headers }
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
    // Lấy token từ localStorage
    const token = localStorage.getItem("access_token");
    const accessToken = localStorage.getItem("accessToken");
    const adminToken = "admin-token-for-TKhiem";
    
    // Kiểm tra nếu user là admin hoặc manager
    const userRole = localStorage.getItem("userRole");
    const isAdmin = userRole === "admin" || userRole === "manager";
    
    // Sử dụng admin token nếu có quyền admin, ngược lại sử dụng token thông thường
    const useAdminToken = isAdmin;
    const effectiveToken = useAdminToken ? adminToken : (token || accessToken);

    // Kiểm tra nếu token tồn tại
    if (!effectiveToken) {
      throw new Error("Không tìm thấy token xác thực");
    }

    // Lấy thông tin người dùng từ localStorage
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || localStorage.getItem("fullName") || "User";

    console.log("[Debug] User info:", { userId, userName, userRole, isAdmin });
    console.log("[Debug] Token info:", { 
      useAdminToken,
      effectiveToken: effectiveToken.substring(0, 10) + "..." 
    });

    // Tạo URL endpoint
    const endpoint = `${API_BASE_URL}/api/reviews/${reviewId}/replies`;
    
    // Headers cho request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${effectiveToken}`
    };
    
    // Thêm admin-token header nếu sử dụng admin token
    if (useAdminToken) {
      headers["admin-token"] = adminToken;
    }

    // Tạo payload phù hợp với cấu trúc API server
    const payload = {
      text: text,
      isAdmin: isAdmin
    };

    console.log("[Debug] API request config:", {
      url: endpoint,
      method: "POST",
      headers: {
        ...headers,
        Authorization: headers.Authorization.substring(0, 20) + "..."
      },
      body: payload,
    });

    // Sử dụng axios trực tiếp thay vì apiClient
    const response = await axios({
      method: 'post',
      url: endpoint,
      headers: headers,
      data: payload
    });
    
    console.log("[Debug] API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error adding reply to review:", error);
    if (error.response) {
      console.error("Error status:", error.response.status);
      console.error("Error data:", error.response.data);
    }
    throw error;
  }
};

// Cập nhật phản hồi
export const updateReply = async (reviewId, replyId, text) => {
  try {
    // Lấy token từ localStorage
    const token = localStorage.getItem("access_token");
    const accessToken = localStorage.getItem("accessToken");
    const adminToken = "admin-token-for-TKhiem";
    
    // Kiểm tra nếu user là admin hoặc manager
    const userRole = localStorage.getItem("userRole");
    const isAdmin = userRole === "admin" || userRole === "manager";
    
    // Sử dụng admin token nếu có quyền admin, ngược lại sử dụng token thông thường
    const useAdminToken = isAdmin;
    const effectiveToken = useAdminToken ? adminToken : (token || accessToken);

    // Kiểm tra nếu token tồn tại
    if (!effectiveToken) {
      throw new Error("Không tìm thấy token xác thực");
    }

    console.log(
      "Using token for update reply:",
      useAdminToken ? "admin-token" : "user-token"
    );

    // Headers cho request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${effectiveToken}`
    };
    
    // Thêm admin-token header nếu sử dụng admin token
    if (useAdminToken) {
      headers["admin-token"] = adminToken;
    }

    const response = await axios({
      method: 'put',
      url: `${API_BASE_URL}/api/reviews/${reviewId}/replies/${replyId}`,
      headers: headers,
      data: { text }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error updating reply:", error);
    if (error.response) {
      console.error("Error status:", error.response.status);
      console.error("Error data:", error.response.data);
    }
    throw error;
  }
};

// Xóa phản hồi
export const deleteReply = async (reviewId, replyId) => {
  try {
    // Lấy token từ localStorage
    const token = localStorage.getItem("access_token");
    const accessToken = localStorage.getItem("accessToken");
    const adminToken = "admin-token-for-TKhiem";
    
    // Kiểm tra nếu user là admin hoặc manager
    const userRole = localStorage.getItem("userRole");
    const isAdmin = userRole === "admin" || userRole === "manager";
    
    // Sử dụng admin token nếu có quyền admin, ngược lại sử dụng token thông thường
    const useAdminToken = isAdmin;
    const effectiveToken = useAdminToken ? adminToken : (token || accessToken);

    // Kiểm tra nếu token tồn tại
    if (!effectiveToken) {
      throw new Error("Không tìm thấy token xác thực");
    }

    console.log(
      "Using token for delete reply:",
      useAdminToken ? "admin-token" : "user-token"
    );

    // Headers cho request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${effectiveToken}`
    };
    
    // Thêm admin-token header nếu sử dụng admin token
    if (useAdminToken) {
      headers["admin-token"] = adminToken;
    }

    const response = await axios({
      method: 'delete',
      url: `${API_BASE_URL}/api/reviews/${reviewId}/replies/${replyId}`,
      headers: headers
    });
    
    return response.data;
  } catch (error) {
    console.error("Error deleting reply:", error);
    if (error.response) {
      console.error("Error status:", error.response.status);
      console.error("Error data:", error.response.data);
    }
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
