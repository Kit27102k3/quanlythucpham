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
import {authApi} from "../../../api/authApi";
import { formatCurrency } from "../../../utils/formatCurrency";
// Custom Scrollbar Thumb component
const CustomThumb = ({ style, ...props }) => {
  const thumbStyle = {
    backgroundColor: 'rgba(81, 170, 27, 0.5)',
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
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollbarsRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState({
    userImage: "",
    userName: "Khách hàng"
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [chatProduct, setChatProduct] = useState(null);
  const [productMessageSent, setProductMessageSent] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
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
  
  // Lấy thông tin người dùng
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      
      // Thử lấy thông tin từ API profile
      try {
        const response = await authApi.getProfile();
        
        if (response.data && response.data.user) {
          const firstName = response.data.user.firstName || '';
          const lastName = response.data.user.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          setUserInfo({
            userImage: response.data.user.userImage || "",
            userName: fullName || "Khách hàng"
          });
          
          // Lưu thông tin avatar vào localStorage để sử dụng ngay cả khi API chậm
          if (response.data.user.userImage) {
            localStorage.setItem("userAvatar", response.data.user.userImage);
            setAvatarUrl(response.data.user.userImage);
          }
          return;
        }
      } catch (profileError) {
        console.error("Error fetching from profile API:", profileError);
      }
      
      // Nếu không lấy được từ API profile, thử từ API user_profile
      const response = await axios.get(`${API_URLS.USER_PROFILE}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.user) {
        const firstName = response.data.user.firstName || '';
        const lastName = response.data.user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        setUserInfo({
          userImage: response.data.user.userImage || "",
          userName: fullName || "Khách hàng"
        });
        
        // Lưu thông tin avatar vào localStorage
        if (response.data.user.userImage) {
          localStorage.setItem("userAvatar", response.data.user.userImage);
          setAvatarUrl(response.data.user.userImage);
        }
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      // Nếu có lỗi, thử dùng dữ liệu từ localStorage
      const cachedAvatar = localStorage.getItem("userAvatar");
      if (cachedAvatar) {
        setAvatarUrl(cachedAvatar);
        setUserInfo(prev => ({
          ...prev,
          userImage: cachedAvatar
        }));
      }
      
      // Thử lấy tên từ localStorage
      const fullName = localStorage.getItem("fullName");
      if (fullName) {
        setUserInfo(prev => ({
          ...prev,
          userName: fullName
        }));
      }
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
      
      // Nếu đăng nhập, lấy thông tin người dùng
      if (isLoggedIn) {
        fetchUserInfo();
      }
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
          
          // Sắp xếp tin nhắn theo thời gian tăng dần
          const sortedMessages = Array.isArray(data) ? [...data].sort((a, b) => {
            // So sánh timestamp để sắp xếp theo thời gian tăng dần
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }) : [];
          
          // Kiểm tra sự khác biệt về số lượng tin nhắn
          const currentMessages = messagesRef.current;
          const messagesCount = currentMessages.length;
          const dataCount = sortedMessages.length;
          
          // Nếu không có thay đổi về số lượng, kiểm tra tin nhắn cuối cùng
          if (messagesCount === dataCount && messagesCount > 0) {
            const lastMessageId = currentMessages[messagesCount - 1].id;
            const lastDataId = sortedMessages[dataCount - 1].id;
            
            if (lastMessageId === lastDataId) {
              // Không có thay đổi, không cần cập nhật
              return;
            }
          }
          
          // Có thay đổi
          setMessages(sortedMessages);
          
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
      
      // Đảm bảo tin nhắn được sắp xếp theo thời gian tăng dần
      const sortedMessages = Array.isArray(data) ? [...data].sort((a, b) => {
        // So sánh timestamp để sắp xếp theo thời gian tăng dần
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }) : [];
      
      setMessages(sortedMessages);
      
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

  useEffect(() => {
    if (userId) {
      authApi
        .getProfile()
        .then((response) => {
          if (response.data && response.data.userImage) {
            setAvatarUrl(response.data.userImage);
          } else {
            setAvatarUrl("https://www.gravatar.com/avatar/?d=mp");
          }
        })
        .catch((error) => {
          console.error("Error fetching user profile:", error);
          setAvatarUrl("https://www.gravatar.com/avatar/?d=mp");
        });
    }
  }, [userId]);

  // Hàm gửi tin nhắn
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
      setNewMessage(""); // Clear input
      
      // Gửi tin nhắn lên server với retry logic
      let retries = 3;
      let success = false;
      let sentMessage = null;
      
      // Scroll xuống để xem tin nhắn mới
      setTimeout(scrollToBottom, 100);
      
      while (retries > 0 && !success) {
        try {
          // Gửi tin nhắn lên server với userId
          sentMessage = await messagesApi.sendMessage({
            text: newMessage,
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

  // Render avatar người dùng
  const renderUserAvatar = () => {
    // Ưu tiên dùng ảnh từ state userInfo
    if (userInfo.userImage) {
      return (
        <Avatar 
          image={userInfo.userImage} 
          size="small"
          shape="circle"
          className="border-2 border-[#51aa1b]"
        />
      );
    }
    
    // Tiếp theo, dùng ảnh từ state avatarUrl nếu có
    if (avatarUrl) {
      return (
        <Avatar 
          image={avatarUrl} 
          size="small"
          shape="circle"
          className="border-2 border-[#51aa1b]"
        />
      );
    }
    
    // Thử lấy từ localStorage nếu state chưa có
    const cachedAvatar = localStorage.getItem("userAvatar");
    if (cachedAvatar) {
      return (
        <Avatar 
          image={cachedAvatar} 
          size="small"
          shape="circle"
          className="border-2 border-[#51aa1b]"
        />
      );
    }
    
    // Fallback về avatar mặc định
    return (
      <Avatar 
        icon="pi pi-user" 
        size="small"
        style={{ backgroundColor: "#51aa1b" }}
        className="border-2 border-white"
      />
    );
  };

  // Lấy thông tin sản phẩm từ localStorage khi component được mount
  useEffect(() => {
    // Kiểm tra nếu đã gửi tin nhắn sản phẩm thì không cần làm gì nữa
    if (productMessageSent) return;
    
    const getChatProduct = () => {
      try {
        const productData = localStorage.getItem('chatProduct');
        
        if (productData) {
          const parsedProduct = JSON.parse(productData);
          
          // Kiểm tra nếu đã tải sản phẩm trước đó với ID giống nhau, không cần tải lại
          if (chatProduct && chatProduct.id === parsedProduct.id) {
            return;
          }
          
          // Đảm bảo luôn có URL hình ảnh hợp lệ
          if (!parsedProduct.image || parsedProduct.image === "undefined" || parsedProduct.image === "null") {
            parsedProduct.image = "https://via.placeholder.com/100x100.png?text=No+Image";
          } else if (!parsedProduct.image.includes('cloudinary.com') && !parsedProduct.image.startsWith('http')) {
            // Đảm bảo URL hình ảnh là tuyệt đối (chỉ với URL không phải Cloudinary)
            parsedProduct.image = window.location.origin + (parsedProduct.image.startsWith('/') ? '' : '/') + parsedProduct.image;
          }
          
          // Cập nhật state với thông tin sản phẩm để hiển thị thẻ sản phẩm
          setChatProduct(parsedProduct);
          
          // Tạo một tin nhắn mới về sản phẩm nếu không có tin nhắn nào và đang trong trang tin nhắn
          if (inProfile && messages.length === 0 && !productMessageSent) {
            // Tạo tin nhắn về sản phẩm
            const productMessage = {
              sender: "user",
              text: `Tôi muốn hỏi về sản phẩm: ${parsedProduct.name}\nGiá: ${formatCurrency(parsedProduct.price)}đ\nXem thêm: ${parsedProduct.url || window.location.origin}`,
              createdAt: new Date(),
              read: false
            };
            
            // Gửi tin nhắn lên server
            const userId = localStorage.getItem("userId");
            if (isAuthenticated && userId) {
              messagesApi.sendMessage({
                text: productMessage.text,
                sender: "user",
                receiverId: "admin",
                userId: userId
              }).then(() => {
                // Cập nhật tin nhắn và đánh dấu đã gửi
                fetchMessages();
                setProductMessageSent(true);
              }).catch(error => {
                console.error("Lỗi khi gửi tin nhắn sản phẩm:", error);
              });
            }
          }
          
          // Đánh dấu đã gửi tin nhắn để tránh gửi tự động
          setProductMessageSent(true);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin sản phẩm từ localStorage:", error);
      }
    };
    
    getChatProduct();
    
    // Không cần gọi lại nhiều lần, chỉ cần gọi một lần khi mount
  }, [productMessageSent, chatProduct, isAuthenticated, inProfile, messages.length, fetchMessages]);

  // Render thẻ sản phẩm trong tin nhắn trong style giống như Shopee
  const renderProductCard = () => {
    if (!chatProduct) return null;
    
    // Đảm bảo URL hình ảnh là một chuỗi hợp lệ
    let productImage = chatProduct.image || "";
    
    // Không sửa đổi URL Cloudinary
    if (!productImage.includes('cloudinary.com') && !productImage.startsWith('http')) {
      productImage = window.location.origin + (productImage.startsWith('/') ? '' : '/') + productImage;
    }
    
    return (
      <div className="bg-gray-100 p-3 rounded-lg shadow-sm border border-gray-200 mt-2 mb-4">
        <div className="text-sm text-gray-600 mb-2">Bạn đang trao đổi với Người bán về sản phẩm này</div>
        <div className="flex items-start bg-white p-2 rounded-md">
          {productImage ? (
            <img 
              src={productImage} 
              alt={chatProduct.name}
              className="w-16 h-16 object-cover rounded-md mr-3"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/100x100.png?text=No+Image";
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
              <i className="pi pi-image text-gray-400"></i>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{chatProduct.name}</h4>
            <p className="text-sm text-[#ee4d2d] font-medium">
              {chatProduct.price ? formatCurrency(chatProduct.price) : "Liên hệ"}đ
            </p>
            <a 
              href={chatProduct.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
            >
              Xem chi tiết sản phẩm
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Thay thế bằng hàm để lưu trữ dữ liệu sản phẩm lâu dài
  const savePermanentProductInfo = (product) => {
    if (!product) return;
    
    try {
      // Thêm timestamp để biết thời điểm lưu
      const productWithTimestamp = {
        ...product,
        timestamp: Date.now(),
        permanent: true // Đánh dấu lưu lâu dài
      };
      
      // Lưu vào localStorage
      localStorage.setItem('chatProduct', JSON.stringify(productWithTimestamp));
      
      return true;
    } catch (error) {
      console.error("Lỗi khi lưu thông tin sản phẩm lâu dài:", error);
      return false;
    }
  };

  // Debug function - Hiển thị dữ liệu sản phẩm từ localStorage
  const debugShowProductInfo = () => {
    try {
      const productData = localStorage.getItem('chatProduct');
      
      if (productData) {
        const parsedProduct = JSON.parse(productData);
        
        // Lưu lại thông tin mới với hình ảnh cố định từ Cloudinary
        const updatedProduct = {
          ...parsedProduct,
          image: "https://res.cloudinary.com/drlxpdaub/image/upload/v1745155611/ac3tbd4pj5zx56tgxj4b.webp"
        };
        
        // Lưu lâu dài
        savePermanentProductInfo(updatedProduct);
        
        // Cập nhật state
        setChatProduct(updatedProduct);
        setProductMessageSent(false);
        
        toast.success("Đã cập nhật thông tin sản phẩm với hình ảnh Cloudinary");
      } else {
        // Tạo mới thông tin sản phẩm nếu không có
        const dummyProduct = {
          id: "6825b70d2c66cb94fd6b5539",
          name: "Lê xanh Mỹ",
          price: 230000,
          image: "https://res.cloudinary.com/drlxpdaub/image/upload/v1745155611/ac3tbd4pj5zx56tgxj4b.webp", 
          url: "http://localhost:3000/chi-tiet-san-pham/le-xanh-my",
          timestamp: Date.now()
        };
        
        // Lưu lâu dài
        savePermanentProductInfo(dummyProduct);
        
        // Cập nhật state
        setChatProduct(dummyProduct);
        setProductMessageSent(false);
        
        toast.success("Đã tạo thông tin sản phẩm mẫu");
      }
    } catch (error) {
      console.error("Debug - Lỗi khi đọc/ghi localStorage:", error);
      toast.error("Lỗi khi xử lý dữ liệu sản phẩm");
    }
  };

  // Tự động hiển thị thẻ sản phẩm khi có tin nhắn đầu tiên 
  useEffect(() => {
    if (messages.length > 0 && !chatProduct) {
      // Kiểm tra xem trong tin nhắn có tin nhắn về sản phẩm không
      const productMessage = messages.find(msg => 
        msg.text && msg.text.includes('Tôi muốn hỏi về sản phẩm:')
      );
      
      if (productMessage) {
        // Đã tìm thấy tin nhắn về sản phẩm, thử lấy thông tin từ localStorage
        try {
          const productData = localStorage.getItem('chatProduct');
          if (productData) {
            const parsedProduct = JSON.parse(productData);
            
            // Kiểm tra dữ liệu
            if (!parsedProduct.image || !parsedProduct.image.includes('cloudinary.com')) {
              // Sửa URL hình ảnh nếu không phải Cloudinary
              parsedProduct.image = "https://res.cloudinary.com/drlxpdaub/image/upload/v1745155611/ac3tbd4pj5zx56tgxj4b.webp";
              
              // Lưu lại
              savePermanentProductInfo(parsedProduct);
            }
            
            // Cập nhật state
            setChatProduct(parsedProduct);
          } else {
            // Nếu không có dữ liệu, tạo giả từ tin nhắn
            const productName = productMessage.text.split('\n')[0].replace('Tôi muốn hỏi về sản phẩm:', '').trim();
            const productPrice = productMessage.text.split('\n')[1].replace('Giá:', '').trim().replace(/[^\d]/g, '');
            const productUrl = productMessage.text.split('\n')[2].replace('Xem thêm:', '').trim();
            
            const dummyProduct = {
              id: "auto_" + Date.now(),
              name: productName || "Lê xanh Mỹ",
              price: parseInt(productPrice) || 230000,
              image: "https://res.cloudinary.com/drlxpdaub/image/upload/v1745155611/ac3tbd4pj5zx56tgxj4b.webp",
              url: productUrl || "http://localhost:3000/chi-tiet-san-pham/le-xanh-my"
            };
            
            savePermanentProductInfo(dummyProduct);
            setChatProduct(dummyProduct);
          }
        } catch (error) {
          console.error("Lỗi khi xử lý thông tin sản phẩm từ tin nhắn:", error);
        }
      }
    }
  }, [messages, chatProduct]);

  // Giao diện cho Profile
  if (inProfile) {
    return (
      <div className="w-full h-full bg-white rounded-lg shadow-sm p-4 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <Toaster position="bottom-right" richColors />
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#51aa1b] to-[#8bc34a] p-3 flex items-center mb-4 rounded-lg shrink-0 shadow-md">
          <Avatar 
            icon="pi pi-user" 
            className="mr-2 shadow-sm" 
            style={{ backgroundColor: "#fff", color: "#51aa1b" }}
          />
          <div className="flex-1">
            <h3 className="text-white font-medium text-sm">Hỗ trợ trực tuyến</h3>
            <p className="text-white text-xs opacity-90">Chúng tôi sẽ phản hồi trong thời gian sớm nhất</p>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 p-3 overflow-hidden" style={{ minHeight: '300px' }}>
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <i className="pi pi-lock text-4xl mb-2 text-[#51aa1b] opacity-60"></i>
              <p className="text-sm">Vui lòng đăng nhập để sử dụng chat</p>
              <Button label="Đăng nhập" className="mt-2 p-button-sm bg-[#51aa1b] border-[#51aa1b] hover:bg-[#429214]" onClick={handleLogin} />
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-full">
              <i className="pi pi-spin pi-spinner text-[#51aa1b]"></i>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <i className="pi pi-comments text-4xl mb-2 text-[#51aa1b] opacity-60"></i>
              <p className="text-sm">Hãy bắt đầu cuộc trò chuyện với chúng tôi</p>
              
              {/* Hiển thị thẻ sản phẩm nếu có - luôn hiển thị */}
              {chatProduct && (
                <div className="w-full max-w-md mt-4">
                  {renderProductCard()}
                </div>
              )}
              
              {/* Nút debug */}
              <button 
                onClick={debugShowProductInfo} 
                className="mt-4 px-3 py-1 bg-gray-200 rounded text-xs text-gray-600 hover:bg-gray-300"
              >
                Fix hình ảnh sản phẩm
              </button>
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
              <div className="flex flex-col gap-4 px-2">
                {/* Hiển thị thẻ sản phẩm trước các tin nhắn */}
                {chatProduct && (
                  <div className="w-full mt-2 mb-4">
                    {renderProductCard()}
                  </div>
                )}
                
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
                        shape="circle"
                      />
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg shadow-md ${
                        message.sender === "user"
                          ? "bg-gradient-to-r from-[#e7ffd9] to-[#ddf9ce] text-gray-800 rounded-tr-none"
                          : "bg-gradient-to-r from-[#f5f7fa] to-[#e8eaed] text-gray-800 rounded-tl-none"
                      }`}
                    >
                      <div className="text-xs font-semibold mb-1">
                        {message.sender === "user" ? userInfo.userName || "Bạn" : "Nhân viên hỗ trợ"}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                      <div
                        className={`text-xs mt-1 flex items-center justify-end ${
                          message.sender === "user" ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        {formatMessageTime(message.createdAt)}
                        {message.sender === "user" && (
                          <i
                            className={`pi ${
                              message.read ? "pi-check-circle text-[#51aa1b]" : "pi-check text-gray-400"
                            } ml-1`}
                          ></i>
                        )}
                      </div>
                    </div>
                    {message.sender === "user" && (
                      <div className="ml-2 mt-1 flex flex-col items-center">
                        {renderUserAvatar()}
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
          <div className="p-3 border-t flex items-center bg-gray-50 mt-auto shrink-0 rounded-b-lg">
            <InputText
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 text-sm border-gray-300 rounded-full p-2 px-4 border focus:border-[#51aa1b] focus:shadow-[0_0_0_2px_rgba(81,170,27,0.2)]"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button
              icon="pi pi-send"
              className="p-button-rounded ml-2 bg-[#51aa1b] text-white shadow-md border-[#51aa1b] hover:bg-[#429214]"
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
          className="p-button-rounded p-button-lg shadow-lg bg-[#51aa1b] border-[#51aa1b] hover:bg-[#429214]"
        />
      </div>
      
      {/* Chat box */}
      {chatOpen && (
        <div className="fixed right-5 bottom-20 z-50 w-80 md:w-96 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-200 transition-all duration-300" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#51aa1b] to-[#8bc34a] p-3 flex items-center shrink-0">
            <Avatar 
              icon="pi pi-user" 
              className="mr-2" 
              style={{ backgroundColor: "#fff", color: "#51aa1b" }}
            />
            <div className="flex-1">
              <h3 className="text-white font-medium text-sm">Hỗ trợ trực tuyến</h3>
              <p className="text-white text-xs opacity-90">Chúng tôi sẽ phản hồi trong thời gian sớm nhất</p>
            </div>
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-sm p-button-text p-button-outlined text-white"
              onClick={() => setChatOpen(false)}
            />
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-3 overflow-hidden" style={{ minHeight: '300px' }}>
            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <i className="pi pi-lock text-4xl mb-2 text-[#51aa1b] opacity-60"></i>
                <p className="text-sm">Vui lòng đăng nhập để sử dụng chat</p>
                <Button label="Đăng nhập" className="mt-2 p-button-sm bg-[#51aa1b] border-[#51aa1b] hover:bg-[#429214]" onClick={handleLogin} />
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center h-full">
                <i className="pi pi-spin pi-spinner text-[#51aa1b]"></i>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <i className="pi pi-comments text-4xl mb-2 text-[#51aa1b] opacity-60"></i>
                <p className="text-sm">Hãy bắt đầu cuộc trò chuyện với chúng tôi</p>
                
                {/* Hiển thị thẻ sản phẩm nếu có - luôn hiển thị */}
                {chatProduct && (
                  <div className="w-full max-w-md mt-4">
                    {renderProductCard()}
                  </div>
                )}
                
                {/* Nút debug */}
                <button 
                  onClick={debugShowProductInfo} 
                  className="mt-4 px-3 py-1 bg-gray-200 rounded text-xs text-gray-600 hover:bg-gray-300"
                >
                  Fix hình ảnh sản phẩm
                </button>
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
                <div className="flex flex-col gap-4 px-2">
                  {/* Hiển thị thẻ sản phẩm trước các tin nhắn */}
                  {chatProduct && (
                    <div className="w-full mt-2 mb-4">
                      {renderProductCard()}
                    </div>
                  )}
                  
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
                          shape="circle"
                        />
                      )}
                      <div
                        className={`max-w-[80%] p-3 rounded-lg shadow-md ${
                          message.sender === "user"
                            ? "bg-gradient-to-r from-[#e7ffd9] to-[#ddf9ce] text-gray-800 rounded-tr-none"
                            : "bg-gradient-to-r from-[#f5f7fa] to-[#e8eaed] text-gray-800 rounded-tl-none"
                        }`}
                      >
                        <div className="text-xs font-semibold mb-1">
                          {message.sender === "user" ? userInfo.userName || "Bạn" : "Nhân viên hỗ trợ"}
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                        <div
                          className={`text-xs mt-1 flex items-center justify-end ${
                            message.sender === "user" ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          {formatMessageTime(message.createdAt)}
                          {message.sender === "user" && (
                            <i
                              className={`pi ${
                                message.read ? "pi-check-circle text-[#51aa1b]" : "pi-check text-gray-400"
                              } ml-1`}
                            ></i>
                          )}
                        </div>
                      </div>
                      {message.sender === "user" && (
                        <div className="ml-2 mt-1 flex flex-col items-center">
                          {renderUserAvatar()}
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
                className="flex-1 text-sm border-gray-300 rounded-full p-2 px-4 border focus:border-[#51aa1b] focus:shadow-[0_0_0_2px_rgba(81,170,27,0.2)]"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button
                icon="pi pi-send"
                className="p-button-rounded ml-2 bg-[#51aa1b] text-white shadow-md border-[#51aa1b] hover:bg-[#429214]"
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