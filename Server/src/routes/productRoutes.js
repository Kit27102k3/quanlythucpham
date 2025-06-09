import express from 'express';
import * as ProductController from '../Controller/Products/index.js';
import { isAuth, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/products', ProductController.getAllProducts);
router.get('/products/search', ProductController.searchProducts);
router.get('/products/:id', ProductController.getProductById);
router.get('/products/slug/:slug', ProductController.getProductBySlug);
router.get('/products/category/:category', ProductController.getProductByCategory);
router.get('/products/branch/:branchId', ProductController.getProductsByBranch);

// Analytics routes
router.get('/products/analytics/best-selling', ProductController.getBestSellingProducts);
router.get('/products/analytics/top-selling', ProductController.getTopSellingProducts);
router.get('/products/analytics/low-stock', ProductController.getLowStockProducts);

// Ranking routes
router.get('/products/ranking/best-sellers', ProductController.getBestSellingProductsCustom);
router.get('/products/ranking/top-rated', ProductController.getTopRatedProducts);

// Admin routes
router.post('/products', isAuth, isAdmin, ProductController.createProduct);
router.put('/products/:id', isAuth, isAdmin, ProductController.updateProduct);
router.delete('/products/:id', isAuth, isAdmin, ProductController.deleteProduct);
router.put('/products/category/:productId', isAuth, isAdmin, ProductController.updateProductCategory);
router.put('/products/branch/:productId', isAuth, isAdmin, ProductController.updateProductBranch);

// Maintenance routes
router.post('/products/check-expirations', ProductController.checkAndUpdateExpirations);

export default router; 