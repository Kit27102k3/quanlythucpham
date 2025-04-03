import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../Model/Products.js";
import Category from "../Model/Categories.js";

dotenv.config();

const updateProductCategories = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGOOSE_URI);
    console.log("Connected to MongoDB");

    // Lấy category "Trái"
    const traiCategory = await Category.findOne({ codeCategory: "TRAI" });
    if (!traiCategory) {
      console.log("Category 'Trái' not found");
      return;
    }

    console.log("Found category:", traiCategory);

    // Danh sách các sản phẩm là trái cây
    const fruitProducts = [
      "Trái sơ ri",
      "Táo xanh Mỹ cao cấp",
      "Dâu tây Đà Lạt"
    ];

    // Cập nhật category chỉ cho các sản phẩm là trái cây
    const result = await Product.updateMany(
      { productName: { $in: fruitProducts } },
      { $set: { productCategory: traiCategory._id } }
    );

    console.log(`Updated ${result.modifiedCount} products`);

    // Kiểm tra lại các sản phẩm
    const updatedProducts = await Product.find({ productCategory: traiCategory._id });
    console.log("Products in Trái category:", updatedProducts.map(p => ({ 
      id: p._id, 
      name: p.productName,
      category: p.productCategory 
    })));

    // Đóng kết nối
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
  }
};

updateProductCategories(); 