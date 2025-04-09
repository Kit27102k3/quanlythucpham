import { useEffect, useState } from "react";
import authApi from "../../api/authApi";

const useFetchUserProfile = () => {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUserProfile = async () => {
      if (!isMounted) return;
      
      try {
        const response = await authApi.getProfile();
        if (isMounted) {
          setUsers(response.data);
          setLoading(false);
        }
      } catch (error) {
        console.log("Lỗi khi lấy thông tin người dùng:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array so it only runs once on mount

  return users;
};

export default useFetchUserProfile;
