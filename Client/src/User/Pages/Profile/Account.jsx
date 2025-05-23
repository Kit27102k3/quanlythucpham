import { useState, useRef, useEffect } from "react";
import useFetchUserProfile from "../../Until/useFetchUserProfile";
import {authApi} from "../../../api/authApi";
import { toast } from "sonner";
import { Link } from "react-router-dom";

function Account() {
  const users = useFetchUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);
  const [defaultAddress, setDefaultAddress] = useState(null);

  useEffect(() => {
    if (users) {
      setFormData({
        firstName: users.firstName || "",
        lastName: users.lastName || "",
        email: users.email || "",
        phone: users.phone || "",
      });
      
      // Set avatar URL if available
      if (users.userImage) {
        setAvatarUrl(users.userImage);
      } else {
        setAvatarUrl("https://www.gravatar.com/avatar/?d=mp");
      }

      // Tìm địa chỉ mặc định trong danh sách địa chỉ
      if (users.addresses && users.addresses.length > 0) {
        const defaultAddr = users.addresses.find(addr => addr.isDefault);
        if (defaultAddr) {
          setDefaultAddress(defaultAddr);
        } else if (users.addresses.length > 0) {
          // Nếu không có địa chỉ mặc định, sử dụng địa chỉ đầu tiên
          setDefaultAddress(users.addresses[0]);
        }
      } else if (users.address) {
        // Sử dụng địa chỉ cũ nếu không có mảng địa chỉ mới
        setDefaultAddress({
          fullAddress: users.address,
          receiverName: `${users.firstName || ""} ${users.lastName || ""}`.trim(),
          receiverPhone: users.phone || ""
        });
      }
    }
  }, [users]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!users?._id) {
        toast.error("Không thể cập nhật thông tin người dùng");
        return;
      }
      
      // Hiển thị thông báo đang tải
      toast.loading("Đang cập nhật thông tin...");

      let userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };
      
      // Email không được gửi lên để cập nhật
      
      // If we have a new avatar file, we need to upload it to Cloudinary first
      if (avatarFile) {
        try {
          console.log("Uploading file to Cloudinary:", avatarFile.name);
          
          // Create a FormData object for the file upload
          const cloudinaryData = new FormData();
          cloudinaryData.append("file", avatarFile);
          cloudinaryData.append("upload_preset", "quanlythucpham"); // Upload preset của bạn
          
          // Upload to Cloudinary using fetch instead of axios
          const uploadResponse = await fetch(
            "https://api.cloudinary.com/v1_1/drlxpdaub/image/upload", 
            {
              method: "POST",
              body: cloudinaryData
            }
          );
          
          if (!uploadResponse.ok) {
            throw new Error(`HTTP error! status: ${uploadResponse.status}`);
          }
          
          const cloudinaryResult = await uploadResponse.json();
          console.log("Cloudinary response:", cloudinaryResult);
          
          // Add the image URL to the user data
          if (cloudinaryResult && cloudinaryResult.secure_url) {
            userData.userImage = cloudinaryResult.secure_url;
            console.log("Added avatar URL to user data:", userData.userImage);
          } else {
            throw new Error("Không nhận được URL ảnh từ Cloudinary");
          }
        } catch (cloudinaryError) {
          console.error("Lỗi khi tải ảnh lên Cloudinary:", cloudinaryError);
          toast.dismiss();
          toast.error("Không thể tải ảnh lên. Vui lòng thử lại.");
          return; // Dừng việc cập nhật nếu upload ảnh thất bại
        }
      }
      
      console.log("Sending user data to API:", userData);
      
      const response = await authApi.updateProfile(users._id, userData);
      
      toast.dismiss(); // Hủy thông báo loading
      
      if (response.data.success) {
        toast.success("Cập nhật thông tin thành công");
        setIsEditing(false);
        // Reload the page to refresh data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(response.data.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      toast.dismiss();
      toast.error("Có lỗi xảy ra khi cập nhật thông tin");
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[19px] font-medium text-[#212B25] uppercase">
          Thông tin tài khoản
        </h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[#51bb1a] text-white rounded-md hover:opacity-80 cursor-pointer transition duration-200"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      {!isEditing ? (
        <div>
          <div className="mb-6 flex flex-col items-center sm:items-start sm:flex-row sm:gap-6">
            <div 
              className="w-32 h-32 rounded-full overflow-hidden mb-4 sm:mb-0 border-2 border-green-500"
              onClick={() => setIsEditing(true)}
            >
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://www.gravatar.com/avatar/?d=mp&s=256";
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold">
                Họ tên:{" "}
                <span className="font-normal">{`${users?.firstName || ""} ${users?.lastName || ""}`}</span>
              </p>
              <p className="text-sm font-bold">
                Email: 
                <span className="font-normal">
                  {users?.email ? (
                    users.email.includes("facebook") 
                      ? " Tài khoản đăng nhập bằng Facebook" 
                      : ` ${users.email}`
                  ) : (
                    " Chưa cập nhật"
                  )}
                </span>
              </p>
              <p className="text-sm font-bold">
                Điện thoại: <span className="font-normal">{users?.phone || "Chưa cập nhật"}</span>
              </p>
              <p className="text-sm font-bold flex items-start">
                <span>Địa chỉ mặc định:</span>
                <span className="font-normal ml-1">
                  {defaultAddress ? (
                    <span>
                      {defaultAddress.fullAddress}
                      <Link to="/tai-khoan/dia-chi" className="ml-2 text-xs text-blue-500 hover:underline">
                        (Quản lý địa chỉ)
                      </Link>
                    </span>
                  ) : (
                    <span>
                      Chưa cập nhật
                      <Link to="/tai-khoan/dia-chi" className="ml-2 text-xs text-blue-500 hover:underline">
                        (Thêm địa chỉ mới)
                      </Link>
                    </span>
                  )}
                </span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div 
              className="w-32 h-32 rounded-full overflow-hidden mb-2 border-2 border-green-500 cursor-pointer"
              onClick={handleAvatarClick}
            >
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://www.gravatar.com/avatar/?d=mp&s=256";
                }}
              />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <p className="text-sm text-gray-500 mt-1">Nhấp vào ảnh để thay đổi</p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-md">
            <p className="text-blue-700 text-sm">
              Vui lòng nhập đúng thông tin của bạn để được giao hàng và tư vấn một cách tốt nhất
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
              {formData.email ? (
                formData.email.includes("facebook") 
                  ? "Tài khoản đăng nhập bằng Facebook" 
                  : formData.email
              ) : (
                "Chưa có thông tin email"
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Email không thể thay đổi vì đây là thông tin định danh tài khoản
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
              {defaultAddress ? defaultAddress.fullAddress : "Chưa có địa chỉ mặc định"}
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">
                Địa chỉ được quản lý trong phần Địa chỉ
              </p>
              <Link to="/tai-khoan/dia-chi" className="text-xs text-blue-500 hover:underline">
                Quản lý địa chỉ
              </Link>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4 gap-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 cursor-pointer transition duration-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#51bb1a] text-white rounded-md hover:opacity-80 cursor-pointer transition duration-200"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Account;
