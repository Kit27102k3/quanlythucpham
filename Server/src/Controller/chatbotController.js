/* eslint-disable no-useless-escape */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import axios from 'axios';
import Product from "../Model/Products.js";
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Định nghĩa các pattern và từ khóa cho các intent
const intents = {
  price: {
    patterns: [
      "giá", "giá cả", "bao nhiêu tiền", "giá bao nhiêu", "chi phí", 
      "giá sản phẩm", "giá của sản phẩm", "giá của", "giá bao nhiêu", 
      "bao nhiêu", "giá thế nào", "giá như thế nào", "giá hiện tại", "phí"
    ],
    response: (product) => `Giá sản phẩm ${product.productName} là ${formatCurrency(product.productPrice)}${product.productDiscount > 0 ? `. Hiện đang giảm giá ${product.productDiscount}%, giá sau giảm còn ${formatCurrency(product.productPromoPrice || product.productPrice * (1 - product.productDiscount/100))}` : ''}`,
  },
  info: {
    patterns: [
      "thông tin", "chi tiết", "mô tả", "thế nào", "thông tin sản phẩm", 
      "thông tin chi tiết", "thông tin về", "thông tin của", "thông tin gì", 
      "cho tôi biết", "kể cho tôi", "nói cho tôi", "giới thiệu", "giới thiệu về",
      "là gì", "nói về", "biết về"
    ],
    response: (product) => {
      let response = `${product.productName}:`;
      
      if (product.productInfo) {
        response += `\n${product.productInfo}`;
      }
      
      if (product.productDetails) {
        response += `\n\nChi tiết: ${product.productDetails}`;
      }
      
      if (product.productOrigin) {
        response += `\n\nXuất xứ: ${product.productOrigin}`;
      }
      
      if (product.productWeight) {
        response += `\n\nKhối lượng: ${product.productWeight}g`;
      }
      
      return response;
    },
  },
  usage: {
    patterns: [
      "công dụng", "tác dụng", "dùng để", "dùng làm gì", "sử dụng", 
      "công dụng gì", "tác dụng gì", "dùng để làm gì", "sử dụng để làm gì", 
      "công dụng của", "tác dụng của", "dùng để làm", "sử dụng để làm", 
      "công dụng như thế nào", "tác dụng như thế nào", "có tác dụng gì",
      "ích lợi", "lợi ích", "tốt gì", "hiệu quả"
    ],
    response: (product) => {
      const usageInfo = product.productInfo || product.productDetails || "Không có thông tin chi tiết về công dụng";
      return `Công dụng của ${product.productName}:\n${usageInfo}`;
    },
  },
  origin: {
    patterns: [
      "xuất xứ", "sản xuất", "nước nào", "ở đâu", "nhà sản xuất", 
      "xuất xứ từ đâu", "sản xuất ở đâu", "sản xuất tại đâu", "sản xuất bởi", 
      "nhà sản xuất nào", "công ty nào", "thương hiệu nào", "thương hiệu", 
      "xuất xứ của", "sản xuất của", "nhà sản xuất của", "nguồn gốc", "đến từ đâu",
      "từ nước nào", "từ đâu"
    ],
    response: (product) => `Sản phẩm ${product.productName} có xuất xứ từ ${product.productOrigin || "chưa có thông tin"}`,
  },
  ingredients: {
    patterns: [
      "thành phần", "nguyên liệu", "chứa gì", "có gì", "thành phần gì", 
      "nguyên liệu gì", "chứa những gì", "có những gì", "thành phần của", 
      "nguyên liệu của", "chứa những thành phần gì", "có những thành phần gì", 
      "thành phần như thế nào", "nguyên liệu như thế nào", "được làm từ",
      "làm từ gì", "thành phần chính", "hỗn hợp", "chứa đựng", "bao gồm"
    ],
    response: (product) => `Thành phần của ${product.productName}:\n${product.ingredients || product.productDetails || "Chưa có thông tin chi tiết về thành phần"}`,
  },
  howToUse: {
    patterns: [
      "cách dùng", "hướng dẫn", "sử dụng như thế nào", "dùng thế nào", "dùng như nào", 
      "cách sử dụng", "hướng dẫn sử dụng", "dùng như thế nào", "sử dụng thế nào", 
      "cách dùng như thế nào", "hướng dẫn dùng", "cách sử dụng như thế nào", 
      "dùng như thế nào", "sử dụng như thế nào", "cách dùng của", "hướng dẫn của",
      "dùng sao", "sử dụng sao", "ăn thế nào", "uống thế nào", "chế biến ra sao",
      "làm sao để", "cách thức", "làm thế nào", "bảo quản", "dùng đúng cách"
    ],
    response: (product) => {
      const usageGuide = product.howToUse || product.productDetails || product.productInfo || "Chưa có thông tin chi tiết về cách sử dụng";
      return `Hướng dẫn sử dụng ${product.productName}:\n${usageGuide}`;
    },
  },
  relatedProducts: {
    patterns: [
      "sản phẩm liên quan", "sản phẩm tương tự", "sản phẩm khác", "các sản phẩm liên quan", 
      "sản phẩm giống", "sản phẩm tương tự", "sản phẩm cùng loại", "sản phẩm cùng danh mục", 
      "sản phẩm khác trong cùng danh mục", "sản phẩm khác trong cùng loại", 
      "sản phẩm khác trong cùng nhóm", "có sản phẩm nào khác", "các nước uống liên quan",
      "nước uống liên quan", "các nước uống tương tự", "nước uống tương tự", 
      "có nước uống nào khác"
    ],
    response: async (product) => {
      try {
        // Sử dụng trường category hoặc productCategory (tùy theo schema)
        const categoryField = product.productCategory ? 'productCategory' : 'category';
        const categoryValue = product.productCategory || product.category;
        
        // Kiểm tra nếu là nước uống, tìm theo từ khóa trong tên
        let query = { _id: { $ne: product._id } };
        
        if (product.productName.toLowerCase().includes('nước') || 
            product.productName.toLowerCase().includes('pepsi') || 
            product.productName.toLowerCase().includes('cocacola') ||
            product.productName.toLowerCase().includes('strongbow')) {
          // Nếu là nước uống, tìm các sản phẩm cùng loại nước uống
          query.$or = [
            { productName: { $regex: 'nước', $options: 'i' } },
            { productName: { $regex: 'pepsi', $options: 'i' } },
            { productName: { $regex: 'coca', $options: 'i' } },
            { productName: { $regex: 'strongbow', $options: 'i' } },
            { productName: { $regex: 'chai', $options: 'i' } },
            { productName: { $regex: 'lon', $options: 'i' } },
            { productName: { $regex: 'lốc', $options: 'i' } }
          ];
        } else if (categoryValue) {
          // Sử dụng category nếu có
          query[categoryField] = categoryValue;
        } else {
          // Nếu không có category, tìm sản phẩm có tên tương tự
          const words = product.productName.split(' ').filter(word => word.length > 3);
          if (words.length > 0) {
            const regexPatterns = words.map(word => new RegExp(word, 'i'));
            query.productName = { $in: regexPatterns };
          }
        }
        
        // Tìm sản phẩm liên quan với query đã xây dựng
        const relatedProducts = await Product.find(query).limit(4);

        if (relatedProducts.length === 0) {
          // Nếu không tìm thấy sản phẩm liên quan, thử tìm bất kỳ sản phẩm nào
          const randomProducts = await Product.find({ _id: { $ne: product._id } }).limit(4);
          
          if (randomProducts.length === 0) {
            return "Hiện tại chưa có sản phẩm liên quan nào.";
          }
          
          // Tạo phản hồi với sản phẩm ngẫu nhiên
          const productElements = randomProducts.map(p => {
            const imageUrl = p.productImages && p.productImages.length > 0 
              ? p.productImages[0] 
              : "default-product.jpg";
              
            return {
              type: "product",
              id: p._id,
              name: p.productName,
              price: p.productPrice,
              image: imageUrl,
              slug: createSlug(p.productName)
            };
          });
          
          return {
            text: `Các sản phẩm khác bạn có thể quan tâm:\n\n`,
            products: productElements,
            type: "relatedProducts"
          };
        }

        // Tạo phản hồi dạng HTML với hình ảnh và link
        let responseHtml = `Các sản phẩm liên quan:\n\n`;
        
        // Thêm thẻ HTML cho các sản phẩm liên quan
        const productElements = relatedProducts.map(p => {
          // Lấy URL hình ảnh đầu tiên từ mảng productImages nếu có
          const imageUrl = p.productImages && p.productImages.length > 0 
            ? p.productImages[0] 
            : "default-product.jpg";
          
          return {
            type: "product",
            id: p._id,
            name: p.productName,
            price: p.productPrice,
            image: imageUrl,
            slug: createSlug(p.productName)
          };
        });
        
        return {
          text: responseHtml,
          products: productElements,
          type: "relatedProducts"
        };
      } catch (error) {
        return "Xin lỗi, tôi không thể tìm thấy sản phẩm liên quan lúc này.";
      }
    }
  },
  mostExpensiveProduct: {
    patterns: [
      "sản phẩm nào đắt nhất", "sản phẩm đắt nhất", "sản phẩm nào đắt nhất trong cửa hàng", 
      "sản phẩm đắt nhất trong cửa hàng", "đắt nhất", "giá cao nhất", "sản phẩm giá cao nhất"
    ],
    response: async () => {
      try {
        const mostExpensiveProduct = await Product.findOne().sort({ productPrice: -1 }).limit(1);
        if (!mostExpensiveProduct) {
          return "Hiện tại chưa có thông tin về sản phẩm đắt nhất.";
        }
        return `Sản phẩm đắt nhất hiện tại là: ${mostExpensiveProduct.productName} với giá ${formatCurrency(mostExpensiveProduct.productPrice)}`;
      } catch (error) {
        return "Xin lỗi, tôi không thể tìm thấy thông tin về sản phẩm đắt nhất lúc này.";
      }
    }
  },
  cheapestProduct: {
    patterns: [
      "sản phẩm nào rẻ nhất", "sản phẩm rẻ nhất", "sản phẩm nào rẻ nhất trong cửa hàng", 
      "sản phẩm rẻ nhất trong cửa hàng", "rẻ nhất", "giá thấp nhất", "sản phẩm giá thấp nhất"
    ],
    response: async () => {
      try {
        const cheapestProduct = await Product.findOne().sort({ productPrice: 1 }).limit(1);
        if (!cheapestProduct) {
          return "Hiện tại chưa có thông tin về sản phẩm rẻ nhất.";
        }
        return `Sản phẩm rẻ nhất hiện tại là: ${cheapestProduct.productName} với giá ${formatCurrency(cheapestProduct.productPrice)}`;
      } catch (error) {
        return "Xin lỗi, tôi không thể tìm thấy thông tin về sản phẩm rẻ nhất lúc này.";
      }
    }
  },
  storeAddress: {
    patterns: [
      "địa chỉ", "cửa hàng ở đâu", "cửa hàng nằm ở đâu", "địa chỉ cửa hàng", 
      "vị trí cửa hàng", "cửa hàng ở chỗ nào", "cửa hàng nằm ở chỗ nào", 
      "tìm cửa hàng", "mua ở đâu", "mua tại đâu", "mua trực tiếp ở đâu"
    ],
    response: () => "Cửa hàng của chúng tôi nằm tại: 273 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh.\n\nGiờ mở cửa: 8h00 - 22h00 các ngày trong tuần."
  },
  orderStatus: {
    patterns: [
      "tình trạng đơn hàng", "trạng thái đơn hàng", "đơn hàng của tôi", 
      "theo dõi đơn hàng", "kiểm tra đơn hàng", "đơn hàng đến đâu rồi", 
      "đơn hàng khi nào đến", "khi nào nhận được hàng"
    ],
    response: () => "Để kiểm tra tình trạng đơn hàng, vui lòng đăng nhập vào tài khoản và truy cập mục 'Đơn hàng của tôi'. Hoặc bạn có thể cung cấp mã đơn hàng để chúng tôi kiểm tra giúp bạn."
  },
  contactInfo: {
    patterns: [
      "liên hệ", "số điện thoại", "email", "hotline", "gọi cho ai", 
      "liên hệ với ai", "thông tin liên hệ", "liên lạc", "liên hệ như thế nào"
    ],
    response: () => "Thông tin liên hệ của chúng tôi:\n- Hotline: 1900 6789\n- Email: support@chuoikoicho.com\n- Địa chỉ: 273 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh"
  },
  greeting: {
    patterns: [
      "xin chào", "hello", "hi", "chào", "chào bạn", "chào bot", "chào chatbot", 
      "xin chào bot", "xin chào chatbot", "chào buổi sáng", "chào buổi tối", 
      "chào buổi chiều", "chào buổi trưa", "chào buổi tối", "chào buổi sáng", 
      "chào buổi chiều", "chào buổi trưa"
    ],
    response: () => "Xin chào! Tôi có thể giúp gì cho bạn?",
  },
  thanks: {
    patterns: [
      "cảm ơn", "thank", "thanks", "cám ơn", "cảm ơn bạn", "cảm ơn bot", 
      "cảm ơn chatbot", "cảm ơn nhiều", "cảm ơn rất nhiều", "cảm ơn vì đã giúp", 
      "cảm ơn vì đã trả lời", "cảm ơn vì đã hỗ trợ", "cảm ơn vì đã tư vấn", 
      "cảm ơn vì đã giải đáp", "cảm ơn vì đã hướng dẫn"
    ],
    response: () => "Rất vui được giúp đỡ bạn! Bạn cần hỗ trợ gì thêm không?",
  },
  bye: {
    patterns: [
      "tạm biệt", "bye", "goodbye", "chào tạm biệt", "hẹn gặp lại", 
      "gặp lại sau", "tôi đi đây", "tôi phải đi"
    ],
    response: () => "Chào tạm biệt! Cảm ơn bạn đã trò chuyện. Hẹn gặp lại bạn sau!",
  },
  buyingMethods: {
    patterns: [
      "mua sản phẩm như nào", "mua sản phẩm thế nào", "mua như thế nào", "làm thế nào để mua", 
      "làm sao để mua", "cách mua", "cách đặt hàng", "đặt hàng như thế nào", 
      "cách thức mua", "có thể mua ở đâu", "mua online được không", "đặt hàng", 
      "đặt hàng làm sao", "muốn đặt hàng", "muốn mua", "tôi muốn đặt", "tôi muốn mua",
      "mua hàng", "đặt mua", "order", "đặt online", "mua online", "mua ở đâu",
      "đặt như thế nào", "làm sao để đặt", "làm thế nào để đặt", "tôi muốn mua hàng",
      "tôi muốn đặt hàng", "cách đặt", "cách order", "thủ tục mua", "thủ tục đặt",
      "mua ở trang này như thế nào", "đặt hàng trên trang này", "quy trình đặt hàng"
    ],
    response: () => "Để mua sản phẩm, bạn có thể:\n1. Đặt hàng trực tiếp trên website này bằng cách thêm vào giỏ hàng\n2. Mua tại cửa hàng: 273 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh\n3. Đặt hàng qua hotline: 1900 6789\n\nSau khi đặt hàng, bạn sẽ nhận được xác nhận qua email và có thể theo dõi trạng thái đơn hàng trong tài khoản của mình."
  },
  paymentMethods: {
    patterns: [
      "thanh toán", "cách thanh toán", "phương thức thanh toán", "hình thức thanh toán",
      "trả tiền", "làm sao để thanh toán", "trả tiền bằng gì", "trả tiền như thế nào",
      "có mấy hình thức thanh toán", "có những hình thức thanh toán nào", 
      "thanh toán qua đâu", "có thanh toán online không", "hỗ trợ thanh toán gì",
      "có thể thanh toán bằng", "có trả góp", "trả góp", "thanh toán qua thẻ",
      "thanh toán bằng tiền mặt", "thanh toán qua ví điện tử", "thanh toán qua ngân hàng",
      "thanh toán khi nhận hàng", "ship cod", "cod", "atm", "credit", "debit",
      "banking", "chuyển khoản", "internet banking", "mobile banking"
    ],
    response: () => "Chúng tôi hỗ trợ 2 phương thức thanh toán sau:\n1. Thanh toán khi nhận hàng (COD)\n2. Thanh toán qua SePay\n\nBạn có thể chọn phương thức thanh toán phù hợp khi tiến hành đặt hàng."
  },
  foodSafety: {
    patterns: [
      "thực phẩm sạch", "đảm bảo an toàn", "an toàn thực phẩm", "thực phẩm có an toàn không", 
      "nguồn gốc thực phẩm", "chứng nhận an toàn", "kiểm định", "tiêu chuẩn an toàn",
      "thực phẩm có sạch không", "đảm bảo vệ sinh", "thực phẩm organic", "hữu cơ", 
      "không hóa chất", "không thuốc trừ sâu", "không chất bảo quản", "độ tin cậy",
      "thực phẩm có nguồn gốc rõ ràng không", "rau sạch", "thịt sạch", "trái cây sạch",
      "rau an toàn", "thịt an toàn", "trái cây an toàn", "chất lượng thực phẩm"
    ],
    response: () => "Thực phẩm tại siêu thị chúng tôi đều được đảm bảo an toàn với tiêu chuẩn VietGAP và GlobalGAP. Tất cả sản phẩm đều có nguồn gốc xuất xứ rõ ràng, được kiểm định nghiêm ngặt về chất lượng và an toàn vệ sinh thực phẩm trước khi đưa đến tay người tiêu dùng. Mỗi sản phẩm đều có mã QR để khách hàng có thể truy xuất nguồn gốc và thông tin sản phẩm một cách minh bạch."
  },
  organicFood: {
    patterns: [
      "thực phẩm hữu cơ", "organic", "thực phẩm organic", "rau hữu cơ", "trái cây hữu cơ", 
      "rau organic", "thịt hữu cơ", "trứng hữu cơ", "sản phẩm organic", "hữu cơ là gì", 
      "organic là gì", "lợi ích của thực phẩm hữu cơ", "giá thực phẩm hữu cơ", 
      "chứng nhận hữu cơ", "organic có tốt không", "có bán thực phẩm hữu cơ không",
      "có bán đồ organic không", "mua thực phẩm hữu cơ ở đâu"
    ],
    response: () => "Siêu thị chúng tôi cung cấp đa dạng các sản phẩm hữu cơ (organic) được chứng nhận, bao gồm rau củ, trái cây, thịt, trứng và các sản phẩm chế biến. Thực phẩm hữu cơ được canh tác và chăn nuôi không sử dụng hóa chất, thuốc trừ sâu, hormone tăng trưởng hay kháng sinh, đảm bảo an toàn cho sức khỏe và thân thiện với môi trường. Mặc dù giá thành cao hơn thực phẩm thông thường, nhưng chúng mang lại giá trị dinh dưỡng và độ an toàn cao hơn."
  },
  deliveryInfo: {
    patterns: [
      "giao hàng", "phí giao hàng", "thời gian giao hàng", "ship", "freeship", "miễn phí giao hàng", 
      "giao hàng mất bao lâu", "giao hàng bao nhiêu tiền", "phí vận chuyển", "cước vận chuyển", 
      "giao hàng đến đâu", "khu vực giao hàng", "có giao hàng không", "có ship không", 
      "giao hàng tận nhà", "giao hàng nhanh", "giao hàng trong ngày", "ship cod", 
      "vận chuyển", "đơn vị vận chuyển", "dịch vụ giao hàng", "hình thức giao hàng"
    ],
    response: () => "Chúng tôi cung cấp dịch vụ giao hàng tận nhà trên toàn quốc với các chính sách sau:\n\n- Nội thành TP.HCM: Giao hàng trong 2-4 giờ, miễn phí giao hàng cho đơn từ 300.000đ\n- Các tỉnh thành khác: Giao hàng trong 1-3 ngày tùy khu vực, miễn phí giao hàng cho đơn từ 500.000đ\n- Phí giao hàng tiêu chuẩn: 20.000đ - 40.000đ tùy khu vực\n- Đơn hàng trên 1.000.000đ: Miễn phí giao hàng toàn quốc\n\nĐặc biệt, chúng tôi có dịch vụ giao hàng nhanh trong 2 giờ cho khu vực nội thành TP.HCM với các sản phẩm tươi sống."
  },
  returnPolicy: {
    patterns: [
      "đổi trả", "chính sách đổi trả", "trả hàng", "đổi hàng", "hoàn tiền", "chính sách hoàn tiền", 
      "có được đổi trả không", "làm sao để đổi trả", "thời gian đổi trả", "điều kiện đổi trả", 
      "quy định đổi trả", "quy định hoàn tiền", "đổi sản phẩm", "trả sản phẩm",
      "đổi trả như thế nào", "có được trả hàng không", "đổi trả miễn phí", "bảo hành", 
      "hàng lỗi", "hàng hỏng", "hàng không đúng"
    ],
    response: () => "Chính sách đổi trả của siêu thị thực phẩm sạch chúng tôi:\n\n- Thời hạn đổi trả: Trong vòng 24 giờ kể từ khi nhận hàng\n- Điều kiện đổi trả:\n  + Sản phẩm còn nguyên bao bì, tem nhãn\n  + Có hóa đơn mua hàng\n  + Sản phẩm bị lỗi, hỏng, không đúng mô tả, không đảm bảo chất lượng\n  + Đối với thực phẩm tươi sống: đổi trả ngay khi giao hàng nếu phát hiện không đạt chất lượng\n\n- Hình thức đổi trả:\n  + Đổi sản phẩm mới cùng loại\n  + Hoàn tiền 100% nếu không có sản phẩm thay thế\n\nVui lòng liên hệ hotline 1900 6789 để được hướng dẫn quy trình đổi trả."
  },
  membershipProgram: {
    patterns: [
      "thành viên", "chương trình thành viên", "khách hàng thân thiết", "hội viên", "tích điểm", 
      "thẻ thành viên", "đăng ký thành viên", "ưu đãi thành viên", "quyền lợi thành viên", 
      "điểm thưởng", "điểm thành viên", "quà tặng thành viên", "hạng thành viên", 
      "đặc quyền thành viên", "đăng ký tài khoản", "tạo tài khoản", "đăng ký hội viên"
    ],
    response: () => "Chương trình thành viên tại siêu thị thực phẩm sạch của chúng tôi mang lại nhiều đặc quyền:\n\n- Tích lũy điểm: 1.000đ = 1 điểm\n- Quy đổi điểm: 10 điểm = 10.000đ khi mua hàng\n- Các hạng thành viên và ưu đãi:\n  + Thành viên Bạc (chi tiêu 2-5 triệu/năm): Giảm 3% mọi đơn hàng\n  + Thành viên Vàng (chi tiêu 5-10 triệu/năm): Giảm 5% mọi đơn hàng, ưu tiên giao hàng\n  + Thành viên Kim Cương (chi tiêu trên 10 triệu/năm): Giảm 7% mọi đơn hàng, miễn phí giao hàng, quà tặng sinh nhật\n\nĐăng ký miễn phí tại quầy thu ngân hoặc trên website của chúng tôi."
  },
  freshFood: {
    patterns: [
      "thực phẩm tươi", "rau tươi", "thịt tươi", "cá tươi", "hải sản tươi", "trái cây tươi", 
      "đồ tươi sống", "thực phẩm tươi sống", "bảo quản thực phẩm tươi", "độ tươi", 
      "thực phẩm tươi ngon", "thực phẩm tươi mới", "rau củ tươi", "sản phẩm tươi",
      "có bán đồ tươi sống không", "nguồn gốc thực phẩm tươi", "đảm bảo độ tươi"
    ],
    response: () => "Siêu thị chúng tôi cung cấp đa dạng thực phẩm tươi sống chất lượng cao:\n\n- Rau củ: Thu hoạch trong ngày từ các trang trại đối tác, đảm bảo độ tươi ngon và giàu dinh dưỡng\n- Thịt tươi: Thịt heo, bò, gà được kiểm dịch nghiêm ngặt, bảo quản trong điều kiện lý tưởng\n- Hải sản: Nhập trực tiếp từ các vùng biển sạch, đánh bắt trong ngày\n- Trái cây: Đa dạng trái cây trong nước và nhập khẩu, đảm bảo tươi ngon\n\nTất cả sản phẩm tươi sống được bảo quản ở nhiệt độ thích hợp và được kiểm tra chất lượng hàng ngày để đảm bảo độ tươi tối đa khi đến tay khách hàng."
  },
  importedFood: {
    patterns: [
      "thực phẩm nhập khẩu", "sản phẩm nhập khẩu", "hàng nhập khẩu", "đồ nhập ngoại", 
      "hàng ngoại", "thực phẩm ngoại", "trái cây nhập khẩu", "thực phẩm từ nước ngoài", 
      "thực phẩm quốc tế", "sản phẩm quốc tế", "đồ ngoại nhập", "sản phẩm ngoại nhập",
      "từ nước nào", "nhập từ đâu", "nguồn gốc nhập khẩu"
    ],
    response: () => "Siêu thị thực phẩm sạch của chúng tôi cung cấp nhiều loại thực phẩm nhập khẩu chất lượng cao:\n\n- Trái cây: Táo Mỹ, Lê Hàn Quốc, Cherry Úc, Kiwi New Zealand...\n- Thịt: Bò Úc, Bò Mỹ, Cừu New Zealand...\n- Hải sản: Cá hồi Na Uy, Tôm Canada...\n- Các sản phẩm khác: Sữa Úc, Phô mai Pháp, Rượu vang Ý...\n\nTất cả sản phẩm nhập khẩu đều có giấy chứng nhận xuất xứ rõ ràng, đảm bảo nguồn gốc và được nhập khẩu theo đúng quy định về an toàn thực phẩm của Việt Nam."
  },
  vegetarianFood: {
    patterns: [
      "thực phẩm chay", "đồ chay", "món chay", "ăn chay", "thực phẩm thuần chay", "vegan", 
      "sản phẩm chay", "đồ ăn chay", "rau củ chay", "thực phẩm không thịt", "thuần chay", 
      "không động vật", "chế độ ăn chay", "có bán đồ chay không"
    ],
    response: () => "Siêu thị chúng tôi có khu vực riêng dành cho thực phẩm chay và thuần chay (vegan) với đa dạng sản phẩm:\n\n- Rau củ quả hữu cơ đa dạng\n- Các sản phẩm thay thế thịt: đậu hũ, tempeh, seitan...\n- Sữa thực vật: sữa hạnh nhân, sữa đậu nành, sữa yến mạch...\n- Các loại hạt và ngũ cốc\n- Thực phẩm chay đông lạnh: chả chay, há cảo chay...\n- Gia vị và sốt chay\n\nTất cả sản phẩm chay đều được dán nhãn rõ ràng và được bố trí riêng biệt để dễ dàng tìm kiếm."
  },
  storeLocation: {
    patterns: [
      "chi nhánh", "cửa hàng", "địa điểm", "vị trí", "cơ sở", "bao nhiêu chi nhánh", 
      "có mấy cửa hàng", "danh sách cửa hàng", "hệ thống cửa hàng", "siêu thị ở đâu", 
      "địa chỉ các chi nhánh", "tìm chi nhánh", "tìm cửa hàng gần nhất",
      "chi nhánh gần nhất", "cửa hàng gần đây", "cửa hàng ở đâu", "cửa hàng gần nhà"
    ],
    response: () => "Hệ thống siêu thị thực phẩm sạch của chúng tôi hiện có các chi nhánh sau:\n\n1. Chi nhánh Quận 1: 273 An Dương Vương, Phường 3, Quận 5, TP. HCM\n2. Chi nhánh Quận 2: 18 Trần Não, Phường Bình An, Quận 2, TP. HCM\n3. Chi nhánh Quận 7: 1060 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. HCM\n4. Chi nhánh Quận 9: 54 Lê Văn Việt, Phường Hiệp Phú, Quận 9, TP. HCM\n5. Chi nhánh Hà Nội: 85 Láng Hạ, Quận Đống Đa, Hà Nội\n\nGiờ mở cửa: 8h00 - 22h00 các ngày trong tuần.\n\nBạn có thể sử dụng tính năng 'Tìm cửa hàng gần nhất' trên website hoặc ứng dụng của chúng tôi để tìm chi nhánh gần bạn nhất."
  },
  promotions: {
    patterns: [
      "khuyến mãi", "ưu đãi", "giảm giá", "quà tặng", "chương trình khuyến mãi", 
      "chương trình ưu đãi", "khuyến mại", "mã giảm giá", "voucher", "coupon", 
      "sale", "đang giảm giá", "đang khuyến mãi", "ưu đãi đặc biệt", "có khuyến mãi gì",
      "có giảm giá không", "khuyến mãi hôm nay"
    ],
    response: () => "Các chương trình khuyến mãi hiện tại tại siêu thị thực phẩm sạch của chúng tôi:\n\n- SALE CUỐI TUẦN: Giảm 10-20% cho rau củ quả tươi vào thứ 7 và Chủ nhật\n- MUA 2 TẶNG 1: Áp dụng cho các sản phẩm đóng gói\n- GIẢM 15% CHO ĐƠN HÀNG ĐẦU TIÊN: Khi đăng ký thành viên mới\n- FREESHIP: Miễn phí giao hàng cho đơn từ 300.000đ (nội thành) và 500.000đ (toàn quốc)\n- HAPPY HOUR: Giảm 15% từ 19h-21h hàng ngày cho thực phẩm tươi sống\n\nĐể cập nhật các chương trình khuyến mãi mới nhất, vui lòng theo dõi website, fanpage hoặc đăng ký nhận thông báo qua email của chúng tôi."
  },
  mobileApp: {
    patterns: [
      "ứng dụng", "app", "mobile app", "tải app", "download app", "cài đặt app", 
      "ứng dụng di động", "phần mềm", "app trên điện thoại", "ứng dụng trên điện thoại", 
      "có app không", "có ứng dụng không", "app ios", "app android", "tính năng app"
    ],
    response: () => "Ứng dụng di động của siêu thị thực phẩm sạch chúng tôi có nhiều tính năng tiện lợi:\n\n- Đặt hàng trực tuyến nhanh chóng\n- Theo dõi tình trạng đơn hàng\n- Quét mã QR để xem thông tin sản phẩm\n- Tích lũy và sử dụng điểm thành viên\n- Nhận thông báo về khuyến mãi, sản phẩm mới\n- Tra cứu thông tin dinh dưỡng và công thức nấu ăn\n- Thanh toán đa dạng\n\nỨng dụng khả dụng trên cả iOS và Android. Bạn có thể tải về miễn phí tại:\n- App Store: tìm 'Thực Phẩm Sạch Online'\n- Google Play: tìm 'Thực Phẩm Sạch Online'"
  },
  nutritionAdvice: {
    patterns: [
      "dinh dưỡng", "tư vấn dinh dưỡng", "chế độ ăn", "thực đơn", "ăn uống lành mạnh", 
      "thực phẩm tốt cho sức khỏe", "ăn gì tốt", "thực phẩm dinh dưỡng", "dinh dưỡng hợp lý", 
      "thực phẩm tốt cho", "ăn gì để", "thực phẩm giàu", "chế độ dinh dưỡng", 
      "tư vấn ăn uống", "cân bằng dinh dưỡng", "thực phẩm bổ dưỡng"
    ],
    response: () => "Siêu thị thực phẩm sạch chúng tôi cung cấp dịch vụ tư vấn dinh dưỡng miễn phí với các chuyên gia dinh dưỡng có chứng chỉ. Một số lời khuyên dinh dưỡng cơ bản:\n\n- Ưu tiên thực phẩm tươi sống, ít qua chế biến\n- Đa dạng hóa chế độ ăn với đủ 4 nhóm: tinh bột, protein, rau củ và trái cây\n- Ưu tiên protein nạc từ cá, thịt gia cầm, đậu và các loại hạt\n- Tăng cường rau xanh và trái cây theo mùa\n- Hạn chế thực phẩm chứa nhiều đường, muối và chất béo bão hòa\n\nBạn có thể đặt lịch tư vấn dinh dưỡng cá nhân tại cửa hàng hoặc trực tuyến qua website của chúng tôi."
  },
  discountedProducts: {
    patterns: [
      "sản phẩm giảm giá", "sản phẩm đang giảm giá", "giảm giá", 
      "sản phẩm nào đang giảm giá", "sản phẩm khuyến mãi", "khuyến mãi",
      "đang giảm giá", "đang khuyến mãi", "tìm sản phẩm giảm giá",
      "có sản phẩm nào đang giảm giá không", "có sản phẩm nào đang khuyến mãi không"
    ],
    response: async () => {
      try {
        // Tìm các sản phẩm có khuyến mãi (productDiscount > 0)
        const discountedProducts = await Product.find({ 
          productDiscount: { $gt: 0 },
          productStatus: { $ne: "Hết hàng" }
        }).sort({ productDiscount: -1 }).limit(6);
        
        if (!discountedProducts || discountedProducts.length === 0) {
          return "Hiện tại cửa hàng không có sản phẩm nào đang giảm giá.";
        }
        
        // Tạo danh sách sản phẩm để hiển thị
        const productElements = discountedProducts.map(product => {
          return {
            id: product._id,
            name: product.productName,
            price: product.productPrice,
            promotionalPrice: product.productPromoPrice || product.productPrice * (1 - product.productDiscount/100),
            discount: product.productDiscount,
            image: product.productImages && product.productImages.length > 0 
              ? product.productImages[0] 
              : "default-product.jpg",
            slug: createSlug(product.productName)
          };
        });
        
        return {
          type: "discountedProducts",
          text: "Đây là các sản phẩm đang giảm giá tại cửa hàng:",
          products: productElements
        };
      } catch (error) {
        console.error("Lỗi khi tìm sản phẩm giảm giá:", error);
        return "Xin lỗi, tôi không thể tìm thấy thông tin về sản phẩm đang giảm giá lúc này.";
      }
    }
  },
  userInfo: {
    patterns: [
      "tên của tôi là gì", "tên tôi", "thông tin của tôi", "thông tin tài khoản của tôi",
      "tôi là ai", "thông tin cá nhân của tôi", "tài khoản của tôi", "hồ sơ của tôi",
      "cho tôi biết tên của tôi", "nói tên tôi", "tên người dùng của tôi"
    ],
    response: (userId) => {
      if (!userId) {
        return "Bạn chưa đăng nhập. Vui lòng đăng nhập để xem thông tin cá nhân.";
      }
      
      return "Để xem thông tin cá nhân của bạn, vui lòng truy cập vào trang Tài khoản.";
    }
  },
  priceRange: {
    patterns: [
      "sản phẩm dưới", "sản phẩm từ", "giá từ", "giá dưới", 
      "dưới 100", "dưới 100k", "dưới 100.000", "dưới 100 nghìn",
      "dưới 200", "dưới 200k", "dưới 200.000", "dưới 200 nghìn",
      "dưới 50", "dưới 50k", "dưới 50.000", "dưới 50 nghìn",
      "dưới 20", "dưới 20k", "dưới 20.000", "dưới 20 nghìn",
      "từ 100 đến 200", "từ 100k đến 200k", "từ 100.000 đến 200.000",
      "từ 50 đến 100", "từ 50k đến 100k", "từ 50.000 đến 100.000",
      "từ 200 đến 500", "từ 200k đến 500k", "từ 200.000 đến 500.000",
      "tìm sản phẩm theo giá", "tìm theo giá", "tìm sản phẩm giá", "tìm hàng giá",
      "sản phẩm giá rẻ", "sản phẩm rẻ", "giá tốt", "hàng giá tốt"
    ],
    response: async (message) => {
      try {
        // Phân tích nội dung tin nhắn để xác định khoảng giá
        const priceRanges = extractPriceRanges(message);
        if (!priceRanges) {
          return "Vui lòng chỉ rõ khoảng giá bạn muốn tìm kiếm, ví dụ: dưới 100k, từ 100k đến 200k, v.v.";
        }

        const { minPrice, maxPrice } = priceRanges;
        
        // Tạo query để tìm sản phẩm trong khoảng giá
        let query = {};
        
        if (minPrice !== null && maxPrice !== null) {
          // Khoảng giá từ min đến max
          query = {
            $and: [
              { productPrice: { $gte: minPrice } },
              { productPrice: { $lte: maxPrice } }
            ]
          };
        } else if (minPrice !== null) {
          // Chỉ có giá tối thiểu
          query = { productPrice: { $gte: minPrice } };
        } else if (maxPrice !== null) {
          // Chỉ có giá tối đa
          query = { productPrice: { $lte: maxPrice } };
        } else {
          // Mặc định tìm sản phẩm có giá dưới 100k nếu không xác định được khoảng giá
          query = { productPrice: { $lte: 100000 } };
        }
        
        // Tìm sản phẩm trong khoảng giá
        const products = await Product.find(query).limit(6);
        
        if (products.length === 0) {
          return `Không tìm thấy sản phẩm nào ${minPrice !== null && maxPrice !== null ? `trong khoảng giá từ ${formatCurrency(minPrice)} đến ${formatCurrency(maxPrice)}` : 
                                              maxPrice !== null ? `có giá dưới ${formatCurrency(maxPrice)}` : 
                                              minPrice !== null ? `có giá từ ${formatCurrency(minPrice)}` : 
                                              "trong khoảng giá bạn yêu cầu"}.`;
        }
        
        // Tạo phản hồi với danh sách sản phẩm
        const productElements = products.map(p => {
          const imageUrl = p.productImages && p.productImages.length > 0 
            ? p.productImages[0] 
            : "default-product.jpg";
          
          // Tạo slug từ tên sản phẩm
          const slug = createSlug(p.productName);
          
          return {
            type: "product",
            id: p._id,
            name: p.productName,
            price: p.productPrice,
            promotionalPrice: p.productDiscount > 0 ? p.productPrice * (1 - p.productDiscount/100) : null,
            discount: p.productDiscount > 0 ? p.productDiscount : null,
            image: imageUrl,
            slug: slug
          };
        });
        
        // Trả về dữ liệu sản phẩm dạng đặc biệt cho frontend
        return {
          text: `Tôi đã tìm thấy ${products.length} sản phẩm ${minPrice !== null && maxPrice !== null ? `trong khoảng giá từ ${formatCurrency(minPrice)} đến ${formatCurrency(maxPrice)}` : 
                                    maxPrice !== null ? `có giá dưới ${formatCurrency(maxPrice)}` : 
                                    minPrice !== null ? `có giá từ ${formatCurrency(minPrice)}` : 
                                    "phù hợp với yêu cầu của bạn"}:`,
          products: productElements,
          type: "priceRangeProducts"
        };
      } catch (error) {
        console.error("Lỗi khi tìm sản phẩm theo khoảng giá:", error);
        return "Xin lỗi, đã xảy ra lỗi khi tìm kiếm sản phẩm theo khoảng giá.";
      }
    }
  },
  categorySearch: {
    patterns: [
      "tìm rau", "các loại rau", "hiển thị rau", "rau gì", "rau nào", 
      "tìm trái cây", "các loại trái cây", "hiển thị trái cây", "trái cây gì", "trái cây nào",
      "tìm thịt", "các loại thịt", "hiển thị thịt", "thịt gì", "thịt nào",
      "tìm theo danh mục", "hiển thị danh mục", "sản phẩm của danh mục"
    ],
    response: async (categoryName) => {
      try {
        // Tìm sản phẩm thuộc danh mục được chỉ định
        const products = await Product.find({
          productCategory: { $regex: categoryName, $options: 'i' }
        }).limit(5);
        
        if (products.length > 0) {
          let response = `Chúng tôi có các sản phẩm ${categoryName} sau:\n`;
          products.forEach((product, index) => {
            response += `${index + 1}. ${product.productName} - ${formatCurrency(product.productPrice)}\n`;
          });
          response += 'Bạn có thể hỏi thêm thông tin cụ thể về sản phẩm bạn quan tâm.';
          
          return {
            text: response,
            products: products.map(p => ({
              _id: p._id,
              productName: p.productName,
              productPrice: p.productPrice
            }))
          };
        } else {
          return `Hiện tại chúng tôi không có sản phẩm ${categoryName} nào. Bạn có thể xem các sản phẩm khác như trái cây, rau củ, thịt hoặc đồ uống.`;
        }
      } catch (error) {
        console.error(`Lỗi khi tìm kiếm danh mục ${categoryName}:`, error);
        return `Xin lỗi, đã xảy ra lỗi khi tìm kiếm sản phẩm ${categoryName}. Vui lòng thử lại sau.`;
      }
    },
  },
};

// Cấu hình Rasa
const RASA_URL = process.env.RASA_URL || 'http://localhost:5005';

// Hàm format tiền tệ
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

// Cải thiện hàm tính toán độ tương đồng để chính xác hơn
function calculateSimilarity(message, pattern) {
  const normalizedMessage = message.toLowerCase().trim();
  const normalizedPattern = pattern.toLowerCase().trim();
  
  // Kiểm tra chính xác - nếu message chứa pattern chính xác
  if (normalizedMessage.includes(normalizedPattern)) {
    // Kiểm tra xem pattern là một phần của từ hay là một từ riêng biệt
    const messageWords = normalizedMessage.split(/\s+/);
    const patternWords = normalizedPattern.split(/\s+/);

    // Nếu pattern là nhiều từ và được tìm thấy chính xác trong tin nhắn
    if (patternWords.length > 1) {
      // Nếu pattern dài (>=3 từ) và khớp chính xác - độ tin cậy rất cao
      if (patternWords.length >= 3) {
        return 1.5;
      }
      // Pattern trung bình (2 từ) - khớp chính xác
      return 1.2;
    } 
    
    // Kiểm tra xem từ đơn lẻ có là một từ riêng biệt không
    let isStandaloneWord = false;
    for (const word of messageWords) {
      if (word === normalizedPattern) {
        isStandaloneWord = true;
        break;
      }
    }
    
    if (isStandaloneWord) {
      // Từ đơn lẻ cần kiểm tra thêm ngữ cảnh
      // Kiểm tra xem nó có phải là một từ chung quá phổ biến không
      const commonWords = ["thông tin", "giá", "mua", "cách"];
      if (commonWords.includes(normalizedPattern)) {
        // Với từ phổ biến, kiểm tra thêm ngữ cảnh
        // Tìm các từ có ý nghĩa xung quanh từ khóa
        let contextScore = 0;
        
        // Kiểm tra xem tin nhắn có phải chỉ là từ khóa đơn lẻ không
        if (messageWords.length <= 2) {
          return 0.8; // Chỉ có từ khóa đơn lẻ, điểm cao nhưng không quá cao
        }
        
        // Kiểm tra thêm các từ khóa liên quan đến chủ đề cụ thể
        const relatedTopics = {
          "thông tin": ["thực phẩm", "sạch", "hữu cơ", "organic", "xuất xứ", "sản phẩm", "rau", "thịt", "cá", "trái cây", "tươi"],
          "giá": ["sản phẩm", "bao nhiêu", "tiền", "đắt", "rẻ", "chi phí"],
          "mua": ["sản phẩm", "hàng", "đặt", "order", "thủ tục", "online"],
          "cách": ["sử dụng", "bảo quản", "chế biến", "nấu", "dùng"]
        };
        
        // Nếu có từ khóa liên quan đến chủ đề cụ thể
        if (relatedTopics[normalizedPattern]) {
          for (const word of messageWords) {
            if (relatedTopics[normalizedPattern].includes(word)) {
              contextScore += 0.2; // Cộng điểm cho mỗi từ liên quan
            }
          }
        }
        
        // Nếu tìm thấy ngữ cảnh rõ ràng
        if (contextScore > 0) {
          return Math.min(1.0, 0.7 + contextScore); // Tối đa là 1.0
        }
        
        return 0.7; // Mặc định cho từ phổ biến
      }
      
      return 1.0; // Từ không phổ biến, khớp hoàn toàn
    }
    
    // Pattern là một phần của từ khác, cho điểm thấp hơn
    return 0.6;
  }
  
  // Kiểm tra từng từ trong pattern
  const patternWords = normalizedPattern.split(/\s+/);
  let matchingWords = 0;
  let totalWeight = 0;
  let matchedWeight = 0;
  
  for (const word of patternWords) {
    if (word.length < 2) continue; // Bỏ qua các từ quá ngắn
    
    // Từ dài quan trọng hơn
    const wordWeight = Math.min(1.0, 0.5 + (word.length / 10));
    totalWeight += wordWeight;
    
    if (normalizedMessage.includes(word)) {
      matchingWords++;
      matchedWeight += wordWeight;
    }
  }
  
  // Nếu không có từ nào có thể so sánh, trả về 0
  if (totalWeight === 0) return 0;
  
  // Tính similarity dựa trên trọng số của các từ khớp
  const similarity = matchedWeight / totalWeight;
  
  // Bonus cho số lượng từ khớp nhiều (thúc đẩy khớp nhiều từ)
  if (patternWords.length > 2 && matchingWords >= 2) {
    return similarity * (1 + (matchingWords / patternWords.length) * 0.5);
  }
  
  return similarity;
}

// Thêm mảng quy định các trường hợp ưu tiên intent khi có xung đột
const priorityRules = [
  // Nếu tin nhắn chứa "sản phẩm giảm giá", ưu tiên intent discountedProducts hơn price
  { 
    patterns: ["sản phẩm giảm giá", "sản phẩm đang giảm giá", "tìm sản phẩm giảm giá"], 
    priorityIntent: "discountedProducts" 
  },
  // Nếu tin nhắn chứa "sản phẩm dưới" hoặc "tìm sản phẩm giá", ưu tiên intent priceRange hơn price
  { 
    patterns: ["sản phẩm dưới", "tìm sản phẩm giá", "tìm sản phẩm theo giá", "tìm hàng giá"],
    priorityIntent: "priceRange" 
  },
  // Nếu tin nhắn chứa các từ khóa liên quan đến tìm kiếm theo danh mục, ưu tiên intent categorySearch
  {
    patterns: ["tìm rau", "các loại rau", "hiển thị rau", "rau gì", "rau nào"],
    priorityIntent: "categorySearch"
  }
];

// Sửa hàm detectIntent để áp dụng quy tắc ưu tiên và trả về score thay vì similarity
function detectIntent(message) {
  let bestMatch = { intent: null, score: 0, pattern: null };
  const matches = [];

  // Ghi lại tất cả các match tiềm năng
  for (const intent in intents) {
    if (intents[intent].patterns) {
      for (const pattern of intents[intent].patterns) {
        const similarity = calculateSimilarity(message, pattern);
        if (similarity >= 0.5) {
          console.log(`Potential match: ${intent} with pattern "${pattern}" - score: ${similarity.toFixed(2)}`);
          matches.push({ intent, score: similarity, pattern });
          if (similarity > bestMatch.score) {
            bestMatch = { intent, score: similarity, pattern };
          }
        }
      }
    }
  }

  // Áp dụng quy tắc ưu tiên nếu có xung đột
  if (matches.length > 1) {
    for (const rule of priorityRules) {
      const hasKeyword = rule.patterns.some(pattern => 
        message.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (hasKeyword) {
        // Tìm match có intent cần ưu tiên
        const priorityMatch = matches.find(match => match.intent === rule.priorityIntent);
        
        // Nếu tìm thấy match với intent ưu tiên và độ tương đồng trên 0.6
        if (priorityMatch && priorityMatch.score >= 0.6) {
          console.log(`Applying priority rule for "${rule.priorityIntent}" because message contains prioritized keywords`);
          bestMatch = priorityMatch;
          break;
        }
      }
    }
  }
  
  return bestMatch;
}

// Hàm xử lý context của cuộc trò chuyện
function handleContext(context, currentIntent) {
  if (!context || !context.type) {
    return null;
  }

  try {
    // Handle product context
    if (context.type === 'product' && context.data) {
      const product = context.data;
      
      // If there's no specific intent, provide general product info
      if (!currentIntent) {
        return `Sản phẩm ${product.productName} có giá ${formatCurrency(product.productPrice)}. ${product.productDiscount > 0 ? `Đang giảm giá ${product.productDiscount}%.` : ''} Bạn muốn biết thêm thông tin gì về sản phẩm này?`;
      }
      
      // If there's a specific intent that needs product info, use the intent handler
      if (intents[currentIntent] && typeof intents[currentIntent].response === 'function') {
        return intents[currentIntent].response(product);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error handling context: ${error.message}`);
    return null;
  }
}

// Hàm gửi tin nhắn đến Rasa và nhận phản hồi
async function sendToRasa(message, senderId) {
  try {
    const response = await axios.post(`${RASA_URL}/webhooks/rest/webhook`, {
      sender: senderId,
      message: message
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0].text;
    }
    
    return "Xin lỗi, tôi không hiểu câu hỏi của bạn.";
  } catch (error) {
    return "Đã có lỗi xảy ra khi xử lý tin nhắn của bạn.";
  }
}

// Hàm tạo slug từ tên sản phẩm
function createSlug(name) {
  if (!name) {
    return "";
  }
  
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
  
  return slug;
}

// Kiểm tra các intent không cần thông tin sản phẩm
const generalIntents = [
  'greeting', 'thanks', 'bye', 'storeAddress', 'orderStatus', 'contactInfo', 
  'mostExpensiveProduct', 'cheapestProduct', 'discountedProducts', 'userInfo', 'buyingMethods', 'paymentMethods',
  'foodSafety', 'organicFood', 'deliveryInfo', 'returnPolicy', 'membershipProgram', 'freshFood',
  'importedFood', 'vegetarianFood', 'storeLocation', 'promotions', 'mobileApp', 'nutritionAdvice'
];

/**
 * Get answer from RAG chatbot
 * @param {string} message - User message
 * @returns {Promise<string>} - RAG chatbot response
 */
async function getAnswerFromRagChatbot(message) {
  try {
    // Create a temporary JSON file with the user message
    const tempFile = path.join(process.cwd(), 'temp_message.json');
    fs.writeFileSync(tempFile, JSON.stringify({ message }), 'utf8');

    // Return a promise that will resolve with the chatbot's response
    return new Promise((resolve, reject) => {
      // Spawn Python process to run the RAG chatbot
      const pythonProcess = spawn('python', [
        path.join(process.cwd(), 'src/chatbot/app.py'),
        '--message', message
      ]);

      let output = '';
      let errorOutput = '';

      // Collect output from the Python process
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      // When the Python process exits, check if it was successful
      pythonProcess.on('close', (code) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
        } catch (err) {
          console.error('Error cleaning up temp file:', err);
        }

        if (code !== 0) {
          console.error(`Python process exited with code ${code}`);
          console.error(`Error: ${errorOutput}`);
          reject(new Error(`Python process failed with code ${code}`));
          return;
        }

        try {
          // Try to parse the output as JSON
          const jsonStart = output.indexOf('{');
          const jsonEnd = output.lastIndexOf('}');
          
          if (jsonStart >= 0 && jsonEnd >= 0) {
            const jsonStr = output.substring(jsonStart, jsonEnd + 1);
            const response = JSON.parse(jsonStr);
            resolve(response.answer || response.text || "Không thể xử lý phản hồi");
          } else {
            // If not valid JSON, just return the raw output
            resolve(output.trim() || "Không có phản hồi từ chatbot");
          }
        } catch (error) {
          console.error('Error parsing RAG chatbot response:', error);
          // If JSON parsing fails, return the raw output
          resolve(output.trim() || "Không thể phân tích phản hồi");
        }
      });
      
      // Handle errors from the Python process
      pythonProcess.on('error', (error) => {
        console.error('Error spawning Python process:', error);
        reject(error);
      });
    });
      } catch (error) {
    console.error('Error getting answer from RAG chatbot:', error);
    return "Xin lỗi, tôi không thể xử lý câu hỏi của bạn lúc này. Vui lòng thử lại sau.";
  }
}

// Hàm xử lý tin nhắn từ người dùng
export const handleMessage = async (req, res) => {
  try {
    const { message, user_id = "anonymous", productId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Tin nhắn không được để trống"
      });
    }

    console.log(`Nhận tin nhắn: "${message}" từ người dùng: ${user_id} | productId: ${productId ? productId : 'không có'}`);

    // First try to get response from RAG chatbot
    try {
      const ragResponse = await getAnswerFromRagChatbot(message);
      
      if (ragResponse && typeof ragResponse === 'string' && ragResponse.length > 0 && 
          ragResponse !== "Không thể xử lý phản hồi" && 
          ragResponse !== "Không có phản hồi từ chatbot" &&
          ragResponse !== "Không thể phân tích phản hồi") {
        // Return the response from the RAG chatbot
        return res.status(200).json({
            success: true,
          message: "Phản hồi từ RAG chatbot",
          response: {
            text: ragResponse,
            source: "rag"
          }
        });
      }
        } catch (error) {
      console.error("Error from RAG chatbot:", error);
      // Continue with pattern-based chatbot if RAG fails
    }

    // If RAG chatbot fails or doesn't provide a good response, fall back to pattern-based approach
    // Sử dụng context nếu có
    let context = null;

    // Nếu có productId, lấy thông tin sản phẩm
    let product = null;
    if (productId) {
      try {
        product = await Product.findById(productId);
        if (product) {
          context = { type: 'product', data: product };
          }
        } catch (error) {
        console.error(`Lỗi khi lấy thông tin sản phẩm: ${error.message}`);
      }
    }

    // Tìm intent phù hợp nhất với tin nhắn
    const { intent, score } = detectIntent(message);

    // Lấy phản hồi dựa trên intent và context
    let response = await handleContext(context, intent);

    // Nếu không có phản hồi từ context, sử dụng response theo intent
    if (!response) {
      if (intent && score > 0.5) {
        const intentHandler = intents[intent].response;
        
        if (typeof intentHandler === 'function') {
          if (product) {
            response = await intentHandler(product);
          } else {
            response = await intentHandler();
          }
        } else {
          response = intentHandler;
        }
      } else {
        // Gửi tin nhắn đến Rasa nếu không tìm thấy intent phù hợp
        try {
          response = await sendToRasa(message, user_id);
        } catch (error) {
          console.error(`Lỗi khi gửi tin nhắn đến Rasa: ${error.message}`);
          response = "Xin lỗi, tôi không hiểu ý của bạn. Bạn có thể diễn đạt lại được không?";
        }
      }
    }

    // Trả về phản hồi
    return res.status(200).json({
              success: true,
      message: "Xử lý tin nhắn thành công",
      response: {
        text: response,
              intent: intent,
        score: score,
        source: "pattern"
      }
    });
  } catch (error) {
    console.error(`Lỗi xử lý tin nhắn: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Lỗi xử lý tin nhắn",
      error: error.message
    });
  }
};

// Hàm xử lý webhook từ Rasa
export const handleRasaWebhook = async (req, res) => {
  try {
    const { sender, message } = req.body;
    
    if (!sender || !message) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết"
      });
    }
    
    // Xử lý tin nhắn từ Rasa
    // Có thể thêm logic xử lý đặc biệt ở đây nếu cần
    
    return res.json({
      success: true,
      message: "Đã nhận tin nhắn từ Rasa"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra khi xử lý webhook từ Rasa"
    });
  }
};

async function findRelatedProducts(product) {
  try {
    // Define the fields we want to use for finding related products
    const possibleFields = [
      { field: 'productCategory', value: product.productCategory },
      { field: 'categoryCode', value: product.categoryCode },
    ];

    // Select the first non-empty field
    const categoryField = possibleFields.find(f => f.value && f.value !== 'undefined');
    const categoryValue = categoryField?.value;

    // Build the query based on available data
    let query = {};

    // If it's a beverage product (can check based on category name or code)
    if (product.productCategory === 'Đồ uống các loại' || 
        product.categoryCode === 'douong') {
      // For beverages, find other beverages
      query = {
        $or: [
          { productCategory: 'Đồ uống các loại' },
          { categoryCode: 'douong' }
        ],
        _id: { $ne: product._id } // Exclude the current product
      };
    }
    // If we have category information
    else if (categoryValue) {
      query = {
        [categoryField.field]: categoryValue,
        _id: { $ne: product._id } // Exclude the current product
      };
    } else {
      // Fallback to a more general search if no category available
      // Could use text search here if available in your MongoDB setup
      query = {
        _id: { $ne: product._id } // At minimum, exclude the current product
      };
    }

    // Find related products
    const relatedProducts = await Product.find(query).limit(5);

    // If no related products found, get some random products
    if (relatedProducts.length === 0) {
      return await Product.aggregate([{ $sample: { size: 3 } }]);
    }

    return relatedProducts;
  } catch (_) {
    // Error handled by the caller
    return [];
  }
}

// Helper function to create a slug from a product name
function createSlugFromName(name) {
  if (!name) {
    return '';
  }
  
  try {
    // Basic slug creation: lowercase, replace spaces with hyphens, remove special chars
    const slug = name
      .toLowerCase()
      .replace(/đ/g, 'd')
      .replace(/[áàảãạâấầẩẫậăắằẳẵặ]/g, 'a')
      .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
      .replace(/[íìỉĩị]/g, 'i')
      .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
      .replace(/[úùủũụưứừửữự]/g, 'u')
      .replace(/[ýỳỷỹỵ]/g, 'y')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .trim();
      
    return slug;
  } catch (error) {
    return '';
  }
}

// Hàm trích xuất khoảng giá từ tin nhắn
function extractPriceRanges(message) {
  // Kiểm tra message có tồn tại và là string hay không
  if (!message || typeof message !== 'string') {
    return { minPrice: null, maxPrice: null };
  }

  // Chuẩn hóa message: bỏ dấu, chuyển về chữ thường, thay thế k/nghìn thành 000
  const normalizedMessage = message.toLowerCase()
    .replace(/k\b/g, '000')
    .replace(/nghìn\b/g, '000')
    .replace(/\.000/g, '000')
    .replace(/\./g, '')
    .replace(/,/g, '');
  
  console.log("Normalized message for price extraction:", normalizedMessage);
  
  // Pattern cho tìm sản phẩm theo giá cụ thể
  const exactPattern = /(?:giá|giá tiền|giá cả|giá bán|chi phí|mức giá|sản phẩm giá)\s+(\d+)(?:k|nghìn|000)?(?:\s+đồng|\s+vnd|\s+đ)?/i;
  const exactMatch = normalizedMessage.match(exactPattern);
  
  // Pattern cho khoảng giá từ X đến Y
  const rangePattern = /(?:từ|giá từ|khoảng|trong khoảng|dao động từ)\s+(\d+)(?:k|nghìn|000)?(?:\s+đồng|\s+vnd|\s+đ)?\s+(?:đến|tới|tới|toi|den|~|-|đến)\s+(\d+)(?:k|nghìn|000)?(?:\s+đồng|\s+vnd|\s+đ)?/i;
  const rangeMatch = normalizedMessage.match(rangePattern);
  
  // Pattern cho giá dưới X
  const belowPattern = /(?:dưới|ít hơn|nhỏ hơn|không quá|dưới mức|thấp hơn|rẻ hơn|tìm sản phẩm giá dưới|sản phẩm giá dưới|giá dưới)\s+(\d+)(?:k|nghìn|000)?(?:\s+đồng|\s+vnd|\s+đ)?/i;
  const belowMatch = normalizedMessage.match(belowPattern);
  
  // Pattern cho giá trên X
  const abovePattern = /(?:trên|hơn|lớn hơn|cao hơn|đắt hơn|từ|tìm sản phẩm giá trên|sản phẩm giá trên|giá trên)\s+(\d+)(?:k|nghìn|000)?(?:\s+đồng|\s+vnd|\s+đ)?(?:\s+trở lên|\s+trở nên)?/i;
  const aboveMatch = normalizedMessage.match(abovePattern);
  
  // Pattern cho khoảng giá tương tự/gần như một mức giá cố định
  const similarPattern = /(?:khoảng|gần như|tương tự|giá tương tự|giá gần|gần bằng|xấp xỉ)\s+(\d+)(?:k|nghìn|000)?(?:\s+đồng|\s+vnd|\s+đ)?/i;
  const similarMatch = normalizedMessage.match(similarPattern);
  
  // Khởi tạo giá trị mặc định
  let minPrice = null;
  let maxPrice = null;
  
  // Tùy chỉnh cho những câu như "tìm sản phẩm giá dưới 100k"
  if (normalizedMessage.includes("tìm sản phẩm") && normalizedMessage.includes("giá")) {
    // Tìm số trong câu
    const numberPattern = /(\d+)(?:k|nghìn|000)?/g;
    const numberMatches = normalizedMessage.match(numberPattern);
    
    if (numberMatches && numberMatches.length > 0) {
      let price = parseInt(numberMatches[0].replace(/k/g, '000').replace(/nghìn/g, '000'));
      if (price < 1000) price *= 1000;
      
      if (normalizedMessage.includes("dưới") || normalizedMessage.includes("ít hơn") || normalizedMessage.includes("không quá")) {
        maxPrice = price;
      } else if (normalizedMessage.includes("trên") || normalizedMessage.includes("hơn") || normalizedMessage.includes("ít nhất")) {
        minPrice = price;
      } else if (normalizedMessage.includes("khoảng") || normalizedMessage.includes("xấp xỉ") || normalizedMessage.includes("tương tự")) {
        // Khoảng giá xấp xỉ (±20%)
        minPrice = Math.floor(price * 0.8);
        maxPrice = Math.ceil(price * 1.2);
      } else {
        // Giá chính xác
        minPrice = price;
        maxPrice = price;
      }
      
      console.log(`Extracted from specific pattern: minPrice=${minPrice}, maxPrice=${maxPrice}`);
      return { minPrice, maxPrice };
    }
  }
  
  // Xử lý khoảng giá từ X đến Y
  if (rangeMatch) {
    minPrice = parseInt(rangeMatch[1]);
    maxPrice = parseInt(rangeMatch[2]);
    
    // Xử lý trường hợp người dùng nhập 100 thay vì 100000
    if (minPrice < 1000) minPrice *= 1000;
    if (maxPrice < 1000) maxPrice *= 1000;
  } 
  // Xử lý giá dưới X
  else if (belowMatch) {
    maxPrice = parseInt(belowMatch[1]);
    if (maxPrice < 1000) maxPrice *= 1000;
  } 
  // Xử lý giá trên X
  else if (aboveMatch) {
    minPrice = parseInt(aboveMatch[1]);
    if (minPrice < 1000) minPrice *= 1000;
  }
  // Xử lý giá tương tự X
  else if (similarMatch) {
    const price = parseInt(similarMatch[1]);
    if (price < 1000) {
      minPrice = price * 800; // 20% thấp hơn
      maxPrice = price * 1200; // 20% cao hơn
    } else {
      minPrice = price * 0.8; // 20% thấp hơn
      maxPrice = price * 1.2; // 20% cao hơn
    }
  }
  // Xử lý giá chính xác
  else if (exactMatch) {
    const price = parseInt(exactMatch[1]);
    if (price < 1000) {
      minPrice = price * 1000;
      maxPrice = price * 1000;
    } else {
      minPrice = price;
      maxPrice = price;
    }
  }
  // Các từ khóa đặc biệt
  else if (normalizedMessage.includes("giá rẻ") || normalizedMessage.includes("rẻ")) {
    maxPrice = 50000; // Dưới 50k cho sản phẩm giá rẻ
  }
  
  console.log(`Extracted price range: minPrice=${minPrice}, maxPrice=${maxPrice}`);
  return { minPrice, maxPrice };
}
