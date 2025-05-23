import { useState, useEffect } from "react";
import { authApi } from "../../../api/authApi";
import { FiEdit, FiHome, FiCheck, FiMapPin, FiUser, FiPhone, FiPlus } from "react-icons/fi";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function AddressSelector({ selectedAddressId, onAddressSelect, userId }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!userId) {
          setError("Vui lòng đăng nhập để chọn địa chỉ giao hàng");
          setLoading(false);
          return;
        }
        
        console.log("Đang tải danh sách địa chỉ cho user:", userId);
        const response = await authApi.getAllAddresses(userId);
        const addressList = response.data.addresses || [];
        console.log("Danh sách địa chỉ nhận được:", addressList);
        setAddresses(addressList);
        
        // Auto-select default address if no address is selected or if we need to initialize
        if ((!selectedAddressId || selectedAddressId === 'undefined') && addressList.length > 0) {
          // Always prioritize the default address
          const defaultAddress = addressList.find(addr => addr.isDefault === true);
          if (defaultAddress) {
            console.log("Đã tìm thấy địa chỉ mặc định:", defaultAddress._id, defaultAddress.fullAddress);
            onAddressSelect(defaultAddress._id);
          } else if (addressList.length > 0) {
            // Fallback to first address if no default exists
            console.log("Không tìm thấy địa chỉ mặc định, chọn địa chỉ đầu tiên:", addressList[0]._id, addressList[0].fullAddress);
            onAddressSelect(addressList[0]._id);
          }
        } else {
          console.log("Đã có địa chỉ được chọn:", selectedAddressId);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách địa chỉ:", error);
        setError("Không thể tải địa chỉ. Vui lòng thử lại.");
        toast.error("Không thể tải danh sách địa chỉ");
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [userId, selectedAddressId, onAddressSelect]);

  const handleSelectAddress = (addressId) => {
    console.log("Đã chọn địa chỉ:", addressId);
    onAddressSelect(addressId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 py-2">
        {error}
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="text-center py-4 border border-dashed border-gray-300 rounded-md">
        <FiMapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-gray-500 mb-3">Bạn chưa có địa chỉ giao hàng nào</p>
        <Link
          to="/tai-khoan/dia-chi"
          className="bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-md text-sm inline-flex items-center"
        >
          <FiPlus className="mr-1" /> Thêm địa chỉ mới
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium mb-3">Địa chỉ giao hàng</h3>
      
      <div className="space-y-3">
        {addresses.map((address) => (
          <div
            key={address._id}
            className={`border rounded-md p-3 cursor-pointer transition-colors ${
              selectedAddressId === address._id
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleSelectAddress(address._id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-full ${selectedAddressId === address._id ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {selectedAddressId === address._id ? (
                    <FiCheck className="w-4 h-4 text-white" />
                  ) : (
                    <FiHome className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <span className="font-medium">{address.label || "Nhà"}</span>
                {address.isDefault && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Mặc định
                  </span>
                )}
              </div>
              <Link
                to="/tai-khoan/dia-chi"
                className="text-blue-500 hover:text-blue-700"
                onClick={(e) => e.stopPropagation()}
              >
                <FiEdit className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="mt-2 text-sm space-y-1">
              <div className="flex items-start gap-2">
                <FiUser className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                <span>{address.receiverName}</span>
              </div>
              <div className="flex items-start gap-2">
                <FiPhone className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                <span>{address.receiverPhone}</span>
              </div>
              <div className="flex items-start gap-2">
                <FiMapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700">{address.fullAddress}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4">
        <Link
          to="/tai-khoan/dia-chi"
          className="text-green-600 hover:text-green-800 text-sm inline-flex items-center"
        >
          <FiPlus className="mr-1" /> Thêm địa chỉ mới
        </Link>
      </div>
    </div>
  );
} 