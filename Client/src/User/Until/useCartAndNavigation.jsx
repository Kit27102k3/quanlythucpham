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

  const handleAddToCart = async (productId, options = {}) => {
    try {
      // Kiểm tra user từ nhiều nguồn có thể
      let user;
      let userId;
      
      try {
        user = JSON.parse(localStorage.getItem("user"));
        userId = user?._id;
      } catch (e) {
        console.error("Lỗi khi parse user từ localStorage:", e);
      }
      
      // Nếu không tìm thấy user._id, thử lấy userId trực tiếp từ localStorage
      if (!userId) {
        userId = localStorage.getItem("userId");
      }
      
      // Kiểm tra nếu vẫn không có userId
      if (!userId) {
        console.error("Không tìm thấy userId");
        toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
        navigate("/login");
        return;
      }
      
      if (!productId) {
        toast.error("Không thể thêm sản phẩm này vào giỏ hàng");
        return;
      }
      
      const actualProductId = productId._id || productId;
      
      // Lấy các tùy chọn nếu được cung cấp
      const { 
        quantity = 1, 
        unit, 
        unitPrice, 
        conversionRate 
      } = options;
      
      console.log("Đang gửi request với userId:", userId);
      
      const response = await cartApi.addToCart({
        userId, 
        productId: actualProductId, 
        quantity,
        unit,
        unitPrice,
        conversionRate
      });
      
      if (response.success) {
        toast.success("Đã thêm sản phẩm vào giỏ hàng");
        // Kích hoạt sự kiện cập nhật giỏ hàng
        const event = new CustomEvent("cartUpdated");
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
      toast.error("Có lỗi xảy ra khi thêm vào giỏ hàng");
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
