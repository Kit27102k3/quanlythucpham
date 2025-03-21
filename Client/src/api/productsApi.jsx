import axios from "axios";

const API_URL = "http://localhost:8080/api/products";

const productsApi = {
  getAllProducts: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm:", error);
      throw error;
    }
  },

  createProduct: async (data) => {
    try {
      const response = await axios.post(API_URL, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Thêm sản phẩm thành công:", response.data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm:", error);
      throw error;
    }
  },

  updateProduct: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      throw error;
    }
  },

  getProductById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  getProductByCategory: async (category) => {
    const response = await axios.get(`${API_URL}/category/${category}`);
    return response.data;
  },

  searchProducts: async (query) => {
    try {
      const response = await axios.get(
        `${API_URL}/search?name=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },
};

export default productsApi;
