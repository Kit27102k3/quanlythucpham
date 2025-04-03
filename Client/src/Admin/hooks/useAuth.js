import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("adminToken");
      const adminData = JSON.parse(localStorage.getItem("adminInfo") || "{}");

      if (token && adminData) {
        setIsAuthenticated(true);
        setAdminInfo(adminData);
      } else {
        setIsAuthenticated(false);
        setAdminInfo(null);
        navigate("/admin/login");
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    setIsAuthenticated(false);
    setAdminInfo(null);
    navigate("/admin/login");
  };

  const hasRole = (roles) => {
    if (!adminInfo) return false;
    return roles.includes(adminInfo.role);
  };

  return {
    isAuthenticated,
    isLoading,
    adminInfo,
    logout,
    hasRole,
  };
};

export default useAuth; 