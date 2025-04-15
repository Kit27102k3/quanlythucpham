import { performance } from 'perf_hooks';

export default async (req, res) => {
  const start = performance.now();
  
  // Tắt tất cả các middleware không cần thiết
  res.setHeader('Connection', 'close');
  res.setHeader('Cache-Control', 'no-transform');
  
  // Response cực nhanh
  return res.json({
    status: 'LEGACY_OK',
    latency: `${(performance.now() - start).toFixed(2)}ms`,
    warning: "Avoid complex logic here!"
  });
};