import {
  EnvelopeClosedIcon,
  GitHubLogoIcon,
  InstagramLogoIcon,
} from "@radix-ui/react-icons";
import {
  faEnvelope,
  faLocationDot,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Footer() {
  return (
    <div className="bg-white">
      <div className="bg-yellow-500 text-white p-4 grid grid-cols-1 items-center justify-around lg:grid-cols-2 lg:px-[120px] lg:items-center">
        <div className="grid grid-cols-1 lg:flex mb-2 text-center gap-6 items-center lg:items-center ">
          <EnvelopeClosedIcon className="size-18 hide-on-mobile bg-white rounded-full text-black p-5 " />
          <h2 className="text-[18px] lg:text-[24px] text-black font-semibold">
            ĐĂNG KÝ NHẬN TIN
            <p className="text-[13px] lg:text-[16px] font-normal text-black ">
              Hãy nhận ưu đãi hấp dẫn từ Dnc Food nào!
            </p>
          </h2>
        </div>
        <form className="flex items-center justify-center ">
          <input
            type="email"
            placeholder="Email của bạn"
            className="p-2 border bg-white text-black border-none outline-none w-72 h-12 rounded-l-full px-5 lg:w-96"
            required
          />
          <button className="bg-[#51aa1b] p-[14px] w-24 text-[12px] h-12 cursor-pointer font-medium rounded-r-full">
            ĐĂNG KÝ
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 justify-around mt-4 px-5 lg:grid-cols-4 lg:px-[120px]">
        <div className="w-full lg:px-4 ">
          <h3 className="text-black text-center text-4xl font-bold ">
            DNC<span className="text-green-400"> FO</span>OD
          </h3>
          <p className="text-[14px] mt-2 text-[#666666]">
            DNC FOOD bán lẻ thực phẩm tươi sống, bánh kẹp, đồ hộp, đồ dùng gia
            đình giá rẻ, sản phẩm tươi mới, nguồn gốc đảm bảo, dịch vụ chu đáo.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <GitHubLogoIcon className="size-8 " />
            <InstagramLogoIcon className="size-8 " />
          </div>
        </div>
        <div className="w-full mt-5 lg:px-4">
          <h4 className="text-sm text-[#222222] mb-2">THÔNG TIN LIÊN HỆ</h4>
          <div className="flex gap-1 text-sm">
            <FontAwesomeIcon icon={faLocationDot} className="mt-1" />
            <p className="">
              Trường Đại học Nam Cần Thơ, Nguyễn <br /> Văn Cừ nối dài, Cần Thơ
              City
            </p>
          </div>
          <div className="flex gap-1 items-center mt-2 text-sm">
            <FontAwesomeIcon icon={faPhone} />
            <p>0326 743 391</p>
          </div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <FontAwesomeIcon icon={faEnvelope} />
            <p>kit10012003@gmail.com</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1">
          <div className="w-full mt-5 lg:px-4">
            <h4 className="text-sm text-[#222222]">HỖ TRỢ KHÁCH HÀNG</h4>
            <ul className="flex flex-col gap-2 mt-2 text-sm text-[#666666]">
              <li>Trang chủ</li>
              <li>Giới thiệu</li>
              <li>Sản phẩm</li>
              <li>Khuyến mãi</li>
              <li>Tin tức</li>
              <li>Mẹo hay</li>
              <li>Liên hệ</li>
              <li>Cửa hàng</li>
            </ul>
          </div>

          <div className="w-full mt-5 lg:px-4 lg:-mt-[245px] lg:ml-80">
            <h4 className="text-sm text-[#222222]">DỊCH VỤ NỔI BẬT</h4>
            <ul className="grid  gap-2 mt-2 text-sm text-[#666666]">
              <li>Trang chủ</li>
              <li>Giới thiệu</li>
              <li>Sản phẩm</li>
              <li>Khuyến mãi</li>
              <li>Tin tức</li>
              <li>Liên hệ</li>
              <li>Cửa hàng</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;
