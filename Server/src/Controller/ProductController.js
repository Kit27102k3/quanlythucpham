import BestSellingProduct from "../Model/BestSellingProduct.js";

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