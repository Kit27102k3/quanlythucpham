import { useState, useEffect } from "react";
import authApi from "../../api/authApi";

const useFetchUserProfile = () => {
  const [users, setUsers] = useState([]);

  const fetchUserProfile = async () => {
    try {
      const response = await authApi.getProfile();
      setUsers(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return { users, fetchUserProfile };
};

export default useFetchUserProfile;
