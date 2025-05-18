import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import paymentApi from '../../../api/paymentApi';
import {authApi} from '../../../api/authApi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Checkout = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const processCheckout = async () => {
      try {
        // Lấy thông tin người dùng đã đăng nhập
        let user;
        try {
          const userResponse = await authApi.getProfile();
          user = userResponse.data;
          console.log("User data:", user);
          
          if (!user || !user._id) {
            toast.error('Vui lòng đăng nhập để tiếp tục thanh toán');
            navigate('/dang-nhap');
            return;
          }
        } catch (authError) {
          console.error('Lỗi khi lấy thông tin người dùng:', authError);
          toast.error('Vui lòng đăng nhập để tiếp tục thanh toán');
          navigate('/dang-nhap');
          return;
        }

        // Lấy thông tin sản phẩm từ localStorage
        const checkoutItemsString = localStorage.getItem('checkoutItems');
        
        if (!checkoutItemsString) {
          toast.error('Không tìm thấy thông tin sản phẩm để thanh toán');
          navigate('/');
          return;
        }
        
        const checkoutItems = JSON.parse(checkoutItemsString);
        console.log("Checkout items:", checkoutItems);
        
        // Tính tổng tiền
        const totalAmount = checkoutItems.reduce(
          (sum, item) => sum + (item.price * item.quantity), 
          0
        );
        
        // Kiểm tra dữ liệu sản phẩm
        const validProducts = checkoutItems.every(item => 
          item.product && 
          item.product._id && 
          item.quantity && 
          item.price
        );
        
        if (!validProducts) {
          console.error("Dữ liệu sản phẩm không hợp lệ:", checkoutItems);
          toast.error('Dữ liệu sản phẩm không đầy đủ');
          navigate('/');
          return;
        }
        
        // Tạo đối tượng payment với userId - sử dụng amount thay vì totalAmount
        const paymentData = {
          userId: user._id,
          products: checkoutItems.map(item => ({
            productId: item.product._id,
            quantity: item.quantity,
            price: item.price
          })),
          paymentMethod: 'cod', // Mặc định là COD, người dùng có thể thay đổi sau
          amount: totalAmount // Sử dụng đúng tên trường theo yêu cầu của API
        };
        
        console.log("Payment data being sent:", paymentData);
        
        // Gọi API để tạo payment
        const response = await paymentApi.createPayment(paymentData);
        console.log("Payment creation response:", response);
        
        // Xóa thông tin checkout tạm thời
        localStorage.removeItem('checkoutItems');
        
        // Chuyển hướng đến trang thanh toán
        const paymentId = response.data?._id || response?._id;
        if (!paymentId) {
          toast.error('Không nhận được ID thanh toán từ server');
          navigate('/');
          return;
        }
        
        navigate(`/thanh-toan/${paymentId}`);
      } catch (error) {
        console.error('Lỗi khi xử lý thanh toán:', error);
        
        // Hiển thị lỗi chi tiết hơn
        if (error.response) {
          console.error('Error response data:', error.response.data);
          toast.error(`Lỗi: ${error.response.data?.message || 'Không xác định'}`);
        } else {
          toast.error('Có lỗi xảy ra khi xử lý thanh toán');
        }
        
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    processCheckout();
  }, [navigate]);

  return (
    <div className="checkout-processing">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-center mb-4">Đang xử lý đơn hàng</h2>
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-600">Vui lòng đợi trong giây lát...</p>
            </div>
          ) : (
            <p className="text-gray-600 text-center">Đang chuyển hướng...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout; 