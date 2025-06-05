/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Scrollbars } from "react-custom-scrollbars-2";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Card } from "primereact/card";
import { Calendar } from "primereact/calendar";
import { toast } from "sonner";
import categoriesApi from "../../api/categoriesApi";
import productsApi from "../../api/productsApi";
import * as brandsApi from "../../api/brandsApi";
import suppliersApi from "../../api/suppliersApi";

// Danh sách đơn vị đo lường
const MEASUREMENT_UNITS = [
  { label: "Gram (g)", value: "gram" },
  { label: "Kilogram (kg)", value: "kg" },
  { label: "Mililít (ml)", value: "ml" },
  { label: "Lít (l)", value: "l" },
  { label: "Cái", value: "cái" },
  { label: "Hộp", value: "hộp" },
  { label: "Chai", value: "chai" },
  { label: "Gói", value: "gói" },
  { label: "Lon", value: "lon" },
];

const EditProduct = ({
  product,
  setVisible,
  onUpdateSuccess,
  setProducts,
}) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editedProduct, setEditedProduct] = useState({
    ...product,
    productPrice: product.productPrice?.toString() || "0",
    productDiscount: product.productDiscount?.toString() || "0",
    productStock: product.productStock?.toString() || "0",
    productWeight: product.productWeight?.toString() || "0",
    productPromoPrice: product.productPromoPrice?.toString() || "0",
    productWarranty: product.productWarranty?.toString() || "0",
    productDescription: product.productDescription?.join(". ") || "",
    discountStartDate: product.discountStartDate ? new Date(product.discountStartDate) : null,
    discountEndDate: product.discountEndDate ? new Date(product.discountEndDate) : null,
    expiryDate: product.expiryDate ? new Date(product.expiryDate) : null,
    productBrandId: product.productBrandId || null,
    productSupplierId: product.productSupplierId || null,
  });

  const [imagePreviews, setImagePreviews] = useState(
    product.productImages || []
  );
  const [newImages, setNewImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hasDiscount, setHasDiscount] = useState(parseFloat(product.productDiscount) > 0);

  // Thêm state quản lý đơn vị đo
  const [unitOptionsList, setUnitOptionsList] = useState(
    product.unitOptions?.length > 0
      ? product.unitOptions.map(opt => ({
          unit: opt.unit || 'gram',
          price: opt.price?.toString() || product.productPrice?.toString() || "0",
          conversionRate: opt.conversionRate || 1,
          inStock: opt.inStock?.toString() || product.productStock?.toString() || "0",
          isDefault: opt.isDefault || false
        }))
      : [{ 
          unit: product.productUnit || 'gram', 
          price: product.productPrice?.toString() || "0", 
          conversionRate: 1, 
          inStock: product.productStock?.toString() || "0", 
          isDefault: true 
        }]
  );

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

          // Find and set selected category
          if (product.productCategory) {
            const categoryObj = response.find(cat => cat.nameCategory === product.productCategory);
            if (categoryObj) {
              setSelectedCategory(categoryObj._id);
            }
          }
        } else {
          toast.error("Dữ liệu danh mục không hợp lệ");
        }
      } catch (error) {
        toast.error("Không thể tải danh mục sản phẩm");
        console.error("Lỗi khi lấy danh mục:", error);
      }
    };
    
    const fetchBrands = async () => {
      try {
        const response = await brandsApi.getAllBrands();
        if (Array.isArray(response)) {
          setBrands(response);
        } else {
          console.error("Dữ liệu thương hiệu không hợp lệ:", response);
          toast.error("Không thể tải danh sách thương hiệu");
        }
      } catch (error) {
        console.error("Lỗi khi lấy thương hiệu:", error);
        toast.error("Không thể tải danh sách thương hiệu");
      }
    };
    
    const fetchSuppliers = async () => {
      try {
        const response = await suppliersApi.getAllSuppliers();
        if (Array.isArray(response)) {
          setSuppliers(response);
        } else if (response && Array.isArray(response.suppliers)) {
          setSuppliers(response.suppliers);
        } else {
          console.error("Dữ liệu nhà cung cấp không hợp lệ:", response);
          toast.error("Không thể tải danh sách nhà cung cấp");
        }
      } catch (error) {
        console.error("Lỗi khi lấy nhà cung cấp:", error);
        toast.error("Không thể tải danh sách nhà cung cấp");
      }
    };
    
    fetchCategories();
    fetchBrands();
    fetchSuppliers();
  }, [product.productCategory]);

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
    
    // Only generate new code if product doesn't already have one or category changed
    if (!editedProduct.productCode || editedProduct.productCategory !== selectedCat.nameCategory) {
      getNextSequenceNumber().then(code => {
        setEditedProduct(prev => ({
          ...prev,
          productCode: code
        }));
      });
    }
    
    return editedProduct.productCode || `${categoryCode}-XXX`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e, name) => {
    const newValue = e.value.toString();
    setEditedProduct((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    
    // Nếu đang cập nhật số lượng tồn kho, cập nhật trạng thái tương ứng
    if (name === "productStock") {
      const newStock = parseInt(newValue) || 0;
      const newStatus = newStock > 0 ? "Còn hàng" : "Hết hàng";
      
      setEditedProduct(prev => ({
        ...prev,
        productStatus: newStatus
      }));
    }
    
    // Nếu cập nhật giảm giá
    if (name === "productDiscount") {
      const hasDiscountValue = parseFloat(newValue) > 0;
      setHasDiscount(hasDiscountValue);
      
      // Nếu bỏ giảm giá, xóa ngày giảm giá
      if (!hasDiscountValue) {
        setEditedProduct(prev => ({
          ...prev,
          discountStartDate: null,
          discountEndDate: null
        }));
      }
    }
  };

  // Thêm hàm xử lý sự kiện thay đổi ngày
  const handleDateChange = (date, name) => {
    setEditedProduct(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleCloudinaryUpload = () => {
    if (typeof window.cloudinary === 'undefined') {
      toast.error("Cloudinary widget không khả dụng");
      return;
    }
    
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: "drlxpdaub",
        uploadPreset: "quanlythucpham",
        sources: ["local", "url", "camera"],
        multiple: true,
        clientAllowedFormats: ["jpg", "png", "jpeg", "gif"],
        maxFileSize: 5000000, // 5MB
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          const imageUrl = result.info.secure_url;
          console.log("Image uploaded successfully:", imageUrl);
          
          // Add to image previews
          setImagePreviews(prev => [...prev, imageUrl]);
          
          // Add new URL to newImages array
          setNewImages(prev => [...prev, imageUrl]);
        } else if (error) {
          console.error("Error uploading image:", error);
          toast.error("Lỗi khi tải ảnh lên Cloudinary");
        }
      }
    );
    
    widget.open();
  };

  const handleRemoveImage = (index) => {
    // If it's a new image
    if (index >= product.productImages.length) {
      const newImageIndex = index - product.productImages.length;
      setNewImages(prev => prev.filter((_, i) => i !== newImageIndex));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDropdownChange = (e, name) => {
    if (name === 'productCategory') {
      const categoryId = e.value;
      setSelectedCategory(categoryId);
      
      console.log("Selected category ID:", categoryId);
      
      // Tìm tên danh mục dựa vào ID
      const selectedCat = categories.find(cat => cat._id === categoryId);
      if (selectedCat) {
       
        setEditedProduct(prev => ({
          ...prev,
          productCategory: selectedCat.nameCategory,
          productTypeName: selectedCat.nameCategory
        }));
        
        // Generate product code after setting category
        generateProductCode(categoryId);
      } else {
        console.error("Category not found for ID:", categoryId);
        toast.error("Không tìm thấy danh mục đã chọn. Vui lòng thử lại.");
      }
    } else if (name === 'productBrand') {
      const brandId = e.value;
      const selectedBrand = brands.find(brand => brand._id === brandId);
      
      setEditedProduct(prev => ({
        ...prev,
        productBrand: selectedBrand ? selectedBrand.name : "",
        productBrandId: brandId
      }));
    } else if (name === 'productSupplier') {
      const supplierId = e.value;
      const selectedSupplier = suppliers.find(supplier => supplier._id === supplierId);
      
      setEditedProduct(prev => ({
        ...prev,
        productSupplier: selectedSupplier ? selectedSupplier.name : "",
        productSupplierId: supplierId
      }));
    } else if (name === 'productUnit') {
      setEditedProduct(prev => ({
        ...prev,
        productUnit: e.value
      }));
    } else {
      setEditedProduct((prev) => ({
        ...prev,
        [name]: e.value,
      }));
    }
  };

  // Thêm hàm xử lý thay đổi đơn vị đo
  const handleUnitOptionChange = (index, field, value) => {
    const updatedOptions = [...unitOptionsList];
    updatedOptions[index][field] = value;
    setUnitOptionsList(updatedOptions);
  };

  // Thêm hàm để thêm đơn vị đo mới
  const addUnitOption = () => {
    setUnitOptionsList([
      ...unitOptionsList,
      { unit: "", price: "", conversionRate: 1, inStock: 0, isDefault: false }
    ]);
  };

  // Thêm hàm để xóa đơn vị đo
  const removeUnitOption = (index) => {
    const updatedOptions = [...unitOptionsList];
    updatedOptions.splice(index, 1);
    
    // Nếu xóa đơn vị mặc định, đặt đơn vị đầu tiên là mặc định
    if (unitOptionsList[index].isDefault && updatedOptions.length > 0) {
      updatedOptions[0].isDefault = true;
    }
    
    setUnitOptionsList(updatedOptions);
  };

  // Thêm hàm để đặt đơn vị mặc định
  const setDefaultUnit = (index) => {
    const updatedOptions = unitOptionsList.map((option, i) => ({
      ...option,
      isDefault: i === index
    }));
    setUnitOptionsList(updatedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Chuẩn bị dữ liệu unitOptions
      const preparedUnitOptions = unitOptionsList.map(option => ({
        unit: option.unit,
        price: parseFloat(option.price) || parseFloat(editedProduct.productPrice),
        conversionRate: parseFloat(option.conversionRate) || 1,
        inStock: parseInt(option.inStock) || parseInt(editedProduct.productStock) || 0,
        isDefault: option.isDefault
      }));
      
      // Validate thông tin unitOptions
      if (preparedUnitOptions.length > 0) {
        const hasDefault = preparedUnitOptions.some(opt => opt.isDefault);
        if (!hasDefault) {
          preparedUnitOptions[0].isDefault = true;
        }
      }
      
      // Cập nhật giá và đơn vị mặc định từ unitOptions
      const defaultOption = preparedUnitOptions.find(opt => opt.isDefault);
      if (defaultOption) {
        editedProduct.productPrice = defaultOption.price.toString();
        editedProduct.productUnit = defaultOption.unit;
        editedProduct.productStock = defaultOption.inStock.toString();
      }

      // Validate required fields
      if (
        !editedProduct.productName ||
        !editedProduct.productPrice ||
        !selectedCategory
      ) {
        toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
        setIsSubmitting(false);
        return;
      }
      
      // Kiểm tra thời gian giảm giá
      if (hasDiscount && editedProduct.discountStartDate && editedProduct.discountEndDate) {
        const startDate = new Date(editedProduct.discountStartDate);
        const endDate = new Date(editedProduct.discountEndDate);
        
        if (startDate > endDate) {
          toast.error("Ngày bắt đầu giảm giá không thể sau ngày kết thúc");
          setIsSubmitting(false);
          return;
        }
      }

      const category = categories.find((cat) => cat._id === selectedCategory);
      if (!category) {
        toast.error("Danh mục không hợp lệ");
        setIsSubmitting(false);
        return;
      }

      // Add description
      const descString = typeof editedProduct.productDescription === 'string' 
        ? editedProduct.productDescription
        : (Array.isArray(editedProduct.productDescription) 
           ? editedProduct.productDescription.join(". ")
           : "");
           
      const descriptions = descString
        .split(".")
        .map((desc) => desc.trim())
        .filter((desc) => desc !== "");
      
      // Handle existing images vs new images
      // Keep track of which existing images to retain
      const keepImages = [];
      product.productImages.forEach((img) => {
        if (imagePreviews.includes(img)) {
          keepImages.push(img);
        }
      });
      
      // Create data object for API request instead of FormData
      const productData = {
        ...editedProduct,
        productCategory: category.nameCategory,
        productTypeName: category.nameCategory,
        productDescription: JSON.stringify(descriptions),
        productBrandId: editedProduct.productBrandId,
        productSupplierId: editedProduct.productSupplierId,
        keepImages: keepImages,
        newImageUrls: newImages,
        unitOptions: preparedUnitOptions
      };
      
      // Format dates for API
      if (hasDiscount && editedProduct.discountStartDate) {
        productData.discountStartDate = editedProduct.discountStartDate.toISOString();
      } else {
        productData.discountStartDate = null;
      }
      
      if (hasDiscount && editedProduct.discountEndDate) {
        productData.discountEndDate = editedProduct.discountEndDate.toISOString();
      } else {
        productData.discountEndDate = null;
      }
      
      // Add expiry date if set
      if (editedProduct.expiryDate) {
        productData.expiryDate = editedProduct.expiryDate.toISOString();
      }

      console.log("Product data being submitted:", productData);
      
      const response = await onUpdateSuccess(editedProduct._id, productData);
      toast.success("Cập nhật sản phẩm thành công!");
      if (response?.data?.product && setProducts) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === editedProduct._id ? response.data.product : p
          )
        );
      }
      setVisible(false);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi không xác định";
      toast.error(`Cập nhật sản phẩm thất bại: ${errorMessage}`);
      console.error("Chi tiết lỗi:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [imagePreviews]);

  useEffect(() => {
    if (product) {
      setEditedProduct({
        ...product,
        productDescription: product.productDescription
          ? product.productDescription.join(". ")
          : "",
      });
    }
  }, [product]);

  // Thêm useEffect để cập nhật trạng thái dựa trên số lượng tồn kho
  useEffect(() => {
    // Tự động cập nhật trạng thái sản phẩm dựa vào số lượng tồn kho
    if (editedProduct.productStock && parseInt(editedProduct.productStock) > 0) {
      setEditedProduct(prev => ({
        ...prev,
        productStatus: "Còn hàng"
      }));
    } else if (editedProduct.productStock === "0" || parseInt(editedProduct.productStock) === 0) {
      setEditedProduct(prev => ({
        ...prev,
        productStatus: "Hết hàng"
      }));
    }
  }, [editedProduct.productStock]);

  // Thêm useEffect để cập nhật trạng thái hasDiscount
  useEffect(() => {
    setHasDiscount(parseFloat(editedProduct.productDiscount) > 0);
  }, [editedProduct.productDiscount]);

  return (
    <div className="relative p-3">
      <Scrollbars
        style={{ width: "100%", height: "600px" }}
        renderThumbVertical={({ style, ...props }) => (
          <div
            {...props}
            style={{
              ...style,
              backgroundColor: "#c1c1c1",
              borderRadius: "4px",
              width: "6px",
            }}
          />
        )}
      >
        <form onSubmit={handleSubmit} className="p-fluid">
          <Card className="mb-4 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              <div className="field">
                <label
                  htmlFor="productName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="productName"
                  name="productName"
                  value={editedProduct.productName ?? ""}
                  onChange={handleInputChange}
                  className="w-full p-inputtext-sm h-10 px-3 border border-gray-300 rounded-md"
                  placeholder="Nhập tên sản phẩm"
                  required
                />
              </div>

              <div className="field">
                <label
                  htmlFor="productCategory"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="productCategory"
                  value={selectedCategory}
                  onChange={(e) => handleDropdownChange(e, "productCategory")}
                  options={categories.map((cat) => ({
                    label: `${cat.nameCategory} (${cat.codeCategory})`,
                    value: cat._id,
                    code: cat.codeCategory,
                  }))}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Chọn danh mục"
                  className="w-full border border-gray-300 rounded-md"
                  panelClassName="z-50"
                  filter
                  required
                  appendTo="self"
                  style={{ height: "2.5rem" }}
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
                        value={options.filterValue || ""}
                        onChange={(e) => options.filterCallback(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-sm w-full mb-2"
                        style={{ height: "36px" }}
                        autoFocus
                        placeholder="Tìm danh mục..."
                      />
                    </div>
                  )}
                  pt={{
                    input: { className: "py-2 px-3" },
                    trigger: { className: "py-2" },
                  }}
                />
              </div>

              <div className="field">
                <label
                  htmlFor="productPrice"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Giá <span className="text-red-500">*</span>
                </label>
                <InputNumber
                  id="productPrice"
                  value={parseFloat(editedProduct.productPrice) || null}
                  onValueChange={(e) => handleNumberChange(e, "productPrice")}
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
                <label
                  htmlFor="productStatus"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tình trạng
                </label>
                <Dropdown
                  id="productStatus"
                  value={editedProduct.productStatus || "Còn hàng"}
                  onChange={(e) => handleDropdownChange(e, "productStatus")}
                  options={[
                    { label: "Còn hàng", value: "Còn hàng" },
                    { label: "Hết hàng", value: "Hết hàng" },
                    { label: "Ngừng kinh doanh", value: "Ngừng kinh doanh" },
                  ]}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md bg-gray-100 flex items-center"
                  style={{ height: "2.5rem" }}
                  disabled={parseInt(editedProduct.productStock) === 0}
                  tooltip={parseInt(editedProduct.productStock) === 0 ? "Tự động đặt trạng thái 'Hết hàng' khi số lượng bằng 0" : undefined}
                  tooltipOptions={{ position: 'top' }}
                />
                {parseInt(editedProduct.productStock) === 0 && (
                  <small className="text-orange-500 mt-1 block">
                    Trạng thái tự động chuyển thành &quot;Hết hàng&quot; khi số lượng bằng 0
                  </small>
                )}
              </div>
            </div>
          </Card>

          <Card className="mb-4 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Thông tin chi tiết
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              <div className="field">
                <label
                  htmlFor="productBrand"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Thương hiệu
                </label>
                <Dropdown
                  id="productBrand"
                  value={editedProduct.productBrandId}
                  onChange={(e) => handleDropdownChange(e, 'productBrand')}
                  options={brands.map(brand => ({ 
                    label: brand.name, 
                    value: brand._id 
                  }))}
                  optionLabel="label"
                  filter
                  className="w-full border border-gray-300 rounded-md"
                  placeholder="Chọn thương hiệu"
                  emptyMessage="Không tìm thấy thương hiệu"
                  emptyFilterMessage="Không tìm thấy kết quả"
                  appendTo="self"
                  style={{ height: '2.5rem' }}
                  panelClassName="z-50"
                  itemTemplate={(option) => (
                    <div className="px-3 py-2 hover:bg-gray-100">{option.label}</div>
                  )}
                  filterPlaceholder="Tìm thương hiệu..."
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
                        placeholder="Tìm thương hiệu..." 
                      />
                    </div>
                  )}
                  pt={{ 
                    input: { className: 'py-2 px-3' },
                    trigger: { className: 'py-2' }
                  }}
                />
              </div>
              
              <div className="field">
                <label
                  htmlFor="productSupplier"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nhà cung cấp
                </label>
                <Dropdown
                  id="productSupplier"
                  value={editedProduct.productSupplierId}
                  onChange={(e) => handleDropdownChange(e, 'productSupplier')}
                  options={suppliers.map(supplier => ({ 
                    label: supplier.name, 
                    value: supplier._id 
                  }))}
                  optionLabel="label"
                  filter
                  className="w-full border border-gray-300 rounded-md"
                  placeholder="Chọn nhà cung cấp"
                  emptyMessage="Không tìm thấy nhà cung cấp"
                  emptyFilterMessage="Không tìm thấy kết quả"
                  appendTo="self"
                  style={{ height: '2.5rem' }}
                  panelClassName="z-50"
                  itemTemplate={(option) => (
                    <div className="px-3 py-2 hover:bg-gray-100">{option.label}</div>
                  )}
                  filterPlaceholder="Tìm nhà cung cấp..."
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
                        placeholder="Tìm nhà cung cấp..." 
                      />
                    </div>
                  )}
                  pt={{ 
                    input: { className: 'py-2 px-3' },
                    trigger: { className: 'py-2' }
                  }}
                />
              </div>
              
              <div className="field">
                <label
                  htmlFor="productOrigin"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Xuất xứ
                </label>
                <InputText
                  id="productOrigin"
                  name="productOrigin"
                  value={editedProduct.productOrigin ?? ""}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  placeholder="Nhập xuất xứ"
                />
              </div>

              <div className="field">
                <label
                  htmlFor="productStock"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Số lượng tồn kho
                </label>
                <InputNumber
                  id="productStock"
                  value={parseInt(editedProduct.productStock) || 0}
                  onValueChange={(e) => handleNumberChange(e, "productStock")}
                  className="w-full h-10 flex items-center"
                  placeholder="0"
                  min={0}
                  inputClassName="h-10 px-3 border border-gray-300 rounded-md"
                />
              </div>

              <div className="field">
                <label
                  htmlFor="productDiscount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Giảm giá (%)
                </label>
                <InputNumber
                  id="productDiscount"
                  value={parseInt(editedProduct.productDiscount) || 0}
                  onValueChange={(e) =>
                    handleNumberChange(e, "productDiscount")
                  }
                  suffix="%"
                  className="w-full h-10 flex items-center"
                  placeholder="0%"
                  min={0}
                  max={100}
                  inputClassName="h-10 px-3 border border-gray-300 rounded-md"
                />
              </div>
              
              {hasDiscount && (
                <div className="field col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời hạn giảm giá
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="discountStartDate" className="block text-sm text-gray-600 mb-1">
                        Từ ngày
                      </label>
                      <Calendar
                        id="discountStartDate"
                        value={editedProduct.discountStartDate}
                        onChange={(e) => handleDateChange(e.value, 'discountStartDate')}
                        showIcon
                        className="w-full"
                        dateFormat="dd/mm/yy"
                        placeholder="Chọn ngày bắt đầu"
                        minDate={new Date()}
                        appendTo="self"
                        panelClassName="z-50 shadow-lg rounded-lg border border-gray-200"
                        pt={{
                          root: { className: 'z-50' },
                          panel: { className: 'z-50 rounded-lg' },
                          input: { 
                            className: 'border border-gray-300 rounded-md h-10 w-full', 
                            style: { height: '2.5rem' } 
                          },
                          button: { className: 'text-blue-500 hover:text-blue-700' },
                          monthNavigator: { className: 'text-sm font-medium' },
                          yearNavigator: { className: 'text-sm font-medium' },
                          header: { className: 'bg-gray-50 rounded-t-lg p-2' },
                          footer: { className: 'bg-gray-50 rounded-b-lg p-2' },
                          today: { className: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                          day: { className: 'rounded hover:bg-blue-50' },
                          selectedDay: { className: 'bg-blue-500 text-white rounded hover:bg-blue-600' }
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="discountEndDate" className="block text-sm text-gray-600 mb-1">
                        Đến ngày
                      </label>
                      <Calendar
                        id="discountEndDate"
                        value={editedProduct.discountEndDate}
                        onChange={(e) => handleDateChange(e.value, 'discountEndDate')}
                        showIcon
                        className="w-full"
                        dateFormat="dd/mm/yy"
                        placeholder="Chọn ngày kết thúc"
                        minDate={editedProduct.discountStartDate || new Date()}
                        appendTo="self"
                        panelClassName="z-50 shadow-lg rounded-lg border border-gray-200"
                        pt={{
                          root: { className: 'z-50' },
                          panel: { className: 'z-50 rounded-lg' },
                          input: { 
                            className: 'border border-gray-300 rounded-md h-10 w-full', 
                            style: { height: '2.5rem' } 
                          },
                          button: { className: 'text-blue-500 hover:text-blue-700' },
                          monthNavigator: { className: 'text-sm font-medium' },
                          yearNavigator: { className: 'text-sm font-medium' },
                          header: { className: 'bg-gray-50 rounded-t-lg p-2' },
                          footer: { className: 'bg-gray-50 rounded-b-lg p-2' },
                          today: { className: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                          day: { className: 'rounded hover:bg-blue-50' },
                          selectedDay: { className: 'bg-blue-500 text-white rounded hover:bg-blue-600' }
                        }}
                      />
                    </div>
                  </div>
                  <small className="text-gray-500 mt-1 block">
                    Sau khi hết thời hạn giảm giá, giá sản phẩm sẽ tự động trở về giá gốc.
                  </small>
                </div>
              )}
              
              <div className="field">
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Hạn sử dụng
                </label>
                <Calendar
                  id="expiryDate"
                  value={editedProduct.expiryDate}
                  onChange={(e) => handleDateChange(e.value, 'expiryDate')}
                  showIcon
                  className="w-full"
                  dateFormat="dd/mm/yy"
                  placeholder="Chọn hạn sử dụng"
                  minDate={new Date()}
                  appendTo="self"
                  panelClassName="z-50 shadow-lg rounded-lg border border-gray-200"
                  pt={{
                    root: { className: 'z-50' },
                    panel: { className: 'z-50 rounded-lg' },
                    input: { 
                      className: 'border border-gray-300 rounded-md h-10 w-full', 
                      style: { height: '2.5rem' } 
                    },
                    button: { className: 'text-blue-500 hover:text-blue-700' },
                    monthNavigator: { className: 'text-sm font-medium' },
                    yearNavigator: { className: 'text-sm font-medium' },
                    header: { className: 'bg-gray-50 rounded-t-lg p-2' },
                    footer: { className: 'bg-gray-50 rounded-b-lg p-2' },
                    today: { className: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                    day: { className: 'rounded hover:bg-blue-50' },
                    selectedDay: { className: 'bg-blue-500 text-white rounded hover:bg-blue-600' }
                  }}
                />
                <small className="text-gray-500 mt-1 block">
                  Sản phẩm sẽ tự động chuyển sang trạng thái &quot;Hết hàng&quot; khi quá hạn sử dụng
                </small>
              </div>

              <div className="field">
                <label
                  htmlFor="productCode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mã sản phẩm
                </label>
                <div className="border p-3 rounded bg-gray-50 text-sm h-10 flex items-center">
                  <span className="font-medium text-blue-600">
                    {editedProduct.productCode || "Chọn danh mục để tạo mã"}
                  </span>
                </div>
                <small className="text-gray-500 mt-1 block">
                  Mã sản phẩm được tạo tự động từ mã loại
                </small>
              </div>

              <div className="field">
                <label
                  htmlFor="productWeight"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Khối lượng/Thể tích
                </label>
                <div className="flex items-center gap-2">
                  <InputNumber
                    id="productWeight"
                    value={parseInt(editedProduct.productWeight) || 0}
                    onValueChange={(e) => handleNumberChange(e, "productWeight")}
                    className="w-2/3 h-10 flex items-center"
                    placeholder="0"
                    min={0}
                    inputClassName="h-10 px-3 border border-gray-300 rounded-md"
                  />
                  <Dropdown
                    id="productUnit"
                    value={editedProduct.productUnit || 'gram'}
                    options={MEASUREMENT_UNITS}
                    onChange={(e) => handleDropdownChange(e, 'productUnit')}
                    className="w-1/3 border border-gray-300 rounded-md"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Đơn vị"
                    appendTo="self"
                    panelClassName="z-50"
                    itemTemplate={(option) => (
                      <div className="px-3 py-2 hover:bg-gray-100">{option.label}</div>
                    )}
                  />
                </div>
                <small className="text-gray-500 mt-1 block">
                  Chọn đơn vị phù hợp: gram (g), kilogram (kg), milliliter (ml), lít (l), cái, hộp, chai...
                </small>
              </div>
            </div>
          </Card>

          <Card className="mb-4 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Mô tả sản phẩm
            </h3>
            <div className="p-1">
              <div className="field mb-4">
                <label
                  htmlFor="productDescription"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mô tả chi tiết
                </label>
                <InputTextarea
                  id="productDescription"
                  value={editedProduct.productDescription ?? ""}
                  onChange={(e) =>
                    setEditedProduct((prev) => ({
                      ...prev,
                      productDescription: e.target.value,
                    }))
                  }
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Mỗi đặc điểm nên kết thúc bằng dấu chấm (.)"
                />
                <small className="text-gray-500 mt-1 block">
                  Các đặc điểm được phân tách bằng dấu chấm (.)
                </small>
              </div>

              <div className="field mb-4">
                <label
                  htmlFor="productIntroduction"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Giới thiệu sản phẩm
                </label>
                <InputTextarea
                  id="productIntroduction"
                  name="productIntroduction"
                  value={editedProduct.productIntroduction ?? ""}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Giới thiệu ngắn gọn về sản phẩm"
                />
              </div>

              <div className="field mb-4">
                <label
                  htmlFor="productDetails"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Chi tiết sản phẩm
                </label>
                <InputTextarea
                  id="productDetails"
                  name="productDetails"
                  value={editedProduct.productDetails ?? ""}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Thông tin chi tiết về đặc tính, công dụng của sản phẩm"
                />
              </div>

              <div className="field">
                <label
                  htmlFor="productInfo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Thông tin bổ sung
                </label>
                <InputText
                  id="productInfo"
                  name="productInfo"
                  value={editedProduct.productInfo ?? ""}
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
              <button
                type="button"
                onClick={handleCloudinaryUpload}
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <i className="pi pi-cloud-upload text-2xl text-gray-400 mb-2"></i>
                <span className="text-sm text-gray-500 text-center px-2">Tải ảnh lên</span>
              </button>
            </div>
            <small className="text-gray-500 mt-2 block p-1">
              Hình ảnh tốt nhất ở định dạng JPG, PNG với tỷ lệ 1:1
            </small>
          </Card>

          <Card className="mb-4 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Đơn vị đo <span className="text-red-500">*</span>
            </h3>
            <div className="border border-gray-300 rounded-md p-3 mb-2">
              <div className="mb-3">
                <div className="text-sm font-semibold mb-2">Các đơn vị đo cho sản phẩm này</div>
                
                {unitOptionsList.map((option, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">Đơn vị #{index + 1}</div>
                      <div className="flex items-center">
                        <label className="inline-flex items-center mr-3">
                          <input 
                            type="checkbox"
                            checked={option.isDefault}
                            onChange={() => setDefaultUnit(index)}
                            className="form-checkbox h-4 w-4 text-[#51bb1a]"
                          />
                          <span className="ml-2 text-sm">Đơn vị mặc định</span>
                        </label>
                        {unitOptionsList.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeUnitOption(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="pi pi-trash text-sm"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Đơn vị</label>
                        <Dropdown
                          value={option.unit}
                          options={MEASUREMENT_UNITS}
                          onChange={(e) => handleUnitOptionChange(index, 'unit', e.value)}
                          className="w-full border border-gray-300 rounded-md"
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Chọn đơn vị"
                          appendTo="self"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Giá ({option.unit})</label>
                        <InputNumber
                          value={parseFloat(option.price) || 0}
                          onValueChange={(e) => handleUnitOptionChange(index, 'price', e.value)}
                          className="w-full"
                          placeholder="Nhập giá"
                          min={0}
                          mode="currency"
                          currency="VND"
                          locale="vi-VN"
                          inputClassName="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Tỷ lệ quy đổi</label>
                        <InputNumber
                          value={parseFloat(option.conversionRate) || 1}
                          onValueChange={(e) => handleUnitOptionChange(index, 'conversionRate', e.value)}
                          className="w-full"
                          placeholder="1"
                          min={0.01}
                          step={0.01}
                          inputClassName="w-full h-10 border border-gray-300 rounded-md"
                        />
                        <small className="text-gray-500 text-xs">1 {option.unit} = {option.conversionRate} {editedProduct.productUnit}</small>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Số lượng tồn kho</label>
                        <InputNumber
                          value={parseInt(option.inStock) || 0}
                          onValueChange={(e) => handleUnitOptionChange(index, 'inStock', e.value)}
                          className="w-full"
                          placeholder="0"
                          min={0}
                          inputClassName="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addUnitOption}
                  className="flex items-center text-[#51bb1a] hover:text-[#45a011] text-sm font-medium"
                >
                  <i className="pi pi-plus mr-1"></i> Thêm đơn vị đo
                </button>
              </div>
              
              <div className="text-xs text-gray-500">
                <p>- <strong>Đơn vị mặc định</strong>: Đơn vị hiển thị chính khi khách hàng xem sản phẩm</p>
                <p>- <strong>Tỷ lệ quy đổi</strong>: Dùng để tính giữa các đơn vị (vd: 1 kg = 1000 gram, 1 thùng = 24 chai)</p>
                <p>- <strong>Ví dụ</strong>: Nước có thể bán theo chai, lốc, thùng; thịt có thể bán theo gram, kg; trái cây có thể bán theo kg, thùng</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              label="Hủy"
              icon="pi pi-times"
              onClick={() => setVisible(false)}
              className="p-button-sm h-11 px-4 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 transition-colors"
              style={{ minWidth: "120px", fontWeight: "500" }}
            />
            <Button
              type="submit"
              label="Cập nhật sản phẩm"
              icon="pi pi-check"
              loading={isSubmitting}
              className="p-button-sm h-11 px-4 rounded-md bg-[#51bb1a] hover:bg-[#45a011] border-[#51bb1a] hover:border-[#45a011] text-white transition-colors shadow-sm"
              style={{ minWidth: "160px", fontWeight: "500" }}
            />
          </div>
        </form>
      </Scrollbars>
    </div>
  );
};

EditProduct.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    productName: PropTypes.string,
    productPrice: PropTypes.string,
    productCategory: PropTypes.string,
    productBrand: PropTypes.string,
    productStatus: PropTypes.string,
    productDiscount: PropTypes.string,
    productStock: PropTypes.string,
    productCode: PropTypes.string,
    productWeight: PropTypes.string,
    productPromoPrice: PropTypes.string,
    productWarranty: PropTypes.string,
    productOrigin: PropTypes.string,
    productIntroduction: PropTypes.string,
    productInfo: PropTypes.string,
    productDetails: PropTypes.string,
    productDescription: PropTypes.arrayOf(PropTypes.string),
    productImages: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  setVisible: PropTypes.func.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  setProducts: PropTypes.func,
};

export default EditProduct;
