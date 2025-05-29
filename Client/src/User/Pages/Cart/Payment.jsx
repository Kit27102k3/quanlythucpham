/* eslint-disable no-unused-vars */
import { ExitIcon } from "@radix-ui/react-icons";
import { Avatar } from "primereact/avatar";
import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faMoneyCheckDollar,
  faTicket,
  faTrash,
  faCheck,
  faClipboard,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import paymentApi from "../../../api/paymentApi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import formatCurrency from "../../Until/FotmatPrice";
import orderApi from "../../../api/orderApi";
import { authApi } from "../../../api/authApi";
import couponApi from "../../../api/couponApi";
import savedVoucherApi from "../../../api/savedVoucherApi";
import axios from "axios";
import { API_URLS } from "../../../config/apiConfig";
import AddressSelector from "../../Pages/Checkout/AddressSelector";
import branchesApi from "../../../api/branchesApi";

export default function Payment() {
  const [users, setUsers] = useState(null);
  const [orderDetails, setOrderDetails] = useState({
    products: [],
    totalAmount: 0,
    productCount: 0,
  });
  const [note, setNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("delivery");
  const [selectedDelivery, setSelectedDelivery] = useState("standard");
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const navigate = useNavigate();
  const { paymentId } = useParams();
  const [loading, setLoading] = useState(false);
  const [userSavedVouchers, setUserSavedVouchers] = useState([]);
  const [showVouchersList, setShowVouchersList] = useState(false);
  const [appliedSavedVoucher, setAppliedSavedVoucher] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [assignedBranch, setAssignedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Replace the shipping fee calculation with distance-based calculation
  const shippingFee = useMemo(() => {
    // Base shipping fee
    const baseFee = 20000;
    
    // Get distance from assigned branch if available
    const distance = assignedBranch?.distance || 0;
    
    // Calculate fee based on distance
    // 0-5km: base fee
    // >5km: base fee + 5000 per km
    let distanceFee = 0;
    if (distance > 5) {
      distanceFee = Math.round((distance - 5) * 5000);
    }
    
    return baseFee + distanceFee;
  }, [assignedBranch]);

  const calculateSubtotal = () => {
    return orderDetails.totalAmount;
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + shippingFee - couponDiscount;
  };

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        if (!paymentId) {
          navigate("/gio-hang");
          return;
        }
        const response = await paymentApi.getPaymentById(paymentId);
        const paymentData = response.data || response;

        setOrderDetails({
          products: paymentData.products || [],
          totalAmount: paymentData.totalAmount || 0,
          productCount: paymentData.products?.length || 0,
        });

        try {
          const userResponse = await authApi.getProfile();
          setUsers(userResponse.data);

          // Lấy danh sách voucher đã lưu của người dùng
          const token = localStorage.getItem("accessToken");
          if (token) {
            fetchUserSavedVouchers(token);
          }
        } catch (userError) {
          toast.error("Không thể tải thông tin người dùng");
        }
      } catch (error) {
        toast.error("Không thể tải thông tin thanh toán");
        navigate("/gio-hang");
      }
    };

    fetchPaymentDetails();
  }, [paymentId, navigate]);

  // Thêm useEffect để cập nhật selectedAddress khi selectedAddressId thay đổi
  useEffect(() => {
    if (selectedAddressId && users && users.addresses) {
      const address = users.addresses.find(
        (addr) => addr._id === selectedAddressId
      );
      if (address) {
        console.log("Selected address found:", address);
        setSelectedAddress(address);
      }
    }
  }, [selectedAddressId, users]);

  // Thêm useEffect để tìm chi nhánh gần nhất khi selectedAddress thay đổi
  useEffect(() => {
    const findNearestBranch = async () => {
      try {
        if (selectedAddress) {
          // Nếu đã có chi nhánh được chọn, giữ nguyên
          if (selectedBranch) {
            return;
          }

          // Nếu địa chỉ có tọa độ, sử dụng tọa độ để tìm chi nhánh gần nhất
          if (selectedAddress.latitude && selectedAddress.longitude) {
            const branchResult = await branchesApi.assignBranchToAddress({
              address: selectedAddress.fullAddress,
              latitude: selectedAddress.latitude,
              longitude: selectedAddress.longitude,
            });

            if (branchResult.success) {
              // Lưu danh sách tất cả chi nhánh kèm khoảng cách nếu có
              if (
                branchResult.allBranches &&
                Array.isArray(branchResult.allBranches)
              ) {
                setBranches(branchResult.allBranches);
              }

              if (branchResult.assignedBranch) {
                setAssignedBranch(branchResult.assignedBranch);
                console.log(
                  "Chi nhánh gần nhất:",
                  branchResult.assignedBranch.name
                );
              }
            }
          } else {
            // Nếu không có tọa độ, chỉ dùng địa chỉ để tìm chi nhánh gần nhất
            const branchResult = await branchesApi.assignBranchToAddress({
              address: selectedAddress.fullAddress,
            });

            if (branchResult.success) {
              // Lưu danh sách tất cả chi nhánh
              if (
                branchResult.allBranches &&
                Array.isArray(branchResult.allBranches)
              ) {
                setBranches(branchResult.allBranches);
              }

              if (branchResult.assignedBranch) {
                setAssignedBranch(branchResult.assignedBranch);
                console.log(
                  "Chi nhánh gần nhất (dựa vào địa chỉ):",
                  branchResult.assignedBranch.name
                );
              }
            }
          }
        } else if (users && users.address) {
          // Sử dụng địa chỉ mặc định của người dùng
          const branchResult = await branchesApi.assignBranchToAddress({
            address: users.address,
          });

          if (branchResult.success) {
            // Lưu danh sách tất cả chi nhánh
            if (
              branchResult.allBranches &&
              Array.isArray(branchResult.allBranches)
            ) {
              setBranches(branchResult.allBranches);
            }

            if (branchResult.assignedBranch) {
              setAssignedBranch(branchResult.assignedBranch);
              console.log(
                "Chi nhánh gần nhất (dựa vào địa chỉ mặc định):",
                branchResult.assignedBranch.name
              );
            }
          }
        }
      } catch (error) {
        console.error("Lỗi khi tìm chi nhánh gần nhất:", error);
      }
    };

    findNearestBranch();
  }, [selectedAddress, users, selectedBranch]);

  // Hàm lấy danh sách voucher đã lưu của người dùng
  const fetchUserSavedVouchers = async (token) => {
    try {
      const response = await savedVoucherApi.getUserSavedVouchers(token);
      if (response.success && response.data) {
        // Lọc các voucher còn hiệu lực và chưa hết hạn và chưa sử dụng (isPaid = false)
        // (API đã lọc isPaid = false, nhưng chúng ta vẫn kiểm tra lại)
        const validVouchers = response.data.filter((voucher) => {
          const coupon = voucher.couponId;
          const now = new Date();
          const isExpired =
            coupon.expiresAt && new Date(coupon.expiresAt) < now;
          const isActive = coupon.isActive;
          const isOutOfStock =
            coupon.usageLimit && coupon.used >= coupon.usageLimit;
          const isUsed = voucher.isPaid === true;

          return isActive && !isExpired && !isOutOfStock && !isUsed;
        });

        setUserSavedVouchers(validVouchers);
      }
    } catch (error) {
      console.error("Error fetching saved vouchers:", error);
    }
  };

  // Hàm kiểm tra voucher còn hiệu lực không
  const isVoucherValid = (coupon) => {
    const now = new Date();
    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < now;
    const isActive = coupon.isActive;
    const isOutOfStock = coupon.usageLimit && coupon.used >= coupon.usageLimit;

    return isActive && !isExpired && !isOutOfStock;
  };

  // Hàm áp dụng voucher đã lưu
  const handleApplySavedVoucher = async (voucher) => {
    try {
      if (!voucher || !voucher.couponId) {
        toast.error("Voucher không hợp lệ");
        return;
      }

      const coupon = voucher.couponId;
      console.log("Thông tin voucher cần áp dụng:", {
        voucherId: voucher._id,
        couponId: coupon._id,
        code: coupon.code,
        value: coupon.value,
        type: coupon.type,
      });

      if (!isVoucherValid(coupon)) {
        toast.error("Voucher này đã hết hạn hoặc hết lượt sử dụng");
        return;
      }

      // Kiểm tra nếu người dùng đã sử dụng voucher này trước đó
      const currentUserId = users?._id;
      if (!currentUserId) {
        toast.error("Vui lòng đăng nhập để sử dụng voucher");
        return;
      }

      const currentCouponId = coupon._id;
      if (!currentCouponId) {
        toast.error("Mã giảm giá không hợp lệ");
        return;
      }

      // Check local storage for used vouchers
      const usedVouchersStr = localStorage.getItem("usedVouchers");
      const usedVouchers = usedVouchersStr ? JSON.parse(usedVouchersStr) : [];

      const hasUsedVoucher = usedVouchers.some(
        (used) =>
          used.userId === currentUserId && used.couponId === currentCouponId
      );

      if (hasUsedVoucher) {
        toast.error(
          "Bạn đã sử dụng voucher này rồi, vui lòng chọn voucher khác"
        );
        return;
      }

      if (!coupon.code) {
        toast.error("Mã giảm giá không hợp lệ");
        return;
      }

      setCouponCode(coupon.code);
      setValidatingCoupon(true);

      try {
        // Gọi API để kiểm tra mã giảm giá
        console.log(
          "Gọi API validateCoupon với mã:",
          coupon.code,
          "và giá trị:",
          calculateSubtotal()
        );
        const result = await couponApi.validateCoupon(
          coupon.code,
          calculateSubtotal()
        );
        console.log("Kết quả kiểm tra mã giảm giá từ voucher đã lưu:", result);

        if (!result) {
          throw new Error("Không nhận được phản hồi từ máy chủ");
        }

        // Kiểm tra API trả về thành công và có dữ liệu hợp lệ
        if (result.success) {
          // Trường hợp API trả về success nhưng không có data
          if (!result.data) {
            // Sử dụng thông tin sẵn có từ voucher được lưu
            const discountValue = calculateDiscountFromVoucher(
              coupon,
              calculateSubtotal()
            );

            setAppliedCoupon(coupon);
            setAppliedSavedVoucher(voucher);
            setCouponDiscount(discountValue);
            setCouponSuccess("Áp dụng mã giảm giá thành công");
            setShowVouchersList(false);

            toast.success("Áp dụng mã giảm giá thành công");
            return;
          }

          // Trường hợp có data nhưng không có coupon
          if (!result.data.coupon) {
            setAppliedCoupon(coupon);
            setAppliedSavedVoucher(voucher);
            setCouponDiscount(
              result.data.discountAmount ||
                calculateDiscountFromVoucher(coupon, calculateSubtotal())
            );
            setCouponSuccess(
              result.data.message || "Áp dụng mã giảm giá thành công"
            );
            setShowVouchersList(false);

            toast.success(
              result.data.message || "Áp dụng mã giảm giá thành công"
            );
            return;
          }

          // Trường hợp bình thường - có đầy đủ dữ liệu
          setAppliedCoupon(result.data.coupon);
          setAppliedSavedVoucher(voucher);
          setCouponDiscount(result.data.discountAmount || 0);
          setCouponSuccess(
            result.data.message || "Áp dụng mã giảm giá thành công"
          );
          setShowVouchersList(false);

          toast.success(
            result.data.message || "Áp dụng mã giảm giá thành công"
          );
        } else {
          // Hiển thị lỗi
          const errorMessage =
            result && result.message
              ? result.message
              : "Mã giảm giá không hợp lệ hoặc đã hết hạn";
          setCouponError(errorMessage);
          setCouponDiscount(0);
          setAppliedCoupon(null);
          setAppliedSavedVoucher(null);

          toast.error(errorMessage);
        }
      } catch (apiError) {
        console.error("Error applying coupon:", apiError);
        const errorMessage =
          apiError.response?.data?.message ||
          apiError.message ||
          "Không thể áp dụng mã giảm giá";
        setCouponError(errorMessage);
        setCouponDiscount(0);
        setAppliedCoupon(null);
        setAppliedSavedVoucher(null);

        toast.error(errorMessage);
      } finally {
        setValidatingCoupon(false);
      }
    } catch (mainError) {
      console.error("Error in handleApplySavedVoucher:", mainError);
      toast.error("Có lỗi xảy ra khi áp dụng voucher");
      setValidatingCoupon(false);
    }
  };

  // Hàm tính giảm giá từ thông tin voucher
  const calculateDiscountFromVoucher = (coupon, subtotal) => {
    if (!coupon) return 0;

    if (coupon.type === "percentage") {
      // Giảm giá theo phần trăm
      const discountAmount = (subtotal * coupon.value) / 100;

      // Nếu có giới hạn giảm giá tối đa
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        return coupon.maxDiscount;
      }

      return discountAmount;
    } else if (coupon.type === "fixed") {
      // Giảm giá cố định
      return Math.min(coupon.value, subtotal);
    }

    return 0;
  };

  // Hàm copy mã giảm giá
  const handleCopyVoucherCode = (code) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        toast.success("Đã sao chép mã giảm giá!");
      })
      .catch(() => {
        toast.error("Không thể sao chép mã giảm giá");
      });
  };

  const handleRemoveItem = async () => {
    if (!paymentId) return;
    try {
      await paymentApi.deletePayment(paymentId);
      navigate("/gio-hang");
    } catch (error) {
      toast.error("Xoá đơn hàng thất bại");
    }
  };

  const handleApplyCoupon = async () => {
    // Xóa thông báo lỗi cũ
    setCouponError("");
    setCouponSuccess("");

    // Kiểm tra đã nhập mã giảm giá chưa
    if (!couponCode.trim()) {
      setCouponError("Vui lòng nhập mã giảm giá");
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }

    setValidatingCoupon(true);

    try {
      // Gọi API để kiểm tra mã giảm giá
      const result = await couponApi.validateCoupon(
        couponCode,
        calculateSubtotal()
      );
      console.log("Kết quả kiểm tra mã giảm giá:", result);

      if (result && result.success && result.data && result.data.coupon) {
        const coupon = result.data.coupon;

        // Kiểm tra xem người dùng đã sử dụng voucher này trước đó chưa
        const currentUserId = users?._id;
        const currentCouponId = coupon._id;

        // Check local storage for used vouchers
        const usedVouchersStr = localStorage.getItem("usedVouchers");
        const usedVouchers = usedVouchersStr ? JSON.parse(usedVouchersStr) : [];

        const hasUsedVoucher = usedVouchers.some(
          (used) =>
            used.userId === currentUserId && used.couponId === currentCouponId
        );

        if (hasUsedVoucher) {
          setCouponError(
            "Bạn đã sử dụng voucher này rồi, vui lòng chọn voucher khác"
          );
          setCouponDiscount(0);
          setAppliedCoupon(null);
          toast.error(
            "Bạn đã sử dụng voucher này rồi, vui lòng chọn voucher khác"
          );
          return;
        }

        // Lưu thông tin mã giảm giá đã áp dụng
        setAppliedCoupon(coupon);
        setCouponDiscount(result.data.discountAmount || 0);
        setCouponSuccess(
          result.data.message || "Áp dụng mã giảm giá thành công"
        );

        // Hiển thị thông báo thành công
        toast.success(result.data.message || "Áp dụng mã giảm giá thành công");
      } else {
        // Hiển thị lỗi
        const errorMessage =
          result && result.message
            ? result.message
            : "Mã giảm giá không hợp lệ hoặc đã hết hạn";
        setCouponError(errorMessage);
        setCouponDiscount(0);
        setAppliedCoupon(null);

        // Hiển thị thông báo lỗi
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể áp dụng mã giảm giá";
      setCouponError(errorMessage);
      setCouponDiscount(0);
      setAppliedCoupon(null);

      // Hiển thị thông báo lỗi
      toast.error(errorMessage);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setCouponSuccess("");
    setCouponError("");
    setAppliedCoupon(null);
    toast.info("Đã hủy mã giảm giá");
  };

  const handlePaymentMethodChange = (method) => {
    if (method !== selectedPayment) {
      setSelectedPayment(method);
    }
  };

  const handleDeliveryMethodChange = (method) => {
    setSelectedDelivery(method);
  };

  // Cập nhật trạng thái isPaid của voucher đã lưu sau khi đặt hàng thành công
  const updateSavedVoucherStatusAfterOrder = async () => {
    if (appliedSavedVoucher) {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        // Bọc trong try-catch và không await để tránh block luồng chính nếu xảy ra lỗi
        try {
          // Cập nhật trạng thái isPaid thành true thay vì xóa
          await savedVoucherApi.updateSavedVoucherStatus(
            appliedSavedVoucher._id,
            true,
            token
          );
          console.log("Đã cập nhật trạng thái voucher đã lưu sau khi đặt hàng");
        } catch (voucherError) {
          console.error(
            "Lỗi khi cập nhật trạng thái voucher đã lưu:",
            voucherError
          );
          // Không throw error để không ảnh hưởng đến luồng đặt hàng
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái voucher đã lưu:", error);
      }
    }
  };

  // Thêm thông tin appliedSavedVoucher vào paymentData cho thanh toán QR/online
  const addSavedVoucherInfoToPayment = (paymentData) => {
    if (appliedSavedVoucher) {
      paymentData.savedVoucherId = appliedSavedVoucher._id;
    }
    return paymentData;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);

    try {
      if (!users) {
        toast.error("Vui lòng đăng nhập để đặt hàng");
        return;
      }

      // Kiểm tra xem đã chọn địa chỉ chưa
      if (!selectedAddress && !users.address) {
        toast.error("Vui lòng chọn địa chỉ giao hàng");
        setLoading(false);
        return;
      }

      // Sử dụng địa chỉ đã chọn hoặc địa chỉ mặc định của người dùng
      const deliveryAddress = selectedAddress
        ? selectedAddress.fullAddress
        : users.address;
      const receiverName = selectedAddress
        ? selectedAddress.receiverName
        : `${users.firstName} ${users.lastName}`;
      const receiverPhone = selectedAddress
        ? selectedAddress.receiverPhone
        : users.phone;

      if (!receiverPhone) {
        toast.error("Vui lòng cung cấp số điện thoại");
        setLoading(false);
        return;
      }

      if (!deliveryAddress) {
        toast.error("Vui lòng cung cấp địa chỉ giao hàng");
        setLoading(false);
        return;
      }

      // Phân công chi nhánh cho đơn hàng dựa trên địa chỉ giao hàng
      let assignedBranchId = null;
      try {
        // Nếu đã chọn chi nhánh cụ thể, sử dụng chi nhánh đó
        if (selectedBranch) {
          assignedBranchId = selectedBranch._id;
          console.log(
            "Đơn hàng được phân công cho chi nhánh đã chọn:",
            selectedBranch.name
          );
        }
        // Nếu không, tìm chi nhánh gần nhất
        else if (
          selectedAddress &&
          selectedAddress.latitude &&
          selectedAddress.longitude
        ) {
          // Sử dụng tọa độ để tìm chi nhánh gần nhất
          const branchResult = await branchesApi.assignBranchToAddress({
            address: deliveryAddress,
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude,
          });

          if (branchResult.success && branchResult.assignedBranch) {
            assignedBranchId = branchResult.assignedBranch._id;
            setAssignedBranch(branchResult.assignedBranch);
            console.log(
              "Đơn hàng được phân công cho chi nhánh:",
              branchResult.assignedBranch.name
            );
          }
        } else {
          // Nếu không có tọa độ, chỉ dùng địa chỉ để phân công
          const branchResult = await branchesApi.assignBranchToAddress({
            address: deliveryAddress,
          });

          if (branchResult.success && branchResult.assignedBranch) {
            assignedBranchId = branchResult.assignedBranch._id;
            setAssignedBranch(branchResult.assignedBranch);
            console.log(
              "Đơn hàng được phân công cho chi nhánh:",
              branchResult.assignedBranch.name
            );
          }
        }
      } catch (branchError) {
        console.error("Lỗi khi phân công chi nhánh:", branchError);
        // Không cần dừng quy trình đặt hàng nếu không tìm được chi nhánh phù hợp
      }

      const totalAmount = calculateFinalTotal();

      // Kiểm tra và log dữ liệu sản phẩm để debug
      console.log("Dữ liệu sản phẩm:", orderDetails.products);

      // Chuẩn bị dữ liệu sản phẩm đúng định dạng
      const productItems = orderDetails.products.map((item) => {
        // Kiểm tra cấu trúc dữ liệu và xử lý tương thích
        const productId = item.product?._id || item.productId?._id;
        const price = item.price || item.productId?.productPrice;

        if (!productId) {
          console.error("Sản phẩm không có ID:", item);
          throw new Error("Dữ liệu sản phẩm không hợp lệ");
        }

        return {
          productId: productId,
          quantity: item.quantity,
          price: price,
        };
      });

      // Tạo dữ liệu đơn hàng
      const orderData = {
        userId: users._id,
        products: productItems,
        shippingAddress: deliveryAddress,
        receiverName: receiverName,
        receiverPhone: receiverPhone,
        totalAmount: totalAmount,
        shippingFee: shippingFee,
        paymentMethod: selectedPayment,
        note: note,
        status: "pending",
        // Luôn đảm bảo đơn hàng được gán cho một chi nhánh
        branchId: assignedBranchId || assignedBranch?._id,
        // Thêm thông tin chi tiết vị trí giao hàng nếu có
        shippingInfo: {
          address: deliveryAddress,
          phone: receiverPhone,
          method: "standard",
          coordinates: selectedAddress?.latitude && selectedAddress?.longitude ? {
            lat: selectedAddress.latitude,
            lng: selectedAddress.longitude
          } : null
        }
      };

      // Thêm thông tin giảm giá nếu có
      if (appliedCoupon) {
        orderData.discountCode = appliedCoupon.code;
        orderData.discountAmount = couponDiscount;
      }

      // Thêm thông tin voucher đã lưu nếu có
      if (appliedSavedVoucher) {
        orderData.savedVoucherId = appliedSavedVoucher._id;
      }

      // Thêm thông tin mã giảm giá nếu có
      if (appliedCoupon) {
        orderData.coupon = {
          code: appliedCoupon.code,
          discount: couponDiscount,
        };
      }

      if (selectedPayment === "sepay") {
        try {
          let paymentData = {
            userId: users._id,
            amount: totalAmount,
            products: productItems,
            paymentMethod: selectedPayment,
            couponDiscount: couponDiscount,
            couponCode: appliedCoupon?.code,
          };

          // Thêm thông tin savedVoucher nếu áp dụng từ voucher đã lưu
          paymentData = addSavedVoucherInfoToPayment(paymentData);

          const paymentResponse = await paymentApi.createPayment(paymentData);
          const paymentId = paymentResponse.data._id;

          const sepayResponse = await paymentApi.createSepayPaymentUrl(
            paymentId,
            totalAmount,
            `Thanh toán đơn hàng ${new Date().getTime()}-${Math.floor(
              Math.random() * 1000
            )}`
          );

          if (sepayResponse) {
            const orderResponse = await orderApi.createOrder(orderData);
            const orderIdCreated = orderResponse._id;

            try {
              await paymentApi.updatePayment(paymentId, {
                orderId: orderIdCreated,
              });
            } catch (updateError) {
              await axios.patch(
                `${API_URLS.PAYMENTS}/${paymentId}`,
                { orderId: orderIdCreated },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );
            }

            // Cập nhật số lần sử dụng mã giảm giá nếu có
            if (appliedCoupon) {
              try {
                await couponApi.updateCouponUsage(appliedCoupon.code);

                // Lưu thông tin voucher đã sử dụng vào localStorage
                if (users && users._id && appliedCoupon._id) {
                  const usedVouchersStr = localStorage.getItem("usedVouchers");
                  const usedVouchers = usedVouchersStr
                    ? JSON.parse(usedVouchersStr)
                    : [];

                  // Thêm voucher mới vào danh sách đã sử dụng
                  usedVouchers.push({
                    userId: users._id,
                    couponId: appliedCoupon._id,
                    usedAt: new Date().toISOString(),
                  });

                  // Lưu lại vào localStorage
                  localStorage.setItem(
                    "usedVouchers",
                    JSON.stringify(usedVouchers)
                  );
                }
              } catch (couponError) {
                console.error("Error updating coupon usage:", couponError);
                // Không throw error để không ảnh hưởng đến luồng đặt hàng
              }
            }

            // Cập nhật trạng thái voucher đã lưu nếu có
            setTimeout(() => {
              updateSavedVoucherStatusAfterOrder().catch((err) => {
                console.error(
                  "Lỗi khi cập nhật trạng thái voucher đã lưu:",
                  err
                );
              });
            }, 100);

            // Gửi email thông báo đặt hàng thành công
            try {
              console.log("========== GỬI EMAIL XÁC NHẬN ĐƠN HÀNG ==========");
              console.log("Đang gửi yêu cầu email xác nhận đến API...");
              console.log(`OrderID: ${orderIdCreated}`);

              // Sử dụng địa chỉ đã chọn thay vì địa chỉ mặc định
              const emailUserInfo = {
                email: users.email,
                fullName:
                  receiverName ||
                  `${users.firstName || ""} ${users.lastName || ""}`.trim(),
                phone: receiverPhone || users.phone,
                address: deliveryAddress || users.address,
              };

              console.log("Thông tin người dùng:", emailUserInfo);

              // Gửi yêu cầu sau 1 giây để đảm bảo đơn hàng đã được lưu hoàn toàn vào database
              setTimeout(async () => {
                try {
                  const emailResponse = await axios.post(
                    `${API_URLS.ORDERS}/notify-order-success/${orderIdCreated}`,
                    emailUserInfo,
                    {
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem(
                          "accessToken"
                        )}`,
                      },
                    }
                  );

                  console.log("Phản hồi API gửi email:", emailResponse.data);
                  if (emailResponse.data.success) {
                    console.log("Email xác nhận đã được gửi thành công");
                  } else {
                    console.error(
                      "Không thể gửi email xác nhận:",
                      emailResponse.data.message
                    );
                  }
                } catch (err) {
                  console.error("Lỗi khi gửi email xác nhận đơn hàng:", err);
                }
                console.log("============================================");
              }, 1000);
            } catch (emailError) {
              console.error("Lỗi khi gửi email xác nhận đơn hàng:", emailError);
              // Không cần phải hiển thị thông báo lỗi về email cho người dùng
            }

            // Kiểm tra nếu có QR code ngân hàng, ưu tiên chuyển hướng tới trang QR
            if (
              sepayResponse.qrCode ||
              sepayResponse.method === "bank_transfer"
            ) {
              toast.info("Sử dụng phương thức thanh toán QR chuyển khoản");
              navigate(
                `/payment-qr?orderId=${orderIdCreated}&qrCode=${encodeURIComponent(
                  sepayResponse.qrCode
                )}&bankName=${encodeURIComponent(
                  sepayResponse.bankInfo?.name || "MBBank"
                )}&accountNumber=${
                  sepayResponse.bankInfo?.accountNumber || "0326743391"
                }&accountName=${encodeURIComponent(
                  sepayResponse.bankInfo?.accountName || "NGUYEN TRONG KHIEM"
                )}&amount=${totalAmount}`
              );
              return;
            }

            if (sepayResponse.method === "bank_transfer") {
              toast.info("Sử dụng phương thức thanh toán QR chuyển khoản");
              navigate(
                `/payment-qr?orderId=${orderIdCreated}&qrCode=${encodeURIComponent(
                  sepayResponse.qrCode
                )}&bankName=${encodeURIComponent(
                  sepayResponse.bankInfo.name
                )}&accountNumber=${
                  sepayResponse.bankInfo.accountNumber
                }&accountName=${encodeURIComponent(
                  sepayResponse.bankInfo.accountName
                )}&amount=${totalAmount}`
              );
              return;
            }

            if (sepayResponse.method === "sepay" && sepayResponse.data) {
              window.location.href = sepayResponse.data;
              return;
            }

            if (sepayResponse.fallbackQR) {
              toast.info(
                "Chuyển sang phương thức thanh toán chuyển khoản ngân hàng"
              );
              navigate(
                `/payment-qr?orderId=${orderIdCreated}&qrCode=${encodeURIComponent(
                  sepayResponse.fallbackQR
                )}&bankName=MBBank&accountNumber=0326743391&accountName=NGUYEN%20TRONG%20KHIEM&amount=${totalAmount}`
              );
              return;
            }

            if (sepayResponse.data) {
              window.location.href = sepayResponse.data;
              return;
            }

            throw new Error("Không nhận được thông tin thanh toán hợp lệ");
          } else {
            throw new Error("Không nhận được phản hồi từ cổng thanh toán");
          }
        } catch (error) {
          console.error("Lỗi khi xử lý thanh toán SePay:", error);
          toast.error(
            `Không thể kết nối đến cổng thanh toán: ${error.message}`
          );
        }
      } else {
        orderData.status = "pending";

        // Xử lý đơn hàng COD
        try {
          // Tạo đơn hàng
          const orderResponse = await orderApi.createOrder(orderData);
          const orderIdCreated = orderResponse._id;

          // Cập nhật số lần sử dụng mã giảm giá nếu có
          if (appliedCoupon) {
            try {
              await couponApi.updateCouponUsage(appliedCoupon.code);

              // Lưu thông tin voucher đã sử dụng vào localStorage
              if (users && users._id && appliedCoupon._id) {
                const usedVouchersStr = localStorage.getItem("usedVouchers");
                const usedVouchers = usedVouchersStr
                  ? JSON.parse(usedVouchersStr)
                  : [];

                // Thêm voucher mới vào danh sách đã sử dụng
                usedVouchers.push({
                  userId: users._id,
                  couponId: appliedCoupon._id,
                  usedAt: new Date().toISOString(),
                });

                // Lưu lại vào localStorage
                localStorage.setItem(
                  "usedVouchers",
                  JSON.stringify(usedVouchers)
                );
              }
            } catch (couponError) {
              console.error("Error updating coupon usage:", couponError);
              // Không throw error để không ảnh hưởng đến luồng đặt hàng
            }
          }

          // Cập nhật trạng thái voucher đã lưu nếu có
          setTimeout(() => {
            updateSavedVoucherStatusAfterOrder().catch((err) => {
              console.error("Lỗi khi cập nhật trạng thái voucher đã lưu:", err);
            });
          }, 100);

          // Gửi email thông báo đặt hàng thành công
          try {
            console.log("========== GỬI EMAIL XÁC NHẬN ĐƠN HÀNG ==========");
            console.log("Đang gửi yêu cầu email xác nhận đến API...");
            console.log(`OrderID: ${orderIdCreated}`);

            // Sử dụng địa chỉ đã chọn thay vì địa chỉ mặc định
            const emailUserInfo = {
              email: users.email,
              fullName:
                receiverName ||
                `${users.firstName || ""} ${users.lastName || ""}`.trim(),
              phone: receiverPhone || users.phone,
              address: deliveryAddress || users.address,
            };

            console.log("Thông tin người dùng:", emailUserInfo);

            // Gửi yêu cầu sau 1 giây để đảm bảo đơn hàng đã được lưu hoàn toàn vào database
            setTimeout(async () => {
              try {
                const emailResponse = await axios.post(
                  `${API_URLS.ORDERS}/notify-order-success/${orderIdCreated}`,
                  emailUserInfo,
                  {
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                      )}`,
                    },
                  }
                );

                console.log("Phản hồi API gửi email:", emailResponse.data);
                if (emailResponse.data.success) {
                  console.log("Email xác nhận đã được gửi thành công");
                } else {
                  console.error(
                    "Không thể gửi email xác nhận:",
                    emailResponse.data.message
                  );
                }
              } catch (err) {
                console.error("Lỗi khi gửi email xác nhận đơn hàng:", err);
              }
              console.log("============================================");
            }, 1000);
          } catch (emailError) {
            console.error("Lỗi khi gửi email xác nhận đơn hàng:", emailError);
            // Không cần phải hiển thị thông báo lỗi về email cho người dùng
          }

          toast.success("Đặt hàng thành công!");
          navigate(
            `/payment-result?orderId=${orderIdCreated}&status=success&amount=${totalAmount}`
          );
        } catch (orderError) {
          console.error("Lỗi khi tạo đơn hàng:", orderError);
          toast.error("Không thể đặt hàng. Vui lòng thử lại!");
        }
      }
    } catch (error) {
      console.error("Lỗi khi xử lý đặt hàng:", error);
      toast.error("Không thể đặt hàng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    setUsers((prev) => ({
      ...prev,
      phone: e.target.value,
    }));
  };

  const handleAddressSelect = (addressId) => {
    console.log("Selected address ID:", addressId);
    setSelectedAddressId(addressId);
  };

  const handleNoteChange = (e) => {
    setNote(e.target.value);
  };

  const handleLogout = () => {
    authApi.logout();
  };

  // Mã giảm giá
  const renderVoucherSection = () => {
    return (
      <div className="pt-3 mb-2">
        <label className=" text-sm font-medium text-gray-700 mb-2 flex items-center">
          <FontAwesomeIcon icon={faTicket} className="text-[#51bb1a] mr-2" />
          Mã giảm giá
        </label>

        {appliedCoupon ? (
          <div className="flex bg-green-50 p-2 border border-green-300 rounded-md mb-2">
            <div className="flex-grow">
              <div className="font-medium text-green-700 flex items-center">
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Đã áp dụng: {appliedCoupon.code}
              </div>
              <div className="text-sm text-green-600">
                {appliedCoupon.type === "percentage"
                  ? `Giảm ${appliedCoupon.value}%`
                  : `Giảm ${formatCurrency(appliedCoupon.value)}`}
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="bg-red-500 text-white px-3 ml-2 rounded-md hover:bg-red-600 transition flex items-center h-8"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex mb-2">
              <input
                type="text"
                placeholder="Nhập mã giảm giá"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-grow p-2 border border-gray-300 border-r-0 rounded-l-md outline-none bg-gray-50"
                disabled={true}
              />
              <button
                onClick={handleApplyCoupon}
                className={`bg-[#51bb1a] text-white px-4 border border-[#51bb1a] rounded-r-md hover:bg-[#48a718] transition ${
                  validatingCoupon
                    ? "opacity-70 cursor-not-allowed"
                    : "opacity-50 cursor-not-allowed"
                }`}
                disabled={true}
              >
                {validatingCoupon ? "Đang áp dụng..." : "Áp dụng"}
              </button>
            </div>

            {userSavedVouchers.length > 0 && (
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => setShowVouchersList(!showVouchersList)}
                  className="text-[#51bb1a] text-sm flex items-center hover:underline"
                >
                  <FontAwesomeIcon icon={faTicket} className="mr-1" />
                  {showVouchersList
                    ? "Ẩn voucher đã lưu"
                    : "Xem voucher đã lưu của bạn"}
                </button>

                {showVouchersList && (
                  <div className="mt-2 border border-gray-200 rounded-md max-h-56 overflow-y-auto">
                    {userSavedVouchers.length === 0 ? (
                      <p className="p-3 text-gray-500 text-center">
                        Bạn chưa lưu voucher nào
                      </p>
                    ) : (
                      userSavedVouchers.map((voucher) => (
                        <div
                          key={voucher._id}
                          className="p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium text-gray-700">
                              {voucher.couponId.type === "percentage"
                                ? `Giảm ${voucher.couponId.value}%`
                                : `Giảm ${formatCurrency(
                                    voucher.couponId.value
                                  )}`}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="bg-gray-100 px-2 py-1 rounded mr-2 font-mono">
                                {voucher.couponId.code}
                              </span>
                              <button
                                onClick={() =>
                                  handleCopyVoucherCode(voucher.couponId.code)
                                }
                                className="text-[#51bb1a] hover:text-[#48a718] flex items-center gap-1"
                                title="Sao chép mã"
                              >
                                <FontAwesomeIcon icon={faClipboard} />
                                <span className="text-xs">Sao chép</span>
                              </button>
                            </div>
                            {voucher.couponId.expiresAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                Hết hạn:{" "}
                                {new Date(
                                  voucher.couponId.expiresAt
                                ).toLocaleDateString("vi-VN")}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleApplySavedVoucher(voucher)}
                            className="bg-[#51bb1a] text-white px-3 py-1.5 rounded-md text-sm hover:bg-[#48a718] transition ml-2"
                          >
                            Áp dụng
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Hiển thị thông báo lỗi hoặc thành công */}
        {couponError && (
          <p className="text-red-500 mt-1 text-sm">{couponError}</p>
        )}
        {couponSuccess && (
          <p className="text-green-600 mt-1 text-sm">{couponSuccess}</p>
        )}
      </div>
    );
  };

  // Thêm useEffect để lấy danh sách chi nhánh khi component được tải
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesData = await branchesApi.getAllBranches();
        if (Array.isArray(branchesData)) {
          setBranches(branchesData);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách chi nhánh:", error);
      }
    };

    fetchBranches();
  }, []);

  // Thêm hàm xử lý khi người dùng chọn chi nhánh
  const handleBranchChange = (e) => {
    const selectedBranchId = e.target.value;

    if (selectedBranchId) {
      const branch = branches.find((b) => b._id === selectedBranchId);
      if (branch) {
        setSelectedBranch(branch);
        setAssignedBranch(branch);
      }
    } else {
      setSelectedBranch(null);
    }
  };

  // Add a function to explain shipping fee calculation
  const getShippingFeeExplanation = () => {
    const distance = assignedBranch?.distance || 0;
    const baseFee = 20000;
    let distanceText = "";
    
    if (distance > 5) {
      const extraDistance = distance - 5;
      const extraFee = Math.round(extraDistance * 5000);
      distanceText = `(Phí cơ bản: ${formatCurrency(baseFee)}đ + Phí khoảng cách: ${formatCurrency(extraFee)}đ cho ${extraDistance.toFixed(1)}km vượt quá 5km)`;
    } else {
      distanceText = `(Phí cơ bản trong phạm vi 5km)`;
    }
    
    return distanceText;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden grid md:grid-cols-[1fr_400px]">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-[#51bb1a]">
              DNC <span className="text-[#51bb1a]">FOOD</span>
            </h1>
            <button
              onClick={handleLogout}
              className="text-[#51bb1a] flex items-center gap-2 hover:text-[#51bb1a] transition"
            >
              <ExitIcon />
              Đăng xuất
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3 mb-4">
              <i className="pi pi-user text-[#51bb1a]"></i>
              Thông tin nhận hàng
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên
                </label>
                <input
                  type="text"
                  value={`${users?.firstName || ""} ${users?.lastName || ""}`}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={users?.phone || ""}
                  onChange={handlePhoneChange}
                  className="w-full p-2 border border-gray-300 rounded-md outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-2"></label>
              {users && users._id && (
                <AddressSelector
                  userId={users._id}
                  selectedAddressId={selectedAddressId}
                  onAddressSelect={handleAddressSelect}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                Ghi chú
              </label>
              <input
                type="text"
                placeholder="Ghi chú tùy chọn..."
                value={note}
                onChange={handleNoteChange}
                className="w-full p-2 border border-gray-300 rounded-md outline-none"
              />
            </div>
          </div>

          <div className="space-y-4 mt-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 mb-3">
                <FontAwesomeIcon icon={faCar} className="text-[#51bb1a]" />
                Vận chuyển
              </h3>
              <div className="border border-gray-300 rounded-md">
                <label className="flex items-center p-3 hover:bg-gray-50 transition cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={selectedMethod === "delivery"}
                    onChange={() => setSelectedMethod("delivery")}
                    className="mr-3 text-[#51bb1a] focus:ring-[#51bb1a]"
                  />
                  <div className="flex-grow">
                    <span>Giao hàng tiêu chuẩn</span>
                    <div className="text-xs text-gray-500 mt-1">
                      Khoảng cách: {assignedBranch?.distance ? `${assignedBranch.distance.toFixed(1)} km` : "Đang tính..."}
                    </div>
                  </div>
                  <span className="font-semibold text-[#51bb1a]">
                    {formatCurrency(shippingFee)}đ
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-2">
              {assignedBranch && (
                <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                  <div className="space-y-2">
                    <p className="font-medium text-gray-800">
                      {assignedBranch.name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <i className="pi pi-map-marker mr-2 text-[#51bb1a]"></i>
                      {assignedBranch.address}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <i className="pi pi-phone mr-2 text-[#51bb1a]"></i>
                      {assignedBranch.phone}
                    </p>
                    {assignedBranch.openingHours && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <i className="pi pi-clock mr-2 text-[#51bb1a]"></i>
                        Giờ mở cửa: {assignedBranch.openingHours}
                      </p>
                    )}
                    {assignedBranch.distance && (
                      <p className="text-sm text-gray-600">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                          Cách bạn khoảng {assignedBranch.distance.toFixed(1)}{" "}
                          km
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <span className="font-semibold text-gray-800">
              Đơn hàng ({orderDetails?.productCount} sản phẩm)
            </span>
            <span className="font-bold text-[#51bb1a]">
              {formatCurrency(orderDetails?.totalAmount)}
            </span>
          </div>

          <div className="space-y-3">
            {orderDetails?.products?.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    image={product?.productId?.productImages?.[0]}
                    size="large"
                    className="rounded-md"
                  />
                  <div>
                    <p className="font-medium text-gray-800">
                      {product?.productId?.productName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Số lượng: {product.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-[#51bb1a]">
                  {formatCurrency(product?.productId?.productPrice)}
                </span>
              </div>
            ))}
          </div>

          {/* Thay thế phần mã giảm giá cũ bằng hàm renderVoucherSection mới */}
          {renderVoucherSection()}

          <div className="space-y-2 border-t pt-3 flex flex-col gap-2">
            <div className="flex justify-between text-gray-700">
              <span>Tạm tính</span>
              <span>{formatCurrency(calculateSubtotal())}đ</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Phí vận chuyển</span>
              <div className="text-right">
                <div>{formatCurrency(shippingFee)}đ</div>
                <div className="text-xs text-gray-500 mt-1">
                  {getShippingFeeExplanation()}
                </div>
              </div>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá</span>
                <span>-{formatCurrency(couponDiscount)}đ</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-xl text-[#51bb1a] border-t pt-3">
              <span>Tổng cộng</span>
              <span>{formatCurrency(calculateFinalTotal())}đ</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 mb-3 mt-2">
                <FontAwesomeIcon
                  icon={faMoneyCheckDollar}
                  className="text-[#51bb1a]"
                />
                Thanh toán
              </h3>
              <div className="border border-gray-300 rounded-md">
                <div className="space-y-0">
                  <label className="flex items-center p-3 hover:bg-gray-50 transition cursor-pointer first:border-t-0">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={selectedPayment === "cod"}
                      onChange={() => handlePaymentMethodChange("cod")}
                      className="mr-3 text-[#51bb1a] focus:ring-[#51bb1a]"
                    />
                    <div className="flex items-center">
                      <span className="mr-2">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                    </div>
                  </label>
                  <label className="flex items-center p-3 hover:bg-gray-50 transition cursor-pointer border-t border-gray-200">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="sepay"
                      checked={selectedPayment === "sepay"}
                      onChange={() => handlePaymentMethodChange("sepay")}
                      className="mr-3 text-[#51bb1a] focus:ring-[#51bb1a]"
                    />
                    <div className="flex items-center">
                      <span className="mr-2">
                        Thanh toán qua MbBank
                      </span>
                      <img
                        src="https://imgs.search.brave.com/c32x_Ya9gIz9oeR2LflnKsJQrHPvswMor65hM7AmCf8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9ydXli/YW5ncGh1b25naG9h/bmcuY29tL3dwLWNv/bnRlbnQvdXBsb2Fk/cy8yMDI0LzEwL0xP/R09NQkJBTkstMTMy/OHg4MDAuanBn"
                        alt="SePay"
                        className="h-6 ml-2"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <button
                onClick={handlePlaceOrder}
                className="w-full cursor-pointer bg-[#51bb1a] text-white py-3 rounded-lg hover:opacity-90  transition"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đặt hàng"}
              </button>
              <button
                onClick={handleRemoveItem}
                className="w-full cursor-pointer border border-[#51bb1a] text-[#51bb1a] py-3 rounded-lg hover:opacity-90 transition"
              >
                Quay về giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
