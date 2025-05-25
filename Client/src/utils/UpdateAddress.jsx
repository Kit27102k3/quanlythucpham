/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import axios from "axios";
import {authApi} from "../api/authApi";
import { toast } from "sonner";
import PropTypes from "prop-types";
import mapboxSdk from '@mapbox/mapbox-sdk/services/geocoding';

const host = "https://provinces.open-api.vn/api/";
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const geocodingClient = mapboxSdk({ accessToken: MAPBOX_ACCESS_TOKEN });

// Import hàm geocodeAddressWithOSM từ MapUtils nếu có thể
let geocodeAddressWithOSM;
try {
  import('../User/Pages/Profile/OrderDetail/MapUtils').then(module => {
    geocodeAddressWithOSM = module.geocodeAddressWithOSM;
  });
} catch (error) {
  console.warn('Không thể import hàm geocodeAddressWithOSM từ MapUtils:', error);
}

function UpdateAddress({ onUpdate, editingAddressId, onCancel }) {
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [wards, setWards] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [user, setUser] = useState(null);
  const [selectedWard, setSelectedWard] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Nhà");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  
  // Fetch province/city data
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(`${host}?depth=1`);
        setCities(response.data);
      } catch (error) {
        console.log("Không thể tải danh sách tỉnh/thành phố.");
      }
    };
    fetchCities();
  }, []);

  // Fetch user data and set initial values
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const res = await authApi.getProfile();
        const userData = res.data;
        setUser(userData);
        
        // If not editing an existing address, set default receiver info from user
        if (!editingAddressId) {
          setReceiverName(`${userData.firstName} ${userData.lastName}`);
          setReceiverPhone(userData.phone || '');
        }
        
        // If editing address, fetch specific address data
        if (editingAddressId && userData._id) {
          try {
            const addressesResponse = await authApi.getAllAddresses(userData._id);
            const addresses = addressesResponse.data.addresses || [];
            const addressToEdit = addresses.find(addr => addr._id === editingAddressId);
            
            if (addressToEdit) {
              setEditingAddress(addressToEdit);
              
              // Set form fields based on the address being edited
              setHouseNumber(addressToEdit.houseNumber || '');
              setAddressLabel(addressToEdit.label || 'Nhà');
              setReceiverName(addressToEdit.receiverName || '');
              setReceiverPhone(addressToEdit.receiverPhone || '');
              setIsDefault(addressToEdit.isDefault || false);
              
              // Find and set location data (province/city, district, ward)
              if (addressToEdit.province) {
                const city = cities.find(c => c.name === addressToEdit.province);
            if (city) {
              setSelectedCity(city.code);
                  await fetchDistricts(city.code);

                  if (addressToEdit.district) {
                    const district = districts.find(d => d.name === addressToEdit.district);
              if (district) {
                setSelectedDistrict(district.code);
                      await fetchWards(district.code);

                      if (addressToEdit.ward) {
                        const ward = wards.find(w => w.name === addressToEdit.ward);
                if (ward) {
                  setSelectedWard(ward.code);
                }
              }
            }
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error fetching address for editing:", error);
          }
        }
      } catch (error) {
        console.log("Lỗi khi tải hồ sơ người dùng:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [editingAddressId, cities]);

  // Handle city/province selection change
  const fetchDistricts = async (cityCode) => {
    try {
      setSelectedDistrict("");
      setSelectedWard("");
      setWards([]);
      
      const response = await axios.get(`${host}p/${cityCode}?depth=2`);
      setDistricts(response.data.districts);
    } catch (error) {
      console.log("Lỗi khi tải quận/huyện:", error);
    }
  };

  const handleCityChange = async (e) => {
    const cityCode = e.target.value;
    setSelectedCity(cityCode);
    
    if (cityCode) {
      await fetchDistricts(cityCode);
    } else {
      setDistricts([]);
      setSelectedDistrict("");
          setWards([]);
      setSelectedWard("");
    }
  };

  // Handle district selection change
  const fetchWards = async (districtCode) => {
    try {
      setSelectedWard("");
      
      const response = await axios.get(`${host}d/${districtCode}?depth=2`);
      setWards(response.data.wards);
    } catch (error) {
      console.log("Lỗi khi tải phường/xã:", error);
    }
  };

  const handleDistrictChange = async (e) => {
    const districtCode = e.target.value;
    setSelectedDistrict(districtCode);
    
    if (districtCode) {
      await fetchWards(districtCode);
    } else {
      setWards([]);
      setSelectedWard("");
    }
  };

  /**
   * Lấy tọa độ từ địa chỉ sử dụng OpenStreetMap hoặc Mapbox
   * @param {string} address - Địa chỉ cần lấy tọa độ
   * @returns {Promise<Object>} Tọa độ {lat, lng}
   */
  const getCoordinatesFromAddress = async (address) => {
    try {
      setIsGeocoding(true);
      
      // Nếu có hàm geocodeAddressWithOSM từ MapUtils, sử dụng nó
      if (geocodeAddressWithOSM) {
        console.log('Sử dụng OpenStreetMap để lấy tọa độ cho:', address);
        const result = await geocodeAddressWithOSM(address);
        if (result) {
          console.log('OpenStreetMap geocoding thành công:', result);
          return { lat: result.lat, lng: result.lng };
        }
      }
      
      // Fallback: Sử dụng Mapbox nếu không có hoặc OpenStreetMap thất bại
      console.log('Sử dụng Mapbox để lấy tọa độ cho:', address);
      const fullAddress = `${address}, Việt Nam`;
      
      const timestamp = new Date().getTime();
      
      const response = await geocodingClient
        .forwardGeocode({
          query: fullAddress,
          countries: ['vn'],
          limit: 1,
          language: ['vi'],
          types: ['address', 'place', 'locality'],
          autocomplete: false,
          fuzzyMatch: true,
          routing: true,
          cache: timestamp.toString()
        })
        .send();
      
      if (response && response.body && response.body.features && response.body.features.length > 0) {
        const feature = response.body.features[0];
        const [lng, lat] = feature.center;
        
        console.log('Mapbox geocoding result:', {
          address: fullAddress,
          result: feature.place_name,
          coordinates: { lng, lat }
        });
        
        return { lat, lng };
      }
    
      console.warn('Không tìm thấy tọa độ cho địa chỉ:', address);
      return null;
    } catch (error) {
      console.error('Lỗi khi lấy tọa độ:', error);
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUpdate = async () => {
    if (!user) {
      toast.error("Không tìm thấy thông tin người dùng");
      return;
    }
    
    if (!selectedCity || !selectedDistrict || !selectedWard || !houseNumber) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }
    
    if (!receiverName) {
      toast.error("Vui lòng nhập tên người nhận");
      return;
    }
    
    if (!receiverPhone) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    
    const cityName =
      cities.find((city) => city.code === Number(selectedCity))?.name || "";
    const districtName =
      districts.find((district) => district.code === Number(selectedDistrict))
        ?.name || "";
    const wardName =
      wards.find((ward) => ward.code === Number(selectedWard))?.name || "";

    const fullAddress = `${houseNumber}, ${wardName}, ${districtName}, ${cityName}`;
    
    try {
      setIsLoading(true);
      
      // Lấy tọa độ từ địa chỉ
      const coords = await getCoordinatesFromAddress(fullAddress);
      
      const addressData = {
        fullAddress: fullAddress,
        houseNumber: houseNumber,
        ward: wardName,
        district: districtName,
        province: cityName,
        label: addressLabel,
        receiverName: receiverName,
        receiverPhone: receiverPhone,
        isDefault: isDefault,
        coordinates: coords ? {
          lat: coords.lat,
          lng: coords.lng
        } : undefined
      };

      // Determine if we're adding a new address or updating an existing one
      if (editingAddressId) {
        // Update existing address
        await authApi.updateAddress(user._id, editingAddressId, addressData);
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        // Add new address
        await authApi.addAddress(user._id, addressData);
        toast.success("Thêm địa chỉ thành công");
      }
      
      // Call the onUpdate callback to refresh the parent component
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      toast.error(`Có lỗi xảy ra: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = "border border-gray-300 rounded-md p-2.5 text-sm outline-none w-full focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all duration-200";
  const labelStyles = "text-sm font-medium mb-1.5 text-gray-700";
  const selectStyles = `${inputStyles} bg-white cursor-pointer`;
  const disabledSelectStyles = `${inputStyles} bg-gray-100 cursor-not-allowed opacity-70`;

  const renderGeocodeStatus = () => {
    if (isGeocoding) {
      return (
        <div className="text-sm text-blue-600 mt-2 flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang xác định tọa độ...
        </div>
      );
    }
    return null;
  };

  const labelOptions = ["Nhà", "Công ty", "Khác"];

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 space-y-4">
      <div className="space-y-4">
        {/* Thông tin người nhận */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">Thông tin người nhận</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
              <label className={labelStyles} htmlFor="receiverName">
                Tên người nhận
              </label>
              <input
                type="text"
                id="receiverName"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className={inputStyles}
                placeholder="Nhập tên người nhận"
              />
            </div>
            
                <div>
              <label className={labelStyles} htmlFor="receiverPhone">
                Số điện thoại
              </label>
                  <input
                type="tel"
                id="receiverPhone"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className={inputStyles}
                placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelStyles} htmlFor="addressLabel">
                Nhãn địa chỉ
              </label>
              <select
                id="addressLabel"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
                className={selectStyles}
              >
                {labelOptions.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center mt-6">
                <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                Đặt làm địa chỉ mặc định
              </label>
            </div>
          </div>
              </div>

        {/* Địa chỉ */}
        <div className="space-y-4 mt-4">
          <h3 className="font-medium text-gray-800">Địa chỉ chi tiết</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelStyles} htmlFor="city">
                Tỉnh / Thành phố
              </label>
                <select
                id="city"
                  value={selectedCity}
                onChange={handleCityChange}
                  className={selectStyles}
                >
                <option value="">Chọn Tỉnh/Thành phố</option>
                  {cities.map((city) => (
                    <option key={city.code} value={city.code}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

            <div>
              <label className={labelStyles} htmlFor="district">
                Quận / Huyện
              </label>
                <select
                id="district"
                  value={selectedDistrict}
                onChange={handleDistrictChange}
                className={selectedCity ? selectStyles : disabledSelectStyles}
                  disabled={!selectedCity}
                >
                <option value="">Chọn Quận/Huyện</option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

            <div>
              <label className={labelStyles} htmlFor="ward">
                Phường / Xã
              </label>
                <select
                id="ward"
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                className={selectedDistrict ? selectStyles : disabledSelectStyles}
                  disabled={!selectedDistrict}
                >
                <option value="">Chọn Phường/Xã</option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>

            <div>
              <label className={labelStyles} htmlFor="houseNumber">
                Số nhà, đường, thôn/ấp
              </label>
              <input
                type="text"
                id="houseNumber"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                className={inputStyles}
                placeholder="Nhập số nhà, tên đường, thôn/ấp..."
              />
            </div>
          </div>
        </div>
      </div>

      {renderGeocodeStatus()}

      <div className="flex justify-end gap-5 space-x-3 mt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border cursor-pointer border-gray-300 rounded-md text-gray-700 text-sm hover:bg-gray-50"
          >
            Hủy
          </button>
        )}
        
        <button
          type="button"
          onClick={handleUpdate}
          className="px-4 py-2 bg-[#51bb1a] cursor-pointer rounded-md text-white text-sm hover:bg-[#449e13] flex items-center"
          disabled={isLoading || isGeocoding}
        >
          {(isLoading || isGeocoding) && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
        </button>
      </div>
    </div>
  );
}

UpdateAddress.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  editingAddressId: PropTypes.string,
  onCancel: PropTypes.func
};

export default UpdateAddress;