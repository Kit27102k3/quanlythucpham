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

  return { handleAddToCart, handleClick };
};

export default useCartAndNavigation;
