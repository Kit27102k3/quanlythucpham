import { useEffect, useState, useCallback } from "react";
import authApi from "../../api/authApi";

const useFetchUserProfile = () => {
  const [users, setUsers] = useState(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      if (response.data !== users) {
        setUsers(response.data);
      }
    } catch (error) {
      console.log("Lỗi khi lấy thông tin người dùng:", error);
    }
  }, [users]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return users;
};

export default useFetchUserProfile;
