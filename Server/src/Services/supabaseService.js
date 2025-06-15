import supabase from '../config/supabase.js';

/**
 * Service để truy vấn dữ liệu từ Supabase
 */
export const supabaseService = {
  /**
   * Lấy danh sách sản phẩm
   * @param {Object} options - Các tùy chọn truy vấn
   * @returns {Promise<Array>} - Danh sách sản phẩm
   */
  getProducts: async (options = {}) => {
    try {
      const { limit = 10, offset = 0, category, search } = options;
      
      let query = supabase
        .from('products')
        .select('*')
        .range(offset, offset + limit - 1);
      
      if (category) {
        query = query.eq('category', category);
      }
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching products from Supabase:', error);
      return [];
    }
  },
  
  /**
   * Lấy thông tin sản phẩm theo ID
   * @param {string} id - ID sản phẩm
   * @returns {Promise<Object|null>} - Thông tin sản phẩm
   */
  getProductById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error fetching product ${id} from Supabase:`, error);
      return null;
    }
  },
  
  /**
   * Lấy danh sách đơn hàng
   * @param {Object} options - Các tùy chọn truy vấn
   * @returns {Promise<Array>} - Danh sách đơn hàng
   */
  getOrders: async (options = {}) => {
    try {
      const { limit = 10, offset = 0, userId } = options;
      
      let query = supabase
        .from('orders')
        .select('*')
        .range(offset, offset + limit - 1);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching orders from Supabase:', error);
      return [];
    }
  },
  
  /**
   * Lấy thông tin người dùng theo ID
   * @param {string} id - ID người dùng
   * @returns {Promise<Object|null>} - Thông tin người dùng
   */
  getUserById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error fetching user ${id} from Supabase:`, error);
      return null;
    }
  },
  
  /**
   * Thực hiện truy vấn SQL tùy chỉnh
   * @param {string} sql - Câu truy vấn SQL
   * @returns {Promise<Array>} - Kết quả truy vấn
   */
  executeQuery: async (sql) => {
    try {
      const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error executing SQL query on Supabase:', error);
      return [];
    }
  }
};

export default supabaseService; 