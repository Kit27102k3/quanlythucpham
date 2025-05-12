import { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import savedVoucherApi from "../../../api/savedVoucherApi";

const SavedVoucher = () => {
  const [savedVouchers, setSavedVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedVouchers();
  }, []);

  const fetchSavedVouchers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setSavedVouchers([]);
        return;
      }

      const response = await savedVoucherApi.getUserSavedVouchers(token);
      if (response.success && response.data && response.data.length > 0) {
        setSavedVouchers(response.data);
      } else {
        setSavedVouchers([]);
      }
    } catch (error) {
      console.error("Error fetching saved vouchers:", error);
      toast.error("Không thể tải thông tin voucher đã lưu");
      setSavedVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVoucher = (voucher) => {
    confirmDialog({
      message: "Bạn có chắc chắn muốn xóa voucher này?",
      header: "Xác nhận xóa",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("accessToken");
          if (!token) {
            toast.error("Bạn chưa đăng nhập");
            return;
          }

          const response = await savedVoucherApi.deleteSavedVoucher(
            voucher.couponId._id,
            token
          );
          if (response.success) {
            toast.success("Đã xóa voucher thành công");
            fetchSavedVouchers(); // Cập nhật lại danh sách voucher
          } else {
            toast.error(response.message);
          }
        } catch (error) {
          console.error("Error removing voucher:", error);
          toast.error("Đã xảy ra lỗi khi xóa voucher");
        } finally {
          setLoading(false);
        }
      },
    });
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

  // Tính số lượng voucher còn lại
  const getRemainingVouchers = (coupon) => {
    if (!coupon.usageLimit) return Infinity;
    return Math.max(0, coupon.usageLimit - (coupon.used || 0));
  };

  const handleShopNow = () => {
    navigate("/san-pham");
  };

  const handleFindMoreVouchers = () => {
    navigate("/voucher");
  };

  const openVoucherDetail = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDetailDialog(true);
  };

  const isExpired = (coupon) => {
    return coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  };

  const isInactive = (coupon) => {
    return !coupon.isActive;
  };

  const isVoucherValid = (coupon, isPaid) => {
    return !isExpired(coupon) && !isInactive(coupon) && !isPaid;
  };

  if (loading) {
    return (
      <div className="px-4 py-8">
        <h2 className="text-xl font-semibold mb-4">Voucher của bạn</h2>
        <div className="flex justify-center items-center h-64">
          <i className="pi pi-spin pi-spinner text-3xl text-[#51aa1b]"></i>
        </div>
      </div>
    );
  }

  const renderStatus = (coupon, isPaid) => {
    if (isPaid) {
      return (
        <div className="voucher-status used">
          <i className="pi pi-check"></i>
          <span>Đã sử dụng</span>
        </div>
      );
    } else if (isExpired(coupon)) {
      return (
        <div className="voucher-status expired">
          <i className="pi pi-clock"></i>
          <span>Đã hết hạn</span>
        </div>
      );
    } else if (isInactive(coupon)) {
      return (
        <div className="voucher-status inactive">
          <i className="pi pi-ban"></i>
          <span>Đã ngừng hoạt động</span>
        </div>
      );
    } else {
      return (
        <div className="voucher-status active">
          <i className="pi pi-check-circle"></i>
          <span>Có thể sử dụng</span>
        </div>
      );
    }
  };

  // Thiết lập style cho Dialog
  const dialogStyle = {
    width: "90%",
    maxWidth: "450px",
    padding: "0",
    borderRadius: "8px",
  };

  const dialogHeaderStyle = {
    padding: "12px 16px",
    fontSize: "1rem",
  };

  const dialogFooterStyle = {
    padding: "8px 16px",
    borderTop: "1px solid #f0f0f0",
  };

  const dialogContentStyle = {
    padding: "12px 16px",
  };

  return (
    <div className="saved-voucher-page px-4 py-8">
      <Toaster position="top-right" richColors />
      <ConfirmDialog />

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Voucher của bạn</h2>
        <Button
          label="Tìm thêm voucher"
          icon="pi pi-search"
          className="p-button-outlined gap-4 text-white bg-[#51bb1a] p-2 rounded"
          onClick={handleFindMoreVouchers}
        />
      </div>

      {savedVouchers.length === 0 ? (
        <div className="empty-voucher">
          <div className="empty-content">
            <i className="pi pi-ticket"></i>
            <h3>Bạn chưa lưu voucher nào</h3>
            <p>Hãy khám phá các voucher có sẵn và lưu để sử dụng sau</p>
            <Button
              label="Tìm voucher ngay"
              icon="pi pi-search"
              className="p-button p-button-success"
              onClick={handleFindMoreVouchers}
            />
          </div>
        </div>
      ) : (
        <div className="vouchers-list">
          {savedVouchers.map((savedVoucher) => (
            <div
              key={savedVoucher._id}
              className={`saved-voucher-card ${
                isExpired(savedVoucher.couponId) ||
                isInactive(savedVoucher.couponId)
                  ? "inactive-voucher"
                  : ""
              }`}
            >
              <div className="saved-voucher-header">
                <div className="saved-voucher-value">
                  {savedVoucher.couponId.type === "percentage"
                    ? `${savedVoucher.couponId.value}%`
                    : formatCurrency(savedVoucher.couponId.value)}
                </div>
                {renderStatus(savedVoucher.couponId, savedVoucher.isPaid)}
              </div>

              <div className="saved-voucher-content">
                <h3 className="voucher-title">
                  {savedVoucher.couponId.type === "percentage"
                    ? `Giảm ${savedVoucher.couponId.value}% đơn hàng`
                    : `Giảm ${formatCurrency(savedVoucher.couponId.value)}`}
                </h3>

                <div className="voucher-code-section">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Mã giảm giá:</span>
                  </div>
                  <div className="code-display">
                    <span>{savedVoucher.couponId.code}</span>
                  </div>
                </div>

                <div className="voucher-info-section">
                  <div className="info-item">
                    <span className="info-label">Đơn hàng tối thiểu:</span>
                    <span className="info-value">
                      {formatCurrency(savedVoucher.couponId.minOrder)}
                    </span>
                  </div>
                  {savedVoucher.couponId.maxDiscount && (
                    <div className="info-item">
                      <span className="info-label">Giảm tối đa:</span>
                      <span className="info-value">
                        {formatCurrency(savedVoucher.couponId.maxDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Hạn sử dụng:</span>
                    <span className="info-value">
                      {formatDate(savedVoucher.couponId.expiresAt)}
                    </span>
                  </div>
                </div>

                {savedVoucher.couponId.usageLimit && (
                  <div className="voucher-usage-limit-section">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>
                        Còn lại: {getRemainingVouchers(savedVoucher.couponId)}/
                        {savedVoucher.couponId.usageLimit}
                      </span>
                      <span>
                        {Math.round(
                          getUsageProgress(
                            savedVoucher.couponId.used || 0,
                            savedVoucher.couponId.usageLimit
                          )
                        )}
                        %
                      </span>
                    </div>
                    <ProgressBar
                      value={getUsageProgress(
                        savedVoucher.couponId.used || 0,
                        savedVoucher.couponId.usageLimit
                      )}
                      showValue={false}
                      style={{ height: "6px" }}
                    />
                  </div>
                )}

                <div className="saved-date">
                  <span>Đã lưu vào: {formatDate(savedVoucher.savedAt)}</span>
                </div>
              </div>

              <div className="saved-voucher-actions">
                <Button
                  label="Xem chi tiết"
                  icon="pi pi-info-circle"
                  onClick={() => openVoucherDetail(savedVoucher)}
                  className="p-button-text gap-2"
                />
                <Button
                  label="Bỏ lưu"
                  icon="pi pi-trash"
                  onClick={() => handleRemoveVoucher(savedVoucher)}
                  className="p-button-danger p-button-text gap-2"
                />
              </div>

              <div className="flex justify-center mt-4">
                <Button
                  label="Mua sắm ngay"
                  icon="pi pi-shopping-cart"
                  onClick={handleShopNow}
                  disabled={
                    !isVoucherValid(savedVoucher.couponId, savedVoucher.isPaid)
                  }
                  className={`${
                    !isVoucherValid(savedVoucher.couponId, savedVoucher.isPaid)
                      ? "p-button-secondary"
                      : "p-button-success"
                  } gap-2 text-white bg-[#51bb1a] rounded`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        visible={showDetailDialog}
        onHide={() => setShowDetailDialog(false)}
        header="Chi tiết voucher"
        style={dialogStyle}
        contentStyle={dialogContentStyle}
        headerStyle={dialogHeaderStyle}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
      >
        {selectedVoucher && (
          <div className="voucher-detail-dialog">
            <div className="voucher-detail-header">
              <h3 className="text-xl font-bold mb-2">
                {selectedVoucher.couponId.type === "percentage"
                  ? `Giảm ${selectedVoucher.couponId.value}% đơn hàng`
                  : `Giảm ${formatCurrency(selectedVoucher.couponId.value)}`}
              </h3>
              {renderStatus(selectedVoucher.couponId, selectedVoucher.isPaid)}
            </div>

            <div className="voucher-detail-info mt-4">
              <div className="info-row">
                <div className="info-label">Mã giảm giá:</div>
                <div className="info-value code">
                  {selectedVoucher.couponId.code}
                </div>
              </div>
              <div className="info-row">
                <div className="info-label">Loại giảm giá:</div>
                <div className="info-value">
                  {selectedVoucher.couponId.type === "percentage"
                    ? "Phần trăm (%)"
                    : "Số tiền cố định"}
                </div>
              </div>
              <div className="info-row">
                <div className="info-label">Giá trị:</div>
                <div className="info-value">
                  {selectedVoucher.couponId.type === "percentage"
                    ? `${selectedVoucher.couponId.value}%`
                    : formatCurrency(selectedVoucher.couponId.value)}
                </div>
              </div>
              <div className="info-row">
                <div className="info-label">Đơn hàng tối thiểu:</div>
                <div className="info-value">
                  {formatCurrency(selectedVoucher.couponId.minOrder)}
                </div>
              </div>
              {selectedVoucher.couponId.maxDiscount && (
                <div className="info-row">
                  <div className="info-label">Giảm tối đa:</div>
                  <div className="info-value">
                    {formatCurrency(selectedVoucher.couponId.maxDiscount)}
                  </div>
                </div>
              )}
              <div className="info-row">
                <div className="info-label">Hạn sử dụng:</div>
                <div className="info-value">
                  {formatDate(selectedVoucher.couponId.expiresAt)}
                </div>
              </div>
              {selectedVoucher.couponId.usageLimit && (
                <div className="info-row">
                  <div className="info-label">Còn lại:</div>
                  <div className="info-value">
                    {getRemainingVouchers(selectedVoucher.couponId)}/
                    {selectedVoucher.couponId.usageLimit} voucher
                  </div>
                </div>
              )}
              <div className="info-row">
                <div className="info-label">Ngày lưu:</div>
                <div className="info-value">
                  {formatDate(selectedVoucher.savedAt)}
                </div>
              </div>
            </div>

            <div className="voucher-detail-actions mt-4">
              <Button
                label="Mua sắm ngay"
                icon="pi pi-shopping-cart"
                onClick={handleShopNow}
                disabled={
                  !isVoucherValid(
                    selectedVoucher.couponId,
                    selectedVoucher.isPaid
                  )
                }
                className={`${
                  !isVoucherValid(
                    selectedVoucher.couponId,
                    selectedVoucher.isPaid
                  )
                    ? "p-button-secondary w-full"
                    : "p-button-success w-full"
                } flex justify-center text-center text-white bg-[#51bb1a] rounded`}
              />
            </div>
          </div>
        )}
      </Dialog>

      <style>{`
        .saved-voucher-page {
          min-height: 60vh;
          padding: 15px;
        }
        
        .mb-6 {
          margin-bottom: 1rem;
        }
        
        .text-xl {
          font-size: 1.1rem;
        }
        
        .empty-voucher {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-top: 15px;
        }
        
        .empty-content {
          text-align: center;
        }
        
        .empty-content i {
          font-size: 2rem;
          color: #cfd8dc;
          margin-bottom: 12px;
          display: block;
        }
        
        .empty-content h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #37474f;
          margin-bottom: 6px;
        }
        
        .empty-content p {
          color: #78909c;
          margin-bottom: 15px;
          font-size: 0.85rem;
        }
        
        .vouchers-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        .saved-voucher-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .saved-voucher-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        }
        
        .saved-voucher-card.inactive-voucher {
          opacity: 0.7;
        }
        
        .saved-voucher-header {
          background-color: #5ccd16;
          color: white;
          padding: 10px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .inactive-voucher .saved-voucher-header {
          background-color: #9e9e9e;
        }
        
        .saved-voucher-value {
          font-size: 1.3rem;
          font-weight: 700;
        }
        
        .voucher-status {
          display: flex;
          align-items: center;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 20px;
          gap: 3px;
        }
        
        .voucher-status.active {
          background-color: rgba(255, 255, 255, 0.25);
        }
        
        .voucher-status.expired, .voucher-status.inactive {
          background-color: rgba(255, 255, 255, 0.25);
        }
        
        .saved-voucher-content {
          padding: 12px;
        }
        
        .voucher-title {
          font-size: 1rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 10px;
        }
        
        .voucher-code-section {
          background-color: #f5f7fa;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 10px;
        }
        
        .code-display {
          background-color: white;
          border: 1px dashed #ddd;
          padding: 7px;
          border-radius: 4px;
          text-align: center;
        }
        
        .code-display span {
          font-family: monospace;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: #5ccd16;
        }
        
        .inactive-voucher .code-display span {
          color: #9e9e9e;
        }
        
        .voucher-info-section {
          margin-bottom: 10px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px dashed #eee;
          font-size: 0.85rem;
        }
        
        .info-label {
          color: #64748b;
        }
        
        .info-value {
          font-weight: 600;
          color: #333;
        }
        
        .voucher-usage-limit-section {
          margin-bottom: 10px;
        }
        
        .saved-date {
          margin-top: 6px;
          font-size: 0.75rem;
          color: #64748b;
          text-align: right;
        }
        
        .saved-voucher-actions {
          border-top: 1px solid #eee;
          padding: 10px 12px;
          display: flex;
          justify-content: space-between;
        }
        
        .saved-voucher-actions .p-button {
          font-size: 0.85rem;
        }
        
        .saved-voucher-actions .p-button-text {
          padding: 0.4rem 0.6rem;
        }
        
        .saved-voucher-actions .p-button .p-button-icon {
          font-size: 0.85rem;
        }
        
        .flex.justify-center.mt-4 {
          margin-top: 0;
          padding: 0 12px 12px 12px;
        }
        
        .flex.justify-center.mt-4 .p-button {
          font-size: 0.9rem;
          padding: 0.5rem;
        }
        
        /* Dialog styles */
        .voucher-detail-dialog {
          padding: 0;
        }
        
        .voucher-detail-dialog .voucher-detail-header {
          text-align: center;
          margin-bottom: 10px;
        }
        
        .voucher-detail-dialog .voucher-detail-header h3 {
          font-size: 1rem;
          margin-bottom: 5px;
        }
        
        .voucher-detail-dialog .voucher-detail-header .voucher-status {
          margin: 0 auto;
          width: fit-content;
          color: white;
          padding: 2px 8px;
          font-size: 0.7rem;
        }
        
        .voucher-detail-dialog .voucher-status.active {
          background-color: #5ccd16;
        }
        
        .voucher-detail-dialog .voucher-status.expired, 
        .voucher-detail-dialog .voucher-status.inactive {
          background-color: #f44336;
        }
        
        .voucher-detail-info {
          margin-top: 0.75rem !important;
        }
        
        .voucher-detail-info .info-row {
          display: flex;
          padding: 5px 0;
          border-bottom: 1px solid #eee;
          font-size: 0.85rem;
        }
        
        .voucher-detail-info .info-label {
          flex: 1;
          color: #64748b;
        }
        
        .voucher-detail-info .info-value {
          flex: 1;
          font-weight: 600;
          text-align: right;
        }
        
        .voucher-detail-info .info-value.code {
          color: #5ccd16;
          font-family: monospace;
          letter-spacing: 1px;
          font-size: 0.9rem;
        }
        
        .voucher-detail-actions.mt-4 {
          margin-top: 0.75rem;
        }
        
        .voucher-detail-actions .p-button {
          font-size: 0.9rem;
          padding: 0.5rem;
        }
        
        /* PrimeReact customizations */
        .p-button-success {
          background-color: #5ccd16 !important;
          border-color: #5ccd16 !important;
        }
        
        .p-button-success:hover {
          background-color: #4cae0e !important;
          border-color: #4cae0e !important;
        }
        
        .p-button-success:focus {
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(92, 205, 22, 0.5) !important;
        }
        
        .p-progressbar {
          height: 5px !important;
          border-radius: 3px !important;
          background: #e9ecef !important;
        }
        
        .p-progressbar-value {
          background-color: #5ccd16 !important;
        }
        
        /* Responsive styles */
        @media (min-width: 768px) {
          .vouchers-list {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 640px) {
          .saved-voucher-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .voucher-status {
            align-self: flex-start;
            margin-top: 5px;
          }
          
          .voucher-title {
            font-size: 0.95rem;
          }
          
          .saved-voucher-actions {
            flex-direction: column;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default SavedVoucher;
