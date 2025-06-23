import { semanticSearch } from "./semanticSearchHandler.js";
import Product from "../../../Model/Products.js";

export const handleProductQuery = async (message, context = {}) => {
  const productId = context?.productId;

  if (message.match(/so sánh|đối chiếu|khác nhau/i)) {
    return {
      type: "product_comparison",
      message:
        "Tính năng so sánh sản phẩm đang được phát triển. Bạn có thể xem thông tin chi tiết của từng sản phẩm để so sánh.",
    };
  }

  if (
    productId &&
    message.match(/giá bao nhiêu|giá tiền|bao nhiêu tiền|mấy|giá|giá cả/i)
  ) {
    try {
      const product = await Product.findById(productId);
      if (product) {
        return {
          type: "product_price",
          message: `${
            product.productName
          } có giá ${product.productPrice.toLocaleString("vi-VN")} đồng.`,
          product,
        };
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm sản phẩm:", error);
      return {
        type: "error",
        message: "Đã xảy ra lỗi khi tìm kiếm sản phẩm. Vui lòng thử lại sau.",
      };
    }
  }

  const queryType = classifyProductQuery(message);
  
  switch (queryType) {
    case "product_search":
      return await searchProducts(message, context);

    case "product_info":
      return {
        type: "product_info",
        message:
          "Để biết thông tin chi tiết về sản phẩm, bạn vui lòng cung cấp tên cụ thể của sản phẩm.",
      };

    case "product_price":
      return {
        type: "product_price",
        message:
          "Để biết giá của sản phẩm, bạn vui lòng cung cấp tên cụ thể của sản phẩm.",
      };

    default:
      return {
        type: "unknown_product_query",
        message:
          "Tôi không hiểu rõ yêu cầu về sản phẩm của bạn. Bạn có thể nói rõ hơn được không?",
      };
  }
};

const classifyProductQuery = (message) => {
  const lowerMessage = message.toLowerCase();
  
  const searchKeywords = [
    "tìm",
    "kiếm",
    "có bán",
    "mua",
    "tìm kiếm",
    "muốn mua",
    "cần mua",
    "đang tìm",
  ];
  const infoKeywords = [
    "thông tin",
    "chi tiết",
    "mô tả",
    "thành phần",
    "xuất xứ",
    "sản xuất",
    "hạn sử dụng",
    "bảo quản",
  ];
  const priceKeywords = [
    "giá",
    "giá cả",
    "giá tiền",
    "giá bao nhiêu",
    "bao nhiêu tiền",
    "mấy tiền",
    "đắt không",
    "rẻ không",
  ];

  const lowSugarFruitPattern =
    /(trái cây|hoa quả|quả).*(ít đường|không đường|đường thấp|tiểu đường|đái tháo đường|ăn kiêng|giảm cân)/i;
  const diabeticPattern =
    /(tiểu đường|đái tháo đường).*(trái cây|hoa quả|quả|ăn được|nên ăn)/i;

  if (
    lowSugarFruitPattern.test(lowerMessage) ||
    diabeticPattern.test(lowerMessage)
  ) {
    return "product_search";
  }

  for (const keyword of searchKeywords) {
    if (lowerMessage.includes(keyword)) {
      return "product_search";
    }
  }

  for (const keyword of priceKeywords) {
      if (lowerMessage.includes(keyword)) {
      return "product_price";
    }
  }

  for (const keyword of infoKeywords) {
    if (lowerMessage.includes(keyword)) {
      return "product_info";
    }
  }

  return "product_search";
};

const searchProducts = async (message, context = {}) => {
  const healthPattern =
    /sức khỏe|bệnh|tiểu đường|huyết áp|tim mạch|béo phì|giảm cân|tăng cân|tăng cơ|ăn chay|mang thai|người già|trẻ em|dị ứng|không dung nạp|tốt cho|có lợi|phòng bệnh|chữa bệnh/i;

  if (
    healthPattern.test(message) &&
    !message.match(/tìm|kiếm|có bán|mua|muốn mua|cần mua/i)
  ) {
    return {
      type: "health_inquiry",
      message:
        "Đây có vẻ là câu hỏi về sức khỏe. Nếu bạn muốn tìm sản phẩm phù hợp, vui lòng nêu rõ loại sản phẩm bạn đang tìm kiếm.",
    };
  }

  try {
    const products = await semanticSearch(message);

    if (context?.userId && products.length > 0) {
      context.productId = products[0]._id;
    }

    if (!products || products.length === 0) {
      return await fallbackSearch(message);
    }

    const topProducts = products.slice(0, 3);
    let response = `Tôi đã tìm thấy ${products.length} sản phẩm phù hợp với yêu cầu của bạn. Dưới đây là một số gợi ý:\n\n`;

    topProducts.forEach((product, index) => {
      response += `${index + 1}. ${
        product.productName
      } - ${product.productPrice.toLocaleString("vi-VN")} đồng\n`;
      if (product.productDescription && product.productDescription.length > 0) {
        response += `   ${product.productDescription[0]}\n`;
      }
      response += "\n";
    });

    response +=
      "Bạn có muốn xem thêm thông tin chi tiết về sản phẩm nào không?";

    return {
      type: "product_search_results",
      message: response,
      products: topProducts,
    };
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    return {
      type: "error",
      message: "Đã xảy ra lỗi khi tìm kiếm sản phẩm. Vui lòng thử lại sau.",
    };
  }
};

const fallbackSearch = async (message) => {
  try {
    console.log("Xử lý câu hỏi:", message);
    const categories = extractCategories(message);
    const priceRange = extractPriceRange(message);
    const keywords = extractKeywords(message);

    console.log("Tìm thấy danh mục:", categories);
    console.log("Từ khóa tìm kiếm:", keywords);

    const filter = {};
    const conditions = [];

    // Tạo câu truy vấn dựa trên danh mục
    if (categories.length > 0) {
      const categoryConditions = categories.map(category => ({
        $or: [
          { productCategory: category },
          { category: category },
          // Tìm kiếm trong tên sản phẩm với từng loại danh mục
          { productName: { $regex: category, $options: "i" } }
        ]
      }));
      
      conditions.push({ $or: categoryConditions });
    }

    // Tạo câu truy vấn dựa trên từ khóa
    if (keywords.length > 0) {
      const keywordConditions = keywords.map(keyword => ({
        $or: [
          { productName: { $regex: keyword, $options: "i" } },
          { productDescription: { $regex: keyword, $options: "i" } }
        ]
      }));
      
      conditions.push({ $or: keywordConditions });
    }

    // Thêm điều kiện về giá (nếu có)
    if (priceRange) {
      const priceCondition = {};
      if (priceRange.min !== undefined) {
        priceCondition.$gte = priceRange.min;
      }
      if (priceRange.max !== undefined) {
        priceCondition.$lte = priceRange.max;
      }
      
      if (Object.keys(priceCondition).length > 0) {
        conditions.push({ productPrice: priceCondition });
      }
    }

    // Tạo bộ lọc cuối cùng
    if (conditions.length > 0) {
      filter.$and = conditions;
    }

    console.log("Query tìm kiếm:", JSON.stringify(filter));

    let products = [];

    if (Object.keys(filter).length > 0) {
      products = await Product.find(filter).limit(10);
      console.log("Tìm thấy", products.length, "sản phẩm phù hợp");
    } else {
      return {
        type: "no_results",
        message:
          "Tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn. Vui lòng thử lại với từ khóa khác.",
      };
    }

    if (products.length === 0) {
      return {
        type: "no_results",
        message:
          "Tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn. Vui lòng thử lại với từ khóa khác.",
      };
    }

    let response = `Tôi đã tìm thấy ${products.length} sản phẩm có thể phù hợp với yêu cầu của bạn:\n\n`;

    products.forEach((product, index) => {
      response += `${index + 1}. ${
        product.productName
      } - ${product.productPrice.toLocaleString("vi-VN")} đồng\n`;
      if (product.productDescription && product.productDescription.length > 0) {
        response += `   ${product.productDescription[0]}\n`;
      }
      response += "\n";
    });

    response +=
      "Bạn có muốn xem thêm thông tin chi tiết về sản phẩm nào không?";

    return {
      type: "product_search_results",
      message: response,
      products,
    };
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    return {
      type: "error",
      message: "Đã xảy ra lỗi khi tìm kiếm sản phẩm. Vui lòng thử lại sau.",
    };
  }
};

const extractCategories = (message) => {
  const lowerMessage = message.toLowerCase();
  const categories = [];

  const categoryMap = {
    "trái cây": "Trái cây",
    "hoa quả": "Trái cây",
    "quả": "Trái cây",
    "rau": "Rau củ quả",
    "củ": "Rau củ quả",
    "rau củ": "Rau củ quả",
    "rau quả": "Rau củ quả",
    "thịt": "Thịt",
    "cá": "Hải sản",
    "hải sản": "Hải sản",
    "đồ uống": "Đồ uống",
    "nước": "Đồ uống",
    "bánh": "Bánh kẹo",
    "kẹo": "Bánh kẹo",
    "bánh kẹo": "Bánh kẹo",
    "gia vị": "Gia vị",
    "đồ khô": "Đồ khô",
    "sữa": "Sữa và các sản phẩm từ sữa",
    "đồ hộp": "Đồ hộp",
    "đồ đông lạnh": "Đồ đông lạnh",
  };

  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (lowerMessage.includes(keyword)) {
      categories.push(category);
    }
  }

  return [...new Set(categories)];
};

const extractPriceRange = (message) => {
  const lowerMessage = message.toLowerCase();

  const underMatch = lowerMessage.match(
    /dưới\s*(\d+)(?:\s*nghìn|\s*ngàn|\s*k|\s*\.\d+)?/i
  );
  if (underMatch) {
    const value = parseFloat(underMatch[1]);
    return { max: value * 1000 };
  }

  const overMatch = lowerMessage.match(
    /trên\s*(\d+)(?:\s*nghìn|\s*ngàn|\s*k|\s*\.\d+)?/i
  );
  if (overMatch) {
    const value = parseFloat(overMatch[1]);
    return { min: value * 1000 };
  }

  const rangeMatch = lowerMessage.match(
    /từ\s*(\d+)(?:\s*nghìn|\s*ngàn|\s*k)?\s*đến\s*(\d+)(?:\s*nghìn|\s*ngàn|\s*k)?/i
  );
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    return {
      min: min * 1000,
      max: max * 1000,
    };
  }

  return null;
};

const extractKeywords = (message) => {
  const lowerMessage = message.toLowerCase();

  const stopWords = [
    "tìm",
    "kiếm",
    "mua",
    "bán",
    "sản phẩm",
    "có",
    "không",
    "và",
    "hoặc",
    "là",
    "của",
    "cho",
    "tôi",
    "bạn",
    "muốn",
    "cần",
    "đang",
  ];

  const words = lowerMessage.split(/\s+/);

  const filteredWords = words.filter((word) => {
    return word.length >= 2 && !stopWords.includes(word);
  });

  return [...new Set(filteredWords)];
};

export default {
  handleProductQuery,
  classifyProductQuery,
  searchProducts,
};
