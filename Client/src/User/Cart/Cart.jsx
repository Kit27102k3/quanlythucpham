/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, memo } from "react";
import { MinusIcon, PlusIcon, CheckIcon } from "@radix-ui/react-icons";
import cartApi from "../../api/cartApi";
import formatCurrency from "../Until/FotmatPrice";
import { toast } from "sonner";
import paymentApi from "../../api/paymentApi";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  try {
    const [cart, setCart] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const userId = localStorage.getItem("userId");
    const navigate = useNavigate();

    const fetchCart = async () => {
      try {
        const res = await cartApi.getCart(userId);
        setCart(res.cart);
        setSelectedItems(res.cart.items.map((item) => item.productId._id));
      } catch (error) {
        console.error("Lỗi khi tải giỏ hàng!", error);
      }
    };

    useEffect(() => {
      if (userId) {
        fetchCart();
      }
    }, [userId]);

    const handleUpdateQuantity = async (productId, newQuantity) => {
      if (newQuantity < 1) return;
      setIsLoading(true);
      try {
        await cartApi.updateCartItem(
          userId,
          productId,
          newQuantity
        );
        setCart((prevCart) => ({
          ...prevCart,
          items: prevCart.items.map((item) =>
            item.productId._id === productId
              ? { ...item, quantity: newQuantity }
              : item
          ),
        }));
      } catch (error) {
        console.error("Lỗi khi cập nhật số lượng sản phẩm:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleRemoveItem = async (productId) => {
      setIsLoading(true);
      try {
        await cartApi.removeFromCart(userId, productId);
        setCart((prevCart) => ({
          ...prevCart,
          items: prevCart.items.filter(
            (item) => item.productId._id !== productId
          ),
        }));
        toast.success("Xóa sản phẩm ra khỏi giỏ hàng thành công!");
      } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
      } finally {
        setIsLoading(false);
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

    const calculateTotal = () => {
      if (!cart || !cart.items) return 0;
      return cart.items.reduce((total, item) => {
        if (selectedItems.includes(item.productId._id)) {
          const itemPrice = item.price || item.productId.productPrice;
          return total + itemPrice * item.quantity;
        }
        return total;
      }, 0);
    };

    const handleCheckout = async () => {
      if (selectedItems.length === 0) {
        toast.warning("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
        return;
      }
      setIsLoading(true);
      try {
        // Prepare products data from selected items
        const selectedProducts = cart.items
          .filter(item => selectedItems.includes(item.productId._id))
          .map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            price: item.price || item.productId.productPrice
          }));

        const paymentData = {
          userId,
          amount: calculateTotal(),
          products: selectedProducts,
          paymentMethod: "cod" // Default to COD, can be changed later in payment page
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
        setIsLoading(false);
      }
    };

    // Custom Checkbox Component
    const CustomCheckbox = ({ checked, onChange }) => {
      return (
        <div 
          className="w-5 h-5 border rounded flex items-center justify-center cursor-pointer"
          style={{ 
            backgroundColor: checked ? '#51bb1a' : 'white',
            borderColor: checked ? '#51bb1a' : '#ccc' 
          }}
          onClick={onChange}
        >
          {checked && <CheckIcon color="white" />}
        </div>
      );
    };

    return (
      <div className=" mb-5">
        <div className="lg:px-[120px] flex gap-2 text-sm text-[#333333] p-3">
          <a
            href="/"
            className="hover:text-[#51bb1a] cursor-pointer lg:text-[16px]"
          >
            Trang chủ
          </a>{" "}
          {" >"}
          <p className="font-medium lg:text-[16px]">Giỏ hàng</p>
        </div>
        <div className="border-b border-gray-300"></div>
        <h1 className="lg:px-[120px] text-[26px] uppercase font-medium hide-on-mobile p-2 mt-4">
          Giỏ hàng{" "}
          <span className="text-sm font-normal">
            ({cart?.items?.length || 0} sản phẩm)
          </span>
        </h1>
        <div className="lg:grid lg:px-[120px] lg:grid-cols-[75%_25%]">
          <div className="p-2 mt-5">
            <h1 className="text-[16px] uppercase text-[#1c1c1c] font-medium hide-on-pc">
              Giỏ hàng của bạn
            </h1>
            {isLoading ? (
              <p>Đang tải giỏ hàng...</p>
            ) : cart && cart.items && cart.items.length > 0 ? (
              cart.items.map((item) => (
                <div
                  key={item.productId._id}
                  className="grid grid-cols-[25%_45%_25%] mt-5 lg:grid lg:grid-cols-[2%_20%_53%_25%] place-items-center items-center"
                >
                  <CustomCheckbox 
                    checked={selectedItems.includes(item.productId._id)}
                    onChange={() => handleSelectItem(item.productId._id)}
                  />
                  {item?.productId?.productImages?.length > 0 && (
                    <img
                      src={`${item.productId.productImages[0]}`}
                      alt={item.productId.productName}
                      className="w-20 h-20 lg:w-[170px] lg:h-[170px] object-cover"
                    />
                  )}
                  <div className="text-[12px] lg:text-[16px] ">
                    <p className="font-medium">{item?.productId?.productName}</p>
                    <p className="text-gray-500">
                      Giá:{" "}
                      <span className="text-[#51bb1a]">
                        {formatCurrency(item.price || item?.productId?.productPrice)}đ
                      </span>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 place-items-center">
                    <div className="flex items-center cursor-pointer">
                      <MinusIcon
                        onClick={() =>
                          handleUpdateQuantity(
                            item.productId._id,
                            item.quantity - 1
                          )
                        }
                        className="size-[25.5px] border p-2 text-black lg:size-[28px]"
                      />
                      <input
                        type="text"
                        className="text-black w-10 border border-l-0 border-r-0 outline-none text-center lg:py-[1.2px]"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateQuantity(
                            item.productId._id,
                            Number(e.target.value) || 1
                          )
                        }
                      />
                      <PlusIcon
                        onClick={() =>
                          handleUpdateQuantity(
                            item.productId._id,
                            item.quantity + 1
                          )
                        }
                        className="size-[25.5px] border p-2 text-black cursor-pointer lg:size-[28px]"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.productId._id)}
                      className="text-[12px] lg:mt-4 mt-2 cursor-pointer hover:text-[#51bb1a]"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>Giỏ hàng của bạn đang trống.</p>
            )}
          </div>
          <div className="border-b border-gray-300 hide-on-pc"></div>
          <div className="p-2">
            <div className="lg:flex lg:items-center lg:justify-between hide-on-mobile font-medium">
              <p>Tạm tính</p>
              <p>{formatCurrency(calculateTotal())}đ</p>
            </div>
            <div className="border-gray-200 border mt-4 mb-4 hide-on-mobile"></div>
            <div className="flex justify-between items-center">
              <p>Tổng tiền:</p>
              <p className="lg:text-[26px] lg:text-[#51bb1a] lg:font-medium">
                {formatCurrency(calculateTotal())}đ
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <button
                onClick={handleCheckout}
                className="w-full text-white uppercase text-center bg-[#51bb1a] text-sm p-3 cursor-pointer hover-animation-button"
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý..." : "Thanh toán ngay"}
              </button>
              <button 
                className="w-full uppercase border text-sm p-3 cursor-pointer lg:font-medium hover:bg-[#51bb1a] hover:text-white"
                onClick={() => navigate("/")}
              >
                Tiếp tục mua hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in Cart component:", error);
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi: Không thể tải trang giỏ hàng</h2>
          <p className="mb-4">Đã xảy ra lỗi khi tải component giỏ hàng.</p>
          <p className="text-sm text-gray-600">Chi tiết lỗi: {error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }
};

export default memo(Cart);
