/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useRef } from "react";
import messagesApi from "../../api/messagesApi";
import './styles.css'; // Import CSS file for custom styles
import { toast, Toaster } from 'sonner'; // Thêm toast từ Sonner
import { Scrollbars } from 'react-custom-scrollbars-2';

const Messages = () => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef(null);

  // Lấy danh sách liên hệ từ API
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const contactsData = await messagesApi.getAllContacts();
      setContacts(contactsData);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách liên hệ:", error);
      toast.error("Không thể tải danh sách liên hệ");
    } finally {
      setLoading(false);
    }
  };

  // Lấy tin nhắn từ API khi chọn một liên hệ
  const fetchMessages = async (userId) => {
    try {
      setMessagesLoading(true);
      const messagesData = await messagesApi.getMessagesByUserId(userId);
      setMessages(messagesData);
      
      // Đánh dấu tin nhắn đã đọc
      if (messagesData.some(m => !m.read && m.sender !== 'admin')) {
        try {
          await messagesApi.markAllAsRead(userId);
          console.log("Đã đánh dấu tin nhắn của người dùng", userId, "là đã đọc");
          
          // Cập nhật trạng thái unread trong danh sách liên hệ ngay lập tức
          setContacts(prevContacts => 
            prevContacts.map(contact => 
              contact.id === userId 
                ? { ...contact, unread: 0 } 
                : contact
            )
          );
        } catch (error) {
          console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
        }
      }
      
      // Cập nhật danh sách liên hệ (đánh dấu đã đọc)
      fetchContacts();
      
      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error);
      toast.error("Không thể tải tin nhắn");
    } finally {
      setMessagesLoading(false);
    }
  };

  // Gửi tin nhắn qua API
  const sendMessageToAPI = async (text) => {
    if (!selectedContact || !text.trim()) return;
    
    try {
      const messageData = {
        receiverId: selectedContact.id,
        text: text,
        sender: 'admin',
        userId: selectedContact.id  // Thêm userId khi admin gửi tin nhắn
      };
      
      console.log("Admin sending message to user:", selectedContact.id);
      
      const newMessage = await messagesApi.sendMessage(messageData);
      setMessages(prev => [...prev, newMessage]);
      
      // Cập nhật tin nhắn cuối cùng trong danh sách liên hệ
      setContacts(prev => prev.map(contact => 
        contact.id === selectedContact.id 
          ? { ...contact, lastMessage: text, lastSeen: 'Vừa xong' } 
          : contact
      ));
      
      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      toast.error("Không thể gửi tin nhắn");
    }
  };

  // Lấy danh sách liên hệ khi component mount
  useEffect(() => {
    fetchContacts();
    
    // Cài đặt interval để kiểm tra tin nhắn mới
    const intervalId = setInterval(() => {
      if (selectedContact) {
        // Kiểm tra có tin nhắn mới thay vì tải lại toàn bộ
        const checkNewMessages = async () => {
          try {
            const userId = selectedContact.id;
            const response = await messagesApi.getMessagesByUserId(userId);
            
            // Kiểm tra sự khác biệt về số lượng tin nhắn
            const messagesCount = messages.length;
            const responseCount = response.length;
            
            // Hoặc kiểm tra ID tin nhắn cuối cùng
            const lastMessageId = messagesCount > 0 ? messages[messagesCount - 1].id : null;
            const lastResponseId = responseCount > 0 ? response[responseCount - 1].id : null;
            
            if (messagesCount !== responseCount || lastMessageId !== lastResponseId) {
              console.log("Phát hiện tin nhắn mới trong admin, cập nhật giao diện");
              setMessages(response);
              
              // Đánh dấu tin nhắn đã đọc nếu cần
              const hasUnread = response.some(m => !m.read && m.sender !== 'admin');
              if (hasUnread) {
                await messagesApi.markAllAsRead(userId);
              }
              
              setTimeout(scrollToBottom, 100);
            }
          } catch (error) {
            console.error("Lỗi khi kiểm tra tin nhắn mới:", error);
          }
        };
        
        checkNewMessages();
      } else {
        // Kiểm tra danh sách liên hệ mới
        const checkNewContacts = async () => {
          try {
            const contactsData = await messagesApi.getAllContacts();
            
            // Chỉ cập nhật nếu có thay đổi về số lượng
            if (contactsData.length !== contacts.length) {
              console.log("Phát hiện thay đổi về danh sách liên hệ, cập nhật giao diện");
              setContacts(contactsData);
            } else {
              // Hoặc kiểm tra số tin nhắn chưa đọc
              const totalNewUnread = contactsData.reduce((sum, contact) => sum + (contact.unread || 0), 0);
              const totalOldUnread = contacts.reduce((sum, contact) => sum + (contact.unread || 0), 0);
              
              if (totalNewUnread !== totalOldUnread) {
                console.log("Phát hiện thay đổi về số lượng tin nhắn chưa đọc, cập nhật giao diện");
                setContacts(contactsData);
              }
            }
          } catch (error) {
            console.error("Lỗi khi kiểm tra liên hệ mới:", error);
          }
        };
        
        checkNewContacts();
      }
    }, 5000); // Tăng lên 5 giây thay vì 3 giây
    
    return () => clearInterval(intervalId);
  }, [selectedContact]);

  // Lấy tin nhắn khi chọn một liên hệ
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

  // Lọc danh sách liên hệ theo từ khóa tìm kiếm
  useEffect(() => {
    // Loại bỏ các liên hệ trùng lặp dựa trên userId
    const uniqueContacts = [];
    const userIdSet = new Set();
    
    contacts.forEach(contact => {
      // Nếu userId chưa có trong Set, thêm vào và thêm contact vào danh sách uniqueContacts
      if (!userIdSet.has(contact.id)) {
        userIdSet.add(contact.id);
        uniqueContacts.push(contact);
      }
    });
    
    // Tìm kiếm trong danh sách liên hệ không trùng lặp
    setFilteredContacts(
      uniqueContacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [contacts, searchTerm]);

  // Cuộn xuống dưới chỉ khi cần thiết
  const scrollToBottom = () => {
    // Sử dụng setTimeout để đảm bảo thực hiện sau khi DOM cập nhật
    setTimeout(() => {
      if (!messagesEndRef.current) return;
      
      // Lấy container chứa các tin nhắn
      const messageContainer = messagesEndRef.current.parentElement.parentElement;
      if (!messageContainer) return;
      
      // Tính toán vị trí cuộn
      const { scrollTop, scrollHeight, clientHeight } = messageContainer;
      const isScrolledNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      
      // Kiểm tra tin nhắn cuối cùng để quyết định có nên cuộn hay không
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      const isOwnLastMessage = lastMessage && lastMessage.sender === 'admin';
      
      // Chỉ cuộn nếu đang ở gần cuối hoặc tin nhắn cuối là của mình
      if (isScrolledNearBottom || isOwnLastMessage) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedContact) return;
    
    sendMessageToAPI(messageText);
    setMessageText("");
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    if (typeof timestamp === 'string' && (
      timestamp.includes("phút") || 
      timestamp.includes("giờ") || 
      timestamp === "Vừa xong"
    )) {
      return timestamp;
    }

    // Nếu là date string, chuyển thành đối tượng Date
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    
    // Nếu trong vòng 1 phút
    if (diffMs < 60000) {
      return "Vừa xong";
    }
    
    // Nếu trong vòng 1 giờ
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} phút trước`;
    }
    
    // Nếu trong vòng 24 giờ
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours} giờ trước`;
    }
    
    // Nếu cùng năm
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Nếu khác năm
    return date.toLocaleString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
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

  return (
    <div className="p-4 h-screen overflow-hidden bg-gray-50">
      <Toaster position="top-right" richColors />
      
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý tin nhắn</h1>
        <div className="ml-auto">
          {contacts.reduce((sum, contact) => sum + (contact.unread || 0), 0) > 0 && (
            <Badge 
              value={contacts.reduce((sum, contact) => sum + (contact.unread || 0), 0)} 
              severity="danger" 
              className="animate-pulse" 
            />
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-150px)]">
        {/* Danh sách liên hệ */}
        <div className="lg:col-span-1 h-full overflow-hidden">
          <Card className="shadow-sm h-full flex flex-col border border-gray-200 rounded-xl bg-white">
            <div className="mb-3 p-3 border-b">
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <i className="pi pi-search" />
                </span>
                <InputText
                  placeholder="Tìm kiếm liên hệ"
                  className="w-full border-gray-300 rounded-lg pl-10 py-2 focus:ring-2 focus:ring-green-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Scrollbars style={{ height: 'calc(100vh - 220px)' }} autoHide className="custom-scrollbar">
              <div className="flex flex-col gap-2 pr-2">
                {loading ? (
                  <div className="flex justify-center items-center h-64 text-green-500">
                    <i className="pi pi-spin pi-spinner text-xl"></i>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <i className="pi pi-inbox text-4xl mb-2 text-gray-300"></i>
                    <p>{searchTerm ? "Không tìm thấy liên hệ nào" : "Chưa có tin nhắn nào"}</p>
                  </div>
                ) : (
                  filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      className={
                        `contact-item flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ` +
                        (selectedContact?.id === contact.id ? 'bg-green-100 border-l-4 border-green-500 shadow-md' : 'hover:bg-gray-100 border-l-4 border-transparent')
                      }
                      style={{ minHeight: 64 }}
                      onClick={async () => {
                        if (contact.unread > 0) {
                          try {
                            await messagesApi.markAllAsRead(contact.id);
                            // Cập nhật ngay trên UI
                            setContacts(prevContacts =>
                              prevContacts.map(c =>
                                c.id === contact.id ? { ...c, unread: 0 } : c
                              )
                            );
                            // Sau đó fetch lại để đồng bộ với backend
                            await fetchContacts();
                          } catch (err) {
                            console.error("Lỗi khi đánh dấu đã đọc:", err);
                          }
                        }
                        setSelectedContact(contact);
                      }}
                    >
                      <Avatar
                        image={contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`}
                        shape="circle"
                        size="large"
                        className="mr-3"
                        style={{ minWidth: 48, minHeight: 48 }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className={`text-base font-semibold truncate ${selectedContact?.id === contact.id ? 'text-green-800' : 'text-gray-800'}`}>
                            {contact.name}
                          </h3>
                          <span className="text-xs text-gray-500">{formatTimestamp(contact.lastSeen || contact.lastActive)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-xs ${contact.unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'} truncate w-40`}>
                            {contact.lastMessage}
                          </p>
                          {contact.unread > 0 && (
                            <Badge value={contact.unread} severity="danger" className="ml-1 animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Scrollbars>
          </Card>
        </div>
        
        {/* Khung chat */}
        <div className="lg:col-span-3 h-full overflow-hidden">
          <Card className="shadow-sm h-full flex flex-col overflow-hidden border border-gray-200 rounded-xl bg-white">
            {selectedContact ? (
              <>
                {/* Header chat */}
                <div className="flex items-center p-4 border-b border-gray-200 shrink-0 bg-white">
                  <Avatar 
                    image={selectedContact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedContact.name)}&background=random`}
                    shape="circle"
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{selectedContact.name}</h3>
                    <p className="text-xs text-gray-500">
                      {selectedContact.online ? (
                        <span className="text-green-500 flex items-center">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                          Đang trực tuyến
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
                          Hoạt động {formatTimestamp(selectedContact.lastSeen || selectedContact.lastActive)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <Button 
                      icon="pi pi-user" 
                      className="p-button-text p-button-rounded p-button-sm mr-2 text-gray-600"
                      tooltip="Xem thông tin" 
                    />
                    <Button 
                      icon="pi pi-ellipsis-v" 
                      className="p-button-text p-button-rounded p-button-sm text-gray-600"
                      tooltip="Tùy chọn" 
                    />
                  </div>
                </div>
                
                {/* Nội dung chat */}
                <div className="custom-scrollbar force-scrollbar p-4 flex-1 overflow-y-scroll overflow-x-hidden bg-[#f0f2f5]" style={{ minHeight: "300px" }}>
                  <div className="flex flex-col gap-3">
                    {messagesLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <i className="pi pi-spin pi-spinner text-green-500 text-2xl"></i>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex justify-center items-center h-64 text-gray-500">
                        <p>Chưa có tin nhắn nào với người dùng này</p>
                      </div>
                    ) : (
                      messages.map(message => (
                        <div 
                          key={message.id}
                          className={`
                            flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}
                          `}
                        >
                          {message.sender !== 'admin' && (
                            <Avatar 
                              image={selectedContact?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedContact?.name || 'User')}&background=random`} 
                              shape="circle"
                              size="small"
                              className="mr-2 mt-1"
                            />
                          )}
                          <div 
                            className={`
                              message-bubble ${message.sender === 'admin' ? 'message-bubble--admin' : 'message-bubble--user'}
                            `}
                          >
                            <div className="text-xs font-semibold mb-1">
                              {message.sender === 'admin' ? 'Admin' : selectedContact?.name || 'Người dùng'}
                            </div>
                            <p className="text-sm">{message.text}</p>
                            <div className="message-time">
                              {formatMessageTime(message.createdAt || message.timestamp)}
                              {message.sender === 'admin' && (
                                <i className={`pi ${message.read ? 'pi-check-circle' : 'pi-check'} ml-1`}></i>
                              )}
                            </div>
                          </div>
                          {message.sender === 'admin' && (
                            <Avatar 
                              icon="pi pi-user"
                              shape="circle"
                              size="small"
                              className="ml-2 mt-1"
                              style={{ backgroundColor: "#22c55e" }}
                            />
                          )}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                
                {/* Input chat */}
                <div className="p-3 border-t flex items-center mt-auto shrink-0 bg-white">
                  <Button 
                    icon="pi pi-paperclip" 
                    className="p-button-text p-button-rounded p-button-sm mr-2 text-gray-600"
                    tooltip="Đính kèm file" 
                  />
                  <InputText 
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 p-inputtext-sm border-gray-300 rounded-full"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button 
                    icon="pi pi-send" 
                    className="p-button-rounded p-button-sm ml-2 bg-green-500 hover:bg-green-600"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()} 
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-white">
                <i className="pi pi-comments text-5xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-500">Chọn một liên hệ để bắt đầu trò chuyện</h3>
                <p className="text-gray-400 mt-2">Hoặc tìm kiếm khách hàng trong danh sách bên trái</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages; 