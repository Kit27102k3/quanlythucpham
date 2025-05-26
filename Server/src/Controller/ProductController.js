import BestSellingProduct from "../Model/BestSellingProduct.js";
import Product from "../Model/Products.js";
// Get best selling products
export const getBestSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const period = req.query.period || 'month'; // Default to monthly best sellers
    
    // Get best selling products
    const bestSellers = await BestSellingProduct.getBestSellers(limit, period);
    
    // Map to ensure we have the complete product data
    const products = bestSellers.map(item => {
      if (item.productId) {
        return {
          _id: item.productId._id,
          productName: item.productId.productName,
          productPrice: item.productId.productPrice,
          productStatus: item.productId.productStatus,
          productImages: item.productId.productImages,
          productCategory: item.productCategory,
          productDiscount: item.productId.productDiscount || 0,
          soldCount: item.soldCount
        };
      }
      return null;
    }).filter(Boolean); // Remove any null entries
    
    return res.status(200).json(products);
  } catch (error) {
    console.error("Error retrieving best selling products:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}; 

export const getLowStockProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const criticalStock = parseInt(req.query.criticalStock) || 20;

    console.log(`Fetching ${limit} products with stock under ${criticalStock}`);

    const products = await Product.find({ 
      productStock: { 
        $lt: criticalStock,
        $gt: 0 // Exclude products with zero stock
      } 
    })
    .sort({ productStock: 1 }) // Sort by stock ascending (lowest first)
    .limit(limit)
    .select('productName productCategory productStock productImages')
    .lean();

    if (!products || products.length === 0) {
      console.log('No low stock products found');
      return res.json([]);
    }

    // Transform the data for frontend
    const result = products.map(product => ({
      id: product._id,
      name: product.productName,
      category: product.productCategory || 'Không phân loại',
      stock: product.productStock,
      image: product.productImages?.[0] || null,
      status: product.productStock <= 5 ? 'Sắp hết' : (product.productStock <= 10 ? 'Cảnh báo' : 'Thấp')
    }));

    console.log('Found low stock products:', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ 
      message: 'Đã xảy ra lỗi khi lấy sản phẩm tồn kho thấp',
      error: error.message 
    });
  }
};