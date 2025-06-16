/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, MessageCircle, Minus, ExternalLink, ShoppingBag, MapPin, Tag } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import formatCurrency from "../Until/FotmatPrice";
import PropTypes from "prop-types";
import TypingEffect from "./TypingEffect";

// Hàm debounce để tránh gọi API quá nhiều lần
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Định nghĩa URL API sử dụng đường dẫn tương đối để tránh bị chặn
const getApiBaseUrl = () => {
  // Trong môi trường phát triển (localhost), sử dụng đường dẫn đầy đủ
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_SERVER_URL || "http://localhost:8080";
  }
  
  // Trong môi trường production (Vercel), sử dụng URL chính xác của backend
  return import.meta.env.VITE_SERVER_URL || "https://quanlythucpham-azf6.vercel.app";
};

// Định nghĩa API_BASE_URL
const API_BASE_URL = getApiBaseUrl();

// Hình ảnh mặc định cho sản phẩm
const DEFAULT_IMAGE = 'https://bizweb.dktcdn.net/thumb/large/100/360/151/products/5-fc8bf88b-59ce-4bb7-8b57-1e9cc2c5bfdb.jpg?v=1625689306000';

// Component để xử lý lỗi trong chatbot
class ChatBotErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ChatBot Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Khi lỗi xảy ra, hiển thị giao diện chatbot đơn giản
      return (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-[#51bb1a] text-white p-4 cursor-pointer rounded-full shadow-xl hover:bg-[#51bb1a] transition-all duration-300"
            aria-label="Khởi động lại chatbot"
          >
            <MessageCircle size={24} />
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Tạo component riêng biệt để hiển thị mỗi sản phẩm, giúp tránh re-render không cần thiết
const ProductItem = React.memo(({ product, handleProductClick, getProductImageUrl }) => {
  // For debugging
  console.log("Rendering product:", product);
  
  // Determine the proper identifier to use for navigation
  const handleClick = () => {
    try {
      // Get product name from various possible properties
      const productName = product.productName || product.name || "";
      
      // Always prefer generating a slug from the product name, even if we have an ID
      // This matches the URL format in the example: /chi-tiet-san-pham/hat-nem-4-trong-1-neptune-vi-heo-goi-170g
      if (productName) {
        // Format the slug correctly for Vietnamese product names
        const productSlug = productName
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")  // Remove Vietnamese diacritics
          .replace(/đ/g, "d")               // Replace Vietnamese đ with d
          .replace(/[^a-z0-9]+/g, "-")      // Replace non-alphanumeric with hyphens
          .replace(/^-+|-+$/g, "");         // Remove leading/trailing hyphens
        
        if (productSlug && productSlug.length > 0) {
          handleProductClick(productSlug);
          return;
        }
      }
      
      // Fallback to slug if already available
      if (product.slug) {
        console.log("Using existing product slug:", product.slug);
        handleProductClick(product.slug);
        return;
      }
      
      // Last resort: use ID
      const productId = product._id || product.id || "";
      console.log("No valid slug available, using ID instead:", productId);
      handleProductClick(productId);
    } catch (error) {
      console.error("Error handling product click:", error);
      // Absolute last resort fallback
      const fallbackId = product._id || product.id || "";
      handleProductClick(fallbackId);
    }
  };
  
  return (
    <div 
      className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="w-full h-16 overflow-hidden">
        <img
          src={getProductImageUrl(
            // Check for all possible image paths
            (product.productImages && product.productImages[0]) || 
            product.productImage || 
            product.image || 
            DEFAULT_IMAGE
          )}
          alt={product.name || product.productName}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log("Image load error:", e.target.src);
            e.target.onerror = null;
            e.target.src = DEFAULT_IMAGE;
          }}
        />
      </div>
      <div className="p-2">
        <div className="text-xs font-medium mb-1 line-clamp-2 hover:text-[#51bb1a] transition-colors">
          {product.name || product.productName}
        </div>
        <div className="flex justify-between items-center mt-1">
          <div>
            {(product.discount > 0 || product.productDiscount > 0) ? (
              <>
                <div className="text-xs text-gray-400 line-through">
                  {formatCurrency(product.price || product.productPrice)}
                </div>
                <div className="text-xs font-semibold text-red-500">
                  {formatCurrency(product.promotionalPrice || 
                    Math.round((product.price || product.productPrice) * 
                    (1 - (product.discount || product.productDiscount) / 100)))}
                </div>
              </>
            ) : (
              <div className="text-xs font-semibold text-red-500">
                {formatCurrency(product.price || product.productPrice)}
              </div>
            )}
          </div>
          <button 
            className="text-xs text-white bg-[#51bb1a] p-1 rounded hover:bg-[#51bb1a] transition-colors"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the parent div's onClick
              handleClick();
            }}
          >
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
});
ProductItem.displayName = 'ProductItem';

// Component cho danh sách sản phẩm để giảm số lần re-render
const ProductList = React.memo(({ products, handleProductClick, getProductImageUrl }) => {
  if (!products || products.length === 0) {
    return <div className="text-sm italic">Không tìm thấy sản phẩm nào.</div>;
  }
  
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {products.map((product, idx) => (
        <ProductItem 
          key={`product-${idx}`} 
          product={product}
          handleProductClick={handleProductClick} 
          getProductImageUrl={getProductImageUrl}
        />
      ))}
    </div>
  );
});
ProductList.displayName = 'ProductList';

// Component to display multiple product search results grouped by query
const MultiProductSearchResult = React.memo(({ searchResults, handleProductClick, getProductImageUrl }) => {
  if (!searchResults || searchResults.length === 0) {
    return <div className="text-sm italic">Không tìm thấy sản phẩm nào.</div>;
  }
  
  return (
    <div className="space-y-4 mt-2">
      {searchResults.map((result, idx) => {
        // Nếu không có sản phẩm trong kết quả này, hiển thị thông báo
        if (!result.products || result.products.length === 0) {
          return (
            <div key={`search-result-${idx}`} className="border-t pt-2 first:border-t-0 first:pt-0">
              <div className="font-medium text-sm mb-2 flex items-center">
                <ShoppingBag className="w-4 h-4 mr-1" /> 
                Kết quả tìm kiếm cho: "{result.query}"
              </div>
              <div className="text-sm italic">Không tìm thấy sản phẩm phù hợp</div>
            </div>
          );
        }
        
        return (
          <div key={`search-result-${idx}`} className="border-t pt-2 first:border-t-0 first:pt-0">
            <div className="font-medium text-sm mb-2 flex items-center">
              <ShoppingBag className="w-4 h-4 mr-1" /> 
              Kết quả tìm kiếm cho: "{result.query}"
            </div>
            <div className="grid grid-cols-2 gap-2">
              {result.products.map((product, prodIdx) => (
                <ProductItem 
                  key={`multi-product-${idx}-${prodIdx}`} 
                  product={product}
                  handleProductClick={handleProductClick} 
                  getProductImageUrl={getProductImageUrl}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});
MultiProductSearchResult.displayName = 'MultiProductSearchResult';

const ChatBot = ({ isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [lastIntent, setLastIntent] = useState(null);
  const [typingMessage, setTypingMessage] = useState(null);
  
  const userId = localStorage.getItem("userId");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Kiểm tra thiết bị di động
  useEffect(() => {
    const checkIfMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
    };
    
    // Kiểm tra ban đầu
    checkIfMobile();
    
    // Thêm event listener để kiểm tra khi thay đổi kích thước màn hình
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && isFirstOpen) {
      // Chỉ thêm tin nhắn chào mừng khi mở đầu tiên
      setTypingMessage({ 
        text: "Xin chào! Tôi là trợ lý ảo của DNC FOOD. Tôi có thể giúp gì cho bạn?", 
        sender: "bot",
        showOptions: true, // Flag để hiển thị các nút tùy chọn
        optionsType: "general" // Luôn hiển thị các tùy chọn chung
      });
      setIsFirstOpen(false);
    }
  }, [isOpen, isFirstOpen]);

  // Xử lý khi tin nhắn đánh máy hoàn thành
  useEffect(() => {
    if (typingMessage) {
      setIsLoading(true);
    }
  }, [typingMessage]);

  // Xử lý hoàn thành đánh máy
  const handleTypingComplete = useCallback(() => {
    if (typingMessage) {
      setMessages(prev => [...prev, typingMessage]);
      setTypingMessage(null);
      setIsLoading(false);
    }
  }, [typingMessage]);

  const getProductImageUrl = useCallback((url) => {
    // For debugging - log the incoming URL
    console.log("Processing image URL:", url);
    
    // Sử dụng ảnh mặc định nếu không có URL
    if (!url) {
      console.log("No URL provided, using default image");
      return DEFAULT_IMAGE;
    }
    
    // Xử lý url là chuỗi rỗng
    if (url === '') {
      console.log("Empty URL string, using default image");
      return DEFAULT_IMAGE;
    }
    
    // URL đã là đầy đủ 
    if (url.startsWith('http')) {
      console.log("Using full URL as is:", url);
      return url;
    } 
    // URL là đường dẫn tương đối hoặc mẫu
    else if (url === 'default-product.jpg') {
      console.log("Using default product image");
      return DEFAULT_IMAGE;
    } 
    // URL bắt đầu bằng / (đường dẫn tuyệt đối trong server)
    else if (url.startsWith('/')) {
      const fullUrl = `${API_BASE_URL}${url}`;
      console.log("Converted relative URL to:", fullUrl);
      return fullUrl;
    } 
    // URL khác (không có đường dẫn)
    else {
      // Thêm / trước URL nếu cần
      const fullUrl = `${API_BASE_URL}/${url}`;
      console.log("Added base URL to:", fullUrl);
      return fullUrl;
    }
  }, []);

  const handleProductClick = useCallback((productSlug) => {
    if (!productSlug) {
      console.error("Không có slug sản phẩm để chuyển hướng");
      return;
    }
    
    try {
      // Don't use MongoDB IDs for navigation - they won't work properly
      // If it looks like a MongoDB ID (24 character hex), log error and don't navigate
      if (productSlug.match(/^[0-9a-fA-F]{24}$/)) {
        console.error("Không thể chuyển hướng bằng MongoDB ID:", productSlug);
        return;
      }
      
      // Format URL for navigation - use consistent format with the example
      const productDetailUrl = `/chi-tiet-san-pham/${productSlug}`;
      console.log("Đang chuyển hướng đến:", productDetailUrl);
      
      // Navigate to the product detail page
      navigate(productDetailUrl);
      
      // Lưu slug sản phẩm vào sessionStorage để có thể truy cập trong các trang khác
      sessionStorage.setItem('currentProductId', productSlug);
      
      // Đóng chatbot sau khi chuyển hướng
      setIsOpen(false);
    } catch (error) {
      console.error("Lỗi khi chuyển hướng đến sản phẩm:", error);
    }
  }, [navigate, setIsOpen]);

  // Send message to API endpoint - Sửa phần gọi API thêm debounce
  const handleCustomMessageRequest = useCallback(async (message) => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Lấy productId từ URL hiện tại nếu đang ở trang chi tiết sản phẩm
      let currentProductId = null;
      const currentPath = window.location.pathname;
      if (currentPath.includes('/chi-tiet-san-pham/')) {
        // Thử lấy productId từ sessionStorage nếu có lưu
        currentProductId = sessionStorage.getItem('currentProductId');
      }
      
      const payload = {
        message,
        userId,
        productId: currentProductId // Gửi productId nếu có
      };
      
      console.log("Sending request to chatbot with payload:", payload);
      
      // Sử dụng endpoint tuyệt đối cho API
      const endpoint = `${API_BASE_URL}/api/chatbot`;
      
      // Thêm header để tránh bị ad blockers chặn
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };
      
      const response = await axios.post(endpoint, payload, config);
      
      if (response.data.success) {
        // Log toàn bộ response để debug
        console.log("Chatbot response:", response.data);
        
        // Lấy dữ liệu từ response
        const responseData = response.data;
        
        // Handle multi-product search results
        if (responseData.type === 'multiProductSearch' && responseData.data && Array.isArray(responseData.data)) {
          console.log("Multi-product search results:", responseData.data);
          
          setTypingMessage({
            type: 'multiProductSearch',
            text: responseData.message || 'Kết quả tìm kiếm nhiều sản phẩm:',
            data: responseData.data,
            totalResults: responseData.totalResults || responseData.data.reduce((total, result) => total + result.products.length, 0),
            sender: "bot"
          });
          
          // Cập nhật intent mới nhất
          setLastIntent('multiProductSearch');
          return;
        }
        
        // Kiểm tra trường hợp response chứa data đặc biệt
        if (responseData.data && Array.isArray(responseData.data)) {
          // Data là mảng các sản phẩm
          console.log("Data is an array of products:", responseData.data);
          
          setTypingMessage({
            type: responseData.type || 'productSearch',
            text: responseData.text || responseData.message || 'Đây là kết quả tìm kiếm:',
            products: responseData.data,
            sender: "bot"
          });
          
          // Cập nhật intent mới nhất
          setLastIntent(responseData.type || 'productSearch');
          return;
        }
        
        // Trường hợp còn lại - tin nhắn thông thường
        setTypingMessage({
          text: responseData.message || responseData.text || "Xin lỗi, tôi không hiểu ý bạn.",
          sender: "bot"
        });
      } else {
        // Xử lý lỗi từ server
        setTypingMessage({
          text: response.data.message || "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
          sender: "bot"
        });
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      
      // Hiển thị thông báo lỗi
      setTypingMessage({
        text: "Xin lỗi, đã có lỗi xảy ra khi kết nối với máy chủ. Vui lòng thử lại sau.",
        sender: "bot"
      });
    }
  }, [userId, lastIntent]);
  
  // Áp dụng debounce cho handleCustomMessage để tránh gọi API quá nhiều lần
  const handleCustomMessage = useCallback(
    debounce((message) => {
      handleCustomMessageRequest(message);
    }, 300), 
    [handleCustomMessageRequest]
  );
  
  // Xử lý gửi tin nhắn
  const handleSendMessage = useCallback(() => {
    if (!input.trim() || isLoading) return;

    // Thêm tin nhắn của người dùng vào danh sách
    setMessages((prev) => [...prev, { text: input, sender: "user" }]);

    // Gửi tin nhắn đến API
    handleCustomMessage(input);

    // Xóa input
    setInput("");
  }, [input, isLoading, handleCustomMessage]);

  // Xử lý câu hỏi định sẵn
  const handlePredefinedQuestion = useCallback((question) => {
    if (isLoading) return;

    // Thêm câu hỏi vào danh sách tin nhắn
    setMessages((prev) => [...prev, { text: question, sender: "user" }]);

    // Gửi câu hỏi đến API
    handleCustomMessage(question);
  }, [isLoading, handleCustomMessage]);

  // Thêm hàm để lấy các gợi ý câu hỏi phù hợp dựa trên lastIntent
  const getDynamicSuggestions = useCallback(() => {
    if (lastIntent === 'productSearch' || lastIntent === 'relatedProducts') {
      return [
        {
          text: "Các sản phẩm dưới 100k", 
          handler: () => handlePredefinedQuestion("Tìm sản phẩm dưới 100k")
        },
        { 
          text: "Sản phẩm đang giảm giá", 
          handler: () => handlePredefinedQuestion("Tìm sản phẩm đang giảm giá")
        },
        {
          text: "Tìm nhiều sản phẩm",
          handler: () => handlePredefinedQuestion("Tìm nhiều sản phẩm cùng lúc: nước ngọt, mì tôm và bánh kẹo")
        },
        {
          text: "Nước uống và đồ ăn",
          handler: () => handlePredefinedQuestion("Nước uống và đồ ăn vặt")
        }
      ];
    } else if (lastIntent === 'multiProductSearch') {
      return [
        {
          text: "Tìm nước giặt và nước rửa",
          handler: () => handlePredefinedQuestion("Nước giặt và nước rửa chén")
        },
        {
          text: "So sánh nước uống",
          handler: () => handlePredefinedQuestion("So sánh các loại nước uống")
        },
        {
          text: "Thịt và rau củ",
          handler: () => handlePredefinedQuestion("Thịt cá và rau củ")
        },
        {
          text: "Bánh kẹo nước ngọt",
          handler: () => handlePredefinedQuestion("Bánh kẹo nước ngọt")
        }
      ];
    } else if (lastIntent === 'shipping' || lastIntent === 'shippingFee') {
      return [
        {
          text: "Thời gian giao hàng",
          handler: () => handlePredefinedQuestion("Thời gian giao hàng")
        },
        {
          text: "Phương thức thanh toán",
          handler: () => handlePredefinedQuestion("Phương thức thanh toán")
        }
      ];
    }
    
    // Trường hợp mặc định
    return [
      {
        text: "Các sản phẩm dưới 100k",
        handler: () => handlePredefinedQuestion("Tìm sản phẩm dưới 100k")
      },
      {
        text: "Sản phẩm đang giảm giá",
        handler: () => handlePredefinedQuestion("Tìm sản phẩm đang giảm giá")
      },
      {
        text: "Cách đặt hàng",
        handler: () => handlePredefinedQuestion("Hướng dẫn cách đặt hàng")
      },
      {
        text: "Nước giặt và nước rửa",
        handler: () => handlePredefinedQuestion("Nước giặt và nước rửa chén")
      },
      {
        text: "Thịt cá và rau củ",
        handler: () => handlePredefinedQuestion("Thịt cá và rau củ")
      }
    ];
  }, [lastIntent, handlePredefinedQuestion]);

  // Sử dụng getDynamicSuggestions thay cho suggestedQuestions
  const suggestedQuestions = useMemo(() => {
    return getDynamicSuggestions();
  }, [getDynamicSuggestions]);

  // Render message based on type - sử dụng React.memo để tránh re-render không cần thiết
  const renderMessage = useCallback((msg, index) => {
    console.log(`Rendering message type: ${msg.type || 'text'}`);
    
    // Handle multi-product search results
    if (msg.type === 'multiProductSearch') {
      return (
        <div key={`msg-${index}`} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-3`}>
          <div className={`${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"} px-4 py-2 rounded-2xl max-w-[85%]`}>
            <p className="mb-2">{msg.text}</p>
            <div className="text-sm font-medium mb-2">
              <Tag className="inline mr-1 w-4 h-4" /> Tìm nhiều sản phẩm
            </div>
            <MultiProductSearchResult 
              searchResults={msg.data} 
              handleProductClick={handleProductClick} 
              getProductImageUrl={getProductImageUrl} 
            />
          </div>
        </div>
      );
    }
    
    // Render sản phẩm cho các tin nhắn đặc biệt
    if (msg.type === 'productSearch' || msg.type === 'relatedProducts' || 
        msg.type === 'discountedProducts' || msg.type === 'priceRangeProducts' ||
        msg.type === 'categoryQuery') {
      
      // Log detailed information about products in this message
      if (msg.products && msg.products.length > 0) {
        console.log(`Message contains ${msg.products.length} products`);
        console.log("Sample product data:", msg.products[0]);
        
        // Check for necessary product properties
        msg.products.forEach((p, idx) => {
          if (!p.productName && !p.name) {
            console.warn(`Product at index ${idx} missing name property`);
          }
        });
      } else {
        console.warn("Product message has no products or empty products array");
      }
      
      return (
        <div key={`msg-${index}`} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-3`}>
          <div className={`${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"} px-4 py-2 rounded-2xl max-w-[85%]`}>
            <p className="mb-2">{msg.text}</p>
            {msg.nameCategory && (
              <div className="text-sm font-medium mb-2">
                <Tag className="inline mr-1 w-4 h-4" /> {msg.nameCategory}
              </div>
            )}
            {/* Sử dụng component ProductList đã được memo hóa */}
            <ProductList 
              products={msg.products} 
              handleProductClick={handleProductClick} 
              getProductImageUrl={getProductImageUrl} 
            />
          </div>
        </div>
      );
    }
    
    // Hàm chuyển đổi HTML string thành React elements an toàn
    const createMarkup = (htmlContent) => {
      if (!htmlContent || typeof htmlContent !== 'string') {
        return '';
      }
      
      try {
        // Thay thế các thẻ HTML phổ biến bằng các định dạng văn bản thông thường
        let sanitizedText = htmlContent
          .replace(/<strong>(.*?)<\/strong>/gi, '$1') // Bỏ thẻ strong nhưng giữ nội dung
          .replace(/<span.*?>(.*?)<\/span>/gi, '$1') // Bỏ thẻ span nhưng giữ nội dung
          .replace(/<b>(.*?)<\/b>/gi, '$1') // Bỏ thẻ b nhưng giữ nội dung
          .replace(/<i>(.*?)<\/i>/gi, '$1') // Bỏ thẻ i nhưng giữ nội dung
          .replace(/<em>(.*?)<\/em>/gi, '$1') // Bỏ thẻ em nhưng giữ nội dung
          .replace(/<br\s*\/?>/gi, '\n') // Chuyển <br> thành xuống dòng
          .replace(/<p>(.*?)<\/p>/gi, '$1\n') // Chuyển <p> thành đoạn văn với xuống dòng
          .replace(/<div>(.*?)<\/div>/gi, '$1\n') // Chuyển <div> thành đoạn với xuống dòng
          .replace(/<li>(.*?)<\/li>/gi, '• $1\n') // Chuyển <li> thành dạng danh sách với dấu chấm
          .replace(/<[^>]+>/g, ''); // Loại bỏ tất cả các thẻ HTML còn lại
        
        // Xử lý các ký tự đặc biệt trong HTML
        sanitizedText = sanitizedText
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&nbsp;/g, ' ');
        
        return sanitizedText;
      } catch (error) {
        console.error("Lỗi khi xử lý HTML:", error);
        // Fallback: trả về văn bản gốc nếu có lỗi
        return htmlContent;
      }
    };
    
    // Render tin nhắn thông thường
    return (
      <div key={`msg-${index}`} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-3`}>
        <div className={`${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"} px-4 py-2 rounded-2xl max-w-[85%]`}>
          <p className="whitespace-pre-line">{createMarkup(msg.text)}</p>
          
          {/* Hiển thị các tùy chọn nếu có */}
          {msg.sender === "bot" && msg.showOptions && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {msg.optionsType === "general" && (
                <>
                  <button
                    onClick={() => handlePredefinedQuestion("Các sản phẩm dưới 100k")}
                    className="text-xs bg-white text-gray-700 p-2 rounded border border-gray-200 hover:bg-green-50 hover:border-green-200 flex items-center"
                  >
                    <Tag className="mr-1 w-3 h-3" />
                    <span>Các sản phẩm dưới 100k</span>
                  </button>
                  <button
                    onClick={() => handlePredefinedQuestion("Sản phẩm đang giảm giá")}
                    className="text-xs bg-white text-gray-700 p-2 rounded border border-gray-200 hover:bg-green-50 hover:border-green-200 flex items-center"
                  >
                    <ShoppingBag className="mr-1 w-3 h-3" />
                    <span>Sản phẩm đang giảm giá</span>
                  </button>
                  <button
                    onClick={() => handlePredefinedQuestion("Cách đặt hàng")}
                    className="text-xs bg-white text-gray-700 p-2 rounded border border-gray-200 hover:bg-green-50 hover:border-green-200 flex items-center"
                  >
                    <MapPin className="mr-1 w-3 h-3" />
                    <span>Cách đặt hàng</span>
                  </button>
                  <button
                    onClick={() => handlePredefinedQuestion("Phí vận chuyển")}
                    className="text-xs bg-white text-gray-700 p-2 rounded border border-gray-200 hover:bg-green-50 hover:border-green-200 flex items-center"
                  >
                    <MapPin className="mr-1 w-3 h-3" />
                    <span>Phí vận chuyển</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [getProductImageUrl, handleProductClick, handlePredefinedQuestion]);

  return (
    <div className={`fixed z-50 ${isMobile ? 'bottom-2 right-2' : 'bottom-6 right-6'}`}>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#51bb1a] text-white p-4 cursor-pointer rounded-full shadow-xl hover:bg-[#51bb1a] transition-all duration-300 animate-bounce"
          aria-label="Mở chat"
        >
          <MessageCircle size={isMobile ? 20 : 24} />
        </button>
      )}

      {isOpen && (
        <div className={`${isMobile ? 'w-[92vw] max-w-[350px]' : 'w-96'} bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col`}>
          <div className="bg-[#51bb1a] text-white p-4 rounded-t-xl flex justify-between items-center">
            <h2 className="text-lg font-semibold">Hỗ Trợ DNC FOOD</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-[#51bb1a] p-1 rounded-full transition-colors"
              aria-label="Thu nhỏ chat"
            >
              <Minus size={20} />
            </button>
          </div>

          <div className={`flex-grow overflow-y-auto p-4 space-y-3 ${isMobile ? 'max-h-[300px]' : 'max-h-[420px]'} custom-scrollbar`}>
            {messages.map((msg, index) => renderMessage(msg, index))}

            {/* Hiển thị tin nhắn đang đánh máy */}
            {typingMessage && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl max-w-[85%]">
                  <TypingEffect 
                    text={typingMessage.text} 
                    speed={25}
                    onComplete={handleTypingComplete}
                  />
                  
                  {/* Hiển thị các nút tùy chọn nếu có */}
                  {typingMessage.showOptions && typingMessage.sender === "bot" && (
                    <div className="grid grid-cols-2 gap-2 mt-3 opacity-0 animate-fade-in" 
                         style={{animationDelay: `${typingMessage.text.length * 25 + 500}ms`, animationFillMode: 'forwards'}}>
                      {typingMessage.optionsType === "general" && (
                        <>
                          <button
                            onClick={() => handlePredefinedQuestion("Các sản phẩm dưới 100k")}
                            className="text-xs bg-white text-gray-700 p-2 rounded border border-gray-200 hover:bg-green-50 hover:border-green-200 flex items-center"
                          >
                            <Tag className="mr-1 w-3 h-3" />
                            <span>Các sản phẩm dưới 100k</span>
                          </button>
                          <button
                            onClick={() => handlePredefinedQuestion("Sản phẩm đang giảm giá")}
                            className="text-xs bg-white text-gray-700 p-2 rounded border border-gray-200 hover:bg-green-50 hover:border-green-200 flex items-center"
                          >
                            <ShoppingBag className="mr-1 w-3 h-3" />
                            <span>Sản phẩm đang giảm giá</span>
                          </button>
                          <button
                            onClick={() => handlePredefinedQuestion("Cách đặt hàng")}
                            className="text-xs bg-white text-gray-700 p-2 rounded border border-gray-200 hover:bg-green-50 hover:border-green-200 flex items-center"
                          >
                            <MapPin className="mr-1 w-3 h-3" />
                            <span>Cách đặt hàng</span>
                          </button>
                          <button
                            onClick={() => handlePredefinedQuestion("Phí vận chuyển")}
                            className="text-xs bg-white text-gray-700 p-2 rounded border border-gray-200 hover:bg-green-50 hover:border-green-200 flex items-center"
                          >
                            <MapPin className="mr-1 w-3 h-3" />
                            <span>Phí vận chuyển</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isLoading && !typingMessage && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#51bb1a] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-[#51bb1a] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-[#51bb1a] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Gợi ý câu hỏi phổ biến */}
          <div className="px-3 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2 font-medium">Câu hỏi phổ biến:</p>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar-horizontal">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={`suggestedQ-${i}`}
                  onClick={q.handler}
                  className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 transition-colors flex-shrink-0"
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Nhập tin nhắn..."
                className="flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
                disabled={isLoading}
                aria-label="Nhập tin nhắn"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className={`bg-[#51bb1a] text-white p-2 rounded-full transition-all duration-300 ${
                  isLoading || !input.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#51bb1a] active:scale-95"
                }`}
                aria-label="Gửi tin nhắn"
              >
                <Send size={isMobile ? 18 : 20} className="p-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
          
          .custom-scrollbar-horizontal::-webkit-scrollbar {
            height: 4px;
          }
          .custom-scrollbar-horizontal::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar-horizontal::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 10px;
          }
          .custom-scrollbar-horizontal::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
          
          @media (max-width: 640px) {
            .fixed.bottom-6.right-6 {
              bottom: 1rem;
              right: 1rem;
            }
            
            .custom-scrollbar {
              max-height: 280px;
            }
          }
        `}
      </style>
    </div>
  );
};

ChatBot.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired
};

// Bọc ChatBot trong Error Boundary
const ChatBotWithErrorBoundary = (props) => (
  <ChatBotErrorBoundary>
    <ChatBot {...props} />
  </ChatBotErrorBoundary>
);

export default ChatBotWithErrorBoundary;


