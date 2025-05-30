export const config = {
  runtime: 'edge',
  regions: ['sin1'] // Singapore region for lower latency
};

import reportsController from '../../controllers/reportsController.js';

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
  
  // Mock authentication check - in a real app, this would validate auth tokens
  // const isAuthenticated = request.headers.get('Authorization') === 'Bearer valid-token';
  const isAuthenticated = true; // For demo purposes
  
  if (!isAuthenticated) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized access' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
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
        responseData = await mockControllerResponse(reportsController.getTopProducts);
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
          JSON.stringify({ error: 'Invalid endpoint' }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
    }
    
    return new Response(
      JSON.stringify({
        data: responseData,
        latency: `${Date.now() - start}ms`
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60'
        }
      }
    );
  } catch (error) {
    console.error(`Error in reports API: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
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
  
  // Call the controller method
  await controllerMethod(req, res);
  
  return responseData;
}