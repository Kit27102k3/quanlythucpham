/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, memo } from "react";
import {
  MinusIcon,
  PlusIcon,
  CheckIcon,
  TrashIcon,
  BackpackIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import cartApi from "../../../api/cartApi";
import formatCurrency from "../../Until/FotmatPrice";
import { toast } from "sonner";
import paymentApi from "../../../api/paymentApi";
import { useNavigate } from "react-router-dom";

// Custom event to notify components about cart updates
const triggerCartUpdateEvent = () => {
  window.dispatchEvent(new Event("cart-updated"));
};

// Function to create a slug from product name
const createSlug = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const Cart = () => {
  try {
    const [cart, setCart] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const userId = localStorage.getItem("userId");
    const navigate = useNavigate();

    const fetchCart = async () => {
      try {
        setIsLoading(true);
        const res = await cartApi.getCart(userId);
        
        // Lọc bỏ các sản phẩm đã bị xóa khỏi database (productId là null hoặc undefined)
        const validItems = res.cart.items.filter(item => item.productId && item.productId._id);
        
        if (validItems.length !== res.cart.items.length) {
          // Nếu có sản phẩm không hợp lệ, cập nhật giỏ hàng
          console.log('Phát hiện sản phẩm không tồn tại trong giỏ hàng, đang loại bỏ...');
          
          // Tìm các sản phẩm không hợp lệ để xóa khỏi giỏ hàng
          const invalidItems = res.cart.items.filter(item => !item.productId || !item.productId._id);
          
          // Xóa từng sản phẩm không hợp lệ khỏi giỏ hàng trên server
          try {
            for (const item of invalidItems) {
              if (item._id) {
                // Sử dụng item._id thay vì productId._id vì productId có thể là null
                await cartApi.removeInvalidItem(userId, item._id);
                console.log(`Đã xóa sản phẩm không hợp lệ khỏi giỏ hàng: ${item._id}`);
              }
            }
            toast.success("Đã cập nhật giỏ hàng của bạn", {
              description: "Một số sản phẩm đã bị xóa do không còn tồn tại",
            });
          } catch (removeError) {
            console.error("Lỗi khi xóa sản phẩm không hợp lệ:", removeError);
          }
          
          // Cập nhật giỏ hàng cục bộ
          res.cart.items = validItems;
        }
        
        setCart(res.cart);
        // Chỉ chọn những sản phẩm hợp lệ
        setSelectedItems(validItems.map(item => item.productId._id));
        setIsLoading(false);
      } catch (error) {
        console.error("Lỗi khi tải giỏ hàng!", error);
        setIsLoading(false);
        
        // Nếu lỗi liên quan đến việc sản phẩm không tồn tại
        if (error.message && error.message.includes("Cannot read properties of null")) {
          toast.error("Giỏ hàng có sản phẩm không hợp lệ", {
            description: "Đang thử cập nhật giỏ hàng...",
          });
          
          // Thử tải lại giỏ hàng sau 1 giây
          setTimeout(() => {
            // Gọi API để lấy giỏ hàng và tự động loại bỏ sản phẩm không hợp lệ
            try {
              cartApi.getCart(userId, true); // Thêm tham số để yêu cầu server loại bỏ sản phẩm không hợp lệ
            } catch (retryError) {
              console.error("Không thể cập nhật giỏ hàng:", retryError);
            }
          }, 1000);
        }
      }
    };

    useEffect(() => {
      if (userId) {
        fetchCart();
      }
    }, [userId]);

    const handleUpdateQuantity = async (productId, newQuantity, item) => {
      if (newQuantity < 1) return;

      try {
        // Optimistic update
        setCart((prevCart) => ({
          ...prevCart,
          items: prevCart.items.map((cartItem) =>
            cartItem.productId._id === productId
              ? { ...cartItem, quantity: newQuantity }
              : cartItem
          ),
        }));

        // Tạo options với thông tin đơn vị đo nếu có
        const options = {
          quantity: newQuantity
        };
        
        // Nếu có thông tin item được truyền vào, thêm các thông tin về đơn vị đo
        if (item) {
          if (item.unit) options.unit = item.unit;
          if (item.unitPrice) options.unitPrice = item.unitPrice;
          if (item.conversionRate) options.conversionRate = item.conversionRate;
        }

        await cartApi.updateCartItem(userId, productId, options);

        // Kích hoạt sự kiện cập nhật giỏ hàng
        triggerCartUpdateEvent();
      } catch (error) {
        console.error("Lỗi khi cập nhật số lượng sản phẩm:", error);
        toast.error("Không thể cập nhật số lượng. Vui lòng thử lại!");
        // Rollback by refetching cart
        fetchCart();
      }
    };

    const handleRemoveItem = async (productId, event) => {
      if (event) {
        event.stopPropagation();
      }

      try {
        // Optimistic update
        setCart((prevCart) => ({
          ...prevCart,
          items: prevCart.items.filter(
            (item) => item.productId._id !== productId
          ),
        }));

        await cartApi.removeFromCart(userId, productId);
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng!");

        // Kích hoạt sự kiện cập nhật giỏ hàng
        triggerCartUpdateEvent();
      } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        toast.error("Không thể xóa sản phẩm. Vui lòng thử lại!");
        // Rollback by refetching cart
        fetchCart();
      }
    };

    const handleSelectItem = (productId) => {
      setSelectedItems((prev) => {
        if (prev.includes(productId)) {
          return prev.filter((id) => id !== productId);
        } else {
          return [...prev, productId];
        }
      });
    };

    const handleSelectAll = () => {
      if (!cart || !cart.items) return;

      if (selectedItems.length === cart.items.length) {
        setSelectedItems([]);
      } else {
        setSelectedItems(cart.items.map((item) => item.productId._id));
      }
    };

    // Thêm hàm hỗ trợ kiểm tra sản phẩm hợp lệ để tránh lỗi khi tính toán
    const isValidProduct = (item) => {
      return item && item.productId && item.productId._id;
    };

    const calculateTotal = () => {
      if (!cart || !cart.items) return 0;
      return cart.items.reduce((total, item) => {
        // Chỉ tính tổng cho sản phẩm hợp lệ và được chọn
        if (isValidProduct(item) && selectedItems.includes(item.productId._id)) {
          const itemPrice = item.price || item.productId.productPrice;
          return total + itemPrice * item.quantity;
        }
        return total;
      }, 0);
    };

    const calculateTotalQuantity = () => {
      if (!cart || !cart.items) return 0;
      // Đếm số sản phẩm hợp lệ và được chọn
      return selectedItems.filter(id => 
        cart.items.some(item => isValidProduct(item) && item.productId._id === id)
      ).length;
    };

    const handleCheckout = async () => {
      if (selectedItems.length === 0) {
        toast.warning("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
        return;
      }

      setIsSubmitting(true);

      try {
        // Prepare products data from selected items
        const selectedProducts = cart.items
          .filter((item) => selectedItems.includes(item.productId._id))
          .map((item) => ({
            productId: item.productId._id,
            quantity: item.quantity,
            price: item.price || item.productId.productPrice,
          }));

        const paymentData = {
          userId,
          amount: calculateTotal(),
          products: selectedProducts,
          paymentMethod: "cod", // Default to COD, can be changed later in payment page
        };

        const res = await paymentApi.createPayment(paymentData);
        const paymentId = res.data?._id;
        if (paymentId) {
          navigate(`/thanh-toan/${paymentId}`);
        } else {
          toast.error("Không nhận được ID thanh toán");
        }
      } catch (error) {
        console.error("Lỗi thanh toán:", error);
        toast.error("Không thể tạo thanh toán. Vui lòng thử lại!");
      } finally {
        setIsSubmitting(false);
      }
    };

    // Custom Checkbox Component
    const CustomCheckbox = ({ checked, onChange, size = "normal" }) => {
      const sizeClasses = size === "large" ? "w-6 h-6" : "w-5 h-5";

      return (
        <div
          className={`${sizeClasses} border rounded flex items-center justify-center cursor-pointer transition-all duration-200`}
          style={{
            backgroundColor: checked ? "#51bb1a" : "white",
            borderColor: checked ? "#51bb1a" : "#ccc",
            transform: checked ? "scale(1.05)" : "scale(1)",
          }}
          onClick={onChange}
        >
          {checked && <CheckIcon color="white" />}
        </div>
      );
    };

    const goToShop = () => {
      navigate("/san-pham");
    };

    return (
      <div className="bg-gray-50 min-h-screen pb-10">
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-4 lg:px-[120px] py-3 flex items-center gap-2 text-sm text-gray-600">
            <a
              href="/"
              className="hover:text-[#51bb1a] cursor-pointer lg:text-[16px]"
            >
              Trang chủ
            </a>
            <span className="text-gray-400">/</span>
            <span className="font-medium text-gray-800 lg:text-[16px]">
              Giỏ hàng
            </span>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-[120px] mt-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BackpackIcon className="w-6 h-6 text-[#51bb1a]" />
            Giỏ hàng của bạn
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({cart?.items?.length || 0} sản phẩm)
            </span>
          </h1>

          {isLoading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-t-2 border-b-2 border-[#51bb1a] rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Đang tải giỏ hàng...</p>
              </div>
            </div>
          ) : cart && cart.items && cart.items.length > 0 ? (
            <div className="lg:grid lg:grid-cols-[65%_33%] gap-6">
              {/* Products List */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6 lg:mb-0">
                {/* Header */}
                <div className="hidden md:flex items-center border-b border-gray-200 pb-4 mb-4 text-sm font-medium text-gray-600">
                  <div className="w-12 text-center">
                    <CustomCheckbox
                      checked={selectedItems.length === cart.items.length}
                      onChange={handleSelectAll}
                      size="large"
                    />
                  </div>
                  <div className="flex-1 ml-4">
                    Tất cả ({cart.items.length} sản phẩm)
                  </div>
                  <div className="w-32 text-center">Đơn giá</div>
                  <div className="w-32 text-center">Số lượng</div>
                  <div className="w-32 text-center">Thành tiền</div>
                  <div className="w-12 text-center"></div>
                </div>

                {/* Product Items */}
                {cart.items.filter(item => item.productId && item.productId._id).map((item) => {
                  const itemPrice = item.price || (item.productId ? item.productId.productPrice : 0);
                  const totalItemPrice = itemPrice * item.quantity;

                  return (
                    <div
                      key={item.productId._id}
                      className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_auto_1fr_auto_auto_auto] items-center gap-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                    >
                      {/* Checkbox */}
                      <div className="flex justify-center md:w-12">
                        <CustomCheckbox
                          checked={selectedItems.includes(item.productId._id)}
                          onChange={() => handleSelectItem(item.productId._id)}
                        />
                      </div>

                      {/* Image */}
                      <div className="md:w-20">
                        {item?.productId?.productImages?.length > 0 ? (
                          <img
                            src={`${item.productId.productImages[0]}`}
                            alt={item.productId.productName}
                            className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md shadow-sm"
                          />
                        ) : (
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-md flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Không có ảnh</span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="col-span-2 md:col-span-1 flex flex-col">
                        <a
                          href={`/chi-tiet-san-pham/${createSlug(
                            item?.productId?.productName
                          )}`}
                          className="font-medium text-gray-800 hover:text-[#51bb1a] transition-colors line-clamp-2"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(
                              `/chi-tiet-san-pham/${createSlug(
                                item?.productId?.productName
                              )}`
                            );
                          }}
                        >
                          {item?.productId?.productName}
                        </a>
                        
                        {/* Hiển thị đơn vị đo */}
                        {item?.unit && (
                          <div className="text-xs text-gray-500 mt-1">
                            Đơn vị: {item.unit}
                            {item.conversionRate && item.conversionRate > 1 && 
                              ` (1 ${item.unit} = ${item.conversionRate} ${item.productId?.unit || 'đơn vị'})`
                            }
                          </div>
                        )}
                        
                        <div className="md:hidden mt-1 flex justify-between text-sm">
                          <span className="text-[#51bb1a] font-medium">
                            {formatCurrency(itemPrice)}đ
                          </span>
                          <span>x{item.quantity}</span>
                        </div>
                      </div>

                      {/* Unit Price - Hidden on mobile */}
                      <div className="hidden md:block w-32 text-center">
                        <span className="text-[#51bb1a] font-medium">
                          {formatCurrency(itemPrice)}đ
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex justify-center w-full md:w-32">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button
                            onClick={(e) =>
                              handleUpdateQuantity(
                                item.productId._id,
                                Math.max(1, item.quantity - 1),
                                item
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#51bb1a] transition-colors"
                            aria-label="Giảm số lượng"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <input
                            type="text"
                            className="w-10 h-8 text-center border-x border-gray-300 focus:outline-none"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                handleUpdateQuantity(item.productId._id, val, item);
                              }
                            }}
                            min="1"
                          />
                          <button
                            onClick={(e) =>
                              handleUpdateQuantity(
                                item.productId._id,
                                item.quantity + 1,
                                item
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#51bb1a] transition-colors"
                            aria-label="Tăng số lượng"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Total Price - Hidden on mobile */}
                      <div className="hidden md:block w-32 text-center font-medium text-[#51bb1a]">
                        {formatCurrency(totalItemPrice)}đ
                      </div>

                      {/* Remove Button */}
                      <div className="md:w-12 flex justify-center">
                        <button
                          onClick={(e) =>
                            handleRemoveItem(item.productId._id, e)
                          }
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          aria-label="Xóa sản phẩm"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Recommended products section could go here */}
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-sm p-4 h-fit sticky top-4">
                <h2 className="font-semibold text-lg border-b border-gray-200 pb-3 mb-4">
                  Tóm tắt đơn hàng
                </h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Tổng sản phẩm</span>
                    <span>{calculateTotalQuantity()}</span>
                  </div>
                  {/* Additional discounts could go here */}
                </div>

                <div className="flex justify-between items-center py-3 border-t border-b border-gray-200 font-bold text-lg">
                  <span>Tổng tiền</span>
                  <span className="text-[#51bb1a]">
                    {formatCurrency(calculateTotal())}đ
                  </span>
                </div>

                {selectedItems.length === 0 && (
                  <div className="mt-4 flex items-center text-amber-600 bg-amber-50 p-3 rounded-md text-sm">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>
                      Vui lòng chọn ít nhất một sản phẩm để thanh toán
                    </span>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0 || isSubmitting}
                  className={`w-full py-3 rounded-md mt-4 text-white font-medium transition-colors ${
                    selectedItems.length === 0 || isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#51bb1a] hover:bg-[#48a718]"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      Đang xử lý...
                    </span>
                  ) : (
                    "Thanh toán"
                  )}
                </button>

                <button
                  onClick={goToShop}
                  className="w-full py-3 rounded-md mt-3 border border-[#51bb1a] text-[#51bb1a] font-medium hover:bg-[#f0f9ed] transition-colors"
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 flex flex-col items-center">
              <BackpackIcon className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-800 mb-2">
                Giỏ hàng của bạn đang trống
              </h2>
              <p className="text-gray-500 mb-6">
                Hãy thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm
              </p>
              <button
                onClick={goToShop}
                className="px-6 py-3 bg-[#51bb1a] text-white rounded-md hover:bg-[#48a718] transition-colors"
              >
                Khám phá sản phẩm
              </button>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering Cart component:", error);
    return (
      <div className="p-4 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Đã xảy ra lỗi khi tải giỏ hàng. Vui lòng thử lại sau.
        </div>
      </div>
    );
  }
};

export default memo(Cart);
