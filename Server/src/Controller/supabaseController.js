import supabaseService from '../Services/supabaseService.js';

/**
 * Controller để xử lý các yêu cầu API sử dụng Supabase
 */
const supabaseController = {
  /**
   * Lấy danh sách sản phẩm
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProducts: async (req, res) => {
    try {
      const { limit, offset, category, search } = req.query;
      
      const products = await supabaseService.getProducts({
        limit: parseInt(limit) || 10,
        offset: parseInt(offset) || 0,
        category,
        search
      });
      
      res.json({
        success: true,
        data: products,
        isSupabase: true
      });
    } catch (error) {
      console.error('Error in getProducts controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách sản phẩm',
        error: error.message,
        isSupabase: true
      });
    }
  },
  
  /**
   * Lấy thông tin sản phẩm theo ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const product = await supabaseService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sản phẩm',
          isSupabase: true
        });
      }
      
      res.json({
        success: true,
        data: product,
        isSupabase: true
      });
    } catch (error) {
      console.error('Error in getProductById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin sản phẩm',
        error: error.message,
        isSupabase: true
      });
    }
  },
  
  /**
   * Lấy danh sách đơn hàng
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getOrders: async (req, res) => {
    try {
      const { limit, offset, userId } = req.query;
      
      const orders = await supabaseService.getOrders({
        limit: parseInt(limit) || 10,
        offset: parseInt(offset) || 0,
        userId
      });
      
      res.json({
        success: true,
        data: orders,
        isSupabase: true
      });
    } catch (error) {
      console.error('Error in getOrders controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách đơn hàng',
        error: error.message,
        isSupabase: true
      });
    }
  },
  
  /**
   * Lấy thông tin người dùng theo ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await supabaseService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
          isSupabase: true
        });
      }
      
      res.json({
        success: true,
        data: user,
        isSupabase: true
      });
    } catch (error) {
      console.error('Error in getUserById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin người dùng',
        error: error.message,
        isSupabase: true
      });
    }
  },
  
  /**
   * Thực hiện truy vấn SQL tùy chỉnh
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  executeQuery: async (req, res) => {
    try {
      const { sql } = req.body;
      
      if (!sql) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu câu truy vấn SQL',
          isSupabase: true
        });
      }
      
      const data = await supabaseService.executeQuery(sql);
      
      res.json({
        success: true,
        data,
        isSupabase: true
      });
    } catch (error) {
      console.error('Error in executeQuery controller:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thực hiện truy vấn SQL',
        error: error.message,
        isSupabase: true
      });
    }
  }
};

export default supabaseController; 