import mongoose from 'mongoose';

export const config = {
  runtime: 'edge',
  regions: ['sin1'] // Singapore region for lower latency
};

/**
 * API endpoint trả về danh sách sản phẩm bán chạy nhất
 * 
 * @param {Request} request - The incoming request
 * @returns {Response} - JSON response with top products data
 */
export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    
    // Dữ liệu mẫu cho sản phẩm bán chạy
    const topProducts = [
      { 
        name: "Thịt heo", 
        category: "Thịt tươi", 
        sold: 120, 
        revenue: 12000000, 
        price: 100000, 
        stock: 50,
        image: "https://cdn.tgdd.vn/Products/Images/8781/222893/bhx/thit-nac-vai-heo-khay-500g-202103031051054021.jpg"
      },
      { 
        name: "Thịt bò", 
        category: "Thịt tươi", 
        sold: 85, 
        revenue: 17000000, 
        price: 200000, 
        stock: 30,
        image: "https://cdn.tgdd.vn/Products/Images/8781/228329/bhx/thit-ba-chi-bo-my-khay-300g-202103031058264362.jpg"
      },
      { 
        name: "Cá thu", 
        category: "Hải sản", 
        sold: 67, 
        revenue: 6700000, 
        price: 100000, 
        stock: 25,
        image: "https://cdn.tgdd.vn/Products/Images/8782/226864/bhx/ca-thu-cat-khuc-khay-300g-202103031056031782.jpg"
      },
      { 
        name: "Rau muống", 
        category: "Rau củ", 
        sold: 55, 
        revenue: 1100000, 
        price: 20000, 
        stock: 100,
        image: "https://cdn.tgdd.vn/Products/Images/8785/233955/bhx/rau-muong-cat-khuc-goi-300g-202103031058393183.jpg"
      },
      { 
        name: "Trứng gà", 
        category: "Trứng", 
        sold: 45, 
        revenue: 900000, 
        price: 20000, 
        stock: 200,
        image: "https://cdn.tgdd.vn/Products/Images/8072/233786/bhx/trung-ga-happy-egg-hop-10-trung-202103031059167031.jpg"
      },
      { 
        name: "Tôm sú", 
        category: "Hải sản", 
        sold: 38, 
        revenue: 3800000, 
        price: 100000, 
        stock: 45,
        image: "https://cdn.tgdd.vn/Products/Images/8782/226866/bhx/tom-su-song-size-30-35-con-kg-202103031101412451.jpg"
      },
      { 
        name: "Nước mắm", 
        category: "Gia vị", 
        sold: 35, 
        revenue: 700000, 
        price: 20000, 
        stock: 150,
        image: "https://cdn.tgdd.vn/Products/Images/2289/85959/bhx/nuoc-mam-nam-ngu-chai-500ml-202103031101563308.jpg"
      }
    ];
    
    // Trả về số lượng sản phẩm theo limit
    const limitedProducts = topProducts.slice(0, limit);
    
    return new Response(
      JSON.stringify({
        data: limitedProducts,
        success: true,
        total: topProducts.length,
        limit: limit
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  } catch (error) {
    console.error(`Error in top-products API: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        success: false
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
} 