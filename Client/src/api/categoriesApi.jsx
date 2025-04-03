import axios from "axios";

const API_URL = "http://localhost:8080/api/categories";

const categoriesApi = {
  getAllCategories: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi hiển thị tất cả danh mục:", error);
      throw error;
    }
  },

  createCategory: async (data) => {
    try {
      const response = await axios.post(API_URL, data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo danh mục:", error);
      throw error;
    }
  },

  updateCategory: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật danh mục:", error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa danh mục:", error);
      throw error;
    }
  },
};

export default categoriesApi;
