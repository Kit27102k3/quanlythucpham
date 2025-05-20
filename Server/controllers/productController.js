// Lấy dữ liệu tồn kho sản phẩm cho báo cáo
exports.getInventory = async (req, res) => {
  try {
    const products = await Product.find({}).select('_id productName productCategory productPrice productStock productCode productImages productBrand productStatus productOrigin productWeight productUnit');
    
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
        origin: product.productOrigin || ''
      };
    });
    
    res.status(200).json(inventoryData);
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    res.status(500).json({ error: 'Error fetching inventory data' });
  }
}; 