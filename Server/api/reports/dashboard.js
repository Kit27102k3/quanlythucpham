export const config = {
  runtime: 'edge',
  regions: ['sin1'] // Singapore region for lower latency
};

/**
 * API endpoint trả về dữ liệu tổng quan cho dashboard
 * 
 * @param {Request} request - The incoming request
 * @returns {Response} - JSON response with dashboard data
 */
export default async function handler(request) {
  try {
    // Generate sample data for dashboard
    const dashboardData = {
      totalOrders: 1250,
      totalRevenue: 75000000,
      totalProducts: 120,
      totalCustomers: 450,
      recentActivities: [
        {
          id: 1,
          type: 'order',
          user: 'Nguyễn Văn A',
          action: 'đã đặt đơn hàng #ORD12345',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
        },
        {
          id: 2,
          type: 'login',
          user: 'Admin',
          action: 'đã đăng nhập vào hệ thống',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          id: 3,
          type: 'product',
          user: 'Admin',
          action: 'đã thêm sản phẩm mới "Thịt bò Úc"',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 minutes ago
        },
        {
          id: 4,
          type: 'order',
          user: 'Trần Thị B',
          action: 'đã đặt đơn hàng #ORD12344',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
        },
        {
          id: 5,
          type: 'inventory',
          user: 'Admin',
          action: 'đã cập nhật tồn kho sản phẩm "Rau muống"',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() // 1.5 hours ago
        }
      ],
      salesByCategory: [
        { category: 'Thịt tươi', sales: 25000000 },
        { category: 'Rau củ', sales: 15000000 },
        { category: 'Hải sản', sales: 20000000 },
        { category: 'Trứng', sales: 5000000 },
        { category: 'Gia vị', sales: 10000000 }
      ],
      orderStatus: {
        pending: 15,
        processing: 25,
        completed: 950,
        cancelled: 10
      }
    };
    
    return new Response(
      JSON.stringify({
        data: dashboardData,
        success: true
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
    console.error(`Error in dashboard API: ${error.message}`);
    
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