import { useState, useEffect } from "react";
import authApi from "../../api/authApi";
import axios from "axios";

export const useFetchUserProfile = () => {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    const userId = localStorage.getItem("userId");
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `http://localhost:8080/auth/profile/${userId}`
      );
      setUsers(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return { users, loading, error, fetchUserProfile };
};
