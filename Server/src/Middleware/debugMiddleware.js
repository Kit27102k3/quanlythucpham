// Middleware debug để kiểm tra lỗi cập nhật sản phẩm
export const debugProductUpdate = (req, res, next) => {
  try {
    console.log("=== DEBUG PRODUCT UPDATE ===");
    console.log("Product ID:", req.params.id);
    console.log("Request Headers:", req.headers);
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    
    // Kiểm tra các trường dữ liệu quan trọng
    const fieldsToCheck = [
      'productName', 
      'productPrice', 
      'productDiscount', 
      'productStock',
      'productCategory',
      'productDescription',
      'unitOptions',
      'productImages'
    ];
    
    console.log("=== FIELD VALIDATION ===");
    fieldsToCheck.forEach(field => {
      console.log(`${field}:`, req.body[field], 
        typeof req.body[field], 
        Array.isArray(req.body[field]) ? `Array[${req.body[field].length}]` : '');
    });
    
    // Kiểm tra unitOptions đặc biệt
    if (req.body.unitOptions) {
      console.log("=== UNIT OPTIONS DETAIL ===");
      if (Array.isArray(req.body.unitOptions)) {
        req.body.unitOptions.forEach((option, index) => {
          console.log(`Option ${index}:`, option);
          console.log(`  unit: ${option.unit} (${typeof option.unit})`);
          console.log(`  price: ${option.price} (${typeof option.price})`);
          console.log(`  conversionRate: ${option.conversionRate} (${typeof option.conversionRate})`);
          console.log(`  inStock: ${option.inStock} (${typeof option.inStock})`);
          console.log(`  isDefault: ${option.isDefault} (${typeof option.isDefault})`);
        });
      } else {
        console.log("unitOptions is not an array:", req.body.unitOptions);
        
        // Nếu unitOptions không phải là mảng, thử chuyển đổi từ chuỗi JSON
        try {
          if (typeof req.body.unitOptions === 'string') {
            req.body.unitOptions = JSON.parse(req.body.unitOptions);
            console.log("Converted unitOptions to array:", req.body.unitOptions);
          }
        } catch (error) {
          console.error("Failed to parse unitOptions:", error);
        }
      }
    }
    
    // Kiểm tra productDescription
    if (req.body.productDescription) {
      console.log("=== PRODUCT DESCRIPTION DETAIL ===");
      console.log("Type:", typeof req.body.productDescription);
      console.log("Is Array:", Array.isArray(req.body.productDescription));
      
      if (typeof req.body.productDescription === 'string') {
        try {
          // Thử chuyển đổi từ chuỗi JSON
          const parsed = JSON.parse(req.body.productDescription);
          console.log("Parsed productDescription:", parsed);
          req.body.productDescription = parsed;
        } catch (error) {
          // Nếu không phải JSON, xử lý như chuỗi thông thường
          console.log("Not valid JSON, treating as string");
        }
      }
    }
    
    console.log("=== END DEBUG ===");
    next();
  } catch (error) {
    console.error("Debug error:", error);
    next();
  }
}; 