// Essential utility functions for OrderDetail component

// Định nghĩa các chi nhánh cửa hàng
export const SHOP_BRANCHES = [
  {
    id: "cantho",
    name: "Chi nhánh Cần Thơ",
    lat: 10.0339,
    lng: 105.7855,
    address: "123 Nguyễn Văn Cừ, Ninh Kiều, Cần Thơ",
    isMainBranch: true
  },
  {
    id: "soctrang",
    name: "Chi nhánh Sóc Trăng",
    lat: 9.6037,
    lng: 105.9747,
    address: "456 Lê Hồng Phong, TP. Sóc Trăng, Sóc Trăng",
    isMainBranch: false
  }
];

// Lấy vị trí cửa hàng mặc định (chi nhánh chính)
export const SHOP_LOCATION = SHOP_BRANCHES.find(branch => branch.isMainBranch) || SHOP_BRANCHES[0];

// Lấy chi nhánh gần nhất với một địa điểm cụ thể
export const getNearestBranch = (lat, lng) => {
  if (!lat || !lng) return SHOP_LOCATION;
  
  let nearestBranch = SHOP_BRANCHES[0];
  let shortestDistance = calculateDistance(lat, lng, nearestBranch.lat, nearestBranch.lng);
  
  for (let i = 1; i < SHOP_BRANCHES.length; i++) {
    const branch = SHOP_BRANCHES[i];
    const distance = calculateDistance(lat, lng, branch.lat, branch.lng);
    
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestBranch = branch;
    }
  }
  
  return nearestBranch;
};

// Tính khoảng cách giữa hai điểm dựa trên tọa độ
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Bán kính Trái Đất tính bằng km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

// Tạo lộ trình qua các kho
export const generateWarehouseRoute = (shopLocation, customerLocation) => {
  // Simplified implementation
  return [
    { name: "Kho chính", lat: shopLocation.lat, lng: shopLocation.lng, status: "completed", time: new Date(Date.now() - 86400000) },
    { name: "Trung tâm phân phối", lat: (shopLocation.lat + customerLocation.lat) / 2, lng: (shopLocation.lng + customerLocation.lng) / 2, status: "in_progress", time: new Date() },
    { name: "Đang giao đến khách hàng", lat: customerLocation.lat, lng: customerLocation.lng, status: "pending", time: new Date(Date.now() + 86400000) }
  ];
};

// Tạo đơn hàng mẫu cho mục đích demo
export function generateMockOrder(orderId = null) {
  const id = orderId || Math.floor(Math.random() * 1000000).toString();
  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)); // Random trong 7 ngày qua
  
  // Các trạng thái có thể có
  const statuses = ['pending', 'confirmed', 'shipping', 'delivered', 'canceled'];
  const status = statuses[Math.floor(Math.random() * 3)]; // Chỉ lấy 3 trạng thái đầu
  
  // Phương thức thanh toán
  const paymentMethods = ['cod', 'banking', 'momo', 'zalopay', 'vnpay'];
  const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  
  // Tạo danh sách sản phẩm ngẫu nhiên
  const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 sản phẩm
  const items = [];
  
  const productNames = [
    'Táo Fuji Nhật Bản', 'Cam Navel Úc', 'Dưa hấu không hạt', 'Nho xanh không hạt', 
    'Sữa tươi tiệt trùng Vinamilk', 'Bánh mì sandwich', 'Thịt bò Úc', 'Thịt heo sạch',
    'Cá hồi phi lê', 'Tôm sú', 'Rau cải xanh', 'Cà rốt', 'Khoai tây', 'Nước suối',
    'Nước ngọt Coca Cola', 'Bia Heineken', 'Snack khoai tây', 'Bánh quy', 'Mì gói'
  ];
  
  let totalAmount = 0;
  
  for (let i = 0; i < numItems; i++) {
    const price = Math.floor(Math.random() * 200000) + 10000; // 10k-210k VND
    const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 sản phẩm
    const discountAmount = Math.random() > 0.7 ? Math.floor(price * 0.1) : 0; // 10% giảm giá cho 30% sản phẩm
    const subtotal = price * quantity - discountAmount;
    
    totalAmount += subtotal;
    
    items.push({
      _id: `item_${i}_${Date.now()}`,
      product: {
        _id: `product_${i}_${Date.now()}`,
        name: productNames[Math.floor(Math.random() * productNames.length)],
        image: `https://picsum.photos/seed/${i + Date.now()}/200/200`,
        unit: ['kg', 'gói', 'chai', 'hộp', 'túi'][Math.floor(Math.random() * 5)]
      },
      quantity,
      price,
      discountAmount,
      unit: ['kg', 'gói', 'chai', 'hộp', 'túi'][Math.floor(Math.random() * 5)],
      unitPrice: price,
      conversionRate: Math.random() > 0.8 ? Math.floor(Math.random() * 5) + 2 : 1 // 20% có conversion rate
    });
  }
  
  // Phí vận chuyển và thuế
  const shippingFee = Math.floor(Math.random() * 50000) + 15000; // 15k-65k VND
  const tax = Math.floor(totalAmount * 0.1); // 10% thuế
  totalAmount += shippingFee + tax;
  
  // Giảm giá đơn hàng
  const discount = Math.random() > 0.7 ? Math.floor(totalAmount * 0.05) : 0; // 5% giảm giá cho 30% đơn hàng
  totalAmount -= discount;
  
  // Ngày giao hàng dự kiến
  const estimatedDelivery = new Date(createdAt.getTime() + (3 + Math.floor(Math.random() * 4)) * 24 * 60 * 60 * 1000);
  
  // Địa chỉ giao hàng
  const addresses = [
    '123 Nguyễn Văn Linh, Quận Ninh Kiều, Cần Thơ',
    '456 Trần Hưng Đạo, Quận 1, TP. Hồ Chí Minh',
    '789 Lê Lợi, Quận Hải Châu, Đà Nẵng',
    '101 Nguyễn Huệ, Quận Hoàn Kiếm, Hà Nội',
    '202 Lê Duẩn, TP. Huế, Thừa Thiên Huế'
  ];
  
  return {
    _id: id,
    orderNumber: `ORD${id}`,
    userId: `user_${Math.floor(Math.random() * 1000)}`,
    items,
    totalAmount,
    shippingFee,
    tax,
    discount,
    status,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? (status === 'delivered' ? 'paid' : 'pending') : 'paid',
    shippingAddress: addresses[Math.floor(Math.random() * addresses.length)],
    createdAt,
    updatedAt: new Date(createdAt.getTime() + Math.floor(Math.random() * 24 * 60 * 60 * 1000)),
    estimatedDelivery
  };
}

// Định dạng ngày tháng
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Định dạng tiền tệ
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}; 