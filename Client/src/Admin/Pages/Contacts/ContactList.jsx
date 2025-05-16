import { useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { API_URLS } from "../../../config/apiConfig";

function ContactList() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyData, setReplyData] = useState({
    to: "",
    subject: "",
    message: "",
    sendingEmail: false
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(API_URLS.CONTACT);
      console.log("Dữ liệu liên hệ:", response.data);
      setContacts(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách liên hệ:", error);
      if (error.response) {
        console.error("Chi tiết lỗi:", error.response.status, error.response.data);
      }
      toast.error("Không thể tải danh sách liên hệ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa liên hệ này?")) return;

    try {
      await axios.delete(`${API_URLS.CONTACT}/${id}`);
      setContacts(contacts.filter((contact) => contact._id !== id));
      toast.success("Đã xóa liên hệ thành công");
    } catch (error) {
      console.error("Lỗi khi xóa liên hệ:", error);
      if (error.response) {
        console.error("Chi tiết lỗi:", error.response.status, error.response.data);
      }
      toast.error("Không thể xóa liên hệ. Vui lòng thử lại sau.");
    }
  };

  const viewContactDetails = async (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
    
    // Nếu liên hệ chưa đọc, cập nhật trạng thái thành đã đọc
    if (!contact.isRead) {
      try {
        await axios.put(`${API_URLS.CONTACT}/${contact._id}`, {
          isRead: true
        });
        
        // Cập nhật lại trạng thái trong danh sách hiện tại
        setContacts(prevContacts => 
          prevContacts.map(item => 
            item._id === contact._id ? { ...item, isRead: true } : item
          )
        );

        // Cập nhật contact được chọn
        setSelectedContact(prev => ({ ...prev, isRead: true }));
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái đã đọc:", error);
      }
    }
  };

  const handleReply = (contact) => {
    setSelectedContact(contact);
    setReplyData({
      to: contact.email,
      subject: `Phản hồi liên hệ từ DNC FOOD`,
      message: `Kính gửi ${contact.name},\n\nCảm ơn bạn đã liên hệ với chúng tôi.\n\nNội dung phản hồi:\n\n\n\nTrân trọng,\nDNC FOOD`,
      sendingEmail: false
    });
    setShowReplyModal(true);
  };

  const sendReply = async () => {
    if (!replyData.message.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    try {
      setReplyData(prev => ({ ...prev, sendingEmail: true }));
      
      // Kiểm tra cấu hình email trước khi gửi
      try {
        const configResponse = await axios.get(`${API_URLS.CONTACT}/test-email/config`);
        console.log("Email configuration status:", configResponse.data);
        
        if (!configResponse.data.success) {
          toast.error(`Lỗi cấu hình email: ${configResponse.data.message}`);
          setReplyData(prev => ({ ...prev, sendingEmail: false }));
          return;
        }
      } catch (configError) {
        console.error("Lỗi kiểm tra cấu hình email:", configError);
        toast.error("Không thể xác minh cấu hình email. Vui lòng kiểm tra lại cài đặt server.");
        setReplyData(prev => ({ ...prev, sendingEmail: false }));
        return;
      }
      
      console.log("Đang gửi dữ liệu:", {
        contactId: selectedContact._id,
        to: replyData.to,
        subject: replyData.subject,
        message: replyData.message
      });
      
      // Gửi email
      const replyResponse = await axios.post(`${API_URLS.CONTACT}/reply`, {
        contactId: selectedContact._id,
        to: replyData.to,
        subject: replyData.subject,
        message: replyData.message
      });
      
      console.log("Kết quả gửi email:", replyResponse.data);
      
      // Cập nhật trạng thái đã trả lời
      const updateResponse = await axios.put(`${API_URLS.CONTACT}/${selectedContact._id}`, {
        isReplied: true
      });
      
      console.log("Kết quả cập nhật trạng thái:", updateResponse.data);
      
      // Cập nhật lại danh sách liên hệ
      setContacts(prevContacts => 
        prevContacts.map(item => 
          item._id === selectedContact._id ? { ...item, isReplied: true } : item
        )
      );
      
      toast.success("Đã gửi phản hồi thành công");
      setShowReplyModal(false);
    } catch (error) {
      console.error("Lỗi khi gửi phản hồi:", error);
      
      if (error.response) {
        console.error("Chi tiết lỗi:", error.response.status, error.response.data);
        
        // Hiển thị thông báo lỗi chi tiết hơn
        if (error.response.data && error.response.data.error) {
          if (error.response.data.error.includes("Missing credentials")) {
            toast.error("Lỗi xác thực email: Chưa cấu hình đúng tài khoản và mật khẩu email trong file .env");
          } else if (error.response.data.error.includes("Invalid login")) {
            toast.error("Lỗi đăng nhập email: Sai tài khoản hoặc mật khẩu email");
          } else {
            toast.error(`Lỗi gửi email: ${error.response.data.error}`);
          }
        } else {
          toast.error(`Không thể gửi phản hồi: ${error.response.data.message || 'Lỗi server'}`);
        }
      } else if (error.request) {
        console.error("Không nhận được phản hồi từ server");
        toast.error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
      } else {
        toast.error(`Lỗi: ${error.message}`);
      }
    } finally {
      setReplyData(prev => ({ ...prev, sendingEmail: false }));
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "HH:mm - dd/MM/yyyy", { locale: vi });
    } catch {
      // Ignore error and return original string
      return dateString;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" richColors />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Liên hệ</h1>
        <button
          onClick={fetchContacts}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-300"
        >
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Chưa có liên hệ nào được gửi đến.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Họ và tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số điện thoại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact._id} className={`hover:bg-gray-50 ${!contact.isRead ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {!contact.isRead ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Chưa đọc
                        </span>
                      ) : contact.isReplied ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Đã trả lời
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Đã đọc
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {contact.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{contact.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {contact.phone || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(contact.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewContactDetails(contact)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => handleReply(contact)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Trả lời
                    </button>
                    <button
                      onClick={() => handleDelete(contact._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal chi tiết liên hệ */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Chi tiết liên hệ
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-gray-500">Người gửi</p>
                  {selectedContact.isReplied && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Đã trả lời
                    </span>
                  )}
                </div>
                <p className="text-base font-medium">{selectedContact.name}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="text-base">{selectedContact.email}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                <p className="text-base">
                  {selectedContact.phone || "Không có"}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Thời gian gửi</p>
                <p className="text-base">
                  {formatDate(selectedContact.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Nội dung</p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-base whitespace-pre-wrap">
                    {selectedContact.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  handleReply(selectedContact);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mr-2"
              >
                Trả lời
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 mr-2"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedContact._id);
                  setShowModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal trả lời liên hệ */}
      {showReplyModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Trả lời liên hệ
                </h3>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Người nhận
                </label>
                <input
                  type="email"
                  value={replyData.to}
                  onChange={(e) => setReplyData(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={replyData.subject}
                  onChange={(e) => setReplyData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung
                </label>
                <textarea
                  value={replyData.message}
                  onChange={(e) => setReplyData(prev => ({ ...prev, message: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 mr-2"
              >
                Hủy
              </button>
              <button
                onClick={sendReply}
                disabled={replyData.sendingEmail}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {replyData.sendingEmail ? "Đang gửi..." : "Gửi phản hồi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactList;
