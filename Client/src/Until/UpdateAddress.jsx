import { useState, useEffect } from "react";
import axios from "axios";
import authApi from "../api/authApi";
import { toast } from "sonner";

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
      } catch (err) {
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

      const res = await authApi.updateProfile(user._id, updatedData);
      toast.success("Cập nhật thành công");
      onUpdate();
      setIsHide(true);
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      toast.error("Có lỗi xảy ra khi cập nhật thông tin.");
    }
  };

  return (
    <div>
      {!isHide && (
        <div className="absolute top-52 right-0 left-0 w-[90%] lg:w-[50%] lg:p-5 mx-auto bg-white border p-4 shadow-lg rounded-lg">
          <h2 className="text-center uppercase font-medium border-b border-gray-200">
            Thông tin Giao hàng
          </h2>
          <div className="grid grid-cols-2 gap-5 mt-5">
            <div>
              <p className="text-sm font-medium mb-1">Họ tên</p>
              <input
                type="text"
                className="border border-gray-400 p-2 text-sm outline-none w-full"
                value={`${user?.firstName || ""} ${user?.lastName || ""}`}
                readOnly
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Số điện thoại</p>
              <input
                type="text"
                className="border border-gray-400 p-2 text-sm outline-none w-full"
                value={user?.phone || ""}
                readOnly
              />
            </div>
          </div>

          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Số nhà</p>
            <input
              type="text"
              placeholder="Nhập số nhà của bạn..."
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              className="border border-gray-400 p-2 text-sm outline-none w-full"
            />
          </div>

          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Tỉnh/Thành</p>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="border border-gray-400 p-2 text-sm outline-none w-full"
            >
              <option value="">Chọn Tỉnh/Thành</option>
              {cities.map((city) => (
                <option key={city.code} value={city.code}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Quận/Huyện</p>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedCity}
              className="border border-gray-400 p-2 text-sm outline-none w-full"
            >
              <option value="">Chọn Quận/Huyện</option>
              {districts.map((district) => (
                <option key={district.code} value={district.code}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Phường/Xã</p>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              disabled={!selectedDistrict}
              className="border border-gray-400 p-2 text-sm outline-none w-full"
            >
              <option value="">Chọn Phường/Xã</option>
              {wards.map((ward) => (
                <option key={ward.code} value={ward.code}>
                  {ward.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center mt-5 gap-5">
            <button
              onClick={() => setIsHide(!isHide)}
              className="border border-gray-400 hover:opacity-90 bg-red-700 text-white p-2 px-8 text-sm uppercase cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleUpdate}
              className="bg-[#51bb1a] hover-animation-button text-white p-2 px-8 uppercase text-sm cursor-pointer"
            >
              Cập nhật địa chỉ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpdateAddress;
