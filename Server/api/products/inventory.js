export const config = {
  runtime: 'edge',
  regions: ['sin1'] // Singapore region for lower latency
};

/**
 * API endpoint trả về dữ liệu tồn kho sản phẩm
 * 
 * @param {Request} request - The incoming request
 * @returns {Response} - JSON response with inventory data
 */
export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    // Dữ liệu mẫu cho sản phẩm tồn kho thấp
    const inventoryData = [
      { 
        name: "Trứng vịt", 
        category: "Trứng", 
        stock: 3, 
        status: "Sắp hết",
        price: 25000,
        sku: "TRU-VIT-001",
        image: "https://cdn.tgdd.vn/Products/Images/8072/234105/bhx/trung-vit-tuoi-khay-10-trung-202103031059483543.jpg"
      },
      { 
        name: "Cá hồi", 
        category: "Hải sản", 
        stock: 5, 
        status: "Sắp hết",
        price: 300000,
        sku: "CA-HOI-002",
        image: "https://cdn.tgdd.vn/Products/Images/8782/226867/bhx/ca-hoi-cat-khuc-khay-300g-202103031056515193.jpg"
      },
      { 
        name: "Bơ", 
        category: "Rau củ", 
        stock: 8, 
        status: "Còn hàng",
        price: 15000,
        sku: "RAU-BO-003",
        image: "https://cdn.tgdd.vn/Products/Images/8785/233942/bhx/bo-hass-trai-202103031057347583.jpg"
      },
      { 
        name: "Tôm", 
        category: "Hải sản", 
        stock: 10, 
        status: "Còn hàng",
        price: 180000,
        sku: "TOM-004",
        image: "https://cdn.tgdd.vn/Products/Images/8782/226866/bhx/tom-su-song-size-30-35-con-kg-202103031101412451.jpg"
      },
      { 
        name: "Thịt gà", 
        category: "Thịt tươi", 
        stock: 15, 
        status: "Còn hàng",
        price: 120000,
        sku: "THIT-GA-005",
        image: "https://cdn.tgdd.vn/Products/Images/8781/226865/bhx/dui-ga-goc-tu-dong-lanh-khay-500g-202103031052553553.jpg"
      },
      {
        name: "Cà chua",
        category: "Rau củ",
        stock: 12,
        status: "Còn hàng",
        price: 18000,
        sku: "RAU-CACHUA-006",
        image: "https://cdn.tgdd.vn/Products/Images/8785/233948/bhx/ca-chua-beef-300g-202103031057510103.jpg"
      },
      {
        name: "Cà rốt",
        category: "Rau củ",
        stock: 18,
        status: "Còn hàng",
        price: 12000,
        sku: "RAU-CAROT-007",
        image: "https://cdn.tgdd.vn/Products/Images/8785/233947/bhx/ca-rot-da-lat-tui-500g-202103031057427973.jpg"
      },
      {
        name: "Ớt chuông",
        category: "Rau củ",
        stock: 7,
        status: "Sắp hết",
        price: 22000,
        sku: "RAU-OT-008",
        image: "https://cdn.tgdd.vn/Products/Images/8785/233954/bhx/ot-chuong-do-tui-300g-202103031058308553.jpg"
      },
      {
        name: "Mì tôm",
        category: "Thực phẩm khô",
        stock: 20,
        status: "Còn hàng",
        price: 3500,
        sku: "MI-TOM-009",
        image: "https://cdn.tgdd.vn/Products/Images/2565/85959/bhx/mi-hao-hao-tom-chua-cay-goi-75g-202103031102107871.jpg"
      },
      {
        name: "Nước mắm",
        category: "Gia vị",
        stock: 16,
        status: "Còn hàng",
        price: 25000,
        sku: "GV-NUOCMAM-010",
        image: "https://cdn.tgdd.vn/Products/Images/2289/85959/bhx/nuoc-mam-nam-ngu-chai-500ml-202103031101563308.jpg"
      }
    ];
    
    // Sắp xếp theo số lượng tồn kho tăng dần
    const sortedInventory = [...inventoryData].sort((a, b) => a.stock - b.stock);
    
    // Trả về số lượng sản phẩm theo limit
    const limitedInventory = sortedInventory.slice(0, limit);
    
    return new Response(
      JSON.stringify({
        data: limitedInventory,
        success: true,
        total: inventoryData.length,
        limit
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
    console.error(`Error in inventory API: ${error.message}`);
    
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