export const config = {
  runtime: 'edge',
  regions: ['sin1'] // Singapore region for lower latency
};

import reportsController from '../../controllers/reportsController.js';
import BestSellingProduct from '../../src/Model/BestSellingProduct.js';

/**
 * Serverless function to handle all report-related API requests
 * 
 * @param {Request} request - The incoming request
 * @param {Object} context - The serverless function context
 * @returns {Response} - JSON response with report data
 */
export default async function handler(request, context) {
  const start = Date.now();
  const { endpoint } = context.params;
  const url = new URL(request.url);
  const timeRange = url.searchParams.get('timeRange') || 'week';
  const paymentMethod = url.searchParams.get('paymentMethod') || 'all';
  const region = url.searchParams.get('region') || 'all';
  const limit = parseInt(url.searchParams.get('limit') || '5', 10);
  
  // DEVELOPMENT MODE: No authentication check at all
  
  try {
    let responseData;
    
    // Route to the appropriate controller method based on the endpoint
    switch (endpoint) {
      case 'dashboard':
        responseData = await mockControllerResponse(reportsController.getDashboardStats);
        break;
      case 'revenue':
        responseData = await mockControllerResponse(reportsController.getRevenueData, { timeRange, paymentMethod, region });
        break;
      case 'top-products':
        try {
          // Trực tiếp sử dụng model BestSellingProduct
          const bestSellingProducts = await BestSellingProduct.getBestSellers(limit);
          
          if (bestSellingProducts && bestSellingProducts.length > 0) {
            responseData = bestSellingProducts.map(product => ({
              name: product.productName,
              category: product.productCategory,
              sold: product.soldCount,
              revenue: product.totalRevenue,
              image: product.productImage,
              id: product.productId
            }));
          } else {
            // Fallback to controller if no products found
            responseData = await mockControllerResponse(reportsController.getTopProducts, { limit });
          }
        } catch (error) {
          console.error('Error fetching top products:', error);
          responseData = await mockControllerResponse(reportsController.getTopProducts, { limit });
        }
        break;
      case 'analysis':
        // Get user role and branch ID from query params
        const userRole = url.searchParams.get('userRole') || 'admin';
        const branchId = url.searchParams.get('branchId') || 'all';
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        
        // Call the controller method with the appropriate parameters
        responseData = await mockControllerResponse(reportsController.getAnalysisData, { 
          userRole, 
          branchId,
          startDate,
          endDate
        });
        break;
      case 'inventory':
        responseData = await mockControllerResponse(reportsController.getInventoryData);
        break;
      case 'users':
        responseData = await mockControllerResponse(reportsController.getUserData);
        break;
      case 'orders':
        responseData = await mockControllerResponse(reportsController.getOrderData, { timeRange });
        break;
      case 'promotions':
        responseData = await mockControllerResponse(reportsController.getPromotionData, { timeRange });
        break;
      case 'system-activity':
        responseData = await mockControllerResponse(reportsController.getSystemActivityData, { timeRange });
        break;
      case 'delivery':
        responseData = await mockControllerResponse(reportsController.getDeliveryData, { timeRange });
        break;
      case 'feedback':
        responseData = await mockControllerResponse(reportsController.getFeedbackData, { timeRange });
        break;
      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid endpoint',
            message: `Endpoint '${endpoint}' does not exist`,
            success: false
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
    }
    
    // Ensure we always return a consistent format
    if (responseData === null || responseData === undefined) {
      responseData = [];
    }
    
    // For top-products endpoint, provide mock data if empty
    if (endpoint === 'top-products' && (!responseData || !responseData.length)) {
      responseData = [
        { name: "Thịt heo", category: "Thịt tươi", sold: 120, revenue: 12000000, price: 100000, stock: 50 },
        { name: "Thịt bò", category: "Thịt tươi", sold: 85, revenue: 17000000, price: 200000, stock: 30 },
        { name: "Cá thu", category: "Hải sản", sold: 67, revenue: 6700000, price: 100000, stock: 25 },
        { name: "Rau muống", category: "Rau củ", sold: 55, revenue: 1100000, price: 20000, stock: 100 },
        { name: "Trứng gà", category: "Trứng", sold: 45, revenue: 900000, price: 20000, stock: 200 }
      ].slice(0, limit);
    }
    
    return new Response(
      JSON.stringify({
        data: responseData,
        success: true,
        latency: `${Date.now() - start}ms`
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
    console.error(`Error in reports API: ${error.message}`);
    
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

/**
 * Helper function to mock the controller response
 * In a real app, this would call the actual controller method
 * 
 * @param {Function} controllerMethod - The controller method to call
 * @param {Object} query - The query parameters
 * @returns {Object} - The controller response
 */
async function mockControllerResponse(controllerMethod, query = {}) {
  // Create mock req and res objects
  const req = { query };
  let responseData;
  
  const res = {
    json: (data) => {
      responseData = data;
    },
    status: () => {
      return { json: (data) => { responseData = data; } };
    }
  };
  
  try {
    // Call the controller method
    await controllerMethod(req, res);
    
    // If no data was returned, provide a default empty response
    if (responseData === undefined || responseData === null) {
      return [];
    }
    
    return responseData;
  } catch (error) {
    console.error(`Error in controller method: ${error.message}`);
    return [];
  }
}
