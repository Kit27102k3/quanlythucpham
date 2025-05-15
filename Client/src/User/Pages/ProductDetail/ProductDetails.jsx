// Hàm mở chat với sản phẩm hiện tại
const handleChatProduct = () => {
  try {
    // Lưu thông tin sản phẩm vào localStorage
    const productInfo = {
      id: product?._id || "",
      name: product?.name || "Sản phẩm",
      price: product?.price || 0,
      image: product?.image || "",
      url: window.location.href
    };
    
    localStorage.setItem('chatProduct', JSON.stringify(productInfo));
    
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
      
      // Thông báo cho người dùng
      toast.success("Bạn đang trao đổi với Người bán về sản phẩm này");
    }
  } catch (error) {
    console.error("Lỗi khi chuẩn bị chat với sản phẩm:", error);
    toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
  }
}; 