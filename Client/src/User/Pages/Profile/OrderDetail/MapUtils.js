// src/utils/MapUtils.js
import axios from "axios";

// Get Mapbox API key from environment variable
const MAPBOX_API_KEY =
  "pk.eyJ1Ijoia2l0MjcxMCIsImEiOiJjbWF4bWh5YWQwc2N0MmtxM2p1M2Z5azZkIn0.navJSR4rbpRHVV3TEXelQg";

// Export Mapbox access token for use in other components
export const MAPBOX_ACCESS_TOKEN = MAPBOX_API_KEY;

// Định nghĩa các thành phố lớn ở Việt Nam và tọa độ của chúng
export const VIETNAM_MAJOR_CITIES = [
  { name: "Hà Nội", lat: 21.0285, lng: 105.8542, region: "Bắc" },
  { name: "TP Hồ Chí Minh", lat: 10.7758, lng: 106.7021, region: "Nam" },
  { name: "Đà Nẵng", lat: 16.0545, lng: 108.2022, region: "Trung" },
  { name: "Hải Phòng", lat: 20.8449, lng: 106.6881, region: "Bắc" },
  { name: "Cần Thơ", lat: 10.0339, lng: 105.7855, region: "Nam" },
  { name: "Nha Trang", lat: 12.2431, lng: 109.1919, region: "Trung" },
  { name: "Huế", lat: 16.4637, lng: 107.5909, region: "Trung" },
  { name: "Vinh", lat: 18.6734, lng: 105.6820, region: "Trung" },
  { name: "Buôn Ma Thuột", lat: 12.6886, lng: 108.0835, region: "Tây Nguyên" },
  { name: "Quảng Ninh", lat: 21.0063, lng: 107.2951, region: "Bắc" },
  { name: "Quy Nhơn", lat: 13.7695, lng: 109.2235, region: "Trung" },
  { name: "Long Xuyên", lat: 10.3866, lng: 105.4352, region: "Nam" },
  { name: "Thái Nguyên", lat: 21.5621, lng: 105.8251, region: "Bắc" },
  { name: "Vũng Tàu", lat: 10.3460, lng: 107.0843, region: "Nam" },
  { name: "Thanh Hóa", lat: 19.8066, lng: 105.7855, region: "Bắc" },
  { name: "Rạch Giá", lat: 10.0222, lng: 105.0914, region: "Nam" },
  { name: "Hạ Long", lat: 20.9587, lng: 107.0929, region: "Bắc" },
  { name: "Phan Thiết", lat: 10.9804, lng: 108.2622, region: "Nam" },
  { name: "Biên Hòa", lat: 10.9455, lng: 106.8245, region: "Nam" },
  { name: "Mỹ Tho", lat: 10.3601, lng: 106.2809, region: "Nam" },
  { name: "Nam Định", lat: 20.4196, lng: 106.1684, region: "Bắc" },
  { name: "Pleiku", lat: 13.9879, lng: 108.0134, region: "Tây Nguyên" },
  { name: "Cà Mau", lat: 9.1769, lng: 105.1526, region: "Nam" },
  { name: "Bắc Giang", lat: 21.2731, lng: 106.1947, region: "Bắc" },
  { name: "Vinh Long", lat: 10.2537, lng: 105.9722, region: "Nam" },
  { name: "Sóc Trăng", lat: 9.6037, lng: 105.9747, region: "Nam" }
];

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

// 🧠 Rút gọn địa chỉ Việt Nam
function simplifyVietnameseAddress(address) {
  if (!address) return "";

  const blacklist = [
    "nhà trọ",
    "hẻm",
    "tổ",
    "số",
    "ngõ",
    "ngách",
    "khu",
    "block",
    "tòa",
    "lầu",
    "phòng",
    "apartment",
    "kiệt",
    "ấp",
    "xóm",
    "dãy",
    "bãi",
    "bến",
    "chung cư",
    "building",
    "villa",
    "residence",
    "zone",
    "group",
    "cluster",
    "lot",
    "section",
    "unit",
    "floor",
    "room",
    "suite",
    "tower",
    "area",
    "sector",
    "lane",
    "alley",
  ];

  let parts = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Keep only the most important parts (ward, district, province)
  parts = parts.filter(
    (part) => !blacklist.some((word) => part.toLowerCase().includes(word))
  );

  // Take last 4 parts which are typically the most important for geocoding
  const simplifiedParts = parts.slice(-4);

  // If we have a province name, make sure it's included
  const provinces = [
    "Hà Nội",
    "TP HCM",
    "Hồ Chí Minh",
    "Đà Nẵng",
    "Hải Phòng",
    "Cần Thơ",
    "An Giang",
    "Bà Rịa - Vũng Tàu",
    "Bắc Giang",
    "Bắc Kạn",
    "Bạc Liêu",
    "Bắc Ninh",
    "Bến Tre",
    "Bình Định",
    "Bình Dương",
    "Bình Phước",
    "Bình Thuận",
    "Cà Mau",
    "Cao Bằng",
    "Đắk Lắk",
    "Đắk Nông",
    "Điện Biên",
    "Đồng Nai",
    "Đồng Tháp",
    "Gia Lai",
    "Hà Giang",
    "Hà Nam",
    "Hà Tĩnh",
    "Hải Dương",
    "Hậu Giang",
    "Hòa Bình",
    "Hưng Yên",
    "Khánh Hòa",
    "Kiên Giang",
    "Kon Tum",
    "Lai Châu",
    "Lâm Đồng",
    "Lạng Sơn",
    "Lào Cai",
    "Long An",
    "Nam Định",
    "Nghệ An",
    "Ninh Bình",
    "Ninh Thuận",
    "Phú Thọ",
    "Phú Yên",
    "Quảng Bình",
    "Quảng Nam",
    "Quảng Ngãi",
    "Quảng Ninh",
    "Quảng Trị",
    "Sóc Trăng",
    "Sơn La",
    "Tây Ninh",
    "Thái Bình",
    "Thái Nguyên",
    "Thanh Hóa",
    "Thừa Thiên Huế",
    "Tiền Giang",
    "Trà Vinh",
    "Tuyên Quang",
    "Vĩnh Long",
    "Vĩnh Phúc",
    "Yên Bái",
  ];

  // Check if any province is in the address
  const hasProvince = provinces.some((province) =>
    address.toLowerCase().includes(province.toLowerCase())
  );

  // If no province found, add "Việt Nam" to help with geocoding
  if (!hasProvince && !address.toLowerCase().includes("việt nam")) {
    simplifiedParts.push("Việt Nam");
  }

  return simplifiedParts.join(", ");
}

// 🗺️ Geocoding với Mapbox
export async function geocodeWithMapbox(address) {
  if (!MAPBOX_API_KEY) {
    console.error("Cannot use Mapbox geocoding: API key is missing");
    return null;
  }

  try {
    const simplified = simplifyVietnameseAddress(address);
    const encoded = encodeURIComponent(simplified);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`;

    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_API_KEY,
        country: "vn",
        limit: 1,
        language: "vi",
        types: "address,place,locality,district,region",
      },
    });

    const feature = response.data?.features?.[0];
    if (!feature) {
      console.warn("Mapbox không tìm thấy địa chỉ.");
      return null;
    }

    const [lng, lat] = feature.center;

    // Validate that coordinates are within Vietnam's bounds
    if (lat < 8.18 || lat > 23.39 || lng < 102.14 || lng > 109.46) {
      console.warn("Mapbox coordinates outside Vietnam bounds:", lat, lng);
      return null;
    }

    return {
      lat,
      lng,
      fullAddress: feature.place_name,
      source: "mapbox",
    };
  } catch (err) {
    if (err.response?.status === 401) {
      console.error(
        "Mapbox API key is invalid or expired. Please check your VITE_MAPBOX_API_KEY"
      );
    } else {
      console.error("Lỗi Mapbox:", err?.response?.data || err.message);
    }
    return null;
  }
}

// 🗺️ Geocoding với OpenStreetMap
export async function geocodeWithOSM(address) {
  try {
    // Simplify the address first
    const simplified = simplifyVietnameseAddress(address);

    // Add Vietnam to the address if not present
    const addressWithCountry = simplified.includes("Việt Nam")
      ? simplified
      : `${simplified}, Việt Nam`;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      addressWithCountry
    )}&format=json&addressdetails=1&limit=1&countrycodes=vn`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "kit10012003@gmail.com",
        "Accept-Language": "vi,en",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data?.[0]) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        fullAddress: data[0].display_name,
        source: "osm",
      };

      // Validate coordinates
      if (isNaN(result.lat) || isNaN(result.lng)) {
        console.warn("OSM returned invalid coordinates");
        return null;
      }

      // Validate that coordinates are within Vietnam's bounds
      if (
        result.lat < 8.18 ||
        result.lat > 23.39 ||
        result.lng < 102.14 ||
        result.lng > 109.46
      ) {
        console.warn(
          "OSM coordinates outside Vietnam bounds:",
          result.lat,
          result.lng
        );
        return null;
      }

      return result;
    }

    console.warn("OSM không tìm thấy địa chỉ.");
    return null;
  } catch (err) {
    console.error("Lỗi OSM:", err.message);
    return null;
  }
}

// Thử geocoding với Mapbox, nếu không được thì dùng OpenStreetMap
export async function geocodeAddress(inputAddress) {
  // Thử với Mapbox trước
  let result = await geocodeWithMapbox(inputAddress);
  
  // Nếu Mapbox không trả kết quả, thử với OpenStreetMap
  if (!result) {
    result = await geocodeWithOSM(inputAddress);
  }
  
  // Nếu cả hai đều thất bại, thử với địa chỉ đơn giản hóa
  if (!result) {
    const simplifiedAddress = inputAddress
      .split(",")
      .slice(-3)
      .join(",")
      .trim();
      
    if (simplifiedAddress && simplifiedAddress !== inputAddress) {
      result = await geocodeWithMapbox(simplifiedAddress);
      
      if (!result) {
        result = await geocodeWithOSM(simplifiedAddress);
      }
    }
  }
  
  return result;
}

// Hàm geocoding có debounce để tránh gọi quá nhiều API
export const geocodeAddressDebounced = (() => {
  let timeout = null;

  return (address, callback, delay = 500) => {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(async () => {
      try {
        const result = await geocodeAddress(address);
        if (callback && typeof callback === 'function') {
          callback(result);
        }
        return result;
      } catch (error) {
        console.error('Lỗi khi geocoding địa chỉ:', error);
        if (callback && typeof callback === 'function') {
          callback(null);
        }
        return null;
      }
    }, delay);
  };
})();

// Tính khoảng cách giữa hai điểm địa lý sử dụng công thức haversine
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Bán kính trái đất tính bằng kilômét
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Khoảng cách tính bằng km
  return d;
};

/**
 * Tạo lộ trình qua các kho trung chuyển dựa vào vị trí cửa hàng và khách hàng
 * @param {Object} shopLocation - Vị trí cửa hàng {lat, lng, address}
 * @param {Object} customerLocation - Vị trí khách hàng {lat, lng, address}
 * @returns {Array} - Danh sách các kho trung chuyển với thời gian
 */
export const generateWarehouseRoute = (shopLocation, customerLocation) => {
  if (!customerLocation) {
    console.error("Thiếu thông tin vị trí khách hàng");
    return [];
  }
  
  // Nếu không có shopLocation được chỉ định, chọn chi nhánh gần nhất với khách hàng
  const sourceBranch = shopLocation || getNearestBranch(customerLocation.lat, customerLocation.lng);
  
  // Tính khoảng cách giữa cửa hàng và khách hàng
  const distance = calculateDistance(
    sourceBranch.lat, sourceBranch.lng,
    customerLocation.lat, customerLocation.lng
  );
  
  // Số lượng kho trung chuyển phụ thuộc vào khoảng cách
  let numWarehouses;
  if (distance < 50) {
    numWarehouses = 1; // Dưới 50km, chỉ cần 1 kho
  } else if (distance < 200) {
    numWarehouses = 2; // 50-200km, cần 2 kho
  } else if (distance < 500) {
    numWarehouses = 3; // 200-500km, cần 3 kho
  } else {
    numWarehouses = 4; // Trên 500km, cần 4 kho
  }
  
  // Tìm các thành phố nằm trên đường đi
  const citiesOnRoute = findCitiesOnRoute(sourceBranch, customerLocation, numWarehouses);
  
  // Tạo thời gian bắt đầu (2 giờ trước)
  const now = new Date();
  const startTime = new Date(now);
  startTime.setHours(startTime.getHours() - 2);
  
  // Tạo danh sách các kho với thời gian
  const warehouses = citiesOnRoute.map((city, index) => {
    const warehouseAddress = `Kho trung chuyển ${city.name}, ${city.name}`;
    
    // Tính toán thời gian đến và đi
    // Mỗi chặng mất khoảng 2-4 giờ tùy thuộc vào khoảng cách
    const hoursBetweenWarehouses = Math.ceil(distance / (numWarehouses + 1) / 30) + 1; // 30km/h trung bình
    
    // Thời gian ở lại kho là 1-2 giờ
    const hoursAtWarehouse = Math.floor(Math.random() * 2) + 1;
    
    // Tính thời gian đến
    const arrivalTime = new Date(startTime);
    arrivalTime.setHours(arrivalTime.getHours() + (index + 1) * hoursBetweenWarehouses);
    
    // Tính thời gian đi
    const departureTime = new Date(arrivalTime);
    departureTime.setHours(departureTime.getHours() + hoursAtWarehouse);
    
    return {
      name: `Kho ${city.name}`,
      address: warehouseAddress,
      lat: city.lat,
      lng: city.lng,
      arrivalTime: arrivalTime.toISOString(),
      departureTime: departureTime.toISOString()
    };
  });
  
  return warehouses;
};

/**
 * Tìm các thành phố nằm trên đường đi từ cửa hàng đến khách hàng
 * @param {Object} origin - Vị trí cửa hàng
 * @param {Object} destination - Vị trí khách hàng
 * @param {Number} numWarehouses - Số lượng kho cần tìm
 * @returns {Array} - Danh sách các thành phố làm kho trung chuyển
 */
export const findCitiesOnRoute = (origin, destination, numWarehouses) => {
  // Tìm các thành phố phù hợp cho việc vận chuyển trong khu vực
  const cities = [...VIETNAM_MAJOR_CITIES];
  
  // Ưu tiên các thành phố trong khu vực Nam Bộ (vì chi nhánh ở Cần Thơ và Sóc Trăng)
  const mekongDeltaCities = cities.filter(city => 
    city.region === "Nam" || 
    ["Cần Thơ", "Sóc Trăng", "Vĩnh Long", "Cà Mau", "Bạc Liêu", "Kiên Giang", "An Giang"].includes(city.name)
  );
  
  // Tính toán khoảng cách từ mỗi thành phố đến đường thẳng
  const citiesWithDistance = mekongDeltaCities.map(city => {
    const distance = distanceFromPointToLine(
      city.lat, city.lng,
      origin.lat, origin.lng,
      destination.lat, destination.lng
    );
    
    // Tính khoảng cách từ thành phố đến điểm xuất phát
    const distanceFromOrigin = calculateDistance(
      origin.lat, origin.lng,
      city.lat, city.lng
    );
    
    // Tính khoảng cách từ thành phố đến điểm đích
    const distanceFromDestination = calculateDistance(
      destination.lat, destination.lng,
      city.lat, city.lng
    );
    
    // Tính tổng khoảng cách đi qua thành phố
    const totalRouteDistance = distanceFromOrigin + distanceFromDestination;
    
    // Khoảng cách đi trực tiếp từ xuất phát đến đích
    const directDistance = calculateDistance(
      origin.lat, origin.lng,
      destination.lat, destination.lng
    );
    
    // Đánh giá độ phù hợp làm điểm trung chuyển dựa trên vị trí
    const detourFactor = totalRouteDistance / (directDistance || 1);
    
    return {
      ...city,
      distanceFromLine: distance,
      distanceFromOrigin,
      distanceFromDestination,
      detourFactor
    };
  });
  
  // Lọc bỏ thành phố trùng với điểm đầu và điểm cuối và chỉ chọn các thành phố hợp lý 
  const filteredCities = citiesWithDistance.filter(city => {
    const isOrigin = calculateDistance(city.lat, city.lng, origin.lat, origin.lng) < 10;
    const isDestination = calculateDistance(city.lat, city.lng, destination.lat, destination.lng) < 10;
    
    // Không làm tăng quãng đường quá 40% so với đường thẳng
    return !isOrigin && !isDestination && city.detourFactor < 1.4;
  });
  
  // Sắp xếp theo khoảng cách từ điểm xuất phát và độ phù hợp
  const sortedCities = filteredCities.sort((a, b) => {
    // Nếu khoảng cách từ nguồn tương đương, ưu tiên thành phố gần đường thẳng hơn
    if (Math.abs(a.distanceFromOrigin - b.distanceFromOrigin) < 20) {
      return a.distanceFromLine - b.distanceFromLine;
    }
    return a.distanceFromOrigin - b.distanceFromOrigin;
  });
  
  // Chọn số lượng thành phố cần thiết
  const selectedCities = sortedCities.slice(0, numWarehouses);
  
  // Nếu không đủ thành phố, tạo các điểm trung gian
  if (selectedCities.length < numWarehouses) {
    const missingCount = numWarehouses - selectedCities.length;
    
    for (let i = 0; i < missingCount; i++) {
      // Tính toán vị trí trung gian dựa trên tỷ lệ
      const ratio = (i + 1) / (missingCount + 1);
      const lat = origin.lat + (destination.lat - origin.lat) * ratio;
      const lng = origin.lng + (destination.lng - origin.lng) * ratio;
      
      // Tìm tỉnh/thành phố gần nhất trong miền Nam
      const nearestCity = mekongDeltaCities.reduce((nearest, city) => {
        const distance = calculateDistance(lat, lng, city.lat, city.lng);
        if (!nearest || distance < nearest.distance) {
          return { ...city, distance };
        }
        return nearest;
      }, null);
      
      // Thêm kho ảo gần thành phố này
      if (nearestCity) {
        selectedCities.push({
          name: `${nearestCity.name}`,
          lat: lat,
          lng: lng,
          region: nearestCity.region
        });
      }
    }
    
    // Sắp xếp lại theo khoảng cách
    selectedCities.sort((a, b) => {
      const distA = calculateDistance(origin.lat, origin.lng, a.lat, a.lng);
      const distB = calculateDistance(origin.lat, origin.lng, b.lat, b.lng);
      return distA - distB;
    });
  }
  
  return selectedCities;
};

/**
 * Tính khoảng cách từ một điểm đến một đường thẳng
 * @param {Number} pLat - Vĩ độ của điểm
 * @param {Number} pLng - Kinh độ của điểm
 * @param {Number} lineLat1 - Vĩ độ điểm đầu đường thẳng
 * @param {Number} lineLng1 - Kinh độ điểm đầu đường thẳng
 * @param {Number} lineLat2 - Vĩ độ điểm cuối đường thẳng
 * @param {Number} lineLng2 - Kinh độ điểm cuối đường thẳng
 * @returns {Number} - Khoảng cách (km) từ điểm đến đường thẳng
 */
export const distanceFromPointToLine = (pLat, pLng, lineLat1, lineLng1, lineLat2, lineLng2) => {
  // Chuyển đổi sang tọa độ Cartesian đơn giản (đủ chính xác cho khoảng cách ngắn)
  // Chuyển đổi độ sang radian
  const pLatRad = pLat * Math.PI / 180;
  const pLngRad = pLng * Math.PI / 180;
  const lat1Rad = lineLat1 * Math.PI / 180;
  const lng1Rad = lineLng1 * Math.PI / 180;
  const lat2Rad = lineLat2 * Math.PI / 180;
  const lng2Rad = lineLng2 * Math.PI / 180;
  
  // Bán kính trái đất (km)
  const R = 6371;
  
  // Chuyển sang tọa độ Cartesian
  const x = R * Math.cos(pLatRad) * Math.cos(pLngRad);
  const y = R * Math.cos(pLatRad) * Math.sin(pLngRad);
  const z = R * Math.sin(pLatRad);
  
  const x1 = R * Math.cos(lat1Rad) * Math.cos(lng1Rad);
  const y1 = R * Math.cos(lat1Rad) * Math.sin(lng1Rad);
  const z1 = R * Math.sin(lat1Rad);
  
  const x2 = R * Math.cos(lat2Rad) * Math.cos(lng2Rad);
  const y2 = R * Math.cos(lat2Rad) * Math.sin(lng2Rad);
  const z2 = R * Math.sin(lat2Rad);
  
  // Vector từ điểm 1 đến điểm 2
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  
  // Độ dài vector
  const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
  
  // Vector đơn vị
  const ux = dx / length;
  const uy = dy / length;
  const uz = dz / length;
  
  // Vector từ điểm 1 đến điểm P
  const px = x - x1;
  const py = y - y1;
  const pz = z - z1;
  
  // Tích vô hướng để tìm điểm chiếu
  const dot = px*ux + py*uy + pz*uz;
  
  // Kiểm tra xem điểm chiếu có nằm trên đoạn thẳng không
  if (dot < 0) {
    // Điểm gần điểm 1 hơn
    return calculateDistance(pLat, pLng, lineLat1, lineLng1);
  } else if (dot > length) {
    // Điểm gần điểm 2 hơn
    return calculateDistance(pLat, pLng, lineLat2, lineLng2);
  } else {
    // Điểm chiếu nằm trên đoạn thẳng
    const projX = x1 + ux * dot;
    const projY = y1 + uy * dot;
    const projZ = z1 + uz * dot;
    
    // Tính khoảng cách từ điểm đến điểm chiếu
    const distance = Math.sqrt((x-projX)*(x-projX) + (y-projY)*(y-projY) + (z-projZ)*(z-projZ));
    return distance;
  }
};

/**
 * Tạo một đơn hàng mẫu cho mục đích demo
 * @param {string} orderId - Mã đơn hàng
 * @returns {Object} Đơn hàng mẫu
 */
export function generateMockOrder(orderId = null) {
  // Danh sách sản phẩm mẫu
  const sampleProducts = [
    {
      _id: '1',
      name: 'Thịt bò Wagyu A5',
      image: 'https://via.placeholder.com/200x200?text=Wagyu',
      unit: 'kg',
      price: 1200000
    },
    {
      _id: '2',
      name: 'Rau cải thìa hữu cơ',
      image: 'https://via.placeholder.com/200x200?text=Rau',
      unit: 'bó',
      price: 25000
    },
    {
      _id: '3',
      name: 'Cá hồi Na Uy',
      image: 'https://via.placeholder.com/200x200?text=Ca',
      unit: 'kg',
      price: 350000
    },
    {
      _id: '4',
      name: 'Nấm hương rừng',
      image: 'https://via.placeholder.com/200x200?text=Nam',
      unit: 'hộp',
      price: 85000
    },
    {
      _id: '5',
      name: 'Trứng gà tươi',
      image: 'https://via.placeholder.com/200x200?text=Trung',
      unit: 'vỉ',
      price: 45000
    }
  ];
  
  // Ngẫu nhiên chọn 1-3 sản phẩm
  const numProducts = Math.floor(Math.random() * 3) + 1;
  const selectedProducts = [];
  
  // Không chọn lặp sản phẩm
  const usedIndices = new Set();
  
  for (let i = 0; i < numProducts; i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * sampleProducts.length);
    } while (usedIndices.has(randomIndex));
    
    usedIndices.add(randomIndex);
    const product = sampleProducts[randomIndex];
    
    // Tạo item với thông tin sản phẩm
    selectedProducts.push({
      _id: `item_${i + 1}`,
      product: product,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: product.price,
      discountAmount: Math.random() > 0.7 ? Math.floor(product.price * 0.1) : 0
    });
  }
  
  // Tính tổng tiền
  let subtotal = 0;
  for (const item of selectedProducts) {
    subtotal += (item.price * item.quantity - item.discountAmount);
  }
  
  // Phí vận chuyển và thuế
  const shippingFee = Math.floor(Math.random() * 50000) + 20000;
  const tax = Math.floor(subtotal * 0.08);
  const discount = Math.random() > 0.5 ? Math.floor(subtotal * 0.05) : 0;
  
  // Tổng thanh toán
  const totalAmount = subtotal + shippingFee + tax - discount;
  
  // Ngày đặt hàng
  const orderDate = new Date();
  orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 5));
  
  // Ngày giao hàng dự kiến
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 5) + 3);
  
  // Địa chỉ trong khu vực miền Tây Nam Bộ
  const addresses = [
    'Quận Ninh Kiều, Cần Thơ, Việt Nam',
    'Quận Cái Răng, Cần Thơ, Việt Nam',
    'Quận Bình Thủy, Cần Thơ, Việt Nam',
    'Quận Ô Môn, Cần Thơ, Việt Nam',
    'Huyện Kế Sách, Sóc Trăng, Việt Nam',
    'Thành phố Sóc Trăng, Sóc Trăng, Việt Nam',
    'Thành phố Long Xuyên, An Giang, Việt Nam',
    'Thành phố Châu Đốc, An Giang, Việt Nam',
    'Thành phố Rạch Giá, Kiên Giang, Việt Nam',
    'Thành phố Vĩnh Long, Vĩnh Long, Việt Nam',
    'Thành phố Cà Mau, Cà Mau, Việt Nam',
    'Thành phố Bạc Liêu, Bạc Liêu, Việt Nam'
  ];
  
  const randomAddressIndex = Math.floor(Math.random() * addresses.length);
  
  // Phương thức thanh toán
  const paymentMethods = ['cod', 'banking', 'momo', 'zalopay', 'vnpay'];
  const randomPaymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  
  // Trạng thái đơn hàng
  const orderStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'completed'];
  const randomStatus = orderStatuses[Math.floor(Math.random() * (orderStatuses.length - 1))]; // Loại trừ trạng thái canceled
  
  // Tọa độ khách hàng dựa trên khu vực
  let customerLat, customerLng;
  const selectedAddress = addresses[randomAddressIndex];
  
  // Gán tọa độ tương đối chính xác cho từng khu vực
  if (selectedAddress.includes('Cần Thơ')) {
    customerLat = 10.0339 + (Math.random() * 0.05 - 0.025);
    customerLng = 105.7855 + (Math.random() * 0.05 - 0.025);
  } else if (selectedAddress.includes('Sóc Trăng')) {
    customerLat = 9.6037 + (Math.random() * 0.05 - 0.025);
    customerLng = 105.9747 + (Math.random() * 0.05 - 0.025);
  } else if (selectedAddress.includes('An Giang')) {
    customerLat = 10.3866 + (Math.random() * 0.05 - 0.025);
    customerLng = 105.4352 + (Math.random() * 0.05 - 0.025);
  } else if (selectedAddress.includes('Kiên Giang')) {
    customerLat = 10.0222 + (Math.random() * 0.05 - 0.025);
    customerLng = 105.0914 + (Math.random() * 0.05 - 0.025);
  } else if (selectedAddress.includes('Vĩnh Long')) {
    customerLat = 10.2537 + (Math.random() * 0.05 - 0.025);
    customerLng = 105.9722 + (Math.random() * 0.05 - 0.025);
  } else if (selectedAddress.includes('Cà Mau')) {
    customerLat = 9.1769 + (Math.random() * 0.05 - 0.025);
    customerLng = 105.1526 + (Math.random() * 0.05 - 0.025);
  } else if (selectedAddress.includes('Bạc Liêu')) {
    customerLat = 9.2941 + (Math.random() * 0.05 - 0.025);
    customerLng = 105.7216 + (Math.random() * 0.05 - 0.025);
        } else {
    // Mặc định sẽ là một vị trí ngẫu nhiên trong khu vực Cần Thơ
    customerLat = 10.0339 + (Math.random() * 0.1 - 0.05);
    customerLng = 105.7855 + (Math.random() * 0.1 - 0.05);
  }
  
  return {
    _id: orderId || `ORDER${Math.floor(Math.random() * 900000) + 100000}`,
    items: selectedProducts,
    shippingAddress: selectedAddress,
    paymentMethod: randomPaymentMethod,
    shippingFee: shippingFee,
    tax: tax,
    discount: discount,
    subtotal: subtotal,
    totalAmount: totalAmount,
    status: randomStatus,
    createdAt: orderDate.toISOString(),
    estimatedDelivery: deliveryDate.toISOString(),
    customerLocation: {
      lat: customerLat,
      lng: customerLng,
      address: selectedAddress
    },
    // Thêm chi nhánh xử lý đơn hàng
    branch: selectedAddress.includes('Sóc Trăng') ? 'soctrang' : 'cantho'
  };
}

/**
 * Format date thành chuỗi ngày tháng tiếng Việt
 * @param {string|Date} date - Ngày cần format
 * @returns {string} Chuỗi ngày tháng đã được format
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format số tiền thành định dạng tiền tệ VND
 * @param {number} amount - Số tiền cần format
 * @returns {string} Chuỗi tiền tệ đã được format
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
};
