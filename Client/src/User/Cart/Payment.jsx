import { ChevronDownIcon, ExitIcon } from "@radix-ui/react-icons";
import { Badge } from "primereact/badge";
import { Avatar } from "primereact/avatar";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faMoneyCheckDollar } from "@fortawesome/free-solid-svg-icons";

const host = "https://provinces.open-api.vn/api/";

export default function Payment() {
  const [orderDetails, setOrderDetails] = useState({
    productCount: 1,
    totalPrice: 53500,
  });
  const [coupon, setCoupon] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
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

  const handleApplyCoupon = () => {
    console.log(`Applying coupon: ${coupon}`);
  };

  return (
    <div className="p-4 lg:flex lg:justify-between lg:items-start lg:max-w-6xl lg:mx-auto lg:relative">
      <div className="lg:w-1/2 lg:pr-4">
        <h3 className="text-4xl font-bold text-center lg:text-left lg:absolute lg:top-10 lg:left-72">
          DNC<span className="text-green-200"> FO</span>OD
        </h3>

        {/** CỘT 3 */}
        <div className="bg-[#fafafa] border border-[#fafafa] rounded-lg lg:absolute lg:top-0 lg:right-0 lg:-mr-40 lg:w-[450px] lg:min-h-screen lg:border-l-gray-700">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-1">
              <div>Đơn hàng ({orderDetails.productCount} sản phẩm)</div>
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform lg-hide-chevron hide-on-pc ${
                  showDetails ? "rotate-180" : "rotate-0"
                }`}
                onClick={() => setShowDetails(!showDetails)}
              />
            </div>
            <div>{orderDetails.totalPrice.toLocaleString()}đ</div>
          </div>

          <AnimatePresence>
            {(showDetails || window.innerWidth >= 1024) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ProductDetails />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between p-3 ">
            <input
              type="text"
              className="border p-2 rounded-md w-[70%] focus:outline-none "
              placeholder="Nhập mã giảm giá"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
            <button
              className="bg-[#51bb1a] p-2 rounded-md text-white hover:bg-green-600 transition"
              onClick={handleApplyCoupon}
            >
              Áp dụng
            </button>
          </div>
          <div>
            <div className="flex justify-between p-2">
              <div>Tạm tính</div>
              <div>13.500đ</div>
            </div>
            <div className="flex justify-between p-2">
              <div>Phí vận chuyển</div>
              <div>40.000đ</div>
            </div>
            <div className="flex justify-between p-2 border-t">
              <div>Tổng cộng</div>
              <div className="text-[20px] text-[#51bb1a]">53.500đ</div>
            </div>
          </div>
        </div>
      </div>

      {/*     CỘT 1     */}

      <div className="bg-white border-gray-500 lg:w-[70%] lg:pl-4 lg:absolute lg:left-0 lg:top-32">
        <div className="flex items-center justify-between lg:flex">
          <div className="flex items-center gap-3">
            <i
              className="pi pi-address-book"
              style={{
                fontSize: "24px",
              }}
            ></i>
            <span className="text-[20px] font-medium">Thông tin nhận hàng</span>
          </div>
          <div className="flex items-center gap-2 text-[#51bb1a] cursor-pointer lg:absolute lg:left-64 lg:mt-1">
            <ExitIcon />
            <button>Đăng xuất</button>
          </div>
        </div>
        <div className="cart-section-right-input-name-phone mt-5 lg:grid gap-2 lg:w-[400px] ">
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
        <div className="cart-section-right-input-email mt-2 lg:w-[400px]">
          <p className="text-sm font-medium mb-1">Địa chỉ</p>
          <input
            type="text"
            placeholder="Nhập số nhà của bạn..."
            className=" border border-gray-400 p-2 text-sm outline-none w-full"
          />
        </div>
        <div className="cart-section-right-select mt-2 lg:w-[400px]">
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
        <div className="cart-section-right-input-name-phone mt-5 lg:grid lg:grid-cols-2 gap-5">
          <input
            type="text"
            placeholder="Ghi chú tùy chọn..."
            className=" border border-gray-400 p-4 text-sm outline-none w-full lg:w-[400px]"
          />
        </div>
        {/** CỘT 2 */}
        <div className="lg:absolute lg:left-[55%] lg:top-0 lg:right-0">
          <div className="mt-5">
            <FontAwesomeIcon icon={faCar} />
            <span className="ml-2">Vận chuyển</span>
            <div className="flex items-center justify-between border mt-4 p-3 rounded-md lg:w-[400px]">
              <div className="flex items-center gap-2">
                <input type="radio" name="delivery" id="standard" />
                <label htmlFor="standard">Giao hàng tiêu chuẩn</label>
              </div>
              <div>40.000đ</div>
            </div>
          </div>
          <div className="mt-5">
            <FontAwesomeIcon icon={faMoneyCheckDollar} />
            <span className="ml-2">Thanh toán</span>
            <div className="flex items-center justify-between border mt-4 p-3 rounded-md lg:w-[400px]">
              <div className="flex items-center gap-2">
                <input type="radio" name="payment" id="cod" />
                <label htmlFor="cod">Thanh toán khi nhận hàng (COD)</label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col mt-4 gap-4 lg:absolute lg:right-0 lg:grid lg:grid-cols-2 lg:-mr-90 lg:place-items-center lg:top-52 lg:gap-10 ">
          <button className="p-2 bg-[#51bb1a] text-white cursor-pointer lg:w-full lg:rounded-md">
            Đặt hàng
          </button>
          <a
            href="gio-hang"
            className="text-center hover:text-[#51bb1a] cursor-pointer"
          >
            Quay về giỏ hàng
          </a>
        </div>
      </div>
    </div>
  );
}

const ProductDetails = () => {
  return (
    <div className="grid grid-cols-[20%_60%_20%] items-center mt-5 p-2">
      <Avatar
        className="w-16 h-16 p-overlay-badge"
        image="https://bizweb.dktcdn.net/thumb/large/100/360/151/products/nuocdua.jpg?v=1562726113047"
        size="xlarge"
      >
        <Badge value="4" severity="success" />
      </Avatar>
      <div className="text-sm">
        Nước dừa xiêm hương vị sen Cocoxim hộp 330ml
      </div>
      <div className="text-right font-semibold">13.500đ</div>
    </div>
  );
};
