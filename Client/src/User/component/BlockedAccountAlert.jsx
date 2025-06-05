import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { authApi } from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import adminApi from "../../api/adminApi";

const BlockedAccountAlert = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");

    if (!userId) {
      setLoading(false);
      return;
    }

    const checkAdminAccount = async () => {
      try {
        const response = await adminApi.getProfile(userId);
        if (response.data && response.data.isActive === false) {
          localStorage.setItem("isBlocked", "true");
          setVisible(true);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái tài khoản admin:", error);
      } finally {
        setLoading(false);
      }
    };

    const checkUserAccount = async () => {
      try {
        const token =
          localStorage.getItem("accessToken") || localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await authApi.getProfile();
        if (response.data && response.data.isBlocked) {
          localStorage.setItem("isBlocked", "true");
          setVisible(true);
        }
      } catch (error) {
        if (![401, 404].includes(error?.response?.status)) {
          console.error("Lỗi khi kiểm tra trạng thái tài khoản:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    const isBlockedLocal = localStorage.getItem("isBlocked") === "true";
    if (isBlockedLocal) {
      setVisible(true);
      setLoading(false);
      return;
    }

    if (["admin", "manager", "employee"].includes(userRole)) {
      checkAdminAccount();
    } else {
      checkUserAccount();
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setVisible(false);
    navigate("/dang-nhap");
  };

  if (loading || !visible) return null;

  return (
    <Dialog
      visible={visible}
      modal
      header="Tài khoản bị khóa"
      onHide={() => {}}
      closeOnEscape={false}
      closable={false}
      draggable={false}
      resizable={false}
      style={{ width: "450px" }}
      pt={{
        root: { className: "rounded-lg border border-gray-200 shadow-lg z-50" },
        header: {
          className:
            "p-4 border-b border-gray-100 bg-red-50 rounded-t-lg text-xl font-semibold text-red-700",
        },
        content: { className: "p-6" },
      }}
    >
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-5">
          <i
            className="pi pi-lock text-red-600"
            style={{ fontSize: "2rem" }}
          ></i>
        </div>
        <h3 className="text-xl font-medium text-gray-800 mb-4 text-center">
          Tài khoản của bạn đã bị khóa
        </h3>
        <p className="text-gray-600 text-center mb-6">
          Vì một số lý do, tài khoản của bạn đã bị quản trị viên khóa. Vui lòng
          liên hệ bộ phận hỗ trợ để được giải quyết.
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
};

export default BlockedAccountAlert;
