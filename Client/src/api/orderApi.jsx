import axios from "axios";
import { API_URLS } from "../config/apiConfig";

const API_URL = API_URLS.ORDERS;
// Không sử dụng biến này nên comment hoặc xóa để tránh lỗi linter
// const GHN_API_URL = "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order";

// Cấu hình Axios để gửi token trong header
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getOrderById = async (orderId) => {
  try {
    const userId = localStorage.getItem("userId");
    const response = await axios.get(`${API_URL}/${orderId}`);
    const orderData = response.data;

    // Kiểm tra nếu đơn hàng không thuộc về người dùng hiện tại
    const orderUserId =
      orderData.userId && typeof orderData.userId === "object"
        ? orderData.userId._id
        : orderData.userId;

    if (userId && orderUserId !== userId) {
      console.warn("Đơn hàng không thuộc về người dùng hiện tại!");
    }

    return orderData;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn hàng:", error);
    throw error;
  }
};

// Hàm kiểm tra trạng thái đơn hàng (để theo dõi cập nhật real-time)
export const checkOrderStatus = async (orderId) => {
  try {
    // Thêm timestamp để tránh cache
    const timestamp = new Date().getTime();
    const response = await axios.get(`${API_URL}/${orderId}?_t=${timestamp}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái đơn hàng:", error);
    throw error;
  }
};

const orderApi = {
  createOrder: async (orderData) => {
    const response = await axios.post(`${API_URL}`, orderData);
    return response.data;
  },
  getUserOrders: async () => {
    try {
      // Lấy userId từ localStorage - sử dụng userId trực tiếp nếu có
      const userId = localStorage.getItem("userId");

      if (!userId) {
        console.error("Không tìm thấy userId trong localStorage");
        return [];
      }

      // Thêm timestamp để tránh cache
      const timestamp = new Date().getTime();

      // Sử dụng userId để lấy đơn hàng của người dùng hiện tại
      const url = `${API_URL}/user?userId=${userId}&_t=${timestamp}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng của người dùng:", error);
      // Trả về mảng rỗng thay vì throw error
      return [];
    }
  },
  // Thêm phương thức getAllOrders để lấy tất cả đơn hàng (cho admin)
  getAllOrders: async (
    page = 1,
    pageSize = 10,
    searchTerm = "",
    statusFilter = "",
    paymentMethodFilter = "",
    isPaid,
    dateFilter,
    branchFilter,
    timestamp
  ) => {
    try {
      const params = {
        page,
        pageSize,
        searchTerm,
        status: statusFilter,
        paymentMethod: paymentMethodFilter,
      };

      // Thêm các tham số tùy chọn nếu có
      if (isPaid !== undefined) params.isPaid = isPaid;
      if (dateFilter) params.date = dateFilter;
      if (branchFilter) params.branchId = branchFilter;
      
      // Thêm timestamp để tránh cache
      params._t = timestamp || new Date().getTime();

      const response = await axios.get(`${API_URL}`, { params });
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy tất cả đơn hàng:", error);
      throw error;
    }
  },
  getOrderById,
  checkOrderStatus,

  // Thêm hàm hủy đơn hàng
  cancelOrder: async (orderId) => {
    try {
      // Thêm tham số để tránh cache
      const timestamp = new Date().getTime();
      const response = await axios.post(
        `${API_URL}/${orderId}/cancel?_t=${timestamp}`
      );
      // console.log("Hủy đơn hàng thành công:", response.data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      throw error;
    }
  },

  // Thêm hàm lấy thông tin vận chuyển từ GHN
  getOrderTracking: async (orderCode) => {
    try {
      // Gọi API server để lấy thông tin tracking từ GHN
      const response = await axios.get(`${API_URL}/tracking/${orderCode}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin vận chuyển:", error);
      throw error;
    }
  },

  // Thêm hàm cập nhật mã vận đơn cho đơn hàng
  updateOrderWithTrackingCode: async (orderId, orderCode) => {
    try {
      // Tạo mã vận đơn tự động nếu không được cung cấp
      const generatedOrderCode = orderCode || generateRandomOrderCode();

      const response = await axios.patch(`${API_URL}/${orderId}`, {
        orderCode: generatedOrderCode,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật mã vận đơn:", error);
      throw error;
    }
  },

  // Thêm hàm lấy top đơn hàng có giá trị cao nhất
  getTopOrders: async (limit = 10) => {
    try {
      const response = await axios.get(`${API_URL}/top`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn hàng giá trị cao nhất:", error);
      throw error;
    }
  },

  // Thêm hàm lấy thống kê giao hàng
  getDeliveryStats: async (period = "week") => {
    try {
      const response = await axios.get(`${API_URL}/delivery-stats`, {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thống kê giao hàng:", error);
      throw error;
    }
  },

  // Lấy đơn hàng theo chi nhánh
  getOrdersByBranch: async (
    branchId,
    page = 1,
    pageSize = 10,
    searchTerm = "",
    statusFilter = "",
    paymentMethodFilter = "",
    isPaid,
    dateFilter,
    nearbyFilter = false
  ) => {
    try {
      // Kiểm tra branchId hợp lệ
      if (!branchId) {
        console.error("branchId không được định nghĩa");
        // Trả về response giả để tránh lỗi ở phía UI
        return {
          data: {
            orders: [],
            totalCount: 0,
            currentPage: 1,
            totalPages: 0,
            stats: {
              total: 0,
              pending: 0,
              confirmed: 0,
              preparing: 0,
              packaging: 0,
              shipping: 0,
              delivering: 0,
              completed: 0,
              cancelled: 0,
              delivery_failed: 0,
              awaiting_payment: 0,
              sorting_facility: 0
            }
          }
        };
      }
      
      console.log("getOrdersByBranch được gọi với các tham số:");
      console.log("branchId:", branchId);
      console.log("page:", page);
      console.log("pageSize:", pageSize);
      console.log("searchTerm:", searchTerm);
      console.log("statusFilter:", statusFilter);
      console.log("paymentMethodFilter:", paymentMethodFilter);
      console.log("isPaid:", isPaid);
      console.log("dateFilter:", dateFilter);
      console.log("nearbyFilter:", nearbyFilter);

      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const params = {
        page,
        pageSize,
        searchTerm,
        status: statusFilter,
        paymentMethod: paymentMethodFilter,
      };

      // Thêm các tham số tùy chọn nếu có
      if (isPaid !== undefined) params.isPaid = isPaid;
      if (dateFilter) params.date = dateFilter;

      // Xử lý tham số nearbyFilter cải tiến
      let forceReload = false;
      if (nearbyFilter) {
        if (typeof nearbyFilter === "object") {
          if (nearbyFilter.enabled) {
            params.nearby = true;
            params.radius = nearbyFilter.radius || 10; // Mặc định là 10km nếu không được chỉ định
          }
          
          // Thêm timestamp nếu có
          if (nearbyFilter.timestamp) {
            params._t = nearbyFilter.timestamp;
          }
          
          // Lấy tham số forceReload
          if (nearbyFilter.forceReload) {
            forceReload = true;
          }
        } else {
          params.nearby = true;
          params.radius = 10; // Mặc định là 10km cho tương thích ngược
        }
      } else if (typeof nearbyFilter === "object") {
        // Lấy timestamp và forceReload từ object nếu không có nearby
        if (nearbyFilter.timestamp) {
          params._t = nearbyFilter.timestamp;
        }
        if (nearbyFilter.forceReload) {
          forceReload = true;
        }
      }
      
      // Đảm bảo luôn có timestamp để tránh cache
      if (!params._t) {
        params._t = new Date().getTime();
      }
      
      // Nếu forceReload, thêm tham số random để tránh cache hoàn toàn
      if (forceReload) {
        params._r = Math.random().toString(36).substring(2, 15);
        console.log("Force reload enabled, adding random param:", params._r);
      }

      console.log("Params gửi lên API:", params);
      console.log("URL API:", `${API_URL}/branch/${branchId}`);

      const response = await axios.get(`${API_URL}/branch/${branchId}`, {
        headers,
        params,
      });

      console.log("Kết quả từ API:", response.data);

      // Chuẩn hóa dữ liệu trả về
      const formattedResponse = {
        data: {
          stats: response.data.stats || {
            total: 0,
            pending: 0,
            confirmed: 0,
            preparing: 0,
            packaging: 0,
            shipping: 0,
            delivering: 0,
            completed: 0,
            cancelled: 0,
            delivery_failed: 0,
            awaiting_payment: 0,
            sorting_facility: 0
          }
        }
      };

      // Xử lý các định dạng phản hồi khác nhau
      if (response.data) {
        if (Array.isArray(response.data)) {
          // Nếu response.data là một mảng, giả định đó là mảng orders
          formattedResponse.data.orders = response.data;
          formattedResponse.data.totalCount = response.data.length;
        } else if (response.data.orders && Array.isArray(response.data.orders)) {
          // Nếu response.data.orders tồn tại và là một mảng
          formattedResponse.data.orders = response.data.orders;
          formattedResponse.data.totalCount = response.data.totalCount || response.data.orders.length;
          // Sử dụng stats nếu có
          if (response.data.stats) {
            formattedResponse.data.stats = response.data.stats;
          }
        } else {
          // Trường hợp khác, trả về mảng rỗng
          formattedResponse.data.orders = [];
          formattedResponse.data.totalCount = 0;
        }
      } else {
        formattedResponse.data.orders = [];
        formattedResponse.data.totalCount = 0;
      }

      formattedResponse.data.currentPage = page;
      formattedResponse.data.totalPages = Math.ceil((formattedResponse.data.totalCount || 0) / pageSize);

      return formattedResponse;
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng theo chi nhánh:", error);
      // Trả về response giả để tránh lỗi ở phía UI
      return {
        data: {
          orders: [],
          totalCount: 0,
          currentPage: 1,
          totalPages: 0,
          stats: {
            total: 0,
            pending: 0,
            confirmed: 0,
            preparing: 0,
            packaging: 0,
            shipping: 0,
            delivering: 0,
            completed: 0,
            cancelled: 0,
            delivery_failed: 0,
            awaiting_payment: 0,
            sorting_facility: 0
          }
        }
      };
    }
  },

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Kiểm tra xem newStatus có phải là object hay không
      let updateData;
      if (typeof newStatus === 'object') {
        // Nếu là object (từ Delivery.jsx), sử dụng cấu trúc của nó
        updateData = {
          status: newStatus.status,
          note: newStatus.note || "",
          // Sử dụng isPaid từ đối tượng nếu có, nếu không thì kiểm tra status
          isPaid: newStatus.isPaid !== undefined 
            ? newStatus.isPaid 
            : (newStatus.status === "completed" ? true : undefined),
        };
      } else {
        // Nếu chỉ là string (từ các component khác), dùng cấu trúc cũ
        updateData = {
          status: newStatus,
          // Chỉ set isPaid = true khi status là completed
          // Đối với các trạng thái khác, không thay đổi trạng thái isPaid
          isPaid: newStatus === "completed" ? true : undefined,
        };
      }

      // Nếu status là "delivered", kiểm tra xem đơn hàng hiện tại có isPaid = true không
      if (updateData.status === "delivered" || updateData.status === "completed") {
        try {
          // Lấy thông tin đơn hàng hiện tại
          const orderResponse = await axios.get(`${API_URL}/${orderId}`);
          const currentOrder = orderResponse.data;
          
          // Nếu đơn hàng hiện tại đã thanh toán, giữ nguyên trạng thái isPaid = true
          if (currentOrder && (currentOrder.isPaid === true || currentOrder.isPaid === "true" || 
              currentOrder.isPaid === 1 || currentOrder.isPaid === "1")) {
            updateData.isPaid = true;
            console.log(`Đơn hàng ${orderId} đã được thanh toán trước đó, giữ nguyên trạng thái isPaid = true`);
            
            // Nếu đang cập nhật thành "delivered" và đơn hàng đã thanh toán, tự động chuyển thành "completed"
            if (updateData.status === "delivered") {
              console.log(`Đơn hàng ${orderId} đã thanh toán, tự động chuyển thành trạng thái "completed"`);
              updateData.status = "completed";
            }
          }
        } catch (err) {
          console.error("Lỗi khi kiểm tra trạng thái thanh toán của đơn hàng:", err);
          // Tiếp tục với dữ liệu hiện tại nếu có lỗi
        }
      }

      console.log("Dữ liệu gửi lên server:", updateData);
      
      // Thêm timestamp để tránh cache
      const timestamp = new Date().getTime();
      const response = await axios.patch(`${API_URL}/${orderId}?_t=${timestamp}`, updateData, {
        headers,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      throw error;
    }
  },

  // Thêm phương thức cập nhật trạng thái hàng loạt
  bulkUpdateStatus: async (orderIds, status) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Cập nhật isPaid nếu là trạng thái completed
      const updateData = {
        status,
        isPaid: status === "completed" ? true : undefined,
      };

      // Gửi các request tuần tự để đảm bảo thành công
      let successCount = 0;
      for (const id of orderIds) {
        try {
          // Nếu status là "delivered", kiểm tra xem đơn hàng hiện tại có isPaid = true không
          if (status === "delivered" || status === "completed") {
            try {
              // Lấy thông tin đơn hàng hiện tại
              const orderResponse = await axios.get(`${API_URL}/${id}`);
              const currentOrder = orderResponse.data;
              
              // Nếu đơn hàng hiện tại đã thanh toán, giữ nguyên trạng thái isPaid = true
              if (currentOrder && (currentOrder.isPaid === true || currentOrder.isPaid === "true" || 
                  currentOrder.isPaid === 1 || currentOrder.isPaid === "1")) {
                updateData.isPaid = true;
                console.log(`Đơn hàng ${id} đã được thanh toán trước đó, giữ nguyên trạng thái isPaid = true`);
                
                // Nếu đang cập nhật thành "delivered" và đơn hàng đã thanh toán, tự động chuyển thành "completed"
                if (status === "delivered") {
                  console.log(`Đơn hàng ${id} đã thanh toán, tự động chuyển thành trạng thái "completed"`);
                  updateData.status = "completed";
                }
              } else {
                // Reset lại isPaid nếu đơn hàng trước đó không được thanh toán
                updateData.isPaid = status === "completed" ? true : undefined;
                updateData.status = status; // Đảm bảo status được reset về giá trị ban đầu
              }
            } catch (err) {
              console.error(`Lỗi khi kiểm tra trạng thái thanh toán của đơn hàng ${id}:`, err);
              // Tiếp tục với dữ liệu hiện tại nếu có lỗi
            }
          }
          
          await axios.patch(`${API_URL}/${id}`, updateData, { headers });
          successCount++;
        } catch (err) {
          console.log(`Lỗi khi cập nhật đơn hàng ${id}:`, err);
        }
      }

      // Trả về kết quả giả lập để UI tiếp tục hoạt động
      return [{ success: true, count: successCount }];
    } catch (error) {
      console.error("Lỗi khi cập nhật hàng loạt đơn hàng:", error);
      // Trả về kết quả giả lập để UI không bị lỗi
      return [{ success: false, message: error.message }];
    }
  },

  // Thêm phương thức đánh dấu đơn hàng đã thanh toán
  markOrderAsPaid: async (orderId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Sử dụng endpoint payment-status chuyên dụng để cập nhật trạng thái thanh toán
      const updateData = {
        isPaid: true,
        paymentStatus: 'completed'
      };
      
      console.log(`Đánh dấu đơn hàng ${orderId} đã thanh toán với dữ liệu:`, updateData);
      
      // Thêm timestamp để tránh cache
      const timestamp = new Date().getTime();
      
      // Sử dụng endpoint payment-status
      const response = await axios.patch(`${API_URL}/${orderId}/payment-status?_t=${timestamp}`, updateData, { headers });
      
      console.log("Kết quả cập nhật trạng thái thanh toán:", response.data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi đánh dấu đơn hàng đã thanh toán:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      throw error;
    }
  },

  // Thêm phương thức xóa đơn hàng
  deleteOrder: async (orderId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await axios.delete(`${API_URL}/${orderId}`, { headers });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xóa đơn hàng:", error);
      throw error;
    }
  },
};

function generateRandomOrderCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default orderApi;
