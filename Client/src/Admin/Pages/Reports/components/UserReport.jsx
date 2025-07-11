import { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { reportsApi } from '../../../../api/reportsApi';
import { authApi } from '../../../../api/authApi';
import { toast } from 'react-toastify';

const UserReport = ({ userData, exportToPDF, exportToExcel, sendReportEmail, exportLoading, setExportLoading }) => {
  const [loading, setLoading] = useState(false);
  const [localUserData, setLocalUserData] = useState(userData || {});
  const [timePeriod, setTimePeriod] = useState('month');
  const [enhancedUsers, setEnhancedUsers] = useState([]);
  
  // Extract province specifically from address string
  const extractProvinceFromAddress = (address) => {
    if (!address || address === "Không xác định") return null;
    
    try {
      // Better address parsing logic
      const addressParts = address.split(',').map(part => part.trim());
      
      // Define common province keywords and prefixes
      const provinceKeywords = ['tỉnh', 'tp.', 'thành phố', 't.p', 'tp'];
      
      // Try to find parts containing province indicators
      for (let i = addressParts.length - 1; i >= 0; i--) {
        const part = addressParts[i].toLowerCase();
        
        // Check if part contains any of the province keywords
        if (provinceKeywords.some(keyword => part.includes(keyword))) {
          // Extract the actual province name by removing the prefix
          return addressParts[i]
            .replace(/^(Tỉnh|TP\.|Thành phố|T\.P|TP)\s+/i, '')
            .trim();
        }
      }
      
      // If no specific province indicator found, return the last part as a fallback
      if (addressParts.length > 0) {
        const lastPart = addressParts[addressParts.length - 1];
        // If last part is too short or looks like a generic address part, try second-to-last
        if (lastPart.length < 3 || /^(Việt Nam|VN)$/i.test(lastPart)) {
          return addressParts.length > 1 ? addressParts[addressParts.length - 2] : lastPart;
        }
        return lastPart;
      }
    } catch (err) {
      console.error("Lỗi khi trích xuất tỉnh:", err);
    }
    
    return null;
  };

  // Update the province extraction with more robust logic
  const extractProvince = (user) => {
    // First try to use the province field directly
    if (user.province && user.province !== "Không xác định") return user.province;
    
    // If no province field but address exists, try to extract from address
    if (user.address && user.address !== "Không xác định") {
      const extractedProvince = extractProvinceFromAddress(user.address);
      if (extractedProvince) return extractedProvince;
    }
    
    return "Không xác định";
  };

  // Generate better avatar URL based on user's name with consistent colors
  const generateAvatarUrl = (user) => {
    const name = user.name || user.fullName || user.userName || "User";
    
    // Create a simple hash from the name to get a consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to RGB hex color
    let color = Math.abs(hash).toString(16).substring(0, 6);
    // Pad with zeros if needed
    while (color.length < 6) {
      color = '0' + color;
    }

    // Generate avatar URL with consistent background color
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=128`;
  };
  
  // Tải dữ liệu người dùng khi component được mount hoặc userData thay đổi
  useEffect(() => {
    if (userData) {
      setLocalUserData(userData);
    } else {
      fetchUserData();
    }
  }, [userData]);

  // Tải lại dữ liệu khi thời gian thay đổi
  useEffect(() => {
    fetchUserData();
  }, [timePeriod]);

  // Enhanced function to fetch detailed user data
  useEffect(() => {
    if (localUserData?.users && localUserData.users.length > 0) {
      enhanceUserData(localUserData.users);
    }
  }, [localUserData?.users]);

  // Hàm lấy dữ liệu từ API
  const fetchUserData = async () => {
    setLoading(true);
    if (setExportLoading) setExportLoading(true);
    try {
      const data = await reportsApi.getUserDetailData(timePeriod);
      if (data) {
        setLocalUserData(data);
        console.log("Đã cập nhật dữ liệu người dùng:", data);
      } else {
        toast.error("Không thể lấy dữ liệu người dùng từ máy chủ");
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu người dùng:", error);
      toast.error("Lỗi khi lấy dữ liệu người dùng: " + (error.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
      if (setExportLoading) setExportLoading(false);
    }
  };
  
  // Function to enhance user data with additional details from authApi
  const enhanceUserData = async (users) => {
    try {
      const enhancedUsersData = await Promise.all(
        users.map(async (user) => {
          try {
            // Only fetch additional details if province is not available
            if (user.id && (!user.province || user.province === "Không xác định")) {
              try {
                const response = await authApi.getUserById(user.id);
                if (response && response.data) {
                  // Merge the additional data with the existing user data
                  return {
                    ...user,
                    province: response.data.province || extractProvinceFromAddress(response.data.address) || user.province,
                    address: response.data.address || user.address,
                    avatar: response.data.avatar || response.data.userImage || user.avatar,
                  };
                }
              } catch {
                // Log error without using the variable
                console.log("Không thể lấy thông tin chi tiết cho người dùng:", user.id);
                return user;
              }
            }
            return user;
          } catch (err) {
            console.error("Lỗi khi xử lý người dùng:", err);
            return user;
          }
        })
      );
      
      setEnhancedUsers(enhancedUsersData);
    } catch (err) {
      console.error("Lỗi khi nâng cao dữ liệu người dùng:", err);
    }
  };
  
  // Handle case where userData is null, undefined, or not in expected format
  const usersByRegion = localUserData?.usersByRegion || [];
  
  // Add colors to usersByRegion data
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#d88489', '#82ca9d', '#ffc658', '#a4de6c', '#d0ed57'];
  const regionData = usersByRegion.map((region, index) => ({
    ...region,
    color: COLORS[index % COLORS.length]
  }));

  // Use the enhanced users array if available, otherwise use the original users
  const displayUsers = enhancedUsers.length > 0 ? enhancedUsers : localUserData?.users || [];
  
  // Improve province data handling
  const provinceData = useMemo(() => {
    // Start with existing province data from API if available
    let provinces = localUserData?.usersByProvince || [];
    
    // Always generate province data from users for better distribution visualization
    if (displayUsers?.length > 0) {
      // Create a map to count users by province
      const provinceCount = {};
      
      // Count users for each province
      displayUsers.forEach(user => {
        const province = extractProvince(user);
        if (province && province !== "Không xác định") {
          provinceCount[province] = (provinceCount[province] || 0) + 1;
        } else if (province === "Không xác định" && !provinceCount["Không xác định"]) {
          // Only count "Không xác định" once to avoid overrepresentation
          provinceCount["Không xác định"] = 1;
        }
      });
      
      // Convert to array format - only if we have province data to show
      const generatedProvinces = Object.keys(provinceCount).map(province => ({
        province,
        count: provinceCount[province]
      }));
      
      // Use generated data if it has more entries than the API data or API data is empty
      if (generatedProvinces.length > provinces.length || provinces.length === 0) {
        provinces = generatedProvinces;
        console.log("Đã tạo dữ liệu tỉnh thành từ người dùng:", provinces);
      }
    }
    
    // Sort by count in descending order and take top 15
    const result = provinces
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map((province, index) => ({
        ...province,
        color: COLORS[index % COLORS.length]
      }));
      
    console.log("Dữ liệu tỉnh thành cuối cùng:", result);
    return result;
  }, [localUserData, COLORS, displayUsers]);

  // Add data for age distribution
  const ageData = useMemo(() => {
    return localUserData?.usersByAge || [];
  }, [localUserData]);
  
  // Handle refresh data
  const handleRefresh = () => {
    fetchUserData();
  };
  
  // Xử lý thay đổi khoảng thời gian
  const handlePeriodChange = (period) => {
    setTimePeriod(period);
  };

  return (
    <div id="user-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Báo cáo người dùng</h2>
          {loading && <span className="ml-3 text-sm text-blue-500">Đang tải dữ liệu...</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-2">
            <select 
              value={timePeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 py-1.5 px-3 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="week">7 ngày qua</option>
              <option value="month">30 ngày qua</option>
              <option value="year">365 ngày qua</option>
            </select>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Làm mới
          </button>
          <button
            onClick={() => exportToPDF('user-report', 'Báo cáo người dùng')}
            disabled={exportLoading || loading}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() => exportToExcel(regionData, 'bao-cao-nguoi-dung')}
            disabled={exportLoading || loading}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail('Báo cáo người dùng', 'user-report')}
            disabled={exportLoading || loading}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Gửi Email
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-800">Tổng người dùng</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{localUserData?.totalUsers || 0}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-800">Người dùng mới</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{localUserData?.newUsers || 0}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-800">Người dùng hoạt động</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{localUserData?.activeUsers || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="h-80 border border-gray-200 rounded-lg shadow-sm p-4 bg-white">
          <h3 className="text-lg font-semibold mb-2 text-center text-gray-800">Phân bố người dùng theo khu vực</h3>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : regionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  innerRadius={30}
                  paddingAngle={2}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="region"
                  stroke="#fff"
                  strokeWidth={1}
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} người dùng`, ""]} 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{
                    fontSize: '12px',
                    paddingLeft: '10px'
                  }}
                  formatter={(value) => (
                    <span style={{ color: '#333', fontSize: '12px' }}>
                      {value && value.length > 12 ? value.substring(0, 10) + '...' : value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Không có dữ liệu khu vực</p>
            </div>
          )}
        </div>

        <div className="h-80 border border-gray-200 rounded-lg shadow-sm p-4 bg-white">
          <h3 className="text-lg font-semibold mb-2 text-center text-gray-800">Phân bố người dùng theo độ tuổi</h3>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : ageData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <LineChart
                data={ageData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} người dùng`, "Số lượng"]} 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Người dùng"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Không có dữ liệu độ tuổi</p>
            </div>
          )}
        </div>
      </div>

      {/* Phân bố theo tỉnh thành */}
      <div className="mb-6 border border-gray-200 rounded-lg shadow-sm p-4 bg-white">
        <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">Phân bố người dùng theo tỉnh thành (Top 15)</h3>
        {loading ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : provinceData.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={provinceData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="province" 
                  type="category" 
                  width={120}
                  tick={{ 
                    fontSize: 12,
                    width: 100,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} người dùng`, "Số người dùng"]} 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name="Số người dùng"
                  fill="#8884d8" 
                  radius={[0, 4, 4, 0]}
                >
                  {provinceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-80">
            <p className="text-gray-500 mb-4">Không có dữ liệu phân bố theo tỉnh thành</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Tải lại dữ liệu
            </button>
          </div>
        )}
      </div>

      {/* Chi tiết người dùng */}
      {displayUsers && displayUsers.length > 0 && (
        <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b border-gray-200">Chi tiết người dùng</h3>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-custom">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỉnh/Thành</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đăng ký</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayUsers.map((user, index) => {
                  // Extract user's full name or default to username or "Không xác định"
                  const userName = user.name || user.fullName || user.userName || "Không xác định";
                  
                  // Create default avatar URL using UI Avatars service with the user's name
                  const avatarUrl = user.avatar || user.userImage || generateAvatarUrl(user);
                  
                  // Extract province information
                  const province = extractProvince(user);
                  
                  return (
                    <tr key={user.id || user._id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full object-cover border border-gray-200" 
                              src={avatarUrl} 
                              alt={userName}
                              onError={(e) => { 
                                e.target.onerror = null; 
                                e.target.src = generateAvatarUrl(user); 
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{userName}</div>
                            <div className="text-sm text-gray-500">{user.username || user.userName || ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || "Không có"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{province}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || "Không có"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt || user.registeredAt ? 
                          new Date(user.createdAt || user.registeredAt).toLocaleDateString('vi-VN') : 
                          "Không xác định"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.active || user.isActive || user.id === localUserData.activeUsers
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {user.active || user.isActive || user.id === localUserData.activeUsers ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// User report props validation and export
UserReport.propTypes = {
  userData: PropTypes.shape({
    totalUsers: PropTypes.number,
    newUsers: PropTypes.number,
    activeUsers: PropTypes.number,
    usersByRegion: PropTypes.arrayOf(
      PropTypes.shape({
        region: PropTypes.string,
        count: PropTypes.number
      })
    ),
    usersByProvince: PropTypes.arrayOf(
      PropTypes.shape({
        province: PropTypes.string,
        count: PropTypes.number
      })
    ),
    usersByAge: PropTypes.arrayOf(
      PropTypes.shape({
        range: PropTypes.string,
        count: PropTypes.number
      })
    ),
    users: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        username: PropTypes.string,
        email: PropTypes.string,
        province: PropTypes.string,
        address: PropTypes.string,
        phone: PropTypes.string,
        createdAt: PropTypes.string,
        active: PropTypes.bool,
        avatar: PropTypes.string
      })
    )
  }),
  exportToPDF: PropTypes.func,
  exportToExcel: PropTypes.func,
  sendReportEmail: PropTypes.func,
  exportLoading: PropTypes.bool,
  setExportLoading: PropTypes.func
};

export default UserReport; 