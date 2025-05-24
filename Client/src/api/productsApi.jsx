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

  // Lấy dữ liệu tồn kho
  getInventoryData: async () => {
    try {
      // Thử endpoint /api/products/inventory trước
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      try {
        const response = await axios.get(`${API_URL}/products/inventory`, { headers, timeout: 15000 });
        
        if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data;
        }
      } catch (inventoryError) {
        console.error('Không thể lấy dữ liệu từ API inventory:', inventoryError.message);
      }
      
      // Thử endpoint reports
      try {
        const reportsResponse = await axios.get(`${API_URL}/reports/inventory`, { headers, timeout: 15000 });
        
        if (reportsResponse?.data && Array.isArray(reportsResponse.data) && reportsResponse.data.length > 0) {
          return reportsResponse.data;
        }
      } catch (reportsError) {
        console.error('Không thể lấy dữ liệu từ API reports/inventory:', reportsError.message);
      }
      
      // Thử lấy tất cả sản phẩm và chuyển đổi thành dữ liệu tồn kho
      try {
        const allProductsResponse = await axios.get(API_URL);
        
        if (allProductsResponse?.data?.products && Array.isArray(allProductsResponse.data.products) && allProductsResponse.data.products.length > 0) {
          const inventoryData = allProductsResponse.data.products.map(product => {
            const stock = product.productStock || 0;
            let status = 'Còn hàng';
            
            if (stock <= 0) status = 'Hết hàng';
            else if (stock <= 5) status = 'Sắp hết';
            else if (stock <= 20) status = 'Sắp hết';
            
            return {
              id: product._id,
              name: product.productName || 'Không xác định',
              stock: stock,
              value: (product.productPrice || 0) * stock,
              status: status,
              category: product.productCategory || 'Không phân loại',
              price: product.productPrice || 0,
              sku: product.productCode || '',
              image: Array.isArray(product.productImages) && product.productImages.length > 0 
                ? product.productImages[0] 
                : '',
              brand: product.productBrand || '',
              weight: product.productWeight || 0,
              unit: product.productUnit || 'gram',
              origin: product.productOrigin || ''
            };
          });
          
          return inventoryData;
        }
      } catch (error) {
        console.error('Không thể lấy dữ liệu sản phẩm:', error.message);
      }
      
      // Trả về mẫu nếu không lấy được dữ liệu
      return [
        { name: "Táo xanh Mỹ", category: "Trái cây", stock: 15, value: 3000000, status: "Sắp hết", price: 200000, sku: "CATTB-001" },
        { name: "Thịt bò Úc", category: "Thịt tươi", stock: 8, value: 4000000, status: "Sắp hết", price: 500000, sku: "THTTB-001" },
        { name: "Sữa tươi nguyên kem", category: "Sữa", stock: 4, value: 800000, status: "Sắp hết", price: 200000, sku: "SUATB-001" },
        { name: "Cà chua Đà Lạt", category: "Rau củ", stock: 12, value: 600000, status: "Sắp hết", price: 50000, sku: "RACTB-001" },
        { name: "Nước mắm Nam Ngư", category: "Gia vị", stock: 6, value: 450000, status: "Sắp hết", price: 75000, sku: "GVTB-001" }
      ];
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu tồn kho:', error);
      // Trả về mẫu khi có lỗi
      return [
        { name: "Táo xanh Mỹ", category: "Trái cây", stock: 15, value: 3000000, status: "Sắp hết", price: 200000, sku: "CATTB-001" },
        { name: "Thịt bò Úc", category: "Thịt tươi", stock: 8, value: 4000000, status: "Sắp hết", price: 500000, sku: "THTTB-001" },
        { name: "Sữa tươi nguyên kem", category: "Sữa", stock: 4, value: 800000, status: "Sắp hết", price: 200000, sku: "SUATB-001" },
        { name: "Cà chua Đà Lạt", category: "Rau củ", stock: 12, value: 600000, status: "Sắp hết", price: 50000, sku: "RACTB-001" },
        { name: "Nước mắm Nam Ngư", category: "Gia vị", stock: 6, value: 450000, status: "Sắp hết", price: 75000, sku: "GVTB-001" }
      ];
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
      
      const token = localStorage.getItem("accessToken");
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
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.put(`${API_URL}/${id}`, data, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
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

  // Lấy danh sách sản phẩm bán chạy nhất
  getBestSellingProducts: async (limit = 10, period = 'month') => {
    try {
      const response = await axios.get(`${API_URL}/best-selling?limit=${limit}&period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching best selling products:', error);
      throw error;
    }
  },
};

export default productsApi;
