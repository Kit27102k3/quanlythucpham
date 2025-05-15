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
        <div className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
          <i className="pi pi-check mr-1"></i>
          <span>Đã sử dụng</span>
        </div>
      );
    } else if (isExpired(coupon)) {
      return (
        <div className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
          <i className="pi pi-clock mr-1"></i>
          <span>Đã hết hạn</span>
        </div>
      );
    } else if (isInactive(coupon)) {
      return (
        <div className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
          <i className="pi pi-ban mr-1"></i>
          <span>Đã ngừng hoạt động</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-white/25 text-white">
          <i className="pi pi-check-circle mr-1"></i>
          <span>Có thể sử dụng</span>
        </div>
      );
    }
  };

  return (
    <div className="px-4 py-8 min-h-[60vh]">
      <Toaster position="top-right" richColors />
      <ConfirmDialog />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Voucher của bạn</h2>
        <Button
          label="Tìm thêm voucher"
          icon="pi pi-search"
          className="p-button-outlined gap-4 text-white bg-[#51bb1a] p-2 rounded"
          onClick={handleFindMoreVouchers}
        />
      </div>

      {savedVouchers.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] bg-gray-50 rounded-lg p-5 mt-4">
          <i className="pi pi-ticket text-4xl text-gray-300 mb-3"></i>
          <h3 className="text-base font-semibold text-gray-800 mb-1">Bạn chưa lưu voucher nào</h3>
          <p className="text-sm text-gray-500 mb-4">Hãy khám phá các voucher có sẵn và lưu để sử dụng sau</p>
            <Button
              label="Tìm voucher ngay"
              icon="pi pi-search"
              className="p-button p-button-success"
              onClick={handleFindMoreVouchers}
            />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {savedVouchers.map((savedVoucher) => (
            <div
              key={savedVoucher._id}
              className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-md ${
                isExpired(savedVoucher.couponId) || isInactive(savedVoucher.couponId)
                  ? "opacity-70"
                  : ""
              }`}
            >
              <div className={`flex justify-between items-center p-3 text-white ${
                isExpired(savedVoucher.couponId) || isInactive(savedVoucher.couponId)
                  ? "bg-gray-500"
                  : "bg-[#5ccd16]"
              }`}>
                <div className="text-xl font-bold">
                  {savedVoucher.couponId.type === "percentage"
                    ? `${savedVoucher.couponId.value}%`
                    : formatCurrency(savedVoucher.couponId.value)}
                </div>
                {renderStatus(savedVoucher.couponId, savedVoucher.isPaid)}
              </div>

              <div className="p-3">
                <h3 className="text-base font-semibold text-gray-800 mb-2">
                  {savedVoucher.couponId.type === "percentage"
                    ? `Giảm ${savedVoucher.couponId.value}% đơn hàng`
                    : `Giảm ${formatCurrency(savedVoucher.couponId.value)}`}
                </h3>

                <div className="bg-gray-50 p-2 rounded-md mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Mã giảm giá:</span>
                  </div>
                  <div className="bg-white border border-dashed border-gray-300 p-2 rounded text-center">
                    <span className={`font-mono text-base font-bold tracking-wider ${
                      isExpired(savedVoucher.couponId) || isInactive(savedVoucher.couponId)
                        ? "text-gray-500"
                        : "text-[#5ccd16]"
                    }`}>
                      {savedVoucher.couponId.code}
                    </span>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between py-1 text-sm border-b border-dashed border-gray-200">
                    <span className="text-gray-500">Đơn hàng tối thiểu:</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(savedVoucher.couponId.minOrder)}
                    </span>
                  </div>
                  {savedVoucher.couponId.maxDiscount && (
                    <div className="flex justify-between py-1 text-sm border-b border-dashed border-gray-200">
                      <span className="text-gray-500">Giảm tối đa:</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(savedVoucher.couponId.maxDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 text-sm border-b border-dashed border-gray-200">
                    <span className="text-gray-500">Hạn sử dụng:</span>
                    <span className="font-semibold text-gray-800">
                      {formatDate(savedVoucher.couponId.expiresAt)}
                    </span>
                  </div>
                </div>

                {savedVoucher.couponId.usageLimit && (
                  <div className="mb-2">
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
                      className="h-1.5 rounded"
                    />
                  </div>
                )}

                <div className="text-right text-xs text-gray-500 mt-1">
                  <span>Đã lưu vào: {formatDate(savedVoucher.savedAt)}</span>
                </div>
              </div>

              <div className="flex justify-between px-3 py-2 border-t border-gray-200">
                <Button
                  label="Xem chi tiết"
                  icon="pi pi-info-circle"
                  onClick={() => openVoucherDetail(savedVoucher)}
                  className="p-button-text text-sm gap-1 p-2"
                />
                <Button
                  label="Bỏ lưu"
                  icon="pi pi-trash"
                  onClick={() => handleRemoveVoucher(savedVoucher)}
                  className="p-button-danger p-button-text text-sm gap-1 p-2"
                />
              </div>

              <div className="flex justify-center px-3 pb-3">
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
                  } gap-2 text-white bg-[#51bb1a] rounded w-full p-2 text-sm`}
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
        style={{ width: '90%', maxWidth: '450px', borderRadius: '8px', padding: '0' }}
        contentStyle={{ padding: '12px 16px' }}
        headerStyle={{ padding: '12px 16px', fontSize: '1rem' }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
      >
        {selectedVoucher && (
          <div>
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold mb-2">
                {selectedVoucher.couponId.type === "percentage"
                  ? `Giảm ${selectedVoucher.couponId.value}% đơn hàng`
                  : `Giảm ${formatCurrency(selectedVoucher.couponId.value)}`}
              </h3>
              <div className="inline-block">
                {isVoucherValid(selectedVoucher.couponId, selectedVoucher.isPaid) ? (
                  <div className="px-3 py-1 text-xs font-medium bg-[#5ccd16] text-white rounded-full">
                    <i className="pi pi-check-circle mr-1"></i>
                    <span>Có thể sử dụng</span>
                  </div>
                ) : (
                  <div className="px-3 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
                    <i className={`pi ${isExpired(selectedVoucher.couponId) ? 'pi-clock' : 'pi-ban'} mr-1`}></i>
                    <span>{isExpired(selectedVoucher.couponId) ? 'Đã hết hạn' : 'Đã ngừng hoạt động'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex py-1.5 border-b border-gray-200">
                <div className="w-1/2 text-gray-500">Mã giảm giá:</div>
                <div className="w-1/2 text-right font-mono font-semibold tracking-wider text-[#5ccd16]">
                  {selectedVoucher.couponId.code}
                </div>
              </div>
              <div className="flex py-1.5 border-b border-gray-200">
                <div className="w-1/2 text-gray-500">Loại giảm giá:</div>
                <div className="w-1/2 text-right font-semibold">
                  {selectedVoucher.couponId.type === "percentage"
                    ? "Phần trăm (%)"
                    : "Số tiền cố định"}
                </div>
              </div>
              <div className="flex py-1.5 border-b border-gray-200">
                <div className="w-1/2 text-gray-500">Giá trị:</div>
                <div className="w-1/2 text-right font-semibold">
                  {selectedVoucher.couponId.type === "percentage"
                    ? `${selectedVoucher.couponId.value}%`
                    : formatCurrency(selectedVoucher.couponId.value)}
                </div>
              </div>
              <div className="flex py-1.5 border-b border-gray-200">
                <div className="w-1/2 text-gray-500">Đơn hàng tối thiểu:</div>
                <div className="w-1/2 text-right font-semibold">
                  {formatCurrency(selectedVoucher.couponId.minOrder)}
                </div>
              </div>
              {selectedVoucher.couponId.maxDiscount && (
                <div className="flex py-1.5 border-b border-gray-200">
                  <div className="w-1/2 text-gray-500">Giảm tối đa:</div>
                  <div className="w-1/2 text-right font-semibold">
                    {formatCurrency(selectedVoucher.couponId.maxDiscount)}
                  </div>
                </div>
              )}
              <div className="flex py-1.5 border-b border-gray-200">
                <div className="w-1/2 text-gray-500">Hạn sử dụng:</div>
                <div className="w-1/2 text-right font-semibold">
                  {formatDate(selectedVoucher.couponId.expiresAt)}
                </div>
              </div>
              {selectedVoucher.couponId.usageLimit && (
                <div className="flex py-1.5 border-b border-gray-200">
                  <div className="w-1/2 text-gray-500">Còn lại:</div>
                  <div className="w-1/2 text-right font-semibold">
                    {getRemainingVouchers(selectedVoucher.couponId)}/
                    {selectedVoucher.couponId.usageLimit} voucher
                  </div>
                </div>
              )}
              <div className="flex py-1.5 border-b border-gray-200">
                <div className="w-1/2 text-gray-500">Ngày lưu:</div>
                <div className="w-1/2 text-right font-semibold">
                  {formatDate(selectedVoucher.savedAt)}
                </div>
              </div>
            </div>

            <div className="mt-4">
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
                } flex justify-center text-center text-white bg-[#51bb1a] rounded p-2`}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default SavedVoucher;
