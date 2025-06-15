// Essential utility functions for OrderDetail component

// Mapbox access token
export const MAPBOX_ACCESS_TOKEN = "pk.eyJ1Ijoia2l0MjcxMCIsImEiOiJjbWF4bWh5YWQwc2N0MmtxM2p1M2Z5azZkIn0.navJSR4rbpRHVV3TEXelQg";

// Định nghĩa các chi nhánh cửa hàng
const shopBranches = [
  {
    id: 1,
    name: "Chi nhánh Cần Thơ",
    lat: 10.0339,
    lng: 105.7855,
    address: "30 Nguyễn Văn Linh, Ninh Kiều, Cần Thơ",
    isMain: true
  },
  {
    id: 2,
    name: "Chi nhánh Hồ Chí Minh",
    lat: 10.7769,
    lng: 106.6983,
    address: "268 Lý Thường Kiệt, Quận 10, Hồ Chí Minh",
    isMain: false
  },
  {
    id: 3,
    name: "Chi nhánh Hà Nội",
    lat: 21.0285,
    lng: 105.8542,
    address: "55 Giải Phóng, Hai Bà Trưng, Hà Nội",
    isMain: false
  },
  {
    id: 4,
    name: "Chi nhánh Đà Nẵng",
    lat: 16.0544,
    lng: 108.2022,
    address: "102 Nguyễn Văn Linh, Hải Châu, Đà Nẵng",
    isMain: false
  },
  {
    id: 5,
    name: "Chi nhánh Huế",
    lat: 16.4637,
    lng: 107.5909,
    address: "28 Lý Thường Kiệt, Phú Nhuận, Huế",
    isMain: false
  },
  {
    id: 6,
    name: "Chi nhánh Sóc Trăng",
    lat: 9.6037,
    lng: 105.9811,
    address: "126 Trần Hưng Đạo, Phường 3, Sóc Trăng",
    isMain: false
  }
];

/**
 * Lấy vị trí cửa hàng mặc định (chi nhánh chính)
 * @returns {Object} Vị trí chi nhánh chính
 */
export const getDefaultShopLocation = () => {
  return shopBranches.find(branch => branch.isMain) || shopBranches[0];
};

/**
 * Tìm chi nhánh gần nhất với vị trí khách hàng
 * @param {number} lat - Vĩ độ vị trí khách hàng
 * @param {number} lng - Kinh độ vị trí khách hàng
 * @returns {Object} Chi nhánh gần nhất
 */
export const getNearestBranch = (lat, lng) => {
  if (!lat || !lng) return getDefaultShopLocation();
  
  let nearestBranch = null;
  let minDistance = Infinity;
  
  shopBranches.forEach(branch => {
    const distance = calculateDistance(lat, lng, branch.lat, branch.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestBranch = branch;
    }
  });
  
  return nearestBranch || getDefaultShopLocation();
};

/**
 * Tính khoảng cách giữa hai điểm địa lý sử dụng công thức Haversine
 * @param {number} lat1 - Vĩ độ điểm 1
 * @param {number} lon1 - Kinh độ điểm 1
 * @param {number} lat2 - Vĩ độ điểm 2
 * @param {number} lon2 - Kinh độ điểm 2
 * @returns {number} Khoảng cách tính bằng km
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính trái đất tính bằng km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

/**
 * Tạo lộ trình qua các kho trung chuyển
 * @param {Object} shopLocation - Vị trí cửa hàng
 * @param {Object} customerLocation - Vị trí khách hàng
 * @returns {Array} Danh sách các kho trung chuyển
 */
export const generateWarehouseRoute = (shopLocation, customerLocation) => {
  if (!shopLocation || !customerLocation) return [];
  
  // Tính khoảng cách giữa cửa hàng và khách hàng
  const distance = calculateDistance(
    shopLocation.lat, 
    shopLocation.lng, 
    customerLocation.lat, 
    customerLocation.lng
  );
  
  // Số lượng kho trung chuyển phụ thuộc vào khoảng cách
  let numWarehouses = 0;
  if (distance < 50) {
    numWarehouses = 1;
  } else if (distance < 200) {
    numWarehouses = 2;
  } else {
    numWarehouses = 3;
  }
  
  // Tạo danh sách các kho trung chuyển
  const warehouses = [];
  const now = new Date();
  
  for (let i = 0; i < numWarehouses; i++) {
    // Tính toán vị trí kho trung chuyển (nội suy tuyến tính)
    const ratio = (i + 1) / (numWarehouses + 1);
    const lat = shopLocation.lat + (customerLocation.lat - shopLocation.lat) * ratio;
    const lng = shopLocation.lng + (customerLocation.lng - shopLocation.lng) * ratio;
    
    // Tính toán thời gian đến và đi
    const hoursToArrive = 2 + i * 4; // 2 giờ cho kho đầu tiên, thêm 4 giờ cho mỗi kho tiếp theo
    const arrivalTime = new Date(now.getTime() + hoursToArrive * 3600 * 1000);
    const departureTime = new Date(arrivalTime.getTime() + 1 * 3600 * 1000); // Lưu kho 1 giờ
    
    warehouses.push({
      name: `Kho trung chuyển ${i + 1}`,
      address: `Kho ${i + 1}, ${getRandomAddress(lat, lng)}`,
      lat,
      lng,
      arrivalTime: arrivalTime.toISOString(),
      departureTime: departureTime.toISOString()
    });
  }
  
  return warehouses;
};

/**
 * Tạo địa chỉ ngẫu nhiên dựa trên vị trí
 * @param {number} lat - Vĩ độ
 * @param {number} lng - Kinh độ
 * @returns {string} Địa chỉ ngẫu nhiên
 */
const getRandomAddress = (lat, lng) => {
  const cities = [
    "Cần Thơ", "Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Huế", "Sóc Trăng",
    "An Giang", "Bạc Liêu", "Bến Tre", "Bình Định", "Bình Dương"
  ];
  
  const districts = [
    "Quận 1", "Quận 2", "Quận 3", "Ninh Kiều", "Bình Thủy", "Cái Răng",
    "Hải Châu", "Thanh Khê", "Sơn Trà", "Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng"
  ];
  
  const streets = [
    "Nguyễn Văn Linh", "Lý Thường Kiệt", "Trần Hưng Đạo", "Lê Lợi", "Nguyễn Huệ",
    "Phan Đình Phùng", "Phan Chu Trinh", "Nguyễn Du", "Hùng Vương", "3/2", "30/4"
  ];
  
  // Chọn thành phố dựa trên vị trí
  let city = cities[0];
  for (const branch of shopBranches) {
    if (Math.abs(lat - branch.lat) < 0.1 && Math.abs(lng - branch.lng) < 0.1) {
      city = branch.name.replace("Chi nhánh ", "");
      break;
    }
  }
  
  const streetNumber = Math.floor(Math.random() * 200) + 1;
  const district = districts[Math.floor(Math.random() * districts.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  
  return `${streetNumber} ${street}, ${district}, ${city}`;
};

/**
 * Tạo đơn hàng mẫu cho demo
 * @param {string} orderId - Mã đơn hàng
 * @returns {Object} Đơn hàng mẫu
 */
export const generateMockOrder = (orderId) => {
  // Danh sách sản phẩm mẫu
  const products = [
    { id: 1, name: "Thịt heo", price: 120000, image: "https://cdn.tgdd.vn/2020/08/content/thitheo-800x450.jpg" },
    { id: 2, name: "Thịt bò", price: 280000, image: "https://cdn.tgdd.vn/2020/09/content/thitbo-800x450.jpg" },
    { id: 3, name: "Gà nguyên con", price: 150000, image: "https://cdn.tgdd.vn/2020/08/content/ga-800x450.jpg" },
    { id: 4, name: "Cá thu", price: 190000, image: "https://cdn.tgdd.vn/2020/08/content/cathu-800x450.jpg" },
    { id: 5, name: "Tôm sú", price: 320000, image: "https://cdn.tgdd.vn/2020/08/content/tomsu-800x450.jpg" },
    { id: 6, name: "Rau muống", price: 15000, image: "https://cdn.tgdd.vn/2020/08/content/raumuong-800x450.jpg" },
    { id: 7, name: "Cải thảo", price: 18000, image: "https://cdn.tgdd.vn/2020/08/content/caithao-800x450.jpg" },
    { id: 8, name: "Cà rốt", price: 22000, image: "https://cdn.tgdd.vn/2020/08/content/carot-800x450.jpg" },
    { id: 9, name: "Táo", price: 65000, image: "https://cdn.tgdd.vn/2020/08/content/tao-800x450.jpg" },
    { id: 10, name: "Cam", price: 70000, image: "https://cdn.tgdd.vn/2020/08/content/cam-800x450.jpg" }
  ];
  
  // Chọn ngẫu nhiên 2-5 sản phẩm
  const numItems = Math.floor(Math.random() * 4) + 2;
  const orderItems = [];
  const selectedProductIds = new Set();
  
  while (orderItems.length < numItems) {
    const randomIndex = Math.floor(Math.random() * products.length);
    const product = products[randomIndex];
    
    if (!selectedProductIds.has(product.id)) {
      selectedProductIds.add(product.id);
      const quantity = Math.floor(Math.random() * 3) + 1;
      orderItems.push({
        ...product,
        quantity,
        total: product.price * quantity
      });
    }
  }
  
  // Tính tổng tiền
  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const shippingFee = 30000;
  const discount = Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0;
  const total = subtotal + shippingFee - discount;
  
  // Tạo địa chỉ khách hàng ngẫu nhiên
  const customerCities = [
    { name: "Cần Thơ", lat: 10.0339, lng: 105.7855 },
    { name: "Hồ Chí Minh", lat: 10.7769, lng: 106.6983 },
    { name: "Hà Nội", lat: 21.0285, lng: 105.8542 },
    { name: "Đà Nẵng", lat: 16.0544, lng: 108.2022 },
    { name: "Huế", lat: 16.4637, lng: 107.5909 },
    { name: "Sóc Trăng", lat: 9.6037, lng: 105.9811 }
  ];
  
  const randomCity = customerCities[Math.floor(Math.random() * customerCities.length)];
  // Thêm nhiễu nhỏ cho tọa độ để không trùng với vị trí chi nhánh
  const latNoise = (Math.random() - 0.5) * 0.05;
  const lngNoise = (Math.random() - 0.5) * 0.05;
  
  const customerLocation = {
    lat: randomCity.lat + latNoise,
    lng: randomCity.lng + lngNoise,
    address: getRandomAddress(randomCity.lat + latNoise, randomCity.lng + lngNoise)
  };
  
  // Tạo thông tin đơn hàng
  const now = new Date();
  const orderDate = new Date(now.getTime() - Math.floor(Math.random() * 86400000)); // Trong vòng 24h qua
  const estimatedDelivery = new Date(now.getTime() + (2 + Math.floor(Math.random() * 3)) * 86400000); // 2-4 ngày sau
  
  // Trạng thái đơn hàng
  const statuses = ["pending", "confirmed", "shipping", "delivered", "completed"];
  const randomStatusIndex = Math.floor(Math.random() * 3) + 1; // Chọn confirmed, shipping hoặc delivered
  const status = statuses[randomStatusIndex];
  
  return {
    _id: orderId || `ORD${Math.floor(Math.random() * 10000)}`,
    orderItems,
    subtotal,
    shippingFee,
    discount,
    total,
    paymentMethod: Math.random() > 0.5 ? "COD" : "Banking",
    shippingAddress: customerLocation.address,
    customerLocation,
    orderDate: orderDate.toISOString(),
    estimatedDelivery: estimatedDelivery.toISOString(),
    status,
    isPaid: status !== "pending" && Math.random() > 0.3,
    user: {
      _id: `USR${Math.floor(Math.random() * 10000)}`,
      name: "Khách hàng",
      email: "customer@example.com",
      phone: `09${Math.floor(Math.random() * 100000000)}`
    }
  };
};

/**
 * Định dạng ngày tháng
 * @param {string|Date} date - Ngày cần định dạng
 * @param {boolean} includeTime - Có hiển thị giờ hay không
 * @returns {string} Ngày đã định dạng
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return "N/A";
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid date";
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  let result = `${day}/${month}/${year}`;
  
  if (includeTime) {
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    result += ` ${hours}:${minutes}`;
  }
  
  return result;
};

/**
 * Định dạng tiền tệ
 * @param {number} amount - Số tiền cần định dạng
 * @param {boolean} showCurrency - Có hiển thị đơn vị tiền tệ hay không
 * @returns {string} Số tiền đã định dạng
 */
export const formatCurrency = (amount, showCurrency = true) => {
  if (amount === undefined || amount === null) return "N/A";
  
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: showCurrency ? 'currency' : 'decimal',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return formatter.format(amount);
};

/**
 * Geocode địa chỉ sử dụng Mapbox
 * @param {string} address - Địa chỉ cần geocode
 * @returns {Promise<{lat: number, lng: number}>} Tọa độ địa chỉ
 */
export const geocodeAddress = async (address) => {
  if (!address) {
    console.error('Không có địa chỉ để geocode');
    return null;
  }
  
  // Trong thực tế, bạn sẽ gọi API Mapbox để geocode địa chỉ
  // Ở đây chúng ta giả lập kết quả dựa trên từ khóa trong địa chỉ
  
  // Kiểm tra các từ khóa trong địa chỉ
  if (address.includes('Cần Thơ')) {
    return { lat: 10.0339, lng: 105.7855 };
  } else if (address.includes('Hồ Chí Minh')) {
    return { lat: 10.7769, lng: 106.6983 };
  } else if (address.includes('Hà Nội')) {
    return { lat: 21.0285, lng: 105.8542 };
  } else if (address.includes('Đà Nẵng')) {
    return { lat: 16.0544, lng: 108.2022 };
  } else if (address.includes('Huế')) {
    return { lat: 16.4637, lng: 107.5909 };
  } else if (address.includes('Sóc Trăng')) {
    return { lat: 9.6037, lng: 105.9811 };
  }
  
  // Mặc định trả về tọa độ Cần Thơ
  return { lat: 10.0339, lng: 105.7855 };
}; 