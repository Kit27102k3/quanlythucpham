/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Scrollbars } from "react-custom-scrollbars-2";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Card } from "primereact/card";
import { toast } from "sonner";
import categoriesApi from "../../api/categoriesApi";
import productsApi from "../../api/productsApi";

const EditProduct = ({
  product,
  setVisible,
  onUpdateSuccess,
  setProducts,
}) => {
  const [categories, setCategories] = useState([]);
  const [editedProduct, setEditedProduct] = useState({
    ...product,
    productDescription: product.productDescription
      ? product.productDescription.join(". ")
      : "",
  });

  const [imagePreviews, setImagePreviews] = useState(
    product.productImages || []
  );
  const [newImages, setNewImages] = useState([]);
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
    fetchCategories();
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
        console.log("Found category:", selectedCat);
        
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
    } else {
      setEditedProduct((prev) => ({
        ...prev,
        [name]: e.value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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
        keepImages: keepImages,
        newImageUrls: newImages,
      };

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
                <InputText
                  id="productBrand"
                  name="productBrand"
                  value={editedProduct.productBrand ?? ""}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  placeholder="Nhập thương hiệu"
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
                  Trọng lượng (gram)
                </label>
                <InputNumber
                  id="productWeight"
                  value={parseInt(editedProduct.productWeight) || 0}
                  onValueChange={(e) => handleNumberChange(e, "productWeight")}
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
