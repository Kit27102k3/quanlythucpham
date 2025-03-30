import axios from "axios";

const API_URL = "http://localhost:8080";

const orderApi = {
  createOrder: async (orderData) => {
    const response = await axios.post(`${API_URL}/orders`, orderData);
    return response.data;
  },
  getUserOrders: async () => {
    const response = await axios.get(`${API_URL}/orders/user`);
    return response.data;
  },
};

export default orderApi;
