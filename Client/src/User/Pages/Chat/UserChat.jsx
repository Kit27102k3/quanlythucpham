/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import axios from "axios";
import { API_URLS } from "../../../config/apiConfig";
import { useNavigate } from "react-router-dom";
import messagesApi from "../../../api/messagesApi";
import "../../../Admin/Pages/styles.css"; // Import CSS cho custom scrollbar
import { toast, Toaster } from "sonner"; // Thay thế Toast từ PrimeReact bằng sonner

const UserChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Hàm refresh token khi token hết hạn
  const refreshUserToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        return false;
      }

      const response = await axios.post(`${API_URLS.AUTH}/refresh-token`, {
        refreshToken,
      });

      if (response.data && response.data.token) {
        localStorage.setItem("accessToken", response.data.token);

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

  // Load tin nhắn khi component mount và thiết lập auto-refresh
  useEffect(() => {
    if (isAuthenticated && chatOpen) {
      fetchMessages();
      
      // Thiết lập auto-refresh mỗi 15 giây thay vì 3 giây
      const intervalId = setInterval(() => {
        fetchMessages();
      }, 15000);
      
      // Dọn dẹp interval khi component unmount hoặc chatOpen thay đổi
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated, chatOpen]);

  // Load tin nhắn từ localStorage khi component mount
  useEffect(() => {
    const cachedMessages = localStorage.getItem("userChatMessages");
    if (cachedMessages) {
      try {
        // Lấy userId
        const userId =
          localStorage.getItem("userId") ||
          (() => {
            const userInfo = localStorage.getItem("userInfo");
            if (userInfo) {
              try {
                const parsed = JSON.parse(userInfo);
                return parsed.id || parsed._id;
              } catch {
                return null;
              }
            }
            return null;
          })();

        // Nếu có userId, chỉ load tin nhắn của đúng user
        if (userId) {
          const parsedMessages = JSON.parse(cachedMessages);
          setMessages(parsedMessages);
        } else {
          // Xóa cache nếu không xác định được user
          console.log("Không xác định được userId, xóa cache");
          localStorage.removeItem("userChatMessages");
        }
      } catch (error) {
        localStorage.removeItem("userChatMessages"); // Xóa cache nếu corrupt
        console.error("Lỗi khi parse tin nhắn từ localStorage:", error);
      }
    }
  }, []);

  // Scroll xuống tin nhắn mới nhất
  useEffect(() => {
    scrollToBottom();
  }, [messages, chatOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogin = () => {
    navigate("/dang-nhap");
    setChatOpen(false);
  };

  // Fetch tin nhắn từ API và lưu vào localStorage để duy trì khi load lại trang
  const fetchMessages = async () => {
    // Thêm throttle thông qua biến lastFetchTime
    const now = new Date().getTime();
    const lastFetchTime = fetchMessages.lastCall || 0;
    
    // Chỉ fetch nếu đã trôi qua ít nhất 5 giây kể từ lần fetch cuối
    if (now - lastFetchTime < 5000) {
      return;
    }
    
    // Cập nhật thời gian gọi cuối cùng
    fetchMessages.lastCall = now;
    
    try {
      if (!isAuthenticated) return;
      
      setLoading(true);
      
      // Lấy tin nhắn từ server
      const data = await messagesApi.getMessagesByUserId("admin");
      
      // Lưu vào localStorage
      if (data && data.length > 0) {
        localStorage.setItem('userChatMessages', JSON.stringify(data));
      }
      
      setMessages(data);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error);
      toast.error("Không thể tải tin nhắn. Vui lòng thử lại sau.");
      
      // Nếu có lỗi, load từ localStorage nếu có
      const cachedMessages = localStorage.getItem('userChatMessages');
      if (cachedMessages) {
        setMessages(JSON.parse(cachedMessages));
      }
      
      setLoading(false);
    }
  };

  // Gửi tin nhắn và cập nhật localStorage
  const sendMessage = async () => {
    if (!newMessage.trim() || !isAuthenticated) return;

    try {
      // Lấy userId từ localStorage
      let userId = localStorage.getItem("userId");

      // Nếu không tìm thấy userId, thử lấy từ token
      if (!userId) {
        // Thử lấy từ token được decode
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
          try {
            const parsedInfo = JSON.parse(userInfo);
            userId = parsedInfo.id || parsedInfo._id;
          } catch (error) {
            console.error("Lỗi khi parse userInfo:", error);
          }
        }
      }

      if (!userId) {
        toast.error("Không thể xác định người dùng, vui lòng đăng nhập lại");
        return;
      }

      // Thêm tin nhắn vào UI trước
      const tempMessage = {
        id: Date.now(),
        text: newMessage,
        sender: "user",
        read: false,
        createdAt: new Date(),
      };

      // Cập nhật state và localStorage
      const updatedMessages = [...messages, tempMessage];
      setMessages(updatedMessages);
      localStorage.setItem("userChatMessages", JSON.stringify(updatedMessages));

      setNewMessage("");

      // Gửi tin nhắn lên server với userId
      const sentMessage = await messagesApi.sendMessage({
        text: newMessage,
        sender: "user",
        receiverId: "admin",
        userId: userId, // Thêm userId vào request
      });

      const finalMessages = messages.map((msg) =>
        msg.id === tempMessage.id ? sentMessage : msg
      );

      setMessages(finalMessages);
      localStorage.setItem("userChatMessages", JSON.stringify(finalMessages));

      // Scroll xuống dưới
      scrollToBottom();

      // Gọi ngay fetchMessages để kiểm tra tin nhắn đã được lưu chưa
      setTimeout(() => {
        console.log("Kiểm tra lại tin nhắn sau khi gửi");
        fetchMessages();
      }, 1000);
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại sau.");

      // Xóa tin nhắn tạm nếu gửi lỗi và cập nhật localStorage
      const updatedMessages = messages.filter((msg) => msg.id !== Date.now());
      setMessages(updatedMessages);
      localStorage.setItem("userChatMessages", JSON.stringify(updatedMessages));
    }
  };

  // Format thời gian tin nhắn
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <Toaster position="top-right" richColors />

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
        <div
          className="fixed right-5 bottom-20 z-50 w-80 md:w-96 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-200 transition-all duration-300"
          style={{ maxHeight: "calc(100vh - 100px)" }}
        >
          {/* Header */}
          <div className="bg-primary p-3 flex items-center shrink-0">
            <Avatar icon="pi pi-user" className="mr-2" />
            <div className="flex-1">
              <h3 className="text-black font-medium text-sm">
                Hỗ trợ trực tuyến
              </h3>
              <p className="text-black text-xs opacity-80">
                Chúng tôi sẽ phản hồi trong thời gian sớm nhất
              </p>
            </div>
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-sm p-button-text p-button-outlined text-black"
              onClick={() => setChatOpen(false)}
            />
          </div>

          {/* Messages */}
          <div
            className="flex-1 p-3 custom-scrollbar force-scrollbar"
            style={{ minHeight: "300px" }}
          >
            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <i className="pi pi-lock text-4xl mb-2 text-primary opacity-60"></i>
                <p className="text-sm">Vui lòng đăng nhập để sử dụng chat</p>
                <Button
                  label="Đăng nhập"
                  className="mt-2 p-button-sm"
                  onClick={handleLogin}
                />
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center h-full">
                <i className="pi pi-spin pi-spinner text-primary"></i>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <i className="pi pi-comments text-4xl mb-2 text-primary opacity-60"></i>
                <p className="text-sm">
                  Hãy bắt đầu cuộc trò chuyện với chúng tôi
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                        message.sender === "user"
                          ? "bg-primary text-black"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div
                        className={`text-xs mt-1 flex items-center justify-end ${
                          message.sender === "user"
                            ? "text-primary-100"
                            : "text-gray-500"
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
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {isAuthenticated && (
            <div className="p-3 border-t flex items-center bg-gray-50 mt-auto shrink-0">
              <InputText
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 text-sm border-gray-300 rounded-full"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button
                icon="pi pi-send"
                className="p-button-rounded ml-2 shadow-sm"
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

export default UserChat;
