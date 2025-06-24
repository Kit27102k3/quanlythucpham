// Essential utility functions for OrderDetail component

// Mapbox access token
export const MAPBOX_ACCESS_TOKEN = "pk.eyJ1Ijoia2l0MjcxMCIsImEiOiJjbWF4bWh5YWQwc2N0MmtxM2p1M2Z5azZkIn0.navJSR4rbpRHVV3TEXelQg";

// Danh sách các chi nhánh cửa hàng
export const SHOP_BRANCHES = [
  {
    id: 1,
    name: "Chi nhánh Cần Thơ",
    lat: 10.0076303,
    lng: 105.7203383,
    address: "168 Nguyễn Văn Cừ Nối Dài, An Bình, Ninh Kiều, Cần Thơ, Việt Nam",
    isMain: true
  },
  {
    id: 2,
    name: "Chi nhánh Sóc Trăng",
    lat: 9.7024274,
    lng: 105.7646406,
    address: "PQ2G+XMC, Long Hưng, Mỹ Tú, Sóc Trăng, Việt Nam",
    isMain: false
  },
  {
    id: 3,
    name: "Chi nhánh An Giang",
    lat: 10.3839,
    lng: 105.4389,
    address: "45 Lê Lợi, Mỹ Bình, TP. Long Xuyên, Tỉnh An Giang",
    isMain: false
  },
  {
    id: 4,
    name: "Chi nhánh Vĩnh Long",
    lat: 10.2489,
    lng: 105.9722,
    address: "88 Phạm Thái Bường, Phường 4, TP. Vĩnh Long, Tỉnh Vĩnh Long",
    isMain: false
  }
];

/**
 * Lấy vị trí cửa hàng mặc định (chi nhánh chính)
 * @returns {Object} Vị trí chi nhánh chính
 */
export const getDefaultShopLocation = () => {
  return SHOP_BRANCHES.find(branch => branch.isMain) || SHOP_BRANCHES[0];
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
  
  SHOP_BRANCHES.forEach(branch => {
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
  for (const branch of SHOP_BRANCHES) {
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
  
  // Ưu tiên kiểm tra các từ khóa quan trọng để cung cấp tọa độ chính xác
  if (address.toLowerCase().includes('nguyễn văn cừ')) {
    // Đường Nguyễn Văn Cừ, Cần Thơ - Tọa độ chính xác từ Google Maps
    console.log('Sử dụng tọa độ chính xác cho địa chỉ Nguyễn Văn Cừ');
    return { lat: 10.030165, lng: 105.7480393 };
  }
  
  // Lấy Mapbox token từ biến toàn cục hoặc từ import.meta.env hoặc sử dụng token mặc định
  const MAPBOX_ACCESS_TOKEN = 
    window.MAPBOX_ACCESS_TOKEN || 
    (typeof import.meta !== 'undefined' ? import.meta.env.VITE_MAPBOX_ACCESS_TOKEN : null) || 
    "pk.eyJ1Ijoia2l0MjcxMCIsImEiOiJjbWF4bWh5YWQwc2N0MmtxM2p1M2Z5azZkIn0.navJSR4rbpRHVV3TEXelQg";
  
  // Kiểm tra cache trước
  try {
    const geocodingCache = JSON.parse(localStorage.getItem('geocoding_cache') || '{}');
    const addressKey = address
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_');
    
    // Nếu có trong cache và chưa quá 30 ngày
    if (geocodingCache[addressKey]) {
      const cached = geocodingCache[addressKey];
      const cachedDate = new Date(cached.timestamp || Date.now());
      const daysDiff = (Date.now() - cachedDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff < 30) {
        console.log('Sử dụng tọa độ từ cache cho địa chỉ:', address);
        // Trả về tọa độ từ cache mà không thay đổi
        return { lat: cached.lat, lng: cached.lng };
      }
    }
  } catch (err) {
    console.warn('Lỗi khi đọc cache:', err);
  }
  
  // Nếu không có trong cache, gọi API Mapbox
  try {
    console.log('Gọi API Mapbox để geocode địa chỉ:', address);
    
    // Thêm "Việt Nam" vào cuối địa chỉ nếu chưa có để cải thiện kết quả
    let searchAddress = address;
    if (!searchAddress.toLowerCase().includes('việt nam')) {
      searchAddress += ', Việt Nam';
    }
    
    // Mã hóa địa chỉ để sử dụng trong URL
    const encodedAddress = encodeURIComponent(searchAddress);
    
    // Gọi Mapbox Geocoding API
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1&country=vn`
    );
    
    if (!response.ok) {
      throw new Error(`Lỗi khi geocode: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Kiểm tra kết quả
    if (data.features && data.features.length > 0) {
      // Mapbox trả về [longitude, latitude]
      const [lng, lat] = data.features[0].center;
      
      // Lưu vào cache
      try {
        const geocodingCache = JSON.parse(localStorage.getItem('geocoding_cache') || '{}');
        const addressKey = address
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, '_');
        
        geocodingCache[addressKey] = {
          lat,
          lng,
          timestamp: Date.now(),
          source: 'mapbox'
        };
        
        // Giới hạn kích thước cache
        const cacheKeys = Object.keys(geocodingCache);
        if (cacheKeys.length > 100) {
          // Xóa các mục cũ nhất
          const sortedKeys = cacheKeys.sort((a, b) => 
            (geocodingCache[a].timestamp || 0) - (geocodingCache[b].timestamp || 0)
          );
          
          // Xóa 20 mục cũ nhất
          sortedKeys.slice(0, 20).forEach(key => delete geocodingCache[key]);
        }
        
        localStorage.setItem('geocoding_cache', JSON.stringify(geocodingCache));
      } catch (err) {
        console.warn('Lỗi khi lưu cache:', err);
      }
      
      console.log('Kết quả geocode từ Mapbox:', { lat, lng });
      
      // Trả về kết quả từ Mapbox mà không thay đổi
      return { lat, lng };
    }
  } catch (error) {
    console.error('Lỗi khi geocode địa chỉ:', error);
  }
  
  // Nếu không thể geocode hoặc có lỗi, dùng giải pháp dự phòng
  console.log('Không thể geocode địa chỉ, sử dụng geocode server mặc định');
  
  // Trường hợp khẩn cấp, sử dụng giải pháp geocode tìm kiếm theo từ khóa
  if (address.toLowerCase().includes('nguyễn văn cừ')) {
    // Đường Nguyễn Văn Cừ, Cần Thơ - tọa độ từ Google Maps
    return { lat: 10.030165, lng: 105.7480393 };
  } else if (address.toLowerCase().includes('an bình')) {
    // Phường An Bình, Ninh Kiều, Cần Thơ
    return { lat: 10.0421694, lng: 105.748337 };
  } else if (address.toLowerCase().includes('ninh kiều')) { 
    // Quận Ninh Kiều, Cần Thơ
    return { lat: 10.0289313, lng: 105.7754218 };
  } else if (address.toLowerCase().includes('bình thủy') || address.toLowerCase().includes('binh thuy')) {
    // Quận Bình Thủy, Cần Thơ
    return { lat: 10.0610, lng: 105.7380 };
  } else if (address.toLowerCase().includes('cần thơ')) {
    // Tọa độ khu vực Cần Thơ khác chi nhánh
    return { lat: 10.0335343, lng: 105.7859024 }; 
  } else if (address.toLowerCase().includes('hồ chí minh') || address.toLowerCase().includes('sài gòn')) {
    return { lat: 10.7769, lng: 106.6983 };
  } else if (address.toLowerCase().includes('hà nội')) {
    return { lat: 21.0285, lng: 105.8542 };
  } else if (address.toLowerCase().includes('đà nẵng')) {
    return { lat: 16.0544, lng: 108.2022 };
  } else if (address.toLowerCase().includes('huế')) {
    return { lat: 16.4637, lng: 107.5909 };
  } else if (address.toLowerCase().includes('sóc trăng')) {
    return { lat: 9.6037, lng: 105.9811 };
  } else if (address.toLowerCase().includes('an giang')) {
    return { lat: 10.3839, lng: 105.4389 };
  } else if (address.toLowerCase().includes('vĩnh long')) {
    return { lat: 10.2489, lng: 105.9722 };
  }
  
  // Mặc định trả về tọa độ trung tâm Cần Thơ, khác với chi nhánh
  return { lat: 10.0289313, lng: 105.7754218 };
}; 