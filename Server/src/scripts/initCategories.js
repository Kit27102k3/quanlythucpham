import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../Model/Products.js";
import Category from "../Model/Categories.js";

dotenv.config();

const initCategories = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGOOSE_URI);
    console.log("Connected to MongoDB");

    // Tạo các category
    const categories = [
      {
        codeCategory: "TRAI",
        nameCategory: "Trái"
      },
      {
        codeCategory: "RAU",
        nameCategory: "Rau"
      },
      {
        codeCategory: "NUOC",
        nameCategory: "Nước giải khát"
      },
      {
        codeCategory: "GIA_VI",
        nameCategory: "Gia vị"
      }
    ];

    // Thêm hoặc cập nhật các category
    for (const cat of categories) {
      await Category.findOneAndUpdate(
        { codeCategory: cat.codeCategory },
        cat,
        { upsert: true }
      );
    }

    // Lấy ID của các category
    const traiCategory = await Category.findOne({ codeCategory: "TRAI" });
    const rauCategory = await Category.findOne({ codeCategory: "RAU" });
    const nuocCategory = await Category.findOne({ codeCategory: "NUOC" });
    const giaViCategory = await Category.findOne({ codeCategory: "GIA_VI" });

    // Danh sách sản phẩm theo category
    const productCategories = {
      [traiCategory._id]: ["Trái sơ ri", "Táo xanh Mỹ cao cấp", "Dâu tây Đà Lạt"],
      [rauCategory._id]: ["Súp lơ xanh"],
      [nuocCategory._id]: [
        "Nước táo lên men vị mật ong Strongbow lốc 4 chai x 330ml",
        "Nước giải khát có gas Pepsi lốc 6 chai x 390ml"
      ],
      [giaViCategory._id]: ["Muối tôm Fadely lọ 100g"]
    };

    // Cập nhật category cho từng sản phẩm
    for (const [categoryId, productNames] of Object.entries(productCategories)) {
      await Product.updateMany(
        { productName: { $in: productNames } },
        { $set: { productCategory: categoryId } }
      );
    }

    // Kiểm tra kết quả
    const products = await Product.find();
    console.log("Updated products:", products.map(p => ({
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

initCategories(); 