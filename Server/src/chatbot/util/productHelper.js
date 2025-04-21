/**
 * Công cụ sinh dữ liệu thông tin cho sản phẩm
 * Hỗ trợ tạo dữ liệu về công dụng, cách sử dụng, và các thông tin liên quan
 * cho chatbot khi không có sẵn trong database
 */

/**
 * Sinh công dụng cho sản phẩm dựa trên tên và loại sản phẩm
 * @param {Object} product - Sản phẩm cần sinh công dụng
 * @returns {string} - Công dụng của sản phẩm
 */
const generateProductUsage = (product) => {
  if (!product) return "Không có thông tin về công dụng của sản phẩm này.";
  
  const productName = product.productName?.toLowerCase() || '';
  const category = product.productCategory?.toLowerCase() || '';
  let description = product.productInfo || product.productDetails || '';
  
  // Từ khóa cho từng loại sản phẩm
  const fruitKeywords = ['trái cây', 'quả', 'cherry', 'táo', 'nho', 'cam', 'bưởi', 'chuối', 'dưa', 'dứa', 'xoài', 'ổi', 'lê', 'đào', 'berry'];
  const vegetableKeywords = ['rau', 'củ', 'quả', 'cà rốt', 'bắp cải', 'xà lách', 'cải', 'bông cải', 'hành', 'tỏi', 'khoai', 'cà chua', 'dưa chuột'];
  const milkKeywords = ['sữa', 'yaourt', 'yogurt', 'phô mai', 'cheese', 'sữa chua'];
  const meatKeywords = ['thịt', 'gà', 'heo', 'bò', 'cừu', 'vịt', 'ngỗng', 'thịt hộp', 'đùi', 'cánh', 'ức', 'ba chỉ', 'sườn', 'cốt lết'];
  const seafoodKeywords = ['hải sản', 'cá', 'tôm', 'cua', 'ghẹ', 'mực', 'sò', 'hàu', 'ốc', 'nghêu', 'sushi', 'sashimi'];
  const drinkKeywords = ['nước', 'drink', 'đồ uống', 'nước ngọt', 'soda', 'coca', 'pepsi', 'trà', 'cà phê', 'coffee', 'sinh tố', 'nước ép'];
  const snackKeywords = ['snack', 'bánh', 'kẹo', 'chocolate', 'socola', 'bim bim', 'hạt', 'bery', 'kernel'];
  const organicKeywords = ['organic', 'hữu cơ', 'sạch', 'không thuốc', 'không hóa chất', 'tự nhiên'];
  
  // Xác định loại sản phẩm dựa vào tên và danh mục
  let productType = 'general';
  
  if (fruitKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'fruit';
  } else if (vegetableKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'vegetable';
  } else if (milkKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'milk';
  } else if (meatKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'meat';
  } else if (seafoodKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'seafood';
  } else if (drinkKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'drink';
  } else if (snackKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'snack';
  }
  
  // Kiểm tra xem sản phẩm có phải là dâu tây
  if (productName.includes('dâu tây') || productName.includes('strawberry')) {
    return `${product.productName} nổi tiếng với hương vị ngọt thơm và nhiều công dụng tuyệt vời cho sức khỏe. Chứa hàm lượng cao vitamin C, chất chống oxy hóa, chất xơ và các hợp chất thực vật có lợi. Giúp tăng cường hệ miễn dịch, cải thiện sức khỏe tim mạch, kiểm soát đường huyết, hỗ trợ tiêu hóa, chống lão hóa, bồi bổ cơ thể, bổ máu, giảm viêm nhiễm, làm đẹp da, bồi bổ cho người ốm yếu, phụ nữ mang thai và trẻ em đang phát triển.`;
  }
  
  // Kiểm tra xem sản phẩm có phải là organic không
  const isOrganic = organicKeywords.some(kw => productName.includes(kw) || category.includes(kw) || description.includes(kw));
  
  // Sinh công dụng dựa trên loại sản phẩm
  let usage = '';
  
  switch(productType) {
    case 'fruit':
      usage = `${product.productName} ${isOrganic ? 'hữu cơ ' : ''}là nguồn cung cấp vitamin, khoáng chất và chất xơ tự nhiên tuyệt vời cho cơ thể. Giúp tăng cường hệ miễn dịch, cải thiện tiêu hóa và làm đẹp da. Đặc biệt phù hợp cho người cần bổ sung dinh dưỡng, người ăn kiêng và trẻ em đang trong giai đoạn phát triển.`;
      break;
    case 'vegetable':
      usage = `${product.productName} ${isOrganic ? 'hữu cơ ' : ''}là nguồn cung cấp vitamin, khoáng chất và chất xơ dồi dào, hỗ trợ quá trình tiêu hóa, tăng cường sức khỏe tim mạch và hệ miễn dịch. Đặc biệt thích hợp cho người ăn kiêng, người theo chế độ ăn chay và người muốn duy trì lối sống lành mạnh.`;
      break;
    case 'milk':
      usage = `${product.productName} là nguồn cung cấp canxi, protein và vitamin D dồi dào, giúp phát triển xương và cơ bắp khỏe mạnh. Đặc biệt phù hợp cho trẻ em đang phát triển, người cao tuổi, phụ nữ mang thai và sau sinh.`;
      break;
    case 'meat':
      usage = `${product.productName} ${isOrganic ? 'hữu cơ ' : ''}là nguồn protein chất lượng cao, sắt và vitamin B12, giúp phát triển cơ bắp, tăng cường sức khỏe và cung cấp năng lượng cho cơ thể. Đặc biệt thích hợp cho người tập thể thao, người cần bổ sung dinh dưỡng và phục hồi sức khỏe.`;
      break;
    case 'seafood':
      usage = `${product.productName} là nguồn cung cấp protein chất lượng cao, omega-3, iốt và các khoáng chất thiết yếu, hỗ trợ sức khỏe tim mạch, não bộ và tuyến giáp. Đặc biệt thích hợp cho người muốn duy trì chế độ ăn uống cân bằng và lành mạnh.`;
      break;
    case 'drink':
      usage = `${product.productName} giúp giải khát, bổ sung nước và các chất điện giải cần thiết cho cơ thể, đặc biệt trong thời tiết nóng hoặc sau khi tập luyện. Ngoài ra còn cung cấp năng lượng và các dưỡng chất tùy theo thành phần của đồ uống.`;
      break;
    case 'snack':
      usage = `${product.productName} là lựa chọn tiện lợi để bổ sung năng lượng nhanh chóng giữa các bữa ăn chính, đặc biệt phù hợp cho người bận rộn, trẻ em và người cần tăng cường calorie. Có thể dùng như một phần của bữa ăn nhẹ hoặc giữa các bữa chính.`;
      break;
    default:
      usage = `${product.productName} ${isOrganic ? 'hữu cơ ' : ''}cung cấp các dưỡng chất cần thiết cho cơ thể, hỗ trợ sức khỏe tổng thể và tăng cường sức đề kháng. Sản phẩm được DNC FOOD tuyển chọn kỹ lưỡng để đảm bảo chất lượng và an toàn thực phẩm cho người tiêu dùng.`;
  }
  
  // Bổ sung thông tin về tính organic nếu có
  if (isOrganic) {
    usage += ` Với quy trình sản xuất hữu cơ, sản phẩm không chứa hóa chất độc hại, thuốc trừ sâu, không biến đổi gen, giúp người tiêu dùng an tâm về sức khỏe và thân thiện với môi trường.`;
  }
  
  return usage;
};

/**
 * Sinh cách sử dụng cho sản phẩm
 * @param {Object} product - Sản phẩm cần sinh cách sử dụng
 * @returns {string} - Cách sử dụng sản phẩm
 */
const generateHowToUse = (product) => {
  if (!product) return "Không có thông tin về cách sử dụng sản phẩm này.";
  
  const productName = product.productName?.toLowerCase() || '';
  const category = product.productCategory?.toLowerCase() || '';
  
  // Kiểm tra xem sản phẩm có phải là dâu tây 
  if (productName.includes('dâu tây') || productName.includes('strawberry')) {
    return `${product.productName} nên được rửa sạch dưới vòi nước trước khi ăn. Nên ngâm trong nước muối loãng khoảng 5-10 phút để loại bỏ thuốc trừ sâu và bụi bẩn, sau đó rửa lại với nước sạch. Dâu tây có thể ăn trực tiếp, làm sinh tố, nước ép, thêm vào salad trái cây, làm mứt, làm bánh hoặc các món tráng miệng. Bảo quản trong ngăn mát tủ lạnh (2-5°C) để giữ độ tươi ngon, nên đặt trong hộp kín có lỗ thông khí. Tốt nhất nên sử dụng trong vòng 2-3 ngày sau khi mua.`;
  }
  
  // Từ khóa cho từng loại sản phẩm (tương tự như ở trên)
  const fruitKeywords = ['trái cây', 'quả', 'cherry', 'táo', 'nho', 'cam', 'bưởi', 'chuối', 'dưa', 'dứa', 'xoài', 'ổi', 'lê', 'đào', 'berry'];
  const vegetableKeywords = ['rau', 'củ', 'quả', 'cà rốt', 'bắp cải', 'xà lách', 'cải', 'bông cải', 'hành', 'tỏi', 'khoai', 'cà chua', 'dưa chuột'];
  const milkKeywords = ['sữa', 'yaourt', 'yogurt', 'phô mai', 'cheese', 'sữa chua'];
  const meatKeywords = ['thịt', 'gà', 'heo', 'bò', 'cừu', 'vịt', 'ngỗng', 'thịt hộp', 'đùi', 'cánh', 'ức', 'ba chỉ', 'sườn', 'cốt lết'];
  const seafoodKeywords = ['hải sản', 'cá', 'tôm', 'cua', 'ghẹ', 'mực', 'sò', 'hàu', 'ốc', 'nghêu', 'sushi', 'sashimi'];
  const drinkKeywords = ['nước', 'drink', 'đồ uống', 'nước ngọt', 'soda', 'coca', 'pepsi', 'trà', 'cà phê', 'coffee', 'sinh tố', 'nước ép'];
  const snackKeywords = ['snack', 'bánh', 'kẹo', 'chocolate', 'socola', 'bim bim', 'hạt', 'bery', 'kernel'];
  
  // Xác định loại sản phẩm
  let productType = 'general';
  
  if (fruitKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'fruit';
  } else if (vegetableKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'vegetable';
  } else if (milkKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'milk';
  } else if (meatKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'meat';
  } else if (seafoodKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'seafood';
  } else if (drinkKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'drink';
  } else if (snackKeywords.some(kw => productName.includes(kw) || category.includes(kw))) {
    productType = 'snack';
  }
  
  // Sinh cách sử dụng dựa trên loại sản phẩm
  let howToUse = '';
  
  switch(productType) {
    case 'fruit':
      howToUse = `Để tận dụng tối đa giá trị dinh dưỡng của ${product.productName}, bạn nên rửa sạch dưới vòi nước trước khi ăn. Có thể ăn trực tiếp, ép thành nước, làm sinh tố hoặc thêm vào salad, món tráng miệng. Bảo quản trong ngăn mát tủ lạnh để giữ độ tươi ngon lâu hơn.`;
      break;
    case 'vegetable':
      howToUse = `${product.productName} nên được rửa sạch dưới vòi nước trước khi chế biến. Có thể chế biến bằng nhiều cách như: xào, nấu canh, hấp, luộc hoặc ăn sống (với các loại rau ăn sống). Bảo quản trong ngăn mát tủ lạnh để giữ độ tươi ngon lâu hơn.`;
      break;
    case 'milk':
      howToUse = `${product.productName} có thể dùng trực tiếp, thêm vào ngũ cốc, làm sinh tố, nấu cháo, làm bánh hoặc các món tráng miệng. Bảo quản trong tủ lạnh và sử dụng trước hạn sử dụng. Lắc đều trước khi sử dụng.`;
      break;
    case 'meat':
      howToUse = `${product.productName} nên được chế biến kỹ trước khi sử dụng. Có thể chế biến bằng nhiều cách như: nướng, chiên, xào, hấp, luộc, kho. Bảo quản trong ngăn đông tủ lạnh nếu chưa sử dụng ngay. Rã đông hoàn toàn trước khi chế biến.`;
      break;
    case 'seafood':
      howToUse = `${product.productName} cần được chế biến kỹ trước khi sử dụng. Có thể chế biến bằng nhiều cách như: hấp, luộc, nướng, chiên, xào, kho. Bảo quản trong ngăn đông tủ lạnh nếu chưa sử dụng ngay. Rã đông hoàn toàn trước khi chế biến.`;
      break;
    case 'drink':
      howToUse = `${product.productName} nên được uống lạnh để cảm nhận hương vị tốt nhất. Bảo quản trong tủ lạnh sau khi mở. Lắc đều trước khi sử dụng (nếu có lớp lắng đọng). Nên sử dụng hết trong vòng 24 giờ sau khi mở nắp.`;
      break;
    case 'snack':
      howToUse = `${product.productName} có thể dùng trực tiếp như món ăn nhẹ giữa các bữa chính, khi đi học, đi làm, đi chơi hoặc khi xem phim. Sau khi mở bao bì, nên bảo quản trong hộp kín để giữ độ giòn.`;
      break;
    default:
      howToUse = `${product.productName} nên được sử dụng theo hướng dẫn trên bao bì. Bảo quản ở nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp. Vui lòng kiểm tra hạn sử dụng trước khi sử dụng.`;
  }
  
  return howToUse;
};

/**
 * Sinh thông tin về xuất xứ sản phẩm
 * @param {Object} product - Sản phẩm cần sinh thông tin xuất xứ
 * @returns {string} - Thông tin xuất xứ
 */
const generateOrigin = (product) => {
  if (!product) return "Không có thông tin về xuất xứ của sản phẩm này.";
  
  const productName = product.productName?.toLowerCase() || '';
  
  // Xử lý đặc biệt cho dâu tây
  if (productName.includes('dâu tây') || productName.includes('strawberry')) {
    if (productName.includes('đà lạt')) {
      return `${product.productName} được trồng tại vùng cao nguyên Đà Lạt, Lâm Đồng, nơi có khí hậu ôn đới quanh năm, mát mẻ và lý tưởng cho việc phát triển của loại quả này. Đà Lạt nổi tiếng với các sản phẩm nông nghiệp sạch, an toàn và chất lượng cao.`;
    }
  }
  
  // Nếu sản phẩm có thông tin xuất xứ, trả về thông tin đó
  if (product.origin || product.productOrigin) {
    return `${product.productName} có xuất xứ từ ${product.origin || product.productOrigin}.`;
  }
  
  // Nếu không có thông tin xuất xứ, trả về thông tin mặc định
  return `${product.productName} được cung cấp bởi nhà cung cấp uy tín, được DNC FOOD lựa chọn kỹ lưỡng để đảm bảo chất lượng và an toàn thực phẩm. Vui lòng liên hệ với chúng tôi qua số điện thoại 0326 743 391 để biết thêm chi tiết về xuất xứ sản phẩm.`;
};

/**
 * Sinh thông tin về thành phần sản phẩm
 * @param {Object} product - Sản phẩm cần sinh thông tin thành phần
 * @returns {string} - Thông tin thành phần
 */
const generateIngredients = (product) => {
  if (!product) return "Không có thông tin về thành phần của sản phẩm này.";
  
  const productName = product.productName?.toLowerCase() || '';
  
  // Xử lý đặc biệt cho dâu tây
  if (productName.includes('dâu tây') || productName.includes('strawberry')) {
    return `${product.productName} là sản phẩm tự nhiên 100%, không có thành phần phụ gia. Dâu tây chứa nhiều vitamin C, mangan, folate (vitamin B9) và kali. Ngoài ra còn chứa các chất chống oxy hóa mạnh như anthocyanins, ellagic acid, quercetin và kaempferol.`;
  }
  
  // Nếu sản phẩm có thông tin thành phần, trả về thông tin đó
  if (product.ingredients || product.productIngredients) {
    return `${product.productName} gồm các thành phần: ${product.ingredients || product.productIngredients}.`;
  }
  
  const category = product.productCategory?.toLowerCase() || '';
  
  // Từ khóa cho từng loại sản phẩm
  const fruitKeywords = ['trái cây', 'quả', 'cherry', 'táo', 'nho', 'cam', 'bưởi', 'chuối', 'dưa', 'dứa', 'xoài', 'ổi', 'lê', 'đào', 'berry'];
  const vegetableKeywords = ['rau', 'củ', 'quả', 'cà rốt', 'bắp cải', 'xà lách', 'cải', 'bông cải', 'hành', 'tỏi', 'khoai', 'cà chua', 'dưa chuột'];
  const processingKeywords = ['chế biến', 'đóng hộp', 'đóng gói', 'chế phẩm', 'bột', 'sốt', 'sauce', 'paste', 'nước', 'concentrate'];
  
  // Sản phẩm tươi sống thì không có thành phần phức tạp
  if (fruitKeywords.some(kw => productName.includes(kw) || category.includes(kw)) && 
      !processingKeywords.some(kw => productName.includes(kw))) {
    return `${product.productName} là sản phẩm tự nhiên 100%, không có thành phần phụ gia.`;
  }
  
  if (vegetableKeywords.some(kw => productName.includes(kw) || category.includes(kw)) && 
      !processingKeywords.some(kw => productName.includes(kw))) {
    return `${product.productName} là sản phẩm tự nhiên 100%, không có thành phần phụ gia.`;
  }
  
  // Nếu không có thông tin thành phần và không phải là sản phẩm tươi sống
  return `Vui lòng tham khảo bao bì sản phẩm hoặc liên hệ với chúng tôi qua số điện thoại 0326 743 391 để biết thông tin chi tiết về thành phần của ${product.productName}.`;
};

/**
 * Sinh các câu hỏi thường gặp về sản phẩm
 * @param {Object} product - Sản phẩm cần sinh câu hỏi
 * @returns {Array} - Danh sách câu hỏi và trả lời
 */
const generateProductFAQs = (product) => {
  if (!product) return [];
  
  // Các câu hỏi cơ bản về sản phẩm
  return [
    {
      question: `${product.productName} có công dụng gì?`,
      answer: generateProductUsage(product)
    },
    {
      question: `Làm thế nào để sử dụng ${product.productName}?`,
      answer: generateHowToUse(product)
    },
    {
      question: `${product.productName} có xuất xứ từ đâu?`,
      answer: generateOrigin(product)
    },
    {
      question: `${product.productName} có thành phần gì?`,
      answer: generateIngredients(product)
    },
    {
      question: `${product.productName} có phải là sản phẩm hữu cơ không?`,
      answer: `Để biết ${product.productName} có phải là sản phẩm hữu cơ hay không, bạn có thể kiểm tra nhãn mác hoặc liên hệ với chúng tôi qua số điện thoại 0326 743 391 để được tư vấn chi tiết.`
    },
    {
      question: `${product.productName} có giá bao nhiêu?`,
      answer: `${product.productName} có giá ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.productPrice || 0)}${product.productDiscount ? ` (giảm ${product.productDiscount}%)` : ''}.`
    },
    {
      question: `${product.productName} có bán ở cửa hàng không?`,
      answer: `${product.productName} có bán tại cửa hàng DNC FOOD tại địa chỉ: Trường Đại học Nam Cần Thơ, đường Nguyễn Văn Cừ nối dài, Cần Thơ. Bạn cũng có thể đặt hàng trực tuyến trên website của chúng tôi hoặc gọi đến số điện thoại 0326 743 391 để đặt hàng.`
    }
  ];
};

// Sửa lại exports để phù hợp với Node.js
module.exports = {
  generateProductUsage,
  generateHowToUse,
  generateOrigin,
  generateIngredients,
  generateProductFAQs
}; 