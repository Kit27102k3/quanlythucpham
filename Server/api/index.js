/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import express from "express";
import mongoose from "mongoose";
import reports from "./reports/index.js";
import dotenv from "dotenv";
import { createEdgeRouter } from 'next-connect';
import cors from 'cors';

// Load environment variables
dotenv.config({ path: ".env" });

const router = express.Router();
// MongoDB connection string - default to localhost if not defined in environment
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/quanlythucpham";

// Mount reports routes
router.use("/reports", reports);

// Add a direct inventory endpoint for development
router.get("/products/inventory", async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      // Try to connect if not already connected
      try {
        await mongoose.connect(MONGODB_URI);
      } catch (connError) {
        console.error("MongoDB connection error:", connError);
        return res
          .status(500)
          .json({ error: "Không thể kết nối đến cơ sở dữ liệu" });
      }
    }

    // Get products collection
    const productsCollection = mongoose.connection.collection("products");

    // Find individual products with stock under 20
    const products = await productsCollection
      .find({
        $or: [
          { productStock: { $lt: 20, $gt: 0 } }, // Check productStock field
          { stock: { $lt: 20, $gt: 0 } }, // Also check stock field as fallback
        ],
      })
      .sort({ productStock: 1, stock: 1 }) // Sort by stock (ascending)
      .limit(limit)
      .toArray();

    if (products && products.length > 0) {
      console.log(
        `Found ${products.length} individual products with low stock`
      );

      // Transform to required format - focus on individual products, not categories
      const inventoryData = products.map((product) => ({
        id: product._id,
        name: product.productName || product.name || "Sản phẩm không tên",
        category:
          product.productCategory || product.category || "Không phân loại",
        stock:
          product.productStock !== undefined
            ? product.productStock
            : product.stock || 0,
        status:
          (product.productStock !== undefined
            ? product.productStock
            : product.stock || 0) <= 5
            ? "Sắp hết"
            : "Còn hàng",
        price: product.productPrice || product.price || 0,
        sku: product.productCode || product.sku || "",
        image: product.productImages?.[0] || product.image || "",
      }));

      return res.json(inventoryData);
    } else {
      // Try alternative query approach using mock data for testing
      const mockProducts = [];

      console.log("Using mock data for products with low stock");
      return res.json(mockProducts);
    }
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    return res.status(500).json({ error: "Lỗi khi lấy dữ liệu tồn kho" });
  }
});

// Error handler - eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Dữ liệu mẫu cho sản phẩm bán chạy
const topProducts = [
  { 
    name: "Thịt heo", 
    category: "Thịt tươi", 
    sold: 120, 
    revenue: 12000000, 
    price: 100000, 
    stock: 50,
    image: "https://cdn.tgdd.vn/Products/Images/8781/222893/bhx/thit-nac-vai-heo-khay-500g-202103031051054021.jpg"
  },
  { 
    name: "Thịt bò", 
    category: "Thịt tươi", 
    sold: 85, 
    revenue: 17000000, 
    price: 200000, 
    stock: 30,
    image: "https://cdn.tgdd.vn/Products/Images/8781/228329/bhx/thit-ba-chi-bo-my-khay-300g-202103031058264362.jpg"
  },
  { 
    name: "Cá thu", 
    category: "Hải sản", 
    sold: 67, 
    revenue: 6700000, 
    price: 100000, 
    stock: 25,
    image: "https://cdn.tgdd.vn/Products/Images/8782/226864/bhx/ca-thu-cat-khuc-khay-300g-202103031056031782.jpg"
  },
  { 
    name: "Rau muống", 
    category: "Rau củ", 
    sold: 55, 
    revenue: 1100000, 
    price: 20000, 
    stock: 100,
    image: "https://cdn.tgdd.vn/Products/Images/8785/233955/bhx/rau-muong-cat-khuc-goi-300g-202103031058393183.jpg"
  },
  { 
    name: "Trứng gà", 
    category: "Trứng", 
    sold: 45, 
    revenue: 900000, 
    price: 20000, 
    stock: 200,
    image: "https://cdn.tgdd.vn/Products/Images/8072/233786/bhx/trung-ga-happy-egg-hop-10-trung-202103031059167031.jpg"
  }
];

// Dữ liệu mẫu cho sản phẩm tồn kho thấp
const lowStockProducts = [
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
  }
];

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
  ]
};

// Generate revenue data for the past 7 days
const generateRevenueData = (timeRange) => {
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
  
  return revenueData;
};

export const config = {
  runtime: 'edge',
  regions: ['sin1'] // Singapore region for lower latency
};

// Tạo router cho API
const edgeRouter = createEdgeRouter();

edgeRouter.use(cors());

// API endpoint cho top products
edgeRouter.get('/api/top-products', async (req) => {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    
    // Trả về số lượng sản phẩm theo limit
    const limitedProducts = topProducts.slice(0, limit);
    
    return new Response(
      JSON.stringify({
        data: limitedProducts,
        success: true,
        total: topProducts.length,
        limit: limit
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
    console.error(`Error in top-products API: ${error.message}`);
    
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
});

// API endpoint cho best-selling-products
edgeRouter.get('/api/best-selling-products', async (req) => {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    
    // Trả về số lượng sản phẩm theo limit
    const limitedProducts = topProducts.slice(0, limit);
    
    return new Response(
      JSON.stringify({
        data: limitedProducts,
        success: true,
        total: topProducts.length,
        limit: limit
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
    console.error(`Error in best-selling-products API: ${error.message}`);
    
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
});

// API endpoint cho low-stock products
edgeRouter.get('/api/products/low-stock', async (req) => {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    
    // Trả về số lượng sản phẩm theo limit
    const limitedProducts = lowStockProducts.slice(0, limit);
    
    return new Response(
      JSON.stringify({
        data: limitedProducts,
        success: true,
        total: lowStockProducts.length,
        limit: limit
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
    console.error(`Error in low-stock API: ${error.message}`);
    
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
          'Cache-Control': 'public, max-age=60',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
});

// API endpoint cho inventory
edgeRouter.get('/api/products/inventory', async (req) => {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    
    // Trả về số lượng sản phẩm theo limit
    const limitedProducts = lowStockProducts.slice(0, limit);
    
    return new Response(
      JSON.stringify({
        data: limitedProducts,
        success: true,
        total: lowStockProducts.length,
        limit: limit
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
          'Cache-Control': 'public, max-age=60',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
});

// API endpoint cho revenue data
edgeRouter.get('/api/reports/revenue', async (req) => {
  try {
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || 'week';
    
    // Generate revenue data based on time range
    const revenueData = generateRevenueData(timeRange);
    
    return new Response(
      JSON.stringify({
        data: revenueData,
        success: true,
        timeRange
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
});

// API endpoint cho dashboard data
edgeRouter.get('/api/reports/dashboard', async (req) => {
  try {
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
});

// API endpoint cho reports/top-products
edgeRouter.get('/api/reports/top-products', async (req) => {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    
    // Trả về số lượng sản phẩm theo limit
    const limitedProducts = topProducts.slice(0, limit);
    
    return new Response(
      JSON.stringify({
        data: limitedProducts,
        success: true,
        total: topProducts.length,
        limit: limit
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
    console.error(`Error in reports/top-products API: ${error.message}`);
    
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
});

// Default handler
export default async function handler(req) {
  return edgeRouter.run(req);
}
