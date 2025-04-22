import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import tipsApi from "../../../api/tipsApi";
import Loading from "../../../components/Loading";

function TipForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "Mua Sắm",
    content: "",
    author: "DNC Food",
    authorTitle: "Chuyên gia dinh dưỡng",
    tags: "",
    image: null,
    isFeatured: false,
    datePublished: new Date().toISOString().split("T")[0],
  });

  // Danh sách các danh mục
  const categories = [
    { id: "Mua Sắm", name: "Mua Sắm" },
    { id: "Bảo Quản", name: "Bảo Quản" },
    { id: "Nấu Ăn", name: "Nấu Ăn" },
    { id: "Kiến Thức", name: "Kiến Thức" },
    { id: "Làm Vườn", name: "Làm Vườn" },
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchTipDetails();
    }
  }, [id]);

  const fetchTipDetails = async () => {
    try {
      const data = await tipsApi.getTipById(id);
      
      // Format tags from array to comma-separated string
      const tagsString = data.tags ? data.tags.join(", ") : "";
      
      // Format date
      const datePublished = data.datePublished 
        ? new Date(data.datePublished).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      
      setFormData({
        title: data.title || "",
        category: data.category || "Mua Sắm",
        content: data.content || "",
        author: data.author || "DNC Food",
        authorTitle: data.authorTitle || "Chuyên gia dinh dưỡng",
        tags: tagsString,
        isFeatured: data.isFeatured || false,
        datePublished: datePublished,
      });
      
      if (data.image) {
        setImagePreview(data.image);
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết mẹo hay:", error);
      toast.error("Không thể tải thông tin mẹo hay");
      navigate("/admin/tips");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === "file") {
      if (files && files[0]) {
        setFormData({
          ...formData,
          [name]: files[0],
        });
        
        // Generate preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(files[0]);
      }
    } else if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Create form data object for API call
      const apiFormData = new FormData();
      
      // Add all form fields to formData
      Object.keys(formData).forEach(key => {
        if (key === "tags" && formData[key]) {
          // Format tags as array
          const tagsArray = formData[key].split(",").map(tag => tag.trim());
          apiFormData.append(key, JSON.stringify(tagsArray));
        } else if (key === "image" && formData[key]) {
          // Only append file if it exists
          apiFormData.append("image", formData[key]);
        } else if (key !== "image" || formData[key] !== null) {
          // Add other fields
          apiFormData.append(key, formData[key]);
        }
      });
      
      if (isEditMode) {
        await tipsApi.updateTip(id, apiFormData);
        toast.success("Cập nhật mẹo hay thành công");
      } else {
        await tipsApi.createTip(apiFormData);
        toast.success("Tạo mẹo hay thành công");
      }
      
      navigate("/admin/tips");
    } catch (error) {
      console.error("Lỗi khi lưu mẹo hay:", error);
      toast.error("Không thể lưu mẹo hay");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? "Chỉnh sửa mẹo hay" : "Thêm mẹo hay mới"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode
            ? "Cập nhật thông tin mẹo hay"
            : "Tạo mẹo hay mới để chia sẻ với người dùng"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nhập tiêu đề mẹo hay"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Danh mục <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Published */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Ngày đăng
            </label>
            <input
              type="date"
              name="datePublished"
              value={formData.datePublished}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Tác giả
            </label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Tên tác giả"
            />
          </div>

          {/* Author Title */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Chức danh tác giả
            </label>
            <input
              type="text"
              name="authorTitle"
              value={formData.authorTitle}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Chức danh tác giả"
            />
          </div>

          {/* Tags */}
          <div className="col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              Thẻ (cách nhau bởi dấu phẩy)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ví dụ: rau hữu cơ, bảo quản thực phẩm, nấu ăn lành mạnh"
            />
          </div>

          {/* Featured */}
          <div className="col-span-2">
            <label className="flex items-center text-gray-700 font-medium">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-green-500 focus:ring-green-500"
              />
              Đánh dấu là mẹo nổi bật
            </label>
          </div>

          {/* Content */}
          <div className="col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={8}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nhập nội dung mẹo hay"
            ></textarea>
          </div>

          {/* Image */}
          <div className="col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              Hình ảnh minh họa
            </label>
            <div className="flex items-center">
              <input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {imagePreview && (
              <div className="mt-4">
                <p className="text-gray-700 font-medium mb-2">Xem trước:</p>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-xs h-auto rounded-md"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/admin/tips")}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md mr-4 hover:bg-gray-400"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            {isEditMode ? "Cập nhật" : "Tạo mới"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TipForm; 