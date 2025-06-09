import Product from "../../Model/Products.js";
import BestSellingProduct from "../../Model/BestSellingProduct.js";

// Lấy danh sách sản phẩm bán chạy
export const getBestSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const period = req.query.period || "all";

    // Tự xử lý lấy sản phẩm thường thay vì dùng Model.getBestSellers
    let bestSellingProducts = [];

    try {
      bestSellingProducts = await BestSellingProduct.find()
        .sort({ soldCount: -1 })
        .limit(limit)
        .populate({
          path: "productId",
          select:
            "productName productPrice productStatus productImages productDiscount productStock productCategory",
        });
    } catch (modelError) {
      console.error(modelError);
    }

    // Nếu không có sản phẩm bán chạy, lấy sản phẩm thông thường
    if (!bestSellingProducts || bestSellingProducts.length === 0) {
      console.log("Không tìm thấy sản phẩm bán chạy");

      try {
        const normalProducts = await Product.find({
          productStatus: { $ne: "Hết hàng" },
          productStock: { $gt: 0 },
        })
          .sort({ createdAt: -1 })
          .limit(limit);

        return res.status(200).json({
          success: true,
          message: "Trả về sản phẩm thông thường thay thế",
          data: normalProducts,
        });
      } catch (productError) {
        console.error(productError);
        return res.status(200).json({
          success: true,
          message: "Không tìm thấy sản phẩm nào",
          data: [],
        });
      }
    }

    // Format dữ liệu trả về
    const formattedProducts = bestSellingProducts
      .map((item) => {
        // Nếu sản phẩm đã được populate đầy đủ
        if (item.productId && typeof item.productId === "object") {
          const product = {
            ...item.productId.toObject(),
            soldCount: item.soldCount,
            totalRevenue: item.totalRevenue,
          };
          return product;
        }
        // Trường hợp productId chỉ là id, không được populate
        return item;
      })
      .filter((item) => item !== null && item !== undefined);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm bán chạy thành công",
      data: formattedProducts,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(200).json({
      success: true,
      message: "Đã xảy ra lỗi khi lấy sản phẩm bán chạy",
      data: [], // Trả về mảng rỗng thay vì lỗi 500
    });
  }
};

// Lấy danh sách sản phẩm có đánh giá cao nhất
export const getTopRatedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;

    // Tìm sản phẩm có đánh giá cao nhất
    const topRatedProducts = await Product.find({
      productStatus: { $ne: "Hết hàng" },
      productStock: { $gt: 0 },
      averageRating: { $gt: 0 }, // Chỉ lấy sản phẩm có đánh giá
    })
      .sort({ averageRating: -1, numOfReviews: -1 }) // Sắp xếp theo đánh giá cao nhất, ưu tiên sản phẩm có nhiều đánh giá
      .limit(limit)
      .select(
        "productName productPrice productStatus productImages productDiscount productStock productCategory averageRating numOfReviews"
      );

    // Nếu không có sản phẩm có đánh giá, lấy sản phẩm thông thường
    if (!topRatedProducts || topRatedProducts.length === 0) {
      try {
        const normalProducts = await Product.find({
          productStatus: { $ne: "Hết hàng" },
          productStock: { $gt: 0 },
        })
          .sort({ createdAt: -1 })
          .limit(limit);

        return res.status(200).json({
          success: true,
          message: "Trả về sản phẩm thông thường thay thế",
          data: normalProducts,
        });
      } catch (productError) {
        return res.status(200).json({
          success: true,
          message: "Không tìm thấy sản phẩm nào",
          data: [],
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm có đánh giá cao nhất thành công",
      data: topRatedProducts,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      message: "Đã xảy ra lỗi khi lấy sản phẩm có đánh giá cao",
      data: [], // Trả về mảng rỗng thay vì lỗi 500
    });
  }
}; 