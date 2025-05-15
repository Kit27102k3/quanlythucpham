import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  // Xử lý khi bấm nút chat với người bán
  const handleChatWithSeller = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Lấy thông tin sản phẩm
      const productInfo = {
        id: product._id || "",
        name: product.name || "Sản phẩm",
        price: product.price || 0,
        image: product.image || "",
        url: `${window.location.origin}/chi-tiet-san-pham/${product.slug}`
      };
      
      // Lưu thông tin sản phẩm vào localStorage
      localStorage.setItem('chatProduct', JSON.stringify(productInfo));
      
      // Thông báo cho người dùng
      toast.success("Đã thêm thông tin sản phẩm vào chat");
      
      // Chuyển hướng đến trang tin nhắn nếu đang ở chế độ mobile
      if (window.innerWidth < 768) {
        navigate("/tai-khoan/tin-nhan");
      } else {
        // Nếu đang ở desktop, mở floating chat
        // Tìm kiếm và kích hoạt nút chat
        const chatButton = document.querySelector('.pi-comments');
        if (chatButton) {
          const chatButtonParent = chatButton.closest('button');
          if (chatButtonParent) {
            chatButtonParent.click();
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi chuẩn bị chat về sản phẩm:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="product-card">
      {/* Render your product card content here */}
    </div>
  );
};

export default ProductCard; 