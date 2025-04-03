import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
  const token = localStorage.getItem("adminToken");

  // Nếu không có token, chuyển hướng về trang đăng nhập
  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Nếu có allowedRoles và role của admin không nằm trong danh sách được phép
  if (allowedRoles.length > 0 && !allowedRoles.includes(adminInfo.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute; 