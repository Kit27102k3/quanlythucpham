// Sample data functions for reports

// Dữ liệu mẫu cho Dashboard
export const getSampleDashboardData = () => {
  return {
    totalOrders: 437,
    totalRevenue: 128500000,
    totalCustomers: 1285,
    totalProducts: 324,
    recentActivities: [
      { type: 'order', message: 'Đơn hàng mới #12345 từ Nguyễn Văn A', time: '15 phút trước' },
      { type: 'product', message: 'Sản phẩm "Thịt heo ba chỉ" sắp hết hàng', time: '30 phút trước' },
      { type: 'user', message: 'Khách hàng mới đăng ký: Trần Thị B', time: '1 giờ trước' },
      { type: 'system', message: 'Cập nhật giá 5 sản phẩm', time: '2 giờ trước' },
      { type: 'delivery', message: 'Đơn hàng #12340 đã được giao thành công', time: '3 giờ trước' }
    ]
  };
};

// Dữ liệu mẫu doanh thu
export const getSampleRevenueData = (range) => {
  if (range === "week") {
    return [
      { name: "Thứ 2", revenue: 1500000 },
      { name: "Thứ 3", revenue: 2300000 },
      { name: "Thứ 4", revenue: 1800000 },
      { name: "Thứ 5", revenue: 2100000 },
      { name: "Thứ 6", revenue: 2500000 },
      { name: "Thứ 7", revenue: 3000000 },
      { name: "CN", revenue: 2000000 },
    ];
  } else if (range === "month") {
    return Array.from({ length: 30 }, (_, i) => ({
      name: `${i + 1}`,
      revenue: Math.floor(Math.random() * 3000000) + 1000000,
    }));
  } else {
    return [
      { name: "Tháng 1", revenue: 45000000 },
      { name: "Tháng 2", revenue: 42000000 },
      { name: "Tháng 3", revenue: 48000000 },
      { name: "Tháng 4", revenue: 50000000 },
      { name: "Tháng 5", revenue: 52000000 },
      { name: "Tháng 6", revenue: 58000000 },
      { name: "Tháng 7", revenue: 62000000 },
      { name: "Tháng 8", revenue: 68000000 },
      { name: "Tháng 9", revenue: 72000000 },
      { name: "Tháng 10", revenue: 75000000 },
      { name: "Tháng 11", revenue: 85000000 },
      { name: "Tháng 12", revenue: 95000000 },
    ];
  }
};

// Dữ liệu mẫu top sản phẩm bán chạy
export const getSampleTopProducts = () => {
  return [
    { name: "Thịt heo ba chỉ", sold: 120, revenue: 12000000 },
    { name: "Gạo ST25", sold: 150, revenue: 9000000 },
    { name: "Trứng gà", sold: 200, revenue: 7500000 },
    { name: "Sữa tươi Vinamilk", sold: 180, revenue: 6500000 },
    { name: "Rau cải xanh", sold: 250, revenue: 5000000 },
  ];
};

// Dữ liệu mẫu tồn kho
export const getSampleInventory = () => {
  return [
    { name: "Thịt & Hải sản", value: 150, stock: 150, lowStock: 20 },
    { name: "Rau củ quả", value: 250, stock: 250, lowStock: 40 },
    { name: "Trứng & Sữa", value: 180, stock: 180, lowStock: 30 },
    { name: "Gạo & Ngũ cốc", value: 120, stock: 120, lowStock: 25 },
    { name: "Gia vị", value: 90, stock: 90, lowStock: 15 },
  ];
};

// Dữ liệu mẫu người dùng
export const getSampleUserData = () => {
  return [
    { name: "Người dùng mới", count: 120, color: "#8884d8" },
    { name: "Khách hàng thân thiết", count: 300, color: "#82ca9d" },
    { name: "Khách vãng lai", count: 180, color: "#ffc658" },
  ];
};

// Dữ liệu mẫu cho Order Report
export const getSampleOrderData = () => {
  return {
    orderStatus: [
      { name: 'Đang xử lý', value: 25 },
      { name: 'Đang giao', value: 15 },
      { name: 'Đã giao', value: 50 },
      { name: 'Đã hủy', value: 10 }
    ],
    processingTime: [
      { name: 'Thứ 2', time: 45 },
      { name: 'Thứ 3', time: 35 },
      { name: 'Thứ 4', time: 40 },
      { name: 'Thứ 5', time: 30 },
      { name: 'Thứ 6', time: 25 },
      { name: 'Thứ 7', time: 50 },
      { name: 'CN', time: 55 }
    ],
    ordersByHour: [
      { hour: '0-4', count: 5 },
      { hour: '4-8', count: 15 },
      { hour: '8-12', count: 35 },
      { hour: '12-16', count: 45 },
      { hour: '16-20', count: 50 },
      { hour: '20-24', count: 30 }
    ],
    returnRate: [
      { reason: 'Sai sản phẩm', value: 35 },
      { reason: 'Chất lượng kém', value: 25 },
      { reason: 'Hàng bị hỏng', value: 20 },
      { reason: 'Đặt nhầm', value: 15 },
      { reason: 'Khác', value: 5 }
    ],
    topOrders: [
      { id: '#12345', customer: 'Nguyễn Văn A', total: 2500000, status: 'Đã giao', date: '15/05/2023' },
      { id: '#12346', customer: 'Trần Thị B', total: 1800000, status: 'Đang giao', date: '16/05/2023' },
      { id: '#12347', customer: 'Lê Văn C', total: 3200000, status: 'Đang xử lý', date: '17/05/2023' },
      { id: '#12348', customer: 'Phạm Thị D', total: 1500000, status: 'Đã hủy', date: '18/05/2023' },
      { id: '#12349', customer: 'Hoàng Văn E', total: 2800000, status: 'Đã giao', date: '19/05/2023' }
    ]
  };
};

// Dữ liệu mẫu cho Promotion Report
export const getSamplePromotionData = () => {
  return {
    voucherUsage: [
      { code: 'SUMMER25', discount: '25%', used: 150, limit: 200, revenue: 15000000 },
      { code: 'WELCOME10', discount: '10%', used: 320, limit: 500, revenue: 12000000 },
      { code: 'FREESHIP', discount: 'Miễn phí vận chuyển', used: 420, limit: 500, revenue: 18000000 },
      { code: 'NEWYEAR30', discount: '30%', used: 180, limit: 200, revenue: 20000000 },
      { code: 'FLASH50', discount: '50%', used: 75, limit: 100, revenue: 8500000 }
    ],
    promotionEffectiveness: [
      { name: 'Trước KM', Rau: 12000000, 'Thịt & Hải sản': 18000000, 'Trứng & Sữa': 9000000 },
      { name: 'Trong KM', Rau: 25000000, 'Thịt & Hải sản': 32000000, 'Trứng & Sữa': 15000000 },
      { name: 'Sau KM', Rau: 15000000, 'Thịt & Hải sản': 22000000, 'Trứng & Sữa': 11000000 }
    ],
    topPromotedProducts: [
      { name: 'Thịt heo ba chỉ', sold: 250, revenue: 25000000 },
      { name: 'Gạo ST25', sold: 180, revenue: 18000000 },
      { name: 'Trứng gà', sold: 350, revenue: 14000000 },
      { name: 'Sữa tươi Vinamilk', sold: 280, revenue: 12000000 },
      { name: 'Rau cải xanh', sold: 420, revenue: 10000000 }
    ],
    conversionRate: [
      { name: 'SUMMER25', rate: 65 },
      { name: 'WELCOME10', rate: 80 },
      { name: 'FREESHIP', rate: 75 },
      { name: 'NEWYEAR30', rate: 60 },
      { name: 'FLASH50', rate: 45 }
    ],
    roi: [
      { name: 'SUMMER25', value: 350 },
      { name: 'WELCOME10', value: 420 },
      { name: 'FREESHIP', value: 280 },
      { name: 'NEWYEAR30', value: 310 },
      { name: 'FLASH50', value: 180 }
    ]
  };
};

// Dữ liệu mẫu cho System Activity Report
export const getSampleSystemActivityData = () => {
  return {
    activities: [
      { user: 'admin', action: 'Đăng nhập', time: '09:15', date: '20/05/2023', ip: '192.168.1.1' },
      { user: 'admin', action: 'Thay đổi giá sản phẩm "Thịt heo ba chỉ"', time: '09:20', date: '20/05/2023', ip: '192.168.1.1' },
      { user: 'manager', action: 'Thêm sản phẩm mới', time: '10:30', date: '20/05/2023', ip: '192.168.1.2' },
      { user: 'staff1', action: 'Cập nhật trạng thái đơn hàng #12345', time: '11:45', date: '20/05/2023', ip: '192.168.1.3' },
      { user: 'admin', action: 'Tạo mã giảm giá mới', time: '13:20', date: '20/05/2023', ip: '192.168.1.1' },
      { user: 'manager', action: 'Xuất báo cáo doanh thu', time: '14:15', date: '20/05/2023', ip: '192.168.1.2' },
      { user: 'staff2', action: 'Thay đổi thông tin sản phẩm', time: '15:30', date: '20/05/2023', ip: '192.168.1.4' },
      { user: 'admin', action: 'Đăng xuất', time: '17:45', date: '20/05/2023', ip: '192.168.1.1' }
    ],
    alerts: [
      { type: 'warning', message: 'Đăng nhập thất bại nhiều lần từ IP 203.113.152.5', time: '08:15', date: '20/05/2023' },
      { type: 'error', message: 'Lỗi kết nối cơ sở dữ liệu', time: '10:30', date: '19/05/2023' },
      { type: 'warning', message: 'Thay đổi giá đột ngột trên sản phẩm "Gạo ST25"', time: '14:20', date: '18/05/2023' },
      { type: 'error', message: 'Hệ thống thanh toán gặp sự cố', time: '16:45', date: '17/05/2023' },
      { type: 'warning', message: 'Tài khoản admin thay đổi nhiều sản phẩm trong thời gian ngắn', time: '11:30', date: '16/05/2023' }
    ],
    pageLoadTime: [
      { page: 'Trang chủ', time: 1.2 },
      { page: 'Sản phẩm', time: 1.5 },
      { page: 'Giỏ hàng', time: 0.8 },
      { page: 'Thanh toán', time: 2.1 },
      { page: 'Tài khoản', time: 0.9 }
    ],
    errorStats: [
      { type: 'API Error', count: 15 },
      { type: 'UI Error', count: 8 },
      { type: 'Authentication Error', count: 5 },
      { type: 'Payment Error', count: 12 },
      { type: 'Other', count: 3 }
    ],
    uptime: 99.8
  };
};

// Dữ liệu mẫu cho Delivery Report
export const getSampleDeliveryData = () => {
  return {
    onTimeDelivery: [
      { status: 'Đúng hẹn', value: 85 },
      { status: 'Trễ hẹn', value: 15 }
    ],
    deliveryTime: [
      { district: 'Quận 1', time: 45 },
      { district: 'Quận 2', time: 60 },
      { district: 'Quận 3', time: 40 },
      { district: 'Quận 4', time: 55 },
      { district: 'Quận 5', time: 50 },
      { district: 'Quận 6', time: 65 },
      { district: 'Quận 7', time: 70 }
    ],
    returnReason: [
      { reason: 'Khách không nhận', value: 40 },
      { reason: 'Địa chỉ không chính xác', value: 25 },
      { reason: 'Hàng bị hỏng khi vận chuyển', value: 20 },
      { reason: 'Khách đổi ý', value: 15 }
    ],
    deliveryStaff: [
      { name: 'Nguyễn Văn X', delivered: 125, onTime: 120, rate: 96 },
      { name: 'Trần Văn Y', delivered: 110, onTime: 105, rate: 95 },
      { name: 'Lê Văn Z', delivered: 135, onTime: 125, rate: 93 },
      { name: 'Phạm Văn A', delivered: 95, onTime: 90, rate: 95 },
      { name: 'Hoàng Văn B', delivered: 115, onTime: 110, rate: 96 }
    ],
    delayedAreas: [
      { district: 'Quận 1', count: 5 },
      { district: 'Quận 2', count: 12 },
      { district: 'Quận 3', count: 3 },
      { district: 'Quận 4', count: 8 },
      { district: 'Quận 5', count: 6 },
      { district: 'Quận 6', count: 15 },
      { district: 'Quận 7', count: 18 }
    ]
  };
};

// Dữ liệu mẫu cho Feedback Report
export const getSampleFeedbackData = () => {
  return {
    ratingAverage: [
      { category: 'Rau củ quả', rating: 4.5 },
      { category: 'Thịt & Hải sản', rating: 4.2 },
      { category: 'Trứng & Sữa', rating: 4.7 },
      { category: 'Gạo & Ngũ cốc', rating: 4.6 },
      { category: 'Gia vị', rating: 4.3 }
    ],
    sentimentAnalysis: [
      { type: 'Tích cực', value: 65 },
      { type: 'Trung lập', value: 25 },
      { type: 'Tiêu cực', value: 10 }
    ],
    negativeKeywords: [
      { keyword: 'chậm', count: 15 },
      { keyword: 'kém', count: 10 },
      { keyword: 'hỏng', count: 8 },
      { keyword: 'đắt', count: 12 },
      { keyword: 'khó', count: 5 }
    ],
    ratingTrend: [
      { month: 'Tháng 1', rating: 4.2 },
      { month: 'Tháng 2', rating: 4.3 },
      { month: 'Tháng 3', rating: 4.1 },
      { month: 'Tháng 4', rating: 4.4 },
      { month: 'Tháng 5', rating: 4.5 },
      { month: 'Tháng 6', rating: 4.6 }
    ],
    categoryComparison: [
      { category: '1 sao', Rau: 5, Thịt: 8, Trứng: 3, Gạo: 4, Gia_vị: 6 },
      { category: '2 sao', Rau: 10, Thịt: 15, Trứng: 8, Gạo: 7, Gia_vị: 12 },
      { category: '3 sao', Rau: 25, Thịt: 30, Trứng: 20, Gạo: 18, Gia_vị: 22 },
      { category: '4 sao', Rau: 40, Thịt: 35, Trứng: 45, Gạo: 42, Gia_vị: 38 },
      { category: '5 sao', Rau: 80, Thịt: 72, Trứng: 85, Gạo: 88, Gia_vị: 75 }
    ]
  };
}; 