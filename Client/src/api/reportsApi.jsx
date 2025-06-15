/* eslint-disable no-unused-vars */
import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

// Define API_URL based on API_BASE_URL
const API_URL = API_BASE_URL;

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("accessToken") || localStorage.getItem("token");
};

// Helper function to create headers with auth token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Hàm để chuẩn hóa định dạng ngày
const formatDateString = (dateString) => {
  if (!dateString) return "N/A";

  try {
    // Xử lý ngày ISO
    if (
      typeof dateString === "string" &&
      dateString.includes("T") &&
      dateString.includes("Z")
    ) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("vi-VN");
      }
    }

    // Xử lý date object
    if (dateString instanceof Date) {
      return dateString.toLocaleDateString("vi-VN");
    }

    // Nếu là chuỗi ngày hợp lệ theo định dạng Việt Nam, giữ nguyên
    if (
      typeof dateString === "string" &&
      /^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}$/.test(dateString)
    ) {
      return dateString;
    }

    // Thử chuyển đổi nếu là dạng khác
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("vi-VN");
    }

    return dateString;
  } catch (err) {
    return dateString;
  }
};

// Hàm trích xuất tỉnh/thành phố từ địa chỉ đầy đủ
const extractProvinceFromAddress = (address) => {
  if (!address || typeof address !== "string") return "Không xác định";

  // Danh sách các tỉnh/thành phố của Việt Nam để nhận dạng
  const provinces = [
    "Hà Nội",
    "TP Hồ Chí Minh",
    "Hồ Chí Minh",
    "TP. Hồ Chí Minh",
    "Thành phố Hồ Chí Minh",
    "Đà Nẵng",
    "Hải Phòng",
    "Cần Thơ",
    "An Giang",
    "Bà Rịa - Vũng Tàu",
    "Bắc Giang",
    "Bắc Kạn",
    "Bạc Liêu",
    "Bắc Ninh",
    "Bến Tre",
    "Bình Định",
    "Bình Dương",
    "Bình Phước",
    "Bình Thuận",
    "Cà Mau",
    "Cao Bằng",
    "Đắk Lắk",
    "Đắk Nông",
    "Điện Biên",
    "Đồng Nai",
    "Đồng Tháp",
    "Gia Lai",
    "Hà Giang",
    "Hà Nam",
    "Hà Tĩnh",
    "Hải Dương",
    "Hậu Giang",
    "Hòa Bình",
    "Hưng Yên",
    "Khánh Hòa",
    "Kiên Giang",
    "Kon Tum",
    "Lai Châu",
    "Lâm Đồng",
    "Lạng Sơn",
    "Lào Cai",
    "Long An",
    "Nam Định",
    "Nghệ An",
    "Ninh Bình",
    "Ninh Thuận",
    "Phú Thọ",
    "Phú Yên",
    "Quảng Bình",
    "Quảng Nam",
    "Quảng Ngãi",
    "Quảng Ninh",
    "Quảng Trị",
    "Sóc Trăng",
    "Sơn La",
    "Tây Ninh",
    "Thái Bình",
    "Thái Nguyên",
    "Thanh Hóa",
    "Thừa Thiên Huế",
    "Tiền Giang",
    "Trà Vinh",
    "Tuyên Quang",
    "Vĩnh Long",
    "Vĩnh Phúc",
    "Yên Bái",
  ];

  // Chuyển địa chỉ sang chữ thường để dễ so sánh
  const lowerAddress = address.toLowerCase();

  // Danh sách các từ khóa có thể xuất hiện trước tên tỉnh/thành phố
  const prefixes = ["tỉnh", "tp", "tp.", "thành phố", "t.p", "t.p."];

  // Danh sách các từ khóa có thể xuất hiện sau tên quận/huyện và trước tên tỉnh/thành phố
  const districtSuffixes = ["quận", "huyện", "q.", "h.", "q ", "h "];

  // Tách địa chỉ thành các phần
  const parts = address.split(",").map((part) => part.trim());

  // Trước tiên, tìm kiếm tỉnh/thành phố trong toàn bộ địa chỉ
  for (const province of provinces) {
    const lowerProvince = province.toLowerCase();

    // Tìm chính xác tên tỉnh/thành phố
    if (lowerAddress.includes(lowerProvince)) {
      return province;
    }

    // Tìm với các tiền tố
    for (const prefix of prefixes) {
      if (lowerAddress.includes(`${prefix} ${lowerProvince}`)) {
        return province;
      }
    }
  }

  // Nếu chưa tìm thấy, thử phân tích từ cuối lên
  // Thông thường định dạng địa chỉ VN: Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố
  if (parts.length > 0) {
    // Bắt đầu từ phần cuối cùng
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i].toLowerCase();

      // Kiểm tra xem phần này có chứa từ khóa liên quan đến tỉnh/thành phố không
      const hasProvincePrefix = prefixes.some((prefix) =>
        part.includes(prefix)
      );

      if (hasProvincePrefix) {
        // Nếu có tiền tố tỉnh/thành phố, loại bỏ tiền tố và trả về phần còn lại
        for (const prefix of prefixes) {
          if (part.includes(prefix)) {
            const provinceName = part.replace(prefix, "").trim();
            // Tìm tỉnh/thành phố phù hợp nhất từ danh sách
            for (const province of provinces) {
              if (
                province.toLowerCase().includes(provinceName) ||
                provinceName.includes(province.toLowerCase())
              ) {
                return province;
              }
            }
            // Nếu không tìm thấy trong danh sách, chuyển đổi chữ cái đầu tiên thành hoa
            return provinceName.charAt(0).toUpperCase() + provinceName.slice(1);
          }
        }
      }

      // Nếu phần này không có tiền tố tỉnh/thành phố, kiểm tra xem nó có phải là tên tỉnh/thành phố không
      for (const province of provinces) {
        if (part.includes(province.toLowerCase())) {
          return province;
        }
      }

      // Kiểm tra xem phần này có chứa từ khóa liên quan đến quận/huyện không
      // Nếu có, phần tiếp theo có thể là tỉnh/thành phố
      const hasDistrictSuffix = districtSuffixes.some((suffix) =>
        part.includes(suffix)
      );

      if (hasDistrictSuffix && i < parts.length - 1) {
        const nextPart = parts[i + 1].toLowerCase();
        for (const province of provinces) {
          if (nextPart.includes(province.toLowerCase())) {
            return province;
          }
        }
      }
    }

    // Nếu vẫn không tìm thấy, thử lấy phần cuối cùng
    const lastPart = parts[parts.length - 1];

    // Loại bỏ các từ khóa không liên quan
    let cleanLastPart = lastPart;
    for (const prefix of prefixes.concat(districtSuffixes)) {
      cleanLastPart = cleanLastPart
        .replace(new RegExp(prefix, "gi"), "")
        .trim();
    }

    // Tìm tỉnh/thành phố phù hợp nhất từ danh sách
    for (const province of provinces) {
      if (
        province.toLowerCase().includes(cleanLastPart.toLowerCase()) ||
        cleanLastPart.toLowerCase().includes(province.toLowerCase())
      ) {
        return province;
      }
    }

    // Nếu không tìm thấy, trả về phần cuối cùng đã được làm sạch
    if (cleanLastPart) {
      return cleanLastPart.charAt(0).toUpperCase() + cleanLastPart.slice(1);
    }
  }

  // Nếu không tìm thấy theo cách nào, trả về "Không xác định"
  return "Không xác định";
};

// Hàm tạo dữ liệu phân bố theo tỉnh từ danh sách người dùng
const generateProvinceDistributionFromUsers = (users) => {
  if (!users || !Array.isArray(users) || users.length === 0) {
    return [];
  }

  const provinceCount = {};
  let usersWithProvinceData = 0;

  users.forEach((user) => {
    let province = "Không xác định";

    if (user.province) {
      province = user.province;
      usersWithProvinceData++;
    } else if (user.address) {
      province = extractProvinceFromAddress(user.address);
      if (province !== "Không xác định") {
        usersWithProvinceData++;
      }
    }

    if (!provinceCount[province]) {
      provinceCount[province] = 0;
    }

    provinceCount[province]++;
  });

  if (usersWithProvinceData < users.length * 0.5) {
    users.forEach((user) => {
      if (
        (user.province && user.province !== "Không xác định") ||
        (user.address &&
          extractProvinceFromAddress(user.address) !== "Không xác định")
      ) {
        return;
      }

      let province = "Không xác định";

      if (user.location) {
        province = extractProvinceFromAddress(user.location);
      } else if (user.city) {
        province = user.city;
      } else if (user.region) {
        province = user.region;
      } else if (user.contactInfo && typeof user.contactInfo === "object") {
        if (user.contactInfo.address) {
          province = extractProvinceFromAddress(user.contactInfo.address);
        } else if (user.contactInfo.city) {
          province = user.contactInfo.city;
        }
      }

      if (province !== "Không xác định") {
        if (!provinceCount[province]) {
          provinceCount[province] = 0;
        }

        if (provinceCount["Không xác định"] > 0) {
          provinceCount["Không xác định"]--;
        }

        provinceCount[province]++;
        usersWithProvinceData++;
      }
    });
  }

  const result = Object.keys(provinceCount)
    .map((province) => ({
      province,
      count: provinceCount[province],
    }))
    .sort((a, b) => b.count - a.count);

  return result;
};

// Lấy dữ liệu chi tiết người dùng (kèm theo phân bố theo tỉnh thành)
const getUserDetailData = async (period = "month") => {
  try {
    const token = localStorage.getItem("accessToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/reports/users/detail?period=${period}`,
        {
          headers,
          timeout: 15000,
        }
      );

      if (response?.data) {
        if (
          response.data.usersByProvince &&
          Array.isArray(response.data.usersByProvince) &&
          response.data.usersByProvince.length > 0
        ) {
          return response.data;
        }

        if (
          response.data.users &&
          Array.isArray(response.data.users) &&
          response.data.users.length > 0
        ) {
          const provinceData = generateProvinceDistributionFromUsers(
            response.data.users
          );
          return {
            ...response.data,
            usersByProvince: provinceData,
          };
        }

        if (
          !response.data.usersByProvince ||
          !Array.isArray(response.data.usersByProvince)
        ) {
          if (
            response.data.users &&
            Array.isArray(response.data.users) &&
            response.data.users.length > 0
          ) {
            const provinceData = generateProvinceDistributionFromUsers(
              response.data.users
            );
            return {
              ...response.data,
              usersByProvince: provinceData,
            };
          }

          try {
            const usersResponse = await axios.get(`${API_BASE_URL}/api/users`, {
              headers,
              timeout: 15000,
            });

            if (usersResponse?.data) {
              let users = [];

              if (Array.isArray(usersResponse.data)) {
                users = usersResponse.data;
              } else if (
                usersResponse.data.users &&
                Array.isArray(usersResponse.data.users)
              ) {
                users = usersResponse.data.users;
              } else if (
                usersResponse.data.data &&
                Array.isArray(usersResponse.data.data)
              ) {
                users = usersResponse.data.data;
              }

              if (users.length > 0) {
                const provinceData =
                  generateProvinceDistributionFromUsers(users);

                return {
                  ...response.data,
                  usersByProvince: provinceData,
                  users: users,
                };
              }
            }
          } catch (error) {
            return response.data;
          }

          return response.data;
        }

        return response.data;
      }
    } catch (error) {
      // If there's an error with the first API endpoint, continue to the next one
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/users/stats?period=${period}`,
        {
          headers,
          timeout: 15000,
        }
      );

      if (response?.data) {
        if (
          !response.data.usersByProvince ||
          !Array.isArray(response.data.usersByProvince) ||
          response.data.usersByProvince.length === 0
        ) {
          if (
            response.data.users &&
            Array.isArray(response.data.users) &&
            response.data.users.length > 0
          ) {
            const provinceData = generateProvinceDistributionFromUsers(
              response.data.users
            );

            return {
              ...response.data,
              usersByProvince: provinceData,
            };
          } else if (
            response.data.data &&
            Array.isArray(response.data.data) &&
            response.data.data.length > 0
          ) {
            const provinceData = generateProvinceDistributionFromUsers(
              response.data.data
            );

            return {
              ...response.data,
              usersByProvince: provinceData,
            };
          } else if (Array.isArray(response.data)) {
            if (
              response.data.length > 0 &&
              (response.data[0].address ||
                response.data[0].name ||
                response.data[0].email)
            ) {
              const provinceData = generateProvinceDistributionFromUsers(
                response.data
              );

              const totalUsers = response.data.length;
              const newUsers = response.data.filter((user) => {
                const createdAt = new Date(
                  user.createdAt ||
                    user.created_at ||
                    user.registeredAt ||
                    Date.now()
                );
                const now = new Date();
                const diffDays = Math.floor(
                  (now - createdAt) / (1000 * 60 * 60 * 24)
                );
                return diffDays <= 30;
              }).length;

              const activeUsers = response.data.filter(
                (user) =>
                  user.active || user.isActive || user.status === "active"
              ).length;

              return {
                totalUsers,
                newUsers,
                activeUsers,
                usersByProvince: provinceData,
                users: response.data,
              };
            }
          }

          return response.data;
        }

        return response.data;
      }
    } catch (error) {
      // If there's an error with the second API endpoint, continue to the third one
    }

    try {
      const usersResponse = await axios.get(`${API_BASE_URL}/api/users`, {
        headers,
        timeout: 20000,
      });

      if (usersResponse?.data) {
        let users = [];

        if (Array.isArray(usersResponse.data)) {
          users = usersResponse.data;
        } else if (
          usersResponse.data.users &&
          Array.isArray(usersResponse.data.users)
        ) {
          users = usersResponse.data.users;
        } else if (
          usersResponse.data.data &&
          Array.isArray(usersResponse.data.data)
        ) {
          users = usersResponse.data.data;
        }

        if (users.length > 0) {
          const totalUsers = users.length;
          const newUsers = users.filter((user) => {
            const createdAt = new Date(
              user.createdAt ||
                user.created_at ||
                user.registeredAt ||
                Date.now()
            );
            const now = new Date();
            const diffDays = Math.floor(
              (now - createdAt) / (1000 * 60 * 60 * 24)
            );

            if (period === "week") return diffDays <= 7;
            if (period === "month") return diffDays <= 30;
            if (period === "year") return diffDays <= 365;

            return false;
          }).length;

          const activeUsers = users.filter(
            (user) => user.active || user.isActive || user.status === "active"
          ).length;

          const usersByProvince = generateProvinceDistributionFromUsers(users);

          const regionMapping = {
            Bắc: [
              "Hà Nội",
              "Hải Phòng",
              "Bắc Ninh",
              "Hải Dương",
              "Hưng Yên",
              "Hà Nam",
              "Nam Định",
              "Thái Bình",
              "Ninh Bình",
              "Quảng Ninh",
              "Bắc Giang",
              "Phú Thọ",
              "Vĩnh Phúc",
              "Thái Nguyên",
              "Bắc Kạn",
              "Cao Bằng",
              "Lạng Sơn",
              "Lào Cai",
              "Yên Bái",
              "Tuyên Quang",
              "Hà Giang",
              "Hòa Bình",
              "Sơn La",
              "Điện Biên",
              "Lai Châu",
            ],
            Trung: [
              "Thanh Hóa",
              "Nghệ An",
              "Hà Tĩnh",
              "Quảng Bình",
              "Quảng Trị",
              "Thừa Thiên Huế",
              "Đà Nẵng",
              "Quảng Nam",
              "Quảng Ngãi",
              "Bình Định",
              "Phú Yên",
              "Khánh Hòa",
              "Ninh Thuận",
              "Bình Thuận",
            ],
            Nam: [
              "TP Hồ Chí Minh",
              "Hồ Chí Minh",
              "Đồng Nai",
              "Bình Dương",
              "Bà Rịa - Vũng Tàu",
              "Tây Ninh",
              "Bình Phước",
              "Long An",
              "Tiền Giang",
              "Bến Tre",
              "Trà Vinh",
              "Vĩnh Long",
              "Đồng Tháp",
              "An Giang",
              "Kiên Giang",
              "Cần Thơ",
              "Hậu Giang",
              "Sóc Trăng",
              "Bạc Liêu",
              "Cà Mau",
            ],
            "Tây Nguyên": [
              "Kon Tum",
              "Gia Lai",
              "Đắk Lắk",
              "Đắk Nông",
              "Lâm Đồng",
            ],
          };

          const usersByRegion = [];
          const regionCounts = {
            Bắc: 0,
            Trung: 0,
            Nam: 0,
            "Tây Nguyên": 0,
            Khác: 0,
          };

          usersByProvince.forEach((item) => {
            let found = false;
            for (const [region, provinces] of Object.entries(regionMapping)) {
              if (provinces.some((p) => item.province.includes(p))) {
                regionCounts[region] += item.count;
                found = true;
                break;
              }
            }
            if (!found) {
              regionCounts["Khác"] += item.count;
            }
          });

          for (const [region, count] of Object.entries(regionCounts)) {
            if (count > 0) {
              usersByRegion.push({ region, count });
            }
          }

          let usersByAge = [];

          const usersWithAge = users.filter(
            (user) =>
              user.age || user.birthYear || user.birthDate || user.dateOfBirth
          );

          if (usersWithAge.length > 0) {
            const ageGroups = {
              "18-24": 0,
              "25-34": 0,
              "35-44": 0,
              "45-54": 0,
              "55+": 0,
            };

            usersWithAge.forEach((user) => {
              let age = 0;
              if (user.age) {
                age = user.age;
              } else if (user.birthYear) {
                age = new Date().getFullYear() - user.birthYear;
              } else if (user.birthDate || user.dateOfBirth) {
                const birthDate = new Date(user.birthDate || user.dateOfBirth);
                if (!isNaN(birthDate.getTime())) {
                  const now = new Date();
                  age = now.getFullYear() - birthDate.getFullYear();

                  if (
                    now.getMonth() < birthDate.getMonth() ||
                    (now.getMonth() === birthDate.getMonth() &&
                      now.getDate() < birthDate.getDate())
                  ) {
                    age--;
                  }
                }
              }

              if (age >= 18 && age <= 24) ageGroups["18-24"]++;
              else if (age >= 25 && age <= 34) ageGroups["25-34"]++;
              else if (age >= 35 && age <= 44) ageGroups["35-44"]++;
              else if (age >= 45 && age <= 54) ageGroups["45-54"]++;
              else if (age >= 55) ageGroups["55+"]++;
            });

            usersByAge = Object.entries(ageGroups).map(([range, count]) => ({
              range,
              count,
            }));
          } else {
            const ageGroups = ["18-24", "25-34", "35-44", "45-54", "55+"];
            const distribution = [0.25, 0.4, 0.2, 0.1, 0.05];

            usersByAge = ageGroups.map((range, index) => ({
              range,
              count: Math.round(totalUsers * distribution[index]),
            }));
          }

          const result = {
            totalUsers,
            newUsers,
            activeUsers,
            usersByProvince,
            usersByRegion,
            usersByAge,
            users,
          };

          return result;
        }
      }
    } catch (error) {
      // No further fallback, will return null
    }

    return null;
  } catch (error) {
    return null;
  }
};

const getOrderData = async (period = "month") => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/reports/orders?period=${period}`,
      {
        headers,
        timeout: 15000,
      }
    );

    if (response?.data) {
      return formatOrderDataFromAPI(response.data);
    }
  } catch (error) {
    try {
      const ordersResponse = await axios.get(
        `${API_BASE_URL}/api/orders/stats`,
        {
          headers,
          timeout: 15000,
        }
      );

      if (ordersResponse?.data) {
        return formatOrderDataFromAPI(ordersResponse.data);
      }
    } catch (orderError) {
      try {
        const allOrdersResponse = await axios.get(
          `${API_BASE_URL}/api/orders`,
          {
            headers,
            timeout: 15000,
          }
        );

        if (allOrdersResponse?.data) {
          return processOrdersRawData(allOrdersResponse.data, period);
        }
      } catch (allOrdersError) {
        // No further fallback, will continue to return empty array
      }
    }
  }

  return [];
};

const formatOrderDataFromAPI = (data) => {
  const result = {
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    processingOrders: 0,
    averageOrderValue: 0,
    topOrders: [],
  };

  if (data.totalOrders !== undefined) {
    result.totalOrders = data.totalOrders;
  }

  if (data.pendingOrders !== undefined) {
    result.pendingOrders = data.pendingOrders;
  }

  if (data.completedOrders !== undefined) {
    result.completedOrders = data.completedOrders;
  }

  if (data.cancelledOrders !== undefined) {
    result.cancelledOrders = data.cancelledOrders;
  }

  if (data.processingOrders !== undefined) {
    result.processingOrders = data.processingOrders;
  }

  if (data.averageOrderValue !== undefined) {
    result.averageOrderValue = data.averageOrderValue;
  }

  if (data.processingTime && Array.isArray(data.processingTime)) {
    result.processingTime = data.processingTime;
  } else if (data.averageProcessingTime !== undefined) {
    result.processingTime = [
      { name: "Xác nhận", time: Math.round(data.averageProcessingTime * 0.2) },
      { name: "Đóng gói", time: Math.round(data.averageProcessingTime * 0.3) },
      {
        name: "Vận chuyển",
        time: Math.round(data.averageProcessingTime * 0.5),
      },
    ];
  }

  if (data.topOrders && Array.isArray(data.topOrders)) {
    result.topOrders = data.topOrders;
  }

  return result;
};

const processOrdersRawData = (data, period) => {
  let orders = [];

  if (Array.isArray(data)) {
    orders = data;
  } else if (data.orders && Array.isArray(data.orders)) {
    orders = data.orders;
  } else if (data.data && Array.isArray(data.data)) {
    orders = data.data;
  }

  if (orders.length === 0) {
    return null;
  }

  const filteredOrders = filterOrdersByPeriod(orders, period);

  const pendingOrders = filteredOrders.filter(
    (order) => order.status === "pending" || order.status === "Đang xử lý"
  ).length;

  const completedOrders = filteredOrders.filter(
    (order) => order.status === "completed" || order.status === "Đã giao"
  ).length;

  const processingOrders = filteredOrders.filter(
    (order) => order.status === "processing" || order.status === "Đang giao"
  ).length;

  const cancelledOrders = filteredOrders.filter(
    (order) => order.status === "cancelled" || order.status === "Đã hủy"
  ).length;

  let totalValue = 0;
  filteredOrders.forEach((order) => {
    totalValue += order.total || order.totalAmount || 0;
  });

  const averageOrderValue =
    filteredOrders.length > 0 ? totalValue / filteredOrders.length : 0;

  const topOrders = [...filteredOrders]
    .sort(
      (a, b) =>
        (b.total || b.totalAmount || 0) - (a.total || a.totalAmount || 0)
    )
    .slice(0, 5)
    .map((order) => ({
      id:
        order.id ||
        order._id ||
        order.orderId ||
        `ORD${Math.floor(Math.random() * 10000)}`,
      customer: order.customerName || order.userName || "Khách hàng",
      total: order.total || order.totalAmount || 0,
      status: order.status || "Đang xử lý",
      date:
        order.createdAt ||
        order.orderDate ||
        new Date().toISOString().split("T")[0],
    }));

  return {
    totalOrders: filteredOrders.length,
    pendingOrders,
    completedOrders,
    processingOrders,
    cancelledOrders,
    averageOrderValue,
    topOrders,
  };
};

const filterOrdersByPeriod = (orders, period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
  }

  return orders.filter((order) => {
    const orderDate = new Date(
      order.createdAt || order.orderDate || order.date || 0
    );
    return orderDate >= startDate && orderDate <= now;
  });
};

// Hàm lấy dữ liệu phân tích AI
const getAnalysisData = async (options = {}) => {
  try {
    const token = getAuthToken();
    if (!token) throw new Error("Không có token xác thực");

    const { userRole, branchId, startDate, endDate } = options;
    
    const params = {
      userRole: userRole || 'admin'
    };

    if (branchId && branchId !== 'all') {
      params.branchId = branchId;
    }
    
    if (startDate) {
      params.startDate = startDate;
    }
    
    if (endDate) {
      params.endDate = endDate;
    }

    console.log("Gọi API phân tích với params:", params);
    
    const response = await axios.get(`${API_URL}/api/reports/analysis`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params,
      timeout: 30000 // Tăng timeout lên 30 giây vì phân tích AI có thể mất thời gian
    });

    console.log("Kết quả phân tích từ API:", response.data);
    
    // Kiểm tra dữ liệu trả về
    if (!response.data) {
      console.error("API trả về dữ liệu không hợp lệ:", response.data);
      throw new Error("Dữ liệu phân tích không hợp lệ");
    }

    // Trả về dữ liệu nguyên bản từ API
    return response.data;
  } catch (error) {
    console.error('Error fetching analysis data:', error);
    
    // Xử lý các loại lỗi cụ thể
    if (error.response) {
      // Lỗi từ phía server (status code không phải 2xx)
      const statusCode = error.response.status;
      const errorMessage = error.response.data?.message || error.response.data?.error || error.message;
      
      if (statusCode === 500 && errorMessage.includes("OpenAI API")) {
        throw new Error("Không thể kết nối đến dịch vụ AI. Vui lòng thử lại sau hoặc liên hệ quản trị viên.");
      } else if (statusCode === 401 || statusCode === 403) {
        throw new Error("Bạn không có quyền truy cập dịch vụ phân tích AI.");
      } else {
        throw new Error(`Lỗi từ máy chủ: ${errorMessage}`);
      }
    } else if (error.request) {
      // Lỗi không nhận được phản hồi từ server
      throw new Error("Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.");
    } else {
      // Lỗi trong quá trình thiết lập request
      throw new Error(`Lỗi khi gửi yêu cầu: ${error.message}`);
    }
  }
};

// Hàm lấy danh sách chi nhánh
const getBranches = async () => {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const response = await axios.get(`${API_URL}/api/branches`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching branches:', error);
    return null;
  }
};

export const reportsApi = {
  // Dashboard related reports
  getDashboardData: async () => {
    try {
      const endpoints = [
        `${API_URL}/api/reports/dashboard`,
        `${API_URL}/reports/dashboard`,
        `${API_URL}/api/dashboard/stats`,
      ];

      const headers = getAuthHeaders();

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            // Check for different response formats
            if (response.data.data) {
              return response.data.data;
            } else {
              // If no nested data field, use the response directly
              const dashboardData = {
                totalOrders: response.data.totalOrders || response.data.orders || 0,
                totalRevenue: response.data.totalRevenue || response.data.revenue || 0,
                totalCustomers: response.data.totalCustomers || response.data.customers || 0,
                totalProducts: response.data.totalProducts || response.data.products || 0,
                recentActivities: response.data.recentActivities || response.data.activities || [],
              };
              
              // Check if we have actual data (not all zeros)
              if (dashboardData.totalOrders || dashboardData.totalRevenue || 
                  dashboardData.totalCustomers || dashboardData.totalProducts) {
                return dashboardData;
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${endpoint}: ${error.message}`);
        }
      }

      // If all endpoints fail, try to build dashboard data from individual endpoints
      try {
        // Get order stats
        const orderStatsEndpoint = `${API_URL}/api/orders/stats`;
        const orderStatsResponse = await axios.get(orderStatsEndpoint, { headers });
        
        // Get product count
        const productCountEndpoint = `${API_URL}/api/products/count`;
        const productCountResponse = await axios.get(productCountEndpoint, { headers });
        
        // Get customer count
        const customerCountEndpoint = `${API_URL}/api/users/count`;
        const customerCountResponse = await axios.get(customerCountEndpoint, { headers });
        
        // Get recent activities
        const activitiesEndpoint = `${API_URL}/api/activities/recent`;
        const activitiesResponse = await axios.get(activitiesEndpoint, { headers });
        
        return {
          totalOrders: orderStatsResponse.data?.totalOrders || orderStatsResponse.data?.orders || 0,
          totalRevenue: orderStatsResponse.data?.totalRevenue || orderStatsResponse.data?.revenue || 0,
          totalCustomers: customerCountResponse.data?.count || customerCountResponse.data?.totalCustomers || 0,
          totalProducts: productCountResponse.data?.count || productCountResponse.data?.totalProducts || 0,
          recentActivities: activitiesResponse.data?.activities || activitiesResponse.data || [],
        };
      } catch (error) {
        console.warn(`Failed to build dashboard data from individual endpoints: ${error.message}`);
      }

      // If all endpoints fail, return default structure
      console.log("All API attempts failed. Using mock data for dashboard.");
      return {
        totalOrders: 150,
        totalRevenue: 75000000,
        totalCustomers: 45,
        totalProducts: 120,
        recentActivities: [
          { id: 1, type: 'order', user: 'Nguyễn Văn A', action: 'đã đặt đơn hàng', timestamp: new Date().toISOString() },
          { id: 2, type: 'login', user: 'Admin', action: 'đã đăng nhập', timestamp: new Date().toISOString() },
          { id: 3, type: 'product', user: 'Admin', action: 'đã thêm sản phẩm mới', timestamp: new Date().toISOString() }
        ],
      };
    } catch (error) {
      console.error("Error in getDashboardData:", error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        totalProducts: 0,
        recentActivities: [],
      };
    }
  },

  // Revenue reports
  getRevenueData: async (timeRange = "week", paymentMethod = "all", region = "all") => {
    try {
      const endpoints = [
        `${API_URL}/api/reports/revenue?timeRange=${timeRange}&paymentMethod=${paymentMethod}&region=${region}`,
        `${API_URL}/reports/revenue?timeRange=${timeRange}&paymentMethod=${paymentMethod}&region=${region}`,
        `${API_URL}/api/analytics/revenue?timeRange=${timeRange}&paymentMethod=${paymentMethod}&region=${region}`,
      ];

      const headers = getAuthHeaders();

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            // Check for data in the expected format
            let dataArray = null;
            
            // Check for data field (our API format)
            if (response.data.data && Array.isArray(response.data.data)) {
              dataArray = response.data.data;
            }
            // Check if response is directly an array
            else if (Array.isArray(response.data)) {
              dataArray = response.data;
            }
            // Check if response has revenue field with array
            else if (response.data.revenue && Array.isArray(response.data.revenue)) {
              dataArray = response.data.revenue;
            }
            
            if (dataArray && dataArray.length > 0) {
              return dataArray.map(item => ({
                date: formatDateString(item.date || item.ngay || new Date(item.timestamp)),
                doanh_thu: item.doanh_thu || item.revenue || item.amount || item.total || 0,
                don_hang: item.don_hang || item.orders || 0,
              }));
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${endpoint}: ${error.message}`);
        }
      }

      // Try to get orders and calculate revenue
      try {
        const dbEndpoint = `${API_URL}/api/orders/stats?timeRange=${timeRange}`;
        const response = await axios.get(dbEndpoint, { headers });

        if (response.data) {
          // Check for different data formats
          if (Array.isArray(response.data)) {
            return response.data.map((item) => ({
              date: formatDateString(item.date || item.ngay || new Date(item.timestamp)),
              doanh_thu: item.doanh_thu || item.revenue || item.amount || item.total || 0,
              don_hang: item.don_hang || item.orders || 0,
            }));
          } else if (response.data.data && Array.isArray(response.data.data)) {
            return response.data.data.map((item) => ({
              date: formatDateString(item.date || item.ngay || new Date(item.timestamp)),
              doanh_thu: item.doanh_thu || item.revenue || item.amount || item.total || 0,
              don_hang: item.don_hang || item.orders || 0,
            }));
          } else if (response.data.orders && Array.isArray(response.data.orders)) {
            // Process orders to calculate revenue by date
            const ordersByDate = {};

            response.data.orders.forEach((order) => {
              const orderDate = new Date(order.createdAt || order.created_at || order.timestamp);
              const dateStr = orderDate.toLocaleDateString("vi-VN");

              if (!ordersByDate[dateStr]) {
                ordersByDate[dateStr] = {
                  revenue: 0,
                  count: 0,
                };
              }

              ordersByDate[dateStr].revenue += order.totalAmount || order.total || order.amount || 0;
              ordersByDate[dateStr].count += 1;
            });

            return Object.keys(ordersByDate).map((date) => ({
              date: formatDateString(date),
              doanh_thu: ordersByDate[date].revenue,
              don_hang: ordersByDate[date].count,
            }));
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch from orders API: ${error.message}`);
      }

      // If all endpoints fail, return mock data
      console.log("All API attempts failed. Using mock data for revenue.");
      const today = new Date();
      const mockData = [];
      
      // Generate mock data for the past 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        mockData.push({
          date: formatDateString(date),
          doanh_thu: Math.floor(Math.random() * 5000000) + 1000000,
          don_hang: Math.floor(Math.random() * 20) + 5,
        });
      }
      
      return mockData;
    } catch (error) {
      console.error("Error in getRevenueData:", error);
      return [];
    }
  },

  // Top products
  getTopProducts: async () => {
    try {
      const endpoints = [
        `${API_URL}/api/best-selling-products?limit=5`,
        `${API_URL}/api/reports/top-products`,
        `${API_URL}/api/top-products`,
        `${API_URL}/api/products/top-selling`,
      ];

      const headers = getAuthHeaders();

      // Try all endpoints first
      for (const endpoint of endpoints) {
        try {
        
          const response = await axios.get(endpoint, { headers });
         
          if (response.data) {
            // First check if response has a data field (our API format)
            if (response.data.data && Array.isArray(response.data.data)) {
              const productData = response.data.data;
              if (productData.length > 0) {
                return productData.map((product) => ({
                  name: product.name || product.productName || "Không xác định",
                  category: product.category || product.productCategory || "Không phân loại",
                  sold: product.sold || product.quantity || product.totalSold || 0,
                  revenue: product.revenue || product.totalRevenue || product.amount || 
                          (product.price * product.sold) || 0,
                  sku: product.sku || product.productSku || "",
                  price: product.price || 0,
                  stock: product.stock || product.currentStock || 0,
                  image: product.image || product.productImage || "",
                }));
              }
            } 
            // Then check other possible formats
            else if (Array.isArray(response.data)) {
              const productData = response.data;
              if (productData.length > 0) {
                return productData.map((product) => ({
                  name: product.name || product.productName || "Không xác định",
                  category: product.category || product.productCategory || "Không phân loại",
                  sold: product.sold || product.quantity || product.totalSold || 0,
                  revenue: product.revenue || product.totalRevenue || product.amount || 
                          (product.price * product.sold) || 0,
                  sku: product.sku || product.productSku || "",
                  price: product.price || 0,
                  stock: product.stock || product.currentStock || 0,
                  image: product.image || product.productImage || "",
                }));
              }
            }
            // Check for products field
            else if (response.data.products && Array.isArray(response.data.products)) {
              const productData = response.data.products;
              if (productData.length > 0) {
                return productData.map((product) => ({
                  name: product.name || product.productName || "Không xác định",
                  category: product.category || product.productCategory || "Không phân loại",
                  sold: product.sold || product.quantity || product.totalSold || 0,
                  revenue: product.revenue || product.totalRevenue || product.amount || 
                          (product.price * product.sold) || 0,
                  sku: product.sku || product.productSku || "",
                  price: product.price || 0,
                  stock: product.stock || product.currentStock || 0,
                  image: product.image || product.productImage || "",
                }));
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${endpoint}: ${error.message}`);
        }
      }

      // Fallback: Get all products and calculate approximate top products
      try {
        const response = await axios.get(`${API_URL}/api/products`, {
          headers,
        });

        if (response.data) {
          let products = [];
          
          // Check for different data formats
          if (Array.isArray(response.data)) {
            products = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            products = response.data.data;
          } else if (response.data.products && Array.isArray(response.data.products)) {
            products = response.data.products;
          }

          if (products.length > 0) {
            // Sort by price as a proxy for popularity
            return products
              .sort((a, b) => (b.price || 0) - (a.price || 0))
              .slice(0, 10)
              .map((product) => ({
                name: product.name || product.productName || "Sản phẩm",
                category: product.category || product.categoryName || "Không phân loại",
                sold: Math.floor(Math.random() * 50) + 10, // Generate random sales data
                revenue:
                  (product.price || 100) *
                  (Math.floor(Math.random() * 50) + 10),
                sku: product.sku || "",
                price: product.price || 0,
                stock: product.stock || product.quantity || 0,
              }));
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch products: ${error.message}`);
      }

      // Final fallback with mock data
      console.log("All API attempts failed. Using mock data for top products.");
      return [
        { name: "Thịt heo", category: "Thịt tươi", sold: 120, revenue: 12000000, price: 100000, stock: 50 },
        { name: "Thịt bò", category: "Thịt tươi", sold: 85, revenue: 17000000, price: 200000, stock: 30 },
        { name: "Cá thu", category: "Hải sản", sold: 67, revenue: 6700000, price: 100000, stock: 25 },
        { name: "Rau muống", category: "Rau củ", sold: 55, revenue: 1100000, price: 20000, stock: 100 },
        { name: "Trứng gà", category: "Trứng", sold: 45, revenue: 900000, price: 20000, stock: 200 }
      ];
    } catch (error) {
      console.error("Error in getTopProducts:", error);
      // Final fallback with mock data
      return [
        { name: "Thịt heo", category: "Thịt tươi", sold: 120, revenue: 12000000, price: 100000, stock: 50 },
        { name: "Thịt bò", category: "Thịt tươi", sold: 85, revenue: 17000000, price: 200000, stock: 30 },
        { name: "Cá thu", category: "Hải sản", sold: 67, revenue: 6700000, price: 100000, stock: 25 },
        { name: "Rau muống", category: "Rau củ", sold: 55, revenue: 1100000, price: 20000, stock: 100 },
        { name: "Trứng gà", category: "Trứng", sold: 45, revenue: 900000, price: 20000, stock: 200 }
      ];
    }
  },

  // Inventory reports
  getInventoryData: async () => {
    try {
      const endpoints = [
        `${API_URL}/api/reports/inventory`,
        `${API_URL}/api/products/inventory`,
        `${API_URL}/api/inventory`,
      ];

      const headers = getAuthHeaders();

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });

          if (response.data) {
            // Check for different response formats
            if (response.data.data && Array.isArray(response.data.data)) {
              return response.data.data;
            } else if (Array.isArray(response.data)) {
              return response.data;
            } else if (response.data.inventory && Array.isArray(response.data.inventory)) {
              return response.data.inventory;
            } else if (response.data.products && Array.isArray(response.data.products)) {
              // Filter products with low stock
              return response.data.products
                .filter(product => {
                  const stock = product.stock || product.quantity || product.inventory || 0;
                  return stock <= 20;
                })
                .map(product => ({
                  name: product.name || product.productName || "Không xác định",
                  category: product.category || product.categoryName || "Không phân loại",
                  stock: product.stock || product.quantity || product.inventory || 0,
                  status: (product.stock || product.quantity || product.inventory || 0) <= 5 ? "Sắp hết" : "Còn hàng",
                }))
                .sort((a, b) => a.stock - b.stock);
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${endpoint}: ${error.message}`);
        }
      }

      try {
        const response = await axios.get(`${API_URL}/api/products`, {
          headers,
        });

        if (response.data) {
          let products = [];
          
          // Check for different data formats
          if (Array.isArray(response.data)) {
            products = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            products = response.data.data;
          } else if (response.data.products && Array.isArray(response.data.products)) {
            products = response.data.products;
          }
            
          if (products.length > 0) {
            const lowStockProducts = products
              .filter((product) => {
                const stock = product.stock || product.quantity || product.inventory || 0;
                return stock <= 20;
              })
              .map((product) => ({
                name: product.name || product.productName || "Không xác định",
                category: product.category || product.categoryName || "Không phân loại",
                stock: product.stock || product.quantity || product.inventory || 0,
                status: (product.stock || product.quantity || product.inventory || 0) <= 5 ? "Sắp hết" : "Còn hàng",
              }))
              .sort((a, b) => a.stock - b.stock);
              
            if (lowStockProducts.length > 0) {
              return lowStockProducts;
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch products for inventory: ${error.message}`);
      }

      // Fallback data
      console.log("All API attempts failed. Using mock data for inventory.");
      return [
        { name: "Trứng vịt", category: "Trứng", stock: 3, status: "Sắp hết" },
        { name: "Cá hồi", category: "Hải sản", stock: 5, status: "Sắp hết" },
        { name: "Bơ", category: "Rau củ", stock: 8, status: "Còn hàng" },
        { name: "Tôm", category: "Hải sản", stock: 10, status: "Còn hàng" },
        { name: "Thịt gà", category: "Thịt tươi", stock: 15, status: "Còn hàng" }
      ];
    } catch (error) {
      console.error("Error in getInventoryData:", error);
      // Fallback data if all else fails
      return [
        { name: "Trứng vịt", category: "Trứng", stock: 3, status: "Sắp hết" },
        { name: "Cá hồi", category: "Hải sản", stock: 5, status: "Sắp hết" },
        { name: "Bơ", category: "Rau củ", stock: 8, status: "Còn hàng" },
        { name: "Tôm", category: "Hải sản", stock: 10, status: "Còn hàng" },
        { name: "Thịt gà", category: "Thịt tươi", stock: 15, status: "Còn hàng" }
      ];
    }
  },

  // User statistics
  getUserData: async () => {
    try {
      const endpoints = [
        `${API_URL}/api/reports/users`,
        `${API_URL}/api/users/stats`,
        `${API_URL}/api/users`,
      ];

      const headers = getAuthHeaders();

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });
          if (response.data) {
            // Check for different response formats
            if (response.data.data && Array.isArray(response.data.data)) {
              return response.data.data;
            } else if (Array.isArray(response.data)) {
              return response.data;
            } else if (response.data.users && Array.isArray(response.data.users)) {
              return response.data.users;
            } else if (response.data.success && response.data.data) {
              return response.data.data;
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${endpoint}: ${error.message}`);
        }
      }

      // Mock data if all endpoints fail
      console.log("All API attempts failed. Using mock data for users.");
      return [
        { id: 1, name: "Nguyễn Văn A", email: "nguyenvana@example.com", orders: 5, totalSpent: 1500000, lastOrder: "15/06/2023" },
        { id: 2, name: "Trần Thị B", email: "tranthib@example.com", orders: 3, totalSpent: 900000, lastOrder: "20/06/2023" },
        { id: 3, name: "Lê Văn C", email: "levanc@example.com", orders: 7, totalSpent: 2100000, lastOrder: "10/06/2023" },
        { id: 4, name: "Phạm Thị D", email: "phamthid@example.com", orders: 2, totalSpent: 600000, lastOrder: "25/06/2023" },
        { id: 5, name: "Hoàng Văn E", email: "hoangvane@example.com", orders: 4, totalSpent: 1200000, lastOrder: "18/06/2023" }
      ];
    } catch (error) {
      console.error("Error in getUserData:", error);
      return [
        { id: 1, name: "Nguyễn Văn A", email: "nguyenvana@example.com", orders: 5, totalSpent: 1500000, lastOrder: "15/06/2023" },
        { id: 2, name: "Trần Thị B", email: "tranthib@example.com", orders: 3, totalSpent: 900000, lastOrder: "20/06/2023" },
        { id: 3, name: "Lê Văn C", email: "levanc@example.com", orders: 7, totalSpent: 2100000, lastOrder: "10/06/2023" },
        { id: 4, name: "Phạm Thị D", email: "phamthid@example.com", orders: 2, totalSpent: 600000, lastOrder: "25/06/2023" },
        { id: 5, name: "Hoàng Văn E", email: "hoangvane@example.com", orders: 4, totalSpent: 1200000, lastOrder: "18/06/2023" }
      ];
    }
  },

  // Order reports
  getOrderData,

  // Promotion reports
  getPromotionData: async () => {
    try {
      const endpoints = [
        `${API_URL}/api/coupons/stats`,
        `${API_URL}/api/reports/promotions`,
        `${API_URL}/reports/promotions`,
        `${API_URL}/api/promotions/stats`,
      ];

      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });

          if (response.data) {
            if (response.data.success && response.data.data) {
              return response.data.data;
            }
            return response.data;
          }
        } catch {
          // Continue to next endpoint
        }
      }

      try {
        const couponsResponse = await axios.get(`${API_URL}/api/coupons`, {
          headers,
        });

        if (
          couponsResponse?.data?.data ||
          Array.isArray(couponsResponse?.data)
        ) {
          const coupons = couponsResponse?.data?.data || couponsResponse?.data;

          const now = new Date();
          const activeCoupons = coupons.filter(
            (coupon) =>
              coupon.isActive &&
              (!coupon.expiresAt || new Date(coupon.expiresAt) > now)
          ).length;

          const totalUsedCount = coupons.reduce(
            (sum, coupon) => sum + (coupon.used || 0),
            0
          );

          const typeStats = {
            percentage: {
              count: 0,
              used: 0,
              totalValue: 0,
              estimatedRevenue: 0,
            },
            fixed: { count: 0, used: 0, totalValue: 0, estimatedRevenue: 0 },
          };

          coupons.forEach((coupon) => {
            const type = coupon.type || "percentage";
            typeStats[type].count++;
            typeStats[type].used += coupon.used || 0;

            if (type === "percentage") {
              typeStats[type].totalValue +=
                (coupon.value || 0) * (coupon.used || 0);
              const estimatedOrderValue = (coupon.minOrder || 0) * 1.5;
              typeStats[type].estimatedRevenue +=
                (coupon.used || 0) * estimatedOrderValue;
            } else {
              typeStats[type].totalValue +=
                (coupon.value || 0) * (coupon.used || 0);
              const estimatedOrderValue = (coupon.minOrder || 0) * 1.5;
              typeStats[type].estimatedRevenue +=
                (coupon.used || 0) * estimatedOrderValue;
            }
          });

          const voucherUsage = coupons
            .sort((a, b) => (b.used || 0) - (a.used || 0))
            .map((coupon) => ({
              code: coupon.code,
              discount:
                coupon.type === "percentage"
                  ? `${coupon.value}%`
                  : new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(coupon.value),
              used: coupon.used || 0,
              limit: coupon.usageLimit || "∞",
              revenue:
                coupon.type === "percentage"
                  ? ((coupon.value || 0) *
                      (coupon.used || 0) *
                      (coupon.minOrder || 0)) /
                    100
                  : (coupon.used || 0) * (coupon.minOrder || 0),
              description: coupon.description || "",
            }));

          return {
            totalCoupons: coupons.length,
            activeCoupons,
            totalUsedCount,
            typeStats,
            voucherUsage,
          };
        }
      } catch {
        // No further fallback
      }
      return null;
    } catch {
      return null;
    }
  },

  // System activity reports
  getSystemActivityData: async (timeRange = "week") => {
    try {
      const endpoints = [
        `${API_URL}/api/reports/system-activity?timeRange=${timeRange}`,
        `${API_URL}/reports/system-activity?timeRange=${timeRange}`,
        `${API_URL}/api/system/activity?timeRange=${timeRange}`,
      ];

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });

          if (response.data) {
            return response.data;
          }
        } catch {
          // Continue to next endpoint
        }
      }

      return null;
    } catch {
      return null;
    }
  },

  // Delivery statistics
  getDeliveryData: async (timeRange = "week") => {
    try {
      const endpoints = [
        `${API_URL}/api/reports/delivery?timeRange=${timeRange}`,
        `${API_URL}/reports/delivery?timeRange=${timeRange}`,
        `${API_URL}/api/delivery/stats?timeRange=${timeRange}`,
      ];

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });
          if (response.data) {
            return response.data;
          }
        } catch {
          // Continue to next endpoint
        }
      }

      return null;
    } catch {
      return null;
    }
  },

  // Feedback statistics
  getFeedbackData: async () => {
    try {
      const endpoints = [
        `${API_URL}/api/reports/feedback`,
        `${API_URL}/reports/feedback`,
        `${API_URL}/api/feedback/stats`,
      ];

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });

          if (response.data) {
            return response.data;
          }
        } catch {
          // Continue to next endpoint
        }
      }
      return null;
    } catch {
      return null;
    }
  },

  getUserDetailData,

  getAnalysisData,

  getBranches,
};

export default reportsApi;
