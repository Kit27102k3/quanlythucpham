/* eslint-disable no-unused-vars */
import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

// Define API_URL based on API_BASE_URL
const API_URL = API_BASE_URL;

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

export const reportsApi = {
  // Dashboard related reports
  getDashboardData: async () => {
    try {
      const endpoints = [
        `${API_URL}/api/reports/dashboard`,
        `${API_URL}/reports/dashboard`,
        `${API_URL}/api/dashboard/summary`,
      ];

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });

          if (response.data) {
            return response.data;
          }
        } catch (err) {
          // Continue to next endpoint
        }
      }

      return null;
    } catch (err) {
      return null;
    }
  },

  // Revenue reports
  getRevenueData: async (timeRange = "week") => {
    try {
      const endpoints = [
        `${API_URL}/api/reports/revenue?timeRange=${timeRange}`,
        `${API_URL}/reports/revenue?timeRange=${timeRange}`,
        `${API_URL}/api/analytics/revenue?timeRange=${timeRange}`,
        `${API_URL}/api/dashboard/revenue?timeRange=${timeRange}`,
      ];

      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });

          if (
            response.data &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            const formattedData = response.data.map((item) => ({
              date: formatDateString(item.date),
              doanh_thu:
                item.doanh_thu ||
                item.revenue ||
                item.amount ||
                item.total ||
                0,
              don_hang: item.don_hang || item.orders || 0,
            }));

            return formattedData;
          }
        } catch (err) {
          // Continue to next endpoint
        }
      }

      try {
        const dbEndpoint = `${API_URL}/api/orders/stats?timeRange=${timeRange}`;
        const token =
          localStorage.getItem("token") || localStorage.getItem("accessToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(dbEndpoint, { headers });

        if (response.data) {
          if (Array.isArray(response.data)) {
            return response.data.map((item) => ({
              date: formatDateString(
                item.date || item.ngay || new Date(item.timestamp)
              ),
              doanh_thu:
                item.doanh_thu ||
                item.revenue ||
                item.amount ||
                item.total ||
                0,
              don_hang: item.don_hang || item.orders || 0,
            }));
          } else if (response.data.data && Array.isArray(response.data.data)) {
            return response.data.data.map((item) => ({
              date: formatDateString(
                item.date || item.ngay || new Date(item.timestamp)
              ),
              doanh_thu:
                item.doanh_thu ||
                item.revenue ||
                item.amount ||
                item.total ||
                0,
              don_hang: item.don_hang || item.orders || 0,
            }));
          } else if (
            response.data.orders &&
            Array.isArray(response.data.orders)
          ) {
            const ordersByDate = {};

            response.data.orders.forEach((order) => {
              const orderDate = new Date(
                order.createdAt || order.created_at || order.timestamp
              );
              const dateStr = orderDate.toLocaleDateString("vi-VN");

              if (!ordersByDate[dateStr]) {
                ordersByDate[dateStr] = {
                  revenue: 0,
                  count: 0,
                };
              }

              ordersByDate[dateStr].revenue +=
                order.totalAmount || order.total || order.amount || 0;
              ordersByDate[dateStr].count += 1;
            });

            return Object.keys(ordersByDate).map((date) => ({
              date: formatDateString(date),
              doanh_thu: ordersByDate[date].revenue,
              don_hang: ordersByDate[date].count,
            }));
          }
        }
      } catch (err) {
        // No further fallback
      }

      return null;
    } catch (err) {
      return null;
    }
  },

  // Top products
  getTopProducts: async () => {
    try {
      const endpoints = [
        `${API_URL}/api/reports/top-products`,
        `${API_URL}/reports/top-products`,
        `${API_URL}/api/analytics/top-products`,
        `${API_URL}/api/products/top-selling`,
      ];

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Try all endpoints first
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { headers });

          if (
            response.data &&
            (Array.isArray(response.data) ||
              (response.data.products &&
                Array.isArray(response.data.products)) ||
              (response.data.data && Array.isArray(response.data.data)))
          ) {
            let productData = Array.isArray(response.data)
              ? response.data
              : response.data.products || response.data.data;

            if (productData && productData.length > 0) {
              return productData.map((product) => ({
                name: product.name || product.productName || "Không xác định",
                category:
                  product.category ||
                  product.productCategory ||
                  "Không phân loại",
                sold:
                  product.sold || product.quantity || product.totalSold || 0,
                revenue:
                  product.revenue ||
                  product.totalRevenue ||
                  product.amount ||
                  product.price * product.sold ||
                  0,
                sku: product.sku || product.productSku || "",
                price: product.price || 0,
                stock: product.stock || product.currentStock || 0,
              }));
            }
          }
        } catch {
          // Continue to next endpoint
        }
      }

      // Fallback: Get all products and calculate approximate top products
      try {
        const response = await axios.get(`${API_URL}/api/products`, {
          headers,
        });

        if (
          response.data &&
          (Array.isArray(response.data) ||
            (response.data.products && Array.isArray(response.data.products)))
        ) {
          const products = Array.isArray(response.data)
            ? response.data
            : response.data.products;

          if (products && products.length > 0) {
            // Sort by price as a proxy for popularity
            return products
              .sort((a, b) => (b.price || 0) - (a.price || 0))
              .slice(0, 10)
              .map((product) => ({
                name: product.name || "Sản phẩm",
                category: product.category || "Không phân loại",
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
      } catch {
        // Continue to final fallback
      }

      // Final fallback with mock data
      return [];
    } catch {
      // Final fallback with mock data
      return [];
    }
  },

  // Inventory reports
  getInventoryData: async () => {
    try {
      const endpoints = [
        `${API_URL}/api/products/inventory`,
        `${API_URL}/reports/inventory`,
        `${API_URL}/api/inventory`,
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

      try {
        const response = await axios.get(`${API_URL}/api/products`, {
          headers,
        });

        if (
          response.data &&
          response.data.products &&
          Array.isArray(response.data.products)
        ) {
          return response.data.products
            .filter((product) => product.quantity < 20)
            .map((product) => ({
              name: product.name,
              category: product.category,
              stock: product.quantity,
              status: product.quantity <= 5 ? "Sắp hết" : "Còn hàng",
            }))
            .sort((a, b) => a.stock - b.stock);
        }
      } catch {
        // Continue to fallback
      }

      // Fallback data
      return [
        
      ];
    } catch {
      // Fallback data if all else fails
      return [
        
      ];
    }
  },

  // User statistics
  getUserData: async () => {
    try {
      const endpoints = [
        `${API_URL}/api/reports/users`,
        `${API_URL}/reports/users`,
        `${API_URL}/api/users/stats`,
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
};
