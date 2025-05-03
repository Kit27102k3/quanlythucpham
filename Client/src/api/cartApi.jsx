/* eslint-disable no-useless-catch */
import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api/cart`;

const cartApi = {
  getCart: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addToCart: async (userId, productId, quantity = 1) => {
    try {
      const response = await axios.post(
        `${API_URL}/add-to-cart`,
        { userId, productId, quantity },
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

  updateCartItem: async (userId, productId, quantity) => {
    try {
      const response = await axios.put(
        `${API_URL}/update-cart-item`,
        { userId, productId, quantity },
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
