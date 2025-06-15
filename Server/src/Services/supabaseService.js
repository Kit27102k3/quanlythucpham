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
        query = query.eq('product_category', category);
      }
      
      if (search) {
        query = query.ilike('product_name', `%${search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Chuyển đổi dữ liệu từ Supabase sang định dạng MongoDB
      const transformedData = data.map(item => ({
        _id: item.id,
        productName: item.product_name,
        productPrice: item.product_price,
        productImages: item.product_images || [],
        productCategory: item.product_category,
        productDescription: item.product_description || [],
        productBrand: item.product_brand,
        productBrandId: item.product_brand_id,
        productSupplier: item.product_supplier,
        productSupplierId: item.product_supplier_id,
        branchId: item.branch_id,
        productStatus: item.product_status,
        productDiscount: item.product_discount || 0,
        productInfo: item.product_info,
        productDetails: item.product_details,
        productStock: item.product_stock || 0,
        productCode: item.product_code,
        productWeight: item.product_weight || 0,
        productPromoPrice: item.product_promo_price || 0,
        productWarranty: item.product_warranty || 0,
        productOrigin: item.product_origin,
        productIntroduction: item.product_introduction,
        productUnit: item.product_unit || 'gram',
        unitOptions: item.unit_options || [],
        discountStartDate: item.discount_start_date,
        discountEndDate: item.discount_end_date,
        expiryDate: item.expiry_date,
        soldCount: item.sold_count || 0,
        averageRating: item.average_rating || 0,
        numOfReviews: item.num_of_reviews || 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      return transformedData;
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
      
      if (!data) return null;
      
      // Chuyển đổi dữ liệu từ Supabase sang định dạng MongoDB
      return {
        _id: data.id,
        productName: data.product_name,
        productPrice: data.product_price,
        productImages: data.product_images || [],
        productCategory: data.product_category,
        productDescription: data.product_description || [],
        productBrand: data.product_brand,
        productBrandId: data.product_brand_id,
        productSupplier: data.product_supplier,
        productSupplierId: data.product_supplier_id,
        branchId: data.branch_id,
        productStatus: data.product_status,
        productDiscount: data.product_discount || 0,
        productInfo: data.product_info,
        productDetails: data.product_details,
        productStock: data.product_stock || 0,
        productCode: data.product_code,
        productWeight: data.product_weight || 0,
        productPromoPrice: data.product_promo_price || 0,
        productWarranty: data.product_warranty || 0,
        productOrigin: data.product_origin,
        productIntroduction: data.product_introduction,
        productUnit: data.product_unit || 'gram',
        unitOptions: data.unit_options || [],
        discountStartDate: data.discount_start_date,
        discountEndDate: data.discount_end_date,
        expiryDate: data.expiry_date,
        soldCount: data.sold_count || 0,
        averageRating: data.average_rating || 0,
        numOfReviews: data.num_of_reviews || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
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
      
      // Chuyển đổi dữ liệu từ Supabase sang định dạng MongoDB
      const transformedData = data.map(item => ({
        _id: item.id,
        userId: item.user_id,
        products: item.products || [],
        totalAmount: item.total_amount,
        coupon: item.coupon,
        status: item.status || 'pending',
        shippingInfo: item.shipping_info || {},
        paymentMethod: item.payment_method,
        orderCode: item.order_code,
        notes: item.notes,
        isPaid: item.is_paid || false,
        completedAt: item.completed_at,
        branchId: item.branch_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      return transformedData;
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
      
      if (!data) return null;
      
      // Chuyển đổi dữ liệu từ Supabase sang định dạng MongoDB
      return {
        _id: data.id,
        email: data.email,
        phone: data.phone,
        firstName: data.first_name,
        lastName: data.last_name,
        userName: data.user_name,
        password: data.password,
        userImage: data.user_image || '',
        isBlocked: data.is_blocked || false,
        resetPasswordToken: data.reset_password_token,
        resetPasswordExpires: data.reset_password_expires,
        lastLogin: data.last_login,
        facebookId: data.facebook_id,
        googleId: data.google_id,
        authProvider: data.auth_provider || 'local',
        addresses: data.addresses || [],
        pushSubscriptions: data.push_subscriptions || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error(`Error fetching user ${id} from Supabase:`, error);
      return null;
    }
  },
  
  /**
   * Lấy danh sách chi nhánh
   * @returns {Promise<Array>} - Danh sách chi nhánh
   */
  getBranches: async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*');
      
      if (error) throw error;
      
      // Chuyển đổi dữ liệu từ Supabase sang định dạng MongoDB
      const transformedData = data.map(item => ({
        _id: item.id,
        name: item.name,
        address: item.address,
        city: item.city,
        latitude: item.latitude,
        longitude: item.longitude,
        phone: item.phone,
        isActive: item.is_active || true,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching branches from Supabase:', error);
      return [];
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