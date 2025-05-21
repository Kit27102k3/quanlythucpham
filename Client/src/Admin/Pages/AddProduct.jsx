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

import productsApi from "../../api/productsApi";
import categoriesApi from "../../api/categoriesApi";
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
  productUnit: "gram",
  discountStartDate: null,
  discountEndDate: null,
  expiryDate: null,
};

const AddProduct = ({ onHide, onAddSuccess }) => {
  const [product, setProduct] = useState(INITIAL_PRODUCT_STATE);
  const [productDescription, setProductDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAllCategories();
        console.log("Fetched categories:", response);

        if (Array.isArray(response)) {
          // Log each category to see their structure
          response.forEach((cat) => {
            console.log(
              `Category: ${cat.nameCategory}, ID: ${cat._id}, Code: ${cat.codeCategory}`
            );
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
  }, []);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const generateProductCode = (categoryId) => {
    // Tìm thông tin danh mục được chọn
    const selectedCat = categories.find((cat) => cat._id === categoryId);
    if (!selectedCat) return "";

    // Lấy mã loại từ danh mục
    const categoryCode = selectedCat.codeCategory;

    // Tìm sản phẩm có cùng mã loại để tạo số thứ tự
    const getNextSequenceNumber = async () => {
      try {
        const products = await productsApi.getAllProducts();
        // Lọc sản phẩm cùng mã loại và có mã sản phẩm dạng CATXXX-NNN
        const regex = new RegExp(`^${categoryCode}-\\d{3}$`);
        const matchingProducts = products.filter((p) =>
          regex.test(p.productCode)
        );

        if (matchingProducts.length === 0) return `${categoryCode}-001`;

        // Tìm số thứ tự lớn nhất hiện tại
        const maxSequence = Math.max(
          ...matchingProducts.map((p) => {
            const match = p.productCode.match(/-(\d{3})$/);
            return match ? parseInt(match[1], 10) : 0;
          })
        );

        // Tăng số thứ tự lên 1
        const nextSequence = maxSequence + 1;
        return `${categoryCode}-${nextSequence.toString().padStart(3, "0")}`;
      } catch (error) {
        console.error("Lỗi khi tạo mã sản phẩm:", error);
        return `${categoryCode}-001`;
      }
    };

    getNextSequenceNumber().then((code) => {
      setProduct((prev) => ({
        ...prev,
        productCode: code,
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
      [name]: e.value !== null ? e.value.toString() : "0",
    }));

    // Khi thay đổi giảm giá, kiểm tra và bật/tắt tùy chọn thời hạn giảm giá
    if (name === "productDiscount") {
      setHasDiscount(e.value > 0);

      if (e.value === 0 || e.value === null) {
        // Xóa thời hạn giảm giá khi đặt giảm giá = 0
        setProduct((prev) => ({
          ...prev,
          discountStartDate: null,
          discountEndDate: null,
        }));
      }
    }
  };

  const handleDateChange = (date, name) => {
    setProduct((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  const handleDropdownChange = (e, name) => {
    if (name === "productCategory") {
      const categoryId = e.value;

      console.log("Selected category ID:", categoryId);

      // Tìm tên danh mục dựa vào ID
      const selectedCat = categories.find((cat) => cat._id === categoryId);
      if (selectedCat) {
        console.log("Found category:", selectedCat);

        setProduct((prev) => ({
          ...prev,
          productCategory: categoryId,
          productTypeName: selectedCat.nameCategory,
        }));

        // Generate product code after setting category
        generateProductCode(categoryId);
      } else {
        console.error("Category not found for ID:", categoryId);
        toast.error("Không tìm thấy danh mục đã chọn. Vui lòng thử lại.");

        setProduct((prev) => ({
          ...prev,
          productCategory: categoryId,
        }));
      }
    } else if (name === "productBrand") {
      const brandId = e.value;
      const selectedBrand = brands.find((brand) => brand._id === brandId);

      setProduct((prev) => ({
        ...prev,
        productBrand: selectedBrand ? selectedBrand.name : "",
        productBrandId: brandId,
      }));
    } else if (name === "productSupplier") {
      const supplierId = e.value;
      const selectedSupplier = suppliers.find(
        (supplier) => supplier._id === supplierId
      );

      setProduct((prev) => ({
        ...prev,
        productSupplier: selectedSupplier ? selectedSupplier.name : "",
        productSupplierId: supplierId,
      }));
    } else if (name === "productUnit") {
      setProduct((prev) => ({
        ...prev,
        productUnit: e.value,
      }));
    } else {
      setProduct((prev) => ({
        ...prev,
        [name]: e.value,
      }));
    }
  };

  const handleCloudinaryUpload = () => {
    if (typeof window.cloudinary === "undefined") {
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
          setImagePreviews((prev) => [...prev, imageUrl]);

          // Add to product images
          setProduct((prev) => ({
            ...prev,
            productImages: [...prev.productImages, imageUrl],
          }));
        } else if (error) {
          console.error("Error uploading image:", error);
          toast.error("Lỗi khi tải ảnh lên Cloudinary");
        }
      }
    );

    widget.open();
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

    if (
      !product.productName ||
      !product.productPrice ||
      !product.productCategory
    ) {
      toast.error(
        "Vui lòng điền đầy đủ thông tin bắt buộc: Tên, Giá và Danh mục"
      );
      return;
    }

    if (product.productImages.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hình ảnh sản phẩm");
      return;
    }

    // Kiểm tra thời hạn giảm giá
    if (hasDiscount && product.discountStartDate && product.discountEndDate) {
      const startDate = new Date(product.discountStartDate);
      const endDate = new Date(product.discountEndDate);

      if (startDate > endDate) {
        toast.error("Ngày bắt đầu giảm giá không thể sau ngày kết thúc");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Tìm tên danh mục dựa vào ID đã chọn
      const selectedCat = categories.find(
        (cat) => cat._id === product.productCategory
      );
      if (!selectedCat) {
        toast.error("Không tìm thấy thông tin danh mục đã chọn");
        setIsSubmitting(false);
        return;
      }

      console.log("Sử dụng tên danh mục:", selectedCat.nameCategory);

      // Create data object for API request
      const productData = {
        productName: product.productName,
        productPrice: product.productPrice,
        productCategory: selectedCat.nameCategory,
        productBrand: product.productBrand || "",
        productBrandId: product.productBrandId || null,
        productSupplier: product.productSupplier || "",
        productSupplierId: product.productSupplierId || null,
        productStatus: product.productStatus || "Còn hàng",
        productDiscount: product.productDiscount || "0",
        productStock: product.productStock || "0",
        productCode: product.productCode || "",
        productWeight: product.productWeight || "0",
        productOrigin: product.productOrigin || "",
        productIntroduction: product.productIntroduction || "",
        productInfo: product.productInfo || "",
        productDetails: product.productDetails || "",
        productTypeName: selectedCat.nameCategory,
        productUnit: product.productUnit || "gram",
        imageUrls: product.productImages, // Use Cloudinary URLs
      };

      // Add discount dates if applicable
      if (hasDiscount && product.discountStartDate) {
        productData.discountStartDate = product.discountStartDate.toISOString();
      }
      if (hasDiscount && product.discountEndDate) {
        productData.discountEndDate = product.discountEndDate.toISOString();
      }

      // Add expiry date if set
      if (product.expiryDate) {
        productData.expiryDate = product.expiryDate.toISOString();
      }

      // Add description
      const descriptions = productDescription
        .split(".")
        .map((desc) => desc.trim())
        .filter((desc) => desc !== "");
      productData.productDescription = JSON.stringify(descriptions);

      const response = await productsApi.createProduct(productData);
      toast.success("Thêm sản phẩm thành công!");
      if (onAddSuccess) {
        onAddSuccess(response.data);
      }
      onHide();
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
        const categoryDetails = await productsApi.checkCategory(
          product.productCategory
        );
        console.log("Category details:", categoryDetails);
        toast.success("✅ Danh mục tồn tại và hợp lệ!");
      } catch (error) {
        console.error("Category check failed:", error);
        toast.error(`❌ Kiểm tra danh mục thất bại: ${error.message}`);
        return;
      }

      // Second test: Try creating a test product
      const result = await productsApi.testProductCreation(
        product.productCategory
      );

      if (result.success) {
        toast.success("✅ Kiểm tra tạo sản phẩm thành công!");
      } else {
        toast.error(
          `❌ Kiểm tra tạo sản phẩm thất bại: ${
            result.error?.message || "Lỗi không xác định"
          }`
        );
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
                  value={product.productName}
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
                  value={product.productCategory}
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
                <div className="mt-2">
                  <Button
                    type="button"
                    icon="pi pi-check"
                    label="Kiểm tra danh mục"
                    onClick={testCategoryAPI}
                    className="p-button-sm h-8 px-3 text-xs rounded-md bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 text-white"
                  />
                  <small className="text-gray-500 ml-2">
                    Kiểm tra xem danh mục có hợp lệ với API không
                  </small>
                </div>
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
                  value={parseFloat(product.productPrice) || null}
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
                <InputText
                  id="productStatus"
                  value="Còn hàng"
                  className="w-full h-10 px-3 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  placeholder="Còn hàng"
                  disabled
                />
                <small className="text-gray-500 mt-1 block">
                  Sản phẩm mới luôn ở trạng thái &quot;Còn hàng&quot;
                </small>
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
                  value={product.productBrandId}
                  onChange={(e) => handleDropdownChange(e, "productBrand")}
                  options={brands.map((brand) => ({
                    label: brand.name,
                    value: brand._id,
                  }))}
                  optionLabel="label"
                  filter
                  className="w-full border border-gray-300 rounded-md"
                  placeholder="Chọn thương hiệu"
                  emptyMessage="Không tìm thấy thương hiệu"
                  emptyFilterMessage="Không tìm thấy kết quả"
                  appendTo="self"
                  style={{ height: "2.5rem" }}
                  panelClassName="z-50"
                  itemTemplate={(option) => (
                    <div className="px-3 py-2 hover:bg-gray-100">
                      {option.label}
                    </div>
                  )}
                  filterPlaceholder="Tìm thương hiệu..."
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
                        placeholder="Tìm thương hiệu..."
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
                  htmlFor="productSupplier"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nhà cung cấp
                </label>
                <Dropdown
                  id="productSupplier"
                  value={product.productSupplierId}
                  onChange={(e) => handleDropdownChange(e, "productSupplier")}
                  options={suppliers.map((supplier) => ({
                    label: supplier.name,
                    value: supplier._id,
                  }))}
                  optionLabel="label"
                  filter
                  className="w-full border border-gray-300 rounded-md"
                  placeholder="Chọn nhà cung cấp"
                  emptyMessage="Không tìm thấy nhà cung cấp"
                  emptyFilterMessage="Không tìm thấy kết quả"
                  appendTo="self"
                  style={{ height: "2.5rem" }}
                  panelClassName="z-50"
                  itemTemplate={(option) => (
                    <div className="px-3 py-2 hover:bg-gray-100">
                      {option.label}
                    </div>
                  )}
                  filterPlaceholder="Tìm nhà cung cấp..."
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
                        placeholder="Tìm nhà cung cấp..."
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
                  htmlFor="productOrigin"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
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
                <label
                  htmlFor="productStock"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Số lượng tồn kho
                </label>
                <InputNumber
                  id="productStock"
                  value={parseInt(product.productStock) || 0}
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
                  value={parseInt(product.productDiscount) || 0}
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
                      <label
                        htmlFor="discountStartDate"
                        className="block text-sm text-gray-600 mb-1"
                      >
                        Từ ngày
                      </label>
                      <Calendar
                        id="discountStartDate"
                        value={product.discountStartDate}
                        onChange={(e) =>
                          handleDateChange(e.value, "discountStartDate")
                        }
                        showIcon
                        className="w-full"
                        dateFormat="dd/mm/yy"
                        placeholder="Chọn ngày bắt đầu"
                        minDate={new Date()}
                        appendTo="self"
                        panelClassName="z-50 shadow-lg rounded-lg border border-gray-200"
                        pt={{
                          root: { className: "z-50" },
                          panel: { className: "z-50 rounded-lg" },
                          input: {
                            className:
                              "border border-gray-300 rounded-md h-10 w-full",
                            style: { height: "2.5rem" },
                          },
                          button: {
                            className: "text-blue-500 hover:text-blue-700",
                          },
                          monthNavigator: { className: "text-sm font-medium" },
                          yearNavigator: { className: "text-sm font-medium" },
                          header: { className: "bg-gray-50 rounded-t-lg p-2" },
                          footer: { className: "bg-gray-50 rounded-b-lg p-2" },
                          today: {
                            className:
                              "bg-blue-100 text-blue-700 hover:bg-blue-200",
                          },
                          day: { className: "rounded hover:bg-blue-50" },
                          selectedDay: {
                            className:
                              "bg-blue-500 text-white rounded hover:bg-blue-600",
                          },
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="discountEndDate"
                        className="block text-sm text-gray-600 mb-1"
                      >
                        Đến ngày
                      </label>
                      <Calendar
                        id="discountEndDate"
                        value={product.discountEndDate}
                        onChange={(e) =>
                          handleDateChange(e.value, "discountEndDate")
                        }
                        showIcon
                        className="w-full"
                        dateFormat="dd/mm/yy"
                        placeholder="Chọn ngày kết thúc"
                        minDate={product.discountStartDate || new Date()}
                        appendTo="self"
                        panelClassName="z-50 shadow-lg rounded-lg border border-gray-200"
                        pt={{
                          root: { className: "z-50" },
                          panel: { className: "z-50 rounded-lg" },
                          input: {
                            className:
                              "border border-gray-300 rounded-md h-10 w-full",
                            style: { height: "2.5rem" },
                          },
                          button: {
                            className: "text-blue-500 hover:text-blue-700",
                          },
                          monthNavigator: { className: "text-sm font-medium" },
                          yearNavigator: { className: "text-sm font-medium" },
                          header: { className: "bg-gray-50 rounded-t-lg p-2" },
                          footer: { className: "bg-gray-50 rounded-b-lg p-2" },
                          today: {
                            className:
                              "bg-blue-100 text-blue-700 hover:bg-blue-200",
                          },
                          day: { className: "rounded hover:bg-blue-50" },
                          selectedDay: {
                            className:
                              "bg-blue-500 text-white rounded hover:bg-blue-600",
                          },
                        }}
                      />
                    </div>
                  </div>
                  <small className="text-gray-500 mt-1 block">
                    Sau khi hết thời hạn giảm giá, giá sản phẩm sẽ tự động trở
                    về giá gốc.
                  </small>
                </div>
              )}

              <div className="field">
                <label
                  htmlFor="expiryDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Hạn sử dụng
                </label>
                <Calendar
                  id="expiryDate"
                  value={product.expiryDate}
                  onChange={(e) => handleDateChange(e.value, "expiryDate")}
                  showIcon
                  className="w-full"
                  dateFormat="dd/mm/yy"
                  placeholder="Chọn hạn sử dụng"
                  minDate={new Date()}
                  appendTo="self"
                  panelClassName="z-50 shadow-lg rounded-lg border border-gray-200"
                  pt={{
                    root: { className: "z-50" },
                    panel: { className: "z-50 rounded-lg" },
                    input: {
                      className:
                        "border border-gray-300 rounded-md h-10 w-full",
                      style: { height: "2.5rem" },
                    },
                    button: { className: "text-blue-500 hover:text-blue-700" },
                    monthNavigator: { className: "text-sm font-medium" },
                    yearNavigator: { className: "text-sm font-medium" },
                    header: { className: "bg-gray-50 rounded-t-lg p-2" },
                    footer: { className: "bg-gray-50 rounded-b-lg p-2" },
                    today: {
                      className: "bg-blue-100 text-blue-700 hover:bg-blue-200",
                    },
                    day: { className: "rounded hover:bg-blue-50" },
                    selectedDay: {
                      className:
                        "bg-blue-500 text-white rounded hover:bg-blue-600",
                    },
                  }}
                />
                <small className="text-gray-500 mt-1 block">
                  Sản phẩm sẽ tự động chuyển sang trạng thái "Hết hàng" khi quá
                  hạn sử dụng
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
                    {product.productCode || "Chọn danh mục để tạo mã"}
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
                    value={parseInt(product.productWeight) || 0}
                    onValueChange={(e) =>
                      handleNumberChange(e, "productWeight")
                    }
                    className="w-2/3 h-10 flex items-center"
                    placeholder="0"
                    min={0}
                    inputClassName="h-10 px-3 border border-gray-300 rounded-md"
                  />
                  <Dropdown
                    id="productUnit"
                    value={product.productUnit}
                    options={MEASUREMENT_UNITS}
                    onChange={(e) => handleDropdownChange(e, "productUnit")}
                    className="w-1/3 border border-gray-300 rounded-md p-2"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Đơn vị"
                    appendTo="self"
                    panelClassName="z-50"
                    itemTemplate={(option) => (
                      <div className="px-3 py-2 hover:bg-gray-100">
                        {option.label}
                      </div>
                    )}
                  />
                </div>
                <small className="text-gray-500 mt-1 block">
                  Chọn đơn vị phù hợp: gram (g), kilogram (kg), milliliter (ml),
                  lít (l), cái, hộp, chai...
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
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
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
                  value={product.productIntroduction}
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
                  value={product.productDetails}
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
              <button
                type="button"
                onClick={handleCloudinaryUpload}
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <i className="pi pi-cloud-upload text-2xl text-gray-400 mb-2"></i>
                <span className="text-sm text-gray-500 text-center px-2">
                  Tải ảnh lên
                </span>
              </button>
            </div>
            <small className="text-gray-500 mt-2 block p-1">
              Hình ảnh tốt nhất ở định dạng JPG, PNG với tỷ lệ 1:1
            </small>
          </Card>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              label="Hủy"
              icon="pi pi-times"
              onClick={onHide}
              className="p-button-sm h-11 px-4 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 transition-colors"
              style={{ minWidth: "120px", fontWeight: "500" }}
            />
            <Button
              type="submit"
              label="Thêm sản phẩm"
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

AddProduct.propTypes = {
  onHide: PropTypes.func.isRequired,
  onAddSuccess: PropTypes.func,
};

export default AddProduct;
