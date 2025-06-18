/**
 * Giao diện quản lý prompt cho chatbot
 * Cho phép admin xem, chỉnh sửa và cập nhật prompt cho chatbot
 */

import axios from 'axios';
import config from '../../config/config.js';

/**
 * Lấy danh sách các prompt có sẵn
 * @param {string} token - JWT token của admin
 * @returns {Promise<Array>} - Danh sách các prompt
 */
export const getAvailablePrompts = async (token) => {
  try {
    const response = await axios.get(`${config.API_URL}/api/chatbot/prompt`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        list: true
      }
    });
    
    return response.data.prompts || [];
  } catch (error) {
    console.error('Lỗi khi lấy danh sách prompt:', error);
    throw error;
  }
};

/**
 * Lấy nội dung của một prompt cụ thể
 * @param {string} token - JWT token của admin
 * @param {string} promptType - Loại prompt cần lấy
 * @returns {Promise<string>} - Nội dung prompt
 */
export const getPromptContent = async (token, promptType = 'withExamples') => {
  try {
    const response = await axios.get(`${config.API_URL}/api/chatbot/prompt`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        promptType
      }
    });
    
    return response.data.prompt || '';
  } catch (error) {
    console.error(`Lỗi khi lấy nội dung prompt ${promptType}:`, error);
    throw error;
  }
};

/**
 * Cập nhật prompt cho chatbot
 * @param {string} token - JWT token của admin
 * @param {string} promptType - Loại prompt cần cập nhật
 * @returns {Promise<Object>} - Kết quả cập nhật
 */
export const updateChatbotPrompt = async (token, promptType = 'withExamples') => {
  try {
    const response = await axios.post(
      `${config.API_URL}/api/chatbot/update-prompt`,
      { promptType },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật prompt ${promptType}:`, error);
    throw error;
  }
};

/**
 * Tạo mới tất cả các prompt
 * @param {string} token - JWT token của admin
 * @returns {Promise<Object>} - Kết quả tạo prompt
 */
export const generateAllPrompts = async (token) => {
  try {
    const response = await axios.post(
      `${config.API_URL}/api/chatbot/generate-prompts`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo prompt:', error);
    throw error;
  }
};

/**
 * Khởi động lại chatbot để áp dụng prompt mới
 * @param {string} token - JWT token của admin
 * @returns {Promise<Object>} - Kết quả khởi động lại
 */
export const restartChatbot = async (token) => {
  try {
    const response = await axios.post(
      `${config.API_URL}/api/chatbot/restart`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi khởi động lại chatbot:', error);
    throw error;
  }
};

export default {
  getAvailablePrompts,
  getPromptContent,
  updateChatbotPrompt,
  generateAllPrompts,
  restartChatbot
}; 