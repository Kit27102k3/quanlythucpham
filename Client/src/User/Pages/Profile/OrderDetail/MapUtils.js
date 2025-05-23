// src/utils/MapUtils.js
import axios from "axios";

// Get Mapbox API key from environment variable
const MAPBOX_API_KEY = "pk.eyJ1Ijoia2l0MjcxMCIsImEiOiJjbWF4bWh5YWQwc2N0MmtxM2p1M2Z5azZkIn0.navJSR4rbpRHVV3TEXelQg";

// 🧠 Rút gọn địa chỉ Việt Nam
function simplifyVietnameseAddress(address) {
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
  parts = parts.filter(
    (part) => !blacklist.some((word) => part.toLowerCase().includes(word))
  );
  return parts.slice(-4).join(", ");
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
        console.warn("OSM coordinates outside Vietnam bounds");
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
          callback?.(cache.get(key));
          return cache.get(key);
        }

        // 1️⃣ Thử với OSM trước
        let result = await geocodeWithOSM(address);

        // 2️⃣ Nếu OSM fail, dùng Mapbox
        if (!result) {
          console.log("OSM failed, trying Mapbox...");
          result = await geocodeWithMapbox(address);
        }

        if (result) {
          cache.set(key, result);
          callback?.(result);
        } else {
          callback?.(null, "Không tìm thấy tọa độ");
        }

        return result;
      } catch (err) {
        console.error("Lỗi geocode:", err);
        callback?.(null, err.message);
        return null;
      }
    }, 500);
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
