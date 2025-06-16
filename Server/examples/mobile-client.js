/**
 * Ví dụ sử dụng API MongoDB Middleware từ ứng dụng di động
 * Sử dụng axios để gọi API
 */

// Trong React Native, bạn sẽ import axios như sau:
import axios from 'axios';

// Cấu hình cơ bản
const API_BASE_URL = 'https://quanlythucpham.onrender.com/api/db';
let authToken = null;

// Hàm đăng nhập để lấy token
export const login = async (email, password) => {
  try {
    const response = await axios.post('https://quanlythucpham.onrender.com/api/auth/login', {
      email,
      password
    });
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    return false;
  }
};

// Tạo instance axios với headers xác thực
const createAuthenticatedClient = () => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  // Thêm interceptor để xử lý lỗi token hết hạn
  client.interceptors.response.use(
    response => response,
    async error => {
      if (error.response && error.response.status === 401) {
        // Token hết hạn, thử refresh token hoặc yêu cầu đăng nhập lại
        console.log('Authentication error. Please login again.');
        // Có thể thêm logic refresh token ở đây
      }
      return Promise.reject(error);
    }
  );
  
  return client;
};

// Class API Client
class MongoDBApiClient {
  constructor() {
    this.client = null;
  }
  
  // Kiểm tra kết nối
  async checkConnection() {
    try {
      // API status không cần xác thực
      const response = await axios.get(`${API_BASE_URL}/status`);
      return response.data;
    } catch (error) {
      console.error('Connection check error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  // Đảm bảo client đã được xác thực
  ensureAuthenticated() {
    if (!authToken) {
      throw new Error('Authentication required. Please login first.');
    }
    
    if (!this.client) {
      this.client = createAuthenticatedClient();
    }
    
    return this.client;
  }
  
  // Lấy danh sách collections
  async getCollections() {
    try {
      const client = this.ensureAuthenticated();
      const response = await client.get('/collections');
      return response.data.collections;
    } catch (error) {
      console.error('Get collections error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  // Truy vấn dữ liệu
  async query(collection, queryParams = {}) {
    try {
      const client = this.ensureAuthenticated();
      const response = await client.post(`/query/${collection}`, queryParams);
      return response.data;
    } catch (error) {
      console.error(`Query ${collection} error:`, error.response?.data || error.message);
      throw error;
    }
  }
  
  // Lấy document theo ID
  async getDocument(collection, id) {
    try {
      const client = this.ensureAuthenticated();
      const response = await client.get(`/document/${collection}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Get document error:`, error.response?.data || error.message);
      throw error;
    }
  }
  
  // Tạo document mới
  async createDocument(collection, document) {
    try {
      const client = this.ensureAuthenticated();
      const response = await client.post(`/document/${collection}`, document);
      return response.data;
    } catch (error) {
      console.error(`Create document error:`, error.response?.data || error.message);
      throw error;
    }
  }
  
  // Cập nhật document
  async updateDocument(collection, id, updates) {
    try {
      const client = this.ensureAuthenticated();
      const response = await client.put(`/document/${collection}/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Update document error:`, error.response?.data || error.message);
      throw error;
    }
  }
  
  // Xóa document
  async deleteDocument(collection, id) {
    try {
      const client = this.ensureAuthenticated();
      const response = await client.delete(`/document/${collection}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Delete document error:`, error.response?.data || error.message);
      throw error;
    }
  }
  
  // Đếm số lượng documents
  async countDocuments(collection, query = {}) {
    try {
      const client = this.ensureAuthenticated();
      const response = await client.post(`/count/${collection}`, { query });
      return response.data.count;
    } catch (error) {
      console.error(`Count documents error:`, error.response?.data || error.message);
      throw error;
    }
  }
}

// Ví dụ sử dụng trong React Native
/*
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { MongoDBApiClient } from './MongoDBApiClient';

const ProductScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const mongoClient = new MongoDBApiClient();
  
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Đăng nhập trước
        await mongoClient.login('admin@example.com', 'password');
        
        // Truy vấn sản phẩm
        const result = await mongoClient.query('products', {
          query: { category: 'food' },
          limit: 20
        });
        
        setProducts(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);
  
  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  
  return (
    <View>
      <Text>Products</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Text>{item.name} - ${item.price}</Text>
        )}
      />
    </View>
  );
};

export default ProductScreen;
*/

// Export class để sử dụng
export default MongoDBApiClient; 