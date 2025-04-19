import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api/products`;
const CATEGORY_API_URL = `${API_BASE_URL}/api/categories`;

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

  // Check category format directly
  checkCategory: async (categoryId) => {
    try {
      console.log("Checking category with ID:", categoryId);
      const response = await axios.get(`${CATEGORY_API_URL}/${categoryId}`);
      console.log("Category details:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error checking category:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
      throw error;
    }
  },

  createProduct: async (data) => {
    try {
      console.log("API_URL used for creating product:", API_URL);
      
      // Log the data being sent for debugging
      console.log("Data being sent:", data);
      
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Log the API request details
      console.log("Making API request to:", API_URL);
      console.log("With headers:", headers);
      
      const response = await axios.post(API_URL, data, { headers });
      console.log("Thêm sản phẩm thành công:", response.data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Headers:", error.response.headers);
        console.error("Data:", error.response.data);
      }
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
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin sản phẩm theo ID:", error);
      throw error;
    }
  },

  getProductBySlug: async (slug) => {
    try {
      const response = await axios.get(`${API_URL}/slug/${encodeURIComponent(slug)}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin sản phẩm theo slug:", error);
      throw error;
    }
  },

  getProductByCategory: async (category, excludeId = null) => {
    try {
      const url = excludeId 
        ? `${API_URL}/category/${encodeURIComponent(category)}?excludeId=${excludeId}`
        : `${API_URL}/category/${encodeURIComponent(category)}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm theo danh mục:", error);
      throw error;
    }
  },

  getCategoryById: async (id) => {
    try {
      const response = await axios.get(`${CATEGORY_API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin danh mục:", error);
      throw error;
    }
  },

  getCategoryByName: async (name) => {
    try {
      const response = await axios.get(`${CATEGORY_API_URL}/name/${encodeURIComponent(name)}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin danh mục theo tên:", error);
      throw error;
    }
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

  getProductInfoForChatbot: async (productId) => {
    try {
      const response = await axios.post(`${API_URL}/chatbot/product-info`, {
        productId,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin sản phẩm cho chatbot:", error);
      throw error;
    }
  },

  // Test function to debug category issues
  testProductCreation: async (categoryId) => {
    try {
      console.log("Testing product creation with category ID:", categoryId);
      
      // Trước tiên, lấy thông tin danh mục từ ID
      let categoryName = "";
      try {
        const categoryDetails = await productsApi.checkCategory(categoryId);
        categoryName = categoryDetails.nameCategory;
        console.log("Danh mục được chọn:", categoryName);
      } catch (error) {
        console.error("Không thể lấy thông tin danh mục:", error);
        return { 
          success: false, 
          error: { message: "Không thể lấy thông tin danh mục" } 
        };
      }
      
      // Create a simple test product with minimal fields
      const testData = new FormData();
      testData.append("productName", "Test Product");
      testData.append("productPrice", "10000");
      testData.append("productCategory", categoryName); // Sử dụng tên danh mục thay vì ID
      testData.append("productTypeName", categoryName); // Thêm cả productTypeName
      
      // Create a simple test image
      const blob = new Blob(['test image content'], { type: 'image/png' });
      const file = new File([blob], 'test-image.png', { type: 'image/png' });
      testData.append("productImages", file);
      
      console.log("Test data being sent");
      for (let [key, value] of testData.entries()) {
        console.log(`${key}: ${value instanceof File ? '(File)' : value}`);
      }
      
      const headers = {
        "Content-Type": "multipart/form-data",
      };
      
      const response = await axios.post(API_URL, testData, { headers });
      console.log("Test succeeded:", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Test failed:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  },
};

export default productsApi;
