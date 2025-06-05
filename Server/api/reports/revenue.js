export const config = {
  runtime: 'edge',
  regions: ['sin1'] // Singapore region for lower latency
};

/**
 * API endpoint trả về dữ liệu doanh thu theo thời gian
 * 
 * @param {Request} request - The incoming request
 * @returns {Response} - JSON response with revenue data
 */
export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || 'week';
    const paymentMethod = url.searchParams.get('paymentMethod') || 'all';
    const region = url.searchParams.get('region') || 'all';
    
    // Generate sample data based on time range
    let revenueData = [];
    const today = new Date();
    
    if (timeRange === 'week') {
      // Generate data for the past 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        revenueData.push({
          date: date.toISOString().split('T')[0],
          doanh_thu: Math.floor(Math.random() * 5000000) + 1000000,
          don_hang: Math.floor(Math.random() * 20) + 5
        });
      }
    } else if (timeRange === 'month') {
      // Generate data for the past 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        revenueData.push({
          date: date.toISOString().split('T')[0],
          doanh_thu: Math.floor(Math.random() * 5000000) + 1000000,
          don_hang: Math.floor(Math.random() * 20) + 5
        });
      }
    } else if (timeRange === 'year') {
      // Generate data for the past 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        
        revenueData.push({
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          doanh_thu: Math.floor(Math.random() * 50000000) + 10000000,
          don_hang: Math.floor(Math.random() * 200) + 50
        });
      }
    }
    
    // Filter by payment method if specified
    if (paymentMethod !== 'all') {
      // In a real implementation, we would filter by payment method
      // For this sample data, we'll just adjust the revenue slightly
      revenueData = revenueData.map(item => ({
        ...item,
        doanh_thu: paymentMethod === 'cash' ? item.doanh_thu * 0.7 : item.doanh_thu * 0.3
      }));
    }
    
    // Filter by region if specified
    if (region !== 'all') {
      // In a real implementation, we would filter by region
      // For this sample data, we'll just adjust the revenue slightly
      const regionMultipliers = {
        'north': 0.4,
        'central': 0.3,
        'south': 0.3
      };
      
      const multiplier = regionMultipliers[region] || 0.33;
      
      revenueData = revenueData.map(item => ({
        ...item,
        doanh_thu: item.doanh_thu * multiplier
      }));
    }
    
    return new Response(
      JSON.stringify({
        data: revenueData,
        success: true,
        timeRange,
        paymentMethod,
        region
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
    console.error(`Error in revenue API: ${error.message}`);
    
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