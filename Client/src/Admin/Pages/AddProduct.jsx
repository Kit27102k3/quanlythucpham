import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { Scrollbars } from "react-custom-scrollbars-2";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Card } from "primereact/card";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import productsApi from "../../api/productsApi";
import categoriesApi from "../../api/categoriesApi";

const INITIAL_PRODUCT_STATE = {
  productName: "",
  productPrice: "",
  productImages: [],
  productCategory: "",
  productBrand: "",
  productStatus: "Còn hàng",
  productDiscount: "0",
  productStock: "0",
  productCode: "",
  productWeight: "0",
  productPromoPrice: "",
  productWarranty: "",
  productOrigin: "",
  productIntroduction: "",
  productInfo: "",
  productDetails: "",
};

const AddProduct = ({ setVisible, onProductAdd }) => {
  const [product, setProduct] = useState(INITIAL_PRODUCT_STATE);
  const [productDescription, setProductDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAllCategories();
        console.log("Fetched categories:", response);
        
        if (Array.isArray(response)) {
          // Log each category to see their structure
          response.forEach(cat => {
            console.log(`Category: ${cat.nameCategory}, ID: ${cat._id}, Code: ${cat.codeCategory}`);
          });
          
          setCategories(response);
        } else {
          toast.error("Dữ liệu danh mục không hợp lệ");
        }
      } catch (error) {
        toast.error("Không thể tải danh mục sản phẩm");
        console.error("Lỗi khi lấy danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const generateProductCode = (categoryId) => {
    // Tìm thông tin danh mục được chọn
    const selectedCat = categories.find(cat => cat._id === categoryId);
    if (!selectedCat) return "";
    
    // Lấy mã loại từ danh mục
    const categoryCode = selectedCat.codeCategory;
    
    // Tìm sản phẩm có cùng mã loại để tạo số thứ tự
    const getNextSequenceNumber = async () => {
      try {
        const products = await productsApi.getAllProducts();
        // Lọc sản phẩm cùng mã loại và có mã sản phẩm dạng CATXXX-NNN
        const regex = new RegExp(`^${categoryCode}-\\d{3}$`);
        const matchingProducts = products.filter(p => regex.test(p.productCode));
        
        if (matchingProducts.length === 0) return `${categoryCode}-001`;
        
        // Tìm số thứ tự lớn nhất hiện tại
        const maxSequence = Math.max(...matchingProducts.map(p => {
          const match = p.productCode.match(/-(\d{3})$/);
          return match ? parseInt(match[1], 10) : 0;
        }));
        
        // Tăng số thứ tự lên 1
        const nextSequence = maxSequence + 1;
        return `${categoryCode}-${nextSequence.toString().padStart(3, '0')}`;
      } catch (error) {
        console.error("Lỗi khi tạo mã sản phẩm:", error);
        return `${categoryCode}-001`;
      }
    };
    
    getNextSequenceNumber().then(code => {
      setProduct(prev => ({
        ...prev,
        productCode: code
      }));
    });
    
    return `${categoryCode}-XXX`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e, name) => {
    setProduct((prev) => ({
      ...prev,
      [name]: e.value.toString(),
    }));
  };

  const handleDropdownChange = (e, name) => {
    if (name === 'productCategory') {
      const categoryId = e.value;
      setSelectedCategory(categoryId);
      
      console.log("Selected category ID:", categoryId);
      
      // Tìm tên danh mục dựa vào ID
      const selectedCat = categories.find(cat => cat._id === categoryId);
      if (selectedCat) {
        console.log("Found category:", selectedCat);
        
        setProduct(prev => ({
          ...prev,
          productCategory: categoryId,
          productTypeName: selectedCat.nameCategory
        }));
        
        // Generate product code after setting category
        generateProductCode(categoryId);
      } else {
        console.error("Category not found for ID:", categoryId);
        toast.error("Không tìm thấy danh mục đã chọn. Vui lòng thử lại.");
        
        setProduct(prev => ({
          ...prev,
          productCategory: categoryId,
        }));
      }
    } else {
      setProduct((prev) => ({
        ...prev,
        [name]: e.value,
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((file) => URL.createObjectURL(file));

    setImagePreviews((prev) => [...prev, ...previews]);
    setProduct((prev) => ({
      ...prev,
      productImages: [...prev.productImages, ...files],
    }));
  };

  const handleRemoveImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setProduct((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!product.productName || !product.productPrice || !product.productCategory) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc: Tên, Giá và Danh mục");
      return;
    }
    
    if (product.productImages.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hình ảnh sản phẩm");
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Tìm tên danh mục dựa vào ID đã chọn
      const selectedCat = categories.find(cat => cat._id === product.productCategory);
      if (!selectedCat) {
        toast.error("Không tìm thấy thông tin danh mục đã chọn");
        setIsSubmitting(false);
        return;
      }
      
      console.log("Sử dụng tên danh mục:", selectedCat.nameCategory);
      
      // Use a new approach: Try sending directly with a different format
      const formData = new FormData();
      
      // Sử dụng nameCategory thay vì categoryId
      formData.append("productCategory", selectedCat.nameCategory);
      
      // Add all other product fields
      formData.append("productName", product.productName);
      formData.append("productPrice", product.productPrice);
      formData.append("productBrand", product.productBrand || "");
      formData.append("productStatus", product.productStatus || "Còn hàng");
      formData.append("productDiscount", product.productDiscount || "0");
      formData.append("productStock", product.productStock || "0");
      formData.append("productCode", product.productCode || "");
      formData.append("productWeight", product.productWeight || "0");
      formData.append("productOrigin", product.productOrigin || "");
      formData.append("productIntroduction", product.productIntroduction || "");
      formData.append("productInfo", product.productInfo || "");
      formData.append("productDetails", product.productDetails || "");
      formData.append("productTypeName", selectedCat.nameCategory); // Thêm cả productTypeName
      
      // Add description
      const descriptions = productDescription
        .split(".")
        .map((desc) => desc.trim())
        .filter((desc) => desc !== "");
      formData.append("productDescription", JSON.stringify(descriptions));
      
      // Add images separately
      product.productImages.forEach((file) => {
        formData.append("productImages", file);
      });

      console.log("FormData being submitted with a new approach");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? '(binary)' : value}`);
      }

      const response = await productsApi.createProduct(formData);
      toast.success("Thêm sản phẩm thành công!");
      if (onProductAdd) {
        onProductAdd(response.data); 
      }
      setVisible(false);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi không xác định";
      toast.error(`Thêm sản phẩm thất bại: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to test the API directly
  const testCategoryAPI = async () => {
    if (!product.productCategory) {
      toast.error("Vui lòng chọn danh mục trước khi kiểm tra");
      return;
    }
    
    toast.info("Đang kiểm tra API với danh mục đã chọn...");
    
    try {
      // First test: Check if the category exists
      console.log("Checking category directly:", product.productCategory);
      try {
        const categoryDetails = await productsApi.checkCategory(product.productCategory);
        console.log("Category details:", categoryDetails);
        toast.success("✅ Danh mục tồn tại và hợp lệ!");
      } catch (error) {
        console.error("Category check failed:", error);
        toast.error(`❌ Kiểm tra danh mục thất bại: ${error.message}`);
        return;
      }
      
      // Second test: Try creating a test product
      const result = await productsApi.testProductCreation(product.productCategory);
      
      if (result.success) {
        toast.success("✅ Kiểm tra tạo sản phẩm thành công!");
      } else {
        toast.error(`❌ Kiểm tra tạo sản phẩm thất bại: ${result.error?.message || "Lỗi không xác định"}`);
      }
    } catch (error) {
      toast.error(`Lỗi kiểm tra: ${error.message}`);
    }
  };

  return (
    <div className="relative p-3">
      <Scrollbars
        style={{ width: "100%", height: "600px" }}
        renderThumbVertical={({ style, ...props }) => (
          <div
            {...props}
            style={{ ...style, backgroundColor: '#c1c1c1', borderRadius: '4px', width: '6px' }}
          />
        )}
      >
        <form onSubmit={handleSubmit} className="p-fluid">
          <Card className="mb-4 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              <div className="field">
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="productName"
                  name="productName"
                  value={product.productName}
                  onChange={handleInputChange}
                  className="w-full p-inputtext-sm h-10 px-3 border border-gray-300 rounded-md"
                  placeholder="Nhập tên sản phẩm"
                  required
                />
              </div>
              
              <div className="field">
                <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="productCategory"
                  value={product.productCategory}
                  onChange={(e) => handleDropdownChange(e, 'productCategory')}
                  options={categories.map(cat => ({ 
                    label: `${cat.nameCategory} (${cat.codeCategory})`, 
                    value: cat._id,
                    code: cat.codeCategory
                  }))}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Chọn danh mục"
                  className="w-full border border-gray-300 rounded-md"
                  panelClassName="z-50"
                  filter
                  required
                  appendTo="self"
                  style={{ height: '2.5rem' }}
                  itemTemplate={(option) => (
                    <div className="px-4 py-2">{option.label}</div>
                  )}
                  filterPlaceholder="Tìm danh mục..."
                  dropdownIcon="pi pi-chevron-down"
                  showFilterClear={false}
                  filterIcon=""
                  filterTemplate={(options) => (
                    <div className="p-dropdown-filter-container">
                      <input
                        type="text" 
                        value={options.filterValue || ''} 
                        onChange={(e) => options.filterCallback(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-sm w-full mb-2"
                        style={{ height: '36px' }}
                        autoFocus 
                        placeholder="Tìm danh mục..." 
                      />
                    </div>
                  )}
                  pt={{ 
                    input: { className: 'py-2 px-3' },
                    trigger: { className: 'py-2' }
                  }}
                />
                <div className="mt-2">
                  <Button
                    type="button"
                    icon="pi pi-check"
                    label="Kiểm tra danh mục"
                    onClick={testCategoryAPI}
                    className="p-button-sm h-8 px-3 text-xs rounded-md bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 text-white"
                  />
                  <small className="text-gray-500 ml-2">Kiểm tra xem danh mục có hợp lệ với API không</small>
                </div>
              </div>
              
              <div className="field">
                <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Giá <span className="text-red-500">*</span>
                </label>
                <InputNumber
                  id="productPrice"
                  value={parseFloat(product.productPrice) || null}
                  onValueChange={(e) => handleNumberChange(e, 'productPrice')}
                  mode="currency"
                  currency="VND"
                  locale="vi-VN"
                  placeholder="0 ₫"
                  className="w-full h-10 flex items-center"
                  required
                  inputClassName="h-10 px-3 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="field">
                <label htmlFor="productStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  Tình trạng
                </label>
                <InputText
                  id="productStatus"
                  value="Còn hàng"
                  className="w-full h-10 px-3 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  placeholder="Còn hàng"
                  disabled
                />
                <small className="text-gray-500 mt-1 block">Sản phẩm mới luôn ở trạng thái &quot;Còn hàng&quot;</small>
              </div>
            </div>
          </Card>
          
          <Card className="mb-4 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Thông tin chi tiết</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              <div className="field">
                <label htmlFor="productBrand" className="block text-sm font-medium text-gray-700 mb-2">
                  Thương hiệu
                </label>
                <InputText
                  id="productBrand"
                  name="productBrand"
                  value={product.productBrand}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  placeholder="Nhập thương hiệu"
                />
              </div>
              
              <div className="field">
                <label htmlFor="productOrigin" className="block text-sm font-medium text-gray-700 mb-2">
                  Xuất xứ
                </label>
                <InputText
                  id="productOrigin"
                  name="productOrigin"
                  value={product.productOrigin}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  placeholder="Nhập xuất xứ"
                />
              </div>
              
              <div className="field">
                <label htmlFor="productStock" className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng tồn kho
                </label>
                <InputNumber
                  id="productStock"
                  value={parseInt(product.productStock) || 0}
                  onValueChange={(e) => handleNumberChange(e, 'productStock')}
                  className="w-full h-10 flex items-center"
                  placeholder="0"
                  min={0}
                  inputClassName="h-10 px-3 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="field">
                <label htmlFor="productDiscount" className="block text-sm font-medium text-gray-700 mb-2">
                  Giảm giá (%)
                </label>
                <InputNumber
                  id="productDiscount"
                  value={parseInt(product.productDiscount) || 0}
                  onValueChange={(e) => handleNumberChange(e, 'productDiscount')}
                  suffix="%"
                  className="w-full h-10 flex items-center"
                  placeholder="0%"
                  min={0}
                  max={100}
                  inputClassName="h-10 px-3 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="field">
                <label htmlFor="productCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Mã sản phẩm
                </label>
                <div className="border p-3 rounded bg-gray-50 text-sm h-10 flex items-center">
                  <span className="font-medium text-blue-600">{product.productCode || "Chọn danh mục để tạo mã"}</span>
                </div>
                <small className="text-gray-500 mt-1 block">Mã sản phẩm được tạo tự động từ mã loại</small>
              </div>
              
              <div className="field">
                <label htmlFor="productWeight" className="block text-sm font-medium text-gray-700 mb-2">
                  Trọng lượng (gram)
                </label>
                <InputNumber
                  id="productWeight"
                  value={parseInt(product.productWeight) || 0}
                  onValueChange={(e) => handleNumberChange(e, 'productWeight')}
                  suffix=" g"
                  className="w-full h-10 flex items-center"
                  placeholder="0 g"
                  min={0}
                  inputClassName="h-10 px-3 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </Card>
          
          <Card className="mb-4 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Mô tả sản phẩm</h3>
            <div className="p-1">
              <div className="field mb-4">
                <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả chi tiết
                </label>
                <InputTextarea
                  id="productDescription"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Mỗi đặc điểm nên kết thúc bằng dấu chấm (.)"
                />
                <small className="text-gray-500 mt-1 block">Các đặc điểm được phân tách bằng dấu chấm (.)</small>
              </div>
              
              <div className="field mb-4">
                <label htmlFor="productIntroduction" className="block text-sm font-medium text-gray-700 mb-2">
                  Giới thiệu sản phẩm
                </label>
                <InputTextarea
                  id="productIntroduction"
                  name="productIntroduction"
                  value={product.productIntroduction}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Giới thiệu ngắn gọn về sản phẩm"
                />
              </div>
              
              <div className="field mb-4">
                <label htmlFor="productDetails" className="block text-sm font-medium text-gray-700 mb-2">
                  Chi tiết sản phẩm
                </label>
                <InputTextarea
                  id="productDetails"
                  name="productDetails"
                  value={product.productDetails}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Thông tin chi tiết về đặc tính, công dụng của sản phẩm"
                />
              </div>
              
              <div className="field">
                <label htmlFor="productInfo" className="block text-sm font-medium text-gray-700 mb-2">
                  Thông tin bổ sung
                </label>
                <InputText
                  id="productInfo"
                  name="productInfo"
                  value={product.productInfo}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  placeholder="Thông tin thêm về sản phẩm"
                />
              </div>
            </div>
          </Card>
          
          <Card className="mb-4 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Hình ảnh sản phẩm <span className="text-red-500">*</span>
            </h3>
            <div className="flex flex-wrap gap-3 p-1">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-32 h-32 object-cover rounded-md border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <i className="pi pi-plus text-2xl text-gray-400 mb-2"></i>
                <span className="text-sm text-gray-500 text-center px-2">Thêm ảnh</span>
              </label>
            </div>
            <small className="text-gray-500 mt-2 block p-1">Hình ảnh tốt nhất ở định dạng JPG, PNG với tỷ lệ 1:1</small>
          </Card>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              label="Hủy"
              icon="pi pi-times"
              onClick={() => setVisible(false)}
              className="p-button-sm h-11 px-4 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 transition-colors"
              style={{ minWidth: '120px', fontWeight: '500' }}
            />
            <Button
              type="submit"
              label="Thêm sản phẩm"
              icon="pi pi-check"
              loading={isSubmitting}
              className="p-button-sm h-11 px-4 rounded-md bg-[#51bb1a] hover:bg-[#45a011] border-[#51bb1a] hover:border-[#45a011] text-white transition-colors shadow-sm"
              style={{ minWidth: '160px', fontWeight: '500' }}
            />
          </div>
        </form>
      </Scrollbars>
      <ToastContainer />
    </div>
  );
};

AddProduct.propTypes = {
  setVisible: PropTypes.func.isRequired,
  onProductAdd: PropTypes.func,
};

export default AddProduct;
