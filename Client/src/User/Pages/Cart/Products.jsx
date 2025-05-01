import React, { useState, useEffect, useCallback, useRef } from "react";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Scrollbars } from "react-custom-scrollbars-2";
import { MinusIcon, PlusIcon } from "@radix-ui/react-icons";
import cartApi from "../../../api/cartApi";
import formatCurrency from "../../Until/FotmatPrice";
import { useNavigate } from "react-router-dom";

function Products() {
  const [cart, setCart] = useState(null); 
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const scrollbarRef = useRef(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await cartApi.getCart(userId);
        setCart(res.cart); 
      } catch (error) {
        // console.log("Lỗi khi lấy giỏ hàng:", error);
      }
    };
    fetchCart();
  }, [userId]);

  const removeItem = useCallback(async (itemId, e) => {
    // Ngăn chặn hành vi mặc định và ngăn lan truyền sự kiện
    if (e) {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      
      // Nếu sự kiện có thể ngăn chặn mặc định, thực hiện ngăn chặn
      if (!e.defaultPrevented) {
        e.preventDefault();
      }
    }
    
    try {
      const productId = cart?.items.find(item => item._id === itemId)?.productId._id;
      if (!productId) return;
      
      await cartApi.removeFromCart(userId, productId);
      const res = await cartApi.getCart(userId);
      setCart(res.cart);
      
      // Kích hoạt sự kiện cập nhật giỏ hàng
      triggerCartUpdateEvent();
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
    }
  }, [cart, userId]);

  const triggerCartUpdateEvent = () => {
    window.dispatchEvent(new Event('cart-updated'));
  };

  const updateQuantity = useCallback(async (itemId, newQuantity, e) => {
    // Ngăn chặn hành vi mặc định và ngăn lan truyền sự kiện
    if (e) {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      
      // Nếu sự kiện có thể ngăn chặn mặc định, thực hiện ngăn chặn
      if (!e.defaultPrevented) {
        e.preventDefault();
      }
    }
    
    if (newQuantity < 1) return;
    try {
      if (!cart || !cart.items) return;
      
      const item = cart.items.find((item) => item._id === itemId);
      if (!item || !item.productId || !item.productId._id) return;
      
      await cartApi.updateCartItem(
        userId,
        item.productId._id,
        newQuantity
      );
      
      setCart((prevCart) => {
        if (!prevCart || !prevCart.items) return prevCart;
        
        return {
          ...prevCart,
          items: prevCart.items.map((item) =>
            item._id === itemId ? { ...item, quantity: newQuantity } : item
          )
        };
      });
      
      triggerCartUpdateEvent();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  }, [cart, userId]);

  const handleInputChange = useCallback((itemId, e) => {
    // Ngăn chặn lan truyền sự kiện
    e.stopPropagation();
    
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      updateQuantity(itemId, newValue);
    }
  }, [updateQuantity]);

  const handleButtonClick = useCallback((e, action) => {
    // Ngăn chặn hành vi mặc định và ngăn lan truyền sự kiện
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    if (action === 'checkout') {
      navigate('/thanh-toan');
    } else if (action === 'cart') {
      navigate('/gio-hang');
    }
  }, [navigate]);

  const total = cart?.items?.reduce(
    (sum, item) => sum + (item.price || item.productId.productPrice) * item.quantity,
    0
  ) || 0;

  return (
    <div className="bg-white p-2 rounded" onClick={(e) => e.stopPropagation()}>
      {cart?.items?.length > 0 ? (
        <div className="w-[350px]">
          <Scrollbars
            ref={scrollbarRef}
            style={{
              width: "100%",
              height: "130px",
            }}
            className="border-b"
            renderTrackHorizontal={props => <div {...props} className="hidden" />}
            renderThumbHorizontal={props => <div {...props} className="hidden" />}
          >
            {cart?.items?.map((item) => (
              <div key={item._id} className="flex justify-between mb-4">
                <img
                  src={`${item.productId.productImages[0]}`}
                  alt={item.productId.productName}
                  className="w-20 h-20 object-cover"
                />
                <div className="flex flex-col justify-items-start">
                  <p>{item.productId.productName.slice(0, 20)}...</p>
                  <p>{formatCurrency(item.price || item.productId.productPrice)}đ</p>
                  <div className="flex items-center">
                    <button 
                      type="button"
                      onClick={(e) =>
                        updateQuantity(
                          item._id,
                          item.quantity > 1 ? item.quantity - 1 : 1,
                          e
                        )
                      }
                      className="size-[25px] border p-2 text-black flex items-center justify-center"
                    >
                      <MinusIcon />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="text-black w-12 border border-l-0 border-r-0 outline-none text-center"
                      value={item.quantity}
                      onChange={(e) => handleInputChange(item._id, e)}
                    />
                    <button 
                      type="button"
                      onClick={(e) =>
                        updateQuantity(item._id, item.quantity + 1, e)
                      }
                      className="size-[25px] border p-2 text-black flex items-center justify-center"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="cursor-pointer self-start mt-2"
                  onClick={(e) => removeItem(item._id, e)}
                  aria-label="Xóa sản phẩm"
                >
                  <Cross1Icon />
                </button>
              </div>
            ))}
          </Scrollbars>
          <div className="mt-2">
            <div className="flex justify-between mb-4">
              <p>TỔNG CỘNG: </p>
              <p>{formatCurrency(total)}đ</p>
            </div>
            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={(e) => handleButtonClick(e, 'checkout')}
                className="bg-[#51bb1a] text-white uppercase text-sm p-3 w-full hover:opacity-80"
              >
                Thanh toán
              </button>
              <button
                type="button"
                onClick={(e) => handleButtonClick(e, 'cart')}
                className="bg-[#51bb1a] text-white uppercase text-sm p-3 w-full hover:opacity-80"
              >
                Giỏ hàng
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p>Không có sản phẩm trong giỏ hàng.</p>
      )}
    </div>
  );
}

export default Products;
