import axios from "axios";

const API_URL = "http://localhost:8080/api/cart";

const cartApi = {
  // Lấy giỏ hàng của người dùng
  getCart: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/${userId}`);
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  // Thêm sản phẩm vào giỏ hàng
  addToCart: async (userId, productId, quantity = 1) => {
    try {
      const response = await axios.post(
        `${API_URL}/add-to-cart`,
        { userId, productId, quantity },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  // Xóa sản phẩm khỏi giỏ hàng
  removeFromCart: async (userId, productId) => {
    try {
      const response = await axios.delete(`${API_URL}/remove-from-cart`, {
        data: { userId, productId },
      });
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  updateCartItem: async (userId, productId, quantity) => {
    try {
      const response = await axios.put(
        `${API_URL}/update-cart-item`,
        { userId, productId, quantity },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
};

export default cartApi;
