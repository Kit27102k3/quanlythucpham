import Product from "../../Model/Products.js";
import Category from "../../Model/Categories.js";

// Thêm hàm kiểm tra và cập nhật trạng thái sản phẩm dựa vào thời hạn giảm giá và hạn sử dụng
export const updateProductExpirations = async () => {
  try {
    const currentDate = new Date();

    // Cập nhật giảm giá của sản phẩm đã hết thời hạn giảm giá
    const discountExpiredProducts = await Product.find({
      discountEndDate: { $lt: currentDate },
      productDiscount: { $gt: 0 },
    });

    for (const product of discountExpiredProducts) {
      product.productDiscount = 0;
      product.productPromoPrice = 0;
      product.discountStartDate = null;
      product.discountEndDate = null;
      await product.save();
      console.log(`Đã cập nhật giá gốc cho sản phẩm: ${product.productName}`);
    }

    // Cập nhật trạng thái sản phẩm đã hết hạn sử dụng
    const expiryDateProducts = await Product.find({
      expiryDate: { $lt: currentDate },
      productStatus: { $ne: "Hết hàng" },
    });

    for (const product of expiryDateProducts) {
      product.productStatus = "Hết hàng";
      // Không đặt lại số lượng tồn kho về 0
      // Giữ nguyên số lượng tồn kho hiện tại
      await product.save();
      console.log(
        `Đã cập nhật trạng thái "Hết hàng" cho sản phẩm: ${product.productName} (giữ nguyên số lượng tồn kho: ${product.productStock})`
      );
    }

    return {
      discountUpdated: discountExpiredProducts.length,
      expiryUpdated: expiryDateProducts.length,
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật hạn sản phẩm:", error);
    return { error: error.message };
  }
};

// Thêm API endpoint để kiểm tra và cập nhật hạn sử dụng và giảm giá
export const checkAndUpdateExpirations = async (req, res) => {
  try {
    const result = await updateProductExpirations();
    res.status(200).json({
      success: true,
      message: "Kiểm tra và cập nhật hạn sản phẩm thành công",
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cập nhật hạn sản phẩm thất bại",
      error: error.message,
    });
  }
};

export const updateProductCategory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { categoryId } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { productCategory: categoryId },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật danh mục sản phẩm thành công",
      product,
    });
  } catch (error) {
    console.error("Error in updateProductCategory:", error);
    res
      .status(500)
      .json({ message: "Cập nhật danh mục sản phẩm thất bại", error });
  }
};

// Function to update product branch
export const updateProductBranch = async (req, res) => {
  try {
    const { productId } = req.params;
    const { branchId } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Update the branch ID
    product.branchId = branchId;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật chi nhánh sản phẩm thành công",
      product,
    });
  } catch (error) {
    console.error("Error in updateProductBranch:", error);
    res
      .status(500)
      .json({ message: "Cập nhật chi nhánh sản phẩm thất bại", error });
  }
}; 