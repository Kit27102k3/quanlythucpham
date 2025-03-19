import { useState, useEffect } from "react";
import authApi from "../../../api/authApi";

function Account() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await authApi.getProfile();
        setUsers(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchUserProfile();
  }, []);

  return (
    <div>
      <h1 className="text-[19px] font-normal text-[#212B25] mb-2 mt-4 uppercase lg:mt-0">
        Thông tin tài khoản
      </h1>
      <>
        {users.map((user, index) => (
          <div key={index} className="flex flex-col gap-4">
            <p className="text-sm font-bold">
              Họ tên:{" "}
              <span className="font-normal">{`${user.firstName} ${user.lastName}`}</span>
            </p>
            <p className="text-sm font-bold">
              Email: <span className="font-normal">{user.email}</span>
            </p>
            <p className="text-sm font-bold">
              Điện thoại: <span className="font-normal">{user.phone}</span>
            </p>
            <p className="text-sm font-bold">
              Địa chỉ: <span className="font-normal">{user.address}</span>
            </p>
          </div>
        ))}
      </>
    </div>
  );
}

export default Account;
