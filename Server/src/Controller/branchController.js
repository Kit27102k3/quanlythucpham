import Branch from "../Model/Branch.js";

// Lấy tất cả chi nhánh
export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: -1 });
    return res.status(200).json(branches);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách chi nhánh",
      error: error.message,
    });
  }
};

// Tạo chi nhánh mới
export const createBranch = async (req, res) => {
  try {
    const { name, address, phone, email, manager, openingHours, latitude, longitude } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !address || !phone) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin chi nhánh",
      });
    }

    // Kiểm tra chi nhánh đã tồn tại chưa
    const existingBranch = await Branch.findOne({ name });
    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: "Chi nhánh với tên này đã tồn tại",
      });
    }

    // Tạo chi nhánh mới
    const newBranch = new Branch({
      name,
      address,
      phone,
      email,
      manager,
      openingHours,
      latitude: latitude || 0,
      longitude: longitude || 0,
      createdBy: req.user ? req.user.id : null,
    });

    await newBranch.save();

    return res.status(201).json({
      success: true,
      message: "Tạo chi nhánh thành công",
      branch: newBranch,
    });
  } catch (error) {
    console.error("Lỗi khi tạo chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo chi nhánh",
      error: error.message,
    });
  }
};

// Cập nhật chi nhánh
export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật chi nhánh thành công",
      branch: updatedBranch,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật chi nhánh",
      error: error.message,
    });
  }
};

// Xóa chi nhánh
export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBranch = await Branch.findByIdAndDelete(id);

    if (!deletedBranch) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa chi nhánh thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xóa chi nhánh",
      error: error.message,
    });
  }
};

// Lấy chi nhánh theo ID
export const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findById(id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh",
      });
    }

    return res.status(200).json({
      success: true,
      branch,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin chi nhánh",
      error: error.message,
    });
  }
};

// Tìm kiếm chi nhánh
export const searchBranches = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp từ khóa tìm kiếm",
      });
    }

    // Tìm kiếm theo tên hoặc địa chỉ
    const branches = await Branch.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    return res.status(200).json(branches);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm chi nhánh",
      error: error.message,
    });
  }
}; 