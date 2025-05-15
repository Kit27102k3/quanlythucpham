import { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { ProgressBar } from "primereact/progressbar";
import { useNavigate } from "react-router-dom";
import couponApi from "../../../api/couponApi";
import savedVoucherApi from "../../../api/savedVoucherApi";
import { Helmet } from "react-helmet-async";
import { Dialog } from "primereact/dialog";
import { Toaster, toast } from "sonner";
import axios from "axios";
import { API_URLS } from "../../../config/apiConfig";

const VoucherPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSavedVoucher, setUserSavedVoucher] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [savingVoucher, setSavingVoucher] = useState(false);

  const navigate = useNavigate();

  // Kiểm tra xem người dùng đã đăng nhập chưa
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
      fetchUserSavedVoucher(token);
    }
  }, []);

  // Lấy danh sách voucher
  useEffect(() => {
    fetchVouchers();
  }, [userSavedVoucher]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      
      // Try to get all vouchers directly from the all-for-debug endpoint
      const response = await axios.get(`${API_URLS.COUPONS}/all-for-debug`);
      console.log('Fetched all vouchers from debug endpoint:', response.data);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setVouchers(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        setVouchers(response.data.data);
      } else {
        // Fallback to regular coupon API if debug endpoint fails
        const coupons = await couponApi.getPublicCoupons();
        console.log('Fallback to couponApi:', coupons);
        
        if (coupons && Array.isArray(coupons) && coupons.length > 0) {
          setVouchers(coupons);
        } else {
          console.log('No vouchers found');
          setVouchers([]);
          showToast("info", "Không có mã giảm giá nào trong hệ thống");
        }
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      
      try {
        // Try the regular endpoint as fallback
        const coupons = await couponApi.getPublicCoupons();
        if (coupons && Array.isArray(coupons) && coupons.length > 0) {
          setVouchers(coupons);
        } else {
          setVouchers([]);
          showToast("error", "Đã xảy ra lỗi khi tải danh sách voucher");
        }
      } catch (secondError) {
        console.error("Fallback also failed:", secondError);
        setVouchers([]);
        showToast("error", "Không thể tải danh sách voucher");
      }
    } finally {
      setLoading(false);
    }
  };

  // Lấy voucher đã lưu của người dùng
  const fetchUserSavedVoucher = async (token) => {
    try {
      const response = await savedVoucherApi.getUserSavedVouchers(token);
      console.log('User saved vouchers response:', response);
      
      if (response.success && response.data) {
        setUserSavedVoucher(response.data);
      } else {
        console.log('No saved vouchers found or unexpected format');
        setUserSavedVoucher([]);
      }
    } catch (error) {
      console.error("Error fetching user saved vouchers:", error);
      setUserSavedVoucher([]);
    }
  };

  // Hiển thị thông báo
  const showToast = (type, message) => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (value) => {
    if (!value) return "Không giới hạn";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  };

  const getUsageProgress = (used, limit) => {
    if (!limit) return 0;
    return (used / limit) * 100;
  };

  const isExpired = (voucher) => {
    return voucher.expiresAt && new Date(voucher.expiresAt) < new Date();
  };

  // Kiểm tra voucher có còn số lượng không
  const isOutOfStock = (voucher) => {
    if (!voucher.usageLimit) return false;
    return voucher.used >= voucher.usageLimit;
  };

  // Tính số lượng voucher còn lại
  const getRemainingVouchers = (voucher) => {
    if (!voucher.usageLimit) return Infinity;
    return Math.max(0, voucher.usageLimit - (voucher.used || 0));
  };

  // Kiểm tra voucher có khả dụng không
  const isVoucherAvailable = (voucher) => {
    return !isExpired(voucher) && !isOutOfStock(voucher) && voucher.isActive;
  };

  // Kiểm tra xem voucher có phải là voucher đã lưu của người dùng không
  const isVoucherSaved = (voucherId) => {
    if (!userSavedVoucher || !userSavedVoucher.length) return false;
    return userSavedVoucher.some((saved) => 
      // Chỉ tính là đã lưu nếu voucher chưa được sử dụng (isPaid = false)
      saved.couponId._id === voucherId && saved.isPaid === false
    );
  };

  const handleShopNow = () => {
    navigate("/san-pham");
  };

  const handleLoginRedirect = () => {
    setShowLoginDialog(false);
    navigate("/dang-nhap");
  };

  // Xử lý lưu voucher
  const handleSaveVoucher = async (voucherId) => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return;
    }

    try {
      setSavingVoucher(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Bạn chưa đăng nhập");
        return;
      }

      // Tìm voucher trong danh sách
      const voucher = vouchers.find((v) => v._id === voucherId);
      if (!voucher) {
        toast.error("Không tìm thấy voucher");
        return;
      }

      // Debug thông tin
      console.log("Voucher to save:", {
        id: voucher._id,
        code: voucher.code,
        usageLimit: voucher.usageLimit,
        used: voucher.used,
        remaining: voucher.usageLimit
          ? voucher.usageLimit - (voucher.used || 0)
          : "unlimited",
      });

      // Kiểm tra xem voucher đã lưu chưa
      if (isVoucherSaved(voucherId)) {
        toast.error("Bạn đã lưu voucher này rồi");
        return;
      }

      // Kiểm tra xem voucher còn số lượng không
      if (isOutOfStock(voucher)) {
        toast.error("Voucher đã hết số lượng");
        return;
      }

      const response = await savedVoucherApi.saveVoucher(voucherId, token);
      console.log("Save voucher response:", response);

      if (response.success) {
        toast.success(response.message);
        // Cập nhật lại danh sách voucher đã lưu
        await fetchUserSavedVoucher(token);
        // Cập nhật lại danh sách voucher để cập nhật số lượng còn lại
        await fetchVouchers();
      } else {
        console.error("Error from API:", response);
        toast.error(response.message || "Không thể lưu voucher");
      }
    } catch (error) {
      console.error("Error saving voucher:", error);
      toast.error("Đã xảy ra lỗi khi lưu voucher");
    } finally {
      setSavingVoucher(false);
    }
  };

  // Xử lý xóa voucher đã lưu
  const handleRemoveSavedVoucher = async (couponId) => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return;
    }

    try {
      setSavingVoucher(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Bạn chưa đăng nhập");
        return;
      }

      const response = await savedVoucherApi.deleteSavedVoucher(
        couponId,
        token
      );
      if (response.success) {
        toast.success(response.message);
        fetchUserSavedVoucher(token);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error removing saved voucher:", error);
      toast.error("Đã xảy ra lỗi khi xóa voucher đã lưu");
    } finally {
      setSavingVoucher(false);
    }
  };

  const footerContent = (
    <div className="flex justify-end gap-3">
      <Button
        label="Hủy"
        icon="pi pi-times"
        onClick={() => setShowLoginDialog(false)}
        className="p-button-text"
      />
      <Button
        label="Đăng nhập"
        icon="pi pi-sign-in"
        onClick={handleLoginRedirect}
        autoFocus
        className="p-button-success"
      />
    </div>
  );

  return (
    <div className="voucher-page">
      <Helmet>
        <title>Voucher & Mã Giảm Giá | DNC FOOD</title>
        <meta
          name="description"
          content="Danh sách voucher và mã giảm giá từ DNC FOOD"
        />
      </Helmet>

      <Toaster position="top-right" richColors />

      <Dialog
        visible={showLoginDialog}
        onHide={() => setShowLoginDialog(false)}
        header="Yêu cầu đăng nhập"
        footer={footerContent}
        className="login-prompt-dialog"
      >
        <div className="flex flex-column align-items-center gap-3 p-3">
          <i className="pi pi-lock text-5xl text-yellow-500 mb-3"></i>
          <h3>Bạn cần đăng nhập để lưu voucher</h3>
          <p className="text-center">
            Để có thể lưu và sử dụng voucher, vui lòng đăng nhập vào tài khoản
            của bạn.
          </p>
        </div>
      </Dialog>

      <div className="voucher-container">
        <div className="voucher-header">
          <h1>Voucher & Mã Giảm Giá</h1>
          <p>
            Sử dụng các mã giảm giá dưới đây để được hưởng ưu đãi khi mua sắm
            tại DNC FOOD. Hãy sao chép mã và áp dụng khi thanh toán.
          </p>
          {isLoggedIn && userSavedVoucher.length > 0 && (
            <div className="saved-voucher-notice">
              <i className="pi pi-info-circle"></i>
              <span>
                Bạn đã lưu {userSavedVoucher.length} voucher. Hãy lưu thêm nhiều voucher để giúp tiết kiệm chi phí nhé.
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="voucher-loading">
            <i className="pi pi-spin pi-spinner"></i>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="voucher-empty">
            <i className="pi pi-ticket"></i>
            <h3>Chưa có voucher nào</h3>
            <p>Hiện tại chưa có voucher khả dụng. Vui lòng quay lại sau.</p>
            <Button
              label="Mua sắm ngay"
              icon="pi pi-shopping-cart"
              className="p-button-success"
              onClick={handleShopNow}
            />
          </div>
        ) : (
          <div className="voucher-grid">
            {vouchers.map((voucher) => (
              <div
                key={voucher._id}
                className={`voucher-card ${
                  isExpired(voucher) ? "expired" : ""
                } ${isVoucherSaved(voucher._id) ? "saved" : ""}`}
              >
                <div className="voucher-card-inner">
                  {isVoucherSaved(voucher._id) && (
                    <div className="voucher-saved-badge">
                      <i className="pi pi-bookmark-fill"></i>
                      <span>Đã lưu</span>
                    </div>
                  )}

                  <div className="voucher-ribbon">
                    <div className="ribbon-content">
                      <span>
                        {voucher.type === "percentage"
                          ? `${voucher.value}%`
                          : formatCurrency(voucher.value)}
                      </span>
                    </div>
                  </div>

                  <div className="voucher-body">
                    <div className="voucher-tags">
                      <span className="voucher-type-tag">
                        {voucher.type === "percentage" ? "Giảm %" : "Giảm tiền"}
                      </span>
                      {isExpired(voucher) && (
                        <span className="voucher-expired-tag">Đã hết hạn</span>
                      )}
                      {isOutOfStock(voucher) && (
                        <span className="voucher-expired-tag">Đã hết</span>
                      )}
                    </div>

                    <h3 className="voucher-title">
                      {voucher.type === "percentage"
                        ? `Giảm ${voucher.value}% đơn hàng`
                        : `Giảm ${formatCurrency(voucher.value)}`}
                    </h3>

                    <div className="voucher-details">
                      {voucher.maxDiscount && (
                        <p>
                          Giảm tối đa:{" "}
                          <span>{formatCurrency(voucher.maxDiscount)}</span>
                        </p>
                      )}
                      <p>
                        Đơn hàng tối thiểu:{" "}
                        <span>{formatCurrency(voucher.minOrder)}</span>
                      </p>
                    </div>

                    <div className="voucher-code-container">
                      <div className="voucher-code-header">
                        <span>Mã giảm giá:</span>
                      </div>
                      <div className="voucher-code">
                        <span>{voucher.code}</span>
                      </div>
                    </div>

                    {voucher.usageLimit && (
                      <div className="voucher-usage">
                        <div className="voucher-usage-text">
                          <span>
                            Còn lại: {getRemainingVouchers(voucher)}/
                            {voucher.usageLimit}
                          </span>
                          <span>
                            {Math.round(
                              getUsageProgress(
                                voucher.used || 0,
                                voucher.usageLimit
                              )
                            )}
                            %
                          </span>
                        </div>
                        <ProgressBar
                          value={getUsageProgress(
                            voucher.used || 0,
                            voucher.usageLimit
                          )}
                          showValue={false}
                        />
                      </div>
                    )}

                    <Divider />

                    <div className="voucher-footer">
                      <div className="voucher-expiry">
                        <i className="pi pi-calendar"></i>
                        <span>HSD: {formatDate(voucher.expiresAt)}</span>
                      </div>
                      <div className="voucher-actions">
                        {isVoucherSaved(voucher._id) ? (
                          <Button
                            icon="pi pi-trash"
                            text
                            tooltipOptions={{ position: "top" }}
                            onClick={() =>
                              handleRemoveSavedVoucher(voucher._id)
                            }
                            disabled={savingVoucher}
                            className="p-button-danger p-button-text"
                          />
                        ) : (
                          <Button
                            icon="pi pi-bookmark"
                            text
                            tooltipOptions={{ position: "top" }}
                            onClick={() => handleSaveVoucher(voucher._id)}
                            disabled={
                              savingVoucher || !isVoucherAvailable(voucher)
                            }
                            className="p-button-success p-button-text p-1 rounded text-white bg-[#51bb1a]"
                          />
                        )}
                        <Button
                          label="Mua ngay"
                          icon="pi pi-shopping-cart"
                          onClick={handleShopNow}
                          disabled={!isVoucherAvailable(voucher)}
                          className={`${
                            !isVoucherAvailable(voucher)
                              ? "p-button-secondary"
                              : "p-button-success"
                          } p-1 gap-2 rounded text-white bg-[#51bb1a]`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .voucher-page {
          min-height: 100vh;
          background-color: #f5f7fa;
          padding: 40px 20px;
        }

        .voucher-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .voucher-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 0 15px;
        }

        .voucher-header h1 {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 15px;
          font-weight: 700;
        }

        .voucher-header p {
          font-size: 1.1rem;
          color: #5d6778;
          max-width: 700px;
          margin: 0 auto 20px;
          line-height: 1.6;
        }

        .saved-voucher-notice {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: #fff3cd;
          border: 1px solid #ffecb5;
          color: #856404;
          border-radius: 8px;
          padding: 12px 20px;
          margin: 20px auto 0;
          max-width: 800px;
          justify-content: center;
        }

        .saved-voucher-notice i {
          font-size: 1.2rem;
          color: #ffc107;
        }

        .voucher-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
        }

        .voucher-loading i {
          font-size: 3rem;
          color: #5ccd16;
        }

        .voucher-empty {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          padding: 60px 30px;
          text-align: center;
          margin: 30px auto;
          max-width: 600px;
        }

        .voucher-empty i {
          font-size: 4rem;
          color: #cfd8dc;
          margin-bottom: 20px;
          display: block;
        }

        .voucher-empty h3 {
          font-size: 1.5rem;
          color: #37474f;
          margin-bottom: 10px;
          font-weight: 600;
        }

        .voucher-empty p {
          color: #78909c;
          margin-bottom: 25px;
          font-size: 1rem;
        }

        .voucher-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 25px;
          padding: 10px;
        }

        .voucher-card {
          position: relative;
          transition: all 0.3s ease;
          height: 100%;
        }

        .voucher-card.expired {
          opacity: 0.7;
        }

        .voucher-card.saved .voucher-card-inner {
          border: 2px solid #5ccd16;
        }

        .voucher-saved-badge {
          position: absolute;
          top: 0;
          left: 20px;
          background-color: #5ccd16;
          color: white;
          padding: 5px 12px;
          border-radius: 0 0 8px 8px;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 5px;
          z-index: 2;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .voucher-card-inner {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .voucher-card-inner:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }

        .voucher-ribbon {
          position: absolute;
          top: 20px;
          right: -5px;
          z-index: 1;
        }

        .ribbon-content {
          background: #5ccd16;
          color: white;
          font-size: 1.2rem;
          font-weight: bold;
          padding: 8px 15px;
          border-radius: 4px 0 0 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          position: relative;
        }

        .ribbon-content:after {
          content: '';
          position: absolute;
          right: -10px;
          top: 0;
          border-style: solid;
          border-width: 17px 10px 17px 0;
          border-color: transparent #5ccd16 transparent transparent;
        }

        .voucher-body {
          padding: 25px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .voucher-tags {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .voucher-type-tag {
          background-color: #e3f8d2;
          color: #428b16;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 50px;
          display: inline-block;
        }

        .voucher-expired-tag {
          background-color: #ffe5e5;
          color: #e53935;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 50px;
          display: inline-block;
        }

        .voucher-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #262626;
          margin-bottom: 15px;
          line-height: 1.3;
        }

        .voucher-details {
          margin-bottom: 20px;
          color: #5d6778;
          font-size: 0.95rem;
        }

        .voucher-details p {
          margin-bottom: 5px;
          display: flex;
          justify-content: space-between;
        }

        .voucher-details span {
          font-weight: 600;
          color: #333;
        }

        .voucher-code-container {
          background-color: #f5f7fa;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .voucher-code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          color: #64748b;
          font-size: 0.9rem;
          padding-left: 5px;
        }

        .voucher-code {
          background-color: white;
          border: 2px dashed #cfd8dc;
          border-radius: 6px;
          padding: 10px;
          text-align: center;
          position: relative;
        }

        .voucher-code span {
          font-family: monospace;
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: #5ccd16;
        }

        .voucher-usage {
          margin-bottom: 20px;
        }

        .voucher-usage-text {
          display: flex;
          justify-content: space-between;
          color: #64748b;
          font-size: 0.85rem;
          margin-bottom: 5px;
        }

        .p-progressbar {
          height: 6px !important;
          background-color: #e0e0e0 !important;
        }

        .p-progressbar-value {
          background-color: #5ccd16 !important;
        }

        .voucher-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .voucher-expiry {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 0.9rem;
        }

        .voucher-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .p-divider {
          margin: 1.25rem 0 !important;
        }

        .p-button-success {
          background-color: #5ccd16 !important;
          border-color: #5ccd16 !important;
        }

        .p-button-success:hover {
          background-color: #4cae0e !important;
          border-color: #4cae0e !important;
        }

        .p-button-success.p-button-outlined {
          color: #5ccd16 !important;
          background-color: transparent !important;
          border-color: #5ccd16 !important;
        }

        .login-prompt-dialog .p-dialog-content {
          padding: 1.5rem;
        }

        @media (max-width: 768px) {
          .voucher-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          }
          
          .voucher-header h1 {
            font-size: 2rem;
          }
          
          .voucher-title {
            font-size: 1.2rem;
          }
          
          .voucher-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .voucher-page {
            padding: 20px 10px;
          }
          
          .voucher-grid {
            grid-template-columns: 1fr;
          }
          
          .voucher-card-inner {
            max-width: 100%;
          }
          
          .voucher-header h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VoucherPage;
