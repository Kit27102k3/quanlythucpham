export const config = {
  runtime: 'edge',
  regions: ['sin1'] // Singapore region for lower latency
};

import reportsController from '../../controllers/reportsController.js';

/**
 * Serverless function to handle AI analysis API requests
 * 
 * @param {Request} request - The incoming request
 * @returns {Response} - JSON response with analysis data
 */
export default async function handler(request) {
  const start = Date.now();
  const url = new URL(request.url);
  const userRole = url.searchParams.get('userRole') || 'admin';
  const branchId = url.searchParams.get('branchId') || 'all';
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  
  try {
    // Create mock req and res objects
    const req = { 
      query: { 
        userRole, 
        branchId,
        startDate,
        endDate
      } 
    };
    
    let responseData;
    
    const res = {
      json: (data) => {
        responseData = data;
      },
      status: () => {
        return { 
          json: (data) => { 
            responseData = data; 
          } 
        };
      }
    };
    
    // Call the controller method directly
    await reportsController.getAnalysisData(req, res);
    
    // Return the response
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  } catch (error) {
    console.error(`Error in analysis API: ${error.message}`);
    
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