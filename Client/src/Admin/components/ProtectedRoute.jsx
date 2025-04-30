import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const accessToken = localStorage.getItem("accessToken");
  const userRole = localStorage.getItem("userRole");

  // Nếu không có token, chuyển hướng về trang đăng nhập
  if (!accessToken) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Nếu có allowedRoles và role của user không nằm trong danh sách được phép
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute; 