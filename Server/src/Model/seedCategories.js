import Category from "./Categories.js";

const seedCategories = async () => {
  try {
    const categories = [
      {
        codeCategory: "TRAI",
        nameCategory: "Trái",
      },
      {
        codeCategory: "RAU",
        nameCategory: "Rau",
      },
      {
        codeCategory: "THIT",
        nameCategory: "Thịt",
      },
    ];

    for (const category of categories) {
      await Category.findOneAndUpdate(
        { codeCategory: category.codeCategory },
        category,
        { upsert: true }
      );
    }
    
    // Đã cập nhật xong categories
  } catch (error) {
    // Xử lý lỗi nếu có
  }
};

export default seedCategories; 