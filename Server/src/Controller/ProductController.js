import BestSellingProduct from "../Model/BestSellingProduct.js";
import Product from "../Model/Products.js";
import Order from "../Model/Order.js";

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

export const getTopSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    console.log(`Fetching top ${limit} selling products`);
    
    // Try to get real data from database
    const topProducts = await Order.aggregate([
      { $match: { status: "completed" } },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $group: {
          _id: "$products.productId",
          name: { $first: { $arrayElemAt: ["$productInfo.productName", 0] } },
          category: { $first: { $arrayElemAt: ["$productInfo.productCategory", 0] } },
          sold: { $sum: "$products.quantity" },
          revenue: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] },
          },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: parseInt(limit) },
      { $project: { _id: 0, name: 1, category: 1, sold: 1, revenue: 1 } },
    ]);

    // If we have data, return it
    if (topProducts && topProducts.length > 0) {
      console.log(`Found ${topProducts.length} top products from database`);
      return res.json(topProducts);
    }
    
    // If no data found, check BestSellingProduct collection
    const bestSellers = await BestSellingProduct.find()
      .sort({ soldCount: -1 })
      .limit(limit);
      
    if (bestSellers && bestSellers.length > 0) {
      const formattedBestSellers = bestSellers.map(product => ({
        name: product.productName || "Không xác định",
        category: product.productCategory || "Không phân loại",
        sold: product.soldCount || 0,
        revenue: product.totalRevenue || 0
      }));
      
      console.log(`Found ${formattedBestSellers.length} products from BestSellingProduct collection`);
      return res.json(formattedBestSellers);
    }
    
    // If still no data, try to get products and sort by soldCount if available
    const products = await Product.find()
      .sort({ soldCount: -1 })
      .limit(limit)
      .select('productName productCategory soldCount productPrice')
      .lean();
      
    if (products && products.length > 0) {
      const formattedProducts = products.map(product => ({
        name: product.productName || "Không xác định",
        category: product.productCategory || "Không phân loại",
        sold: product.soldCount || 0,
        revenue: (product.soldCount || 0) * (product.productPrice || 0)
      }));
      
      console.log(`Found ${formattedProducts.length} products from Product collection`);
      return res.json(formattedProducts);
    }
    
    // If no data at all, return empty array
    console.log("No product data found");
    return res.json([]);
  } catch (error) {
    console.error("Error in getTopSellingProducts:", error);
    return res.status(500).json({ 
      message: "Đã xảy ra lỗi khi lấy sản phẩm bán chạy",
      error: error.message 
    });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const criticalStock = parseInt(req.query.criticalStock) || 20;

    console.log(`Fetching ${limit} products with stock under ${criticalStock}`);

    // Try to get data from database
    const products = await Product.find({ 
      productStock: { 
        $lt: criticalStock
      } 
    })
    .sort({ productStock: 1 }) // Sort by stock ascending (lowest first)
    .limit(limit)
    .select('productName productCategory productStock productImages productCode')
    .lean();

    // Transform the data for frontend
    const result = products.map(product => ({
      id: product._id,
      name: product.productName || "Không xác định",
      category: product.productCategory || 'Không phân loại',
      stock: product.productStock || 0,
      image: product.productImages && product.productImages.length > 0 ? product.productImages[0] : null,
      sku: product.productCode || "",
      status: product.productStock <= 5 ? 'Sắp hết' : (product.productStock <= 10 ? 'Cảnh báo' : 'Thấp')
    }));

    console.log(`Found ${result.length} low stock products`);
    return res.json(result);
  } catch (error) {
    console.error('Error in getLowStockProducts:', error);
    // Return empty array instead of mock data
    return res.json([]);
  }
};