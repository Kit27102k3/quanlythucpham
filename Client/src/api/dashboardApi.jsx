import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api/dashboard`;

const dashboardApi = {
  getDashboardStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default dashboardApi;
