import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import axios from "axios";
import { API_URLS } from "../../../config/apiConfig";
import { useNavigate } from "react-router-dom";
import messagesApi from "../../../api/messagesApi";
import '../../../Admin/Pages/styles.css'; // Import CSS cho custom scrollbar
import { toast, Toaster } from 'sonner'; // Thay thế Toast từ PrimeReact bằng sonner
import PropTypes from 'prop-types';
import { UnreadMessagesContext } from "../../Pages/Profile/DefaultProfile";
import { Scrollbars } from 'react-custom-scrollbars-2';

// Custom Scrollbar Thumb component
const CustomThumb = ({ style, ...props }) => {
  const thumbStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    cursor: 'pointer'
  };
  return <div style={{ ...style, ...thumbStyle }} {...props} />;
};

CustomThumb.propTypes = {
  style: PropTypes.object
};

// Đổi interface để hỗ trợ cả tích hợp trong profile và floating chat
const UserChat = ({ inProfile = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollbarsRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  
  // Lấy context để cập nhật số lượng tin nhắn chưa đọc
  const unreadMessagesContext = useContext(UnreadMessagesContext);
  // Sử dụng optional chaining để tránh lỗi khi không có context (ở floating chat)
  const refreshUnreadCount = unreadMessagesContext?.refreshUnreadCount || (() => {});
  
  // Tham chiếu đến messages hiện tại để sử dụng trong interval
  const messagesRef = useRef(messages);
  // Cập nhật tham chiếu mỗi khi messages thay đổi
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  // Tối ưu hàm scrollToBottom để tránh re-render không cần thiết
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollbarsRef.current) {
        scrollbarsRef.current.scrollToBottom();
      }
    }, 100);
  }, []);

  // Hàm refresh token khi token hết hạn
  const refreshUserToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        return false;
      }
      
      const response = await axios.post(`${API_URLS.AUTH}/refresh-token`, { refreshToken });
      
      if (response.data && response.data.token) {
        localStorage.setItem("accessToken", response.data.token);
        console.log("Token refreshed successfully");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  };
  
  // Kiểm tra xem người dùng đã đăng nhập chưa
  useEffect(() => {
    const checkAuthStatus = async () => {
      let accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      
      // Nếu không có token nhưng có refreshToken, thử refresh token
      if (!accessToken && refreshToken) {
        const refreshSuccess = await refreshUserToken();
        if (refreshSuccess) {
          accessToken = localStorage.getItem("accessToken");
        }
      }
      
      // Kiểm tra sau khi đã thử refresh
      const isLoggedIn = !!accessToken;
      setIsAuthenticated(isLoggedIn);
    };
    
    checkAuthStatus();
  }, []);

  // Load tin nhắn - logic khác nhau cho profile và floating chat
  useEffect(() => {
    // Trong profile luôn hiển thị, còn floating thì phụ thuộc chatOpen
    if (isAuthenticated && (inProfile || chatOpen)) {
      fetchMessages();
      
      // Thiết lập auto-refresh nhưng thông minh hơn để tránh render liên tục
      const intervalId = setInterval(async () => {
        try {
          const userId = localStorage.getItem("userId");
          if (!userId) return;
          
          const data = await messagesApi.getMessagesByUserId("admin");
          
          // Kiểm tra sự khác biệt về số lượng tin nhắn
          const currentMessages = messagesRef.current;
          const messagesCount = currentMessages.length;
          const dataCount = data.length;
          
          // Nếu không có thay đổi về số lượng, kiểm tra tin nhắn cuối cùng
          if (messagesCount === dataCount && messagesCount > 0) {
            const lastMessageId = currentMessages[messagesCount - 1].id;
            const lastDataId = data[dataCount - 1].id;
            
            if (lastMessageId === lastDataId) {
              // Không có thay đổi, không cần cập nhật
              return;
            }
          }
          
          // Có thay đổi
          console.log("Phát hiện tin nhắn mới, cập nhật giao diện");
          setMessages(data);
          
          // Cập nhật số lượng tin nhắn chưa đọc trên sidebar nếu cần
          if (typeof refreshUnreadCount === 'function') {
            refreshUnreadCount();
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra tin nhắn mới:", error);
        }
      }, 5000);
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isAuthenticated, chatOpen, inProfile, refreshUnreadCount]);

  // Scroll xuống tin nhắn mới nhất, chỉ khi cần thiết - chạy riêng biệt
  useEffect(() => {
    if ((inProfile || chatOpen) && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  const handleLogin = () => {
    navigate("/dang-nhap");
    if (!inProfile) setChatOpen(false);
  };

  // Fetch tin nhắn từ API
  const fetchMessages = async () => {
    try {
      if (!isAuthenticated) return;
      
      setLoading(true);
      const userId = localStorage.getItem("userId");
      
      // Nếu không có userId, không thể lấy tin nhắn
      if (!userId) {
        setLoading(false);
        return;
      }
      
      // Lấy tin nhắn của người dùng hiện tại với admin
      const data = await messagesApi.getMessagesByUserId("admin");
      setMessages(data);
      
      // Nếu đang ở trang chat, đánh dấu tất cả tin nhắn là đã đọc
      if (inProfile) {
        // Đánh dấu tất cả tin nhắn đã đọc
        await messagesApi.markAllAsRead(userId);
        // Cập nhật số lượng tin nhắn chưa đọc (sẽ là 0 sau khi đánh dấu đã đọc)
        refreshUnreadCount();
      }
      
      setLoading(false);
      
      // Gọi scrollToBottom sau khi cập nhật messages
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error);
      toast.error("Không thể tải tin nhắn. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  // Hàm gửi tin nhắn cải tiến với retry
  const sendMessage = async () => {
    if (!newMessage.trim() || !isAuthenticated) return;
    
    try {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        toast.error("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
        return;
      }
      
      // Thêm tin nhắn vào UI trước
      const tempId = Date.now();
      const tempMessage = {
        id: tempId,
        text: newMessage,
        sender: "user",
        read: false,
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, tempMessage]);
      const messageToSend = newMessage.trim();
      setNewMessage("");
      
      // Gửi tin nhắn lên server với retry logic
      let retries = 3;
      let success = false;
      let sentMessage = null;
      
      console.log("User sending message, userId:", userId);
      
      while (retries > 0 && !success) {
        try {
          // Gửi tin nhắn lên server với userId
          sentMessage = await messagesApi.sendMessage({
            text: messageToSend,
            sender: "user",
            receiverId: "admin",
            userId: userId
          });
          success = true;
        } catch (error) {
          console.error(`Lỗi khi gửi tin nhắn, còn ${retries} lần thử:`, error);
          retries--;
          await new Promise(resolve => setTimeout(resolve, 500)); // Đợi 500ms trước khi thử lại
        }
      }
      
      if (success && sentMessage) {
        // Cập nhật tin nhắn trong state với ID thực tế
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? sentMessage : msg
        ));
        
        // Cập nhật số lượng tin nhắn chưa đọc
        refreshUnreadCount();
        
        // Cuộn xuống dưới sau khi gửi tin nhắn
        setTimeout(scrollToBottom, 200);
        
        // Không cần gọi fetchMessages vì đã cập nhật tin nhắn trực tiếp
      } else {
        // Nếu vẫn thất bại sau nhiều lần thử, hiển thị lỗi và đánh dấu tin nhắn
        toast.error("Không thể gửi tin nhắn. Vui lòng thử lại sau.");
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? {...msg, failed: true} : msg
        ));
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại sau.");
    }
  };

  // Format thời gian tin nhắn
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    
    // Định dạng ngày tháng
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Định dạng giờ phút
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Nếu là ngày hôm nay, chỉ hiển thị giờ:phút
    const today = new Date();
    if (date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear()) {
      return `${hours}:${minutes}`;
    }
    
    // Ngày khác thì hiển thị đầy đủ ngày/tháng/năm giờ:phút
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Giao diện cho Profile
  if (inProfile) {
    return (
      <div className="w-full h-full bg-white rounded-lg shadow-sm p-4 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <Toaster position="bottom-right" richColors />
        
        {/* Header */}
        <div className="bg-primary p-3 flex items-center mb-4 rounded-lg shrink-0">
          <Avatar icon="pi pi-user" className="mr-2" />
          <div className="flex-1">
            <h3 className="text-black font-medium text-sm">Hỗ trợ trực tuyến</h3>
            <p className="text-black text-xs opacity-80">Chúng tôi sẽ phản hồi trong thời gian sớm nhất</p>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 p-3 overflow-hidden" style={{ minHeight: '300px' }}>
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <i className="pi pi-lock text-4xl mb-2 text-primary opacity-60"></i>
              <p className="text-sm">Vui lòng đăng nhập để sử dụng chat</p>
              <Button label="Đăng nhập" className="mt-2 p-button-sm" onClick={handleLogin} />
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-full">
              <i className="pi pi-spin pi-spinner text-primary"></i>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <i className="pi pi-comments text-4xl mb-2 text-primary opacity-60"></i>
              <p className="text-sm">Hãy bắt đầu cuộc trò chuyện với chúng tôi</p>
            </div>
          ) : (
            <Scrollbars
              ref={scrollbarsRef}
              autoHide
              autoHideTimeout={1000}
              autoHideDuration={200}
              renderThumbVertical={props => <CustomThumb {...props} />}
              className="h-full"
            >
              <div className="flex flex-col gap-3 px-2">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.sender === "admin" && (
                      <Avatar 
                        icon="pi pi-user" 
                        className="mr-2 mt-1" 
                        size="small" 
                        style={{ backgroundColor: "#4caf50" }}
                      />
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                        message.sender === "user"
                          ? "bg-primary text-black"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="text-xs font-semibold mb-1">
                        {message.sender === "user" ? "Bạn" : "Nhân viên hỗ trợ"}
                      </div>
                      <p className="text-sm">{message.text}</p>
                      <div
                        className={`text-xs mt-1 flex items-center justify-end ${
                          message.sender === "user" ? "text-primary-100" : "text-gray-500"
                        }`}
                      >
                        {formatMessageTime(message.createdAt)}
                        {message.sender === "user" && (
                          <i
                            className={`pi ${
                              message.read ? "pi-check-circle" : "pi-check"
                            } ml-1`}
                          ></i>
                        )}
                      </div>
                    </div>
                    {message.sender === "user" && (
                      <div className="ml-2 mt-1 flex flex-col items-center">
                        <Avatar 
                          icon="pi pi-user" 
                          size="small"
                          style={{ backgroundColor: "#673ab7" }}
                        />
                        {message.failed && (
                          <Button 
                            icon="pi pi-refresh" 
                            className="p-button-rounded p-button-sm p-button-danger p-button-text mt-1" 
                            tooltip="Thử lại"
                            onClick={() => {
                              // Xóa tin nhắn lỗi và thử gửi lại
                              setMessages(prev => prev.filter(m => m.id !== message.id));
                              setNewMessage(message.text);
                            }} 
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </Scrollbars>
          )}
        </div>
        
        {/* Input */}
        {isAuthenticated && (
          <div className="p-3 border-t flex items-center bg-gray-50 mt-auto shrink-0">
            <InputText
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 text-sm border-gray-300 rounded-full p-2 px-2 border"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button
              icon="pi pi-send"
              className="p-button-rounded ml-2 bg-blue-500 text-white rounded-full cursor-pointer hover:bg-opacity-80"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
            />
          </div>
        )}
      </div>
    );
  }

  // Giao diện floating chat (cũ)
  return (
    <>
      <Toaster position="bottom-right" richColors />
      
      {/* Chat toggle button */}
      <div 
        className="fixed right-5 bottom-5 z-50 cursor-pointer"
        onClick={() => setChatOpen(!chatOpen)}
      >
        <Button
          icon={chatOpen ? "pi pi-times" : "pi pi-comments"}
          className="p-button-rounded p-button-lg shadow-lg"
        />
      </div>
      
      {/* Chat box */}
      {chatOpen && (
        <div className="fixed right-5 bottom-20 z-50 w-80 md:w-96 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-200 transition-all duration-300" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          {/* Header */}
          <div className="bg-primary p-3 flex items-center shrink-0">
            <Avatar icon="pi pi-user" className="mr-2" />
            <div className="flex-1">
              <h3 className="text-black font-medium text-sm">Hỗ trợ trực tuyến</h3>
              <p className="text-black text-xs opacity-80">Chúng tôi sẽ phản hồi trong thời gian sớm nhất</p>
            </div>
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-sm p-button-text p-button-outlined text-black"
              onClick={() => setChatOpen(false)}
            />
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-3 overflow-hidden" style={{ minHeight: '300px' }}>
            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <i className="pi pi-lock text-4xl mb-2 text-primary opacity-60"></i>
                <p className="text-sm">Vui lòng đăng nhập để sử dụng chat</p>
                <Button label="Đăng nhập" className="mt-2 p-button-sm" onClick={handleLogin} />
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center h-full">
                <i className="pi pi-spin pi-spinner text-primary"></i>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <i className="pi pi-comments text-4xl mb-2 text-primary opacity-60"></i>
                <p className="text-sm">Hãy bắt đầu cuộc trò chuyện với chúng tôi</p>
              </div>
            ) : (
              <Scrollbars
                ref={scrollbarsRef}
                autoHide
                autoHideTimeout={1000}
                autoHideDuration={200}
                renderThumbVertical={props => <CustomThumb {...props} />}
                className="h-full"
              >
                <div className="flex flex-col gap-3 px-2">
                  {messages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`flex ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.sender === "admin" && (
                        <Avatar 
                          icon="pi pi-user" 
                          className="mr-2 mt-1" 
                          size="small" 
                          style={{ backgroundColor: "#4caf50" }}
                        />
                      )}
                      <div
                        className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                          message.sender === "user"
                            ? "bg-primary text-black"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <div className="text-xs font-semibold mb-1">
                          {message.sender === "user" ? "Bạn" : "Nhân viên hỗ trợ"}
                        </div>
                        <p className="text-sm">{message.text}</p>
                        <div
                          className={`text-xs mt-1 flex items-center justify-end ${
                            message.sender === "user" ? "text-primary-100" : "text-gray-500"
                          }`}
                        >
                          {formatMessageTime(message.createdAt)}
                          {message.sender === "user" && (
                            <i
                              className={`pi ${
                                message.read ? "pi-check-circle" : "pi-check"
                              } ml-1`}
                            ></i>
                          )}
                        </div>
                      </div>
                      {message.sender === "user" && (
                        <div className="ml-2 mt-1 flex flex-col items-center">
                          <Avatar 
                            icon="pi pi-user" 
                            size="small"
                            style={{ backgroundColor: "#673ab7" }}
                          />
                          {message.failed && (
                            <Button 
                              icon="pi pi-refresh" 
                              className="p-button-rounded p-button-sm p-button-danger p-button-text mt-1" 
                              tooltip="Thử lại"
                              onClick={() => {
                                // Xóa tin nhắn lỗi và thử gửi lại
                                setMessages(prev => prev.filter(m => m.id !== message.id));
                                setNewMessage(message.text);
                              }} 
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </Scrollbars>
            )}
          </div>
          
          {/* Input */}
          {isAuthenticated && (
            <div className="p-3 border-t flex items-center bg-gray-50 mt-auto shrink-0">
              <InputText
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 text-sm border-gray-300 rounded-full p-2 px-2 border"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button
                icon="pi pi-send"
                className="p-button-rounded ml-2 bg-blue-500 text-white rounded-full cursor-pointer hover:bg-opacity-80"
                onClick={sendMessage}
                disabled={!newMessage.trim()}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

UserChat.propTypes = {
  inProfile: PropTypes.bool,
};

export default UserChat; 