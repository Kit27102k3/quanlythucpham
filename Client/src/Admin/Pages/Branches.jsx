import { useState, useEffect, useRef } from "react";
import { Button, Dialog, InputText } from "primereact";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Dropdown } from "primereact/dropdown";
import { AutoComplete } from "primereact/autocomplete";
import branchesApi from "../../api/branchesApi";
import MapWrapper from "./MapWrapper";
import Pagination from "../../utils/Paginator";

// Không import trực tiếp react-leaflet ở đây

const Branches = () => {
  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [mapPosition, setMapPosition] = useState([10.8231, 106.6297]); // Default position (Ho Chi Minh City)
  const [mapKey, setMapKey] = useState(Date.now()); // Key for map re-render
  const geocodeTimeoutRef = useRef(null);
  const [isBrowser, setIsBrowser] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressQuery, setAddressQuery] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    manager: "",
    openingHours: "",
    isActive: true,
    latitude: 10.8231,
    longitude: 106.6297,
  });

  // Pagination states
  const [first, setFirst] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Status options
  const statusOptions = [
    { label: "Hoạt động", value: true },
    { label: "Không hoạt động", value: false },
  ];

  useEffect(() => {
    setIsBrowser(typeof window !== 'undefined');
    fetchBranches();
  }, []);

  useEffect(() => {
    // Filter branches based on search term
    const filtered = branches.filter((branch) =>
      searchTerm
        ? branch?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch?.address?.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

    setFilteredBranches(filtered);
    setFirst(0);
  }, [branches, searchTerm]);

  // Update map when dialog opens
  useEffect(() => {
    if ((visible || editVisible) && isBrowser) {
      setMapPosition([
        formData.latitude || 10.8231, 
        formData.longitude || 106.6297
      ]);
      setMapKey(Date.now()); // Force re-render map
    }
  }, [visible, editVisible, formData.latitude, formData.longitude, isBrowser]);

  const fetchBranches = async () => {
    try {
      const data = await branchesApi.getAllBranches();
      if (Array.isArray(data)) {
        setBranches(data);
      } else if (data && Array.isArray(data.branches)) {
        setBranches(data.branches);
      } else {
        console.error("Data is not in expected format:", data);
        setBranches([]);
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      setBranches([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // If address is changed, try to geocode after a delay
    if (name === 'address') {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
      
      geocodeTimeoutRef.current = setTimeout(() => {
        geocodeAddress(value);
      }, 500);
    }
  };

  // Hàm tìm kiếm gợi ý địa chỉ
  const searchAddress = async (event) => {
    const query = event.query.trim();
    setAddressQuery(query);
    
    if (query.length < 2) {
      setAddressSuggestions([]);
      return;
    }

    try {
      console.log("Đang tìm kiếm địa chỉ:", query);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=vn&addressdetails=1&accept-language=vi`
      );
      const data = await response.json();
      console.log("Kết quả tìm kiếm:", data);
      
      if (data && data.length > 0) {
        const suggestions = data.map(item => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        }));
        
        console.log("Gợi ý:", suggestions);
        setAddressSuggestions(suggestions);
      } else {
        setAddressSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setAddressSuggestions([]);
    }
  };

  // Xử lý khi chọn một địa chỉ từ gợi ý
  const onAddressSelect = (e) => {
    const selectedAddress = e.value;
    console.log("Địa chỉ đã chọn:", selectedAddress);
    
    if (selectedAddress && selectedAddress.lat && selectedAddress.lon) {
      // Cập nhật form data
      setFormData(prev => ({
        ...prev,
        address: selectedAddress.name,
        latitude: selectedAddress.lat,
        longitude: selectedAddress.lon
      }));
      
      // Cập nhật vị trí bản đồ
      const newPosition = [selectedAddress.lat, selectedAddress.lon];
      console.log("Cập nhật vị trí bản đồ:", newPosition);
      setMapPosition(newPosition);
      setMapKey(Date.now()); // Force re-render map
    }
  };

  // Geocode address to get coordinates
  const geocodeAddress = async (address) => {
    if (!address || address.length < 3) return;
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=vn`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);
        
        setFormData(prev => ({
          ...prev,
          latitude: newLat,
          longitude: newLon
        }));
        
        setMapPosition([newLat, newLon]);
        setMapKey(Date.now()); // Force re-render map
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
    }
  };

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      if (data && data.display_name) {
        setFormData(prev => ({
          ...prev,
          address: data.display_name,
          latitude: lat,
          longitude: lng
        }));
        setAddressQuery(data.display_name);
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  // Xử lý riêng cho dropdown status vì giá trị boolean
  const handleStatusChange = (e) => {
    setFormData({
      ...formData,
      isActive: e.value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      manager: "",
      openingHours: "08:00 - 22:00",
      isActive: true,
      latitude: 10.8231,
      longitude: 106.6297,
    });
    setMapPosition([10.8231, 106.6297]);
    setMapKey(Date.now());
    setAddressQuery("");
  };

  const handleAddBranch = async () => {
    // Kiểm tra dữ liệu trước khi gửi
    if (!formData.name || !formData.address || !formData.phone) {
      toast.error("Vui lòng điền đầy đủ tên, địa chỉ và số điện thoại!");
      return;
    }

    try {
      const response = await branchesApi.createBranch(formData);
      console.log("Kết quả trả về:", response);

      resetForm();
      setVisible(false);
      fetchBranches();
      toast.success("Thêm chi nhánh thành công!");
    } catch (err) {
      console.error("Lỗi khi thêm chi nhánh:", err);
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(`Thêm chi nhánh thất bại: ${err.response.data.message}`);
      } else {
        toast.error("Thêm chi nhánh thất bại!");
      }
    }
  };

  const handleEditBranch = (branch) => {
    setCurrentBranch(branch);
    setFormData({
      name: branch.name || "",
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      manager: branch.manager || "",
      openingHours: branch.openingHours || "",
      isActive: branch.isActive !== false,
      latitude: branch.latitude || 10.8231,
      longitude: branch.longitude || 106.6297,
    });
    setAddressQuery(branch.address || "");
    setMapPosition([
      branch.latitude || 10.8231, 
      branch.longitude || 106.6297
    ]);
    setEditVisible(true);
  };

  const handleUpdateBranch = async () => {
    // Kiểm tra dữ liệu trước khi gửi
    if (!formData.name || !formData.address || !formData.phone) {
      toast.error("Vui lòng điền đầy đủ tên, địa chỉ và số điện thoại!");
      return;
    }

    try {
      const response = await branchesApi.updateBranch(
        currentBranch._id,
        formData
      );
      console.log("Kết quả trả về:", response);

      setEditVisible(false);
      resetForm();
      fetchBranches();
      toast.success("Cập nhật chi nhánh thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật chi nhánh:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(
          `Cập nhật chi nhánh thất bại: ${error.response.data.message}`
        );
      } else {
        toast.error("Cập nhật chi nhánh thất bại!");
      }
    }
  };

  const confirmDelete = (branch) => {
    setBranchToDelete(branch);
    setDeleteDialogVisible(true);
  };

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return;

    try {
      await branchesApi.deleteBranch(branchToDelete._id);
      setDeleteDialogVisible(false);
      fetchBranches();
      toast.success("Xóa chi nhánh thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa chi nhánh:", error);
      toast.error("Xóa chi nhánh thất bại!");
    }
  };

  // Get current page branches
  const getCurrentPageBranches = () => {
    return filteredBranches.slice(first, first + rowsPerPage);
  };

  // Handle pagination change from reusable component
  const handlePageChange = ({ page, rows }) => {
    setFirst((page - 1) * rows);
    setRowsPerPage(rows);
  };

  // Handle address input change
  const onAddressInputChange = (e) => {
    const value = e.value;
    setAddressQuery(value);
    setFormData(prev => ({
      ...prev,
      address: value
    }));
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
    geocodeTimeoutRef.current = setTimeout(() => {
      geocodeAddress(value);
    }, 500);
  };

  const renderBranchForm = () => (
    <div className="p-8 bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-lg shadow-inner">
      <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-6">
        <div className="transition-all duration-300 hover:shadow-md p-4 rounded-lg bg-white">
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Tên chi nhánh <span className="text-red-500">*</span>
          </label>
          <InputText
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-3 border-blue-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md transition-all duration-200"
            required
          />
        </div>
        <div className="transition-all duration-300 hover:shadow-md p-4 rounded-lg bg-white">
          <label
            htmlFor="address"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Địa chỉ <span className="text-red-500">*</span>
          </label>
          <AutoComplete
            id="address"
            name="address"
            value={addressQuery || formData.address}
            suggestions={addressSuggestions}
            completeMethod={searchAddress}
            field="name"
            onChange={onAddressInputChange}
            onSelect={onAddressSelect}
            appendTo={document.body}
            panelStyle={{ position: 'fixed', zIndex: 2147483000 }}
            panelClassName="border border-blue-200 shadow-lg rounded-md z-[9999] p-2 space-y-2"
            dropdown
            dropdownMode="current"
            forceSelection={false}
            delay={300}
            minLength={2}
            scrollHeight="300px"
            className="w-full"
            inputClassName="w-full p-3 border-blue-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md transition-all duration-200"
            placeholder="Nhập địa chỉ (ít nhất 2 ký tự để tìm kiếm)"
            emptyMessage="Không tìm thấy địa chỉ"
            itemClassName="hover:bg-blue-50 transition-colors duration-150 cursor-pointer px-4 py-2 last:mb-0"
            required
          />
        </div>
      </div>

      {/* Map Component */}
      <div className="mb-8 transition-all duration-300 hover:shadow-lg rounded-lg overflow-hidden bg-white p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Chọn vị trí trên bản đồ <span className="text-sm text-blue-600 font-normal">(Di chuyển chấm đỏ để chọn vị trí chính xác)</span>
        </label>
        <div className="h-[350px] w-full border border-blue-200 shadow-md rounded-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <MapWrapper 
            key={mapKey}
            mapKey={mapKey}
            mapPosition={mapPosition}
            setMapPosition={setMapPosition}
            reverseGeocode={reverseGeocode}
          />
        </div>
        <div className="mt-3 text-xs text-gray-600 flex justify-between bg-blue-50 p-3 rounded-md shadow-sm">
          <span className="flex items-center">
            <i className="pi pi-map-marker text-blue-600 mr-2"></i>
            Vĩ độ: <span className="font-medium ml-1 text-blue-800">{mapPosition[0].toFixed(6)}</span>
          </span>
          <span className="flex items-center">
            <i className="pi pi-map-marker text-blue-600 mr-2"></i>
            Kinh độ: <span className="font-medium ml-1 text-blue-800">{mapPosition[1].toFixed(6)}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <div className="transition-all duration-300 hover:shadow-md p-4 rounded-lg bg-white">
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <InputText
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full p-3 border-blue-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md transition-all duration-200"
            required
          />
        </div>
        <div className="transition-all duration-300 hover:shadow-md p-4 rounded-lg bg-white">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Email
          </label>
          <InputText
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-3 border-blue-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md transition-all duration-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <div className="transition-all duration-300 hover:shadow-md p-4 rounded-lg bg-white">
          <label
            htmlFor="manager"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Tên quản lý
          </label>
          <InputText
            id="manager"
            name="manager"
            value={formData.manager}
            onChange={handleInputChange}
            className="w-full p-3 border-blue-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md transition-all duration-200"
          />
        </div>
        <div className="transition-all duration-300 hover:shadow-md p-4 rounded-lg bg-white">
          <label
            htmlFor="openingHours"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Giờ mở cửa
          </label>
          <InputText
            id="openingHours"
            name="openingHours"
            value={formData.openingHours}
            onChange={handleInputChange}
            placeholder="Ví dụ: 8:00 - 22:00"
            className="w-full p-3 border-blue-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md transition-all duration-200"
          />
        </div>
      </div>

      <div className="transition-all duration-300 hover:shadow-md p-4 rounded-lg bg-white">
        <label
          htmlFor="status"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Trạng thái
        </label>
        <Dropdown
          id="status"
          value={formData.isActive}
          options={statusOptions}
          onChange={handleStatusChange}
          optionLabel="label"
          className="w-full"
          panelClassName="border border-blue-200 shadow-lg rounded-md"
          inputClassName="w-full p-3 border-blue-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md transition-all duration-200"
        />
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
            Quản lý Chi nhánh
          </h1>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <IconField className="w-full md:w-64 flex items-center">
              <InputText
                placeholder="Tìm kiếm chi nhánh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md transition-all duration-200"
              />
              <InputIcon className="text-gray-400 -mt-2">
                <i className="pi pi-search" />
              </InputIcon>
            </IconField>
            <Button
              label="Thêm Chi nhánh"
              icon="pi pi-plus"
              className="bg-green-500 hover:bg-green-600 border-green-500 px-4 py-2.5 text-white font-medium rounded-md transition-colors shadow-md hover:shadow-lg"
              onClick={() => {
                resetForm();
                setVisible(true);
              }}
            />
          </div>
        </div>

        {/* Bảng danh sách chi nhánh */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Mã
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tên chi nhánh
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Địa chỉ
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Liên hệ
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Trạng thái
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getCurrentPageBranches().length > 0 ? (
                getCurrentPageBranches().map((branch) => (
                  <tr key={branch._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {branch._id ? branch._id.substring(0, 8) : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {branch.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                      {branch.address}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div>
                        <p>
                          <i className="pi pi-phone mr-2 text-blue-500"></i>
                          {branch.phone}
                        </p>
                        {branch.email && (
                          <p>
                            <i className="pi pi-envelope mr-2 text-blue-500"></i>
                            {branch.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          branch.isActive !== false
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {branch.isActive !== false
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        icon="pi pi-pencil"
                        className="p-button-text p-button-rounded p-button-info mr-2"
                        onClick={() => handleEditBranch(branch)}
                        tooltip="Chỉnh sửa"
                        tooltipOptions={{ position: "top" }}
                      />
                      <Button
                        icon="pi pi-trash"
                        className="p-button-text p-button-rounded p-button-danger"
                        onClick={() => confirmDelete(branch)}
                        tooltip="Xóa"
                        tooltipOptions={{ position: "top" }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Pagination */}
        {filteredBranches.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              totalRecords={filteredBranches.length}
              rowsPerPageOptions={[10, 20, 30]}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Dialog thêm chi nhánh */}
      <Dialog
        header="Thêm Chi nhánh Mới"
        visible={visible}
        style={{ width: "90%", maxWidth: "900px" }}
        onHide={() => setVisible(false)}
        className="shadow-lg"
        headerClassName="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-4"
        contentClassName="p-0"
        footer={
          <div className="flex justify-end gap-3 p-4 bg-gray-50">
            <Button
              label="Hủy"
              icon="pi pi-times"
              className="bg-red-500 cursor-pointer text-white rounded px-4"
              onClick={() => setVisible(false)}
            />
            <Button
              label="Lưu"
              icon="pi pi-check"
              className=" px-4 py-2 text-white bg-[#51bb1a] rounded cursor-pointer"
              onClick={handleAddBranch}
            />
          </div>
        }
      >
        {renderBranchForm()}
      </Dialog>

      {/* Dialog chỉnh sửa chi nhánh */}
      <Dialog
        header="Chỉnh sửa Chi nhánh"
        visible={editVisible}
        style={{ width: "90%", maxWidth: "900px" }}
        onHide={() => setEditVisible(false)}
        className="shadow-lg"
        headerClassName="bg-gradient-to-r from-green-500 to-green-700 text-white p-4"
        contentClassName="p-0"
        footer={
          <div className="flex justify-end gap-3 p-4 bg-gray-50">
            <Button
              label="Hủy"
              icon="pi pi-times"
              className="bg-red-500 px-4 py-2 text-white rounded"
              onClick={() => setEditVisible(false)}
            />
            <Button
              label="Lưu thay đổi"
              icon="pi pi-check"
              className="bg-[#51bb1a] px-4 py-2 text-white rounded"
              onClick={handleUpdateBranch}
            />
          </div>
        }
      >
        {renderBranchForm()}
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog
        header="Xác nhận xóa"
        visible={deleteDialogVisible}
        style={{ width: "450px" }}
        modal
        className="shadow-lg"
        headerClassName="bg-gradient-to-r from-red-500 to-red-700 text-white p-4"
        footer={
          <div className="flex justify-end gap-3 p-4 bg-gray-50">
            <Button
              label="Không"
              icon="pi pi-times"
              className="p-button-text hover:bg-gray-100"
              onClick={() => setDeleteDialogVisible(false)}
            />
            <Button
              label="Có, xóa"
              icon="pi pi-trash"
              className="bg-red-500"
              onClick={handleDeleteBranch}
            />
          </div>
        }
        onHide={() => setDeleteDialogVisible(false)}
      >
        <div className="flex items-center gap-4 p-6 bg-red-50">
          <i
            className="pi pi-exclamation-triangle text-red-500"
            style={{ fontSize: "2.5rem" }}
          ></i>
          <div>
            <p className="font-medium text-lg mb-2 text-gray-800">
              Bạn có chắc chắn muốn xóa chi nhánh &quot;
              <span className="font-bold text-red-700">
                {branchToDelete?.name || ""}
              </span>&quot;?
            </p>
            <p className="text-sm text-gray-600">
              Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn dữ liệu chi nhánh.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Branches;
