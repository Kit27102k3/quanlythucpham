import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  codeCategory: { type: String, required: true, unique: true },
  nameCategory: { type: String, required: true },
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
