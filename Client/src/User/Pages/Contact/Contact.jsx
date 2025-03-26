import "primeicons/primeicons.css";
import "../../../index.css";

const information = [
  {
    icon: "pi pi-phone",
    name: "Hotline",
    title: "0326 743391",
  },
  {
    icon: "pi pi-envelope",
    name: "Email",
    title: "kit10012003@gmail.com",
  },
  {
    icon: "pi pi-map-marker",
    name: "Địa chỉ",
    title: "Đại học Nam Cần Thơ, Nguyễn Văn Cừ nối dài",
  },
];

function Contact() {
  return (
    <div className="px-4 mt-4 mb-4 lg:px-[240px]">
      <div className=" border-b">
        <div className="">
          <div className="grid grid-cols-3 ">
            {information.map((info, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center"
              >
                <i
                  className={`${info.icon} p-3 rounded-full lg:p-8 contact-icon`}
                  style={{
                    fontSize: "16px",
                    border: "1px solid black",
                  }}
                ></i>
                <h2 className="mt-2 text-[10px] font-semibold lg:text-lg">
                  {info.name}
                </h2>
                <p className="text-[10px] text-center lg:text-[16px]">
                  {info.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        <h3 className="mt-2 text-2xl font-medium text-center lg:mt-5">
          GỬI THÔNG TIN
        </h3>
        <p className="text-center text-sm mt-2">
          Bạn hãy điền nội dung tin nhắn vào form dưới đây và gửi cho chúng tôi.
          Chúng tôi sẽ trả lời bạn sau khi nhận được.
        </p>

        <form className="mt-4 space-y-4">
          <div className=" mb-4">
            <div className="grid grid-cols-2 gap-5 mb-2">
              <label className="block text-[12px] font-normal">HỌ VÀ TÊN</label>
              <label className="block text-[12px] font-normal">
                ĐIỆN THOẠI
              </label>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <input
                type="text"
                placeholder="Nhập họ và tên"
                className="mt-1 p-4 block w-full border border-border outline-none border-[#c8c8d4] text-[12px] font-normal"
                required
              />
              <input
                type="tel"
                placeholder="Nhập số điện thoại"
                className="mt-1 p-4 block w-full border border-border outline-none border-[#c8c8d4] text-[12px] font-normal"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[12px] font-normal">EMAIL</label>
            <input
              type="email"
              placeholder="Nhập địa chỉ Email"
              className="mt-1 p-4 block w-full border border-border outline-none border-[#c8c8d4] text-[12px] font-normal"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-normal">NỘI DUNG</label>
            <textarea
              placeholder="Nội dung liên hệ"
              className="mt-1 p-4 block w-full border border-border outline-none border-[#c8c8d4] text-[12px] font-normal"
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-[#51aa1b] text-white hover:bg-primary/80 p-3 mt-5 mb-10 cursor-pointer text-[12px]"
          >
            GỬI TIN NHẮN
          </button>
        </form>
      </div>
      <div className="grid grid-cols-1">
        <h1 className="uppercase text-xl font-light mt-5 text-center mb-5">
          Bản đồ cửa hàng
        </h1>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.107887665177!2d105.72025667460117!3d10.0079464900979!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a08903d92d1d0d%3A0x2c147a40ead97caa!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBOYW0gQ-G6p24gVGjGoQ!5e0!3m2!1svi!2s!4v1739710011236!5m2!1svi!2s"
          style={{
            height: "250px",
          }}
          className="google-map-mobile google-map-pc"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
}

export default Contact;
