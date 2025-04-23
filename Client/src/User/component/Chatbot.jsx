/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, MessageCircle, Minus, ExternalLink, Info, ShoppingBag, MapPin, FileText, Settings, Tag, Search } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import formatCurrency from "../Until/FotmatPrice";
import PropTypes from "prop-types";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";
const SERVER_URL = API_BASE_URL;

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

const ChatBot = ({ isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [conversationContext, setConversationContext] = useState({
    lastIntent: null,
    messageHistory: []
  });
  
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
    if (!url) return 'https://bizweb.dktcdn.net/thumb/large/100/360/151/products/5-fc8bf88b-59ce-4bb7-8b57-1e9cc2c5bfdb.jpg?v=1625689306000';
    
    // URL đã là đầy đủ hoặc là URL tương đối
    if (url.startsWith('http')) {
      return url;
    } else if (url === 'default-product.jpg') {
      return 'https://bizweb.dktcdn.net/thumb/large/100/360/151/products/5-fc8bf88b-59ce-4bb7-8b57-1e9cc2c5bfdb.jpg?v=1625689306000';
    } else if (url.startsWith('/')) {
      return `http://localhost:8080${url}`;
    } else {
      return `http://localhost:8080/${url}`;
    }
  }, []);

  const handleProductClick = useCallback((slug) => {
    if (!slug) return;
    
    navigate(`/chi-tiet-san-pham/${slug}`);
    setIsOpen(false); // Đóng chatbot khi chuyển trang
  }, [navigate, setIsOpen]);

  // Send message to API endpoint
  const handleCustomMessage = useCallback(async (message) => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    
    try {
      const payload = {
        message,
        userId
      };
      
      // Thay đổi URL endpoint theo cách đăng ký của server
      const response = await axios.post(`${SERVER_URL}/api/chatbot`, payload);
      
      if (response.data.success) {
        // Lọc và xử lý response.data.message tùy thuộc vào intent
        let responseMessage = response.data.message;
        
        // Kiểm tra dữ liệu nhận được là object
        if (typeof responseMessage === 'object' && responseMessage !== null) {
          // Xử lý các loại message đặc biệt (danh sách sản phẩm)
          if (responseMessage.type === 'relatedProducts' || 
              responseMessage.type === 'discountedProducts' || 
              responseMessage.type === 'priceRangeProducts') {
            // Thêm message dạng products vào state messages
            setMessages((prev) => [
              ...prev,
              {
                type: responseMessage.type,
                text: responseMessage.text,
                products: responseMessage.products,
                sender: "bot"
              }
            ]);
            return; // Kết thúc hàm vì đã xử lý response đặc biệt
          }
        }
        
        // Kiểm tra data đặc biệt từ server
        if (response.data.data && typeof response.data.data === 'object') {
          // Xử lý dạng data đặc biệt (relatedProducts, priceRange, v.v)
          if (response.data.data.type && 
             (response.data.data.type === 'relatedProducts' || 
              response.data.data.type === 'discountedProducts' || 
              response.data.data.type === 'priceRangeProducts')) {
            
            // Log để debug
            console.log("Nhận được dữ liệu sản phẩm:", response.data.data);
            
            setMessages((prev) => [
              ...prev,
              {
                type: response.data.data.type,
                text: response.data.data.text,
                products: response.data.data.products,
                sender: "bot"
              }
            ]);
            
            // Cập nhật context
            setConversationContext(prev => ({
              ...prev,
              lastIntent: response.data.intent
            }));
            
            return; // Kết thúc hàm sau khi xử lý
          }
        }
        
        // Xử lý text thông thường
        if (typeof responseMessage === 'string') {
          setMessages((prev) => [
            ...prev,
            { text: responseMessage, sender: "bot" }
          ]);
        } else {
          // Fallback khi message không phải chuỗi
          setMessages((prev) => [
            ...prev,
            { 
              text: "Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.", 
              sender: "bot" 
            }
          ]);
        }

        // Cập nhật context với intent mới nhất
        setConversationContext(prev => ({
          ...prev,
          lastIntent: response.data.intent
        }));
      } else {
        throw new Error(response.data.message || "Đã có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationContext, userId, SERVER_URL]);
  
  // Xử lý khi người dùng click vào câu gợi ý
  const handleSuggestedQuestion = useCallback((question) => {
    setMessages((prev) => [...prev, { text: question, sender: "user" }]);
    handleCustomMessage(question);
  }, [handleCustomMessage]);

  // Hàm xử lý gửi tin nhắn thông thường khi người dùng nhập
  const handleSendMessage = useCallback(() => {
    if (!input.trim()) return;
 
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    handleCustomMessage(userMessage);
  }, [input, handleCustomMessage]);

  // Các tùy chọn cho trang chủ
  const generalOptions = useMemo(() => [
    { 
      icon: <Tag size={16} />,
      text: "Các sản phẩm dưới 100k", 
      query: "Tìm sản phẩm giá dưới 100k",
      color: "bg-blue-100 hover:bg-blue-200 text-blue-700"
    },
    { 
      icon: <Tag size={16} />,
      text: "Sản phẩm đang giảm giá", 
      query: "Sản phẩm nào đang khuyến mãi?",
      color: "bg-red-100 hover:bg-red-200 text-red-700"
    },
    { 
      icon: <ShoppingBag size={16} />,
      text: "Cách đặt hàng", 
      query: "Làm thế nào để đặt hàng trên website?",
      color: "bg-green-100 hover:bg-green-200 text-green-700"
    },
    { 
      icon: <MapPin size={16} />,
      text: "Phí vận chuyển", 
      query: "Có phí vận chuyển không?",
      color: "bg-amber-100 hover:bg-amber-200 text-amber-700"
    }
  ], []);

  // Các câu gợi ý được tạo bằng useMemo để tránh tạo lại mỗi lần render
  const suggestedQuestions = useMemo(() => [
    { text: "Các sản phẩm dưới 100k", handler: () => handleSuggestedQuestion("Tìm sản phẩm giá dưới 100k") },
    { text: "Sản phẩm đang giảm giá", handler: () => handleSuggestedQuestion("Sản phẩm nào đang khuyến mãi?") },
    { text: "Cách đặt hàng?", handler: () => handleSuggestedQuestion("Làm thế nào để đặt hàng trên website?") },
    { text: "Phí vận chuyển", handler: () => handleSuggestedQuestion("Có phí vận chuyển không?") }
  ], [handleSuggestedQuestion]);

  // Render message based on type
  const renderMessage = useCallback((msg, index) => {
    if (msg.showOptions) {
      const options = generalOptions;
      
      return (
        <div key={index} className="flex justify-start w-full mb-4">
          <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl max-w-[90%]">
            <p className="mb-3 font-medium">{msg.text}</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {options.map((option, i) => (
                <button
                  key={`option-${i}`}
                  onClick={() => handleSuggestedQuestion(option.query)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${option.color} transition-colors text-left text-xs font-medium`}
                >
                  {option.icon}
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    if (msg.type === 'relatedProducts' || msg.type === 'discountedProducts' || msg.type === 'priceRangeProducts') {
      return (
        <div key={index} className="flex justify-start w-full">
          <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl max-w-[90%]">
            <p className="mb-2 font-medium">{typeof msg.text === 'string' ? msg.text : 'Sản phẩm liên quan:'}</p>
            <div className="grid grid-cols-2 gap-2">
              {Array.isArray(msg.products) && msg.products.map((product, i) => (
                <div 
                  key={`product-${i}-${product.slug || i}`} 
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-white"
                  onClick={() => handleProductClick(product.slug)}
                >
                  <div className="h-24 overflow-hidden relative">
                    <img 
                      src={getProductImageUrl(product.image)}
                      alt={product.name || 'Sản phẩm'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://bizweb.dktcdn.net/thumb/large/100/360/151/products/5-fc8bf88b-59ce-4bb7-8b57-1e9cc2c5bfdb.jpg?v=1625689306000';
                      }}
                    />
                    {product.discount && (
                      <div className="absolute top-0 left-0 bg-red-500 text-white text-xs p-1 rounded-br-md">
                        -{product.discount}%
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 p-1 bg-green-500 rounded-tl-md">
                      <ExternalLink size={14} className="text-white" />
                    </div>
                  </div>
                  <div className="p-2">
                    <h4 className="text-xs font-medium line-clamp-2">{product.name || 'Sản phẩm không tên'}</h4>
                    {product.promotionalPrice ? (
                      <div className="flex flex-col">
                        <p className="text-xs text-red-600 font-semibold">{formatCurrency(product.promotionalPrice)}</p>
                        <p className="text-xs text-gray-500 line-through">{formatCurrency(product.price || 0)}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-green-600 font-semibold">{formatCurrency(product.price || 0)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // Default text message
    return (
      <div
        key={index}
        className={`flex ${
          msg.sender === "user" ? "justify-end" : "justify-start"
        } mb-2`}
      >
        <div
          className={`max-w-[80%] px-4 py-2 rounded-2xl ${
            msg.sender === "user"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {typeof msg.text === 'string' ? (
            msg.text.split('\n').map((line, i) => (
              <p key={`line-${i}`}>{line}</p>
            ))
          ) : (
            <p>{msg.text || 'Không có nội dung'}</p>
          )}
        </div>
      </div>
    );
  }, [getProductImageUrl, handleProductClick, handleSuggestedQuestion, generalOptions]);

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


