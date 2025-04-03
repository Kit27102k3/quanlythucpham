import axios from "axios";

const API_URL = "http://localhost:8080/api/dashboard";

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
