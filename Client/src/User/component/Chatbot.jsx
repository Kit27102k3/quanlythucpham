/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, Minus, ExternalLink } from "lucide-react";
import axios from "axios"; // Thêm import axios
import { useNavigate } from "react-router-dom";
import formatCurrency from "../Until/FotmatPrice";

const API_URL = "http://localhost:8080/api/chatbot";

const Chatbot = ({ productId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  const [conversationContext, setConversationContext] = useState({
    productId: productId,
    lastIntent: null,
    messageHistory: []
  });
  
  const userId = localStorage.getItem("userId");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Cập nhật context khi productId thay đổi
  useEffect(() => {
    if (productId) {
      setConversationContext(prev => ({
        ...prev,
        productId: productId
      }));
    }
  }, [productId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && isFirstOpen) {
      let welcomeMessage = "Xin chào! Tôi là trợ lý ảo. Tôi có thể giúp gì cho bạn? Bạn có thể hỏi về:\n- Thông tin sản phẩm\n- Giá cả\n- Công dụng\n- Xuất xứ\n- Thành phần\n- Cách sử dụng\n- Sản phẩm liên quan";
      
      if (productId) {
        welcomeMessage = "Xin chào! Bạn muốn biết thêm thông tin gì về sản phẩm này? Bạn có thể hỏi về:\n- Giá cả\n- Công dụng\n- Xuất xứ\n- Thành phần\n- Cách sử dụng\n- Sản phẩm liên quan";
      }

      setMessages((prev) => [...prev, { text: welcomeMessage, sender: "bot" }]);
      setIsFirstOpen(false);
    }
  }, [isOpen, isFirstOpen, productId]);

  const getProductImageUrl = (url) => {
    // Sử dụng ảnh mặc định nếu không có URL
    if (!url) return 'https://bizweb.dktcdn.net/thumb/large/100/360/151/products/5-fc8bf88b-59ce-4bb7-8b57-1e9cc2c5bfdb.jpg?v=1625689306000';
    
    // URL đã là đầy đủ hoặc là URL tương đối
    if (url.startsWith('http')) {
      return url;
    } else if (url === 'default-product.jpg') {
      return 'https://bizweb.dktcdn.net/thumb/large/100/360/151/products/5-fc8bf88b-59ce-4bb7-8b57-1e9cc2c5bfdb.jpg?v=1625689306000';
    } else if (url.startsWith('/')) {
      return `http://localhost:8081${url}`;
    } else {
      return `http://localhost:8081/${url}`;
    }
  };

  const handleProductClick = (slug) => {
    if (!slug) return;
    
    navigate(`/chi-tiet-san-pham/${slug}`);
    setIsOpen(false); // Đóng chatbot khi chuyển trang
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    setIsLoading(true);

    try {
      // Cập nhật context với tin nhắn mới
      const updatedContext = {
        ...conversationContext,
        messageHistory: [...conversationContext.messageHistory, userMessage]
      };
      setConversationContext(updatedContext);

      const requestData = {
        userId: userId,
        message: userMessage,
        context: updatedContext
      };

      // Chỉ thêm productId vào request nếu nó tồn tại
      if (productId) {
        requestData.productId = productId;
      }

      const response = await axios.post(API_URL, requestData);

      if (response.data.success) {
        // Kiểm tra nếu response chứa dữ liệu cho sản phẩm liên quan hoặc sản phẩm giảm giá
        if (response.data.data && 
            (response.data.intent === 'relatedProducts' || 
             response.data.intent === 'discountedProducts')) {
          const productsData = response.data.data;
          
          setMessages(prev => [
            ...prev,
            {
              type: productsData.type,
              text: productsData.text,
              products: productsData.products,
              sender: 'bot'
            }
          ]);
        } else {
          // Xử lý tin nhắn thông thường
          setMessages((prev) => [
            ...prev,
            { text: response.data.message, sender: "bot" }
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
  };

  // Render message based on type
  const renderMessage = (msg, index) => {
    if (msg.type === 'relatedProducts' || msg.type === 'discountedProducts') {
      return (
        <div key={index} className="flex justify-start w-full">
          <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl max-w-[90%]">
            <p className="mb-2 font-medium">{msg.text}</p>
            <div className="grid grid-cols-2 gap-2">
              {msg.products && msg.products.map((product, i) => (
                <div 
                  key={i} 
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-white"
                  onClick={() => handleProductClick(product.slug)}
                >
                  <div className="h-24 overflow-hidden relative">
                    <img 
                      src={getProductImageUrl(product.image)}
                      alt={product.name} 
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
                    <div className="absolute bottom-0 right-0 p-1 bg-blue-500 rounded-tl-md">
                      <ExternalLink size={14} className="text-white" />
                    </div>
                  </div>
                  <div className="p-2">
                    <h4 className="text-xs font-medium line-clamp-2">{product.name}</h4>
                    {product.promotionalPrice ? (
                      <div className="flex flex-col">
                        <p className="text-xs text-red-600 font-semibold">{formatCurrency(product.promotionalPrice)}</p>
                        <p className="text-xs text-gray-500 line-through">{formatCurrency(product.price)}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-blue-600 font-semibold">{formatCurrency(product.price)}</p>
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
        }`}
      >
        <div
          className={`max-w-[80%] px-4 py-2 rounded-2xl ${
            msg.sender === "user"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {msg.text.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white p-4 cursor-pointer rounded-full shadow-xl hover:bg-blue-600 transition-all duration-300 animate-bounce"
          aria-label="Mở chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="w-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
            <h2 className="text-lg font-semibold">Hỗ Trợ Trực Tuyến</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded-full transition-colors"
              aria-label="Thu nhỏ chat"
            >
              <Minus size={20} />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-3 max-h-80">
            {messages.map((msg, index) => renderMessage(msg, index))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t">
            <div className="flex space-x-2 gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading}
                aria-label="Nhập tin nhắn"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className={`bg-blue-500 text-white p-2 rounded-full transition-all duration-300 ${
                  isLoading || !input.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-600 active:scale-95"
                }`}
                aria-label="Gửi tin nhắn"
              >
                <Send size={30} className="p-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
