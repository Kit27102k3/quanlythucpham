export const config = { 
  runtime: 'edge',
  regions: ['sin1']  // Singapore region
};

export default async function() {
  const start = Date.now();
  
  return new Response(
    JSON.stringify({
      status: 'EDGE_OK',
      latency: `${Date.now() - start}ms`,
      tip: "This uses Edge Network - fastest!"
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      }
    }
  );
}