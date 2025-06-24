/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Button, Dialog, InputText } from "primereact";
import {  toast } from "sonner";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Dropdown } from "primereact/dropdown";
import Pagination from "../../utils/Paginator";
import * as brandsApi from "../../api/brandsApi";
import { getAllBranches } from "../../api/branchesApi";

const Brands = () => {
  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const [currentBrand, setCurrentBrand] = useState(null);
  const [userRole, setUserRole] = useState("manager"); // Default to manager
  const [branches, setBranches] = useState([]);
  const [userBranchId, setUserBranchId] = useState("");
  const [branchNames, setBranchNames] = useState({}); // Store branch names by ID
  const [selectedBranchFilter, setSelectedBranchFilter] = useState(null); // For filtering brands by branch
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    logo: "",
    description: "",
    website: "",
    country: "Việt Nam",
    status: "active",
    branchId: "",
  });

  // Pagination states
  const [first, setFirst] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Get user info from localStorage once on component mount
  useEffect(() => {
    // Get user role and branch ID from localStorage
    const role = localStorage.getItem("userRole");
    const branchId = localStorage.getItem("userBranchId");

    console.log("Initial load - role:", role, "branchId:", branchId);

    if (role) {
      setUserRole(role);
      if (branchId) {
        console.log("Setting user branch ID:", branchId);
        setUserBranchId(branchId);
        // Set default branch ID for manager
        if (role === "manager") {
          setFormData((prev) => ({
            ...prev,
            branchId: branchId,
          }));
        }
      }
    }

    // Fetch branches data on component mount
    fetchBranches();
    // Brands will be fetched by the userRole/userBranchId effect
  }, []);

  // Fetch branches for dropdown
  const fetchBranches = async () => {
    try {
      const data = await getAllBranches();
      if (Array.isArray(data) && data.length > 0) {
        setBranches(data);

        // Create a mapping of branch IDs to names for efficient lookup
        const nameMap = {};
        data.forEach((branch) => {
          if (branch && branch._id) {
            nameMap[branch._id] = branch.name;
          }
        });
        console.log("Branch names mapping:", nameMap);
        setBranchNames(nameMap);

        // If user is manager and userBranchId is not set, try to find it
        const role = localStorage.getItem("userRole");
        let branchId = localStorage.getItem("userBranchId");

        if (role === "manager") {
          // If no branch ID in localStorage, try to find it
          if (!branchId) {
            const userId = localStorage.getItem("userId");

            // First try to find branch by manager ID
            if (userId) {
              const userBranch = data.find(
                (branch) => branch.managers && branch.managers.includes(userId)
              );

              if (userBranch && userBranch._id) {
                branchId = userBranch._id;
                
                localStorage.setItem("userBranchId", branchId);
                setUserBranchId(branchId);
              }
            }

            // If still no branch ID found, use the first available branch for managers
            if (!branchId && data.length > 0) {
              branchId = data[0]._id;
              
              localStorage.setItem("userBranchId", branchId);
              setUserBranchId(branchId);
            }
          }

          // Always set branch ID for managers
          console.log("Setting form branch ID for manager:", branchId);
          setFormData((prev) => ({
            ...prev,
            branchId: branchId || "",
          }));
        }
      } else {
        console.error(
          "Branches data is not in expected format or empty:",
          data
        );
        setBranches([]);
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      setBranches([]);
    }
  };

  // Update brands when role or branch changes
  useEffect(() => {
    if (userRole && (userRole === "admin" || userBranchId)) {
      console.log("Role or branch changed, refetching brands");
      fetchBrands();
    }
  }, [userRole, userBranchId]);

  // Update form data when branch names are loaded (for manager view)
  useEffect(() => {
    if (
      userRole === "manager" &&
      userBranchId &&
      Object.keys(branchNames).length > 0
    ) {
      console.log(
        "Branch names loaded, ensuring manager's branch is set:",
        userBranchId
      );
      setFormData((prev) => ({
        ...prev,
        branchId: userBranchId,
      }));
    }
  }, [branchNames, userBranchId, userRole]);

  useEffect(() => {
    // Filter brands based on search term
    const filtered = brands.filter((brand) =>
      searchTerm
        ? brand?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          brand?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          brand?.country?.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

    setFilteredBrands(filtered);
    setFirst(0);
  }, [brands, searchTerm]);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching brands with filter:", selectedBranchFilter);
      const data = await brandsApi.getAllBrands();

      if (Array.isArray(data)) {
        // For manager role, filter brands by their branch
        if (userRole === "manager" && userBranchId) {
          console.log(
            "Filtering brands for manager with branch ID:",
            userBranchId
          );
          const filteredData = data.filter((brand) => {
            const brandBranchId = brand.branchId?._id || brand.branchId;
            return brandBranchId === userBranchId;
          });
          console.log(
            "Filtered brands count:",
            filteredData.length,
            "of",
            data.length
          );
          setBrands(filteredData);
        } 
        // For admin with branch filter
        else if (userRole === "admin" && selectedBranchFilter) {
          console.log(
            "Filtering brands for admin with branch filter:",
            selectedBranchFilter
          );
          const filteredData = data.filter((brand) => {
            const brandBranchId = brand.branchId?._id || brand.branchId;
            return brandBranchId === selectedBranchFilter;
          });
          console.log(
            "Filtered brands count:",
            filteredData.length,
            "of",
            data.length
          );
          setBrands(filteredData);
        }
        else {
          // For admin showing all brands
          console.log("Showing all brands for admin:", data.length);
          setBrands(data);
        }
      } else {
        console.error("Data is not in expected format:", data);
        setBrands([]);
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error);
      setBrands([]);
      toast.error("Không thể tải danh sách thương hiệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Hàm tạo mã thương hiệu từ tên
  const generateCodeFromName = () => {
    if (formData.name && formData.name.trim() !== "") {
      // Lấy chữ cái đầu của mỗi từ trong tên thương hiệu
      const words = formData.name
        .split(" ")
        .filter((word) => word.trim() !== "");
      let generatedCode = "";

      // Đảm bảo words không rỗng
      if (words.length === 0) {
        toast.warning("Tên thương hiệu không hợp lệ!");
        return;
      }

      // Lấy chữ cái đầu của mỗi từ
      for (let i = 0; i < Math.min(words.length, 4); i++) {
        if (words[i] && words[i].length > 0 && words[i][0]) {
          generatedCode += words[i][0].toUpperCase();
        }
      }

      // Nếu code có ít hơn 4 ký tự, thêm chữ cái từ từ đầu tiên
      while (generatedCode.length < 4) {
        const firstWord = words[0] || "";
        if (
          firstWord.length > generatedCode.length - 1 &&
          firstWord[generatedCode.length]
        ) {
          generatedCode += firstWord[generatedCode.length].toUpperCase();
        } else {
          // Nếu từ đầu tiên không đủ ký tự, thêm số ngẫu nhiên
          generatedCode += Math.floor(Math.random() * 10).toString();
        }
      }

      setFormData({
        ...formData,
        code: generatedCode,
      });
    } else {
      toast.warning("Vui lòng nhập tên thương hiệu trước!");
    }
  };

  const resetForm = () => {
    // For managers, preset their branch ID
    const branchIdToUse =
      userRole === "manager" && userBranchId ? userBranchId : "";
    console.log("Resetting form with branch ID:", branchIdToUse);

    setFormData({
      name: "",
      code: "",
      logo: "",
      description: "",
      website: "",
      country: "Việt Nam",
      status: "active",
      branchId: branchIdToUse,
    });
  };

  const handleAddBrand = async () => {
    // For managers, ensure the branch ID is set to their branch
    if (userRole === "manager" && userBranchId) {
      setFormData((prev) => ({ ...prev, branchId: userBranchId }));
      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    console.log("Form data before validation:", formData);
    console.log("Current userRole:", userRole, "Current userBranchId:", userBranchId);

    // Kiểm tra dữ liệu trước khi gửi
    if (!formData.name) {
      toast.error("Vui lòng điền tên thương hiệu!");
      return;
    }

    // Kiểm tra chọn chi nhánh nếu là admin
    if (userRole === "admin" && !formData.branchId) {
      toast.error("Vui lòng chọn chi nhánh cho thương hiệu!");
      return;
    }

    // Ensure branch ID is set for managers
    if (userRole === "manager" && !formData.branchId && userBranchId) {
      setFormData((prev) => ({
        ...prev,
        branchId: userBranchId,
      }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Nếu không có mã, tự động tạo mã
    if (!formData.code) {
      generateCodeFromName();
      // Đảm bảo code đã được tạo trước khi tiếp tục
      if (!formData.code) {
        // Tạo mã đơn giản nếu không thể tạo từ tên
        const randomCode =
          "BR" + Math.floor(1000 + Math.random() * 9000).toString();
        setFormData((prev) => ({
          ...prev,
          code: randomCode,
        }));
        // Đợi state được cập nhật
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    try {
      // Tạo object dữ liệu mới để đảm bảo branchId được gửi đúng
      const finalBranchId = userRole === 'manager' ? userBranchId : formData.branchId;
      
      const brandData = {
        ...formData,
        branchId: finalBranchId
      };
      
      console.log("Branch ID being sent:", finalBranchId);
      console.log("Full data being sent:", brandData);
      
      // Log dữ liệu để debug
      console.log("Đang gửi dữ liệu:", brandData);

      const response = await brandsApi.createBrand(brandData);
      console.log("Kết quả trả về:", response);

      resetForm();
      setVisible(false);
      fetchBrands();
      toast.success("Thêm thương hiệu thành công!");
    } catch (err) {
      console.error("Lỗi khi thêm thương hiệu:", err);
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(`Thêm thương hiệu thất bại: ${err.response.data.message}`);
      } else {
        toast.error("Thêm thương hiệu thất bại!");
      }
    }
  };

  const handleEditBrand = (brand) => {
    setCurrentBrand(brand);

    // Determine which branch ID to use
    let branchIdToUse = brand.branchId?._id || brand.branchId || "";

    // For managers, always use their branch ID
    if (userRole === "manager" && userBranchId) {
      branchIdToUse = userBranchId;
    }

    setFormData({
      name: brand.name || "",
      code: brand.code || "",
      logo: brand.logo || "",
      description: brand.description || "",
      website: brand.website || "",
      country: brand.country || "Việt Nam",
      status: brand.status || "active",
      branchId: branchIdToUse,
    });

    setEditVisible(true);
  };

  const handleUpdateBrand = async () => {
    // For managers, ensure the branch ID is set to their branch
    if (userRole === "manager" && userBranchId) {
      setFormData((prev) => ({ ...prev, branchId: userBranchId }));
      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    console.log("Form data before update validation:", formData);
    console.log("Current userRole:", userRole, "Current userBranchId:", userBranchId);
    console.log("Current brand:", currentBrand);

    // Kiểm tra dữ liệu trước khi gửi
    if (!formData.name) {
      toast.error("Vui lòng điền tên thương hiệu!");
      return;
    }

    // Kiểm tra chọn chi nhánh nếu là admin
    if (userRole === "admin" && !formData.branchId) {
      toast.error("Vui lòng chọn chi nhánh cho thương hiệu!");
      return;
    }

    try {
      // Tạo object dữ liệu mới để đảm bảo branchId được gửi đúng
      const finalBranchId = userRole === 'manager' ? userBranchId : formData.branchId;
      
      const brandData = {
        ...formData,
        branchId: finalBranchId
      };
      
      console.log("Branch ID being sent:", finalBranchId);
      console.log("Full data being sent:", brandData);
      
      // Log dữ liệu để debug
      console.log("Đang cập nhật dữ liệu:", brandData);

      const response = await brandsApi.updateBrand(currentBrand._id, brandData);
      console.log("Kết quả trả về:", response);

      setEditVisible(false);
      resetForm();
      fetchBrands();
      toast.success("Cập nhật thương hiệu thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật thương hiệu:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(
          `Cập nhật thương hiệu thất bại: ${error.response.data.message}`
        );
      } else {
        toast.error("Cập nhật thương hiệu thất bại!");
      }
    }
  };

  // Synchronous helper function to get branch name from ID
  const getBranchNameById = (branchId) => {
    if (!branchId) return "Không có chi nhánh";

    // Handle case where branchId might be an object with _id
    const actualId = typeof branchId === "object" ? branchId._id : branchId;
    
    console.log("Getting branch name for ID:", actualId, "Available names:", branchNames);
    
    // Look up in our cached branch names
    return branchNames[actualId] || "Không tìm thấy chi nhánh";
  };

  // Handle pagination change
  const handlePageChange = ({ page, rows }) => {
    setFirst((page - 1) * rows);
    setRowsPerPage(rows);
  };

  const getCurrentPageBrands = () =>
    filteredBrands.slice(first, first + rowsPerPage);

  // Handle branch filter change for admin
  const handleBranchFilterChange = (e) => {
    console.log("Branch filter changed to:", e.value);
    
    // Clear the filter if "Tất cả chi nhánh" is selected
    if (e.value === "") {
      setSelectedBranchFilter(null);
    } else {
      setSelectedBranchFilter(e.value);
    }
    
    // Immediately fetch brands after changing the filter
    setTimeout(() => {
      fetchBrands();
    }, 0);
  };

  const renderBrandForm = () => (
    <div className="p-6 bg-white">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Tên thương hiệu<span className="text-red-500">*</span>
          </label>
          <InputText
            className="w-full p-3 border rounded-md"
            placeholder="Nhập tên thương hiệu"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Mã thương hiệu
          </label>
          <div className="flex items-center gap-2">
            <InputText
              className="w-full p-3 border rounded-md"
              placeholder="Nhập hoặc tạo mã tự động"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
            />
            <Button
              label="Tạo"
              severity="info"
              onClick={generateCodeFromName}
              className="whitespace-nowrap "
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Chi nhánh<span className="text-red-500">*</span>
          </label>
          {userRole === "admin" ? (
            <Dropdown
              className="w-full p-3 border rounded-md"
              placeholder="Chọn chi nhánh"
              name="branchId"
              value={formData.branchId}
              options={branches}
              optionLabel="name"
              optionValue="_id"
              onChange={handleInputChange}
            />
          ) : (
            <div className="w-full p-3 border rounded-md bg-gray-100">
              {userBranchId && branchNames[userBranchId] 
                ? branchNames[userBranchId] 
                : "Đang tải chi nhánh..."}
            </div>
          )}
          {userRole !== "admin" && (
            <small className="text-gray-500 italic">
              Manager chỉ có thể tạo thương hiệu cho chi nhánh của mình
            </small>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            URL Logo
          </label>
          <InputText
            className="w-full p-3 border rounded-md"
            placeholder="URL hình ảnh logo"
            name="logo"
            value={formData.logo}
            onChange={handleInputChange}
          />
          {formData.logo && (
            <div className="mt-2 p-2 border rounded-md inline-block">
              <img
                src={formData.logo}
                alt="Logo Preview"
                className="h-16 object-contain"
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Website
          </label>
          <InputText
            className="w-full p-3 border rounded-md"
            placeholder="Địa chỉ website"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Quốc gia
          </label>
          <InputText
            className="w-full p-3 border rounded-md"
            placeholder="Quốc gia"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Trạng thái
          </label>
          <select
            className="w-full p-3 border rounded-md bg-white"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>
      </div>

      <div className="mb-4 col-span-2">
        <label className="block text-gray-700 font-medium mb-2">Mô tả</label>
        <textarea
          className="w-full p-3 border rounded-md h-24 resize-none"
          placeholder="Mô tả về thương hiệu"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 md:mb-0 text-indigo-800">
          Quản lý thương hiệu{" "}
          {userRole === "admin"
            ? selectedBranchFilter && branchNames[selectedBranchFilter]
              ? `(${branchNames[selectedBranchFilter]})`
              : "(Tất cả chi nhánh)"
            : userBranchId && branchNames[userBranchId]
            ? `(${branchNames[userBranchId]})`
            : ""}
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="w-full sm:w-64 mb-3 sm:mb-0 flex items-center">
            <IconField iconPosition="left" className="w-full">
              <InputIcon className="pi pi-search text-gray-500 -mt-2" />
              <InputText
                className="w-full pl-8 py-2 border-gray-300 border focus:border-indigo-500 focus:ring focus:ring-indigo-200 rounded-md"
                placeholder="Tìm kiếm thương hiệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </IconField>
          </div>
          
          {/* Branch filter for admin */}
          {userRole === "admin" && (
            <div className="w-full sm:w-64 mb-3 sm:mb-0">
              <Dropdown
                value={selectedBranchFilter === null ? "" : selectedBranchFilter}
                options={[
                  { label: "Tất cả chi nhánh", value: "" },
                  ...(Array.isArray(branches) ? branches.map(branch => ({
                    label: branch.name,
                    value: branch._id
                  })) : [])
                ]}
                onChange={handleBranchFilterChange}
                placeholder="Tất cả chi nhánh"
                className="w-full border border-gray-300 rounded-md"
                pt={{
                  root: { className: "w-full" },
                  item: { className: "py-2 px-4" },
                  trigger: { className: "p-2 flex justify-between items-center" },
                  panel: { className: "border border-gray-200 rounded-md shadow-md" }
                }}
                disabled={isLoading}
              />
            </div>
          )}
          
          <Button
            label="+ Thêm thương hiệu"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded w-full sm:w-auto py-2 px-4 shadow-md transition-all duration-200"
            onClick={() => {
              resetForm();
              setVisible(true);
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Loading indicator */}
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <i className="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
              <p className="text-gray-600">Đang tải dữ liệu thương hiệu...</p>
            </div>
          </div>
        ) : (
          <table className="min-w-full table-auto">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <tr>
                <th className="py-4 px-6 text-center">Mã</th>
                <th className="py-4 px-6 text-left">Tên thương hiệu</th>
                <th className="py-4 px-6 text-center">Logo</th>
                <th className="py-4 px-6 text-center">Quốc gia</th>
                {userRole === "admin" && (
                  <th className="py-4 px-6 text-center">Chi nhánh</th>
                )}
                <th className="py-4 px-6 text-center">Trạng thái</th>
                <th className="py-4 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {getCurrentPageBrands().length > 0 ? (
                getCurrentPageBrands().map((brand, index) => (
                  <tr
                    key={brand._id}
                    className={`border-b hover:bg-indigo-50 transition-colors duration-150 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="py-4 px-6 text-center font-medium text-gray-800">
                      {brand.code}
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-indigo-800">
                          {brand.name}
                        </div>
                        {brand.website && (
                          <div className="text-xs text-blue-600">
                            <a
                              href={brand.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {brand.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-14 h-14 object-contain mx-auto border rounded-md p-1 shadow-sm"
                        />
                      ) : (
                        <span className="text-gray-400 italic">Không có</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center text-gray-700">
                      {brand.country || "Không có"}
                    </td>
                    {userRole === "admin" && (
                      <td className="py-4 px-6 text-center">
                        {getBranchNameById(brand.branchId)}
                      </td>
                    )}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          brand.status === "active"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {brand.status === "active"
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          icon="pi pi-pencil"
                          className="p-button-sm p-button-info  p-2 text-red-500"
                          tooltip="Sửa thông tin"
                          tooltipOptions={{ position: "top" }}
                          onClick={() => handleEditBrand(brand)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={userRole === "admin" ? "7" : "6"}
                    className="py-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <i className="pi pi-search text-4xl mb-3 text-gray-300"></i>
                      <p>
                        Không có dữ liệu thương hiệu
                        {userRole === "manager" ? " cho chi nhánh này" : ""}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Hãy thêm thương hiệu mới để bắt đầu
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {filteredBrands.length > 0 && (
        <div className="mt-4 bg-white shadow p-4 rounded-lg">
          <Pagination
            totalRecords={filteredBrands.length}
            rowsPerPageOptions={[5, 10, 25, 50]}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Add Brand Dialog */}
      <Dialog
        header={
          <div className="text-xl font-semibold text-indigo-800">
            Thêm thương hiệu mới
          </div>
        }
        visible={visible}
        style={{ width: "80vw", maxWidth: "800px" }}
        onHide={() => setVisible(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Hủy"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => setVisible(false)}
              className="px-4 py-2 border bg-red-600 text-white rounded"
            />
            <Button
              label="Lưu"
              icon="pi pi-check"
              onClick={handleAddBrand}
              className="px-4 py-2 border bg-[#51bb1a] text-white rounded"
            />
          </div>
        }
        className="p-dialog-custom"
      >
        {renderBrandForm()}
      </Dialog>

      {/* Edit Brand Dialog */}
      <Dialog
        header={
          <div className="text-xl font-semibold text-indigo-800">
            Chỉnh sửa thương hiệu
          </div>
        }
        visible={editVisible}
        style={{ width: "80vw", maxWidth: "800px" }}
        onHide={() => setEditVisible(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Hủy"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => setEditVisible(false)}
              className="px-4 py-2 border bg-red-600 text-white rounded"
            />
            <Button
              label="Cập nhật"
              icon="pi pi-check"
              onClick={handleUpdateBrand}
              className="px-4 py-2 bg-[#51bb1a] text-white rounded"
            />
          </div>
        }
        className="p-dialog-custom"
      >
        {renderBrandForm()}
      </Dialog>

      <style>{`
        .p-dialog-custom .p-dialog-header {
          background: linear-gradient(to right, #f8fafc, #f1f5f9);
          border-bottom: 1px solid #e2e8f0;
          padding: 1.25rem 1.5rem;
        }
        .p-dialog-custom .p-dialog-content {
          padding: 0;
        }
        .p-dialog-custom .p-dialog-footer {
          border-top: 1px solid #e2e8f0;
          padding: 1rem 1.5rem;
          background: #f8fafc;
        }
        .p-inputtext:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        .p-paginator {
          background: transparent;
        }
        .p-paginator .p-paginator-page.p-highlight {
          background: #6366f1;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default Brands;
