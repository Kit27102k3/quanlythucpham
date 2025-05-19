import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import cartApi from "../../api/cartApi";

// Custom event to notify components about cart updates
const triggerCartUpdateEvent = () => {
  window.dispatchEvent(new Event('cart-updated'));
};

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

  // Hàm xử lý giá dựa trên có giảm giá hay không
  const getPrice = (product) => {
    if (!product) return 0;
    return product.productDiscount > 0 ? product.productPromoPrice : product.productPrice;
  };

  const handleAddToCart = async (productId) => {
    if (!userId) {
      toast.warning("Bạn cần phải đăng nhập trước!");
      navigate("/dang-nhap");
      return;
    }
    
    try {
      // Kiểm tra và log thông tin sản phẩm để debug
      console.log("Đang thêm sản phẩm vào giỏ hàng:", productId);
      
      if (!productId) {
        console.error("Product ID is undefined or null");
        toast.error("Không thể thêm sản phẩm vào giỏ hàng: ID sản phẩm không hợp lệ");
        return;
      }
      
      // Chuyển đổi sang string nếu là object ID
      const actualProductId = typeof productId === 'object' ? productId.toString() : productId;
      
      // Gọi API với xử lý lỗi tốt hơn
      const response = await cartApi.addToCart(userId, actualProductId);
      
      // Log thông tin phản hồi
      console.log("Phản hồi API:", response);
      
      if (response && response.success) {
        toast.success("Sản phẩm đã được thêm vào giỏ hàng");
        
        // Kích hoạt sự kiện cập nhật giỏ hàng
        triggerCartUpdateEvent();
      } else {
        // Xử lý trường hợp API trả về success: false
        toast.error(response?.message || "Không thể thêm sản phẩm vào giỏ hàng");
      }
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
      
      // Hiển thị thông báo lỗi cụ thể hơn cho người dùng
      const errorMessage = error.response?.data?.message || 
                          "Không thể thêm sản phẩm vào giỏ hàng, vui lòng thử lại sau";
      toast.error(errorMessage);
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
      
      // Kích hoạt sự kiện cập nhật giỏ hàng
      triggerCartUpdateEvent();
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleAddToCart, handleClick, handleRemoveItem, getPrice };
};

export default useCartAndNavigation;
