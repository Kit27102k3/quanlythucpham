import Tip from "../Model/Tips.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// Lấy tất cả mẹo hay
export const getAllTips = async (req, res) => {
  try {
    const tips = await Tip.find().sort({ createdAt: -1 });
    res.status(200).json(tips);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách mẹo:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách mẹo", error: error.message });
  }
};

// Lấy mẹo hay theo ID
export const getTipById = async (req, res) => {
  try {
    const { id } = req.params;
    const tip = await Tip.findById(id);
    
    if (!tip) {
      return res.status(404).json({ message: "Không tìm thấy mẹo" });
    }
    
    res.status(200).json(tip);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết mẹo:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết mẹo", error: error.message });
  }
};

// Lấy mẹo hay theo danh mục
export const getTipsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const tips = await Tip.find({ category }).sort({ createdAt: -1 });
    
    res.status(200).json(tips);
  } catch (error) {
    console.error("Lỗi khi lấy mẹo theo danh mục:", error);
    res.status(500).json({ message: "Lỗi khi lấy mẹo theo danh mục", error: error.message });
  }
};

// Tạo mẹo hay mới
export const createTip = async (req, res) => {
  try {
    let imageUrl = "";
    
    // Xử lý upload ảnh nếu có
    if (req.file) {
      try {
        // Upload buffer trực tiếp lên Cloudinary thay vì dùng file path
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "tips",
              resource_type: "auto",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          uploadStream.end(req.file.buffer);
        });
        
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Lỗi khi upload ảnh:", uploadError);
        return res.status(500).json({ message: "Lỗi khi upload ảnh", error: uploadError.message });
      }
    }
    
    // Xử lý tags
    let tags = [];
    if (req.body.tags) {
      try {
        tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
      } catch (error) {
        tags = req.body.tags.split(",").map(tag => tag.trim());
      }
    }
    
    // Format ngày xuất bản
    let datePublished = req.body.datePublished ? new Date(req.body.datePublished) : new Date();
    
    const newTip = new Tip({
      title: req.body.title,
      category: req.body.category,
      image: imageUrl || req.body.image,
      content: req.body.content,
      author: req.body.author,
      authorTitle: req.body.authorTitle,
      tags: tags,
      likes: req.body.likes || 0,
      datePublished: datePublished,
      isFeatured: req.body.isFeatured === "true"
    });
    
    const savedTip = await newTip.save();
    res.status(201).json(savedTip);
  } catch (error) {
    console.error("Lỗi khi tạo mẹo mới:", error);
    res.status(500).json({ message: "Lỗi khi tạo mẹo mới", error: error.message });
  }
};

// Cập nhật mẹo hay
export const updateTip = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra mẹo có tồn tại không
    const existingTip = await Tip.findById(id);
    if (!existingTip) {
      return res.status(404).json({ message: "Không tìm thấy mẹo" });
    }
    
    // Xử lý upload ảnh mới nếu có
    let imageUrl = existingTip.image;
    if (req.file) {
      try {
        // Upload buffer trực tiếp lên Cloudinary thay vì dùng file path
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "tips",
              resource_type: "auto",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          uploadStream.end(req.file.buffer);
        });
        
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Lỗi khi upload ảnh:", uploadError);
        return res.status(500).json({ message: "Lỗi khi upload ảnh", error: uploadError.message });
      }
    } else if (req.body.image) {
      // Nếu có image URL trong request body
      imageUrl = req.body.image;
    }
    
    // Xử lý tags
    let tags = existingTip.tags;
    if (req.body.tags) {
      try {
        tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
      } catch (error) {
        tags = req.body.tags.split(",").map(tag => tag.trim());
      }
    }
    
    // Format ngày xuất bản
    let datePublished = existingTip.datePublished;
    if (req.body.datePublished) {
      datePublished = new Date(req.body.datePublished);
    }
    
    const updatedTip = await Tip.findByIdAndUpdate(
      id,
      {
        title: req.body.title || existingTip.title,
        category: req.body.category || existingTip.category,
        image: imageUrl,
        content: req.body.content || existingTip.content,
        author: req.body.author || existingTip.author,
        authorTitle: req.body.authorTitle || existingTip.authorTitle,
        tags: tags,
        likes: req.body.likes !== undefined ? req.body.likes : existingTip.likes,
        datePublished: datePublished,
        isFeatured: req.body.isFeatured !== undefined ? 
          req.body.isFeatured === "true" || req.body.isFeatured === true : 
          existingTip.isFeatured
      },
      { new: true }
    );
    
    res.status(200).json(updatedTip);
  } catch (error) {
    console.error("Lỗi khi cập nhật mẹo:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật mẹo", error: error.message });
  }
};

// Xóa mẹo hay
export const deleteTip = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tip = await Tip.findByIdAndDelete(id);
    
    if (!tip) {
      return res.status(404).json({ message: "Không tìm thấy mẹo" });
    }
    
    res.status(200).json({ message: "Xóa mẹo thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa mẹo:", error);
    res.status(500).json({ message: "Lỗi khi xóa mẹo", error: error.message });
  }
};

// Tăng likes cho mẹo hay
export const likeTip = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tip = await Tip.findById(id);
    
    if (!tip) {
      return res.status(404).json({ message: "Không tìm thấy mẹo" });
    }
    
    tip.likes += 1;
    await tip.save();
    
    res.status(200).json({ likes: tip.likes });
  } catch (error) {
    console.error("Lỗi khi tăng like:", error);
    res.status(500).json({ message: "Lỗi khi tăng like", error: error.message });
  }
};

// Lấy các mẹo nổi bật
export const getFeaturedTips = async (req, res) => {
  try {
    const featuredTips = await Tip.find({ isFeatured: true }).sort({ datePublished: -1 });
    
    res.status(200).json(featuredTips);
  } catch (error) {
    console.error("Lỗi khi lấy mẹo nổi bật:", error);
    res.status(500).json({ message: "Lỗi khi lấy mẹo nổi bật", error: error.message });
  }
}; 