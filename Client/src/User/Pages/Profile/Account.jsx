function Account() {
  return (
    <div>
      <h1 className="text-[19px] font-normal text-[#212B25] mb-2 mt-4 uppercase lg:mt-0">
        Thông tin tài khoản
      </h1>
      <div className="flex flex-col gap-4">
        <p className="text-sm font-bold">
          Họ tên: <span className="font-normal">Nguyễn Trọng Khiêm</span>
        </p>
        <p className="text-sm font-bold">
          Email: <span className="font-normal">kit10012003@gmail.com</span>
        </p>
        <p className="text-sm font-bold">
          Điện thoại: <span className="font-normal">0326743391</span>
        </p>
        <p className="text-sm font-bold">
          Địa chỉ: <span className="font-normal">Sóc Trăng</span>
        </p>
      </div>
    </div>
  );
}

export default Account;
