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

    console.log("Categories seeded successfully");
  } catch (error) {
    console.error("Error seeding categories:", error);
  }
};

export default seedCategories; 