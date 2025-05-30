/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useRef } from "react";
import messagesApi from "../../api/messagesApi";
import "./styles.css"; // Import CSS file for custom styles
import { toast, Toaster } from "sonner"; // Thêm toast từ Sonner
import { Scrollbars } from "react-custom-scrollbars-2";
import { Dialog } from "primereact/dialog";
import { FaInfoCircle } from "react-icons/fa";

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
  const [userInfoVisible, setUserInfoVisible] = useState(false);

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
      if (!Array.isArray(messagesData)) {  
        setMessages([]);
        toast.error("Dữ liệu tin nhắn không đúng định dạng");
        return;
      }

      setMessages(messagesData);
      if (messagesData.some((m) => !m.read && m.sender !== "admin")) {
        try {
          await messagesApi.markAllAsRead(userId);
          setContacts((prevContacts) =>
            prevContacts.map((contact) =>
              contact.id === userId ? { ...contact, unread: 0 } : contact
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
      setMessages([]); // Đặt messages thành mảng rỗng để tránh lỗi render
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
        sender: "admin",
        userId: selectedContact.id, // Thêm userId khi admin gửi tin nhắn
      };
      const newMessage = await messagesApi.sendMessage(messageData);
      setMessages((prev) => [...prev, newMessage]);

      // Cập nhật tin nhắn cuối cùng trong danh sách liên hệ
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === selectedContact.id
            ? { ...contact, lastMessage: text, lastSeen: "Vừa xong" }
            : contact
        )
      );

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
    // Kiểm tra kết nối API
    const checkApiConnection = async () => {
      try {
        console.log("Kiểm tra kết nối đến API...");
        const response = await fetch(
          `${
            import.meta.env.VITE_SERVER_URL || "http://localhost:8080"
          }/api/health`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          toast.error("Không thể kết nối đến máy chủ");
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra kết nối API:", error);
        toast.error("Có vấn đề với kết nối máy chủ");
      }
    };

    checkApiConnection();
    fetchContacts();

    const intervalId = setInterval(() => {
      if (selectedContact) {
        const checkNewMessages = async () => {
          try {
            const userId = selectedContact.id;
            const response = await messagesApi.getMessagesByUserId(userId);
            const messagesCount = messages.length;
            const responseCount = response.length;
            const lastMessageId =
              messagesCount > 0 ? messages[messagesCount - 1].id : null;
            const lastResponseId =
              responseCount > 0 ? response[responseCount - 1].id : null;

            if (
              messagesCount !== responseCount ||
              lastMessageId !== lastResponseId
            ) {
             
              setMessages(response);

              const hasUnread = response.some(
                (m) => !m.read && m.sender !== "admin"
              );
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
        const checkNewContacts = async () => {
          try {
            const contactsData = await messagesApi.getAllContacts();

            if (contactsData.length !== contacts.length) {
             
              setContacts(contactsData);
            } else {
              const totalNewUnread = contactsData.reduce(
                (sum, contact) => sum + (contact.unread || 0),
                0
              );
              const totalOldUnread = contacts.reduce(
                (sum, contact) => sum + (contact.unread || 0),
                0
              );

              if (totalNewUnread !== totalOldUnread) {
                
                setContacts(contactsData);
              }
            }
          } catch (error) {
            console.error("Lỗi khi kiểm tra liên hệ mới:", error);
          }
        };

        checkNewContacts();
      }
    }, 5000); 

    return () => clearInterval(intervalId);
  }, [selectedContact]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    const uniqueContacts = [];
    const userIdSet = new Set();

    contacts.forEach((contact) => {
      if (!userIdSet.has(contact.id)) {
        userIdSet.add(contact.id);
        uniqueContacts.push(contact);
      }
    });

    setFilteredContacts(
      uniqueContacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [contacts, searchTerm]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedContact) return;

    sendMessageToAPI(messageText);
    setMessageText("");
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    if (
      typeof timestamp === "string" &&
      (timestamp.includes("phút") ||
        timestamp.includes("giờ") ||
        timestamp === "Vừa xong")
    ) {
      return timestamp;
    }

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;

    if (diffMs < 60000) {
      return "Vừa xong";
    }

    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} phút trước`;
    }

    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours} giờ trước`;
    }

    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    // Định dạng ngày tháng
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return `${hours}:${minutes}`;
    }

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const viewUserInfo = async () => {
    try {
      setUserInfoVisible(true);
      toast.info("Đang tải thông tin người dùng...");
      setTimeout(() => {
        toast.success("Đã tải thông tin người dùng");
      }, 1000);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      toast.error("Không thể lấy thông tin người dùng");
    }
  };

  return (
    <div className="p-5 h-screen overflow-hidden bg-gray-50">
      <Toaster position="top-right" richColors />

      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý tin nhắn</h1>
        <div className="ml-auto">
          {contacts.reduce((sum, contact) => sum + (contact.unread || 0), 0) >
            0 && (
            <Badge
              value={contacts.reduce(
                (sum, contact) => sum + (contact.unread || 0),
                0
              )}
              severity="danger"
              className="animate-pulse"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-160px)]">
        {/* Danh sách liên hệ */}
        <div className="lg:col-span-1 h-full overflow-hidden">
          <Card className="shadow-sm h-full flex flex-col border border-gray-200 rounded-xl bg-white">
            <div className="mb-3 p-4 border-b">
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

            <Scrollbars
              style={{ height: "calc(100vh - 240px)" }}
              autoHide
              className="custom-scrollbar"
            >
              <div className="flex flex-col gap-3 px-4">
                {loading ? (
                  <div className="flex justify-center items-center h-64 text-green-500">
                    <i className="pi pi-spin pi-spinner text-xl"></i>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <i className="pi pi-inbox text-4xl mb-2 text-gray-300"></i>
                    <p>
                      {searchTerm
                        ? "Không tìm thấy liên hệ nào"
                        : "Chưa có tin nhắn nào"}
                    </p>
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={
                        `contact-item flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ` +
                        (selectedContact?.id === contact.id
                          ? "bg-green-100 border-l-4 border-green-500 shadow-md"
                          : "hover:bg-gray-100 border-l-4 border-transparent")
                      }
                      style={{ minHeight: 70 }}
                      onClick={async () => {
                        if (contact.unread > 0) {
                          try {
                            await messagesApi.markAllAsRead(contact.id);
                            // Cập nhật ngay trên UI
                            setContacts((prevContacts) =>
                              prevContacts.map((c) =>
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
                        image={
                          contact.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            contact.name
                          )}&background=random`
                        }
                        shape="circle"
                        size="large"
                        className="mr-3"
                        style={{ minWidth: 48, minHeight: 48 }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3
                            className={`text-base font-semibold truncate ${
                              selectedContact?.id === contact.id
                                ? "text-green-800"
                                : "text-gray-800"
                            }`}
                          >
                            {contact.name}
                          </h3>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTimestamp(
                              contact.lastSeen || contact.lastActive
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p
                            className={`text-xs ${
                              contact.unread > 0
                                ? "text-gray-900 font-medium"
                                : "text-gray-500"
                            } truncate w-36`}
                          >
                            {contact.lastMessage}
                          </p>
                          {contact.unread > 0 && (
                            <Badge
                              value={contact.unread}
                              severity="danger"
                              className="ml-2 animate-pulse"
                            />
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
                <div className="flex items-center justify-between border-b px-4 py-2 bg-white">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold mr-3">
                      {selectedContact?.name
                        ? selectedContact.name.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {selectedContact?.name || "Khách hàng"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedContact?.phone || ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      className="rounded-full p-3 text-gray-700 hover:bg-gray-200 transition-colors mr-2"
                      style={{
                        backgroundColor: "#f0f2f5",
                        padding: "0.75rem",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => viewUserInfo(selectedContact?.id)}
                      title="Xem thông tin"
                    >
                      <FaInfoCircle size={20} />
                    </Button>
                  </div>
                </div>

                {/* Nội dung chat */}
                <div
                  className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f0f2f5] p-5"
                  style={{
                    minHeight: "300px",
                    maxHeight: "calc(100vh - 300px)",
                    scrollBehavior: "smooth",
                  }}
                >
                  <div className="flex flex-col gap-4">
                    {messagesLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <i className="pi pi-spin pi-spinner text-green-500 text-2xl"></i>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <i className="pi pi-comment text-4xl mb-2 text-gray-300"></i>
                        <p>Chưa có tin nhắn nào với người dùng này</p>
                        <div className="flex flex-col gap-2 mt-4">
                          <button
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                            onClick={() => {
                              console.log(
                                "Thử tải lại tin nhắn cho:",
                                selectedContact?.id
                              );
                              if (selectedContact?.id) {
                                fetchMessages(selectedContact.id);
                              }
                            }}
                          >
                            Thử tải lại
                          </button>

                          <button
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                            onClick={async () => {
                              if (!selectedContact?.id) return;

                              try {
                                console.log(
                                  "Gửi tin nhắn kiểm tra đến:",
                                  selectedContact.id
                                );
                                const testMessage = {
                                  receiverId: selectedContact.id,
                                  text: "Xin chào! Đây là tin nhắn kiểm tra từ Admin.",
                                  sender: "admin",
                                  userId: selectedContact.id,
                                };

                                const newMessage =
                                  await messagesApi.sendMessage(testMessage);
                                console.log(
                                  "Kết quả gửi tin nhắn kiểm tra:",
                                  newMessage
                                );

                                // Tải lại tin nhắn
                                await fetchMessages(selectedContact.id);

                                toast.success("Đã gửi tin nhắn kiểm tra");
                              } catch (error) {
                                console.error(
                                  "Lỗi khi gửi tin nhắn kiểm tra:",
                                  error
                                );
                                toast.error("Không thể gửi tin nhắn kiểm tra");
                              }
                            }}
                          >
                            Gửi tin nhắn kiểm tra
                          </button>
                        </div>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div
                          key={message.id || index}
                          className={`
                            flex ${
                              message.sender === "admin"
                                ? "justify-end"
                                : "justify-start"
                            }
                            ${message.sender === "admin" ? "pr-2" : "pl-2"}
                          `}
                        >
                          {message.sender !== "admin" && (
                            <Avatar
                              image={
                                selectedContact?.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  selectedContact?.name || "User"
                                )}&background=random`
                              }
                              shape="circle"
                              size="small"
                              className="mr-2 mt-1"
                            />
                          )}
                          <div
                            className={`
                              message-bubble ${
                                message.sender === "admin"
                                  ? "message-bubble--admin"
                                  : "message-bubble--user"
                              }
                              max-w-[70%]
                            `}
                          >
                            <div className="text-xs font-semibold mb-1">
                              {message.sender === "admin"
                                ? "Admin"
                                : selectedContact?.name || "Người dùng"}
                            </div>
                            <p className="text-sm">{message.text}</p>
                            <div className="message-time">
                              {formatMessageTime(
                                message.createdAt || message.timestamp
                              )}
                              {message.sender === "admin" && (
                                <i
                                  className={`pi ${
                                    message.read
                                      ? "pi-check-circle"
                                      : "pi-check"
                                  } ml-1`}
                                ></i>
                              )}
                            </div>
                          </div>
                          {message.sender === "admin" && (
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
                    <div
                      ref={messagesEndRef}
                      style={{ height: "1px", clear: "both" }}
                    />
                  </div>
                </div>

                {/* Input chat */}
                <div className="p-4 pb-6 border-t flex items-center shrink-0 bg-white">
                  <Button
                    icon="pi pi-paperclip"
                    className="p-button-text p-button-rounded p-button-sm mr-3 text-gray-600"
                    tooltip="Đính kèm file"
                  />
                  <InputText
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 p-inputtext-sm border rounded-xl p-3"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button
                    icon="pi pi-send"
                    className="p-button-rounded p-button-sm ml-3 bg-[#51bb1a] text-white rounded cursor-pointer"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col mt-60 items-center justify-center h-full bg-white">
                <i className="pi pi-comments text-5xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-500">
                  Chọn một liên hệ để bắt đầu trò chuyện
                </h3>
                <p className="text-gray-400 mt-2">
                  Hoặc tìm kiếm khách hàng trong danh sách bên trái
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Dialog hiển thị thông tin người dùng */}
      <Dialog
        header={`Thông tin của ${selectedContact?.name || "Người dùng"}`}
        visible={userInfoVisible}
        style={{ width: "50vw" }}
        onHide={() => setUserInfoVisible(false)}
        className="p-fluid"
        contentClassName="p-4"
        headerClassName="px-4 py-3"
      >
        {selectedContact ? (
          <div className="p-grid p-fluid">
            <div className="flex flex-col items-center justify-center mb-4">
              <Avatar
                image={
                  selectedContact?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    selectedContact?.name || "User"
                  )}&background=random`
                }
                shape="circle"
                size="xlarge"
                className="mb-2"
              />
              <h3 className="text-xl font-semibold">{selectedContact?.name}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field">
                <label className="font-medium">ID</label>
                <p className="mt-1 text-gray-700 bg-gray-100 p-2 rounded">
                  {selectedContact?.id}
                </p>
              </div>

              <div className="field">
                <label className="font-medium">Trạng thái</label>
                <p className="mt-1 text-gray-700 bg-gray-100 p-2 rounded">
                  {selectedContact?.online ? (
                    <span className="text-green-500 flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                      Đang trực tuyến
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
                      Hoạt động{" "}
                      {formatTimestamp(
                        selectedContact?.lastSeen || selectedContact?.lastActive
                      )}
                    </span>
                  )}
                </p>
              </div>

              <div className="field">
                <label className="font-medium">Số điện thoại</label>
                <p className="mt-1 text-gray-700 bg-gray-100 p-2 rounded">
                  {selectedContact?.phone || "Chưa cập nhật"}
                </p>
              </div>

              <div className="field">
                <label className="font-medium">Email</label>
                <p className="mt-1 text-gray-700 bg-gray-100 p-2 rounded">
                  {selectedContact?.email || "Chưa cập nhật"}
                </p>
              </div>

              <div className="field col-span-2">
                <label className="font-medium">Địa chỉ</label>
                <p className="mt-1 text-gray-700 bg-gray-100 p-2 rounded">
                  {selectedContact?.address || "Chưa cập nhật"}
                </p>
              </div>

              <div className="field col-span-2">
                <label className="font-medium">Tin nhắn gần đây</label>
                <p className="mt-1 text-gray-700 bg-gray-100 p-2 rounded">
                  {selectedContact?.lastMessage || "Chưa có tin nhắn"}
                </p>
              </div>

              <div className="field col-span-2 mt-4">
                <Button
                  label="Đóng"
                  className="p-button-outlined bg-red-500 text-white p-2 rounded-md"
                  onClick={() => setUserInfoVisible(false)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center p-6">
            <i className="pi pi-spin pi-spinner text-green-500 text-2xl mr-2"></i>
            <span>Đang tải thông tin người dùng...</span>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Messages;
