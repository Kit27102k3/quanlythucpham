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
    
    // Trả về thông báo lỗi vì API này không kết nối với database thực
    return new Response(
      JSON.stringify({
        success: false,
        message: "API này không kết nối với database thực. Vui lòng sử dụng API chính của hệ thống.",
        data: []
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
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
        success: false,
        data: []
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