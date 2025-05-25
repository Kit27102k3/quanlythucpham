import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

// Define API_URL based on API_BASE_URL
const API_URL = API_BASE_URL;

// Hàm để chuẩn hóa định dạng ngày
const formatDateString = (dateString) => {
  if (!dateString) return "N/A";
  
  try {
    // Xử lý ngày ISO
    if (typeof dateString === 'string' && dateString.includes('T') && dateString.includes('Z')) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('vi-VN');
      }
    }
    
    // Xử lý date object
    if (dateString instanceof Date) {
      return dateString.toLocaleDateString('vi-VN');
    }
    
    // Nếu là chuỗi ngày hợp lệ theo định dạng Việt Nam, giữ nguyên
    if (typeof dateString === 'string' && /^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // Thử chuyển đổi nếu là dạng khác
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('vi-VN');
    }
    
    return dateString;
  } catch (err) {
    console.warn(`Error formatting date: ${dateString}`, err);
    return dateString;
  }
};

// Hàm trích xuất tỉnh/thành phố từ địa chỉ đầy đủ
const extractProvinceFromAddress = (address) => {
  if (!address || typeof address !== 'string') return "Không xác định";

  // Danh sách các tỉnh/thành phố của Việt Nam để nhận dạng
  const provinces = [
    "Hà Nội", "TP Hồ Chí Minh", "Hồ Chí Minh", "TP. Hồ Chí Minh", "Thành phố Hồ Chí Minh", "Đà Nẵng", 
    "Hải Phòng", "Cần Thơ", "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", 
    "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", 
    "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông", "Điện Biên", 
    "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Tĩnh", 
    "Hải Dương", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", 
    "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", 
    "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", 
    "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", 
    "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", 
    "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
  ];

  // Chuyển địa chỉ sang chữ thường để dễ so sánh
  const lowerAddress = address.toLowerCase();
  
  // Danh sách các từ khóa có thể xuất hiện trước tên tỉnh/thành phố
  const prefixes = ["tỉnh", "tp", "tp.", "thành phố", "t.p", "t.p."];
  
  // Danh sách các từ khóa có thể xuất hiện sau tên quận/huyện và trước tên tỉnh/thành phố
  const districtSuffixes = ["quận", "huyện", "q.", "h.", "q ", "h "];
  
  // Tách địa chỉ thành các phần
  const parts = address.split(',').map(part => part.trim());
  
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
      const hasProvincePrefix = prefixes.some(prefix => part.includes(prefix));
      
      if (hasProvincePrefix) {
        // Nếu có tiền tố tỉnh/thành phố, loại bỏ tiền tố và trả về phần còn lại
        for (const prefix of prefixes) {
          if (part.includes(prefix)) {
            const provinceName = part.replace(prefix, '').trim();
            // Tìm tỉnh/thành phố phù hợp nhất từ danh sách
            for (const province of provinces) {
              if (province.toLowerCase().includes(provinceName) || provinceName.includes(province.toLowerCase())) {
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
      const hasDistrictSuffix = districtSuffixes.some(suffix => part.includes(suffix));
      
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
      cleanLastPart = cleanLastPart.replace(new RegExp(prefix, 'gi'), '').trim();
    }
    
    // Tìm tỉnh/thành phố phù hợp nhất từ danh sách
    for (const province of provinces) {
      if (province.toLowerCase().includes(cleanLastPart.toLowerCase()) || 
          cleanLastPart.toLowerCase().includes(province.toLowerCase())) {
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
    console.warn("Không có danh sách người dùng hợp lệ để tạo phân bố theo tỉnh");
    return [];
  }

  console.log("Đang tạo phân bố theo tỉnh từ", users.length, "người dùng");

  // Đếm số người dùng theo tỉnh
  const provinceCount = {};
  let usersWithProvinceData = 0;

  users.forEach(user => {
    let province = "Không xác định";
    
    // Ưu tiên trường province nếu có
    if (user.province) {
      province = user.province;
      usersWithProvinceData++;
    } 
    // Nếu không có trường province, thử trích xuất từ địa chỉ
    else if (user.address) {
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

  console.log("Tìm thấy thông tin tỉnh/thành phố cho", usersWithProvinceData, "trên tổng số", users.length, "người dùng");

  // Nếu không có đủ thông tin tỉnh/thành phố, thử trích xuất từ các trường khác
  if (usersWithProvinceData < users.length * 0.5) {
    console.warn("Không đủ thông tin tỉnh/thành phố trong dữ liệu người dùng, đang thử trích xuất từ các trường khác...");
    
    users.forEach(user => {
      // Nếu đã xác định được tỉnh/thành phố từ province hoặc address, bỏ qua
      if ((user.province && user.province !== "Không xác định") || 
          (user.address && extractProvinceFromAddress(user.address) !== "Không xác định")) {
        return;
      }
      
      let province = "Không xác định";
      
      // Thử trích xuất từ các trường khác như location, city, region, hoặc thông tin liên hệ
      if (user.location) {
        province = extractProvinceFromAddress(user.location);
      } else if (user.city) {
        province = user.city;
      } else if (user.region) {
        province = user.region;
      } else if (user.contactInfo && typeof user.contactInfo === 'object') {
        if (user.contactInfo.address) {
          province = extractProvinceFromAddress(user.contactInfo.address);
        } else if (user.contactInfo.city) {
          province = user.contactInfo.city;
        }
      }
      
      // Nếu tìm thấy thông tin tỉnh/thành phố mới, cập nhật số liệu
      if (province !== "Không xác định") {
        if (!provinceCount[province]) {
          provinceCount[province] = 0;
        }
        
        // Giảm số lượng 'Không xác định' nếu đã tồn tại
        if (provinceCount["Không xác định"] > 0) {
          provinceCount["Không xác định"]--;
        }
        
        provinceCount[province]++;
        usersWithProvinceData++;
      }
    });
    
    console.log("Sau khi trích xuất thêm, tìm thấy thông tin tỉnh/thành phố cho", usersWithProvinceData, "người dùng");
  }

  // Chuyển đổi sang mảng đối tượng và sắp xếp theo số lượng giảm dần
  const result = Object.keys(provinceCount)
    .map(province => ({
      province,
      count: provinceCount[province]
    }))
    .sort((a, b) => b.count - a.count);

  return result;
};

// Lấy dữ liệu chi tiết người dùng (kèm theo phân bố theo tỉnh thành)
const getUserDetailData = async (period = 'month') => {
  try {
    console.log("Đang lấy dữ liệu chi tiết người dùng...");
    const token = localStorage.getItem("accessToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    try {
      // Thử lấy từ API chính
      const response = await axios.get(`${API_BASE_URL}/api/reports/users/detail?period=${period}`, { 
        headers, 
        timeout: 15000 
      });
      
      if (response?.data) {
        console.log("Lấy dữ liệu chi tiết người dùng từ API thành công:", response.data);
        
        // Nếu API trả về đầy đủ thông tin bao gồm phân bố theo tỉnh
        if (response.data.usersByProvince && Array.isArray(response.data.usersByProvince) && response.data.usersByProvince.length > 0) {
        return response.data;
        }
        
        // Nếu API không trả về thông tin phân bố theo tỉnh nhưng có danh sách người dùng
        if (response.data.users && Array.isArray(response.data.users) && response.data.users.length > 0) {
          console.log("API không trả về usersByProvince, đang tạo từ danh sách users...");
          const provinceData = generateProvinceDistributionFromUsers(response.data.users);
          return {
            ...response.data,
            usersByProvince: provinceData
          };
        }
        
        // Nếu API trả về dữ liệu nhưng không có usersByProvince và users
        if (!response.data.usersByProvince || !Array.isArray(response.data.usersByProvince)) {
          console.log("API không trả về usersByProvince, thử lấy danh sách users để tạo dữ liệu tỉnh thành...");
          
          // Nếu có users trong response, sử dụng users để tạo phân bố theo tỉnh
          if (response.data.users && Array.isArray(response.data.users) && response.data.users.length > 0) {
            const provinceData = generateProvinceDistributionFromUsers(response.data.users);
            return {
              ...response.data,
              usersByProvince: provinceData
            };
          }
          
          // Nếu không có users, thử lấy danh sách người dùng từ API users
          try {
            console.log("Không có users trong response, thử lấy danh sách người dùng từ API users...");
            const usersResponse = await axios.get(`${API_BASE_URL}/api/users`, { 
              headers, 
              timeout: 15000 
            });
            
            if (usersResponse?.data) {
              let users = [];
              
              // Xử lý các cấu trúc phản hồi khác nhau
              if (Array.isArray(usersResponse.data)) {
                users = usersResponse.data;
              } else if (usersResponse.data.users && Array.isArray(usersResponse.data.users)) {
                users = usersResponse.data.users;
              } else if (usersResponse.data.data && Array.isArray(usersResponse.data.data)) {
                users = usersResponse.data.data;
              }
              
              if (users.length > 0) {
                console.log("Lấy được", users.length, "người dùng từ API, tạo dữ liệu phân bố theo tỉnh...");
                const provinceData = generateProvinceDistributionFromUsers(users);
                console.log("Dữ liệu phân bố theo tỉnh:", provinceData);
                
                return {
                  ...response.data,
                  usersByProvince: provinceData,
                  users: users
                };
              }
            }
          } catch (error) {
            console.warn("Không thể lấy danh sách người dùng từ API users:", error.message);
          }
          
          console.warn("Không thể tạo dữ liệu phân bố theo tỉnh, trả về response.data như ban đầu");
      return response.data;
        }
        
        return response.data;
      }
    } catch (error) {
      console.warn("Không thể lấy dữ liệu chi tiết người dùng từ API chính:", error.message);
    }
    
    try {
      // Thử lấy từ API users
      const response = await axios.get(`${API_BASE_URL}/api/users/stats?period=${period}`, { 
        headers, 
        timeout: 15000 
      });
      
      if (response?.data) {
        console.log("Lấy dữ liệu chi tiết người dùng từ API users thành công:", response.data);
        
        // Nếu API users không trả về usersByProvince hoặc mảng rỗng
        if (!response.data.usersByProvince || !Array.isArray(response.data.usersByProvince) || response.data.usersByProvince.length === 0) {
          console.log("API users không trả về usersByProvince, thử tạo từ danh sách users...");
          
          // Kiểm tra xem response.data có chứa trường users không
          if (response.data.users && Array.isArray(response.data.users) && response.data.users.length > 0) {
            console.log("Sử dụng", response.data.users.length, "người dùng từ response để tạo dữ liệu phân bố theo tỉnh");
            const provinceData = generateProvinceDistributionFromUsers(response.data.users);
            console.log("Dữ liệu phân bố theo tỉnh:", provinceData);
            
            return {
              ...response.data,
              usersByProvince: provinceData
            };
          } 
          // Nếu không có trường users, thử tìm trong trường data
          else if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
            console.log("Sử dụng", response.data.data.length, "người dùng từ response.data để tạo dữ liệu phân bố theo tỉnh");
            const provinceData = generateProvinceDistributionFromUsers(response.data.data);
            console.log("Dữ liệu phân bố theo tỉnh:", provinceData);
            
            return {
              ...response.data,
              usersByProvince: provinceData
            };
          }
          // Nếu không có trường users hoặc data, kiểm tra xem response.data có phải là mảng người dùng không
          else if (Array.isArray(response.data)) {
            console.log("Response.data là một mảng với", response.data.length, "phần tử, thử xử lý như danh sách người dùng");
            // Kiểm tra xem phần tử đầu tiên có thuộc tính như người dùng không
            if (response.data.length > 0 && (response.data[0].address || response.data[0].name || response.data[0].email)) {
              console.log("Mảng response.data có vẻ là danh sách người dùng, đang tạo dữ liệu phân bố theo tỉnh...");
              const provinceData = generateProvinceDistributionFromUsers(response.data);
              console.log("Dữ liệu phân bố theo tỉnh từ mảng response.data:", provinceData);
              
              // Tạo đối tượng kết quả mới với thông tin cơ bản và phân bố theo tỉnh
              const totalUsers = response.data.length;
              const newUsers = response.data.filter(user => {
                const createdAt = new Date(user.createdAt || user.created_at || user.registeredAt || Date.now());
                const now = new Date();
                const diffDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
                return diffDays <= 30; // Mặc định period là month
              }).length;
              
              const activeUsers = response.data.filter(user => user.active || user.isActive || user.status === 'active').length;
              
              return {
                totalUsers,
                newUsers,
                activeUsers,
                usersByProvince: provinceData,
                users: response.data
              };
            }
          }
          
          console.warn("Không thể tạo dữ liệu phân bố theo tỉnh, trả về response.data như ban đầu");
        return response.data;
        }
        
        return response.data;
      }
      } catch (error) {
      console.warn("Không thể lấy dữ liệu chi tiết người dùng từ API users:", error.message);
    }
    
    // Nếu không lấy được dữ liệu từ bất kỳ nguồn nào, thử lấy một lần nữa từ API users
    console.warn("Không thể lấy dữ liệu chi tiết người dùng từ các API đã thử, thử lại API users một lần nữa...");

    try {
      const usersResponse = await axios.get(`${API_BASE_URL}/api/users`, { 
        headers, 
        timeout: 20000 // Thời gian timeout dài hơn
      });
      
      if (usersResponse?.data) {
        let users = [];
        
        // Xử lý các cấu trúc phản hồi khác nhau
        if (Array.isArray(usersResponse.data)) {
          users = usersResponse.data;
        } else if (usersResponse.data.users && Array.isArray(usersResponse.data.users)) {
          users = usersResponse.data.users;
        } else if (usersResponse.data.data && Array.isArray(usersResponse.data.data)) {
          users = usersResponse.data.data;
        }
        
        if (users.length > 0) {
          console.log("Lấy danh sách người dùng từ API thành công, đang tạo báo cáo từ", users.length, "người dùng");
          
          const totalUsers = users.length;
          const newUsers = users.filter(user => {
            const createdAt = new Date(user.createdAt || user.created_at || user.registeredAt || Date.now());
            const now = new Date();
            const diffDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
            
            if (period === 'week') return diffDays <= 7;
            if (period === 'month') return diffDays <= 30;
            if (period === 'year') return diffDays <= 365;
            
            return false;
          }).length;
          
          const activeUsers = users.filter(user => user.active || user.isActive || user.status === 'active').length;
          
          // Tạo dữ liệu phân bố theo tỉnh
          console.log("Tạo dữ liệu phân bố theo tỉnh từ danh sách người dùng...");
          const usersByProvince = generateProvinceDistributionFromUsers(users);
          console.log("Dữ liệu phân bố theo tỉnh:", usersByProvince);
          
          // Tạo dữ liệu phân bố theo khu vực dựa trên thông tin tỉnh
          const regionMapping = {
            'Bắc': ['Hà Nội', 'Hải Phòng', 'Bắc Ninh', 'Hải Dương', 'Hưng Yên', 'Hà Nam', 'Nam Định', 'Thái Bình', 'Ninh Bình', 'Quảng Ninh', 'Bắc Giang', 'Phú Thọ', 'Vĩnh Phúc', 'Thái Nguyên', 'Bắc Kạn', 'Cao Bằng', 'Lạng Sơn', 'Lào Cai', 'Yên Bái', 'Tuyên Quang', 'Hà Giang', 'Hòa Bình', 'Sơn La', 'Điện Biên', 'Lai Châu'],
            'Trung': ['Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận'],
            'Nam': ['TP Hồ Chí Minh', 'Hồ Chí Minh', 'Đồng Nai', 'Bình Dương', 'Bà Rịa - Vũng Tàu', 'Tây Ninh', 'Bình Phước', 'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Kiên Giang', 'Cần Thơ', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau'],
            'Tây Nguyên': ['Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng']
          };
          
          const usersByRegion = [];
          const regionCounts = { 'Bắc': 0, 'Trung': 0, 'Nam': 0, 'Tây Nguyên': 0, 'Khác': 0 };
          
          usersByProvince.forEach(item => {
            let found = false;
            for (const [region, provinces] of Object.entries(regionMapping)) {
              if (provinces.some(p => item.province.includes(p))) {
                regionCounts[region] += item.count;
                found = true;
                break;
              }
            }
            if (!found) {
              regionCounts['Khác'] += item.count;
            }
          });
          
          for (const [region, count] of Object.entries(regionCounts)) {
            if (count > 0) {
              usersByRegion.push({ region, count });
            }
          }
          
          // Tạo dữ liệu phân bố theo độ tuổi (nếu có dữ liệu tuổi trong users)
          let usersByAge = [];
          
          // Thử trích xuất thông tin tuổi từ users nếu có
          const usersWithAge = users.filter(user => user.age || user.birthYear || user.birthDate || user.dateOfBirth);
          
          if (usersWithAge.length > 0) {
            // Nếu có dữ liệu tuổi, tạo phân bố thực tế
            const ageGroups = {'18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0};
            
            usersWithAge.forEach(user => {
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
                  
                  // Điều chỉnh nếu chưa đến sinh nhật năm nay
                  if (now.getMonth() < birthDate.getMonth() || 
                     (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())) {
                    age--;
                  }
                }
              }
              
              if (age >= 18 && age <= 24) ageGroups['18-24']++;
              else if (age >= 25 && age <= 34) ageGroups['25-34']++;
              else if (age >= 35 && age <= 44) ageGroups['35-44']++;
              else if (age >= 45 && age <= 54) ageGroups['45-54']++;
              else if (age >= 55) ageGroups['55+']++;
            });
            
            usersByAge = Object.entries(ageGroups).map(([range, count]) => ({ range, count }));
          } else {
            // Nếu không có dữ liệu tuổi, ước tính dựa trên phân phối dân số thông thường
            const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55+'];
            const distribution = [0.25, 0.4, 0.2, 0.1, 0.05]; // Phân phối độ tuổi thông thường
            
            usersByAge = ageGroups.map((range, index) => ({
              range,
              count: Math.round(totalUsers * distribution[index])
            }));
          }
          
          const result = {
            totalUsers,
            newUsers,
            activeUsers,
            usersByProvince,
            usersByRegion,
            usersByAge,
            users
          };
          
          console.log("Đã tạo báo cáo người dùng từ dữ liệu API:", result);
          return result;
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error.message);
    }

    // Nếu không lấy được dữ liệu, trả về null
    console.error("Không thể lấy dữ liệu chi tiết người dùng từ bất kỳ nguồn nào");
    return null;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu chi tiết người dùng:", error);
    return null;
  }
};

const getOrderData = async (period = 'month') => {
  console.log("Đang lấy dữ liệu đơn hàng cho giai đoạn:", period);
  
  // Lấy token từ localStorage
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    // Thử lấy dữ liệu từ API reports/orders
    const response = await axios.get(`${API_BASE_URL}/api/reports/orders?period=${period}`, { 
      headers, 
      timeout: 15000 
    });
    
    if (response?.data) {
      console.log("Lấy dữ liệu đơn hàng từ API thành công:", response.data);
      
      // Chuyển đổi dữ liệu từ API thành định dạng phù hợp cho biểu đồ
      return formatOrderDataFromAPI(response.data);
    }
      } catch (error) {
    console.warn("Không thể lấy dữ liệu đơn hàng từ API chính:", error.message);
    
    // Thử lấy dữ liệu từ API orders tổng hợp
    try {
      const ordersResponse = await axios.get(`${API_BASE_URL}/api/orders/stats`, { 
        headers, 
        timeout: 15000 
      });
      
      if (ordersResponse?.data) {
        console.log("Lấy dữ liệu đơn hàng từ API orders/stats thành công:", ordersResponse.data);
        
        // Chuyển đổi dữ liệu từ API thành định dạng phù hợp cho biểu đồ
        return formatOrderDataFromAPI(ordersResponse.data);
      }
    } catch (orderError) {
      console.warn("Không thể lấy dữ liệu đơn hàng từ API orders/stats:", orderError.message);
      
      // Thử lấy dữ liệu trực tiếp từ danh sách đơn hàng
      try {
        const allOrdersResponse = await axios.get(`${API_BASE_URL}/api/orders`, { 
          headers, 
          timeout: 15000 
        });
        
        if (allOrdersResponse?.data) {
          console.log("Lấy danh sách đơn hàng từ API thành công, đang tạo báo cáo...");
          
          // Xử lý dữ liệu đơn hàng thô để tạo báo cáo
          return processOrdersRawData(allOrdersResponse.data, period);
        }
      } catch (allOrdersError) {
        console.warn("Không thể lấy danh sách đơn hàng từ API:", allOrdersError.message);
      }
    }
  }
  
  // Cố gắng tạo dữ liệu mẫu cho báo cáo để hiển thị
  console.log("Không thể lấy dữ liệu đơn hàng từ API, đang tạo dữ liệu mẫu...");
        return [];
};

// Hàm chuyển đổi dữ liệu từ API thành định dạng phù hợp cho biểu đồ
const formatOrderDataFromAPI = (data) => {
  // Kiểm tra cấu trúc dữ liệu
  console.log("Định dạng dữ liệu đơn hàng từ API:", data);
  
  // Khởi tạo đối tượng kết quả
  const result = {
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    processingOrders: 0,
    averageOrderValue: 0,
    topOrders: []
  };
  
  // Xử lý tổng số đơn hàng
  if (data.totalOrders !== undefined) {
    result.totalOrders = data.totalOrders;
  }
  
  // Xử lý trạng thái đơn hàng
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
  
  // Xử lý giá trị đơn hàng trung bình
  if (data.averageOrderValue !== undefined) {
    result.averageOrderValue = data.averageOrderValue;
  }
  
  // Xử lý thời gian xử lý
  if (data.processingTime && Array.isArray(data.processingTime)) {
    result.processingTime = data.processingTime;
  } else if (data.averageProcessingTime !== undefined) {
    // Nếu có averageProcessingTime, tạo dữ liệu mô phỏng các giai đoạn
    result.processingTime = [
      { name: 'Xác nhận', time: Math.round(data.averageProcessingTime * 0.2) },
      { name: 'Đóng gói', time: Math.round(data.averageProcessingTime * 0.3) },
      { name: 'Vận chuyển', time: Math.round(data.averageProcessingTime * 0.5) }
    ];
  }
  
  // Xử lý top đơn hàng
  if (data.topOrders && Array.isArray(data.topOrders)) {
    result.topOrders = data.topOrders;
  }
  
  return result;
};

// Hàm xử lý dữ liệu đơn hàng thô từ API để tạo báo cáo
const processOrdersRawData = (data, period) => {
  let orders = [];
  
  // Xử lý các cấu trúc phản hồi khác nhau
  if (Array.isArray(data)) {
    orders = data;
  } else if (data.orders && Array.isArray(data.orders)) {
    orders = data.orders;
  } else if (data.data && Array.isArray(data.data)) {
    orders = data.data;
  }
  
  if (orders.length === 0) {
    console.warn("Không có dữ liệu đơn hàng để xử lý");
    return null;
  }
  
  console.log(`Xử lý ${orders.length} đơn hàng để tạo báo cáo...`);
  
  // Lọc đơn hàng theo thời gian
  const filteredOrders = filterOrdersByPeriod(orders, period);
  
  // Thống kê đơn hàng theo trạng thái
  const pendingOrders = filteredOrders.filter(order => 
    order.status === 'pending' || order.status === 'Đang xử lý').length;
  
  const completedOrders = filteredOrders.filter(order => 
    order.status === 'completed' || order.status === 'Đã giao').length;
  
  const processingOrders = filteredOrders.filter(order => 
    order.status === 'processing' || order.status === 'Đang giao').length;
  
  const cancelledOrders = filteredOrders.filter(order => 
    order.status === 'cancelled' || order.status === 'Đã hủy').length;
  
  // Tính giá trị đơn hàng trung bình
  let totalValue = 0;
  filteredOrders.forEach(order => {
    totalValue += order.total || order.totalAmount || 0;
  });
  
  const averageOrderValue = filteredOrders.length > 0 ? totalValue / filteredOrders.length : 0;
  
  // Tìm top đơn hàng có giá trị cao nhất
  const topOrders = [...filteredOrders]
    .sort((a, b) => (b.total || b.totalAmount || 0) - (a.total || a.totalAmount || 0))
    .slice(0, 5)
    .map(order => ({
      id: order.id || order._id || order.orderId || `ORD${Math.floor(Math.random() * 10000)}`,
      customer: order.customerName || order.userName || 'Khách hàng',
      total: order.total || order.totalAmount || 0,
      status: order.status || 'Đang xử lý',
      date: order.createdAt || order.orderDate || new Date().toISOString().split('T')[0]
    }));
  
  return {
    totalOrders: filteredOrders.length,
    pendingOrders,
    completedOrders,
    processingOrders,
    cancelledOrders,
    averageOrderValue,
    topOrders
  };
};

// Hàm lọc đơn hàng theo khoảng thời gian
const filterOrdersByPeriod = (orders, period) => {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
  }
  
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt || order.orderDate || order.date || 0);
    return orderDate >= startDate && orderDate <= now;
  });
};

export const reportsApi = {
  // Dashboard related reports
  getDashboardData: async () => {
    try {
      console.log('Fetching dashboard data...');
      const endpoints = [
        `${API_URL}/api/reports/dashboard`,
        `${API_URL}/reports/dashboard`,
        `${API_URL}/api/dashboard/summary`
      ];
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got dashboard data:', response.data);
        return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All dashboard data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      return null;
    }
  },

  // Revenue reports
  getRevenueData: async (timeRange = "week") => {
    try {
      // Thử tất cả các endpoint có thể có
      const endpoints = [
        `${API_URL}/api/reports/revenue?timeRange=${timeRange}`,
        `${API_URL}/reports/revenue?timeRange=${timeRange}`,
        `${API_URL}/api/analytics/revenue?timeRange=${timeRange}`,
        `${API_URL}/api/dashboard/revenue?timeRange=${timeRange}`
      ];
      
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Thử từng endpoint
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch revenue data from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log(`Successfully fetched revenue data from: ${endpoint}`);
            
            // Chuẩn hóa dữ liệu và đảm bảo định dạng ngày đúng
            const formattedData = response.data.map(item => ({
              date: formatDateString(item.date),
              doanh_thu: item.doanh_thu || item.revenue || item.amount || item.total || 0,
              don_hang: item.don_hang || item.orders || 0
            }));
            
            return formattedData;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      // Nếu không có endpoint nào thành công, thử kết nối trực tiếp với bảng Orders trong MongoDB
      try {
        console.log('Trying direct DB connection via API endpoint...');
        const dbEndpoint = `${API_URL}/api/orders/stats?timeRange=${timeRange}`;
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get(dbEndpoint, { headers });
        
        if (response.data) {
          // Chuyển đổi dữ liệu thống kê đơn hàng sang định dạng doanh thu
          console.log('Got order stats, converting to revenue format');
          
          // Kiểm tra cấu trúc dữ liệu và xử lý phù hợp
          if (Array.isArray(response.data)) {
            return response.data.map(item => ({
              date: formatDateString(item.date || item.ngay || new Date(item.timestamp)),
              doanh_thu: item.doanh_thu || item.revenue || item.amount || item.total || 0,
              don_hang: item.don_hang || item.orders || 0
            }));
          } else if (response.data.data && Array.isArray(response.data.data)) {
            return response.data.data.map(item => ({
              date: formatDateString(item.date || item.ngay || new Date(item.timestamp)),
              doanh_thu: item.doanh_thu || item.revenue || item.amount || item.total || 0,
              don_hang: item.don_hang || item.orders || 0
            }));
          } else if (response.data.orders && Array.isArray(response.data.orders)) {
            // Nhóm đơn hàng theo ngày và tính tổng doanh thu
            const ordersByDate = {};
            
            response.data.orders.forEach(order => {
              const orderDate = new Date(order.createdAt || order.created_at || order.timestamp);
              const dateStr = orderDate.toLocaleDateString('vi-VN');
              
              if (!ordersByDate[dateStr]) {
                ordersByDate[dateStr] = { 
                  revenue: 0, 
                  count: 0 
                };
              }
              
              ordersByDate[dateStr].revenue += order.totalAmount || order.total || order.amount || 0;
              ordersByDate[dateStr].count += 1;
            });
            
            // Chuyển đổi thành mảng
            return Object.keys(ordersByDate).map(date => ({
              date: formatDateString(date),
              doanh_thu: ordersByDate[date].revenue,
              don_hang: ordersByDate[date].count
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to get data from DB API:', err.message);
      }
      
      console.error('All revenue data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      return null;
    }
  },

  // Top products
  getTopProducts: async () => {
    try {
      console.log('Fetching top products data...');
      const endpoints = [
        `${API_URL}/api/reports/top-products`,
        `${API_URL}/reports/top-products`, 
        `${API_URL}/api/analytics/top-products`,
        `${API_URL}/api/products/top-selling`
      ];
      
        const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Thử từng endpoint
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data && 
             (Array.isArray(response.data) || 
              (response.data.products && Array.isArray(response.data.products)) ||
              (response.data.data && Array.isArray(response.data.data)))) {
            
            let productData = Array.isArray(response.data) ? 
                             response.data : 
                             (response.data.products || response.data.data);
            
            // Kiểm tra xem có dữ liệu không
            if (productData && productData.length > 0) {
              console.log('Got top products data:', productData);
              
              // Chuẩn hóa dữ liệu
              return productData.map(product => ({
                name: product.name || product.productName || 'Không xác định',
                category: product.category || product.categoryName || 'Không phân loại',
                sold: product.sold || product.quantity || product.totalSold || 0,
                revenue: product.revenue || product.totalRevenue || product.amount || (product.price * product.sold) || 0,
                sku: product.sku || product.productSku || '',
                price: product.price || 0,
                stock: product.stock || product.currentStock || 0
              }));
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All top products endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching top products data:', err);
      return null;
    }
  },

  // Inventory reports
  getInventoryData: async () => {
    try {
      console.log('Fetching inventory data...');
      const endpoints = [
        `${API_URL}/api/products/inventory`,
        `${API_URL}/reports/inventory`,
        `${API_URL}/api/inventory`
      ];
      
          const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got inventory data:', response.data);
            return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
          // Try to get all products and convert to inventory data
      try {
        console.log('Trying to fetch all products...');
        const response = await axios.get(`${API_URL}/api/products`, { headers });
          
          // Check if response.data and response.data.products exist before using them
          if (response.data && response.data.products && Array.isArray(response.data.products)) {
          console.log('Converting products to inventory data');
            // Convert products to inventory format
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
      } catch (err) {
        console.warn('Failed to fetch products:', err.message);
      }
      
      console.error('All inventory endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      return null;
    }
  },

  // User statistics
  getUserData: async () => {
    try {
      console.log('Fetching user data...');
      const endpoints = [
        `${API_URL}/api/reports/users`,
        `${API_URL}/reports/users`,
        `${API_URL}/api/users/stats`
      ];
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got user data:', response.data);
        return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All user data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching user data:', err);
      return null;
    }
  },

  // Order reports
  getOrderData,

  // Promotion reports
  getPromotionData: async () => {
    try {
      console.log('Fetching promotion data...');
      const endpoints = [
        `${API_URL}/api/coupons/stats`,
        `${API_URL}/api/reports/promotions`,
        `${API_URL}/reports/promotions`,
        `${API_URL}/api/promotions/stats`
      ];
      
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got promotion data:', response.data);
            
            // Check if the response has the expected format from getCouponStats
            if (response.data.success && response.data.data) {
              return response.data.data;
            }
            
            // If it's a direct data object, return it
            return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      // If all endpoints fail, try to construct data from coupons list
      try {
        console.log('Trying to fetch coupons list to construct promotion data...');
        const couponsResponse = await axios.get(`${API_URL}/api/coupons`, { headers });
        
        if (couponsResponse?.data?.data || Array.isArray(couponsResponse?.data)) {
          const coupons = couponsResponse?.data?.data || couponsResponse?.data;
          console.log('Got coupons list, constructing promotion data...');
          
          // Calculate basic statistics
          const now = new Date();
          const activeCoupons = coupons.filter(coupon => 
            coupon.isActive && 
            (!coupon.expiresAt || new Date(coupon.expiresAt) > now)
          ).length;
          
          const totalUsedCount = coupons.reduce((sum, coupon) => sum + (coupon.used || 0), 0);
          
          // Calculate type statistics
          const typeStats = {
            percentage: { count: 0, used: 0, totalValue: 0, estimatedRevenue: 0 },
            fixed: { count: 0, used: 0, totalValue: 0, estimatedRevenue: 0 }
          };
          
          coupons.forEach(coupon => {
            const type = coupon.type || 'percentage';
            typeStats[type].count++;
            typeStats[type].used += (coupon.used || 0);
            
            if (type === 'percentage') {
              typeStats[type].totalValue += (coupon.value || 0) * (coupon.used || 0);
              // Estimate revenue based on minimum order value
              const estimatedOrderValue = (coupon.minOrder || 0) * 1.5; // Assume average order is 1.5x minimum
              typeStats[type].estimatedRevenue += (coupon.used || 0) * estimatedOrderValue;
            } else {
              typeStats[type].totalValue += (coupon.value || 0) * (coupon.used || 0);
              // Estimate revenue based on minimum order value
              const estimatedOrderValue = (coupon.minOrder || 0) * 1.5; // Assume average order is 1.5x minimum
              typeStats[type].estimatedRevenue += (coupon.used || 0) * estimatedOrderValue;
            }
          });
          
          // Format voucher usage data
          const voucherUsage = coupons
            .sort((a, b) => (b.used || 0) - (a.used || 0))
            .map(coupon => ({
              code: coupon.code,
              discount: coupon.type === 'percentage' ? `${coupon.value}%` : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.value),
              used: coupon.used || 0,
              limit: coupon.usageLimit || '∞',
              revenue: coupon.type === 'percentage' ? 
                ((coupon.value || 0) * (coupon.used || 0) * (coupon.minOrder || 0) / 100) : // Estimate for percentage type
                ((coupon.used || 0) * (coupon.minOrder || 0)), // Estimate for fixed type
              description: coupon.description || ''
            }));
          
          return {
            totalCoupons: coupons.length,
            activeCoupons,
            totalUsedCount,
            typeStats,
            voucherUsage
          };
        }
      } catch (err) {
        console.warn('Failed to construct promotion data from coupons list:', err.message);
      }
      
      console.error('All promotion data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching promotion data:', err);
      return null;
    }
  },

  // System activity reports
  getSystemActivityData: async (timeRange = "week") => {
    try {
      console.log('Fetching system activity data...');
      const endpoints = [
        `${API_URL}/api/reports/system-activity?timeRange=${timeRange}`,
        `${API_URL}/reports/system-activity?timeRange=${timeRange}`,
        `${API_URL}/api/system/activity?timeRange=${timeRange}`
      ];
      
        const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got system activity data:', response.data);
        return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All system activity endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching system activity data:', err);
      return null;
    }
  },

  // Delivery statistics
  getDeliveryData: async (timeRange = "week") => {
    try {
      console.log('Fetching delivery data...');
      const endpoints = [
        `${API_URL}/api/reports/delivery?timeRange=${timeRange}`,
        `${API_URL}/reports/delivery?timeRange=${timeRange}`,
        `${API_URL}/api/delivery/stats?timeRange=${timeRange}`
      ];
      
        const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got delivery data:', response.data);
        return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All delivery data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching delivery data:', err);
      return null;
    }
  },

  // Feedback statistics
  getFeedbackData: async () => {
    try {
      console.log('Fetching feedback data...');
      const endpoints = [
        `${API_URL}/api/reports/feedback`,
        `${API_URL}/reports/feedback`,
        `${API_URL}/api/feedback/stats`
      ];
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch from: ${endpoint}`);
          const response = await axios.get(endpoint, { headers });
          
          if (response.data) {
            console.log('Got feedback data:', response.data);
        return response.data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err.message);
        }
      }
      
      console.error('All feedback data endpoints failed');
      return null;
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      return null;
    }
  },

  getUserDetailData,
};
