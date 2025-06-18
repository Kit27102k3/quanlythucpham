// Cải thiện hàm tìm kiếm sản phẩm theo danh mục
async function searchProductsByCategory(category, keywords, priceRange) {
  console.log(`Tìm sản phẩm thuộc danh mục: ${category}`);
  
  // Tạo bộ lọc cơ bản
  let filter = {};
  
  // Nếu có danh mục cụ thể, thêm vào bộ lọc
  if (category && category !== 'all') {
    filter.category = category;
  }
  
  // Xử lý từ khóa tìm kiếm
  if (keywords && keywords.length > 0) {
    console.log("Từ khóa tìm kiếm:", keywords);
    
    // Tạo danh sách từ khóa quan trọng và trọng số
    const keywordWeights = {
      'ít đường': 10,
      'đường': 8,
      'ăn kiêng': 10,
      'kiêng': 9,
      'ít calo': 10,
      'calo': 8,
      'dinh dưỡng': 7,
      'trái cây': 6,
      'hoa quả': 6,
      'rau': 5,
      'củ': 5,
      'quả': 5
    };
    
    // Tạo mảng điều kiện tìm kiếm với trọng số
    const searchConditions = [];
    
    // Tìm kiếm cụm từ quan trọng trước
    const importantPhrases = Object.keys(keywordWeights);
    for (const phrase of importantPhrases) {
      if (keywords.join(' ').toLowerCase().includes(phrase)) {
        searchConditions.push({
          $or: [
            { productName: { $regex: phrase, $options: "i" } },
            { productDescription: { $regex: phrase, $options: "i" } },
            { productDetails: { $regex: phrase, $options: "i" } },
            { productInfo: { $regex: phrase, $options: "i" } }
          ],
          weight: keywordWeights[phrase]
        });
      }
    }
    
    // Sau đó mới tìm kiếm từng từ riêng lẻ
    keywords.forEach(keyword => {
      if (keyword.length > 2) { // Bỏ qua các từ quá ngắn
        searchConditions.push({
          $or: [
            { productName: { $regex: keyword, $options: "i" } },
            { productDescription: { $regex: keyword, $options: "i" } },
            { productDetails: { $regex: keyword, $options: "i" } },
            { productInfo: { $regex: keyword, $options: "i" } }
          ],
          weight: 3 // Trọng số mặc định cho từ khóa đơn
        });
      }
    });
    
    // Nếu có điều kiện tìm kiếm, thêm vào bộ lọc
    if (searchConditions.length > 0) {
      filter.$or = searchConditions.map(condition => condition.$or);
    }
  }
  
  // Xử lý khoảng giá nếu có
  if (priceRange && priceRange.length === 2) {
    filter.productPrice = { $gte: priceRange[0], $lte: priceRange[1] };
  }
  
  console.log("Filter tìm kiếm:", JSON.stringify(filter));
  
  try {
    // Tìm kiếm sản phẩm với bộ lọc
    let products = await Product.find(filter).limit(10);
    
    // Nếu không tìm thấy sản phẩm và có danh mục cụ thể, thử tìm không theo danh mục
    if (products.length === 0 && category && category !== 'all') {
      console.log("Không tìm thấy sản phẩm, thử tìm không giới hạn danh mục");
      const filterWithoutCategory = { ...filter };
      delete filterWithoutCategory.category;
      products = await Product.find(filterWithoutCategory).limit(10);
    }
    
    // Tính điểm phù hợp cho mỗi sản phẩm
    products = products.map(product => {
      let matchScore = 0;
      
      // Tính điểm dựa trên từ khóa
      if (keywords && keywords.length > 0) {
        const productText = `${product.productName} ${product.productInfo} ${product.productDetails} ${(product.productDescription || []).join(' ')}`.toLowerCase();
        
        // Tính điểm cho cụm từ quan trọng
        for (const phrase of Object.keys(keywordWeights)) {
          if (productText.includes(phrase.toLowerCase())) {
            matchScore += keywordWeights[phrase];
          }
        }
        
        // Tính điểm cho từng từ khóa
        keywords.forEach(keyword => {
          if (keyword.length > 2 && productText.includes(keyword.toLowerCase())) {
            matchScore += 3;
          }
        });
        
        // Cộng điểm nếu sản phẩm thuộc danh mục phù hợp
        if (category && product.productCategory === category) {
          matchScore += 5;
        }
        
        // Cộng điểm đặc biệt cho trái cây có ít đường
        if (product.productCategory === 'Trái cây' && 
            (productText.includes('ít đường') || productText.includes('ăn kiêng'))) {
          matchScore += 15;
        }
      }
      
      // Thêm điểm phù hợp vào sản phẩm
      const productObj = product.toObject();
      productObj.matchScore = matchScore;
      return productObj;
    });
    
    // Sắp xếp theo điểm phù hợp giảm dần
    products.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log(`Tìm thấy ${products.length} sản phẩm phù hợp`);
    return products;
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    return [];
  }
} 