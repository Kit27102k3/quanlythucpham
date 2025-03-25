import useFetchUserProfile from "../../Until/useFetchUserProfile";

function Account() {
  const users = useFetchUserProfile();

  return (
    <div>
      <h1 className="text-[19px] font-normal text-[#212B25] mb-2 mt-4 uppercase lg:mt-0">
        Thông tin tài khoản
      </h1>
      <>
        <div className="flex flex-col gap-4">
          <p className="text-sm font-bold">
            Họ tên:{" "}
            <span className="font-normal">{`${users?.firstName} ${users?.lastName}`}</span>
          </p>
          <p className="text-sm font-bold">
            Email: <span className="font-normal">{users?.email}</span>
          </p>
          <p className="text-sm font-bold">
            Điện thoại: <span className="font-normal">{users?.phone}</span>
          </p>
          <p className="text-sm font-bold">
            Địa chỉ: <span className="font-normal">{users?.address}</span>
          </p>
        </div>
      </>
    </div>
  );
}

export default Account;
