import { useState, useEffect } from "react";
import { authApi } from "../../../api/authApi";
import { toast } from "sonner";
import UpdateAddress from "../../../utils/UpdateAddress";
import { FiHome, FiEdit, FiTrash2, FiCheckCircle, FiMapPin, FiUser, FiPhone, FiPlus } from "react-icons/fi";

export default function AddressList() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [userId, setUserId] = useState(null);

  // Fetch user ID and addresses on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await authApi.getProfile();
        const userData = response.data;
        setUserId(userData._id);
        
        if (userData._id) {
          const addressesResponse = await authApi.getAllAddresses(userData._id);
          setAddresses(addressesResponse.data.addresses || []);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Không thể tải thông tin địa chỉ");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle deleting an address
  const handleDelete = async (addressId) => {
    if (!userId) return;
    
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    
    try {
      const response = await authApi.deleteAddress(userId, addressId);
      setAddresses(response.data.addresses);
      toast.success("Đã xóa địa chỉ thành công");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Không thể xóa địa chỉ");
    }
  };

  // Set an address as default
  const handleSetDefault = async (addressId) => {
    if (!userId) return;
    
    try {
      const response = await authApi.setDefaultAddress(userId, addressId);
      setAddresses(response.data.addresses);
      toast.success("Đã đặt địa chỉ mặc định thành công");
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error("Không thể đặt địa chỉ mặc định");
    }
  };

  // Handle form submission success
  const handleAddressUpdated = async () => {
    if (!userId) return;
    
    try {
      const response = await authApi.getAllAddresses(userId);
      setAddresses(response.data.addresses || []);
      setShowAddressForm(false);
      setEditingAddressId(null);
    } catch (error) {
      console.error("Error refreshing addresses:", error);
      toast.error("Không thể cập nhật danh sách địa chỉ");
    }
  };

  // Start editing an address
  const startEditing = (addressId) => {
    setEditingAddressId(addressId);
    setShowAddressForm(true);
  };

  // Add a new address
  const handleAddNewAddress = () => {
    setEditingAddressId(null);
    setShowAddressForm(true);
  };

  // Close the address form
  const handleCancelForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
  };

  // Render loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Render address card
  const renderAddressCard = (address) => {
    return (
      <div 
        key={address._id} 
        className={`border transition-all duration-200 hover:shadow-md ${
          address.isDefault 
            ? 'border-green-500 bg-green-50/40' 
            : 'border-gray-200 hover:border-gray-300'
        } rounded-lg p-4 sm:p-6 relative`}
      >
        {address.isDefault && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-green-100 text-green-700 text-xs font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5">
            <FiCheckCircle className="text-green-600" /> Mặc định
          </div>
        )}
        
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center">
            <div className={`p-1.5 sm:p-2 rounded-full ${address.isDefault ? 'bg-green-500' : 'bg-gray-200'}`}>
              <FiHome className={`w-4 h-4 ${address.isDefault ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <span className="font-medium ml-2 sm:ml-2.5 text-base sm:text-lg">{address.label || "Nhà"}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 mt-1">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <FiUser className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-700 text-sm sm:text-base">{address.receiverName || "Không có tên người nhận"}</span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-2.5">
              <FiPhone className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-700 text-sm sm:text-base">{address.receiverPhone || "Không có số điện thoại"}</span>
            </div>
          </div>
          
          <div className="flex items-start lg:h-[60px] gap-2 sm:gap-2.5 min-h-[40px] sm:min-h-0">
            <FiMapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
            <span className="text-gray-700 text-sm sm:text-base">{address.fullAddress}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
          {!address.isDefault && (
            <button
              onClick={() => handleSetDefault(address._id)}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors"
            >
              <FiCheckCircle className="text-green-600" /> Đặt mặc định
            </button>
          )}
          
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => startEditing(address._id)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-sm py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors"
            >
              <FiEdit /> Sửa
            </button>
            
            <button
              onClick={() => handleDelete(address._id)}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors"
            >
              <FiTrash2 /> Xóa
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Button styles for consistency
  const buttonClass = {
    default: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors",
    edit: "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-sm py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors",
    delete: "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors",
    add: "bg-[#51bb1a] hover:bg-[#449e13] text-white py-2 px-4 rounded-md flex items-center gap-2 transition-colors shadow-sm"
  };

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-800">
          Danh sách địa chỉ của bạn
        </h1>
        <button 
          onClick={handleAddNewAddress}
          className={buttonClass.add}
        >
          <FiPlus className="text-white" /> Thêm địa chỉ mới
        </button>
      </div>

      {showAddressForm && (
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-50/70 shadow-sm">
          <h2 className="text-lg sm:text-xl font-medium mb-4 sm:mb-5 text-gray-800 flex items-center">
            {editingAddressId ? (
              <>
                <FiEdit className="mr-2 sm:mr-2.5 text-blue-600" /> Chỉnh sửa địa chỉ
              </>
            ) : (
              <>
                <FiPlus className="mr-2 sm:mr-2.5 text-green-600" /> Thêm địa chỉ mới
              </>
            )}
          </h2>
          <UpdateAddress 
            onUpdate={handleAddressUpdated} 
            editingAddressId={editingAddressId}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4 bg-gray-50/70 rounded-lg border border-dashed border-gray-300">
          <FiMapPin className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
          <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">Chưa có địa chỉ nào</h3>
          <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto mb-5 sm:mb-6">Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ để tiện cho việc đặt hàng.</p>
          <button 
            onClick={handleAddNewAddress}
            className={buttonClass.add}
          >
            <FiPlus /> Thêm địa chỉ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {addresses.map((address) => renderAddressCard(address))}
        </div>
      )}
    </div>
  );
} 