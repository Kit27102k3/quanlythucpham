import { useState, useEffect } from "react";
import { authApi } from "../../../api/authApi";
import { toast } from "sonner";
import UpdateAddress from "../../../utils/UpdateAddress";
import { FiHome, FiEdit, FiTrash2, FiCheckCircle, FiMapPin, FiUser, FiPhone } from "react-icons/fi";

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
    }
  };

  // Start editing an address
  const startEditing = (addressId) => {
    setEditingAddressId(addressId);
    setShowAddressForm(true);
  };

  // Display content based on loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-[20px] uppercase font-normal text-[#212b25]">
          Danh sách địa chỉ của bạn
        </h1>
        <button 
          onClick={() => {
            setEditingAddressId(null);
            setShowAddressForm(true);
          }}
          className="cursor-pointer hover-animation-button p-2 bg-[#51bb1a] text-[12px] text-white lg:px-4"
        >
          Thêm địa chỉ mới
        </button>
      </div>

      {showAddressForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-md">
          <h2 className="text-lg font-medium mb-4">
            {editingAddressId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
          </h2>
          <UpdateAddress 
            onUpdate={handleAddressUpdated} 
            editingAddressId={editingAddressId}
            onCancel={() => {
              setShowAddressForm(false);
              setEditingAddressId(null);
            }}
          />
        </div>
      )}

      <div className="border border-gray-200 mt-4 mb-4"></div>

      {addresses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FiMapPin className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p>Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ để tiện cho việc đặt hàng.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div 
              key={address._id} 
              className={`border ${address.isDefault ? 'border-green-500' : 'border-gray-200'} rounded-md p-4 relative`}
            >
              {address.isDefault && (
                <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md flex items-center">
                  <FiCheckCircle className="mr-1" /> Mặc định
                </span>
              )}
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1">
                  <span className={`p-1 rounded-full ${address.isDefault ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <FiHome className={`w-4 h-4 ${address.isDefault ? 'text-white' : 'text-gray-600'}`} />
                  </span>
                  <span className="font-medium ml-1">{address.label || "Nhà"}</span>
                </div>
                
                <div className="flex items-start gap-2 mt-2">
                  <FiUser className="w-4 h-4 text-gray-500 mt-1" />
                  <span>{address.receiverName || "Không có tên người nhận"}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <FiPhone className="w-4 h-4 text-gray-500 mt-1" />
                  <span>{address.receiverPhone || "Không có số điện thoại"}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <FiMapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <span>{address.fullAddress}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address._id)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded flex items-center"
                  >
                    <FiCheckCircle className="mr-1" /> Đặt mặc định
                  </button>
                )}
                
                <button
                  onClick={() => startEditing(address._id)}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-1 px-2 rounded flex items-center"
                >
                  <FiEdit className="mr-1" /> Sửa
                </button>
                
                <button
                  onClick={() => handleDelete(address._id)}
                  className="text-xs bg-red-50 hover:bg-red-100 text-red-700 py-1 px-2 rounded flex items-center"
                >
                  <FiTrash2 className="mr-1" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 