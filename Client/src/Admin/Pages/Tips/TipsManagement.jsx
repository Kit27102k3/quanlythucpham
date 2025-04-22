import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import tipsApi from "../../../api/tipsApi";
import Loading from "../../../components/Loading";

function TipsManagement() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTip, setSelectedTip] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const data = await tipsApi.getAllTips();
      setTips(data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách mẹo hay:", error);
      toast.error("Không thể tải danh sách mẹo hay");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTip) return;
    
    try {
      setLoading(true);
      await tipsApi.deleteTip(selectedTip._id);
      toast.success("Xóa mẹo hay thành công");
      setTips(tips.filter(tip => tip._id !== selectedTip._id));
      setIsDeleteModalOpen(false);
      setSelectedTip(null);
    } catch (error) {
      console.error("Lỗi khi xóa mẹo hay:", error);
      toast.error("Không thể xóa mẹo hay");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (tip) => {
    setSelectedTip(tip);
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Mẹo hay</h1>
        <Link
          to="/admin/tips/create"
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Thêm mẹo mới
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tác giả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đăng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nổi bật
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lượt thích
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tác vụ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tips.length > 0 ? (
                  tips.map((tip) => (
                    <tr key={tip._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {truncateContent(tip.title, 50)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {truncateContent(tip.content, 50)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {tip.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tip.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(tip.datePublished)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tip.isFeatured ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <span className="text-red-500">✗</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tip.likes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/admin/tips/edit/${tip._id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Sửa
                          </Link>
                          <button
                            onClick={() => openDeleteModal(tip)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Không có mẹo hay nào. Hãy thêm mẹo mới!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Xác nhận xóa
            </h3>
            <p className="text-gray-500 mb-4">
              Bạn có chắc chắn muốn xóa mẹo "{selectedTip?.title}"? Hành động
              này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TipsManagement; 