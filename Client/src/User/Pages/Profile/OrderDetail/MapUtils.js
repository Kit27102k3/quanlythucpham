// src/utils/MapUtils.js
import axios from "axios";

// Get Mapbox API key from environment variable
const MAPBOX_API_KEY = "pk.eyJ1Ijoia2l0MjcxMCIsImEiOiJjbWF4bWh5YWQwc2N0MmtxM2p1M2Z5azZkIn0.navJSR4rbpRHVV3TEXelQg";

// Export Mapbox access token for use in other components
export const MAPBOX_ACCESS_TOKEN = MAPBOX_API_KEY;

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
    "Hà Nội", "TP HCM", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
    "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
    "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
    "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông", "Điện Biên",
    "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Tĩnh",
    "Hải Dương", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang",
    "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An",
    "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên",
    "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị",
    "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa",
    "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Vĩnh Long",
    "Vĩnh Phúc", "Yên Bái"
  ];
  
  // Check if any province is in the address
  const hasProvince = provinces.some(province => 
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

    console.log("Geocoding with Mapbox:", simplified);
    
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
    
    console.log("Mapbox geocoding successful:", feature.place_name);
    
    return {
      lat,
      lng,
      fullAddress: feature.place_name,
      source: "mapbox",
    };
  } catch (err) {
    if (err.response?.status === 401) {
      console.error("Mapbox API key is invalid or expired. Please check your VITE_MAPBOX_API_KEY");
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
      
    console.log("Geocoding with OSM:", addressWithCountry);

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
        console.warn("OSM coordinates outside Vietnam bounds:", result.lat, result.lng);
        return null;
      }
      
      console.log("OSM geocoding successful:", data[0].display_name);

      return result;
    }

    console.warn("OSM không tìm thấy địa chỉ.");
    return null;
  } catch (err) {
    console.error("Lỗi OSM:", err.message);
    return null;
  }
}

// 📦 Fallback: OSM trước, Mapbox sau
export const geocodeAddressDebounced = (() => {
  let timeout = null;
  const cache = new Map();

  return async (address, callback) => {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(async () => {
      try {
        if (!address || !address.trim()) {
          callback?.(null, "Địa chỉ trống");
          return;
        }

        const key = address.trim().toLowerCase();
        if (cache.has(key)) {
          console.log("Using in-memory cache for address:", address);
          callback?.(cache.get(key));
          return cache.get(key);
        }
        
        // Try to use localStorage cache if available
        try {
          const cacheKey = key.replace(/\s+/g, '_');
          const cachedLocations = JSON.parse(localStorage.getItem('geocoding_cache') || '{}');
          if (cachedLocations[cacheKey]) {
            const cachedResult = cachedLocations[cacheKey];
            // Check if cache is not too old (less than 30 days)
            const now = Date.now();
            if (cachedResult.timestamp && (now - cachedResult.timestamp < 30 * 24 * 60 * 60 * 1000)) {
              console.log("Using localStorage cache for address:", address);
              const result = {
                lat: cachedResult.lat,
                lng: cachedResult.lng,
                source: 'cache',
                fullAddress: address
              };
              cache.set(key, result);
              callback?.(result);
              return result;
            }
          }
        } catch (err) {
          console.error("Error reading from localStorage cache:", err);
        }

        // 1️⃣ Thử với OSM trước
        let result = await geocodeWithOSM(address);

        // 2️⃣ Nếu OSM fail, dùng Mapbox
        if (!result) {
          console.log("OSM failed, trying Mapbox...");
          result = await geocodeWithMapbox(address);
        }

        // 3️⃣ Nếu cả hai đều fail, thử với địa chỉ đơn giản hóa
        if (!result) {
          console.log("Both services failed, trying with simplified address...");
          const simplifiedAddress = address.split(',').slice(-3).join(',').trim();
          if (simplifiedAddress && simplifiedAddress !== address) {
            result = await geocodeWithOSM(simplifiedAddress);
            
            if (!result) {
              result = await geocodeWithMapbox(simplifiedAddress);
            }
          }
        }

        if (result) {
          cache.set(key, result);
          callback?.(result);
          
          // Also save to localStorage for persistent cache
          try {
            const cacheKey = key.replace(/\s+/g, '_');
            const cachedLocations = JSON.parse(localStorage.getItem('geocoding_cache') || '{}');
            cachedLocations[cacheKey] = {
              lat: result.lat,
              lng: result.lng,
              timestamp: Date.now()
            };
            localStorage.setItem('geocoding_cache', JSON.stringify(cachedLocations));
          } catch (err) {
            console.error("Error saving to localStorage cache:", err);
          }
        } else {
          console.error("All geocoding attempts failed for address:", address);
          callback?.(null, "Không tìm thấy tọa độ");
        }

        return result;
      } catch (err) {
        console.error("Lỗi geocode:", err);
        callback?.(null, err.message);
        return null;
      }
    }, 300); // Reduced debounce time for faster response
  };
})();

// 🏪 Địa chỉ mặc định cửa hàng
export const SHOP_LOCATION = {
  lat: 10.0070868,
  lng: 105.7683238,
  name: "DNC Food - Nông Trại Hữu Cơ",
  address:
    "Đại học Nam Cần Thơ, Nguyễn Văn Cừ nối dài, phường An Bình, quận Ninh Kiều, Cần Thơ",
};
