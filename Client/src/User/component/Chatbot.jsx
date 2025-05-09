/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, MessageCircle, Minus, ExternalLink, ShoppingBag, MapPin, Tag } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import formatCurrency from "../Until/FotmatPrice";
import PropTypes from "prop-types";

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
            className="bg-green-500 text-white p-4 cursor-pointer rounded-full shadow-xl hover:bg-green-600 transition-all duration-300"
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
  return (
    <div 
      className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleProductClick(product.slug || product._id)}
    >
      <div className="w-full h-16 overflow-hidden">
        <img
          src={getProductImageUrl(
            // Kiểm tra đầy đủ các trường hợp có thể có của hình ảnh
            (product.productImages && product.productImages[0]) || 
            product.productImage || 
            product.image || 
            'default-product.jpg'
          )}
          alt={product.name || product.productName}
          loading="lazy" // Thêm lazy loading để tối ưu hiệu suất
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_IMAGE;
          }}
        />
      </div>
      <div className="p-2">
        <div className="text-xs font-medium mb-1 line-clamp-2 hover:text-green-600 transition-colors">
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
            className="text-xs text-white bg-green-500 p-1 rounded hover:bg-green-600 transition-colors"
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

const ChatBot = ({ isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [lastIntent, setLastIntent] = useState(null);
  
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
      setMessages([{ 
        text: "Xin chào! Tôi là trợ lý ảo của DNC FOOD. Tôi có thể giúp gì cho bạn?", 
        sender: "bot",
        showOptions: true, // Flag để hiển thị các nút tùy chọn
        optionsType: "general" // Luôn hiển thị các tùy chọn chung
      }]);
      setIsFirstOpen(false);
    }
  }, [isOpen, isFirstOpen]);

  const getProductImageUrl = useCallback((url) => {
    // Sử dụng ảnh mặc định nếu không có URL
    if (!url) return DEFAULT_IMAGE;
    
    // Xử lý url là chuỗi rỗng
    if (url === '') return DEFAULT_IMAGE;
    
    // URL đã là đầy đủ 
    if (url.startsWith('http')) {
      return url;
    } 
    // URL là đường dẫn tương đối hoặc mẫu
    else if (url === 'default-product.jpg') {
      return DEFAULT_IMAGE;
    } 
    // URL bắt đầu bằng / (đường dẫn tuyệt đối trong server)
    else if (url.startsWith('/')) {
      // Sử dụng đường dẫn đầy đủ khi ở development, tương đối khi ở production
      return `${API_BASE_URL}${url}`;
    } 
    // URL khác (không có đường dẫn)
    else {
      // Thêm / trước URL nếu cần
      return `${API_BASE_URL}/${url}`;
    }
  }, []);

  const handleProductClick = useCallback((productSlug) => {
    if (!productSlug) return;
    
    console.log("Đang chuyển hướng đến sản phẩm:", productSlug);
    
    // Chuyển hướng đến trang chi tiết sản phẩm
    navigate(`/chi-tiet-san-pham/${productSlug}`);
    
    // Đóng chatbot sau khi chuyển hướng
    setIsOpen(false);
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
        
        // Kiểm tra trường hợp response chứa data đặc biệt
        if (responseData.data && typeof responseData.data === 'object') {
          const { type, text, products, nameCategory } = responseData.data;
          
          if (type === 'relatedProducts' || 
              type === 'discountedProducts' || 
              type === 'priceRangeProducts' ||
              type === 'productSearch') {
            
            setMessages((prev) => [
              ...prev,
              {
                type,
                text: text || 'Đây là một số sản phẩm bạn có thể quan tâm:',
                products: products || [],
                nameCategory: nameCategory || 'Kết quả tìm kiếm',
                sender: "bot"
              }
            ]);
            
            // Cập nhật intent mới nhất
            setLastIntent(responseData.intent || 'productSearch');
            
            setIsLoading(false);
            return;
          }
        }
        
        // Kiểm tra tin nhắn thông thường có định dạng đặc biệt không
        if (typeof responseData.message === 'object' && 
            responseData.message !== null && 
            (responseData.message.type === 'productSearch' || 
             responseData.message.type === 'relatedProducts')) {
          
          const { type, text, products, nameCategory } = responseData.message;
          
          setMessages((prev) => [
            ...prev,
            {
              type,
              text: text || 'Đây là kết quả tìm kiếm:',
              products: products || [],
              nameCategory: nameCategory || 'Kết quả tìm kiếm',
              sender: "bot"
            }
          ]);
          
          setIsLoading(false);
          return;
        }
        
        // Xử lý text thông thường
        setMessages((prev) => [
          ...prev,
          { 
            text: responseData.message || "Xin lỗi, tôi không hiểu câu hỏi của bạn.",
            sender: "bot" 
          }
        ]);

        // Cập nhật intent mới nhất
        setLastIntent(responseData.intent);
      } else {
        throw new Error(response.data.message || "Đã có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Xin lỗi, đã có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại.",
          sender: "bot" 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, setIsLoading, setMessages, setLastIntent, API_BASE_URL]);
  
  // Áp dụng debounce cho handleCustomMessage để tránh gọi API quá nhiều lần
  const handleCustomMessage = useCallback(
    debounce((message) => {
      handleCustomMessageRequest(message);
    }, 300), 
    [handleCustomMessageRequest]
  );
  
  // Handle sending a message
  const handleSendMessage = useCallback(() => {
    if (!input.trim()) return;
 
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    handleCustomMessage(userMessage);
  }, [input, handleCustomMessage]);

  // Handle predefined questions
  const handlePredefinedQuestion = useCallback((question) => {
    setMessages((prev) => [...prev, { text: question, sender: "user" }]);
    handleCustomMessage(question);
  }, [handleCustomMessage]);

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
          text: "Tìm đồ nhậu",
          handler: () => handlePredefinedQuestion("Tìm đồ nhậu")
        },
        {
          text: "Tìm nước uống",
          handler: () => handlePredefinedQuestion("Tìm nước uống")
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
        text: "Phí vận chuyển",
        handler: () => handlePredefinedQuestion("Thông tin phí vận chuyển")
      },
      {
        text: "Tìm đồ nhậu",
        handler: () => handlePredefinedQuestion("Tìm đồ nhậu")
      }
    ];
  }, [lastIntent, handlePredefinedQuestion]);

  // Sử dụng getDynamicSuggestions thay cho suggestedQuestions
  const suggestedQuestions = useMemo(() => {
    return getDynamicSuggestions();
  }, [getDynamicSuggestions]);

  // Render message based on type - sử dụng React.memo để tránh re-render không cần thiết
  const renderMessage = useCallback((msg, index) => {
    // Render sản phẩm cho các tin nhắn đặc biệt
    if (msg.type === 'productSearch' || msg.type === 'relatedProducts' || msg.type === 'discountedProducts' || msg.type === 'priceRangeProducts') {
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
    
    // Render tin nhắn thông thường
    return (
      <div key={`msg-${index}`} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-3`}>
        <div className={`${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"} px-4 py-2 rounded-2xl max-w-[85%]`}>
          <p className="whitespace-pre-line">{msg.text}</p>
          
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
          className="bg-green-500 text-white p-4 cursor-pointer rounded-full shadow-xl hover:bg-green-600 transition-all duration-300 animate-bounce"
          aria-label="Mở chat"
        >
          <MessageCircle size={isMobile ? 20 : 24} />
        </button>
      )}

      {isOpen && (
        <div className={`${isMobile ? 'w-[92vw] max-w-[350px]' : 'w-96'} bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col`}>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-xl flex justify-between items-center">
            <h2 className="text-lg font-semibold">Hỗ Trợ DNC FOOD</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-green-700 p-1 rounded-full transition-colors"
              aria-label="Thu nhỏ chat"
            >
              <Minus size={20} />
            </button>
          </div>

          <div className={`flex-grow overflow-y-auto p-4 space-y-3 ${isMobile ? 'max-h-[300px]' : 'max-h-[420px]'} custom-scrollbar`}>
            {messages.map((msg, index) => renderMessage(msg, index))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
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
                className={`bg-green-500 text-white p-2 rounded-full transition-all duration-300 ${
                  isLoading || !input.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-green-600 active:scale-95"
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


