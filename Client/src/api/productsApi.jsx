import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';
// import { canAccess } from '../utils/permission';

const API_URL = `${API_BASE_URL}/api/products`;
const CATEGORY_API_URL = `${API_BASE_URL}/api/categories`;

export const productsApi = {
  getAllProducts: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(API_URL, { headers });
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  getProductsByBranch: async (branchId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      try {
        // Thử gọi API endpoint chuyên biệt cho branch
        const response = await axios.get(`${API_URL}/branch/${branchId}`, { headers });
        return response.data;
      } catch (error) {
        // Nếu endpoint không tồn tại (404), lấy tất cả sản phẩm và lọc theo branchId
        if (error.response && error.response.status === 404) {
          console.log(`API endpoint /branch/${branchId} không tồn tại, lọc sản phẩm từ danh sách đầy đủ`);
          const allProductsResponse = await axios.get(API_URL, { headers });
          const allProducts = allProductsResponse.data;
          
          if (Array.isArray(allProducts)) {
            // Lọc sản phẩm có branchId trùng khớp
            return allProducts.filter(product => product.branchId === branchId);
          }
          return [];
        }
        // Nếu lỗi khác, ném lỗi để xử lý bên ngoài
        throw error;
      }
    } catch (error) {
      console.error(`Error fetching products for branch ${branchId}:`, error);
      throw error;
    }
  },

  getProductById: async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error("Error fetching product by ID:", error);
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
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.put(`${API_URL}/${id}`, data, { headers });
      return response.data;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.delete(`${API_URL}/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  getProductsByCategory: async (categoryId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/category/${categoryId}`, {
        headers,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching products by category:", error);
      throw error;
    }
  },

  getAllCategories: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(CATEGORY_API_URL, { headers });
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  searchProducts: async (query) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/search?q=${query}`, {
        headers,
      });
      return response.data;
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  },

  // Lấy danh sách danh mục từ server
  getCategoriesData: async () => {
    try {
      console.log("Đang lấy danh sách danh mục...");

      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        // Thử lấy từ API categories
        const response = await axios.get(CATEGORY_API_URL, {
          headers,
          timeout: 15000,
        });

        if (response?.data && Array.isArray(response.data)) {
          console.log(
            "Lấy danh mục từ API thành công:",
            response.data.length,
            "danh mục"
          );
          return response.data.map((cat) => ({
            id: cat._id || cat.id,
            name: cat.nameCategory || cat.name || "Không xác định",
          }));
        }
      } catch (error) {
        console.warn("Không thể lấy danh mục từ API chính:", error.message);
      }

      try {
        // Thử endpoint thay thế
        const altResponse = await axios.get(
          `${API_BASE_URL}/api/product-categories`,
          { headers, timeout: 15000 }
        );

        if (altResponse?.data && Array.isArray(altResponse.data)) {
          console.log(
            "Lấy danh mục từ API thay thế thành công:",
            altResponse.data.length,
            "danh mục"
          );
          return altResponse.data.map((cat) => ({
            id: cat._id || cat.id,
            name: cat.nameCategory || cat.name || "Không xác định",
          }));
        }
      } catch (error) {
        console.warn("Không thể lấy danh mục từ API thay thế:", error.message);
      }

      // Thử trích xuất danh mục từ dữ liệu sản phẩm
      try {
        const allProductsResponse = await axios.get(API_URL);

        if (
          allProductsResponse?.data?.products &&
          Array.isArray(allProductsResponse.data.products)
        ) {
          // Lấy tất cả các danh mục duy nhất từ sản phẩm
          const uniqueCategories = [
            ...new Set(
              allProductsResponse.data.products
                .map((p) => p.productCategory || p.category)
                .filter(Boolean)
            ),
          ];

          console.log(
            "Trích xuất danh mục từ sản phẩm:",
            uniqueCategories.length,
            "danh mục"
          );

          return uniqueCategories.map((name) => ({
            id: name.toLowerCase().replace(/\s+/g, "-"),
            name: name,
          }));
        }
      } catch (error) {
        console.error(
          "Không thể trích xuất danh mục từ sản phẩm:",
          error.message
        );
      }

      // Nếu không lấy được dữ liệu, trả về mảng rỗng
      console.warn("Không thể lấy danh mục từ bất kỳ nguồn nào");
      return [];
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
      return [];
    }
  },

  // Lấy dữ liệu tồn kho
  getInventoryData: async () => {
    try {
      console.log("Đang lấy dữ liệu tồn kho...");
      // Thử endpoint /api/products/inventory trước
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const response = await axios.get(`${API_URL}/inventory`, {
          headers,
          timeout: 15000,
        });

        if (
          response?.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          console.log(
            "Lấy dữ liệu tồn kho từ API thành công:",
            response.data.length,
            "sản phẩm"
          );
          return response.data;
        }
      } catch (inventoryError) {
        console.warn(
          "Không thể lấy dữ liệu từ API inventory:",
          inventoryError.message
        );
      }

      // Thử endpoint reports
      try {
        const reportsResponse = await axios.get(
          `${API_BASE_URL}/api/reports/inventory`,
          { headers, timeout: 15000 }
        );

        if (
          reportsResponse?.data &&
          Array.isArray(reportsResponse.data) &&
          reportsResponse.data.length > 0
        ) {
          console.log(
            "Lấy dữ liệu tồn kho từ API reports thành công:",
            reportsResponse.data.length,
            "sản phẩm"
          );
          return reportsResponse.data;
        }
      } catch (reportsError) {
        console.warn(
          "Không thể lấy dữ liệu từ API reports/inventory:",
          reportsError.message
        );
      }

      // Thử lấy tất cả sản phẩm và chuyển đổi thành dữ liệu tồn kho
      try {
        const allProductsResponse = await axios.get(API_URL);

        if (
          allProductsResponse?.data?.products &&
          Array.isArray(allProductsResponse.data.products) &&
          allProductsResponse.data.products.length > 0
        ) {
          console.log(
            "Chuyển đổi dữ liệu sản phẩm thành dữ liệu tồn kho:",
            allProductsResponse.data.products.length,
            "sản phẩm"
          );

          const inventoryData = allProductsResponse.data.products.map(
            (product) => {
              const stock = product.productStock || product.stock || 0;
              let status = "Còn hàng";

              if (stock <= 0) status = "Hết hàng";
              else if (stock <= 5) status = "Sắp hết";
              else if (stock <= 20) status = "Sắp hết";

              return {
                id: product._id || product.id,
                name: product.productName || product.name || "Không xác định",
                stock: stock,
                value: (product.productPrice || product.price || 0) * stock,
                status: status,
                category:
                  product.productCategory ||
                  product.category ||
                  "Không phân loại",
                price: product.productPrice || product.price || 0,
                sku: product.productCode || product.sku || "",
                image:
                  Array.isArray(product.productImages) &&
                  product.productImages.length > 0
                    ? product.productImages[0]
                    : product.image || "",
                brand: product.productBrand || product.brand || "",
                weight: product.productWeight || product.weight || 0,
                unit: product.productUnit || product.unit || "gram",
                origin: product.productOrigin || product.origin || "",
              };
            }
          );

          return inventoryData;
        }
      } catch (error) {
        console.error("Không thể lấy dữ liệu sản phẩm:", error.message);
      }

      // Nếu không thể lấy dữ liệu từ bất kỳ nguồn nào, trả về mảng rỗng
      console.error("Không thể lấy dữ liệu tồn kho từ bất kỳ nguồn nào");
      return [];
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu tồn kho:", error);
      return [];
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

  getProductBySlug: async (slug) => {
    try {
      const response = await axios.get(
        `${API_URL}/slug/${encodeURIComponent(slug)}`
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin sản phẩm theo slug:", error);
      throw error;
    }
  },

  getProductByCategory: async (category, excludeId = null) => {
    try {
      const url = excludeId 
        ? `${API_URL}/category/${encodeURIComponent(
            category
          )}?excludeId=${excludeId}`
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
      const response = await axios.get(
        `${CATEGORY_API_URL}/name/${encodeURIComponent(name)}`
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin danh mục theo tên:", error);
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
          error: { message: "Không thể lấy thông tin danh mục" },
        };
      }
      
      // Create a simple test product with minimal fields
      const testData = new FormData();
      testData.append("productName", "Test Product");
      testData.append("productPrice", "10000");
      testData.append("productCategory", categoryName); // Sử dụng tên danh mục thay vì ID
      testData.append("productTypeName", categoryName); // Thêm cả productTypeName
      
      // Create a simple test image
      const blob = new Blob(["test image content"], { type: "image/png" });
      const file = new File([blob], "test-image.png", { type: "image/png" });
      testData.append("productImages", file);
      
      console.log("Test data being sent");
      for (let [key, value] of testData.entries()) {
        console.log(`${key}: ${value instanceof File ? "(File)" : value}`);
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
        error: error.response?.data || error.message,
      };
    }
  },

  // Lấy danh sách sản phẩm bán chạy nhất
  getBestSellingProducts: async (limit = 10, period = "month") => {
    try {
      const response = await axios.get(
        `${API_URL}/best-selling?limit=${limit}&period=${period}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching best selling products:", error);
      throw error;
    }
  },
};

// Thêm export default để tương thích với các import khác
export default productsApi;
