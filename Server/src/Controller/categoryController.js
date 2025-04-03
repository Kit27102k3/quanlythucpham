import Category from "../Model/Categories.js";

export const createCategory = async (req, res) => {
  const { codeCategory, nameCategory } = req.body;
  try {
    const newCategory = new Category({ codeCategory, nameCategory });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Mã danh mục đã tồn tại" });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { codeCategory, nameCategory } = req.body;

  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { codeCategory, nameCategory },
      { new: true, runValidators: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    res.status(200).json({ message: "Xóa danh mục thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategoryByName = async (req, res) => {
  const { name } = req.params;
  try {
    const category = await Category.findOne({ nameCategory: name });
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
