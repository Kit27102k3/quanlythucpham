import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import cartApi from "../../api/cartApi";

const useCartAndNavigation = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const createSlug = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

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

  const handleClick = (product) => {
    if (typeof product === 'string') {
      navigate(`/chi-tiet-san-pham/${product}`);
      return;
    }
    if (!product || !product.productName) {
      console.error("Invalid product data:", product);
      return;
    }
    const slug = createSlug(product.productName);
    navigate(`/chi-tiet-san-pham/${slug}`);
  };

  const handleRemoveItem = async (productId, setCart, setIsLoading) => {
    if (!setIsLoading || !setCart) {
      console.error("Missing required state setters");
      return;
    }

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

  return { handleAddToCart, handleClick, handleRemoveItem };
};

export default useCartAndNavigation;
