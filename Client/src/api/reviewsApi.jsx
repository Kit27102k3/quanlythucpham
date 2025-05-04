import axios from "axios";
import { API_URLS } from "../config/apiConfig";

// Hàm lấy đánh giá của một sản phẩm
const getProductReviews = async (productId) => {
  try {
    const response = await axios.get(`${API_URLS.REVIEWS}/product/${productId}`);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá sản phẩm:", error);
    throw error;
  }
};

// Hàm thêm đánh giá mới
const addReview = async (reviewData) => {
  try {
    const token = localStorage.getItem("accessToken") || 
                 localStorage.getItem("token");
    if (!token) {
      throw new Error("Bạn cần đăng nhập để đánh giá sản phẩm");
    }

    const response = await axios.post(
      `${API_URLS.REVIEWS}/product/${reviewData.productId}`,
      reviewData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi thêm đánh giá:", error);
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
    const token = localStorage.getItem("adminToken");
    if (!token) {
      throw new Error("Bạn cần đăng nhập với quyền admin để xem tất cả đánh giá");
    }

    const response = await axios.get(
      `${API_URLS.REVIEWS}/admin/all?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
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
    const token = localStorage.getItem("adminToken");
    if (!token) {
      throw new Error("Bạn cần đăng nhập với quyền admin để thực hiện hành động này");
    }

    const response = await axios.patch(
      `${API_URLS.REVIEWS}/admin/toggle/${reviewId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
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
    // Kiểm tra tất cả các token có thể có
    const token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('userAccessToken') || 
                  localStorage.getItem('adminAccessToken');
    
    // Log để debug
    console.log('Tokens available:', {
      accessToken: localStorage.getItem('accessToken'),
      token: localStorage.getItem('token'),
      userAccessToken: localStorage.getItem('userAccessToken'),
      adminAccessToken: localStorage.getItem('adminAccessToken')
    });
    
    // Kiểm tra nếu token tồn tại
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }
    
    console.log('Using token for reply:', token);
    
    const response = await axios.post(
      `${API_URLS.REVIEWS}/${reviewId}/replies`,
      { text },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
    // Kiểm tra tất cả các token có thể có
    const token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('userAccessToken') || 
                  localStorage.getItem('adminAccessToken');
    
    // Kiểm tra nếu token tồn tại
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }
    
    console.log('Using token for update reply:', token);
    
    const response = await axios.put(
      `${API_URLS.REVIEWS}/${reviewId}/replies/${replyId}`,
      { text },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
    // Kiểm tra tất cả các token có thể có
    const token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('userAccessToken') || 
                  localStorage.getItem('adminAccessToken');
    
    // Kiểm tra nếu token tồn tại
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }
    
    console.log('Using token for delete reply:', token);
    
    const response = await axios.delete(
      `${API_URLS.REVIEWS}/${reviewId}/replies/${replyId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
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