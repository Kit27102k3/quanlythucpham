import React, { useState } from "react";
import { API_BASE_URL } from '../../config/apiConfig';

export default function FetchProductData() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/scrape?url=${encodeURIComponent(url)}`
      );
  
      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status}`);
      }
  
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Lỗi khi fetch hoặc parse JSON:", error);
    }
  };
  

  return (
    <div>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Nhập URL sản phẩm..."
        className="border p-2"
      />
      <button onClick={fetchData} className="bg-blue-500 text-white p-2 ml-2">
        Lấy Thông Tin
      </button>

      {data && (
        <div className="mt-4 border p-4">
          <img
            src={data.image}
            alt={data.title}
            className="w-48 h-48 object-cover"
          />
          <h3 className="text-lg font-bold">{data.title}</h3>
          <p className="text-sm">{data.description}</p>
        </div>
      )}
    </div>
  );
}
