import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";
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
      // Kiểm tra và xác thực branchId
      if (!branchId || typeof branchId === 'object') {
        console.error("Invalid branchId:", branchId);
        return [];
      }

      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const response = await axios.get(`${API_URL}/branch/${branchId}`, {
          headers,
        });
        return response.data;
      } catch (error) {
        // Nếu endpoint không tồn tại (404), lấy tất cả sản phẩm và lọc theo branchId
        if (error.response && error.response.status === 404) {
          console.log(`Endpoint /branch/${branchId} không tồn tại, lấy tất cả sản phẩm và lọc...`);
          
          const allProductsResponse = await axios.get(API_URL, { headers });
          const allProducts = Array.isArray(allProductsResponse.data) 
            ? allProductsResponse.data 
            : (allProductsResponse.data.products || []);

          // Kiểm tra xem branchId có trong sản phẩm không
          const filteredProducts = allProducts.filter(product => {
            return product.branchId === branchId || 
                  (product.branch && product.branch._id === branchId) ||
                  (product.branch && product.branch.id === branchId);
          });
          
          console.log(`Đã lọc được ${filteredProducts.length} sản phẩm cho chi nhánh ${branchId}`);
          return filteredProducts;
        }
        // Nếu lỗi khác, ném lỗi để xử lý bên ngoài
        throw error;
      }
    } catch (error) {
      console.error(`Error fetching products for branch ${branchId}:`, error);
      // Trả về mảng rỗng thay vì ném lỗi để tránh làm hỏng UI
      return [];
    }
  },

  getProductById: async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Đổi đường dẫn API để gọi đúng endpoint mới đã cập nhật
      const response = await axios.get(`${API_BASE_URL}/api/products/productId/${id}`, { headers });
      
      console.log(`Fetched product by ID/code ${id}:`, response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching product by ID:", error);
      
      // Cố gắng thử lại với API cũ nếu API mới thất bại
      try {
        console.log("Trying fallback API endpoint...");
        const token = localStorage.getItem("accessToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const fallbackResponse = await axios.get(`${API_URL}/${id}`, { headers });
        
        console.log(`Fallback: Fetched product by ID ${id}:`, fallbackResponse.data);
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error("Both API endpoints failed:", fallbackError);
        throw fallbackError;
      }
    }
  },

  createProduct: async (data) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await axios.post(API_URL, data, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm:", error);
      throw error;
    }
  },

  updateProduct: async (id, data) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      // Chuẩn bị dữ liệu trước khi gửi
      const productData = { ...data };
      
      // Đảm bảo các trường số được chuyển đổi đúng
      if (productData.productPrice) productData.productPrice = Number(productData.productPrice);
      if (productData.productDiscount) productData.productDiscount = Number(productData.productDiscount);
      if (productData.productStock) productData.productStock = Number(productData.productStock);
      if (productData.productWeight) productData.productWeight = Number(productData.productWeight);
      
      // Đảm bảo unitOptions được định dạng đúng
      if (productData.unitOptions && Array.isArray(productData.unitOptions)) {
        productData.unitOptions = productData.unitOptions.map(option => ({
          ...option,
          price: Number(option.price),
          conversionRate: Number(option.conversionRate),
          inStock: Number(option.inStock)
        }));
      }
      
      console.log("Sending update data:", { id, data: productData });
      
      const response = await axios.put(`${API_URL}/${id}`, productData, { headers });
      return response.data;
    } catch (error) {
      console.error("Error updating product:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
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
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log(`Gọi API lấy sản phẩm theo slug: ${slug}`);
      const response = await axios.get(`${API_BASE_URL}/api/products/slug/${slug}`, { headers });
      
      console.log(`Kết quả API cho slug ${slug}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi lấy sản phẩm theo slug ${slug}:`, error);
      
      // Thử fallback với cách cũ
      try {
        console.log("Thử cách cũ - tìm trong danh sách sản phẩm");
        const allProducts = await productsApi.getAllProducts();
        const product = allProducts.find(
          (p) =>
            p.productName
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "") === slug
        );
        
        if (product) {
          console.log("Tìm thấy sản phẩm từ cách cũ:", product);
          return product;
        }
        
        throw new Error("Không tìm thấy sản phẩm");
      } catch (fallbackError) {
        console.error("Cả hai cách đều thất bại:", fallbackError);
        throw fallbackError;
      }
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

      const testData = new FormData();
      const blob = new Blob(["test image content"], { type: "image/png" });
      const file = new File([blob], "test-image.png", { type: "image/png" });
      testData.append("productImages", file);
      const headers = {
        "Content-Type": "multipart/form-data",
      };

      const response = await axios.post(API_URL, testData, { headers });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Test failed:", error);
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
