import { useState, useEffect } from "react";
import axios from "axios";

const host = "https://provinces.open-api.vn/api/";

function UpdateAddress() {
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [isHide, setIsHide] = useState(false);
  const [wards, setWards] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  useEffect(() => {
    axios.get(`${host}?depth=1`).then((response) => {
      setCities(response.data);
    });
  }, []);

  useEffect(() => {
    if (selectedCity) {
      axios.get(`${host}p/${selectedCity}?depth=2`).then((response) => {
        setDistricts(response.data.districts);
        setWards([]);
      });
    }
  }, [selectedCity]);

  useEffect(() => {
    if (selectedDistrict) {
      axios.get(`${host}d/${selectedDistrict}?depth=2`).then((response) => {
        setWards(response.data.wards);
      });
    }
  }, [selectedDistrict]);

  return (
    <div>
      {!isHide && (
        <div className="absolute top-52 right-0 left-0 w-[90%] lg:w-[50%] lg:p-5 mx-auto bg-white cart-section-right border p-4 shadow-lg rounded-lg">
          <h2 className="main-h2 text-center uppercase font-medium border-b border-gray-200">
            Thông tin Giao hàng
          </h2>
          <div className="cart-section-right-input-name-phone mt-5 lg:grid lg:grid-cols-2 gap-5">
            <div>
              <p className="text-sm font-medium mb-1">Họ tên</p>
              <input
                type="text"
                placeholder="Nhập họ tên của bạn..."
                className=" border border-gray-400 p-2 text-sm outline-none w-full"
              />
            </div>
            <div className="">
              <p className="text-sm font-medium mb-1">Số điện thoại</p>
              <input
                type="text"
                placeholder="Nhập số điên thoại của bạn..."
                className=" border border-gray-400 p-2 text-sm outline-none w-full"
              />
            </div>
          </div>
          <div className="cart-section-right-input-email mt-2">
            <p className="text-sm font-medium mb-1">Địa chỉ</p>
            <input
              type="text"
              placeholder="Nhập số nhà của bạn..."
              className=" border border-gray-400 p-2 text-sm outline-none w-full"
            />
          </div>
          <div className="cart-section-right-select mt-2">
            <p className="text-sm font-medium mb-1">Tỉnh thành</p>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className=" border border-gray-400 cursor-pointer p-2 text-sm outline-none w-full"
            >
              <option value="">Tỉnh/Thành phố</option>
              {cities.map((city) => (
                <option key={city.code} value={city.code}>
                  {city.name}
                </option>
              ))}
            </select>

            <p className="text-sm font-medium mb-1 mt-2">Quận/Huyện</p>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedCity}
              className=" border border-gray-400 cursor-pointer p-2 text-sm outline-none w-full"
            >
              <option value="">Quận/Huyện</option>
              {districts.map((district) => (
                <option key={district.code} value={district.code}>
                  {district.name}
                </option>
              ))}
            </select>

            <p className="text-sm font-medium mb-1 mt-2">Phường/Xã</p>
            <select
              disabled={!selectedDistrict}
              className=" border border-gray-400 cursor-pointer p-2 text-sm outline-none w-full"
            >
              <option value="">Phường/Xã</option>
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
              className=" cursor-pointer border border-gray-400 bg-red-700 text-white p-2 px-8 text-sm uppercase"
            >
              Hủy
            </button>
            <button className="main-btn hover-animation-button cursor-pointer text-white bg-[#51bb1a] p-2 px-8 uppercase text-sm">
              Cập nhật địa chỉ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpdateAddress;
