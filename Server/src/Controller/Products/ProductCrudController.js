import cloudinary from "../../config/cloudinary.js";
import Product from "../../Model/Products.js";
import Category from "../../Model/Categories.js";
import Admin from "../../Model/adminModel.js";
import { sendPushNotification, sendNewProductNotification } from "../../Services/notificationService.js";

export const createProduct = async (req, res) => {
  try {
    // Kiểm tra nếu không có imageUrls
    if (!req.body.imageUrls || req.body.imageUrls.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng tải lên ít nhất một hình ảnh" });
    }

    const category = await Category.findOne({
      nameCategory: req.body.productCategory,
    });
    if (!category) {
      return res
        .status(400)
        .json({ message: "Danh mục sản phẩm không tồn tại" });
    }

    // Sử dụng URLs đã được upload thông qua Cloudinary widget
    const uploadedUrls = Array.isArray(req.body.imageUrls)
      ? req.body.imageUrls
      : [req.body.imageUrls];

    let descriptions = [];
    try {
      descriptions =
        typeof req.body.productDescription === "string"
          ? JSON.parse(req.body.productDescription)
          : req.body.productDescription;
    } catch (error) {
      descriptions = req.body.productDescription.split(",");
    }

    // Xử lý thông tin ngày bắt đầu và kết thúc giảm giá
    let discountStartDate = null;
    let discountEndDate = null;

    if (req.body.discountStartDate) {
      discountStartDate = new Date(req.body.discountStartDate);
    }

    if (req.body.discountEndDate) {
      discountEndDate = new Date(req.body.discountEndDate);
    }

    // Xử lý hạn sử dụng
    let expiryDate = null;
    let productStatus = req.body.productStatus || "Còn hàng";

    if (req.body.expiryDate) {
      expiryDate = new Date(req.body.expiryDate);

      // Nếu hạn sử dụng đã qua, cập nhật trạng thái thành "Hết hàng"
      if (expiryDate < new Date()) {
        productStatus = "Hết hàng";
      }
    }

    // Validate và chuẩn bị unitOptions nếu có
    let unitOptions = [];
    if (req.body.unitOptions && Array.isArray(req.body.unitOptions)) {
      unitOptions = req.body.unitOptions.map((option) => ({
        unit: option.unit,
        price: option.price,
        conversionRate: option.conversionRate || 1,
        inStock: option.inStock || 0,
        isDefault: option.isDefault || false,
      }));

      // Đảm bảo có ít nhất một đơn vị mặc định
      const hasDefault = unitOptions.some((opt) => opt.isDefault);
      if (!hasDefault && unitOptions.length > 0) {
        unitOptions[0].isDefault = true;
      }
    }

    const newProduct = new Product({
      ...req.body,
      productImages: uploadedUrls,
      productDescription: descriptions,
      productPrice: Number(req.body.productPrice),
      productDiscount: Number(req.body.productDiscount) || 0,
      productStock: Number(req.body.productStock) || 0,
      productWeight: Number(req.body.productWeight) || 0,
      productCategory: category.nameCategory,
      productUnit: req.body.productUnit || "gram",
      discountStartDate,
      discountEndDate,
      expiryDate,
      productStatus,
      unitOptions: unitOptions,
      branchId: req.body.branchId || null,
    });

    // Tính productPromoPrice từ productPrice và productDiscount
    if (newProduct.productDiscount > 0) {
      newProduct.productPromoPrice =
        newProduct.productPrice * (1 - newProduct.productDiscount / 100);
    }

    const savedProduct = await newProduct.save();

    // --- Push Notification Logic for New Product ---
    // Gửi thông báo đến tất cả người dùng có đăng ký nhận thông báo
    sendNewProductNotification(savedProduct).catch((error) =>
      console.error("Error sending product notification to users:", error)
    );

    // Notification for admins - vẫn giữ lại
    const adminsToNotify = await Admin.find({
      $or: [
        { role: "admin" }, // Admin gets all notifications
        {
          role: "manager",
          permissions: { $in: ["Quản lý sản phẩm", "products"] },
        }, // Managers with product permission
      ],
      "pushSubscriptions.0": { $exists: true }, // Only users with at least one subscription
    });

    const notificationPayload = {
      title: "Sản phẩm mới",
      body: `Sản phẩm "${savedProduct.productName}" đã được thêm mới.`,
      data: {
        url: `/admin/products/edit/${savedProduct._id}`,
        productId: savedProduct._id,
      },
    };

    for (const admin of adminsToNotify) {
      for (const subscription of admin.pushSubscriptions) {
        sendPushNotification(
          admin._id,
          subscription,
          notificationPayload
        ).catch((error) =>
          console.error("Error sending notification to admin:", error)
        );
      }
    }
    // --- End Push Notification Logic ---

    // Chuyển đổi dữ liệu số thành chuỗi trước khi gửi về client
    const productToSend = savedProduct.toObject();
    productToSend.productPrice = String(productToSend.productPrice);
    productToSend.productDiscount = String(productToSend.productDiscount);
    productToSend.productStock = String(productToSend.productStock);
    productToSend.productWeight = String(productToSend.productWeight);
    productToSend.productPromoPrice = String(productToSend.productPromoPrice);
    productToSend.productWarranty = String(productToSend.productWarranty);

    // Format discount dates
    if (productToSend.discountStartDate) {
      productToSend.discountStartDate =
        productToSend.discountStartDate.toISOString();
    }
    if (productToSend.discountEndDate) {
      productToSend.discountEndDate =
        productToSend.discountEndDate.toISOString();
    }
    // Format expiry date
    if (productToSend.expiryDate) {
      productToSend.expiryDate = productToSend.expiryDate.toISOString();
    }

    return res.status(201).json(productToSend);
  } catch (error) {
    console.error("Error in createProduct:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      errorDetails:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    console.log("Updating product with ID:", id);
    console.log("Request body:", req.body);
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Kiểm tra danh mục mới nếu có thay đổi
    if (req.body.productCategory && req.body.productCategory !== product.productCategory) {
      // Thử tìm danh mục theo ID trước
      let category = null;
      try {
        category = await Category.findById(req.body.productCategory);
      } catch (error) {
        console.log("Không tìm thấy danh mục theo ID, thử tìm theo tên...");
      }
      
      // Nếu không tìm thấy theo ID, thử tìm theo tên
      if (!category) {
        category = await Category.findOne({
          nameCategory: req.body.productCategory,
        });
      }
      
      if (!category) {
        console.error("Không tìm thấy danh mục với ID/tên:", req.body.productCategory);
        return res
          .status(400)
          .json({ message: "Danh mục sản phẩm không tồn tại" });
      }
      
      // Lưu tên danh mục
      req.body.productCategory = category.nameCategory;
      console.log("Đã tìm thấy danh mục:", category.nameCategory);
    }

    // Sử dụng URLs đã được upload thông qua Cloudinary widget
    let newImageUrls = [];
    if (req.body.newImageUrls && req.body.newImageUrls.length > 0) {
      newImageUrls = Array.isArray(req.body.newImageUrls)
        ? req.body.newImageUrls
        : [req.body.newImageUrls];
    }

    let existingImages = product.productImages || [];
    
    // Nếu có productImages trong request, sử dụng trực tiếp
    if (req.body.productImages && Array.isArray(req.body.productImages)) {
      console.log("Using productImages from request:", req.body.productImages);
      existingImages = req.body.productImages;
      newImageUrls = []; // Không cần thêm newImageUrls nữa vì đã có đủ trong productImages
    } else if (req.body.keepImages) {
      const keepImages = Array.isArray(req.body.keepImages)
        ? req.body.keepImages
        : JSON.parse(req.body.keepImages);

      existingImages = existingImages.filter((img) => keepImages.includes(img));

      const imagesToDelete = product.productImages.filter(
        (img) => !keepImages.includes(img)
      );

      // Xóa các ảnh không giữ lại
      await Promise.all(
        imagesToDelete.map((img) => {
          const publicId = img.split("/").pop().split(".")[0];
          return cloudinary.uploader.destroy(`products/${publicId}`);
        })
      );
    }

    let productDescription = product.productDescription;
    if (req.body.productDescription) {
      try {
        // Nếu là JSON string, parse nó
        if (typeof req.body.productDescription === 'string' && 
            (req.body.productDescription.startsWith('[') || req.body.productDescription.startsWith('{'))) {
          productDescription = JSON.parse(req.body.productDescription);
        } else {
          // Nếu là string thông thường, giữ nguyên định dạng
          productDescription = req.body.productDescription;
        }
      } catch (error) {
        // Nếu không parse được, giữ nguyên giá trị
        console.log("Không thể parse productDescription, giữ nguyên định dạng:", error.message);
        productDescription = req.body.productDescription;
      }
    }

    // Xử lý thông tin ngày bắt đầu và kết thúc giảm giá
    let discountStartDate = product.discountStartDate;
    let discountEndDate = product.discountEndDate;

    if (req.body.discountStartDate) {
      discountStartDate = new Date(req.body.discountStartDate);
    } else if (req.body.discountStartDate === null) {
      discountStartDate = null;
    }

    if (req.body.discountEndDate) {
      discountEndDate = new Date(req.body.discountEndDate);
    } else if (req.body.discountEndDate === null) {
      discountEndDate = null;
    }

    // Xử lý hạn sử dụng
    let expiryDate = product.expiryDate;
    let productStatus = req.body.productStatus || product.productStatus;

    if (req.body.expiryDate) {
      expiryDate = new Date(req.body.expiryDate);

      // Nếu hạn sử dụng đã qua, cập nhật trạng thái thành "Hết hàng"
      if (expiryDate < new Date()) {
        productStatus = "Hết hàng";
      }
    } else if (req.body.expiryDate === null) {
      expiryDate = null;
    }

    // Validate và chuẩn bị unitOptions nếu có
    let unitOptions = product.unitOptions || [];
    if (req.body.unitOptions && Array.isArray(req.body.unitOptions)) {
      console.log("Processing unitOptions:", req.body.unitOptions);
      
      try {
        unitOptions = req.body.unitOptions.map((option) => ({
          unit: option.unit || "gram",
          price: Number(option.price) || 0,
          conversionRate: Number(option.conversionRate) || 1,
          inStock: Number(option.inStock) || 0,
          isDefault: Boolean(option.isDefault) || false,
        }));

        // Đảm bảo có ít nhất một đơn vị mặc định
        const hasDefault = unitOptions.some((opt) => opt.isDefault);
        if (!hasDefault && unitOptions.length > 0) {
          unitOptions[0].isDefault = true;
        }
        
        console.log("Processed unitOptions:", unitOptions);
      } catch (error) {
        console.error("Error processing unitOptions:", error);
        unitOptions = product.unitOptions || [];
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        ...req.body,
        productImages: [...existingImages, ...newImageUrls],
        productDescription,
        productPrice: 
          req.body.productPrice !== undefined && !isNaN(Number(req.body.productPrice))
            ? Number(req.body.productPrice) 
            : product.productPrice,
        productDiscount: 
          req.body.productDiscount !== undefined && !isNaN(Number(req.body.productDiscount)) 
            ? Number(req.body.productDiscount) 
            : product.productDiscount,
        productStock: 
          req.body.productStock !== undefined && !isNaN(Number(req.body.productStock))
            ? Number(req.body.productStock) 
            : product.productStock,
        productWeight: 
          req.body.productWeight !== undefined && !isNaN(Number(req.body.productWeight))
            ? Number(req.body.productWeight) 
            : product.productWeight,
        productWarranty:
          req.body.productWarranty !== undefined && !isNaN(Number(req.body.productWarranty))
            ? Number(req.body.productWarranty) 
            : product.productWarranty,
        productUnit: req.body.productUnit || product.productUnit || "gram",
        discountStartDate,
        discountEndDate,
        expiryDate,
        productStatus,
        unitOptions: unitOptions,
        branchId: req.body.branchId || product.branchId,
      },
      { new: true }
    );

    // Tính lại productPromoPrice sau khi cập nhật
    if (updatedProduct.productDiscount > 0) {
      updatedProduct.productPromoPrice =
        updatedProduct.productPrice *
        (1 - updatedProduct.productDiscount / 100);
      await updatedProduct.save();
    } else {
      updatedProduct.productPromoPrice = 0;
      await updatedProduct.save();
    }

    // Chuyển đổi dữ liệu số thành chuỗi trước khi gửi về client
    const productToSend = updatedProduct.toObject();
    productToSend.productPrice = String(productToSend.productPrice);
    productToSend.productDiscount = String(productToSend.productDiscount);
    productToSend.productStock = String(productToSend.productStock);
    productToSend.productWeight = String(productToSend.productWeight);
    productToSend.productPromoPrice = String(productToSend.productPromoPrice);
    productToSend.productWarranty = String(productToSend.productWarranty);

    // Format discount dates
    if (productToSend.discountStartDate) {
      productToSend.discountStartDate =
        productToSend.discountStartDate.toISOString();
    }
    if (productToSend.discountEndDate) {
      productToSend.discountEndDate =
        productToSend.discountEndDate.toISOString();
    }
    // Format expiry date
    if (productToSend.expiryDate) {
      productToSend.expiryDate = productToSend.expiryDate.toISOString();
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      product: productToSend,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Cập nhật sản phẩm thất bại",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    res.status(200).json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    res.status(500).json({ message: "Xóa sản phẩm thất bại", error });
  }
}; 