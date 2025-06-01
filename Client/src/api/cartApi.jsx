/* eslint-disable no-useless-catch */
import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api/cart`;

const cartApi = {
  getCart: async (userId, cleanInvalid = false) => {
    try {
      const response = await axios.get(`${API_URL}/${userId}${cleanInvalid ? '?cleanInvalid=true' : ''}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addToCart: async (params) => {
    try {
      const { productId, userId, quantity = 1, unit, unitPrice, conversionRate } = params;
      
      if (!productId) {
        console.error("Invalid product ID:", productId);
        throw new Error("Product ID is required");
      }
      
      console.log("Gọi API thêm vào giỏ hàng:", { 
        userId, 
        productId, 
        quantity,
        unit,
        unitPrice,
        conversionRate
      });
      
      const response = await axios.post(
        `${API_URL}/add-to-cart`,
        { 
          userId, 
          productId, 
          quantity,
          unit,
          unitPrice,
          conversionRate
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in addToCart API call:", error);
      if (error.response) {
        console.error("Server response:", error.response.data);
        console.error("Status code:", error.response.status);
      }
      throw error;
    }
  },

  removeFromCart: async (userId, productId) => {
    try {
      const response = await axios.delete(`${API_URL}/remove-from-cart`, {
        data: { userId, productId },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  removeInvalidItem: async (userId, cartItemId) => {
    try {
      const response = await axios.delete(`${API_URL}/remove-invalid-item`, {
        data: { userId, cartItemId },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateCartItem: async (userId, productId, options = {}) => {
    try {
      const { quantity, unit, unitPrice, conversionRate } = options;
      
      const response = await axios.put(
        `${API_URL}/update-cart-item`,
        { 
          userId, 
          productId, 
          quantity,
          unit,
          unitPrice,
          conversionRate
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  clearCart: async (userId) => {
    try {
      const response = await axios.delete(`${API_URL}/clear-cart`, {
        data: { userId },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default cartApi;
