"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.updateBranch = exports.searchBranches = exports.getBranchByManager = exports.getBranchById = exports.getAllBranches = exports.findNearestBranch = exports.deleteBranch = exports.createBranch = exports.assignBranchToAddress = void 0;var _Branch = _interopRequireDefault(require("../Model/Branch.js"));
var _adminModel = _interopRequireDefault(require("../Model/adminModel.js"));

// Lấy tất cả chi nhánh
const getAllBranches = async (req, res) => {
  try {
    const branches = await _Branch.default.find().sort({ createdAt: -1 });
    return res.status(200).json(branches);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách chi nhánh",
      error: error.message
    });
  }
};

// Tạo chi nhánh mới
exports.getAllBranches = getAllBranches;const createBranch = async (req, res) => {
  try {
    const { name, address, phone, email, manager, openingHours, latitude, longitude } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !address || !phone) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin chi nhánh"
      });
    }

    // Kiểm tra chi nhánh đã tồn tại chưa
    const existingBranch = await _Branch.default.findOne({ name });
    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: "Chi nhánh với tên này đã tồn tại"
      });
    }

    // Tạo chi nhánh mới
    const newBranch = new _Branch.default({
      name,
      address,
      phone,
      email,
      manager,
      openingHours,
      latitude: latitude || 0,
      longitude: longitude || 0,
      createdBy: req.user ? req.user.id : null
    });

    await newBranch.save();

    return res.status(201).json({
      success: true,
      message: "Tạo chi nhánh thành công",
      branch: newBranch
    });
  } catch (error) {
    console.error("Lỗi khi tạo chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo chi nhánh",
      error: error.message
    });
  }
};

// Cập nhật chi nhánh
exports.createBranch = createBranch;const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedBranch = await _Branch.default.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật chi nhánh thành công",
      branch: updatedBranch
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật chi nhánh",
      error: error.message
    });
  }
};

// Xóa chi nhánh
exports.updateBranch = updateBranch;const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBranch = await _Branch.default.findByIdAndDelete(id);

    if (!deletedBranch) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa chi nhánh thành công"
    });
  } catch (error) {
    console.error("Lỗi khi xóa chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xóa chi nhánh",
      error: error.message
    });
  }
};

// Lấy chi nhánh theo ID
exports.deleteBranch = deleteBranch;const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await _Branch.default.findById(id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh"
      });
    }

    return res.status(200).json({
      success: true,
      branch
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin chi nhánh",
      error: error.message
    });
  }
};

// Tìm kiếm chi nhánh
exports.getBranchById = getBranchById;const searchBranches = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp từ khóa tìm kiếm"
      });
    }

    // Tìm kiếm theo tên hoặc địa chỉ
    const branches = await _Branch.default.find({
      $or: [
      { name: { $regex: query, $options: "i" } },
      { address: { $regex: query, $options: "i" } }]

    }).sort({ createdAt: -1 });

    return res.status(200).json(branches);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm chi nhánh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm chi nhánh",
      error: error.message
    });
  }
};

// Tính khoảng cách giữa hai điểm tọa độ sử dụng công thức Haversine
exports.searchBranches = searchBranches;const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
const findNearestBranch = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    // Kiểm tra tham số
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tọa độ (latitude, longitude)"
      });
    }

    // Chuyển đổi tọa độ từ string sang number
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Lấy tất cả chi nhánh đang hoạt động
    const branches = await _Branch.default.find({ isActive: true });

    if (branches.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh nào đang hoạt động"
      });
    }

    // Tính khoảng cách từ địa điểm đến mỗi chi nhánh
    const branchesWithDistance = branches.map((branch) => {
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
      error: error.message
    });
  }
};

// Xác định chi nhánh gần nhất cho địa chỉ (sử dụng cho việc phân công đơn hàng)
exports.findNearestBranch = findNearestBranch;const assignBranchToAddress = async (req, res) => {
  try {
    const { address, latitude, longitude, selectedBranchId } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp địa chỉ giao hàng"
      });
    }

    // Nếu có selectedBranchId, sử dụng chi nhánh người dùng đã chọn
    if (selectedBranchId) {
      try {
        const selectedBranch = await _Branch.default.findById(selectedBranchId);

        if (!selectedBranch) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy chi nhánh đã chọn"
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
      const branches = await _Branch.default.find({ isActive: true });

      if (branches.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chi nhánh nào đang hoạt động"
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
      const branchesWithDistance = branches.map((branch) => {
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
    const branches = await _Branch.default.find({ isActive: true });

    if (branches.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh nào đang hoạt động"
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
      if (keywords.some((keyword) => lowerCaseAddress.includes(keyword))) {
        region = key;
        break;
      }
    }

    // Mặc định là chi nhánh đầu tiên nếu không xác định được khu vực
    let assignedBranch = branches[0];

    // Kiểm tra địa điểm cụ thể trước
    let specificLocationFound = false;
    for (const [location, keywords] of Object.entries(specificLocations)) {
      if (keywords.some((keyword) => lowerCaseAddress.includes(keyword))) {
        // Tìm chi nhánh tương ứng với địa điểm cụ thể
        const specificBranch = branches.find((branch) =>
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
        const northBranch = branches.find((branch) =>
        branch.name.toLowerCase().includes("hà nội") ||
        branch.address.toLowerCase().includes("hà nội")
        );
        if (northBranch) assignedBranch = northBranch;
      } else if (region === "south" && branches.length > 1) {
        // Tìm chi nhánh ở miền Nam
        const southBranch = branches.find((branch) =>
        branch.name.toLowerCase().includes("hồ chí minh") ||
        branch.name.toLowerCase().includes("cần thơ") ||
        branch.address.toLowerCase().includes("hồ chí minh") ||
        branch.address.toLowerCase().includes("cần thơ")
        );
        if (southBranch) assignedBranch = southBranch;
      } else if (region === "central" && branches.length > 2) {
        // Tìm chi nhánh ở miền Trung
        const centralBranch = branches.find((branch) =>
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
      error: error.message
    });
  }
};

// Lấy chi nhánh của manager dựa vào token
exports.assignBranchToAddress = assignBranchToAddress;const getBranchByManager = async (req, res) => {
  try {
    // Lấy thông tin user từ middleware xác thực
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin xác thực"
      });
    }

    // Tìm admin/manager có branchId
    const manager = await _adminModel.default.findById(userId);

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng"
      });
    }

    // Kiểm tra xem có phải manager không
    if (manager.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: "Chỉ manager mới có thể truy cập thông tin chi nhánh"
      });
    }

    // Kiểm tra có branchId không
    if (!manager.branchId) {
      return res.status(404).json({
        success: false,
        message: "Manager chưa được gán chi nhánh"
      });
    }

    // Lấy thông tin chi nhánh
    const branch = await _Branch.default.findById(manager.branchId);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi nhánh được gán cho manager"
      });
    }

    return res.status(200).json({
      success: true,
      branch
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi nhánh của manager:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi nhánh của manager",
      error: error.message
    });
  }
};exports.getBranchByManager = getBranchByManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfQnJhbmNoIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfYWRtaW5Nb2RlbCIsImdldEFsbEJyYW5jaGVzIiwicmVxIiwicmVzIiwiYnJhbmNoZXMiLCJCcmFuY2giLCJmaW5kIiwic29ydCIsImNyZWF0ZWRBdCIsInN0YXR1cyIsImpzb24iLCJlcnJvciIsImNvbnNvbGUiLCJzdWNjZXNzIiwibWVzc2FnZSIsImV4cG9ydHMiLCJjcmVhdGVCcmFuY2giLCJuYW1lIiwiYWRkcmVzcyIsInBob25lIiwiZW1haWwiLCJtYW5hZ2VyIiwib3BlbmluZ0hvdXJzIiwibGF0aXR1ZGUiLCJsb25naXR1ZGUiLCJib2R5IiwiZXhpc3RpbmdCcmFuY2giLCJmaW5kT25lIiwibmV3QnJhbmNoIiwiY3JlYXRlZEJ5IiwidXNlciIsImlkIiwic2F2ZSIsImJyYW5jaCIsInVwZGF0ZUJyYW5jaCIsInBhcmFtcyIsInVwZGF0ZURhdGEiLCJ1cGRhdGVkQnJhbmNoIiwiZmluZEJ5SWRBbmRVcGRhdGUiLCJuZXciLCJydW5WYWxpZGF0b3JzIiwiZGVsZXRlQnJhbmNoIiwiZGVsZXRlZEJyYW5jaCIsImZpbmRCeUlkQW5kRGVsZXRlIiwiZ2V0QnJhbmNoQnlJZCIsImZpbmRCeUlkIiwic2VhcmNoQnJhbmNoZXMiLCJxdWVyeSIsIiRvciIsIiRyZWdleCIsIiRvcHRpb25zIiwiY2FsY3VsYXRlRGlzdGFuY2UiLCJsYXQxIiwibG9uMSIsImxhdDIiLCJsb24yIiwiUiIsImRMYXQiLCJNYXRoIiwiUEkiLCJkTG9uIiwiYSIsInNpbiIsImNvcyIsImMiLCJhdGFuMiIsInNxcnQiLCJmaW5kTmVhcmVzdEJyYW5jaCIsImxhdCIsInBhcnNlRmxvYXQiLCJsbmciLCJpc0FjdGl2ZSIsImxlbmd0aCIsImJyYW5jaGVzV2l0aERpc3RhbmNlIiwibWFwIiwiZGlzdGFuY2UiLCJfaWQiLCJiIiwibmVhcmVzdEJyYW5jaCIsImFsbEJyYW5jaGVzIiwiYXNzaWduQnJhbmNoVG9BZGRyZXNzIiwic2VsZWN0ZWRCcmFuY2hJZCIsInNlbGVjdGVkQnJhbmNoIiwiYXNzaWduZWRCcmFuY2giLCJtZXRob2QiLCJ1bml0Iiwic2hvcnRlc3REaXN0YW5jZSIsIkluZmluaXR5IiwidG9PYmplY3QiLCJsb3dlckNhc2VBZGRyZXNzIiwidG9Mb3dlckNhc2UiLCJyZWdpb25LZXl3b3JkcyIsIm5vcnRoIiwiY2VudHJhbCIsInNvdXRoIiwic3BlY2lmaWNMb2NhdGlvbnMiLCJyZWdpb24iLCJrZXkiLCJrZXl3b3JkcyIsIk9iamVjdCIsImVudHJpZXMiLCJzb21lIiwia2V5d29yZCIsImluY2x1ZGVzIiwic3BlY2lmaWNMb2NhdGlvbkZvdW5kIiwibG9jYXRpb24iLCJzcGVjaWZpY0JyYW5jaCIsIm5vcnRoQnJhbmNoIiwic291dGhCcmFuY2giLCJjZW50cmFsQnJhbmNoIiwiZGV0ZWN0ZWRSZWdpb24iLCJnZXRCcmFuY2hCeU1hbmFnZXIiLCJ1c2VySWQiLCJBZG1pbiIsInJvbGUiLCJicmFuY2hJZCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9Db250cm9sbGVyL2JyYW5jaENvbnRyb2xsZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJyYW5jaCBmcm9tIFwiLi4vTW9kZWwvQnJhbmNoLmpzXCI7XHJcbmltcG9ydCBBZG1pbiBmcm9tIFwiLi4vTW9kZWwvYWRtaW5Nb2RlbC5qc1wiO1xyXG5cclxuLy8gTOG6pXkgdOG6pXQgY+G6oyBjaGkgbmjDoW5oXHJcbmV4cG9ydCBjb25zdCBnZXRBbGxCcmFuY2hlcyA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBicmFuY2hlcyA9IGF3YWl0IEJyYW5jaC5maW5kKCkuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oYnJhbmNoZXMpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGzhuqV5IGRhbmggc8OhY2ggY2hpIG5ow6FuaDpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwiTOG7l2kga2hpIGzhuqV5IGRhbmggc8OhY2ggY2hpIG5ow6FuaFwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFThuqFvIGNoaSBuaMOhbmggbeG7m2lcclxuZXhwb3J0IGNvbnN0IGNyZWF0ZUJyYW5jaCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IG5hbWUsIGFkZHJlc3MsIHBob25lLCBlbWFpbCwgbWFuYWdlciwgb3BlbmluZ0hvdXJzLCBsYXRpdHVkZSwgbG9uZ2l0dWRlIH0gPSByZXEuYm9keTtcclxuXHJcbiAgICAvLyBLaeG7g20gdHJhIGPDoWMgdHLGsOG7nW5nIGLhuq90IGJ14buZY1xyXG4gICAgaWYgKCFuYW1lIHx8ICFhZGRyZXNzIHx8ICFwaG9uZSkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiVnVpIGzDsm5nIGN1bmcgY+G6pXAgxJHhuqd5IMSR4bunIHRow7RuZyB0aW4gY2hpIG5ow6FuaFwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBLaeG7g20gdHJhIGNoaSBuaMOhbmggxJHDoyB04buTbiB04bqhaSBjaMawYVxyXG4gICAgY29uc3QgZXhpc3RpbmdCcmFuY2ggPSBhd2FpdCBCcmFuY2guZmluZE9uZSh7IG5hbWUgfSk7XHJcbiAgICBpZiAoZXhpc3RpbmdCcmFuY2gpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIkNoaSBuaMOhbmggduG7m2kgdMOqbiBuw6B5IMSRw6MgdOG7k24gdOG6oWlcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVOG6oW8gY2hpIG5ow6FuaCBt4bubaVxyXG4gICAgY29uc3QgbmV3QnJhbmNoID0gbmV3IEJyYW5jaCh7XHJcbiAgICAgIG5hbWUsXHJcbiAgICAgIGFkZHJlc3MsXHJcbiAgICAgIHBob25lLFxyXG4gICAgICBlbWFpbCxcclxuICAgICAgbWFuYWdlcixcclxuICAgICAgb3BlbmluZ0hvdXJzLFxyXG4gICAgICBsYXRpdHVkZTogbGF0aXR1ZGUgfHwgMCxcclxuICAgICAgbG9uZ2l0dWRlOiBsb25naXR1ZGUgfHwgMCxcclxuICAgICAgY3JlYXRlZEJ5OiByZXEudXNlciA/IHJlcS51c2VyLmlkIDogbnVsbCxcclxuICAgIH0pO1xyXG5cclxuICAgIGF3YWl0IG5ld0JyYW5jaC5zYXZlKCk7XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJU4bqhbyBjaGkgbmjDoW5oIHRow6BuaCBjw7RuZ1wiLFxyXG4gICAgICBicmFuY2g6IG5ld0JyYW5jaCxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIHThuqFvIGNoaSBuaMOhbmg6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIkzhu5dpIGtoaSB04bqhbyBjaGkgbmjDoW5oXCIsXHJcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gQ+G6rXAgbmjhuq10IGNoaSBuaMOhbmhcclxuZXhwb3J0IGNvbnN0IHVwZGF0ZUJyYW5jaCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IGlkIH0gPSByZXEucGFyYW1zO1xyXG4gICAgY29uc3QgdXBkYXRlRGF0YSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGNvbnN0IHVwZGF0ZWRCcmFuY2ggPSBhd2FpdCBCcmFuY2guZmluZEJ5SWRBbmRVcGRhdGUoXHJcbiAgICAgIGlkLFxyXG4gICAgICB1cGRhdGVEYXRhLFxyXG4gICAgICB7IG5ldzogdHJ1ZSwgcnVuVmFsaWRhdG9yczogdHJ1ZSB9XHJcbiAgICApO1xyXG5cclxuICAgIGlmICghdXBkYXRlZEJyYW5jaCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IGNoaSBuaMOhbmhcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJD4bqtcCBuaOG6rXQgY2hpIG5ow6FuaCB0aMOgbmggY8O0bmdcIixcclxuICAgICAgYnJhbmNoOiB1cGRhdGVkQnJhbmNoLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgY+G6rXAgbmjhuq10IGNoaSBuaMOhbmg6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIkzhu5dpIGtoaSBj4bqtcCBuaOG6rXQgY2hpIG5ow6FuaFwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFjDs2EgY2hpIG5ow6FuaFxyXG5leHBvcnQgY29uc3QgZGVsZXRlQnJhbmNoID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgaWQgfSA9IHJlcS5wYXJhbXM7XHJcblxyXG4gICAgY29uc3QgZGVsZXRlZEJyYW5jaCA9IGF3YWl0IEJyYW5jaC5maW5kQnlJZEFuZERlbGV0ZShpZCk7XHJcblxyXG4gICAgaWYgKCFkZWxldGVkQnJhbmNoKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgY2hpIG5ow6FuaFwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiBcIljDs2EgY2hpIG5ow6FuaCB0aMOgbmggY8O0bmdcIixcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIHjDs2EgY2hpIG5ow6FuaDpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwiTOG7l2kga2hpIHjDs2EgY2hpIG5ow6FuaFwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEzhuqV5IGNoaSBuaMOhbmggdGhlbyBJRFxyXG5leHBvcnQgY29uc3QgZ2V0QnJhbmNoQnlJZCA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IGlkIH0gPSByZXEucGFyYW1zO1xyXG5cclxuICAgIGNvbnN0IGJyYW5jaCA9IGF3YWl0IEJyYW5jaC5maW5kQnlJZChpZCk7XHJcblxyXG4gICAgaWYgKCFicmFuY2gpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBjaGkgbmjDoW5oXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGJyYW5jaCxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGzhuqV5IHRow7RuZyB0aW4gY2hpIG5ow6FuaDpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwiTOG7l2kga2hpIGzhuqV5IHRow7RuZyB0aW4gY2hpIG5ow6FuaFwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFTDrG0ga2nhur9tIGNoaSBuaMOhbmhcclxuZXhwb3J0IGNvbnN0IHNlYXJjaEJyYW5jaGVzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgcXVlcnkgfSA9IHJlcS5xdWVyeTtcclxuXHJcbiAgICBpZiAoIXF1ZXJ5KSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJWdWkgbMOybmcgY3VuZyBj4bqlcCB04burIGtow7NhIHTDrG0ga2nhur9tXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFTDrG0ga2nhur9tIHRoZW8gdMOqbiBob+G6t2MgxJHhu4thIGNo4buJXHJcbiAgICBjb25zdCBicmFuY2hlcyA9IGF3YWl0IEJyYW5jaC5maW5kKHtcclxuICAgICAgJG9yOiBbXHJcbiAgICAgICAgeyBuYW1lOiB7ICRyZWdleDogcXVlcnksICRvcHRpb25zOiBcImlcIiB9IH0sXHJcbiAgICAgICAgeyBhZGRyZXNzOiB7ICRyZWdleDogcXVlcnksICRvcHRpb25zOiBcImlcIiB9IH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KS5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oYnJhbmNoZXMpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIHTDrG0ga2nhur9tIGNoaSBuaMOhbmg6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiBcIkzhu5dpIGtoaSB0w6xtIGtp4bq/bSBjaGkgbmjDoW5oXCIsXHJcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gVMOtbmgga2hv4bqjbmcgY8OhY2ggZ2nhu69hIGhhaSDEkWnhu4NtIHThu41hIMSR4buZIHPhu60gZOG7pW5nIGPDtG5nIHRo4bupYyBIYXZlcnNpbmVcclxuY29uc3QgY2FsY3VsYXRlRGlzdGFuY2UgPSAobGF0MSwgbG9uMSwgbGF0MiwgbG9uMikgPT4ge1xyXG4gIGNvbnN0IFIgPSA2MzcxOyAvLyBCw6FuIGvDrW5oIHRyw6FpIMSR4bqldCB0w61uaCBi4bqxbmcga21cclxuICBjb25zdCBkTGF0ID0gKGxhdDIgLSBsYXQxKSAqIChNYXRoLlBJIC8gMTgwKTtcclxuICBjb25zdCBkTG9uID0gKGxvbjIgLSBsb24xKSAqIChNYXRoLlBJIC8gMTgwKTtcclxuICBjb25zdCBhID0gXHJcbiAgICBNYXRoLnNpbihkTGF0IC8gMikgKiBNYXRoLnNpbihkTGF0IC8gMikgK1xyXG4gICAgTWF0aC5jb3MobGF0MSAqIChNYXRoLlBJIC8gMTgwKSkgKiBNYXRoLmNvcyhsYXQyICogKE1hdGguUEkgLyAxODApKSAqIFxyXG4gICAgTWF0aC5zaW4oZExvbiAvIDIpICogTWF0aC5zaW4oZExvbiAvIDIpO1xyXG4gIGNvbnN0IGMgPSAyICogTWF0aC5hdGFuMihNYXRoLnNxcnQoYSksIE1hdGguc3FydCgxIC0gYSkpO1xyXG4gIHJldHVybiBSICogYzsgLy8gS2hv4bqjbmcgY8OhY2ggdMOtbmggYuG6sW5nIGttXHJcbn07XHJcblxyXG4vLyBUw6xtIGNoaSBuaMOhbmggZ+G6p24gbmjhuqV0IHbhu5tpIMSR4buLYSBjaOG7iVxyXG5leHBvcnQgY29uc3QgZmluZE5lYXJlc3RCcmFuY2ggPSBhc3luYyAocmVxLCByZXMpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBsYXRpdHVkZSwgbG9uZ2l0dWRlIH0gPSByZXEucXVlcnk7XHJcblxyXG4gICAgLy8gS2nhu4NtIHRyYSB0aGFtIHPhu5FcclxuICAgIGlmICghbGF0aXR1ZGUgfHwgIWxvbmdpdHVkZSkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiVnVpIGzDsm5nIGN1bmcgY+G6pXAgdOG7jWEgxJHhu5kgKGxhdGl0dWRlLCBsb25naXR1ZGUpXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENodXnhu4NuIMSR4buVaSB04buNYSDEkeG7mSB04burIHN0cmluZyBzYW5nIG51bWJlclxyXG4gICAgY29uc3QgbGF0ID0gcGFyc2VGbG9hdChsYXRpdHVkZSk7XHJcbiAgICBjb25zdCBsbmcgPSBwYXJzZUZsb2F0KGxvbmdpdHVkZSk7XHJcblxyXG4gICAgLy8gTOG6pXkgdOG6pXQgY+G6oyBjaGkgbmjDoW5oIMSRYW5nIGhv4bqhdCDEkeG7mW5nXHJcbiAgICBjb25zdCBicmFuY2hlcyA9IGF3YWl0IEJyYW5jaC5maW5kKHsgaXNBY3RpdmU6IHRydWUgfSk7XHJcblxyXG4gICAgaWYgKGJyYW5jaGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IGNoaSBuaMOhbmggbsOgbyDEkWFuZyBob+G6oXQgxJHhu5luZ1wiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUw61uaCBraG/huqNuZyBjw6FjaCB04burIMSR4buLYSDEkWnhu4NtIMSR4bq/biBt4buXaSBjaGkgbmjDoW5oXHJcbiAgICBjb25zdCBicmFuY2hlc1dpdGhEaXN0YW5jZSA9IGJyYW5jaGVzLm1hcChicmFuY2ggPT4ge1xyXG4gICAgICBjb25zdCBkaXN0YW5jZSA9IGNhbGN1bGF0ZURpc3RhbmNlKFxyXG4gICAgICAgIGxhdCwgXHJcbiAgICAgICAgbG5nLCBcclxuICAgICAgICBicmFuY2gubGF0aXR1ZGUgfHwgMCwgXHJcbiAgICAgICAgYnJhbmNoLmxvbmdpdHVkZSB8fCAwXHJcbiAgICAgICk7XHJcbiAgICAgIFxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIF9pZDogYnJhbmNoLl9pZCxcclxuICAgICAgICBuYW1lOiBicmFuY2gubmFtZSxcclxuICAgICAgICBhZGRyZXNzOiBicmFuY2guYWRkcmVzcyxcclxuICAgICAgICBwaG9uZTogYnJhbmNoLnBob25lLFxyXG4gICAgICAgIGxhdGl0dWRlOiBicmFuY2gubGF0aXR1ZGUsXHJcbiAgICAgICAgbG9uZ2l0dWRlOiBicmFuY2gubG9uZ2l0dWRlLFxyXG4gICAgICAgIGRpc3RhbmNlOiBkaXN0YW5jZSAvLyBLaG/huqNuZyBjw6FjaCB0w61uaCBi4bqxbmcga21cclxuICAgICAgfTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFPhuq9wIHjhur9wIHRoZW8ga2hv4bqjbmcgY8OhY2ggdMSDbmcgZOG6p25cclxuICAgIGJyYW5jaGVzV2l0aERpc3RhbmNlLnNvcnQoKGEsIGIpID0+IGEuZGlzdGFuY2UgLSBiLmRpc3RhbmNlKTtcclxuXHJcbiAgICAvLyBUcuG6oyB24buBIGNoaSBuaMOhbmggZ+G6p24gbmjhuqV0XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBuZWFyZXN0QnJhbmNoOiBicmFuY2hlc1dpdGhEaXN0YW5jZVswXSxcclxuICAgICAgYWxsQnJhbmNoZXM6IGJyYW5jaGVzV2l0aERpc3RhbmNlXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkzhu5dpIGtoaSB0w6xtIGNoaSBuaMOhbmggZ+G6p24gbmjhuqV0OlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogXCJM4buXaSBraGkgdMOsbSBjaGkgbmjDoW5oIGfhuqduIG5o4bqldFwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFjDoWMgxJHhu4tuaCBjaGkgbmjDoW5oIGfhuqduIG5o4bqldCBjaG8gxJHhu4thIGNo4buJIChz4butIGThu6VuZyBjaG8gdmnhu4djIHBow6JuIGPDtG5nIMSRxqFuIGjDoG5nKVxyXG5leHBvcnQgY29uc3QgYXNzaWduQnJhbmNoVG9BZGRyZXNzID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgYWRkcmVzcywgbGF0aXR1ZGUsIGxvbmdpdHVkZSwgc2VsZWN0ZWRCcmFuY2hJZCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgaWYgKCFhZGRyZXNzKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJWdWkgbMOybmcgY3VuZyBj4bqlcCDEkeG7i2EgY2jhu4kgZ2lhbyBow6BuZ1wiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBO4bq/dSBjw7Mgc2VsZWN0ZWRCcmFuY2hJZCwgc+G7rSBk4bulbmcgY2hpIG5ow6FuaCBuZ8aw4budaSBkw7luZyDEkcOjIGNo4buNblxyXG4gICAgaWYgKHNlbGVjdGVkQnJhbmNoSWQpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBzZWxlY3RlZEJyYW5jaCA9IGF3YWl0IEJyYW5jaC5maW5kQnlJZChzZWxlY3RlZEJyYW5jaElkKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoIXNlbGVjdGVkQnJhbmNoKSB7XHJcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgY2hpIG5ow6FuaCDEkcOjIGNo4buNblwiLFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFTDrW5oIGtob+G6o25nIGPDoWNoIG7hur91IGPDsyB04buNYSDEkeG7mVxyXG4gICAgICAgIGxldCBkaXN0YW5jZSA9IG51bGw7XHJcbiAgICAgICAgaWYgKGxhdGl0dWRlICYmIGxvbmdpdHVkZSAmJiBzZWxlY3RlZEJyYW5jaC5sYXRpdHVkZSAmJiBzZWxlY3RlZEJyYW5jaC5sb25naXR1ZGUpIHtcclxuICAgICAgICAgIGRpc3RhbmNlID0gY2FsY3VsYXRlRGlzdGFuY2UoXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQobGF0aXR1ZGUpLFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KGxvbmdpdHVkZSksXHJcbiAgICAgICAgICAgIHNlbGVjdGVkQnJhbmNoLmxhdGl0dWRlLFxyXG4gICAgICAgICAgICBzZWxlY3RlZEJyYW5jaC5sb25naXR1ZGVcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgYXNzaWduZWRCcmFuY2g6IHNlbGVjdGVkQnJhbmNoLFxyXG4gICAgICAgICAgZGlzdGFuY2U6IGRpc3RhbmNlLFxyXG4gICAgICAgICAgbWV0aG9kOiBcInVzZXJfc2VsZWN0ZWRcIixcclxuICAgICAgICAgIHVuaXQ6IGRpc3RhbmNlID8gXCJrbVwiIDogbnVsbFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgdMOsbSBjaGkgbmjDoW5oIMSRw6MgY2jhu41uOlwiLCBlcnJvcik7XHJcbiAgICAgICAgLy8gTuG6v3UgY8OzIGzhu5dpLCB0aeG6v3AgdOG7pWMgdMOsbSBjaGkgbmjDoW5oIGfhuqduIG5o4bqldFxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTuG6v3UgY8OzIHThu41hIMSR4buZLCBz4butIGThu6VuZyB04buNYSDEkeG7mSDEkeG7gyB0w6xtIGNoaSBuaMOhbmggZ+G6p24gbmjhuqV0XHJcbiAgICBpZiAobGF0aXR1ZGUgJiYgbG9uZ2l0dWRlKSB7XHJcbiAgICAgIGNvbnN0IGxhdCA9IHBhcnNlRmxvYXQobGF0aXR1ZGUpO1xyXG4gICAgICBjb25zdCBsbmcgPSBwYXJzZUZsb2F0KGxvbmdpdHVkZSk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBM4bqleSB04bqldCBj4bqjIGNoaSBuaMOhbmggxJFhbmcgaG/huqF0IMSR4buZbmdcclxuICAgICAgY29uc3QgYnJhbmNoZXMgPSBhd2FpdCBCcmFuY2guZmluZCh7IGlzQWN0aXZlOiB0cnVlIH0pO1xyXG4gICAgICBcclxuICAgICAgaWYgKGJyYW5jaGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgIG1lc3NhZ2U6IFwiS2jDtG5nIHTDrG0gdGjhuqV5IGNoaSBuaMOhbmggbsOgbyDEkWFuZyBob+G6oXQgxJHhu5luZ1wiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBUw61uaCBraG/huqNuZyBjw6FjaCB2w6AgdMOsbSBjaGkgbmjDoW5oIGfhuqduIG5o4bqldFxyXG4gICAgICBsZXQgbmVhcmVzdEJyYW5jaCA9IG51bGw7XHJcbiAgICAgIGxldCBzaG9ydGVzdERpc3RhbmNlID0gSW5maW5pdHk7XHJcbiAgICAgIFxyXG4gICAgICBmb3IgKGNvbnN0IGJyYW5jaCBvZiBicmFuY2hlcykge1xyXG4gICAgICAgIGNvbnN0IGRpc3RhbmNlID0gY2FsY3VsYXRlRGlzdGFuY2UoXHJcbiAgICAgICAgICBsYXQsIFxyXG4gICAgICAgICAgbG5nLCBcclxuICAgICAgICAgIGJyYW5jaC5sYXRpdHVkZSB8fCAwLCBcclxuICAgICAgICAgIGJyYW5jaC5sb25naXR1ZGUgfHwgMFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGRpc3RhbmNlIDwgc2hvcnRlc3REaXN0YW5jZSkge1xyXG4gICAgICAgICAgc2hvcnRlc3REaXN0YW5jZSA9IGRpc3RhbmNlO1xyXG4gICAgICAgICAgbmVhcmVzdEJyYW5jaCA9IGJyYW5jaDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIFRy4bqjIHbhu4EgZGFuaCBzw6FjaCB04bqldCBj4bqjIGNoaSBuaMOhbmgga8OobSBraG/huqNuZyBjw6FjaCB2w6AgY2hpIG5ow6FuaCBn4bqnbiBuaOG6pXRcclxuICAgICAgY29uc3QgYnJhbmNoZXNXaXRoRGlzdGFuY2UgPSBicmFuY2hlcy5tYXAoYnJhbmNoID0+IHtcclxuICAgICAgICBjb25zdCBkaXN0YW5jZSA9IGNhbGN1bGF0ZURpc3RhbmNlKFxyXG4gICAgICAgICAgbGF0LCBcclxuICAgICAgICAgIGxuZywgXHJcbiAgICAgICAgICBicmFuY2gubGF0aXR1ZGUgfHwgMCwgXHJcbiAgICAgICAgICBicmFuY2gubG9uZ2l0dWRlIHx8IDBcclxuICAgICAgICApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAuLi5icmFuY2gudG9PYmplY3QoKSxcclxuICAgICAgICAgIGRpc3RhbmNlOiBkaXN0YW5jZVxyXG4gICAgICAgIH07XHJcbiAgICAgIH0pLnNvcnQoKGEsIGIpID0+IGEuZGlzdGFuY2UgLSBiLmRpc3RhbmNlKTtcclxuICAgICAgXHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICBhc3NpZ25lZEJyYW5jaDogbmVhcmVzdEJyYW5jaCxcclxuICAgICAgICBhbGxCcmFuY2hlczogYnJhbmNoZXNXaXRoRGlzdGFuY2UsXHJcbiAgICAgICAgZGlzdGFuY2U6IHNob3J0ZXN0RGlzdGFuY2UsXHJcbiAgICAgICAgdW5pdDogXCJrbVwiLFxyXG4gICAgICAgIG1ldGhvZDogXCJkaXN0YW5jZV9iYXNlZFwiXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBO4bq/dSBraMO0bmcgY8OzIHThu41hIMSR4buZLCBz4butIGThu6VuZyBwaMawxqFuZyBwaMOhcCDEkcahbiBnaeG6o24gZOG7sWEgdHLDqm4gxJHhu4thIGNo4buJXHJcbiAgICAvLyBWw60gZOG7pTogU28gc8OhbmggdsSDbiBi4bqjbiDEkeG7i2EgY2jhu4kgduG7m2kgY8OhYyB04burIGtow7NhIHbDuW5nIG1p4buBblxyXG4gICAgY29uc3QgbG93ZXJDYXNlQWRkcmVzcyA9IGFkZHJlc3MudG9Mb3dlckNhc2UoKTtcclxuICAgIFxyXG4gICAgLy8gTOG6pXkgdOG6pXQgY+G6oyBjaGkgbmjDoW5oXHJcbiAgICBjb25zdCBicmFuY2hlcyA9IGF3YWl0IEJyYW5jaC5maW5kKHsgaXNBY3RpdmU6IHRydWUgfSk7XHJcbiAgICBcclxuICAgIGlmIChicmFuY2hlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBjaGkgbmjDoW5oIG7DoG8gxJFhbmcgaG/huqF0IMSR4buZbmdcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIERhbmggc8OhY2ggdOG7qyBraMOzYSB0aGVvIHbDuW5nXHJcbiAgICBjb25zdCByZWdpb25LZXl3b3JkcyA9IHtcclxuICAgICAgbm9ydGg6IFtcImjDoCBu4buZaVwiLCBcImLhuq9jIG5pbmhcIiwgXCJo4bqjaSBwaMOybmdcIiwgXCJxdeG6o25nIG5pbmhcIiwgXCJoxrBuZyB5w6puXCIsIFwiaOG6o2kgZMawxqFuZ1wiLCBcImLhuq9jIGdpYW5nXCIsIFwidGjDoWkgYsOsbmhcIiwgXCJuYW0gxJHhu4tuaFwiLCBcIm5pbmggYsOsbmhcIiwgXCJow6AgbmFtXCIsIFwidsSpbmggcGjDumNcIiwgXCJwaMO6IHRo4buNXCIsIFwidGjDoWkgbmd1ecOqblwiLCBcImLhuq9jIGvhuqFuXCIsIFwiY2FvIGLhurFuZ1wiLCBcImzhuqFuZyBzxqFuXCIsIFwiaMOgIGdpYW5nXCIsIFwidHV5w6puIHF1YW5nXCIsIFwiecOqbiBiw6FpXCIsIFwibMOgbyBjYWlcIiwgXCLEkWnhu4duIGJpw6puXCIsIFwibGFpIGNow6J1XCIsIFwic8ahbiBsYVwiLCBcImjDsmEgYsOsbmhcIl0sXHJcbiAgICAgIGNlbnRyYWw6IFtcInRoYW5oIGjDs2FcIiwgXCJuZ2jhu4cgYW5cIiwgXCJow6AgdMSpbmhcIiwgXCJxdeG6o25nIGLDrG5oXCIsIFwicXXhuqNuZyB0cuG7i1wiLCBcInRo4burYSB0aGnDqm4gaHXhur9cIiwgXCLEkcOgIG7hurVuZ1wiLCBcInF14bqjbmcgbmFtXCIsIFwicXXhuqNuZyBuZ8OjaVwiLCBcImLDrG5oIMSR4buLbmhcIiwgXCJwaMO6IHnDqm5cIiwgXCJraMOhbmggaMOyYVwiLCBcIm5pbmggdGh14bqtblwiLCBcImLDrG5oIHRodeG6rW5cIiwgXCJrb24gdHVtXCIsIFwiZ2lhIGxhaVwiLCBcIsSR4bqvayBs4bqva1wiLCBcIsSR4bqvayBuw7RuZ1wiLCBcImzDom0gxJHhu5NuZ1wiXSxcclxuICAgICAgc291dGg6IFtcImLDrG5oIHBoxrDhu5tjXCIsIFwidMOieSBuaW5oXCIsIFwiYsOsbmggZMawxqFuZ1wiLCBcIsSR4buTbmcgbmFpXCIsIFwiYsOgIHLhu4thIC0gdsWpbmcgdMOgdVwiLCBcImjhu5MgY2jDrSBtaW5oXCIsIFwibG9uZyBhblwiLCBcInRp4buBbiBnaWFuZ1wiLCBcImLhur9uIHRyZVwiLCBcInRyw6AgdmluaFwiLCBcInbEqW5oIGxvbmdcIiwgXCLEkeG7k25nIHRow6FwXCIsIFwiYW4gZ2lhbmdcIiwgXCJracOqbiBnaWFuZ1wiLCBcImPhuqduIHRoxqFcIiwgXCJo4bqtdSBnaWFuZ1wiLCBcInPDs2MgdHLEg25nXCIsIFwiYuG6oWMgbGnDqnVcIiwgXCJjw6AgbWF1XCJdXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFRow6ptIHThu6sga2jDs2EgY+G7pSB0aOG7gyBjaG8gY8OhYyBjaGkgbmjDoW5oXHJcbiAgICBjb25zdCBzcGVjaWZpY0xvY2F0aW9ucyA9IHtcclxuICAgICAgXCJzw7NjIHRyxINuZ1wiOiBbXCJzw7NjIHRyxINuZ1wiLCBcIm3hu7kgdMO6XCIsIFwibeG7uSB4dXnDqm5cIiwgXCJsb25nIHBow7pcIiwgXCJjw7kgbGFvIGR1bmdcIiwgXCJr4bq/IHPDoWNoXCIsIFwidHLhuqduIMSR4buBXCJdLFxyXG4gICAgICBcImPhuqduIHRoxqFcIjogW1wiY+G6p24gdGjGoVwiLCBcIm5pbmgga2nhu4F1XCIsIFwiYsOsbmggdGjhu6d5XCIsIFwiY8OhaSByxINuZ1wiLCBcIsO0IG3DtG5cIiwgXCJ0aOG7kXQgbuG7kXRcIiwgXCJwaG9uZyDEkWnhu4FuXCIsIFwiY+G7nSDEkeG7j1wiLCBcInbEqW5oIHRo4bqhbmhcIiwgXCJ0aOG7m2kgbGFpXCJdXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvLyBYw6FjIMSR4buLbmgga2h1IHbhu7FjIGPhu6dhIMSR4buLYSBjaOG7iVxyXG4gICAgbGV0IHJlZ2lvbiA9IG51bGw7XHJcbiAgICBmb3IgKGNvbnN0IFtrZXksIGtleXdvcmRzXSBvZiBPYmplY3QuZW50cmllcyhyZWdpb25LZXl3b3JkcykpIHtcclxuICAgICAgaWYgKGtleXdvcmRzLnNvbWUoa2V5d29yZCA9PiBsb3dlckNhc2VBZGRyZXNzLmluY2x1ZGVzKGtleXdvcmQpKSkge1xyXG4gICAgICAgIHJlZ2lvbiA9IGtleTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBN4bq3YyDEkeG7i25oIGzDoCBjaGkgbmjDoW5oIMSR4bqndSB0acOqbiBu4bq/dSBraMO0bmcgeMOhYyDEkeG7i25oIMSRxrDhu6NjIGtodSB24buxY1xyXG4gICAgbGV0IGFzc2lnbmVkQnJhbmNoID0gYnJhbmNoZXNbMF07XHJcbiAgICBcclxuICAgIC8vIEtp4buDbSB0cmEgxJHhu4thIMSRaeG7g20gY+G7pSB0aOG7gyB0csaw4bubY1xyXG4gICAgbGV0IHNwZWNpZmljTG9jYXRpb25Gb3VuZCA9IGZhbHNlO1xyXG4gICAgZm9yIChjb25zdCBbbG9jYXRpb24sIGtleXdvcmRzXSBvZiBPYmplY3QuZW50cmllcyhzcGVjaWZpY0xvY2F0aW9ucykpIHtcclxuICAgICAgaWYgKGtleXdvcmRzLnNvbWUoa2V5d29yZCA9PiBsb3dlckNhc2VBZGRyZXNzLmluY2x1ZGVzKGtleXdvcmQpKSkge1xyXG4gICAgICAgIC8vIFTDrG0gY2hpIG5ow6FuaCB0xrDGoW5nIOG7qW5nIHbhu5tpIMSR4buLYSDEkWnhu4NtIGPhu6UgdGjhu4NcclxuICAgICAgICBjb25zdCBzcGVjaWZpY0JyYW5jaCA9IGJyYW5jaGVzLmZpbmQoYnJhbmNoID0+IFxyXG4gICAgICAgICAgYnJhbmNoLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhsb2NhdGlvbikgfHwgXHJcbiAgICAgICAgICBicmFuY2guYWRkcmVzcy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGxvY2F0aW9uKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHNwZWNpZmljQnJhbmNoKSB7XHJcbiAgICAgICAgICBhc3NpZ25lZEJyYW5jaCA9IHNwZWNpZmljQnJhbmNoO1xyXG4gICAgICAgICAgc3BlY2lmaWNMb2NhdGlvbkZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBO4bq/dSBraMO0bmcgdMOsbSB0aOG6pXkgxJHhu4thIMSRaeG7g20gY+G7pSB0aOG7gywgc+G7rSBk4bulbmcgcGjGsMahbmcgcGjDoXAgZOG7sWEgdHLDqm4ga2h1IHbhu7FjXHJcbiAgICBpZiAoIXNwZWNpZmljTG9jYXRpb25Gb3VuZCAmJiByZWdpb24pIHtcclxuICAgICAgaWYgKHJlZ2lvbiA9PT0gXCJub3J0aFwiICYmIGJyYW5jaGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAvLyBUw6xtIGNoaSBuaMOhbmgg4bufIG1p4buBbiBC4bqvY1xyXG4gICAgICAgIGNvbnN0IG5vcnRoQnJhbmNoID0gYnJhbmNoZXMuZmluZChicmFuY2ggPT4gXHJcbiAgICAgICAgICBicmFuY2gubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiaMOgIG7hu5lpXCIpIHx8IFxyXG4gICAgICAgICAgYnJhbmNoLmFkZHJlc3MudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcImjDoCBu4buZaVwiKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgaWYgKG5vcnRoQnJhbmNoKSBhc3NpZ25lZEJyYW5jaCA9IG5vcnRoQnJhbmNoO1xyXG4gICAgICB9IGVsc2UgaWYgKHJlZ2lvbiA9PT0gXCJzb3V0aFwiICYmIGJyYW5jaGVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAvLyBUw6xtIGNoaSBuaMOhbmgg4bufIG1p4buBbiBOYW1cclxuICAgICAgICBjb25zdCBzb3V0aEJyYW5jaCA9IGJyYW5jaGVzLmZpbmQoYnJhbmNoID0+IFxyXG4gICAgICAgICAgYnJhbmNoLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcImjhu5MgY2jDrSBtaW5oXCIpIHx8IFxyXG4gICAgICAgICAgYnJhbmNoLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcImPhuqduIHRoxqFcIikgfHwgXHJcbiAgICAgICAgICBicmFuY2guYWRkcmVzcy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiaOG7kyBjaMOtIG1pbmhcIikgfHxcclxuICAgICAgICAgIGJyYW5jaC5hZGRyZXNzLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoXCJj4bqnbiB0aMahXCIpXHJcbiAgICAgICAgKTtcclxuICAgICAgICBpZiAoc291dGhCcmFuY2gpIGFzc2lnbmVkQnJhbmNoID0gc291dGhCcmFuY2g7XHJcbiAgICAgIH0gZWxzZSBpZiAocmVnaW9uID09PSBcImNlbnRyYWxcIiAmJiBicmFuY2hlcy5sZW5ndGggPiAyKSB7XHJcbiAgICAgICAgLy8gVMOsbSBjaGkgbmjDoW5oIOG7nyBtaeG7gW4gVHJ1bmdcclxuICAgICAgICBjb25zdCBjZW50cmFsQnJhbmNoID0gYnJhbmNoZXMuZmluZChicmFuY2ggPT4gXHJcbiAgICAgICAgICBicmFuY2gubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwixJHDoCBu4bq1bmdcIikgfHwgXHJcbiAgICAgICAgICBicmFuY2guYWRkcmVzcy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwixJHDoCBu4bq1bmdcIilcclxuICAgICAgICApO1xyXG4gICAgICAgIGlmIChjZW50cmFsQnJhbmNoKSBhc3NpZ25lZEJyYW5jaCA9IGNlbnRyYWxCcmFuY2g7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgYXNzaWduZWRCcmFuY2gsXHJcbiAgICAgIGFsbEJyYW5jaGVzOiBicmFuY2hlcyxcclxuICAgICAgbWV0aG9kOiBzcGVjaWZpY0xvY2F0aW9uRm91bmQgPyBcInNwZWNpZmljX2xvY2F0aW9uXCIgOiBcImFkZHJlc3NfYmFzZWRcIixcclxuICAgICAgZGV0ZWN0ZWRSZWdpb246IHJlZ2lvblxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJM4buXaSBraGkgcGjDom4gY8O0bmcgY2hpIG5ow6FuaDpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwiTOG7l2kga2hpIHBow6JuIGPDtG5nIGNoaSBuaMOhbmhcIixcclxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBM4bqleSBjaGkgbmjDoW5oIGPhu6dhIG1hbmFnZXIgZOG7sWEgdsOgbyB0b2tlblxyXG5leHBvcnQgY29uc3QgZ2V0QnJhbmNoQnlNYW5hZ2VyID0gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIEzhuqV5IHRow7RuZyB0aW4gdXNlciB04burIG1pZGRsZXdhcmUgeMOhYyB0aOG7sWNcclxuICAgIGNvbnN0IHVzZXJJZCA9IHJlcS51c2VyPy5pZDtcclxuICAgIFxyXG4gICAgaWYgKCF1c2VySWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSB0aMO0bmcgdGluIHjDoWMgdGjhu7FjXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBUw6xtIGFkbWluL21hbmFnZXIgY8OzIGJyYW5jaElkXHJcbiAgICBjb25zdCBtYW5hZ2VyID0gYXdhaXQgQWRtaW4uZmluZEJ5SWQodXNlcklkKTtcclxuICAgIFxyXG4gICAgaWYgKCFtYW5hZ2VyKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJLaMO0bmcgdMOsbSB0aOG6pXkgdGjDtG5nIHRpbiBuZ8aw4budaSBkw7luZ1wiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gS2nhu4NtIHRyYSB4ZW0gY8OzIHBo4bqjaSBtYW5hZ2VyIGtow7RuZ1xyXG4gICAgaWYgKG1hbmFnZXIucm9sZSAhPT0gJ21hbmFnZXInKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogXCJDaOG7iSBtYW5hZ2VyIG3hu5tpIGPDsyB0aOG7gyB0cnV5IGPhuq1wIHRow7RuZyB0aW4gY2hpIG5ow6FuaFwiLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gS2nhu4NtIHRyYSBjw7MgYnJhbmNoSWQga2jDtG5nXHJcbiAgICBpZiAoIW1hbmFnZXIuYnJhbmNoSWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIk1hbmFnZXIgY2jGsGEgxJHGsOG7o2MgZ8OhbiBjaGkgbmjDoW5oXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBM4bqleSB0aMO0bmcgdGluIGNoaSBuaMOhbmhcclxuICAgIGNvbnN0IGJyYW5jaCA9IGF3YWl0IEJyYW5jaC5maW5kQnlJZChtYW5hZ2VyLmJyYW5jaElkKTtcclxuICAgIFxyXG4gICAgaWYgKCFicmFuY2gpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiBcIktow7RuZyB0w6xtIHRo4bqleSBjaGkgbmjDoW5oIMSRxrDhu6NjIGfDoW4gY2hvIG1hbmFnZXJcIixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGJyYW5jaCxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiTOG7l2kga2hpIGzhuqV5IGNoaSBuaMOhbmggY+G7p2EgbWFuYWdlcjpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6IFwiTOG7l2kga2hpIGzhuqV5IGNoaSBuaMOhbmggY+G7p2EgbWFuYWdlclwiLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgIH0pO1xyXG4gIH1cclxufTsgIl0sIm1hcHBpbmdzIjoiK1lBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsV0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ08sTUFBTUUsY0FBYyxHQUFHLE1BQUFBLENBQU9DLEdBQUcsRUFBRUMsR0FBRyxLQUFLO0VBQ2hELElBQUk7SUFDRixNQUFNQyxRQUFRLEdBQUcsTUFBTUMsZUFBTSxDQUFDQyxJQUFJLENBQUMsQ0FBQyxDQUFDQyxJQUFJLENBQUMsRUFBRUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RCxPQUFPTCxHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDTixRQUFRLENBQUM7RUFDdkMsQ0FBQyxDQUFDLE9BQU9PLEtBQUssRUFBRTtJQUNkQyxPQUFPLENBQUNELEtBQUssQ0FBQyxrQ0FBa0MsRUFBRUEsS0FBSyxDQUFDO0lBQ3hELE9BQU9SLEdBQUcsQ0FBQ00sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7TUFDMUJHLE9BQU8sRUFBRSxLQUFLO01BQ2RDLE9BQU8sRUFBRSxpQ0FBaUM7TUFDMUNILEtBQUssRUFBRUEsS0FBSyxDQUFDRztJQUNmLENBQUMsQ0FBQztFQUNKO0FBQ0YsQ0FBQzs7QUFFRDtBQUFBQyxPQUFBLENBQUFkLGNBQUEsR0FBQUEsY0FBQSxDQUNPLE1BQU1lLFlBQVksR0FBRyxNQUFBQSxDQUFPZCxHQUFHLEVBQUVDLEdBQUcsS0FBSztFQUM5QyxJQUFJO0lBQ0YsTUFBTSxFQUFFYyxJQUFJLEVBQUVDLE9BQU8sRUFBRUMsS0FBSyxFQUFFQyxLQUFLLEVBQUVDLE9BQU8sRUFBRUMsWUFBWSxFQUFFQyxRQUFRLEVBQUVDLFNBQVMsQ0FBQyxDQUFDLEdBQUd0QixHQUFHLENBQUN1QixJQUFJOztJQUU1RjtJQUNBLElBQUksQ0FBQ1IsSUFBSSxJQUFJLENBQUNDLE9BQU8sSUFBSSxDQUFDQyxLQUFLLEVBQUU7TUFDL0IsT0FBT2hCLEdBQUcsQ0FBQ00sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7UUFDMUJHLE9BQU8sRUFBRSxLQUFLO1FBQ2RDLE9BQU8sRUFBRTtNQUNYLENBQUMsQ0FBQztJQUNKOztJQUVBO0lBQ0EsTUFBTVksY0FBYyxHQUFHLE1BQU1yQixlQUFNLENBQUNzQixPQUFPLENBQUMsRUFBRVYsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNyRCxJQUFJUyxjQUFjLEVBQUU7TUFDbEIsT0FBT3ZCLEdBQUcsQ0FBQ00sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7UUFDMUJHLE9BQU8sRUFBRSxLQUFLO1FBQ2RDLE9BQU8sRUFBRTtNQUNYLENBQUMsQ0FBQztJQUNKOztJQUVBO0lBQ0EsTUFBTWMsU0FBUyxHQUFHLElBQUl2QixlQUFNLENBQUM7TUFDM0JZLElBQUk7TUFDSkMsT0FBTztNQUNQQyxLQUFLO01BQ0xDLEtBQUs7TUFDTEMsT0FBTztNQUNQQyxZQUFZO01BQ1pDLFFBQVEsRUFBRUEsUUFBUSxJQUFJLENBQUM7TUFDdkJDLFNBQVMsRUFBRUEsU0FBUyxJQUFJLENBQUM7TUFDekJLLFNBQVMsRUFBRTNCLEdBQUcsQ0FBQzRCLElBQUksR0FBRzVCLEdBQUcsQ0FBQzRCLElBQUksQ0FBQ0MsRUFBRSxHQUFHO0lBQ3RDLENBQUMsQ0FBQzs7SUFFRixNQUFNSCxTQUFTLENBQUNJLElBQUksQ0FBQyxDQUFDOztJQUV0QixPQUFPN0IsR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztNQUMxQkcsT0FBTyxFQUFFLElBQUk7TUFDYkMsT0FBTyxFQUFFLDBCQUEwQjtNQUNuQ21CLE1BQU0sRUFBRUw7SUFDVixDQUFDLENBQUM7RUFDSixDQUFDLENBQUMsT0FBT2pCLEtBQUssRUFBRTtJQUNkQyxPQUFPLENBQUNELEtBQUssQ0FBQyx3QkFBd0IsRUFBRUEsS0FBSyxDQUFDO0lBQzlDLE9BQU9SLEdBQUcsQ0FBQ00sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7TUFDMUJHLE9BQU8sRUFBRSxLQUFLO01BQ2RDLE9BQU8sRUFBRSx1QkFBdUI7TUFDaENILEtBQUssRUFBRUEsS0FBSyxDQUFDRztJQUNmLENBQUMsQ0FBQztFQUNKO0FBQ0YsQ0FBQzs7QUFFRDtBQUFBQyxPQUFBLENBQUFDLFlBQUEsR0FBQUEsWUFBQSxDQUNPLE1BQU1rQixZQUFZLEdBQUcsTUFBQUEsQ0FBT2hDLEdBQUcsRUFBRUMsR0FBRyxLQUFLO0VBQzlDLElBQUk7SUFDRixNQUFNLEVBQUU0QixFQUFFLENBQUMsQ0FBQyxHQUFHN0IsR0FBRyxDQUFDaUMsTUFBTTtJQUN6QixNQUFNQyxVQUFVLEdBQUdsQyxHQUFHLENBQUN1QixJQUFJOztJQUUzQixNQUFNWSxhQUFhLEdBQUcsTUFBTWhDLGVBQU0sQ0FBQ2lDLGlCQUFpQjtNQUNsRFAsRUFBRTtNQUNGSyxVQUFVO01BQ1YsRUFBRUcsR0FBRyxFQUFFLElBQUksRUFBRUMsYUFBYSxFQUFFLElBQUksQ0FBQztJQUNuQyxDQUFDOztJQUVELElBQUksQ0FBQ0gsYUFBYSxFQUFFO01BQ2xCLE9BQU9sQyxHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO1FBQzFCRyxPQUFPLEVBQUUsS0FBSztRQUNkQyxPQUFPLEVBQUU7TUFDWCxDQUFDLENBQUM7SUFDSjs7SUFFQSxPQUFPWCxHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO01BQzFCRyxPQUFPLEVBQUUsSUFBSTtNQUNiQyxPQUFPLEVBQUUsK0JBQStCO01BQ3hDbUIsTUFBTSxFQUFFSTtJQUNWLENBQUMsQ0FBQztFQUNKLENBQUMsQ0FBQyxPQUFPMUIsS0FBSyxFQUFFO0lBQ2RDLE9BQU8sQ0FBQ0QsS0FBSyxDQUFDLDZCQUE2QixFQUFFQSxLQUFLLENBQUM7SUFDbkQsT0FBT1IsR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztNQUMxQkcsT0FBTyxFQUFFLEtBQUs7TUFDZEMsT0FBTyxFQUFFLDRCQUE0QjtNQUNyQ0gsS0FBSyxFQUFFQSxLQUFLLENBQUNHO0lBQ2YsQ0FBQyxDQUFDO0VBQ0o7QUFDRixDQUFDOztBQUVEO0FBQUFDLE9BQUEsQ0FBQW1CLFlBQUEsR0FBQUEsWUFBQSxDQUNPLE1BQU1PLFlBQVksR0FBRyxNQUFBQSxDQUFPdkMsR0FBRyxFQUFFQyxHQUFHLEtBQUs7RUFDOUMsSUFBSTtJQUNGLE1BQU0sRUFBRTRCLEVBQUUsQ0FBQyxDQUFDLEdBQUc3QixHQUFHLENBQUNpQyxNQUFNOztJQUV6QixNQUFNTyxhQUFhLEdBQUcsTUFBTXJDLGVBQU0sQ0FBQ3NDLGlCQUFpQixDQUFDWixFQUFFLENBQUM7O0lBRXhELElBQUksQ0FBQ1csYUFBYSxFQUFFO01BQ2xCLE9BQU92QyxHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO1FBQzFCRyxPQUFPLEVBQUUsS0FBSztRQUNkQyxPQUFPLEVBQUU7TUFDWCxDQUFDLENBQUM7SUFDSjs7SUFFQSxPQUFPWCxHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO01BQzFCRyxPQUFPLEVBQUUsSUFBSTtNQUNiQyxPQUFPLEVBQUU7SUFDWCxDQUFDLENBQUM7RUFDSixDQUFDLENBQUMsT0FBT0gsS0FBSyxFQUFFO0lBQ2RDLE9BQU8sQ0FBQ0QsS0FBSyxDQUFDLHdCQUF3QixFQUFFQSxLQUFLLENBQUM7SUFDOUMsT0FBT1IsR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztNQUMxQkcsT0FBTyxFQUFFLEtBQUs7TUFDZEMsT0FBTyxFQUFFLHVCQUF1QjtNQUNoQ0gsS0FBSyxFQUFFQSxLQUFLLENBQUNHO0lBQ2YsQ0FBQyxDQUFDO0VBQ0o7QUFDRixDQUFDOztBQUVEO0FBQUFDLE9BQUEsQ0FBQTBCLFlBQUEsR0FBQUEsWUFBQSxDQUNPLE1BQU1HLGFBQWEsR0FBRyxNQUFBQSxDQUFPMUMsR0FBRyxFQUFFQyxHQUFHLEtBQUs7RUFDL0MsSUFBSTtJQUNGLE1BQU0sRUFBRTRCLEVBQUUsQ0FBQyxDQUFDLEdBQUc3QixHQUFHLENBQUNpQyxNQUFNOztJQUV6QixNQUFNRixNQUFNLEdBQUcsTUFBTTVCLGVBQU0sQ0FBQ3dDLFFBQVEsQ0FBQ2QsRUFBRSxDQUFDOztJQUV4QyxJQUFJLENBQUNFLE1BQU0sRUFBRTtNQUNYLE9BQU85QixHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO1FBQzFCRyxPQUFPLEVBQUUsS0FBSztRQUNkQyxPQUFPLEVBQUU7TUFDWCxDQUFDLENBQUM7SUFDSjs7SUFFQSxPQUFPWCxHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO01BQzFCRyxPQUFPLEVBQUUsSUFBSTtNQUNib0I7SUFDRixDQUFDLENBQUM7RUFDSixDQUFDLENBQUMsT0FBT3RCLEtBQUssRUFBRTtJQUNkQyxPQUFPLENBQUNELEtBQUssQ0FBQyxrQ0FBa0MsRUFBRUEsS0FBSyxDQUFDO0lBQ3hELE9BQU9SLEdBQUcsQ0FBQ00sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7TUFDMUJHLE9BQU8sRUFBRSxLQUFLO01BQ2RDLE9BQU8sRUFBRSxpQ0FBaUM7TUFDMUNILEtBQUssRUFBRUEsS0FBSyxDQUFDRztJQUNmLENBQUMsQ0FBQztFQUNKO0FBQ0YsQ0FBQzs7QUFFRDtBQUFBQyxPQUFBLENBQUE2QixhQUFBLEdBQUFBLGFBQUEsQ0FDTyxNQUFNRSxjQUFjLEdBQUcsTUFBQUEsQ0FBTzVDLEdBQUcsRUFBRUMsR0FBRyxLQUFLO0VBQ2hELElBQUk7SUFDRixNQUFNLEVBQUU0QyxLQUFLLENBQUMsQ0FBQyxHQUFHN0MsR0FBRyxDQUFDNkMsS0FBSzs7SUFFM0IsSUFBSSxDQUFDQSxLQUFLLEVBQUU7TUFDVixPQUFPNUMsR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztRQUMxQkcsT0FBTyxFQUFFLEtBQUs7UUFDZEMsT0FBTyxFQUFFO01BQ1gsQ0FBQyxDQUFDO0lBQ0o7O0lBRUE7SUFDQSxNQUFNVixRQUFRLEdBQUcsTUFBTUMsZUFBTSxDQUFDQyxJQUFJLENBQUM7TUFDakMwQyxHQUFHLEVBQUU7TUFDSCxFQUFFL0IsSUFBSSxFQUFFLEVBQUVnQyxNQUFNLEVBQUVGLEtBQUssRUFBRUcsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUMxQyxFQUFFaEMsT0FBTyxFQUFFLEVBQUUrQixNQUFNLEVBQUVGLEtBQUssRUFBRUcsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7SUFFakQsQ0FBQyxDQUFDLENBQUMzQyxJQUFJLENBQUMsRUFBRUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7SUFFMUIsT0FBT0wsR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQ04sUUFBUSxDQUFDO0VBQ3ZDLENBQUMsQ0FBQyxPQUFPTyxLQUFLLEVBQUU7SUFDZEMsT0FBTyxDQUFDRCxLQUFLLENBQUMsNkJBQTZCLEVBQUVBLEtBQUssQ0FBQztJQUNuRCxPQUFPUixHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO01BQzFCRyxPQUFPLEVBQUUsS0FBSztNQUNkQyxPQUFPLEVBQUUsNEJBQTRCO01BQ3JDSCxLQUFLLEVBQUVBLEtBQUssQ0FBQ0c7SUFDZixDQUFDLENBQUM7RUFDSjtBQUNGLENBQUM7O0FBRUQ7QUFBQUMsT0FBQSxDQUFBK0IsY0FBQSxHQUFBQSxjQUFBLENBQ0EsTUFBTUssaUJBQWlCLEdBQUdBLENBQUNDLElBQUksRUFBRUMsSUFBSSxFQUFFQyxJQUFJLEVBQUVDLElBQUksS0FBSztFQUNwRCxNQUFNQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7RUFDaEIsTUFBTUMsSUFBSSxHQUFHLENBQUNILElBQUksR0FBR0YsSUFBSSxLQUFLTSxJQUFJLENBQUNDLEVBQUUsR0FBRyxHQUFHLENBQUM7RUFDNUMsTUFBTUMsSUFBSSxHQUFHLENBQUNMLElBQUksR0FBR0YsSUFBSSxLQUFLSyxJQUFJLENBQUNDLEVBQUUsR0FBRyxHQUFHLENBQUM7RUFDNUMsTUFBTUUsQ0FBQztFQUNMSCxJQUFJLENBQUNJLEdBQUcsQ0FBQ0wsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHQyxJQUFJLENBQUNJLEdBQUcsQ0FBQ0wsSUFBSSxHQUFHLENBQUMsQ0FBQztFQUN2Q0MsSUFBSSxDQUFDSyxHQUFHLENBQUNYLElBQUksSUFBSU0sSUFBSSxDQUFDQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBR0QsSUFBSSxDQUFDSyxHQUFHLENBQUNULElBQUksSUFBSUksSUFBSSxDQUFDQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUM7RUFDbkVELElBQUksQ0FBQ0ksR0FBRyxDQUFDRixJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUdGLElBQUksQ0FBQ0ksR0FBRyxDQUFDRixJQUFJLEdBQUcsQ0FBQyxDQUFDO0VBQ3pDLE1BQU1JLENBQUMsR0FBRyxDQUFDLEdBQUdOLElBQUksQ0FBQ08sS0FBSyxDQUFDUCxJQUFJLENBQUNRLElBQUksQ0FBQ0wsQ0FBQyxDQUFDLEVBQUVILElBQUksQ0FBQ1EsSUFBSSxDQUFDLENBQUMsR0FBR0wsQ0FBQyxDQUFDLENBQUM7RUFDeEQsT0FBT0wsQ0FBQyxHQUFHUSxDQUFDLENBQUMsQ0FBQztBQUNoQixDQUFDOztBQUVEO0FBQ08sTUFBTUcsaUJBQWlCLEdBQUcsTUFBQUEsQ0FBT2pFLEdBQUcsRUFBRUMsR0FBRyxLQUFLO0VBQ25ELElBQUk7SUFDRixNQUFNLEVBQUVvQixRQUFRLEVBQUVDLFNBQVMsQ0FBQyxDQUFDLEdBQUd0QixHQUFHLENBQUM2QyxLQUFLOztJQUV6QztJQUNBLElBQUksQ0FBQ3hCLFFBQVEsSUFBSSxDQUFDQyxTQUFTLEVBQUU7TUFDM0IsT0FBT3JCLEdBQUcsQ0FBQ00sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7UUFDMUJHLE9BQU8sRUFBRSxLQUFLO1FBQ2RDLE9BQU8sRUFBRTtNQUNYLENBQUMsQ0FBQztJQUNKOztJQUVBO0lBQ0EsTUFBTXNELEdBQUcsR0FBR0MsVUFBVSxDQUFDOUMsUUFBUSxDQUFDO0lBQ2hDLE1BQU0rQyxHQUFHLEdBQUdELFVBQVUsQ0FBQzdDLFNBQVMsQ0FBQzs7SUFFakM7SUFDQSxNQUFNcEIsUUFBUSxHQUFHLE1BQU1DLGVBQU0sQ0FBQ0MsSUFBSSxDQUFDLEVBQUVpRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzs7SUFFdEQsSUFBSW5FLFFBQVEsQ0FBQ29FLE1BQU0sS0FBSyxDQUFDLEVBQUU7TUFDekIsT0FBT3JFLEdBQUcsQ0FBQ00sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7UUFDMUJHLE9BQU8sRUFBRSxLQUFLO1FBQ2RDLE9BQU8sRUFBRTtNQUNYLENBQUMsQ0FBQztJQUNKOztJQUVBO0lBQ0EsTUFBTTJELG9CQUFvQixHQUFHckUsUUFBUSxDQUFDc0UsR0FBRyxDQUFDLENBQUF6QyxNQUFNLEtBQUk7TUFDbEQsTUFBTTBDLFFBQVEsR0FBR3hCLGlCQUFpQjtRQUNoQ2lCLEdBQUc7UUFDSEUsR0FBRztRQUNIckMsTUFBTSxDQUFDVixRQUFRLElBQUksQ0FBQztRQUNwQlUsTUFBTSxDQUFDVCxTQUFTLElBQUk7TUFDdEIsQ0FBQzs7TUFFRCxPQUFPO1FBQ0xvRCxHQUFHLEVBQUUzQyxNQUFNLENBQUMyQyxHQUFHO1FBQ2YzRCxJQUFJLEVBQUVnQixNQUFNLENBQUNoQixJQUFJO1FBQ2pCQyxPQUFPLEVBQUVlLE1BQU0sQ0FBQ2YsT0FBTztRQUN2QkMsS0FBSyxFQUFFYyxNQUFNLENBQUNkLEtBQUs7UUFDbkJJLFFBQVEsRUFBRVUsTUFBTSxDQUFDVixRQUFRO1FBQ3pCQyxTQUFTLEVBQUVTLE1BQU0sQ0FBQ1QsU0FBUztRQUMzQm1ELFFBQVEsRUFBRUEsUUFBUSxDQUFDO01BQ3JCLENBQUM7SUFDSCxDQUFDLENBQUM7O0lBRUY7SUFDQUYsb0JBQW9CLENBQUNsRSxJQUFJLENBQUMsQ0FBQ3NELENBQUMsRUFBRWdCLENBQUMsS0FBS2hCLENBQUMsQ0FBQ2MsUUFBUSxHQUFHRSxDQUFDLENBQUNGLFFBQVEsQ0FBQzs7SUFFNUQ7SUFDQSxPQUFPeEUsR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztNQUMxQkcsT0FBTyxFQUFFLElBQUk7TUFDYmlFLGFBQWEsRUFBRUwsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO01BQ3RDTSxXQUFXLEVBQUVOO0lBQ2YsQ0FBQyxDQUFDO0VBQ0osQ0FBQyxDQUFDLE9BQU85RCxLQUFLLEVBQUU7SUFDZEMsT0FBTyxDQUFDRCxLQUFLLENBQUMsaUNBQWlDLEVBQUVBLEtBQUssQ0FBQztJQUN2RCxPQUFPUixHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO01BQzFCRyxPQUFPLEVBQUUsS0FBSztNQUNkQyxPQUFPLEVBQUUsZ0NBQWdDO01BQ3pDSCxLQUFLLEVBQUVBLEtBQUssQ0FBQ0c7SUFDZixDQUFDLENBQUM7RUFDSjtBQUNGLENBQUM7O0FBRUQ7QUFBQUMsT0FBQSxDQUFBb0QsaUJBQUEsR0FBQUEsaUJBQUEsQ0FDTyxNQUFNYSxxQkFBcUIsR0FBRyxNQUFBQSxDQUFPOUUsR0FBRyxFQUFFQyxHQUFHLEtBQUs7RUFDdkQsSUFBSTtJQUNGLE1BQU0sRUFBRWUsT0FBTyxFQUFFSyxRQUFRLEVBQUVDLFNBQVMsRUFBRXlELGdCQUFnQixDQUFDLENBQUMsR0FBRy9FLEdBQUcsQ0FBQ3VCLElBQUk7O0lBRW5FLElBQUksQ0FBQ1AsT0FBTyxFQUFFO01BQ1osT0FBT2YsR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztRQUMxQkcsT0FBTyxFQUFFLEtBQUs7UUFDZEMsT0FBTyxFQUFFO01BQ1gsQ0FBQyxDQUFDO0lBQ0o7O0lBRUE7SUFDQSxJQUFJbUUsZ0JBQWdCLEVBQUU7TUFDcEIsSUFBSTtRQUNGLE1BQU1DLGNBQWMsR0FBRyxNQUFNN0UsZUFBTSxDQUFDd0MsUUFBUSxDQUFDb0MsZ0JBQWdCLENBQUM7O1FBRTlELElBQUksQ0FBQ0MsY0FBYyxFQUFFO1VBQ25CLE9BQU8vRSxHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO1lBQzFCRyxPQUFPLEVBQUUsS0FBSztZQUNkQyxPQUFPLEVBQUU7VUFDWCxDQUFDLENBQUM7UUFDSjs7UUFFQTtRQUNBLElBQUk2RCxRQUFRLEdBQUcsSUFBSTtRQUNuQixJQUFJcEQsUUFBUSxJQUFJQyxTQUFTLElBQUkwRCxjQUFjLENBQUMzRCxRQUFRLElBQUkyRCxjQUFjLENBQUMxRCxTQUFTLEVBQUU7VUFDaEZtRCxRQUFRLEdBQUd4QixpQkFBaUI7WUFDMUJrQixVQUFVLENBQUM5QyxRQUFRLENBQUM7WUFDcEI4QyxVQUFVLENBQUM3QyxTQUFTLENBQUM7WUFDckIwRCxjQUFjLENBQUMzRCxRQUFRO1lBQ3ZCMkQsY0FBYyxDQUFDMUQ7VUFDakIsQ0FBQztRQUNIOztRQUVBLE9BQU9yQixHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO1VBQzFCRyxPQUFPLEVBQUUsSUFBSTtVQUNic0UsY0FBYyxFQUFFRCxjQUFjO1VBQzlCUCxRQUFRLEVBQUVBLFFBQVE7VUFDbEJTLE1BQU0sRUFBRSxlQUFlO1VBQ3ZCQyxJQUFJLEVBQUVWLFFBQVEsR0FBRyxJQUFJLEdBQUc7UUFDMUIsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDLE9BQU9oRSxLQUFLLEVBQUU7UUFDZEMsT0FBTyxDQUFDRCxLQUFLLENBQUMsZ0NBQWdDLEVBQUVBLEtBQUssQ0FBQztRQUN0RDtNQUNGO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJWSxRQUFRLElBQUlDLFNBQVMsRUFBRTtNQUN6QixNQUFNNEMsR0FBRyxHQUFHQyxVQUFVLENBQUM5QyxRQUFRLENBQUM7TUFDaEMsTUFBTStDLEdBQUcsR0FBR0QsVUFBVSxDQUFDN0MsU0FBUyxDQUFDOztNQUVqQztNQUNBLE1BQU1wQixRQUFRLEdBQUcsTUFBTUMsZUFBTSxDQUFDQyxJQUFJLENBQUMsRUFBRWlFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDOztNQUV0RCxJQUFJbkUsUUFBUSxDQUFDb0UsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN6QixPQUFPckUsR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztVQUMxQkcsT0FBTyxFQUFFLEtBQUs7VUFDZEMsT0FBTyxFQUFFO1FBQ1gsQ0FBQyxDQUFDO01BQ0o7O01BRUE7TUFDQSxJQUFJZ0UsYUFBYSxHQUFHLElBQUk7TUFDeEIsSUFBSVEsZ0JBQWdCLEdBQUdDLFFBQVE7O01BRS9CLEtBQUssTUFBTXRELE1BQU0sSUFBSTdCLFFBQVEsRUFBRTtRQUM3QixNQUFNdUUsUUFBUSxHQUFHeEIsaUJBQWlCO1VBQ2hDaUIsR0FBRztVQUNIRSxHQUFHO1VBQ0hyQyxNQUFNLENBQUNWLFFBQVEsSUFBSSxDQUFDO1VBQ3BCVSxNQUFNLENBQUNULFNBQVMsSUFBSTtRQUN0QixDQUFDOztRQUVELElBQUltRCxRQUFRLEdBQUdXLGdCQUFnQixFQUFFO1VBQy9CQSxnQkFBZ0IsR0FBR1gsUUFBUTtVQUMzQkcsYUFBYSxHQUFHN0MsTUFBTTtRQUN4QjtNQUNGOztNQUVBO01BQ0EsTUFBTXdDLG9CQUFvQixHQUFHckUsUUFBUSxDQUFDc0UsR0FBRyxDQUFDLENBQUF6QyxNQUFNLEtBQUk7UUFDbEQsTUFBTTBDLFFBQVEsR0FBR3hCLGlCQUFpQjtVQUNoQ2lCLEdBQUc7VUFDSEUsR0FBRztVQUNIckMsTUFBTSxDQUFDVixRQUFRLElBQUksQ0FBQztVQUNwQlUsTUFBTSxDQUFDVCxTQUFTLElBQUk7UUFDdEIsQ0FBQzs7UUFFRCxPQUFPO1VBQ0wsR0FBR1MsTUFBTSxDQUFDdUQsUUFBUSxDQUFDLENBQUM7VUFDcEJiLFFBQVEsRUFBRUE7UUFDWixDQUFDO01BQ0gsQ0FBQyxDQUFDLENBQUNwRSxJQUFJLENBQUMsQ0FBQ3NELENBQUMsRUFBRWdCLENBQUMsS0FBS2hCLENBQUMsQ0FBQ2MsUUFBUSxHQUFHRSxDQUFDLENBQUNGLFFBQVEsQ0FBQzs7TUFFMUMsT0FBT3hFLEdBQUcsQ0FBQ00sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7UUFDMUJHLE9BQU8sRUFBRSxJQUFJO1FBQ2JzRSxjQUFjLEVBQUVMLGFBQWE7UUFDN0JDLFdBQVcsRUFBRU4sb0JBQW9CO1FBQ2pDRSxRQUFRLEVBQUVXLGdCQUFnQjtRQUMxQkQsSUFBSSxFQUFFLElBQUk7UUFDVkQsTUFBTSxFQUFFO01BQ1YsQ0FBQyxDQUFDO0lBQ0o7O0lBRUE7SUFDQTtJQUNBLE1BQU1LLGdCQUFnQixHQUFHdkUsT0FBTyxDQUFDd0UsV0FBVyxDQUFDLENBQUM7O0lBRTlDO0lBQ0EsTUFBTXRGLFFBQVEsR0FBRyxNQUFNQyxlQUFNLENBQUNDLElBQUksQ0FBQyxFQUFFaUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7O0lBRXRELElBQUluRSxRQUFRLENBQUNvRSxNQUFNLEtBQUssQ0FBQyxFQUFFO01BQ3pCLE9BQU9yRSxHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO1FBQzFCRyxPQUFPLEVBQUUsS0FBSztRQUNkQyxPQUFPLEVBQUU7TUFDWCxDQUFDLENBQUM7SUFDSjs7SUFFQTtJQUNBLE1BQU02RSxjQUFjLEdBQUc7TUFDckJDLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQztNQUN4VEMsT0FBTyxFQUFFLENBQUMsV0FBVyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUM7TUFDelBDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsUUFBUTtJQUMvUCxDQUFDOztJQUVEO0lBQ0EsTUFBTUMsaUJBQWlCLEdBQUc7TUFDeEIsV0FBVyxFQUFFLENBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDO01BQ2hHLFNBQVMsRUFBRSxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLFVBQVU7SUFDbkksQ0FBQzs7SUFFRDtJQUNBLElBQUlDLE1BQU0sR0FBRyxJQUFJO0lBQ2pCLEtBQUssTUFBTSxDQUFDQyxHQUFHLEVBQUVDLFFBQVEsQ0FBQyxJQUFJQyxNQUFNLENBQUNDLE9BQU8sQ0FBQ1QsY0FBYyxDQUFDLEVBQUU7TUFDNUQsSUFBSU8sUUFBUSxDQUFDRyxJQUFJLENBQUMsQ0FBQUMsT0FBTyxLQUFJYixnQkFBZ0IsQ0FBQ2MsUUFBUSxDQUFDRCxPQUFPLENBQUMsQ0FBQyxFQUFFO1FBQ2hFTixNQUFNLEdBQUdDLEdBQUc7UUFDWjtNQUNGO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJZCxjQUFjLEdBQUcvRSxRQUFRLENBQUMsQ0FBQyxDQUFDOztJQUVoQztJQUNBLElBQUlvRyxxQkFBcUIsR0FBRyxLQUFLO0lBQ2pDLEtBQUssTUFBTSxDQUFDQyxRQUFRLEVBQUVQLFFBQVEsQ0FBQyxJQUFJQyxNQUFNLENBQUNDLE9BQU8sQ0FBQ0wsaUJBQWlCLENBQUMsRUFBRTtNQUNwRSxJQUFJRyxRQUFRLENBQUNHLElBQUksQ0FBQyxDQUFBQyxPQUFPLEtBQUliLGdCQUFnQixDQUFDYyxRQUFRLENBQUNELE9BQU8sQ0FBQyxDQUFDLEVBQUU7UUFDaEU7UUFDQSxNQUFNSSxjQUFjLEdBQUd0RyxRQUFRLENBQUNFLElBQUksQ0FBQyxDQUFBMkIsTUFBTTtRQUN6Q0EsTUFBTSxDQUFDaEIsSUFBSSxDQUFDeUUsV0FBVyxDQUFDLENBQUMsQ0FBQ2EsUUFBUSxDQUFDRSxRQUFRLENBQUM7UUFDNUN4RSxNQUFNLENBQUNmLE9BQU8sQ0FBQ3dFLFdBQVcsQ0FBQyxDQUFDLENBQUNhLFFBQVEsQ0FBQ0UsUUFBUTtRQUNoRCxDQUFDOztRQUVELElBQUlDLGNBQWMsRUFBRTtVQUNsQnZCLGNBQWMsR0FBR3VCLGNBQWM7VUFDL0JGLHFCQUFxQixHQUFHLElBQUk7VUFDNUI7UUFDRjtNQUNGO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJLENBQUNBLHFCQUFxQixJQUFJUixNQUFNLEVBQUU7TUFDcEMsSUFBSUEsTUFBTSxLQUFLLE9BQU8sSUFBSTVGLFFBQVEsQ0FBQ29FLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDN0M7UUFDQSxNQUFNbUMsV0FBVyxHQUFHdkcsUUFBUSxDQUFDRSxJQUFJLENBQUMsQ0FBQTJCLE1BQU07UUFDdENBLE1BQU0sQ0FBQ2hCLElBQUksQ0FBQ3lFLFdBQVcsQ0FBQyxDQUFDLENBQUNhLFFBQVEsQ0FBQyxRQUFRLENBQUM7UUFDNUN0RSxNQUFNLENBQUNmLE9BQU8sQ0FBQ3dFLFdBQVcsQ0FBQyxDQUFDLENBQUNhLFFBQVEsQ0FBQyxRQUFRO1FBQ2hELENBQUM7UUFDRCxJQUFJSSxXQUFXLEVBQUV4QixjQUFjLEdBQUd3QixXQUFXO01BQy9DLENBQUMsTUFBTSxJQUFJWCxNQUFNLEtBQUssT0FBTyxJQUFJNUYsUUFBUSxDQUFDb0UsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUNwRDtRQUNBLE1BQU1vQyxXQUFXLEdBQUd4RyxRQUFRLENBQUNFLElBQUksQ0FBQyxDQUFBMkIsTUFBTTtRQUN0Q0EsTUFBTSxDQUFDaEIsSUFBSSxDQUFDeUUsV0FBVyxDQUFDLENBQUMsQ0FBQ2EsUUFBUSxDQUFDLGFBQWEsQ0FBQztRQUNqRHRFLE1BQU0sQ0FBQ2hCLElBQUksQ0FBQ3lFLFdBQVcsQ0FBQyxDQUFDLENBQUNhLFFBQVEsQ0FBQyxTQUFTLENBQUM7UUFDN0N0RSxNQUFNLENBQUNmLE9BQU8sQ0FBQ3dFLFdBQVcsQ0FBQyxDQUFDLENBQUNhLFFBQVEsQ0FBQyxhQUFhLENBQUM7UUFDcER0RSxNQUFNLENBQUNmLE9BQU8sQ0FBQ3dFLFdBQVcsQ0FBQyxDQUFDLENBQUNhLFFBQVEsQ0FBQyxTQUFTO1FBQ2pELENBQUM7UUFDRCxJQUFJSyxXQUFXLEVBQUV6QixjQUFjLEdBQUd5QixXQUFXO01BQy9DLENBQUMsTUFBTSxJQUFJWixNQUFNLEtBQUssU0FBUyxJQUFJNUYsUUFBUSxDQUFDb0UsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUN0RDtRQUNBLE1BQU1xQyxhQUFhLEdBQUd6RyxRQUFRLENBQUNFLElBQUksQ0FBQyxDQUFBMkIsTUFBTTtRQUN4Q0EsTUFBTSxDQUFDaEIsSUFBSSxDQUFDeUUsV0FBVyxDQUFDLENBQUMsQ0FBQ2EsUUFBUSxDQUFDLFNBQVMsQ0FBQztRQUM3Q3RFLE1BQU0sQ0FBQ2YsT0FBTyxDQUFDd0UsV0FBVyxDQUFDLENBQUMsQ0FBQ2EsUUFBUSxDQUFDLFNBQVM7UUFDakQsQ0FBQztRQUNELElBQUlNLGFBQWEsRUFBRTFCLGNBQWMsR0FBRzBCLGFBQWE7TUFDbkQ7SUFDRjs7SUFFQSxPQUFPMUcsR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztNQUMxQkcsT0FBTyxFQUFFLElBQUk7TUFDYnNFLGNBQWM7TUFDZEosV0FBVyxFQUFFM0UsUUFBUTtNQUNyQmdGLE1BQU0sRUFBRW9CLHFCQUFxQixHQUFHLG1CQUFtQixHQUFHLGVBQWU7TUFDckVNLGNBQWMsRUFBRWQ7SUFDbEIsQ0FBQyxDQUFDO0VBQ0osQ0FBQyxDQUFDLE9BQU9yRixLQUFLLEVBQUU7SUFDZEMsT0FBTyxDQUFDRCxLQUFLLENBQUMsOEJBQThCLEVBQUVBLEtBQUssQ0FBQztJQUNwRCxPQUFPUixHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO01BQzFCRyxPQUFPLEVBQUUsS0FBSztNQUNkQyxPQUFPLEVBQUUsNkJBQTZCO01BQ3RDSCxLQUFLLEVBQUVBLEtBQUssQ0FBQ0c7SUFDZixDQUFDLENBQUM7RUFDSjtBQUNGLENBQUM7O0FBRUQ7QUFBQUMsT0FBQSxDQUFBaUUscUJBQUEsR0FBQUEscUJBQUEsQ0FDTyxNQUFNK0Isa0JBQWtCLEdBQUcsTUFBQUEsQ0FBTzdHLEdBQUcsRUFBRUMsR0FBRyxLQUFLO0VBQ3BELElBQUk7SUFDRjtJQUNBLE1BQU02RyxNQUFNLEdBQUc5RyxHQUFHLENBQUM0QixJQUFJLEVBQUVDLEVBQUU7O0lBRTNCLElBQUksQ0FBQ2lGLE1BQU0sRUFBRTtNQUNYLE9BQU83RyxHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO1FBQzFCRyxPQUFPLEVBQUUsS0FBSztRQUNkQyxPQUFPLEVBQUU7TUFDWCxDQUFDLENBQUM7SUFDSjs7SUFFQTtJQUNBLE1BQU1PLE9BQU8sR0FBRyxNQUFNNEYsbUJBQUssQ0FBQ3BFLFFBQVEsQ0FBQ21FLE1BQU0sQ0FBQzs7SUFFNUMsSUFBSSxDQUFDM0YsT0FBTyxFQUFFO01BQ1osT0FBT2xCLEdBQUcsQ0FBQ00sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7UUFDMUJHLE9BQU8sRUFBRSxLQUFLO1FBQ2RDLE9BQU8sRUFBRTtNQUNYLENBQUMsQ0FBQztJQUNKOztJQUVBO0lBQ0EsSUFBSU8sT0FBTyxDQUFDNkYsSUFBSSxLQUFLLFNBQVMsRUFBRTtNQUM5QixPQUFPL0csR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztRQUMxQkcsT0FBTyxFQUFFLEtBQUs7UUFDZEMsT0FBTyxFQUFFO01BQ1gsQ0FBQyxDQUFDO0lBQ0o7O0lBRUE7SUFDQSxJQUFJLENBQUNPLE9BQU8sQ0FBQzhGLFFBQVEsRUFBRTtNQUNyQixPQUFPaEgsR0FBRyxDQUFDTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztRQUMxQkcsT0FBTyxFQUFFLEtBQUs7UUFDZEMsT0FBTyxFQUFFO01BQ1gsQ0FBQyxDQUFDO0lBQ0o7O0lBRUE7SUFDQSxNQUFNbUIsTUFBTSxHQUFHLE1BQU01QixlQUFNLENBQUN3QyxRQUFRLENBQUN4QixPQUFPLENBQUM4RixRQUFRLENBQUM7O0lBRXRELElBQUksQ0FBQ2xGLE1BQU0sRUFBRTtNQUNYLE9BQU85QixHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO1FBQzFCRyxPQUFPLEVBQUUsS0FBSztRQUNkQyxPQUFPLEVBQUU7TUFDWCxDQUFDLENBQUM7SUFDSjs7SUFFQSxPQUFPWCxHQUFHLENBQUNNLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO01BQzFCRyxPQUFPLEVBQUUsSUFBSTtNQUNib0I7SUFDRixDQUFDLENBQUM7RUFDSixDQUFDLENBQUMsT0FBT3RCLEtBQUssRUFBRTtJQUNkQyxPQUFPLENBQUNELEtBQUssQ0FBQyxvQ0FBb0MsRUFBRUEsS0FBSyxDQUFDO0lBQzFELE9BQU9SLEdBQUcsQ0FBQ00sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7TUFDMUJHLE9BQU8sRUFBRSxLQUFLO01BQ2RDLE9BQU8sRUFBRSxtQ0FBbUM7TUFDNUNILEtBQUssRUFBRUEsS0FBSyxDQUFDRztJQUNmLENBQUMsQ0FBQztFQUNKO0FBQ0YsQ0FBQyxDQUFDQyxPQUFBLENBQUFnRyxrQkFBQSxHQUFBQSxrQkFBQSIsImlnbm9yZUxpc3QiOltdfQ==