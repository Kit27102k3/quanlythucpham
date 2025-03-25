import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import cartApi from "../../api/cartApi";

const useCartAndNavigation = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const handleAddToCart = async (productId) => {
    if (!userId) {
      toast.warning("Bạn cần phải đăng nhập trước!");
      navigate("/dang-nhap");
      return;
    }
    try {
      await cartApi.addToCart(userId, productId);
      toast.success("Sản phẩm đã được thêm vào giỏ hàng");
    } catch (error) {
      console.log("Lỗi khi thêm sản phẩm vào giỏ hàng!", error);
    }
  };

  const handleClick = (id) => {
    navigate(`/chi-tiet-san-pham/${id}`);
  };

  const handleRemoveItem = async (productId) => {
    setIsLoading(true);
    try {
      const response = await cartApi.removeFromCart(userId, productId);
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

  return { handleAddToCart, handleClick, handleRemoveItem };
};

export default useCartAndNavigation;
