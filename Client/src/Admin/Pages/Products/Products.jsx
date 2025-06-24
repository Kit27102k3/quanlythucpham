/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Button, Dialog, InputText, Dropdown } from "primereact";
import { toast } from "sonner";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import Pagination from "../../../utils/Paginator";
import productsApi from "../../../api/productsApi";
import { AddProduct, EditProduct } from "./index";
import branchesApi from "../../../api/branchesApi";

const Products = () => {
  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expiryNotification, setExpiryNotification] = useState({
    show: false,
    products: []
  });

  // Pagination states
  const [first, setFirst] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  // Get current user from localStorage
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("userRole");
    const branchId = localStorage.getItem("branchId");
    
    setUserRole(role || "");
    
    // Khởi tạo currentUser với giá trị mặc định để tránh lỗi prop type
    setCurrentUser({
      _id: userId || "default-user",
      name: localStorage.getItem("userName") || "Người dùng",
    });
    
    // Nếu là manager, tự động chọn chi nhánh của họ
    if (role === "manager" && branchId) {
      setSelectedBranch(branchId);
    }
  }, []);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesData = await branchesApi.getAllBranches();
        setBranches(branchesData);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
        setBranches([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBranches();
  }, []);

  useEffect(() => {
    // Nếu là admin và chưa chọn chi nhánh, hoặc là manager đã có chi nhánh
    if ((userRole === "admin" && selectedBranch) || 
        (userRole === "manager" && selectedBranch)) {
      fetchProducts();
    } 
    // Nếu là admin và chưa chọn chi nhánh, lấy tất cả sản phẩm
    else if (userRole === "admin") {
      fetchAllProducts();
    }
  }, [selectedBranch, userRole]);

  // Check for expiring products
  useEffect(() => {
    if (products.length > 0) {
      checkExpiringProducts(products);
    }
  }, [products]);

  // Filter products based on search term
  useEffect(() => {
    const filtered = products.filter((product) =>
      searchTerm
        ? product?.productName?.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

    setFilteredProducts(filtered);
    setFirst(0);
  }, [products, searchTerm]);

  // Function to check for products nearing expiry date
  const checkExpiringProducts = (productsList) => {
    const today = new Date();
    const expiringProducts = [];
    
    productsList.forEach(product => {
      if (product.expiryDate && product.productStatus !== "Hết hàng") {
        const expiryDate = new Date(product.expiryDate);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Different thresholds for meat products vs other products
        const isMeatProduct = product.productCategory?.toLowerCase().includes("thịt") || 
                             product.productName?.toLowerCase().includes("thịt");
        
        if ((isMeatProduct && diffDays <= 1) || (!isMeatProduct && diffDays <= 3)) {
          expiringProducts.push({
            ...product,
            daysUntilExpiry: diffDays,
            isMeat: isMeatProduct
          });
        }
      }
    });
    
    if (expiringProducts.length > 0) {
      setExpiryNotification({
        show: true,
        products: expiringProducts
      });
    }
  };

  const handleCloseExpiryNotification = () => {
    setExpiryNotification({ show: false, products: [] });
  };

  const handleDiscountExpiringProducts = (product) => {
    setEditingProduct(product);
    setEditVisible(true);
  };

  // Original functions
  const fetchAllProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productsApi.getAllProducts();
      
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error("Data is not an array:", data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch all products:", error);
      setProducts([]);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      let data;
      
      if (selectedBranch) {
        try {
          // Đảm bảo selectedBranch là string
          const branchIdString = String(selectedBranch);
          
          // Thử gọi API getProductsByBranch
          data = await productsApi.getProductsByBranch(branchIdString);
        } catch (error) {
          console.error(`Không thể lấy sản phẩm theo chi nhánh: ${error.message}`);
          
          // Nếu API không tồn tại, lấy tất cả sản phẩm và lọc theo branchId
          const allProducts = await productsApi.getAllProducts();
          if (Array.isArray(allProducts)) {
            data = allProducts.filter(product => product.branchId === selectedBranch);
            console.log(`Đã lọc ${data.length} sản phẩm theo chi nhánh ${selectedBranch}`);
          } else {
            data = [];
          }
        }
      } else if (userRole === "admin") {
        data = await productsApi.getAllProducts();
      } else {
        data = [];
      }
      
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error("Data is not an array:", data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBranchChange = (e) => {
    // Check if e.value is a valid ID string, or use null for "All branches"
    const branchId = e.value === "" ? null : e.value;
    
    // Make sure we're not passing an object to selectedBranch
    if (typeof e === 'object' && e !== null && typeof e.value === 'object') {
      console.error("Invalid branch selection:", e);
      setSelectedBranch(null);
      fetchAllProducts();
      return;
    }
    
    setSelectedBranch(branchId);
    
    // If branch is null/empty (All branches), fetch all products
    if (!branchId) {
      fetchAllProducts();
    }
  };

  const handleAddProduct = async (newProduct) => {
    try {
      setProducts((prevProducts) => [newProduct, ...prevProducts]);
      if (userRole === "admin" && !selectedBranch) {
        await fetchAllProducts();
      } else {
        await fetchProducts();
      }
      toast.success("Thêm sản phẩm thành công!");
    } catch (err) {
      console.error("Lỗi khi thêm sản phẩm:", err);
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product._id !== newProduct._id)
      );
      toast.error("Thêm sản phẩm thất bại!");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditVisible(true);
  };

  const handleUpdateProduct = async (id, data) => {
    try {
      await productsApi.updateProduct(id, data);

      if (userRole === "admin" && !selectedBranch) {
        await fetchAllProducts();
      } else {
        await fetchProducts();
      }

      toast.success("Cập nhật sản phẩm thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      toast.error("Có lỗi xảy ra khi cập nhật sản phẩm!");
    }
  };

  // Handle pagination change
  const handlePageChange = ({ page, rows }) => {
    setFirst((page - 1) * rows);
    setRowsPerPage(rows);
  };

  // Get current page products
  const getCurrentPageProducts = () =>
    filteredProducts.slice(first, first + rowsPerPage);

  return (
    <div className="p-2 md:p-4">
      <h1 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">
        Quản Lý Sản Phẩm
      </h1>
      
      {/* Expiry notification */}
      {expiryNotification.show && expiryNotification.products.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-yellow-700">
              <i className="pi pi-exclamation-triangle mr-2 text-yellow-500"></i>
              Cảnh báo: {expiryNotification.products.length} sản phẩm sắp hết hạn
            </h3>
            <Button 
              icon="pi pi-times" 
              className="p-button-text p-button-sm p-button-rounded" 
              onClick={handleCloseExpiryNotification} 
            />
          </div>
          <div className="max-h-48 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="p-2 text-left text-xs font-medium text-yellow-700">Sản phẩm</th>
                  <th className="p-2 text-left text-xs font-medium text-yellow-700">Ngày hết hạn</th>
                  <th className="p-2 text-left text-xs font-medium text-yellow-700">Còn (ngày)</th>
                  <th className="p-2 text-left text-xs font-medium text-yellow-700">Tồn kho</th>
                  <th className="p-2 text-xs font-medium text-yellow-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {expiryNotification.products.map((product) => (
                  <tr key={`expiry-${product._id}`} className="border-t border-yellow-200">
                    <td className="p-2 text-xs">
                      {product.productName}
                      {product.isMeat && <span className="ml-1 text-red-500 text-[10px]">(Thịt)</span>}
                    </td>
                    <td className="p-2 text-xs">
                      {new Date(product.expiryDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-2 text-xs font-medium">
                      <span className={product.daysUntilExpiry <= 0 ? 'text-red-600' : 'text-orange-500'}>
                        {product.daysUntilExpiry}
                      </span>
                    </td>
                    <td className="p-2 text-xs">{product.productStock}</td>
                    <td className="p-2 text-xs text-center">
                      <Button
                        label="Giảm giá"
                        className="p-button-sm p-button-warning text-[10px]"
                        onClick={() => handleDiscountExpiringProducts(product)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-yellow-600">
            <p>* Sản phẩm thịt/cá: cảnh báo trước 1 ngày, sản phẩm khác: cảnh báo trước 3 ngày</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-2 mb-3 md:mb-5">
        <div className="w-full md:w-1/3 lg:w-2/5">
          <IconField iconPosition="left" className="w-full">
            <InputIcon className="pi pi-search -mt-2"> </InputIcon>
            <InputText
              placeholder="Tìm kiếm theo tên sản phẩm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded w-full p-2 px-12"
            />
          </IconField>
        </div>
        
        {userRole === "admin" && (
          <div className="w-full md:w-1/5">
            <Dropdown
              value={selectedBranch}
              options={[
                { label: "Tất cả chi nhánh", value: "" },
                ...(Array.isArray(branches) ? branches.map(branch => ({
                  label: branch.name,
                  value: branch._id
                })) : [])
              ]}
              onChange={handleBranchChange}
              placeholder="Tất cả chi nhánh"
              className="w-full"
              pt={{
                root: { className: "p-2" },
                item: { className: "py-2 px-4" },
                trigger: { className: "px-3" },
              }}
            />
          </div>
        )}
        
        <div className="w-full md:w-1/5">
          <Dropdown
            value={selectedProduct}
            options={
              Array.isArray(products)
                ? products.map((product) => ({
                    label: product?.productCode,
                    value: product?._id,
                  }))
                : []
            }
            onChange={setSelectedProduct}
            placeholder="Tất cả"
            className="w-full"
            pt={{
              root: { className: "p-2" },
              item: { className: "py-2 px-4" },
              trigger: { className: "px-3" },
            }}
          />
        </div>
        <div className="w-full md:w-1/5">
          <Button
            label="Thêm Sản Phẩm"
            icon="pi pi-plus"
            onClick={() => setVisible(true)}
            className="bg-blue-500 text-white rounded text-xs md:text-sm w-full p-2"
          />
        </div>
      </div>

      {/* Table container with horizontal scroll for mobile */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="text-center p-4">
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center p-4 bg-gray-50 rounded-md">
            <p className="text-gray-600">Không tìm thấy sản phẩm nào</p>
          </div>
        ) : (
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  Tên sản phẩm
                </th>
                <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  Thương hiệu
                </th>
                <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  Loại sản phẩm
                </th>
                <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  Giá sản phẩm
                </th>
                <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  Tình trạng
                </th>
                <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  Giảm giá
                </th>
                <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  Số lượng tồn kho
                </th>
                <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  Mã sản phẩm
                </th>
                <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  Xuất xứ
                </th>
                <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm w-[100px] md:w-[120px]">
                  Chức Năng
                </th>
              </tr>
            </thead>
            <tbody>
              {getCurrentPageProducts().map((product) => (
                <tr key={product?._id || `product-${Math.random()}`} className="border-b">
                  <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                    {product?.productName}
                  </td>
                  <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                    {product?.productBrand}
                  </td>
                  <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                    {product?.productCategory}
                  </td>
                  <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                    {product?.productPrice}
                  </td>
                  <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                    {product?.productStatus}
                  </td>
                  <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                    {product?.productDiscount}
                  </td>
                  <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                    {product?.productStock}
                  </td>
                  <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                    {product?.productCode}
                  </td>
                  <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                    {product?.productOrigin}
                  </td>
                  <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                    <div className="flex justify-center space-x-1 md:space-x-2">
                      <Button
                        icon="pi pi-pencil"
                        className="p-button-warning p-button-sm text-[10px] md:text-xs p-1 md:p-2"
                        onClick={() => handleEditProduct(product)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredProducts.length > 0 && (
        <div className="mt-4">
          <Pagination
            totalRecords={filteredProducts.length}
            rowsPerPageOptions={[8, 16, 24]}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <Dialog
        header="Thêm Sản Phẩm Mới"
        visible={visible}
        onHide={() => setVisible(false)}
        className="w-[95vw] md:w-[90vw] lg:w-[80vw] xl:w-[70vw] p-6"
        headerClassName="p-4"
      >
        <AddProduct
          onHide={() => setVisible(false)}
          onAddSuccess={handleAddProduct}
          currentUser={currentUser}
        />
      </Dialog>

      <Dialog
        header="Chỉnh Sửa Sản Phẩm"
        visible={editVisible}
        onHide={() => setEditVisible(false)}
        className="w-[95vw] md:w-[90vw] lg:w-[80vw] xl:w-[70vw] p-6"
        headerClassName="p-4"
      >
        {editingProduct && (
          <EditProduct
            product={editingProduct}
            setVisible={setEditVisible}
            onUpdateSuccess={handleUpdateProduct}
            currentUser={currentUser}
          />
        )}
      </Dialog>
    </div>
  );
};

export default Products;
