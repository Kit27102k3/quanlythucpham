import Branch from "../Model/Branch.js";
import Admin from "../Model/adminModel.js";

// Lấy tất cả chi nhánh
export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: -1 });
    return res.status(200).json(branches);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách chi nhánh",
      error: error.message,
    });
  }
};

// Tạo chi nhánh mới
export const createBranch = async (req, res) => {
  try {
    const { name, address, phone, email, manager, openingHours, latitude, longitude } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !address || !phone) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin chi nhánh",
      });
    }

    // Kiểm tra chi nhánh đã tồn tại chưa
    const existingBranch = await Branch.findOne({ name });
    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: "Chi nhánh với tên này đã tồn tại",
      });
    }

    // Tạo chi nhánh mới
    const newBranch = new Branch({
      name,
      address,
      phone,
      email,
      manager,
      openingHours,
      latitude: latitude || 0,
      longitude: longitude || 0,
      createdBy: req.user ? req.user.id : null,
    });

    await newBranch.save();

    return res.status(201).json({
      success: true,
      message: "Tạo chi nhánh thành công",
      branch: newBranch,
    });
  } catch (error) {
    console.error("Lỗi khi tạo chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo chi nhánh",
      error: error.message,
    });
  }
};

// Cập nhật chi nhánh
export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật chi nhánh thành công",
      branch: updatedBranch,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật chi nhánh",
      error: error.message,
    });
  }
};

// Xóa chi nhánh
export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBranch = await Branch.findByIdAndDelete(id);

    if (!deletedBranch) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa chi nhánh thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xóa chi nhánh",
      error: error.message,
    });
  }
};

// Lấy chi nhánh theo ID
export const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findById(id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh",
      });
    }

    return res.status(200).json({
      success: true,
      branch,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin chi nhánh",
      error: error.message,
    });
  }
};

// Tìm kiếm chi nhánh
export const searchBranches = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp từ khóa tìm kiếm",
      });
    }

    // Tìm kiếm theo tên hoặc địa chỉ
    const branches = await Branch.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    return res.status(200).json(branches);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm chi nhánh",
      error: error.message,
    });
  }
};

// Tính khoảng cách giữa hai điểm tọa độ sử dụng công thức Haversine
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính trái đất tính bằng km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Khoảng cách tính bằng km
};

// Tìm chi nhánh gần nhất với địa chỉ
export const findNearestBranch = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    // Kiểm tra tham số
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tọa độ (latitude, longitude)",
      });
    }

    // Chuyển đổi tọa độ từ string sang number
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Lấy tất cả chi nhánh đang hoạt động
    const branches = await Branch.find({ isActive: true });

    if (branches.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh nào đang hoạt động",
      });
    }

    // Tính khoảng cách từ địa điểm đến mỗi chi nhánh
    const branchesWithDistance = branches.map(branch => {
      const distance = calculateDistance(
        lat, 
        lng, 
        branch.latitude || 0, 
        branch.longitude || 0
      );
      
      return {
        _id: branch._id,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        latitude: branch.latitude,
        longitude: branch.longitude,
        distance: distance // Khoảng cách tính bằng km
      };
    });

    // Sắp xếp theo khoảng cách tăng dần
    branchesWithDistance.sort((a, b) => a.distance - b.distance);

    // Trả về chi nhánh gần nhất
    return res.status(200).json({
      success: true,
      nearestBranch: branchesWithDistance[0],
      allBranches: branchesWithDistance
    });
  } catch (error) {
    console.error("Lỗi khi tìm chi nhánh gần nhất:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tìm chi nhánh gần nhất",
      error: error.message,
    });
  }
};

// Xác định chi nhánh gần nhất cho địa chỉ (sử dụng cho việc phân công đơn hàng)
export const assignBranchToAddress = async (req, res) => {
  try {
    const { address, latitude, longitude, selectedBranchId } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp địa chỉ giao hàng",
      });
    }

    // Nếu có selectedBranchId, sử dụng chi nhánh người dùng đã chọn
    if (selectedBranchId) {
      try {
        const selectedBranch = await Branch.findById(selectedBranchId);
        
        if (!selectedBranch) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy chi nhánh đã chọn",
          });
        }
        
        // Tính khoảng cách nếu có tọa độ
        let distance = null;
        if (latitude && longitude && selectedBranch.latitude && selectedBranch.longitude) {
          distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            selectedBranch.latitude,
            selectedBranch.longitude
          );
        }
        
        return res.status(200).json({
          success: true,
          assignedBranch: selectedBranch,
          distance: distance,
          method: "user_selected",
          unit: distance ? "km" : null
        });
      } catch (error) {
        console.error("Lỗi khi tìm chi nhánh đã chọn:", error);
        // Nếu có lỗi, tiếp tục tìm chi nhánh gần nhất
      }
    }

    // Nếu có tọa độ, sử dụng tọa độ để tìm chi nhánh gần nhất
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      // Lấy tất cả chi nhánh đang hoạt động
      const branches = await Branch.find({ isActive: true });
      
      if (branches.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chi nhánh nào đang hoạt động",
        });
      }
      
      // Tính khoảng cách và tìm chi nhánh gần nhất
      let nearestBranch = null;
      let shortestDistance = Infinity;
      
      for (const branch of branches) {
        const distance = calculateDistance(
          lat, 
          lng, 
          branch.latitude || 0, 
          branch.longitude || 0
        );
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestBranch = branch;
        }
      }
      
      // Trả về danh sách tất cả chi nhánh kèm khoảng cách và chi nhánh gần nhất
      const branchesWithDistance = branches.map(branch => {
        const distance = calculateDistance(
          lat, 
          lng, 
          branch.latitude || 0, 
          branch.longitude || 0
        );
        
        return {
          ...branch.toObject(),
          distance: distance
        };
      }).sort((a, b) => a.distance - b.distance);
      
      return res.status(200).json({
        success: true,
        assignedBranch: nearestBranch,
        allBranches: branchesWithDistance,
        distance: shortestDistance,
        unit: "km",
        method: "distance_based"
      });
    }
    
    // Nếu không có tọa độ, sử dụng phương pháp đơn giản dựa trên địa chỉ
    // Ví dụ: So sánh văn bản địa chỉ với các từ khóa vùng miền
    const lowerCaseAddress = address.toLowerCase();
    
    // Lấy tất cả chi nhánh
    const branches = await Branch.find({ isActive: true });
    
    if (branches.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh nào đang hoạt động",
      });
    }
    
    // Danh sách từ khóa theo vùng
    const regionKeywords = {
      north: ["hà nội", "bắc ninh", "hải phòng", "quảng ninh", "hưng yên", "hải dương", "bắc giang", "thái bình", "nam định", "ninh bình", "hà nam", "vĩnh phúc", "phú thọ", "thái nguyên", "bắc kạn", "cao bằng", "lạng sơn", "hà giang", "tuyên quang", "yên bái", "lào cai", "điện biên", "lai châu", "sơn la", "hòa bình"],
      central: ["thanh hóa", "nghệ an", "hà tĩnh", "quảng bình", "quảng trị", "thừa thiên huế", "đà nẵng", "quảng nam", "quảng ngãi", "bình định", "phú yên", "khánh hòa", "ninh thuận", "bình thuận", "kon tum", "gia lai", "đắk lắk", "đắk nông", "lâm đồng"],
      south: ["bình phước", "tây ninh", "bình dương", "đồng nai", "bà rịa - vũng tàu", "hồ chí minh", "long an", "tiền giang", "bến tre", "trà vinh", "vĩnh long", "đồng tháp", "an giang", "kiên giang", "cần thơ", "hậu giang", "sóc trăng", "bạc liêu", "cà mau"]
    };

    // Thêm từ khóa cụ thể cho các chi nhánh
    const specificLocations = {
      "sóc trăng": ["sóc trăng", "mỹ tú", "mỹ xuyên", "long phú", "cù lao dung", "kế sách", "trần đề"],
      "cần thơ": ["cần thơ", "ninh kiều", "bình thủy", "cái răng", "ô môn", "thốt nốt", "phong điền", "cờ đỏ", "vĩnh thạnh", "thới lai"]
    };
    
    // Xác định khu vực của địa chỉ
    let region = null;
    for (const [key, keywords] of Object.entries(regionKeywords)) {
      if (keywords.some(keyword => lowerCaseAddress.includes(keyword))) {
        region = key;
        break;
      }
    }
    
    // Mặc định là chi nhánh đầu tiên nếu không xác định được khu vực
    let assignedBranch = branches[0];
    
    // Kiểm tra địa điểm cụ thể trước
    let specificLocationFound = false;
    for (const [location, keywords] of Object.entries(specificLocations)) {
      if (keywords.some(keyword => lowerCaseAddress.includes(keyword))) {
        // Tìm chi nhánh tương ứng với địa điểm cụ thể
        const specificBranch = branches.find(branch => 
          branch.name.toLowerCase().includes(location) || 
          branch.address.toLowerCase().includes(location)
        );
        
        if (specificBranch) {
          assignedBranch = specificBranch;
          specificLocationFound = true;
          break;
        }
      }
    }
    
    // Nếu không tìm thấy địa điểm cụ thể, sử dụng phương pháp dựa trên khu vực
    if (!specificLocationFound && region) {
      if (region === "north" && branches.length > 0) {
        // Tìm chi nhánh ở miền Bắc
        const northBranch = branches.find(branch => 
          branch.name.toLowerCase().includes("hà nội") || 
          branch.address.toLowerCase().includes("hà nội")
        );
        if (northBranch) assignedBranch = northBranch;
      } else if (region === "south" && branches.length > 1) {
        // Tìm chi nhánh ở miền Nam
        const southBranch = branches.find(branch => 
          branch.name.toLowerCase().includes("hồ chí minh") || 
          branch.name.toLowerCase().includes("cần thơ") || 
          branch.address.toLowerCase().includes("hồ chí minh") ||
          branch.address.toLowerCase().includes("cần thơ")
        );
        if (southBranch) assignedBranch = southBranch;
      } else if (region === "central" && branches.length > 2) {
        // Tìm chi nhánh ở miền Trung
        const centralBranch = branches.find(branch => 
          branch.name.toLowerCase().includes("đà nẵng") || 
          branch.address.toLowerCase().includes("đà nẵng")
        );
        if (centralBranch) assignedBranch = centralBranch;
      }
    }
    
    return res.status(200).json({
      success: true,
      assignedBranch,
      allBranches: branches,
      method: specificLocationFound ? "specific_location" : "address_based",
      detectedRegion: region
    });
  } catch (error) {
    console.error("Lỗi khi phân công chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi phân công chi nhánh",
      error: error.message,
    });
  }
};

// Lấy chi nhánh của manager dựa vào token
export const getBranchByManager = async (req, res) => {
  try {
    // Lấy thông tin user từ middleware xác thực
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin xác thực",
      });
    }
    
    // Tìm admin/manager có branchId
    const manager = await Admin.findById(userId);
    
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }
    
    // Kiểm tra xem có phải manager không
    if (manager.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: "Chỉ manager mới có thể truy cập thông tin chi nhánh",
      });
    }
    
    // Kiểm tra có branchId không
    if (!manager.branchId) {
      return res.status(404).json({
        success: false,
        message: "Manager chưa được gán chi nhánh",
      });
    }
    
    // Lấy thông tin chi nhánh
    const branch = await Branch.findById(manager.branchId);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh được gán cho manager",
      });
    }
    
    return res.status(200).json({
      success: true,
      branch,
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi nhánh của manager:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi nhánh của manager",
      error: error.message,
    });
  }
}; 