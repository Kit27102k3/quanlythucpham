import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import authApi from "../../api/authApi";
import { useNavigate } from "react-router-dom";

const BlockedAccountAlert = () => {
  try {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
      // Kiểm tra xem người dùng đã đăng nhập chưa
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setLoading(false);
        return;
      }

      // Kiểm tra nhanh từ localStorage trước
      const isBlockedLocal = localStorage.getItem("isBlocked") === "true";
      if (isBlockedLocal) {
        setVisible(true);
        setLoading(false);
        return;
      }

      // Kiểm tra trạng thái tài khoản từ API
      const checkAccountStatus = async () => {
        try {
          const response = await authApi.getProfile();
          
          if (response.data && response.data.isBlocked) {
            // Cập nhật localStorage nếu có thay đổi
            localStorage.setItem("isBlocked", "true");
            setVisible(true);
          }
          setLoading(false);
        } catch (error) {
          console.error("Lỗi khi kiểm tra trạng thái tài khoản:", error);
          setLoading(false);
        }
      };

      checkAccountStatus();
    }, []);

    const handleLogout = () => {
      // Xóa dữ liệu đăng nhập
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      
      // Đóng dialog
      setVisible(false);
      
      // Chuyển hướng về trang đăng nhập
      navigate("/dang-nhap");
    };

    if (loading || !visible) {
      return null;
    }

    return (
      <Dialog
        visible={visible}
        modal
        header="Tài khoản bị khóa"
        onHide={() => {}} // Không cho phép đóng bằng nút X
        closeOnEscape={false}
        closable={false}
        draggable={false}
        resizable={false}
        style={{ width: "450px" }}
        pt={{
          root: { className: "rounded-lg border border-gray-200 shadow-lg z-50" },
          header: { className: "p-4 border-b border-gray-100 bg-red-50 rounded-t-lg text-xl font-semibold text-red-700" },
          content: { className: "p-6" },
        }}
      >
        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-5">
            <i className="pi pi-lock text-red-600" style={{ fontSize: "2rem" }}></i>
          </div>
          
          <h3 className="text-xl font-medium text-gray-800 mb-4 text-center">Tài khoản của bạn đã bị khóa</h3>
          
          <p className="text-gray-600 text-center mb-6">
            Vì một số lý do, tài khoản của bạn đã bị quản trị viên khóa. Vui lòng liên hệ bộ phận hỗ trợ để được giải quyết.
          </p>
          
          <Button
            label="Đăng xuất"
            icon="pi pi-sign-out"
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 border-red-600 px-4 py-2.5 text-white font-medium rounded-lg transition-colors"
          />
        </div>
      </Dialog>
    );
  } catch (error) {
    console.error("Error in BlockedAccountAlert component:", error);
    return null;
  }
};

export default BlockedAccountAlert; 