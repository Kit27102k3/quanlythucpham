import {
  EnvelopeClosedIcon,
  GitHubLogoIcon,
} from "@radix-ui/react-icons";
import {
  faEnvelope,
  faLocationDot,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { faFacebook, faInstagram } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Footer() {
  return (
    <footer className="bg-white">
      {/* Newsletter Section */}
      <div className="bg-yellow-500 text-white p-4 grid grid-cols-1 items-center justify-around lg:grid-cols-2 lg:px-[120px]">
        <div className="flex items-center space-x-4 mb-4 lg:mb-0 justify-center">
          <EnvelopeClosedIcon className="w-16 h-16 bg-white text-black p-4 rounded-full" />
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-black">
              ĐĂNG KÝ NHẬN TIN
            </h2>
            <p className="text-sm font-normal text-black">
              Hãy nhận ưu đãi hấp dẫn từ Dnc Food nào!
            </p>
          </div>
        </div>

        <form className="flex justify-center">
          <input
            type="email"
            placeholder="Email của bạn"
            className="p-3 bg-white text-black rounded-l-full px-5 w-72 lg:w-96 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <button
            type="submit"
            className="bg-[#51aa1b] text-white px-6 py-3 text-sm rounded-r-full hover:bg-green-600 transition-colors"
          >
            ĐĂNG KÝ
          </button>
        </form>
      </div>

      {/* Main Footer Content */}
      <div className="grid grid-cols-1 gap-8 mt-8 px-5 lg:grid-cols-4 lg:px-[120px]">
        {/* Company Info */}
        <div>
          <h3 className="text-center text-3xl font-bold">
            DNC<span className="text-green-400">FO</span>OD
          </h3>
          <p className="text-sm text-gray-600 mt-4 text-center lg:text-left">
            DNC FOOD bán lẻ thực phẩm tươi sống, bánh kẹp, đồ hộp, đồ dùng gia
            đình giá rẻ, sản phẩm tươi mới, nguồn gốc đảm bảo, dịch vụ chu đáo.
          </p>
          <div className="flex justify-center lg:justify-start space-x-4 mt-4 gap-4">
            <GitHubLogoIcon className="w-8 h-8 text-black hover:opacity-75 transition-colors" />
            <FontAwesomeIcon icon={faInstagram} className="w-8 h-8 text-[#C13584] hover:opacity-75 transition-colors" />
            <FontAwesomeIcon href="https://www.facebook.com/tzkit27" icon={faFacebook} className="w-8 h-8 text-[#1877F2] hover:opacity-75 transition-colors" />
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-4">
            THÔNG TIN LIÊN HỆ
          </h4>
          <div className="space-y-3 flex flex-col gap-2 text-sm text-gray-600">
            <div className="flex items-start space-x-2 gap-2">
              <FontAwesomeIcon icon={faLocationDot} className="mt-1 w-4 text-red-500" />
              <p>
                Trường Đại học Nam Cần Thơ, Nguyễn Văn Cừ nối dài, Cần Thơ City
              </p>
            </div>
            <div className="flex items-center space-x-2 gap-2">
              <FontAwesomeIcon icon={faPhone} className="w-4 text-green-500" />
              <p>0326 743 391</p>
            </div>
            <div className="flex items-center space-x-2 gap-2">
              <FontAwesomeIcon icon={faEnvelope} className="w-4 text-blue-500" />
              <p>kit10012003@gmail.com</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-4">
            HỖ TRỢ KHÁCH HÀNG
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "Trang chủ",
              "Giới thiệu",
              "Sản phẩm",
              "Khuyến mãi",
              "Tin tức",
              "Mẹo hay",
              "Liên hệ",
              "Cửa hàng",
            ].map((item) => (
              <li
                key={item}
                className="hover:text-green-600 cursor-pointer transition-colors"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Featured Services */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-4">
            DỊCH VỤ NỔI BẬT
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 ">
            {[
              "Trang chủ",
              "Giới thiệu",
              "Sản phẩm",
              "Khuyến mãi",
              "Tin tức",
              "Liên hệ",
              "Cửa hàng",
            ].map((item) => (
              <li
                key={item}
                className="hover:text-green-600 cursor-pointer transition-colors"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
