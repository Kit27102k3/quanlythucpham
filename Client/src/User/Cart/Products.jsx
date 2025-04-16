import React, { useState, useEffect } from "react";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Scrollbars } from "react-custom-scrollbars-2";
import { MinusIcon, PlusIcon } from "@radix-ui/react-icons";
import cartApi from "../../api/cartApi";
import formatCurrency from "../Until/FotmatPrice";

function Products() {
  const [cart, setCart] = useState(null); 
  const userId = localStorage.getItem("userId");

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

  const removeItem = async (itemId) => {
    try {
      await cartApi.removeFromCart(userId, itemId);
      const res = await cartApi.getCart(userId);
      setCart(res.cart);
    } catch (error) {
      // console.log("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      await cartApi.updateCartItem(userId, itemId, { quantity: newQuantity });
      const res = await cartApi.getCart(userId);
      setCart(res.cart);
    } catch (error) {
      // console.log("Lỗi khi cập nhật số lượng sản phẩm:", error);
    }
  };

  const total = cart?.items?.reduce(
    (sum, item) => sum + (item.price || item.productId.productPrice) * item.quantity,
    0
  );

  return (
    <div className="bg-white p-2 rounded">
      {cart?.items.length > 0 ? (
        <div className="w-[350px]">
          <Scrollbars
            style={{
              width: "100%",
              height: "130px",
            }}
            className="border-b"
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
                  <div className="flex items-center cursor-pointer">
                    <MinusIcon
                      onClick={() =>
                        updateQuantity(
                          item._id,
                          item.quantity > 1 ? item.quantity - 1 : 1
                        )
                      }
                      className="size-[25px] border p-2 text-black"
                    />
                    <input
                      type="text"
                      className="text-black w-12 border border-l-0 border-r-0 outline-none text-center"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item._id, Number(e.target.value) || 1)
                      }
                    />
                    <PlusIcon
                      onClick={() =>
                        updateQuantity(item._id, item.quantity + 1)
                      }
                      className="size-[25px] border p-2 text-black cursor-pointer"
                    />
                  </div>
                </div>
                <Cross1Icon
                  className="cursor-pointer"
                  onClick={() => removeItem(item._id)}
                />
              </div>
            ))}
          </Scrollbars>
          <div className="mt-2">
            <div className="flex justify-between mb-4">
              <p>TỔNG CỘNG: </p>
              <p>{formatCurrency(total)}đ</p>
            </div>
            <div className="flex justify-between gap-2">
              <button className="bg-[#51bb1a] text-white uppercase text-sm p-3 w-full cursor-pointer hover:opacity-80">
                Thanh toán
              </button>
              <button className="bg-[#51bb1a] text-white uppercase text-sm p-3 w-full cursor-pointer hover:opacity-80">
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
