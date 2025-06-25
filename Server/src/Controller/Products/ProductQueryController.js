import Product from "../../Model/Products.js";
import { updateProductExpirations } from "./ProductUtilsController.js";

export const getAllProducts = async (req, res) => {
  try {
    // Kiểm tra và cập nhật hạn sử dụng và giảm giá trước khi trả về danh sách
    await updateProductExpirations();

    const products = await Product.find();

    // Chuyển đổi dữ liệu số thành chuỗi
    const productsToSend = products.map((product) => {
      const productObj = product.toObject();
      productObj.productPrice = String(productObj.productPrice || "");
      productObj.productDiscount = String(productObj.productDiscount || "");
      productObj.productStock = String(productObj.productStock || "");
      productObj.productWeight = String(productObj.productWeight || "");
      productObj.productPromoPrice = String(productObj.productPromoPrice || "");
      productObj.productWarranty = String(productObj.productWarranty || "");
      return productObj;
    });

    res.status(200).json(productsToSend);
  } catch (error) {
    res.status(500).json({ message: "Lấy danh sách sản phẩm thất bại", error });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    // Kiểm tra và cập nhật hạn sử dụng và giảm giá trước khi trả về chi tiết sản phẩm
    await updateProductExpirations();

    // Thay đổi: Tìm sản phẩm theo productCode thay vì _id
    // Nếu id là MongoDB ObjectId, tìm theo _id, nếu không thì tìm theo productCode
    let product;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    if (isObjectId) {
      // Tìm theo _id
      product = await Product.findById(id);
    } else {
      // Tìm tất cả sản phẩm có cùng productCode
      const products = await Product.find({ productCode: id }).sort({ createdAt: -1 });
      
      if (products.length > 0) {
        // 1. Ưu tiên sản phẩm còn hàng và có createdAt mới nhất
        const availableProducts = products.filter(p => p.productStatus !== "Hết hàng");
        
        if (availableProducts.length > 0) {
          // Sản phẩm còn hàng, lấy sản phẩm mới nhất
          product = availableProducts[0]; // Đã sắp xếp theo createdAt giảm dần
        } else {
          // Không có sản phẩm nào còn hàng, lấy sản phẩm mới nhất
          product = products[0]; // Đã sắp xếp theo createdAt giảm dần
        }
      }
    }

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Chuyển đổi dữ liệu số thành chuỗi
    const productToSend = product.toObject();
    productToSend.productPrice = String(productToSend.productPrice || "");
    productToSend.productDiscount = String(productToSend.productDiscount || "");
    productToSend.productStock = String(productToSend.productStock || "");
    productToSend.productWeight = String(productToSend.productWeight || "");
    productToSend.productPromoPrice = String(
      productToSend.productPromoPrice || ""
    );
    productToSend.productWarranty = String(productToSend.productWarranty || "");

    res.status(200).json(productToSend);
  } catch (error) {
    res.status(500).json({ message: "Lấy chi tiết sản phẩm thất bại", error });
  }
};

export const getProductBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    // Kiểm tra và cập nhật hạn sử dụng và giảm giá trước khi trả về sản phẩm
    await updateProductExpirations();

    // Lấy tất cả sản phẩm
    const allProducts = await Product.find().sort({ createdAt: -1 });
    
    // Lọc các sản phẩm có slug phù hợp
    const matchingProducts = allProducts.filter(
      (p) =>
        p.productName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") === slug
    );

    if (matchingProducts.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Nhóm sản phẩm theo mã sản phẩm (productCode)
    const productsByCode = {};
    matchingProducts.forEach(product => {
      if (!productsByCode[product.productCode]) {
        productsByCode[product.productCode] = [];
      }
      productsByCode[product.productCode].push(product);
    });

    // Đối với mỗi mã sản phẩm, chọn sản phẩm mới nhất
    const newestProducts = Object.values(productsByCode).map(products => {
      // Sắp xếp theo createdAt giảm dần (mới nhất trước)
      return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    });

    // Tìm sản phẩm còn hàng và mới nhất
    let product = newestProducts.find(p => p.productStatus === "Còn hàng");
    
    // Nếu không có sản phẩm nào còn hàng, lấy sản phẩm mới nhất
    if (!product && newestProducts.length > 0) {
      // Sắp xếp theo createdAt giảm dần
      product = newestProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    }

    // Chuyển đổi dữ liệu số thành chuỗi
    const productToSend = product.toObject();
    productToSend.productPrice = String(productToSend.productPrice || "");
    productToSend.productDiscount = String(productToSend.productDiscount || "");
    productToSend.productStock = String(productToSend.productStock || "");
    productToSend.productWeight = String(productToSend.productWeight || "");
    productToSend.productPromoPrice = String(
      productToSend.productPromoPrice || ""
    );
    productToSend.productWarranty = String(productToSend.productWarranty || "");

    console.log(`[getProductBySlug] Trả về sản phẩm: ${productToSend.productName}, Mã: ${productToSend.productCode}, Trạng thái: ${productToSend.productStatus}`);
    
    res.status(200).json(productToSend);
  } catch (error) {
    console.error("[getProductBySlug] Lỗi:", error);
    res.status(500).json({ message: "Lấy chi tiết sản phẩm thất bại", error });
  }
};

export const searchProducts = async (req, res) => {
  try {
    let { name, q, page = 1, limit = 10 } = req.query;
    const keyword = name || q;
    page = parseInt(page) > 0 ? parseInt(page) : 1;
    limit = Math.min(parseInt(limit) > 0 ? parseInt(limit) : 10, 100);

    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({ message: "Invalid search input" });
    }

    // 1. Ưu tiên tìm theo tên và danh mục
    let primaryQuery = {
      $or: [
        { productName: { $regex: keyword.trim(), $options: "i" } },
        { productCategory: { $regex: keyword.trim(), $options: "i" } },
      ],
    };
    let products = await Product.find(primaryQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Nếu không có kết quả, mở rộng tìm theo các trường khác
    if (products.length === 0) {
      let secondaryQuery = {
        $or: [
          { productInfo: { $regex: keyword.trim(), $options: "i" } },
          { productBrand: { $regex: keyword.trim(), $options: "i" } },
          { productCode: { $regex: keyword.trim(), $options: "i" } },
          { productDetails: { $regex: keyword.trim(), $options: "i" } },
          { productOrigin: { $regex: keyword.trim(), $options: "i" } },
          { productDescription: { $regex: keyword.trim(), $options: "i" } },
          { productDescription: { $elemMatch: { $regex: keyword.trim(), $options: "i" } } },
        ],
      };
      products = await Product.find(secondaryQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    }

    // Chuyển đổi dữ liệu số thành chuỗi
    const productsToSend = products.map((product) => {
      product.productPrice = String(product.productPrice || "");
      product.productDiscount = String(product.productDiscount || "");
      product.productStock = String(product.productStock || "");
      product.productWeight = String(product.productWeight || "");
      product.productPromoPrice = String(product.productPromoPrice || "");
      product.productWarranty = String(product.productWarranty || "");
      return product;
    });

    return res.status(200).json({
      products: productsToSend,
      total: productsToSend.length,
      page,
      totalPages: 1,
    });
  } catch (error) {
    if (error.name === "CastError" && error.path === "_id") {
      return res.status(400).json({ message: "Invalid search parameter" });
    }
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getProductByCategory = async (req, res) => {
  try {
    const categoryName = req.params.category;
    const excludeId = req.query.excludeId;

    let query = { productCategory: categoryName };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const products = await Product.find(query);

    // Chuyển đổi dữ liệu số thành chuỗi
    const productsToSend = products.map((product) => {
      const productObj = product.toObject();
      productObj.productPrice = String(productObj.productPrice || "");
      productObj.productDiscount = String(productObj.productDiscount || "");
      productObj.productStock = String(productObj.productStock || "");
      productObj.productWeight = String(productObj.productWeight || "");
      productObj.productPromoPrice = String(productObj.productPromoPrice || "");
      productObj.productWarranty = String(productObj.productWarranty || "");
      return productObj;
    });

    res.status(200).json(productsToSend);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lấy sản phẩm theo danh mục thất bại", error });
  }
};

// Get products by branch ID
export const getProductsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required"
      });
    }
    
    const products = await Product.find({ branchId: branchId })
      .populate('productBrandId', 'name')
      .populate('productSupplierId', 'name');
    
    if (!products || products.length === 0) {
      return res.status(200).json([]);
    }
    
    return res.status(200).json(products);
  } catch (error) {
    console.error("Error in getProductsByBranch:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Lấy dữ liệu tồn kho sản phẩm cho báo cáo
export const getInventory = async (req, res) => {
  try {
    const products = await Product.find({}).select('_id productName productCategory productPrice productStock productCode productImages productBrand productStatus productOrigin productWeight productUnit branchId');
    
    // Biến đổi dữ liệu phù hợp cho báo cáo tồn kho
    const inventoryData = products.map(product => {
      const stock = product.productStock || 0;
      let status = 'Còn hàng';
      
      if (stock <= 0) status = 'Hết hàng';
      else if (stock <= 5) status = 'Sắp hết';
      else if (stock <= 20) status = 'Sắp hết';
      
      return {
        id: product._id,
        name: product.productName || 'Không xác định',
        stock: product.productStock || 0,
        value: (product.productPrice || 0) * (product.productStock || 0),
        status: status,
        category: product.productCategory || 'Không phân loại',
        price: product.productPrice || 0,
        sku: product.productCode || '',
        image: Array.isArray(product.productImages) && product.productImages.length > 0 
          ? product.productImages[0] 
          : '',
        brand: product.productBrand || '',
        weight: product.productWeight || 0,
        unit: product.productUnit || 'gram',
        origin: product.productOrigin || '',
        branchId: product.branchId || null
      };
    });
    
    res.status(200).json(inventoryData);
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    res.status(500).json({ error: 'Error fetching inventory data' });
  }
}; 