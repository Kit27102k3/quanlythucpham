/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { FilterMatchMode } from "primereact/api";
import { ToggleButton } from "primereact/togglebutton";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { toast, Toaster } from "sonner";
import PageHeader from "../components/PageHeader";
import couponApi from "../../api/couponApi";
import Pagination from "../../utils/Paginator";
import * as XLSX from "xlsx";
import axios from "axios";
import { Checkbox } from "primereact/checkbox";
import { format } from "date-fns";

// Kiểm tra xem có đang chạy trong môi trường Electron hay không
const isElectron = () => {
  return window && window.process && window.process.type;
};

const CouponList = () => {
  // Refs
  const dt = useRef(null);
  const exportIntervalRef = useRef(null);

  // State
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    used: 0,
  });
  // Pagination state
  const [first, setFirst] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Auto export state
  const [showAutoExportDialog, setShowAutoExportDialog] = useState(false);
  const [autoExportEnabled, setAutoExportEnabled] = useState(false);
  const [exportInterval, setExportInterval] = useState(7); // minutes
  const [nextExportTime, setNextExportTime] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    value: 0,
    minOrder: 0,
    maxDiscount: null,
    expiresAt: null,
    usageLimit: null,
    isActive: true,
  });

  // Filters
  const [filters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  // Constants
  const discountTypes = [
    { label: "Phần trăm (%)", value: "percentage" },
    { label: "Số tiền cố định", value: "fixed" },
  ];

  // Effects
  useEffect(() => {
    fetchCoupons();
  }, []);

  // Xử lý xuất file tự động
  useEffect(() => {
    // Hủy interval cũ nếu có
    if (exportIntervalRef.current) {
      clearInterval(exportIntervalRef.current);
      exportIntervalRef.current = null;
    }

    // Thiết lập interval mới nếu tính năng được bật
    if (autoExportEnabled && exportInterval > 0) {
      // Tính thời gian xuất file tiếp theo
      const nextTime = new Date();
      nextTime.setMinutes(nextTime.getMinutes() + exportInterval);
      setNextExportTime(nextTime);

      // Thiết lập interval
      exportIntervalRef.current = setInterval(() => {
        exportExcel();

        // Cập nhật thời gian xuất file tiếp theo
        const nextTime = new Date();
        nextTime.setMinutes(nextTime.getMinutes() + exportInterval);
        setNextExportTime(nextTime);
      }, exportInterval * 60 * 1000); // Chuyển đổi phút thành mili giây
    }

    // Cleanup khi component unmount
    return () => {
      if (exportIntervalRef.current) {
        clearInterval(exportIntervalRef.current);
      }
    };
  }, [autoExportEnabled, exportInterval]);

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (exportIntervalRef.current) {
        clearInterval(exportIntervalRef.current);
      }
    };
  }, []);

  // Data fetching
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const token =
        sessionStorage.getItem("adminToken") ||
        localStorage.getItem("accessToken");
      
      if (!token) {
        toast.error("Lỗi", {
          description: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn",
        });
        setLoading(false);
        return;
      }
      
      const response = await couponApi.getAllCoupons(token);
      
      if (response.success) {
        setCoupons(response.data);
        calculateStats(response.data);
      } else {
        toast.error("Lỗi", {
          description: "Không thể tải danh sách mã giảm giá",
        });
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Lỗi", {
        description: error.message || "Đã xảy ra lỗi khi tải dữ liệu",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (coupons) => {
    const now = new Date();
    const stats = {
      total: coupons.length,
      active: coupons.filter((c) => c.isActive).length,
      expired: coupons.filter((c) => c.expiresAt && new Date(c.expiresAt) < now)
        .length,
      used: coupons.reduce((sum, c) => sum + (c.used || 0), 0),
    };
    setStats(stats);
  };

  // Form handling
  const resetForm = () => {
    setFormData({
      code: "",
      type: "percentage",
      value: 0,
      minOrder: 0,
      maxDiscount: null,
      expiresAt: null,
      usageLimit: null,
      isActive: true,
    });
    setIsEditMode(false);
    setSelectedCoupon(null);
  };

  const openNewDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (coupon) => {
    setIsEditMode(true);
    setSelectedCoupon(coupon);
    setFormData({
      ...coupon,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null,
    });
    setShowDialog(true);
  };

  // CRUD operations
  const saveCoupon = async () => {
    try {
      if (!validateForm()) return;
      
      setLoading(true);
      const token =
        sessionStorage.getItem("adminToken") ||
        localStorage.getItem("accessToken");
      
      if (!token) {
        toast.error("Lỗi", {
          description: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn",
        });
        setLoading(false);
        return;
      }
      
      let response;
      
      if (isEditMode && selectedCoupon) {
        response = await couponApi.updateCoupon(
          selectedCoupon._id,
          formData,
          token
        );
      } else {
        response = await couponApi.createCoupon(formData, token);
      }
      
      if (response.success) {
        toast.success(
          isEditMode
            ? "Đã cập nhật mã giảm giá thành công"
            : "Đã tạo mã giảm giá thành công"
        );
        setShowDialog(false);
        resetForm();
        fetchCoupons();
      } else {
        toast.error(response.message || "Không thể lưu mã giảm giá");
      }
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast.error("Lỗi", {
        description: error.message || "Đã xảy ra lỗi khi lưu dữ liệu",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.code.trim()) {
      toast.error("Lỗi", {
        description: "Vui lòng nhập mã giảm giá",
      });
      return false;
    }
    
    if (formData.value <= 0) {
      toast.error("Lỗi", {
        description: "Giá trị giảm giá phải lớn hơn 0",
      });
      return false;
    }
    
    if (formData.type === "percentage" && formData.value > 100) {
      toast.error("Lỗi", {
        description: "Phần trăm giảm giá không được vượt quá 100%",
      });
      return false;
    }
    
    return true;
  };

  const toggleCouponStatus = async (coupon) => {
    try {
      setLoading(true);
      const token =
        sessionStorage.getItem("adminToken") ||
        localStorage.getItem("accessToken");
      
      if (!token) {
        toast.error("Lỗi", {
          description: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn",
        });
        setLoading(false);
        return;
      }
      
      const updatedCoupon = { ...coupon, isActive: !coupon.isActive };
      
      const response = await couponApi.updateCoupon(
        coupon._id,
        updatedCoupon,
        token
      );
      
      if (response.success) {
        toast.success(
          `Đã ${
            updatedCoupon.isActive ? "kích hoạt" : "vô hiệu hóa"
          } mã giảm giá thành công`
        );
        fetchCoupons();
      } else {
        toast.error(response.message || "Không thể cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Error updating coupon status:", error);
      toast.error("Lỗi", {
        description: error.message || "Đã xảy ra lỗi khi cập nhật",
      });
    } finally {
      setLoading(false);
    }
  };

  // UI Helpers
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
  };

  const exportExcel = () => {
    // Tạo dữ liệu cho file Excel
    const excelData = coupons.map((coupon) => ({
      "Mã giảm giá": coupon.code,
      "Loại giảm giá": coupon.type === "percentage" ? "Phần trăm" : "Cố định",
      "Giá trị":
        coupon.type === "percentage"
          ? `${coupon.value}%`
          : formatCurrency(coupon.value),
      "Đơn hàng tối thiểu": formatCurrency(coupon.minOrder),
      "Giảm tối đa": coupon.maxDiscount
        ? formatCurrency(coupon.maxDiscount)
        : "Không giới hạn",
      "Ngày hết hạn": coupon.expiresAt
        ? formatDate(coupon.expiresAt)
        : "Không hết hạn",
      "Lượt sử dụng": `${coupon.used || 0}${
        coupon.usageLimit ? "/" + coupon.usageLimit : "/∞"
      }`,
      "Trạng thái": isExpired(coupon)
        ? "Hết hạn"
        : coupon.isActive
        ? "Hoạt động"
        : "Vô hiệu",
      "Ngày tạo": formatDate(coupon.createdAt),
    }));

    // Tạo workbook và worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Điều chỉnh độ rộng cột
    const columnWidths = [
      { wch: 15 }, // Mã giảm giá
      { wch: 12 }, // Loại giảm giá
      { wch: 15 }, // Giá trị
      { wch: 20 }, // Đơn hàng tối thiểu
      { wch: 15 }, // Giảm tối đa
      { wch: 15 }, // Ngày hết hạn
      { wch: 15 }, // Lượt sử dụng
      { wch: 12 }, // Trạng thái
      { wch: 15 }, // Ngày tạo
    ];
    worksheet["!cols"] = columnWidths;

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách mã giảm giá");

    // Tạo tên file với thời gian hiện tại
    const date = new Date();
    const fileName = `danh_sach_ma_giam_gia_${date.getDate()}_${
      date.getMonth() + 1
    }_${date.getFullYear()}.xlsx`;

    try {
      // Tạo đường dẫn đầy đủ đến thư mục đích
      const targetPath = "D:\\LUANVANTOTNGHIEP\\Voucher\\" + fileName;

      // Phương thức 1: Sử dụng Electron (nếu ứng dụng chạy trên Electron)
      if (isElectron() && window.electron) {
        window.electron.saveFile(
          targetPath,
          XLSX.write(workbook, { bookType: "xlsx", type: "array" })
        );
        toast.success("Xuất file thành công", {
          description: `Đã xuất ${excelData.length} mã giảm giá vào ${targetPath}`,
        });
        return;
      }

      // Phương thức 2: Gửi dữ liệu đến server để lưu file
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const token =
        sessionStorage.getItem("adminToken") ||
        localStorage.getItem("accessToken");

      if (token) {
        // Chuyển đổi ArrayBuffer thành Base64
        const base64 = arrayBufferToBase64(excelBuffer);

        // Gửi yêu cầu đến server
        axios
          .post(
            "/api/export/excel",
            {
              fileName,
              targetPath: "D:/LUANVANTOTNGHIEP/Voucher/",
              data: base64,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          )
          .then((response) => {
            if (response.data.success) {
              toast.success("Xuất file thành công", {
                description: `Đã xuất ${excelData.length} mã giảm giá vào thư mục D:/LUANVANTOTNGHIEP/Voucher/`,
              });
            } else {
              throw new Error(response.data.message || "Không thể lưu file");
            }
          })
          .catch((error) => {
            console.error("Error saving file on server:", error);
            // Fallback to client-side download
            XLSX.writeFile(workbook, fileName);
            toast.success("Xuất file thành công (chế độ tải xuống)", {
              description: `Đã xuất ${excelData.length} mã giảm giá ra file Excel`,
            });
          });
        return;
      }

      // Phương thức 3: Sử dụng File System Access API (cho trình duyệt hiện đại)
      if ("showDirectoryPicker" in window) {
        exportWithFileSystemAPI(workbook, fileName);
        return;
      }

      // Phương thức 4: Tải xuống trực tiếp (phương pháp mặc định)
      XLSX.writeFile(workbook, fileName);
      toast.success("Xuất file thành công", {
        description: `Đã xuất ${excelData.length} mã giảm giá ra file Excel`,
      });
    } catch (error) {
      console.error("Error exporting Excel file:", error);
      toast.error("Lỗi khi xuất file", {
        description: error.message || "Không thể xuất file Excel",
      });
    }
  };

  // Hàm chuyển đổi ArrayBuffer thành Base64
  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Hàm hỗ trợ xuất file sử dụng File System Access API
  const exportWithFileSystemAPI = async (workbook, suggestedName) => {
    try {
      // Hiển thị hộp thoại chọn thư mục
      const dirHandle = await window.showDirectoryPicker({
        id: "vouchers",
        startIn: "documents",
      });

      // Tạo file trong thư mục đã chọn
      const fileHandle = await dirHandle.getFileHandle(suggestedName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();

      // Ghi dữ liệu vào file
      await writable.write(
        XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      );
      await writable.close();

      toast.success("Xuất file thành công", {
        description: `Đã xuất ${coupons.length} mã giảm giá vào thư mục đã chọn`,
      });
    } catch (error) {
      console.error("Error using File System Access API:", error);

      // Fallback to regular download if user cancels or API fails
      if (error.name !== "AbortError") {
        XLSX.writeFile(workbook, suggestedName);
        toast.success("Xuất file thành công", {
          description: `Đã xuất ${coupons.length} mã giảm giá ra file Excel`,
        });
      }
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isExpired = (coupon) => {
    return coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  };

  // Templates for data table columns
  const codeTemplate = (rowData) => {
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-blue-600">{rowData.code}</span>
        {isExpired(rowData) && <Tag value="Hết hạn" severity="danger" />}
      </div>
    );
  };

  const valueTemplate = (rowData) => {
    if (rowData.type === "percentage") {
      return <span className="font-medium">{rowData.value}%</span>;
    } else {
      return (
        <span className="font-medium">{formatCurrency(rowData.value)}</span>
      );
    }
  };

  const minOrderTemplate = (rowData) => {
    return formatCurrency(rowData.minOrder);
  };

  const maxDiscountTemplate = (rowData) => {
    return rowData.maxDiscount ? (
      formatCurrency(rowData.maxDiscount)
    ) : (
      <span className="text-gray-500 italic">Không giới hạn</span>
    );
  };

  const expiresAtTemplate = (rowData) => {
    if (!rowData.expiresAt)
      return <span className="text-gray-500 italic">Không hết hạn</span>;
    
    const expired = isExpired(rowData);
    const dateStr = formatDate(rowData.expiresAt);
    
    return (
      <span className={expired ? "text-red-500 font-medium" : ""}>
        {dateStr}
      </span>
    );
  };

  const usageLimitTemplate = (rowData) => {
    const used = rowData.used || 0;
    const limit = rowData.usageLimit;
    const isNearLimit = limit && used >= limit * 0.8;
    const isAtLimit = limit && used >= limit;
    
    return (
      <div className="flex items-center gap-2">
        <span
          className={
            isAtLimit
              ? "text-red-500 font-bold"
              : isNearLimit
              ? "text-orange-500 font-medium"
              : ""
          }
        >
          {used}
        </span>
        <span className="text-gray-400">/</span>
        <span>{limit || <span className="text-gray-500">∞</span>}</span>
      </div>
    );
  };

  const statusTemplate = (rowData) => {
    if (isExpired(rowData)) {
      return <Tag value="Hết hạn" severity="danger" className="px-3 py-1" />;
    }
    
    return rowData.isActive ? (
      <Tag
        value="Hoạt động"
        severity="success"
        icon="pi pi-check"
        className="px-3 py-1"
      />
    ) : (
      <Tag
        value="Vô hiệu"
        severity="danger"
        icon="pi pi-times"
        className="px-3 py-1"
      />
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2 justify-center">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          className="p-button-success mr-2"
          onClick={() => openEditDialog(rowData)}
          tooltip="Sửa"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon={rowData.isActive ? "pi pi-ban" : "pi pi-check"}
          rounded
          outlined
          className={rowData.isActive ? "p-button-warning" : "p-button-success"}
          onClick={() => toggleCouponStatus(rowData)}
          tooltip={rowData.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-refresh"
          rounded
          outlined
          className="p-button-help"
          onClick={() => resetCouponUsage(rowData)}
          tooltip="Đặt lại lượt dùng"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  // Render header with filters
  const renderHeader = () => {
    return (
      <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
        <div className="flex gap-3">
          <Button 
            label="Thêm mới" 
            severity="success" 
            onClick={openNewDialog}
            className="px-4 py-2 bg-[#51bb1a] hover:opacity-80 text-white p-2 rounded gap-2" 
          />
          <Button
            severity="info"
            label="Xuất Excel"
            onClick={exportExcel}
            className="px-4 py-2 bg-red-500 hover:opacity-80 text-white p-2 rounded gap-2"
          />
          <Button
            severity="secondary"
            label={autoExportEnabled ? "Tắt tự động xuất" : "Tự động xuất"}
            onClick={() => setShowAutoExportDialog(true)}
            className={`px-4 py-2 ${
              autoExportEnabled ? "bg-orange-500" : "bg-blue-500"
            } hover:opacity-80 text-white p-2 rounded gap-2`}
            icon={autoExportEnabled ? "pi pi-clock" : "pi pi-cog"}
          />
        </div>
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Tìm kiếm mã giảm giá..."
            className="w-full shadow-sm p-3 rounded-lg border border-gray-200"
            style={{ minWidth: "300px" }}
          />
        </span>
      </div>
    );
  };

  const header = renderHeader();

  // Thêm hàm reset usage
  const resetCouponUsage = (coupon) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn đặt lại số lượng sử dụng của mã "${coupon.code}" về 0?`,
      header: "Xác nhận đặt lại",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Có",
      rejectLabel: "Không",
      acceptClassName: "p-button-primary",
      accept: async () => {
        try {
          setLoading(true);
          const token = sessionStorage.getItem("adminToken");
          if (!token) {
            toast.error("Lỗi", {
              description: "Bạn cần đăng nhập lại",
            });
            return;
          }

          const response = await couponApi.resetCouponUsage(
            coupon._id,
            0,
            token
          );
          if (response.success) {
            toast.success(response.message);
            fetchCoupons();
          } else {
            toast.error(response.message);
          }
        } catch (error) {
          console.error("Error resetting coupon usage:", error);
          toast.error("Lỗi", {
            description: "Đã xảy ra lỗi khi đặt lại số lượng sử dụng",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Handle pagination change
  const handlePageChange = ({ page, rows }) => {
    setFirst((page - 1) * rows);
    setRowsPerPage(rows);
  };

  // Auto export functions
  const startAutoExport = () => {
    // Clear any existing interval
    if (exportIntervalRef.current) {
      clearInterval(exportIntervalRef.current);
    }

    // Calculate next export time
    const nextTime = new Date();
    nextTime.setMinutes(nextTime.getMinutes() + exportInterval);
    setNextExportTime(nextTime);

    // Set up interval for auto export
    exportIntervalRef.current = setInterval(() => {
      exportExcel();

      // Update next export time
      const nextTime = new Date();
      nextTime.setMinutes(nextTime.getMinutes() + exportInterval);
      setNextExportTime(nextTime);
    }, exportInterval * 60 * 1000); // Convert minutes to milliseconds

    toast.current.show({
      severity: "success",
      summary: "Tự động xuất file",
      detail: `Đã bật tự động xuất file mỗi ${exportInterval} phút`,
      life: 3000,
    });
  };

  const stopAutoExport = () => {
    if (exportIntervalRef.current) {
      clearInterval(exportIntervalRef.current);
      exportIntervalRef.current = null;
      setNextExportTime(null);

      toast.current.show({
        severity: "info",
        summary: "Tự động xuất file",
        detail: "Đã tắt tự động xuất file",
        life: 3000,
      });
    }
  };

  const handleAutoExportToggle = (enabled) => {
    setAutoExportEnabled(enabled);
    if (enabled) {
      startAutoExport();
    } else {
      stopAutoExport();
    }
  };

  const saveAutoExportSettings = () => {
    if (autoExportEnabled) {
      startAutoExport();
    }
    setShowAutoExportDialog(false);
  };

  // Auto Export Dialog
  const autoExportDialogFooter = (
    <div className="gap-4 flex justify-end p-2">
      <Button
        label="Hủy"
        className="p-button-text bg-red-500 hover:opacity-80 text-white p-2 rounded gap-2 px-4"
        onClick={() => setShowAutoExportDialog(false)}
      />
      <Button
        label="Lưu"
        className="p-button-text bg-[#51bb1a] hover:opacity-80 text-white p-2 rounded gap-2 px-4"
        onClick={saveAutoExportSettings}
      />
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" richColors closeButton />
      <ConfirmDialog />
      
      <PageHeader 
        title="Quản lý mã giảm giá" 
        subtitle="Tạo và quản lý các mã giảm giá cho khách hàng"
        icon="coupon" 
        className="mb-6"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 shadow-sm flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <i className="pi pi-ticket text-2xl text-blue-500"></i>
          </div>
          <span className="text-sm text-blue-700 font-medium">Tổng số mã</span>
          <span className="text-3xl font-bold text-blue-800">
            {stats.total || 0}
          </span>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg border border-green-100 shadow-sm flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <i className="pi pi-check-circle text-2xl text-green-500"></i>
          </div>
          <span className="text-sm text-green-700 font-medium">
            Đang hoạt động
          </span>
          <span className="text-3xl font-bold text-green-800">
            {stats.active || 0}
          </span>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg border border-red-100 shadow-sm flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <i className="pi pi-clock text-2xl text-red-500"></i>
          </div>
          <span className="text-sm text-red-700 font-medium">Đã hết hạn</span>
          <span className="text-3xl font-bold text-red-800">
            {stats.expired || 0}
          </span>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 shadow-sm flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
            <i className="pi pi-shopping-cart text-2xl text-purple-500"></i>
          </div>
          <span className="text-sm text-purple-700 font-medium">
            Đã sử dụng
          </span>
          <span className="text-3xl font-bold text-purple-800">
            {stats.used || 0}
          </span>
        </div>
      </div>
      
      <div className="card">
        <DataTable 
          ref={dt}
          value={coupons.slice(first, first + rowsPerPage)} 
          dataKey="_id"
          filters={filters}
          filterDisplay="menu"
          className="shadow-md rounded-lg overflow-hidden"
          tableClassName="p-datatable-striped"
          loading={loading}
          globalFilterFields={["code"]}
          header={header}
          emptyMessage={
            <div className="p-6 text-center">
              <i className="pi pi-ticket text-5xl text-gray-300 mb-3 block"></i>
              <p className="text-lg text-gray-500">
                Không tìm thấy mã giảm giá nào
              </p>
              <Button 
                label="Tạo mã giảm giá đầu tiên" 
                icon="pi pi-plus" 
                className="mt-3 p-button-sm" 
                onClick={openNewDialog}
              />
            </div>
          }
          tableStyle={{ minWidth: "50rem" }}
          stripedRows
          resizableColumns
          size="small"
          sortMode="single"
        >
          <Column
            field="code"
            header="Mã giảm giá"
            body={codeTemplate}
            sortable={false}
            headerClassName="bg-gray-50 text-gray-700"
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="value"
            header="Giá trị"
            body={valueTemplate}
            sortable={false}
            headerClassName="bg-gray-50 text-gray-700"
            style={{ minWidth: "8rem" }}
          />
          <Column
            field="minOrder"
            header="Đơn hàng tối thiểu"
            body={minOrderTemplate}
            sortable={false}
            headerClassName="bg-gray-50 text-gray-700"
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="maxDiscount"
            header="Giảm tối đa"
            body={maxDiscountTemplate}
            headerClassName="bg-gray-50 text-gray-700"
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="expiresAt"
            header="Ngày hết hạn"
            body={expiresAtTemplate}
            sortable={false}
            headerClassName="bg-gray-50 text-gray-700"
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="usageLimit"
            header="Lượt sử dụng"
            body={usageLimitTemplate}
            sortable={false}
            headerClassName="bg-gray-50 text-gray-700"
            style={{ minWidth: "8rem" }}
          />
          <Column
            field="isActive"
            header="Trạng thái"
            body={statusTemplate}
            sortable={false}
            headerClassName="bg-gray-50 text-gray-700"
            style={{ minWidth: "8rem" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            header="Thao tác"
            headerClassName="bg-gray-50 text-gray-700"
            style={{ minWidth: "8rem", textAlign: "center" }}
          />
        </DataTable>
        {/* External pagination */}
        <div className="mt-4">
          <Pagination
            totalRecords={coupons.length}
            rowsPerPageOptions={[5, 10, 25, 50]}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      <Dialog
        visible={showDialog}
        header={isEditMode ? "Cập nhật mã giảm giá" : "Thêm mã giảm giá mới"}
        modal
        className="p-fluid shadow-xl"
        style={{ width: "80vw", maxWidth: "850px", borderRadius: "12px" }}
        contentClassName="p-0"
        headerClassName="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-4 font-bold"
        footer={
          <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t">
            <Button
              label="Hủy"
              icon="pi pi-times"
              outlined
              onClick={() => setShowDialog(false)}
              className="px-4  shadow-md bg-red-500 hover:opacity-80 text-white p-2 rounded gap-2"
            />
            <Button
              label={isEditMode ? "Cập nhật" : "Tạo mới"}
              icon="pi pi-check"
              onClick={saveCoupon}
              loading={loading}
              className="px-4  shadow-md bg-[#51bb1a] hover:opacity-80 text-white p-2 rounded gap-2"
            />
          </div>
        }
        onHide={() => setShowDialog(false)}
        draggable={false}
        resizable={false}
        dismissableMask={true}
      >
        <div className="p-5 bg-white">
          {isEditMode && (
            <div className="mb-5 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500 shadow-sm">
              <p className="text-blue-700 font-medium m-0 flex items-center">
                <i className="pi pi-info-circle mr-2 text-blue-600"></i>
                Đang chỉnh sửa:{" "}
                <span className="font-bold ml-2 text-blue-800">
                  {selectedCoupon?.code}
                </span>
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="field">
              <label
                htmlFor="code"
                className="font-bold text-gray-700 mb-2 block"
              >
                Mã giảm giá
              </label>
              <div className="flex gap-2">
                <span className="p-input-icon-left w-full">
                  <i className="pi pi-tag" />
                  <InputText
                    id="code"
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      });
                    }}
                    placeholder="Nhập mã giảm giá"
                    className="w-full border border-gray-300  rounded-md hover:border-blue-500"
                  />
                </span>
                <Button
                  icon="pi pi-refresh"
                  className="p-button-outlined border border-gray-300 hover:border-blue-500"
                  onClick={() => {
                    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                    let autoCode = "";
                    for (let i = 0; i < 9; i++) {
                      autoCode += chars.charAt(
                        Math.floor(Math.random() * chars.length)
                      );
                    }
                    setFormData({ ...formData, code: autoCode });
                  }}
                  tooltip="Tạo mã tự động"
                />
              </div>
              <small className="text-gray-500 mt-1 block">
                Mã giảm giá sẽ hiển thị dưới dạng chữ in hoa
              </small>
            </div>

            <div className="field">
              <label
                htmlFor="type"
                className="font-bold text-gray-700 mb-2 block"
              >
                Loại giảm giá
              </label>
              <Dropdown
                id="type"
                value={formData.type}
                options={discountTypes}
                onChange={(e) => setFormData({ ...formData, type: e.value })}
                placeholder="Chọn loại giảm giá"
                className="w-full p-inputtext border border-gray-300 rounded-md hover:border-blue-500"
              />
            </div>

            <div className="field">
              <label
                htmlFor="value"
                className="font-bold text-gray-700 mb-2 block"
              >
                {formData.type === "percentage"
                  ? "Phần trăm giảm (%)"
                  : "Số tiền giảm"}
              </label>
              <span className="p-input-icon-left w-full">
                <i
                  className={`pi ${
                    formData.type === "percentage"
                      ? "pi-percentage"
                      : "pi-money-bill"
                  } text-green-500`}
                ></i>
                <InputNumber
                  id="value"
                  value={formData.value}
                  onValueChange={(e) =>
                    setFormData({ ...formData, value: e.value })
                  }
                  placeholder={
                    formData.type === "percentage"
                      ? "Nhập % giảm giá"
                      : "Nhập số tiền giảm"
                  }
                  min={0}
                  max={formData.type === "percentage" ? 100 : undefined}
                  suffix={formData.type === "percentage" ? "%" : ""}
                  mode={formData.type === "fixed" ? "currency" : undefined}
                  currency={formData.type === "fixed" ? "VND" : undefined}
                  currencyDisplay={
                    formData.type === "fixed" ? "code" : undefined
                  }
                  locale="vi-VN"
                  className="w-full p-3 border border-gray-300 rounded-md hover:border-green-500"
                />
              </span>
            </div>

            <div className="field">
              <label
                htmlFor="minOrder"
                className="font-bold text-gray-700 mb-2 block"
              >
                Đơn hàng tối thiểu
              </label>
              <span className="p-input-icon-left w-full">
                <i className="pi pi-shopping-cart text-orange-500"></i>
                <InputNumber
                  id="minOrder"
                  value={formData.minOrder}
                  onValueChange={(e) =>
                    setFormData({ ...formData, minOrder: e.value })
                  }
                  mode="currency"
                  currency="VND"
                  currencyDisplay="code" 
                  locale="vi-VN"
                  min={0}
                  className="w-full p-3 border border-gray-300 rounded-md hover:border-orange-500"
                />
              </span>
            </div>

            <div className="field">
              <label
                htmlFor="maxDiscount"
                className="font-bold text-gray-700 mb-2 block"
              >
                Giảm tối đa
              </label>
              <span className="p-input-icon-left w-full">
                <i className="pi pi-wallet text-purple-500"></i>
                <InputNumber
                  id="maxDiscount"
                  value={formData.maxDiscount}
                  onValueChange={(e) =>
                    setFormData({ ...formData, maxDiscount: e.value })
                  }
                  mode="currency"
                  currency="VND"
                  currencyDisplay="code"
                  locale="vi-VN"
                  min={0}
                  className="w-full p-3 border border-gray-300 rounded-md hover:border-purple-500"
                  placeholder="Không giới hạn"
                />
              </span>
              <small className="text-gray-500 mt-1 block">
                Để trống = không giới hạn số tiền giảm
              </small>
            </div>

            <div className="field">
              <label
                htmlFor="usageLimit"
                className="font-bold text-gray-700 mb-2 block"
              >
                Giới hạn sử dụng
              </label>
              <span className="p-input-icon-left w-full">
                <i className="pi pi-users text-teal-500"></i>
                <InputNumber
                  id="usageLimit"
                  value={formData.usageLimit}
                  onValueChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.value })
                  }
                  min={0}
                  className="w-full p-3 border border-gray-300 rounded-md hover:border-teal-500"
                  placeholder="Không giới hạn"
                />
              </span>
              <small className="text-gray-500 mt-1 block">
                Để trống = không giới hạn số lần sử dụng
              </small>
            </div>

            <div className="field">
              <label
                htmlFor="expiresAt"
                className="font-bold text-gray-700 mb-2 block"
              >
                Ngày hết hạn
              </label>
              <Calendar
                id="expiresAt"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.value })
                }
                showIcon
                showButtonBar
                className="w-full p-inputtext border border-gray-300 rounded-md hover:border-red-400"
                dateFormat="dd/mm/yy"
                minDate={new Date()}
                placeholder="Không hết hạn"
                panelClassName="bg-white shadow-xl"
                transitionOptions={{ timeout: 200 }}
              />
              <small className="text-gray-500 mt-1 block">
                Để trống = không có ngày hết hạn
              </small>
            </div>

            <div className="field flex items-center p-3  rounded-lg">
              <label
                htmlFor="isActive"
                className="font-bold text-gray-700 mr-3"
              >
                Trạng thái
              </label>
              <ToggleButton
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.value })
                }
                className="w-auto p-1 gap-2"
                onIcon="pi pi-check"
                offIcon="pi pi-times"
                onLabel="Kích hoạt"
                offLabel="Vô hiệu"
                onClassName="bg-green-500 hover:bg-green-600"
                offClassName="bg-red-500 hover:bg-red-600"
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Auto Export Dialog */}
      <Dialog
        visible={showAutoExportDialog}
        style={{ width: "450px" }}
        header="Cấu hình tự động xuất file"
        modal
        className="p-fluid"
        headerClassName="p-2"
        footer={autoExportDialogFooter}
        onHide={() => setShowAutoExportDialog(false)}
      >
        <div className="field p-4">
          <div className="flex align-items-center ">
            <Checkbox
              inputId="autoExport"
              checked={autoExportEnabled}
              onChange={(e) => handleAutoExportToggle(e.checked)}
              className="mr-2 border p-3 rounded"
            />
            <label htmlFor="autoExport" className="font-medium">
              Bật tự động xuất file Excel
            </label>
          </div>
        </div>

        <div className="field p-4 -mt-10">
          <label htmlFor="interval" className="font-medium">
            Thời gian giữa các lần xuất (ngày)
          </label>
          <InputNumber
            id="interval"
            value={exportInterval}
            onValueChange={(e) => setExportInterval(e.value)}
            min={5}
            max={10080} // Max 7 days
            disabled={!autoExportEnabled}
          />
          <small>Tối thiểu 5 phút, tối đa 7 ngày (10080 phút)</small>
        </div>

        <div className="field p-4 -mt-10">
          <label className="font-medium mb-2 block">Cài đặt nhanh</label>
          <div className="flex flex-wrap gap-2">
            <Button
              label="1 giờ"
              className="p-button-sm p-button-outlined border p-2 rounded"
              onClick={() => setExportInterval(60)}
              disabled={!autoExportEnabled}
            />
            <Button
              label="1 ngày"
              className="p-button-sm p-button-outlined border p-2 rounded"
              onClick={() => setExportInterval(1440)}
              disabled={!autoExportEnabled}
            />
            <Button
              label="7 ngày"
              className="p-button-sm p-button-outlined p-button-success border p-2 rounded"
              onClick={() => setExportInterval(10080)}
              disabled={!autoExportEnabled}
            />
          </div>
        </div>

        {nextExportTime && (
          <div className="field">
            <label className="font-medium">Lần xuất tiếp theo</label>
            <div className="p-2 border-1 surface-border border-round">
              {format(nextExportTime, "HH:mm:ss dd/MM/yyyy")}
            </div>
          </div>
        )}
      </Dialog>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .p-input-icon-left > i {
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
          font-size: 1rem;
          color: #4b5563;
        }
        .p-input-icon-left > .p-inputtext {
          padding-left: 2.5rem !important;
        }
        .p-input-icon-left > .p-inputnumber > .p-inputnumber-input {
          padding-left: 2.5rem !important;
          display: flex;
          align-items: center;
        }
        .p-calendar .p-inputtext {
          padding-right: 2.5rem;
        }
        .p-dropdown, .p-calendar, .p-inputtext, .p-inputnumber, .p-inputnumber-input {
          height: 48px !important;
        }
        .p-dropdown .p-dropdown-label, .p-inputtext, .p-inputnumber-input {
          padding: 0.75rem 1rem;
          height: 48px !important;
          border-radius: 0.375rem;
          font-size: 1rem;
          line-height: 1.5;
          display: flex;
          align-items: center;
        }
        .p-inputnumber-input {
          width: 100%;
        }
        .p-dropdown-panel .p-dropdown-items .p-dropdown-item {
          padding: 0.75rem 1.25rem;
        }
        .p-datepicker {
          padding: 0.5rem;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .p-dropdown .p-dropdown-trigger {
          width: 3rem;
          height: 100%;
          border-top-right-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .p-calendar .p-button {
          height: 100%;
        }
        .p-calendar .p-datepicker-trigger {
          height: 100%;
          width: 3rem;
          border-top-right-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .p-calendar .p-button-icon {
          font-size: 1rem;
        }
        .field {
          margin-bottom: 1.5rem;
        }
        .p-inputtext:enabled:focus {
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(59, 130, 246, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0);
        }
        .p-inputnumber {
          display: flex;
          align-items: center;
        }
        .p-calendar {
          display: flex;
          align-items: center;
        }
        .border {
          border-width: 1px !important;
        }

        /* Sửa lại CSS cho DataTable */
        .p-datatable .p-datatable-header {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 1rem;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        
        .p-datatable .p-datatable-thead > tr > th {
          background: #f8fafc;
          color: #334155;
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          font-weight: 600;
          text-align: left;
        }
        
        .p-datatable .p-datatable-tbody > tr > td {
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
        }
        
        .p-datatable .p-datatable-tbody > tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .p-datatable .p-datatable-tbody > tr:hover {
          background: #f1f5f9;
        }
        
        .p-datatable .p-paginator {
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .p-paginator .p-paginator-pages .p-paginator-page {
          width: 2.25rem;
          height: 2.25rem;
          margin: 0 0.25rem;
          border-radius: 50%;
          border: 1px solid transparent;
        }
        
        .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
          background: #3b82f6;
          color: #fff;
          border: 1px solid #3b82f6;
        }
        
        .p-paginator .p-paginator-first,
        .p-paginator .p-paginator-prev,
        .p-paginator .p-paginator-next,
        .p-paginator .p-paginator-last {
          width: 2.25rem;
          height: 2.25rem;
          margin: 0 0.25rem;
          border-radius: 50%;
          border: 1px solid transparent;
        }
        
        .p-paginator .p-paginator-first:hover,
        .p-paginator .p-paginator-prev:hover,
        .p-paginator .p-paginator-next:hover,
        .p-paginator .p-paginator-last:hover,
        .p-paginator .p-paginator-pages .p-paginator-page:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }
        
        .p-datatable .p-datatable-loading-overlay {
          background: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .p-datatable .p-datatable-loading-icon {
          font-size: 2rem;
          color: #3b82f6;
        }
        
        .p-column-title {
          font-weight: 600;
        }
        
        .p-datatable .p-sortable-column:focus {
          box-shadow: none;
          outline: 0 none;
        }
        
        .p-datatable .p-sortable-column .p-sortable-column-icon {
          margin-left: 0.5rem;
          color: #64748b;
        }
        
        .p-datatable .p-sortable-column.p-highlight {
          background: #f1f5f9;
          color: #334155;
        }
        
        .p-datatable .p-sortable-column.p-highlight .p-sortable-column-icon {
          color: #3b82f6;
        }
        
        .p-datatable-wrapper {
          border-radius: 0.5rem;
          overflow: hidden;
        }

        /* Sửa lỗi hiển thị của các component trong bảng */
        .p-tag {
          padding: 0.25rem 0.75rem;
          margin: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          font-size: 0.75rem;
          line-height: 1;
        }
        
        .p-column-filter-menu-button {
          width: 2rem;
          height: 2rem;
          color: #64748b;
          border-radius: 50%;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .p-column-filter-menu-button:hover {
          background-color: #e2e8f0;
          color: #334155;
        }
        
        .p-column-filter-menu-button.p-column-filter-menu-button-active {
          background-color: #eff6ff;
          color: #3b82f6;
        }

        .p-datatable .p-sortable-column-icon {
          display: none !important;
        }

        .p-datatable .p-sortable-column:hover {
          background-color: #f8fafc !important;
          color: #334155 !important;
        }

        .p-datatable .p-sortable-column.p-highlight {
          background-color: #f8fafc !important;
          color: #334155 !important;
        }

        .p-datatable .p-sortable-column:focus {
          box-shadow: none !important;
          outline: none !important;
        }
      `,
        }}
      />
    </div>
  );
};

export default CouponList;
