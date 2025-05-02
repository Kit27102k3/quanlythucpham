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
        await messagesApi.markAllAsRead(userId);
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
        sender: 'admin'
      };
      
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
        fetchMessages(selectedContact.id);
      } else {
        fetchContacts();
      }
    }, 3000); // Tăng lên 15 giây thay vì 3 giây
    
    return () => clearInterval(intervalId);
  }, []);

  // Lấ, 15000y tin nhắn khi chọn một liên hệ
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

  // Lọc danh sách liên hệ theo từ khóa tìm kiếm
  useEffect(() => {
    setFilteredContacts(
      contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [contacts, searchTerm]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 h-screen overflow-hidden">
      <Toaster position="top-right" richColors />
      
      <h1 className="text-2xl font-bold mb-4">Quản lý tin nhắn</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-150px)]">
        {/* Danh sách liên hệ */}
        <div className="lg:col-span-1 h-full overflow-hidden">
          <Card className="shadow-md h-full flex flex-col">
            <div className="mb-3">
              <span className="p-input-icon-left w-full">
                <i className="pi pi-search" />
                <InputText 
                  placeholder="Tìm kiếm liên hệ" 
                  className="w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </span>
            </div>
            
            <div className="custom-scrollbar force-scrollbar flex-1 overflow-hidden" style={{ height: 'calc(100% - 50px)' }}>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <i className="pi pi-spin pi-spinner text-xl"></i>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <i className="pi pi-inbox text-4xl mb-2"></i>
                  <p>{searchTerm ? "Không tìm thấy liên hệ nào" : "Chưa có tin nhắn nào"}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      className={`
                        flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200
                        ${selectedContact?.id === contact.id ? 'bg-blue-100' : 'hover:bg-gray-100'}
                      `}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className="relative">
                        <Avatar 
                          image={contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`} 
                          shape="circle" 
                          size="large"
                          className="mr-3"
                        />
                        {contact.online && (
                          <span className="absolute bottom-0 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-sm font-semibold truncate">{contact.name}</h3>
                          <span className="text-xs text-gray-500">{formatTimestamp(contact.lastSeen || contact.lastActive)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-600 truncate w-40">
                            {contact.lastMessage}
                          </p>
                          {contact.unread > 0 && (
                            <Badge value={contact.unread} severity="danger" className="ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Khung chat */}
        <div className="lg:col-span-3 h-full overflow-hidden">
          <Card className="shadow-md h-full flex flex-col overflow-hidden">
            {selectedContact ? (
              <>
                {/* Header chat */}
                <div className="flex items-center p-3 border-b shrink-0">
                  <Avatar 
                    image={selectedContact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedContact.name)}&background=random`}
                    shape="circle"
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedContact.name}</h3>
                    <p className="text-xs text-gray-500">
                      {selectedContact.online ? (
                        <span className="text-green-500">Đang trực tuyến</span>
                      ) : (
                        `Hoạt động ${formatTimestamp(selectedContact.lastSeen || selectedContact.lastActive)}`
                      )}
                    </p>
                  </div>
                  <div>
                    <Button 
                      icon="pi pi-user" 
                      className="p-button-text p-button-rounded p-button-sm mr-2"
                      tooltip="Xem thông tin" 
                    />
                    <Button 
                      icon="pi pi-ellipsis-v" 
                      className="p-button-text p-button-rounded p-button-sm"
                      tooltip="Tùy chọn" 
                    />
                  </div>
                </div>
                
                {/* Nội dung chat */}
                <div className="custom-scrollbar force-scrollbar p-3 flex-1 overflow-hidden">
                  <div className="flex flex-col gap-3">
                    {messagesLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <i className="pi pi-spin pi-spinner text-xl"></i>
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
                          <div 
                            className={`
                              max-w-[75%] p-3 rounded-lg shadow-sm
                              ${message.sender === 'admin' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-800'}
                            `}
                          >
                            <p className="text-sm">{message.text}</p>
                            <div className={`
                              text-xs mt-1 flex items-center justify-end
                              ${message.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'}
                            `}>
                              {formatMessageTime(message.createdAt || message.timestamp)}
                              {message.sender === 'admin' && (
                                <i className={`pi ${message.read ? 'pi-check-circle' : 'pi-check'} ml-1`}></i>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                
                {/* Input chat */}
                <div className="p-3 border-t flex items-center mt-auto shrink-0">
                  <Button 
                    icon="pi pi-paperclip" 
                    className="p-button-text p-button-rounded p-button-sm mr-2"
                    tooltip="Đính kèm file" 
                  />
                  <InputText 
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 p-inputtext-sm"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button 
                    icon="pi pi-send" 
                    className="p-button-rounded p-button-sm ml-2"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()} 
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
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