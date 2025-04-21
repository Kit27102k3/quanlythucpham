import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../Redux/Slice/cartSlice';
import { toast } from 'sonner';

/**
 * Custom hook cung cấp các chức năng giỏ hàng và điều hướng
 * @returns {Object} Các hàm xử lý sự kiện và trạng thái loading
 */
const useCartAndNavigation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  /**
   * Thêm sản phẩm vào giỏ hàng
   * @param {Object} product - Thông tin sản phẩm cần thêm
   * @param {number} quantity - Số lượng sản phẩm (mặc định: 1)
   */
  const handleAddToCart = (product, quantity = 1) => {
    try {
      if (!product) return;

      // Kiểm tra số lượng sản phẩm
      if (product.productQuantity <= 0) {
        toast.error("Sản phẩm đã hết hàng!");
        return;
      }

      // Thêm vào giỏ hàng thông qua Redux
      dispatch(addToCart({
        id: product._id,
        name: product.productName,
        price: product.productPrice,
        discount: product.productDiscount || 0,
        image: product.productImages && product.productImages.length > 0 
          ? product.productImages[0] 
          : '/placeholder.png',
        quantity: quantity,
        maxQuantity: product.productQuantity,
      }));

      // Hiển thị thông báo thành công
      toast.success("Đã thêm sản phẩm vào giỏ hàng!");
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      toast.error("Có lỗi xảy ra khi thêm vào giỏ hàng!");
    }
  };

  /**
   * Mua ngay sản phẩm (thêm vào giỏ và chuyển đến trang thanh toán)
   * @param {Object} product - Thông tin sản phẩm cần mua
   * @param {number} quantity - Số lượng sản phẩm (mặc định: 1)
   */
  const handleBuyNow = async (product, quantity = 1) => {
    try {
      setLoading(true);

      // Kiểm tra số lượng sản phẩm
      if (product.productQuantity <= 0) {
        toast.error("Sản phẩm đã hết hàng!");
        setLoading(false);
        return;
      }

      // Thêm vào giỏ hàng thông qua Redux
      dispatch(addToCart({
        id: product._id,
        name: product.productName,
        price: product.productPrice,
        discount: product.productDiscount || 0,
        image: product.productImages && product.productImages.length > 0 
          ? product.productImages[0] 
          : '/placeholder.png',
        quantity: quantity,
        maxQuantity: product.productQuantity,
      }));

      // Chuyển hướng đến trang thanh toán
      navigate('/gio-hang');
    } catch (error) {
      console.error("Lỗi khi mua ngay:", error);
      toast.error("Có lỗi xảy ra khi xử lý đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Chuyển đến trang chi tiết sản phẩm
   * @param {string} slug - Slug của sản phẩm
   */
  const handleProductClick = (slug) => {
    if (!slug) return;
    navigate(`/chi-tiet-san-pham/${slug}`);
  };

  return { 
    handleAddToCart, 
    handleBuyNow, 
    handleProductClick, 
    loading 
  };
};

export default useCartAndNavigation; 