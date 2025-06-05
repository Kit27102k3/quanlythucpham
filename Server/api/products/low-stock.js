export const config = {
  runtime: "edge",
  regions: ["sin1"],
};

/**
 * API endpoint trả về danh sách sản phẩm có tồn kho thấp
 *
 * @param {Request} request - The incoming request
 * @returns {Response} - JSON response with low stock products data
 */
export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "5", 10);
    const criticalStock = parseInt(
      url.searchParams.get("criticalStock") || "20",
      10
    );
    const lowStockProducts = [];
    const filteredProducts = lowStockProducts.filter(
      (product) => product.stock <= criticalStock
    );
    const sortedProducts = [...filteredProducts].sort(
      (a, b) => a.stock - b.stock
    );
    const limitedProducts = sortedProducts.slice(0, limit);
    return new Response(
      JSON.stringify({
        data: limitedProducts,
        success: true,
        total: filteredProducts.length,
        limit,
        criticalStock,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}
