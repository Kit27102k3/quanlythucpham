import UserContext from "../../Model/UserContext.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Lưu context của người dùng
 * @param {string} userId - ID của người dùng
 * @param {object} context - Dữ liệu context cần lưu
 * @returns {Promise<object>} - Context đã được cập nhật
 */
export const saveContext = async (userId, context) => {
  try {
    if (!userId) {
      console.error("Không thể lưu context: userId không hợp lệ");
      return null;
    }
    
    console.log(`Bắt đầu lưu context cho userId: ${userId}`);
    console.log(`Dữ liệu context cần lưu:`, JSON.stringify({
      lastQuery: context.lastQuery,
      hasLastProduct: !!context.lastProduct,
      lastProductsCount: context.lastProducts ? context.lastProducts.length : 0,
      timestamp: context.timestamp || new Date().toISOString()
    }));
    
    // Tìm và cập nhật context của người dùng, nếu không có thì tạo mới
    const updatedContext = await UserContext.findOneAndUpdate(
      { userId },
      { $set: context },
      { new: true, upsert: true }
    );
    
    console.log(`Đã lưu context thành công cho userId: ${userId}`);
    return updatedContext;
  } catch (error) {
    console.error(`Lỗi khi lưu context cho userId ${userId}:`, error);
    throw error;
  }
};

/**
 * Lấy context của người dùng
 * @param {string} userId - ID của người dùng
 * @returns {Promise<object>} - Context của người dùng
 */
export const getUserContext = async (userId) => {
  try {
    if (!userId) {
      console.error("Không thể lấy context: userId không hợp lệ");
      return null;
    }
    
    console.log(`Tìm context cho userId: ${userId}`);
    const userContext = await UserContext.findOne({ userId });
    
    if (userContext) {
      console.log(`Tìm thấy context cho userId: ${userId} với ${userContext.lastProducts ? userContext.lastProducts.length : 0} sản phẩm`);
    } else {
      console.log(`Không tìm thấy context cho userId: ${userId}`);
    }
    
    return userContext;
  } catch (error) {
    console.error(`Lỗi khi lấy context cho userId ${userId}:`, error);
    return null;
  }
};

/**
 * Khởi tạo hoặc lấy context từ database
 * @param {string} userId - ID của người dùng
 * @returns {Promise<object>} - Context của người dùng
 */
export const initOrGetUserContext = async (userId) => {
  try {
    if (!userId) return null;

    // Kiểm tra xem đã có context chưa
    let userContext = await getUserContext(userId);
    
    // Nếu chưa có, tạo mới
    if (!userContext) {
      console.log(`Tạo mới context cho user ${userId}`);
      
      // Tạo context mới với các giá trị mặc định
      userContext = await saveContext(userId, {
        lastQuery: '',
        lastProduct: null,
        lastProducts: [],
        conversationHistory: [],
        createdAt: new Date()
      });
      
      console.log(`Đã tạo context mới cho user ${userId}`);
    } else {
      console.log(`Đã tìm thấy context cho user ${userId}`);
    }
    
    return userContext;
  } catch (error) {
    console.error(`Lỗi khi khởi tạo context cho user ${userId}:`, error);
    return null;
  }
};

/**
 * Cập nhật danh sách sản phẩm đã xem trong context
 * @param {string} userId - ID của người dùng
 * @param {Array} products - Danh sách sản phẩm cần lưu
 * @param {string} query - Câu truy vấn sản phẩm
 * @returns {Promise<object>} - Context đã cập nhật
 */
export const updateProductsInContext = async (userId, products, query) => {
  try {
    if (!userId || !products || !Array.isArray(products) || products.length === 0) {
      console.error("Không thể cập nhật sản phẩm: Thiếu thông tin cần thiết");
      return null;
    }
    
    console.log(`Cập nhật ${products.length} sản phẩm vào context của user ${userId}`);
    
    // Lưu ngữ cảnh với sản phẩm mới
    const updatedContext = await saveContext(userId, {
      lastProducts: products,
      lastProduct: products[0],
      lastQuery: query || "",
      timestamp: new Date().toISOString()
    });
    
    console.log(`Đã cập nhật context với ${products.length} sản phẩm cho user ${userId}`);
    return updatedContext;
  } catch (error) {
    console.error(`Lỗi khi cập nhật sản phẩm trong context cho userId ${userId}:`, error);
    return null;
  }
};

/**
 * Xóa context của người dùng
 * @param {string} userId - ID của người dùng
 * @returns {Promise<boolean>} - Kết quả xóa
 */
export const deleteUserContext = async (userId) => {
  try {
    if (!userId) {
      console.error("Không thể xóa context: userId không hợp lệ");
      return false;
    }
    
    await UserContext.deleteOne({ userId });
    console.log(`Đã xóa context cho userId: ${userId}`);
    return true;
  } catch (error) {
    console.error(`Lỗi khi xóa context cho userId ${userId}:`, error);
    return false;
  }
};

export default {
  saveContext,
  getUserContext,
  initOrGetUserContext,
  updateProductsInContext,
  deleteUserContext
}; 