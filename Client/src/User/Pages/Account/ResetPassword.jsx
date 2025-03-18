export default function ResetPassword() {
  return (
    <div className="max-w-md bg-background">
      <h2 className="text-[20px] uppercase font-normal">ĐỔI MẬT KHẨU</h2>
      <p className="text-sm font-normal py-4">
        Để đảm bảo tính bảo mật vui lòng đặt mật khẩu với ít nhất 8 ký tự
      </p>
      <form>
        <div className="mb-4">
          <label
            className="block text-sm  font-normal"
            htmlFor="old-password"
          >
            MẬT KHẨU CŨ *
          </label>
          <input
            className="mt-1 block w-full p-2 border outline-none"
            type="password"
            id="old-password"
            placeholder="Mật khẩu cũ"
            required
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-sm font-normal "
            htmlFor="new-password"
          >
            MẬT KHẨU MỚI *
          </label>
          <input
            className="mt-1 block w-full p-2 border outline-none"
            type="password"
            id="new-password"
            placeholder="Mật khẩu mới"
            required
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-sm font-normal "
            htmlFor="confirm-password"
          >
            XÁC NHẬN LẠI MẬT KHẨU *
          </label>
          <input
            className="mt-1 block w-full p-2 border outline-none"
            type="password"
            id="confirm-password"
            placeholder="Xác nhận lại mật khẩu"
            required
          />
        </div>

        <button className="w-full bg-[#51bb1a] cursor-pointer font-medium text-white hover:bg-secondary/80 p-2 hover-animation-button">
          ĐẶT LẠI MẬT KHẨU
        </button>
      </form>
    </div>
  );
}
