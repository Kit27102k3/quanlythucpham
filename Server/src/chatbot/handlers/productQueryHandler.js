// Cải thiện hàm xử lý câu hỏi về sản phẩm
async function handleProductQuery(message, context) {
  console.log(`Nhận tin nhắn về sản phẩm: "${message}"`);
  
  // Lấy thông tin sản phẩm đang xem từ ngữ cảnh (nếu có)
  const productId = context && context.productId ? context.productId : null;
  console.log(`Thông tin sản phẩm đang xem (productId): ${productId}`);
  
  // Kiểm tra xem tin nhắn có phải là yêu cầu so sánh sản phẩm không
  const isComparisonQuery = checkIfComparisonQuery(message);
  console.log(`Kiểm tra tin nhắn có phải yêu cầu so sánh không: "${message}"`);
  
  if (isComparisonQuery) {
    return await handleProductComparison(message, context);
  }
  
  // Kiểm tra xem câu hỏi có phụ thuộc vào ngữ cảnh không
  const isContextDependent = checkIfContextDependent(message);
  console.log(`Kiểm tra câu hỏi phụ thuộc ngữ cảnh: ${isContextDependent}`);
  
  // Nếu câu hỏi phụ thuộc ngữ cảnh và có thông tin sản phẩm trong ngữ cảnh
  if (isContextDependent && context && context.lastProduct) {
    return await handleProductInfoQuery(message, context.lastProduct);
  }
  
  // Phân loại loại câu hỏi về sản phẩm
  const queryType = classifyProductQuery(message);
  console.log(`Intent được phát hiện: ${queryType}`);
  
  // Xử lý theo loại câu hỏi
  switch (queryType) {
    case 'product_search':
      return await searchProducts(message);
    case 'product_info':
      if (productId) {
        const product = await getProductById(productId);
        if (product) {
          return await handleProductInfoQuery(message, product);
        }
      }
      return "Bạn muốn biết thông tin về sản phẩm nào? Vui lòng cho tôi biết tên sản phẩm.";
    case 'product_price':
      if (productId) {
        const product = await getProductById(productId);
        if (product) {
          return `Giá của ${product.productName} là ${formatPrice(product.productPrice)} đồng.`;
        }
      }
      return "Bạn muốn biết giá của sản phẩm nào? Vui lòng cho tôi biết tên sản phẩm.";
    default:
      return await searchProducts(message);
  }
}

// Cải thiện hàm phân loại câu hỏi về sản phẩm
function classifyProductQuery(message) {
  const lowerMessage = message.toLowerCase();
  
  // Các từ khóa cho từng loại câu hỏi
  const queryKeywords = {
    product_search: [
      'tìm', 'có bán', 'mua', 'kiếm', 'loại', 'nào', 'ít đường', 'ăn kiêng',
      'dinh dưỡng', 'trái cây', 'rau củ', 'thực phẩm'
    ],
    product_info: [
      'thông tin', 'chi tiết', 'mô tả', 'đặc điểm', 'tính năng', 'thành phần',
      'xuất xứ', 'sản xuất', 'hạn sử dụng', 'bảo quản', 'cách dùng'
    ],
    product_price: [
      'giá', 'bao nhiêu', 'giá tiền', 'giá cả', 'đắt', 'rẻ', 'tiền'
    ]
  };
  
  // Các mẫu câu hỏi đặc biệt
  const specialPatterns = {
    product_search: [
      /loại .* nào/i,
      /có .* không/i,
      /bán .* không/i,
      /tìm .* ít đường/i,
      /tìm .* ăn kiêng/i,
      /sản phẩm .* cho người/i,
      /trái cây nào/i,
      /rau củ nào/i,
      /thực phẩm nào/i
    ],
    product_info: [
      /thông tin .* như thế nào/i,
      /chi tiết về .*/i,
      /mô tả .*/i,
      /thành phần của .*/i
    ],
    product_price: [
      /giá .* là bao nhiêu/i,
      /bao nhiêu tiền/i,
      /.* giá bao nhiêu/i
    ]
  };
  
  // Kiểm tra các mẫu câu đặc biệt
  for (const [type, patterns] of Object.entries(specialPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return type;
      }
    }
  }
  
  // Kiểm tra từng loại câu hỏi dựa trên từ khóa
  let bestType = 'product_search'; // Mặc định là tìm kiếm sản phẩm
  let highestScore = 0;
  
  for (const [type, keywords] of Object.entries(queryKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        score += 1;
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestType = type;
    }
  }
  
  // Ưu tiên đặc biệt cho các câu hỏi về trái cây ít đường hoặc ăn kiêng
  if (lowerMessage.includes('trái cây') && 
      (lowerMessage.includes('ít đường') || lowerMessage.includes('ăn kiêng'))) {
    return 'product_search';
  }
  
  return bestType;
}

// Import hàm tìm kiếm ngữ nghĩa
const { semanticSearch } = require('./semanticSearchHandler');

// Cập nhật hàm tìm kiếm sản phẩm để sử dụng tìm kiếm ngữ nghĩa
async function searchProducts(message) {
  console.log(`Đang tìm kiếm sản phẩm với query: ${message}`);
  
  // Sử dụng tìm kiếm ngữ nghĩa thay vì tìm kiếm từng từ khóa riêng lẻ
  let products = await semanticSearch(message);
  
  // Nếu không tìm thấy sản phẩm nào bằng tìm kiếm ngữ nghĩa, thử phương pháp cũ
  if (products.length === 0) {
    console.log("Không tìm thấy sản phẩm bằng tìm kiếm ngữ nghĩa, thử phương pháp cũ");
    
    // Phân tích câu hỏi để xác định danh mục sản phẩm
    const category = extractProductCategory(message);
    console.log(`Tìm sản phẩm thuộc danh mục: ${category}`);
    
    // Phân tích câu hỏi để xác định khoảng giá
    const priceRange = extractPriceRange(message);
    console.log(`Từ khóa giá: ${JSON.stringify(priceRange)}`);
    
    // Phân tích câu hỏi để lấy từ khóa tìm kiếm
    const keywords = extractKeywords(message);
    console.log(`Từ khóa tìm kiếm: ${JSON.stringify(keywords)}`);
    
    // Tìm kiếm sản phẩm theo danh mục và từ khóa
    if ((message.toLowerCase().includes('ít đường') || message.toLowerCase().includes('ăn kiêng')) && 
        (message.toLowerCase().includes('trái cây') || message.toLowerCase().includes('hoa quả') || message.toLowerCase().includes('quả'))) {
      
      console.log("Tìm sản phẩm trái cây ít đường hoặc cho người ăn kiêng");
      
      // Tìm trong danh mục Trái cây
      products = await searchProductsByCategory('Trái cây', [...keywords, 'ít đường', 'ăn kiêng'], priceRange);
      
      // Nếu không tìm thấy đủ sản phẩm, thử tìm trong danh mục Rau củ quả
      if (products.length < 3) {
        const moreProducts = await searchProductsByCategory('Rau củ quả', [...keywords, 'ít đường', 'ăn kiêng'], priceRange);
        products = [...products, ...moreProducts].slice(0, 5);
      }
      
      // Nếu vẫn không tìm thấy, thử tìm với từ khóa chung
      if (products.length === 0) {
        console.log("Không tìm thấy sản phẩm, thử tìm chỉ với từ khóa");
        products = await searchProductsByKeywords([...keywords, 'ít đường', 'ăn kiêng']);
      }
    } else {
      // Tìm kiếm thông thường
      products = await searchProductsByCategory(category, keywords, priceRange);
      
      // Nếu không tìm thấy, thử tìm với từ khóa
      if (products.length === 0) {
        console.log("Không tìm thấy sản phẩm, thử tìm chỉ với từ khóa");
        products = await searchProductsByKeywords(keywords);
      }
    }
  } else {
    console.log(`Tìm thấy ${products.length} sản phẩm bằng tìm kiếm ngữ nghĩa`);
  }
  
  // Nếu không tìm thấy sản phẩm nào
  if (products.length === 0) {
    return "Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn. Bạn có thể mô tả chi tiết hơn hoặc tìm kiếm với từ khóa khác.";
  }
  
  // Lưu thông tin sản phẩm vào ngữ cảnh
  await saveProductContext(context ? context.userId : null, products[0], products);
  
  // Tạo câu trả lời với thông tin sản phẩm
  let response = "";
  
  // Trường hợp đặc biệt cho câu hỏi về trái cây ít đường hoặc ăn kiêng
  if ((message.toLowerCase().includes('ít đường') || message.toLowerCase().includes('ăn kiêng')) && 
      (message.toLowerCase().includes('trái cây') || message.toLowerCase().includes('hoa quả') || message.toLowerCase().includes('quả'))) {
    
    response = "Dựa trên yêu cầu của bạn về trái cây ít đường phù hợp cho người ăn kiêng, tôi xin giới thiệu:\n\n";
    
    // Lọc sản phẩm thuộc danh mục Trái cây hoặc Rau củ quả
    const filteredProducts = products.filter(p => 
      p.productCategory === 'Trái cây' || p.productCategory === 'Rau củ quả'
    );
    
    if (filteredProducts.length > 0) {
      filteredProducts.slice(0, 3).forEach((product, index) => {
        response += `${index + 1}. ${product.productName} - ${formatPrice(product.productPrice)} đồng\n`;
        if (product.productDescription && product.productDescription.length > 0) {
          response += `   • ${product.productDescription.slice(0, 2).join('\n   • ')}\n`;
        }
        response += '\n';
      });
      
      response += "Những loại trái cây này đều có hàm lượng đường thấp, phù hợp cho người ăn kiêng hoặc người cần kiểm soát lượng đường. Bạn có muốn biết thêm thông tin chi tiết về sản phẩm nào không?";
    } else {
      response = "Xin lỗi, hiện tại cửa hàng chúng tôi không có sản phẩm trái cây đặc biệt cho người ăn kiêng. Tuy nhiên, tôi có thể giới thiệu một số loại trái cây tự nhiên có hàm lượng đường thấp như: quả bơ, quả chanh, quả dưa chuột, quả dâu tây, quả việt quất. Bạn có thể tìm kiếm các sản phẩm này trong danh mục Trái cây của chúng tôi.";
    }
  } else {
    // Câu trả lời thông thường
    response = `Tôi đã tìm thấy ${products.length} sản phẩm phù hợp với yêu cầu của bạn:\n\n`;
    
    products.slice(0, 3).forEach((product, index) => {
      response += `${index + 1}. ${product.productName} - ${formatPrice(product.productPrice)} đồng\n`;
      if (product.productDescription && product.productDescription.length > 0) {
        response += `   • ${product.productDescription.slice(0, 1).join('\n   • ')}\n`;
      }
      response += '\n';
    });
    
    if (products.length > 3) {
      response += `...và ${products.length - 3} sản phẩm khác.\n\n`;
    }
    
    response += "Bạn có muốn biết thêm thông tin chi tiết về sản phẩm nào không?";
  }
  
  return response;
} 