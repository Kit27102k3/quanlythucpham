// Export all product controllers
import {
  getBestSellingProducts,
  getTopSellingProducts,
  getLowStockProducts,
} from "./ProductAnalyticsController.js";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "./ProductCrudController.js";
import {
  getAllProducts,
  getProductById,
  getProductBySlug,
  searchProducts,
  getProductByCategory,
  getProductsByBranch,
  getInventory,
} from "./ProductQueryController.js";
import {
  updateProductCategory,
  updateProductExpirations,
  checkAndUpdateExpirations,
  updateProductBranch,
} from "./ProductUtilsController.js";
import {
  getBestSellingProducts as getBestSellingProductsCustom,
  getTopRatedProducts,
} from "./ProductRankingController.js";

export {
  // Product Analytics
  getBestSellingProducts,
  getTopSellingProducts,
  getLowStockProducts,

  // Product CRUD Operations
  createProduct,
  updateProduct,
  deleteProduct,

  // Product Queries
  getAllProducts,
  getProductById,
  getProductBySlug,
  searchProducts,
  getProductByCategory,
  getProductsByBranch,
  getInventory,

  // Product Utilities
  updateProductCategory,
  updateProductExpirations,
  checkAndUpdateExpirations,
  updateProductBranch,

  // Product Rankings
  getBestSellingProductsCustom,
  getTopRatedProducts,
};
