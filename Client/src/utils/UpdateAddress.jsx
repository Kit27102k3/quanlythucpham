import { useState, useEffect } from "react";
import axios from "axios";
import authApi from "../api/authApi";
import { toast } from "sonner";
import PropTypes from "prop-types";

const host = "https://provinces.open-api.vn/api/";

function UpdateAddress({ onUpdate }) {
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [isHide, setIsHide] = useState(false);
  const [wards, setWards] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [user, setUser] = useState(null);
  const [selectedWard, setSelectedWard] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await authApi.getProfile();
        setUser(res.data);

        if (res.data.address) {
          const parts = res.data.address.split(", ");
          if (parts.length === 4) {
            setHouseNumber(parts[0]);
            const city = cities.find((city) => city.name === parts[3]);
            if (city) {
              setSelectedCity(city.code);
              const responseDistricts = await axios.get(
                `${host}p/${city.code}?depth=2`
              );
              setDistricts(responseDistricts.data.districts);

              const district = responseDistricts.data.districts.find(
                (district) => district.name === parts[2]
              );
              if (district) {
                setSelectedDistrict(district.code);
                const responseWards = await axios.get(
                  `${host}d/${district.code}?depth=2`
                );
                setWards(responseWards.data.wards);

                const ward = responseWards.data.wards.find(
                  (ward) => ward.name === parts[1]
                );
                if (ward) {
                  setSelectedWard(ward.code);
                }
              }
            }
          }
        }
      } catch (error) {
        console.log("Lỗi khi tải hồ sơ người dùng:", error);
      }
    };

    fetchUserProfile();
  }, [cities]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(`${host}?depth=1`);
        setCities(response.data);
      } catch {
        console.log("Không thể tải danh sách tỉnh/thành phố.");
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    let controller = new AbortController();
    if (selectedCity) {
      const fetchDistricts = async () => {
        try {
          const response = await axios.get(`${host}p/${selectedCity}?depth=2`, {
            signal: controller.signal,
          });
          setDistricts(response.data.districts);
          setWards([]);
        } catch (err) {
          if (err.name !== "CanceledError") {
            console.log("Không thể tải danh sách quận/huyện.");
          }
        }
      };
      fetchDistricts();
    }

    return () => controller.abort();
  }, [selectedCity]);

  useEffect(() => {
    let controller = new AbortController();

    if (selectedDistrict) {
      const fetchWards = async () => {
        try {
          const response = await axios.get(
            `${host}d/${selectedDistrict}?depth=2`,
            { signal: controller.signal }
          );
          setWards(response.data.wards);
        } catch (err) {
          if (err.name !== "CanceledError") {
            console.log("Không thể tải danh sách phường/xã.");
          }
        }
      };

      fetchWards();
    }

    return () => controller.abort();
  }, [selectedDistrict]);

  const handleUpdate = async () => {
    if (!user) return;
    
    // Validate inputs
    if (!selectedCity || !selectedDistrict || !selectedWard || !houseNumber) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }
    
    const cityName =
      cities.find((city) => city.code === Number(selectedCity))?.name || "";
    const districtName =
      districts.find((district) => district.code === Number(selectedDistrict))
        ?.name || "";
    const wardName =
      wards.find((ward) => ward.code === Number(selectedWard))?.name || "";

    try {
      const updatedData = {
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        address: `${houseNumber}, ${wardName}, ${districtName}, ${cityName}`,
      };

      console.log("Sending update with data:", updatedData);
      console.log("User ID:", user._id);
      
      const response = await authApi.updateProfile(user._id, updatedData);
      console.log("Update response:", response);
      
      if (response.data && response.data.success) {
        toast.success("Cập nhật thành công");
        onUpdate();
        setIsHide(true);
      } else {
        toast.error(response.data?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      toast.error(`Có lỗi xảy ra khi cập nhật thông tin: ${error.message}`);
    }
  };

  const inputStyles = "border border-gray-300 rounded-md p-2.5 text-sm outline-none w-full focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all duration-200";
  const labelStyles = "text-sm font-medium mb-1.5 text-gray-700";
  const selectStyles = `${inputStyles} bg-white cursor-pointer`;
  const disabledSelectStyles = `${inputStyles} bg-gray-100 cursor-not-allowed opacity-70`;

  return (
    <div>
      {!isHide && (
        <div className="fixed top-0 left-0 w-full h-full  bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="w-[90%] lg:w-[550px] bg-white rounded-lg shadow-xl overflow-hidden animate-fadeIn">
            <div className="bg-gradient-to-r from-green-600 to-green-500 py-3 px-4">
              <h2 className="text-center font-bold text-white text-lg">
                THÔNG TIN GIAO HÀNG
              </h2>
            </div>
            
            <div className="p-5 max-h-[calc(100vh-150px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className={labelStyles}>Họ tên</p>
                  <input
                    type="text"
                    className={`${inputStyles} bg-gray-50`}
                    value={`${user?.firstName || ""} ${user?.lastName || ""}`}
                    readOnly
                  />
                </div>
                <div>
                  <p className={labelStyles}>Số điện thoại</p>
                  <input
                    type="text"
                    className={`${inputStyles} bg-gray-50`}
                    value={user?.phone || ""}
                    readOnly
                  />
                </div>
              </div>

              <div className="mb-4">
                <p className={labelStyles}>Số nhà, tên đường</p>
                <input
                  type="text"
                  placeholder="Ví dụ: 123 Nguyễn Văn A"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className={inputStyles}
                />
              </div>

              <div className="mb-4">
                <p className={labelStyles}>Tỉnh/Thành phố</p>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className={selectStyles}
                >
                  <option value="">-- Chọn Tỉnh/Thành phố --</option>
                  {cities.map((city) => (
                    <option key={city.code} value={city.code}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <p className={labelStyles}>Quận/Huyện</p>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedCity}
                  className={selectedCity ? selectStyles : disabledSelectStyles}
                >
                  <option value="">-- Chọn Quận/Huyện --</option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-5">
                <p className={labelStyles}>Phường/Xã</p>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  disabled={!selectedDistrict}
                  className={selectedDistrict ? selectStyles : disabledSelectStyles}
                >
                  <option value="">-- Chọn Phường/Xã --</option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsHide(!isHide)}
                  className="px-5 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  HỦY BỎ
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-5 py-2.5 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700 transition-colors duration-200 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  CẬP NHẬT ĐỊA CHỈ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

UpdateAddress.propTypes = {
  onUpdate: PropTypes.func.isRequired
};

export default UpdateAddress;
