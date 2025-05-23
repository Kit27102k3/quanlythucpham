interface ImportMetaEnv {
  VITE_API_URL: string;
  VITE_MAPBOX_ACCESS_TOKEN: string;
  VITE_POSITIONSTACK_API_KEY: string;
  VITE_GEOAPIFY_API_KEY: string;
  VITE_GOOGLE_MAPS_API_KEY: string;
  
  // Thông tin cửa hàng
  VITE_SHOP_LAT: string;
  VITE_SHOP_LNG: string;
  VITE_SHOP_NAME: string;
  VITE_SHOP_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 