import mongoose from 'mongoose';
import BestSellingProduct from '../src/Model/BestSellingProduct.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit || '5', 10);
      const period = req.query.period || 'all';
      
      // Lấy danh sách sản phẩm bán chạy
      const bestSellingProducts = await BestSellingProduct.getBestSellers(limit, period);
      
      if (!bestSellingProducts || bestSellingProducts.length === 0) {
        return res.status(200).json([]);
      }
      
      // Định dạng dữ liệu trả về
      const formattedProducts = bestSellingProducts.map(product => {
        return {
          productName: product.productName || (product.productId ? product.productId.productName : 'Không xác định'),
          productCategory: product.productCategory || (product.productId ? product.productId.productCategory : 'Không phân loại'),
          soldCount: product.soldCount || 0,
          totalRevenue: product.totalRevenue || 0,
          productImage: product.productImage || (product.productId && product.productId.productImages && product.productId.productImages.length > 0 ? product.productId.productImages[0] : ''),
          productId: product.productId ? product.productId._id : product._id
        };
      });
      
      return res.status(200).json(formattedProducts);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in best-selling-products API:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
} 