import apiClient from "./axios";

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
    const adminToken =
      token === "admin-token-for-TKhiem" ||
      accessToken === "admin-token-for-TKhiem"
        ? "admin-token-for-TKhiem"
        : null;

    // Kiểm tra nếu token tồn tại
    if (!token && !accessToken && !adminToken) {
      throw new Error("Không tìm thấy token xác thực");
    }
    // Headers đặc biệt cho admin token
    const headers = {};
    if (adminToken) {
      headers["admin-token"] = adminToken;
    }

    console.log("[Debug] API request config:", {
      url: `/api/reviews/${reviewId}/replies`,
      method: "POST",
      headers,
      params: adminToken ? { token: adminToken } : undefined,
    });

    const response = await apiClient.post(
      `/api/reviews/${reviewId}/replies`,
      { text },
      adminToken ? { headers, params: { token: adminToken } } : undefined
    );
    return response.data;
  } catch (error) {
    console.error("Error adding reply to review:", error);
    throw error;
  }
};

// Cập nhật phản hồi
export const updateReply = async (reviewId, replyId, text) => {
  try {
    // Lấy token từ localStorage
    const token = localStorage.getItem("access_token");
    const accessToken = localStorage.getItem("accessToken");
    const adminToken =
      token === "admin-token-for-TKhiem" ||
      accessToken === "admin-token-for-TKhiem"
        ? "admin-token-for-TKhiem"
        : null;

    // Kiểm tra nếu token tồn tại
    if (!token && !accessToken && !adminToken) {
      throw new Error("Không tìm thấy token xác thực");
    }

    console.log(
      "Using token for update reply:",
      adminToken || token || accessToken
    );

    // Headers đặc biệt cho admin token
    const headers = {};
    if (adminToken) {
      headers["admin-token"] = adminToken;
    }

    const response = await apiClient.put(
      `/api/reviews/${reviewId}/replies/${replyId}`,
      { text },
      adminToken ? { headers, params: { token: adminToken } } : undefined
    );
    return response.data;
  } catch (error) {
    console.error("Error updating reply:", error);
    throw error;
  }
};

// Xóa phản hồi
export const deleteReply = async (reviewId, replyId) => {
  try {
    // Lấy token từ localStorage
    const token = localStorage.getItem("access_token");
    const accessToken = localStorage.getItem("accessToken");
    const adminToken =
      token === "admin-token-for-TKhiem" ||
      accessToken === "admin-token-for-TKhiem"
        ? "admin-token-for-TKhiem"
        : null;

    // Kiểm tra nếu token tồn tại
    if (!token && !accessToken && !adminToken) {
      throw new Error("Không tìm thấy token xác thực");
    }

    console.log(
      "Using token for delete reply:",
      adminToken || token || accessToken
    );

    // Headers đặc biệt cho admin token
    const headers = {};
    if (adminToken) {
      headers["admin-token"] = adminToken;
    }

    const response = await apiClient.delete(
      `/api/reviews/${reviewId}/replies/${replyId}`,
      adminToken ? { headers, params: { token: adminToken } } : undefined
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting reply:", error);
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
