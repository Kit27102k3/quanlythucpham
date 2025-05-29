import Branch from "../Model/Branch.js";
import axios from "axios";

// Tìm chi nhánh gần nhất dựa trên địa chỉ
export const findNearestBranch = async (address, coordinates = null) => {
  try {
    // Lấy tất cả chi nhánh
    const branches = await Branch.find({ isActive: true });
    
    if (!branches || branches.length === 0) {
      console.log("Không tìm thấy chi nhánh nào");
      return null;
    }
    
    // Nếu có tọa độ sẵn, sử dụng tọa độ để tính khoảng cách
    if (coordinates && coordinates.lat && coordinates.lng) {
      const branchesWithDistance = branches.map(branch => {
        const distance = calculateDistance(
          coordinates.lat,
          coordinates.lng,
          branch.latitude,
          branch.longitude
        );
        return { branch, distance };
      });
      
      // Sắp xếp theo khoảng cách và trả về chi nhánh gần nhất
      branchesWithDistance.sort((a, b) => a.distance - b.distance);
      return branchesWithDistance[0].branch;
    }
    
    // Nếu không có tọa độ, tìm kiếm trong địa chỉ
    const addressLower = address.toLowerCase();
    
    // Tìm chi nhánh phù hợp nhất dựa trên địa chỉ
    for (const branch of branches) {
      const branchAddress = branch.address ? branch.address.toLowerCase() : '';
      const branchCity = branch.city ? branch.city.toLowerCase() : '';
      
      // Tách địa chỉ chi nhánh thành các phần nhỏ
      const addressParts = branchAddress.split(',').map(part => part.trim());
      
      // Kiểm tra xem địa chỉ giao hàng có chứa tên quận/huyện/thành phố của chi nhánh không
      if (addressParts.some(part => addressLower.includes(part)) || 
          addressLower.includes(branchCity)) {
        return branch;
      }
    }
    
    // Nếu không tìm thấy chi nhánh phù hợp, trả về chi nhánh đầu tiên
    return branches[0];
  } catch (error) {
    console.error("Lỗi khi tìm chi nhánh gần nhất:", error);
    return null;
  }
};

// Hàm tính khoảng cách giữa hai tọa độ (đơn vị: km)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  
  const R = 6371; // Bán kính trái đất tính bằng km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Khoảng cách tính bằng km
  
  return distance;
};

// Hàm phân công chi nhánh cho đơn hàng dựa trên địa chỉ giao hàng
export const assignBranchToOrder = async (orderId, address, coordinates = null) => {
  try {
    // Tìm chi nhánh gần nhất
    const nearestBranch = await findNearestBranch(address, coordinates);
    
    if (!nearestBranch) {
      console.log("Không tìm thấy chi nhánh phù hợp cho đơn hàng:", orderId);
      return false;
    }
    
    // Cập nhật đơn hàng với branchId
    // Giả sử bạn có một Order model đã import
    const Order = (await import("../Model/Order.js")).default;
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { branchId: nearestBranch._id },
      { new: true }
    );
    
    if (updatedOrder) {
      console.log(`Đơn hàng ${orderId} được phân công cho chi nhánh: ${nearestBranch.name}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Lỗi khi phân công chi nhánh cho đơn hàng:", error);
    return false;
  }
};

export default {
  findNearestBranch,
  calculateDistance,
  assignBranchToOrder
}; 