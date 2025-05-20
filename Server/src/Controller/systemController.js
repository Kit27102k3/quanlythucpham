import User from "../Model/Register.js";
import Order from "../Model/Order.js";
import Product from "../Model/Products.js";
import SystemActivity from "../Model/SystemActivity.js";

// Lấy dữ liệu thống kê hoạt động hệ thống
export const getSystemStats = async (req, res) => {
  try {
    // Lấy số lượng đăng nhập thành công từ DB (nếu có bảng SystemActivity)
    let loginCount = 0;
    let failedLoginCount = 0;
    let dataUpdateCount = 0;
    let errorCount = 0;

    try {
      // Kiểm tra xem có bảng SystemActivity không
      loginCount = await SystemActivity.countDocuments({ 
        type: 'login', 
        status: 'success' 
      });
      
      failedLoginCount = await SystemActivity.countDocuments({ 
        type: 'login', 
        status: 'failed' 
      });
      
      dataUpdateCount = await SystemActivity.countDocuments({ 
        type: 'data_update'
      });
      
      errorCount = await SystemActivity.countDocuments({ 
        type: 'error'
      });
    } catch (err) {
      console.log("Không tìm thấy bảng SystemActivity hoặc lỗi truy vấn:", err.message);
      // Không làm gì nếu bảng không tồn tại
    }

    // Lấy số người dùng đã đăng ký
    const userCount = await User.countDocuments({});

    // Lấy số lượng dữ liệu đã cập nhật (sản phẩm và đơn hàng)
    const productCount = await Product.countDocuments({});
    const orderCount = await Order.countDocuments({});

    // Trả về dữ liệu thực tế
    return res.status(200).json({
      success: true,
      data: {
        successLogin: loginCount,
        failedLogin: failedLoginCount,
        dataUpdates: dataUpdateCount,
        errorCount: errorCount,
        userCount: userCount,
        productCount: productCount,
        orderCount: orderCount
      }
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thống kê hệ thống",
      error: error.message
    });
  }
}; 