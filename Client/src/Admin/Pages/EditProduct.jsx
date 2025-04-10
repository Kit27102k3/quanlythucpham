import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { Scrollbars } from "react-custom-scrollbars-2";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Card } from "primereact/card";
import { toast } from "react-toastify";
import categoriesApi from "../../api/categoriesApi";

const EditProduct = ({
  product,
  setVisible,
  handleUpdateProduct,
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAllCategories();
        if (Array.isArray(response)) {
          setCategories(response);
        } else {
          toast.error("Dữ liệu danh mục không hợp lệ");
        }
      } catch (error) {
        toast.error("Không thể tải danh mục sản phẩm");
      }
    };
    fetchCategories();
  }, []);

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const previews = filesArray.map((file) => URL.createObjectURL(file));

    setImagePreviews((prev) => [...prev, ...previews]);
    setNewImages((prev) => [...prev, ...filesArray]);
  };

  const handleRemoveImage = (index) => {
    if (index >= imagePreviews.length - newImages.length) {
      setNewImages((prev) =>
        prev.filter(
          (_, i) => i !== index - (imagePreviews.length - newImages.length)
        )
      );
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct({
      ...editedProduct,
      [name]: value,
    });
  };

  const handleNumberChange = (e, name) => {
    setEditedProduct(prev => ({
      ...prev,
      [name]: e.value.toString()
    }));
  };

  const handleDropdownChange = (e, name) => {
    setEditedProduct(prev => ({
      ...prev,
      [name]: e.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      const fieldsToUpdate = [
        "productName",
        "productPrice",
        "productCategory",
        "productBrand",
        "productStatus",
        "productDiscount",
        "productStock",
        "productCode",
        "productWeight",
        "productPromoPrice",
        "productWarranty",
        "productOrigin",
        "productIntroduction",
        "productInfo",
        "productDetails",
      ];

      fieldsToUpdate.forEach((field) => {
        if (editedProduct[field] !== undefined && editedProduct[field] !== null) {
          formData.append(field, String(editedProduct[field]));
        }
      });

      const descriptions = editedProduct.productDescription
        ? editedProduct.productDescription
            .split(".")
            .map((desc) => desc.trim())
            .filter((desc) => desc !== "")
        : [];
      formData.append("productDescription", JSON.stringify(descriptions));

      // Thêm ảnh mới
      newImages.forEach((file) => {
        formData.append("productImages", file);
      });
      const currentImages = imagePreviews.filter(
        (_, index) => index < imagePreviews.length - newImages.length
      );
      formData.append("keepImages", JSON.stringify(currentImages));

      const response = await handleUpdateProduct(editedProduct._id, formData);
      toast.success("Cập nhật sản phẩm thành công!");
      setVisible(false);
      if (response?.data?.product && setProducts) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === editedProduct._id ? response.data.product : p
          )
        );
      }
    } catch (error) {
      console.error("Chi tiết lỗi:", {
        message: error.message,
        response: error.response?.data,
      });
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật sản phẩm"
      );
    } finally {
      setIsSubmitting(false);
      newImages.forEach((file) => URL.revokeObjectURL(file.preview));
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
      });
    }
  }, [product]);

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
                  value={editedProduct.productName ?? ""}
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
                  value={editedProduct.productCategory}
                  onChange={(e) => {
                    handleDropdownChange(e, 'productCategory');
                    
                    // Tìm thông tin danh mục được chọn
                    const selectedCat = categories.find(cat => cat._id === e.value);
                    if (selectedCat) {
                      // Cập nhật tên loại
                      setEditedProduct(prev => ({
                        ...prev,
                        productTypeName: selectedCat.nameCategory
                      }));
                    }
                  }}
                  options={categories.map(cat => ({ 
                    label: cat.nameCategory, 
                    value: cat._id,
                    code: cat.codeCategory
                  }))}
                  placeholder="Chọn danh mục"
                  className="w-full border border-gray-300 rounded-md"
                  panelClassName="z-50"
                  filter
                  required
                  appendTo="self"
                  style={{ height: '2.5rem' }}
                  itemTemplate={(option) => (
                    <div className="px-4 py-2">{option.label} <span className="text-xs text-gray-500">({option.code})</span></div>
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
              </div>
              
              <div className="field">
                <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Giá <span className="text-red-500">*</span>
                </label>
                <InputNumber
                  id="productPrice"
                  value={parseFloat(editedProduct.productPrice) || null}
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
                  name="productStatus"
                  value={editedProduct.productStatus ?? ""}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  placeholder="Nhập tình trạng sản phẩm"
                />
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
                  value={editedProduct.productBrand ?? ""}
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
                  value={editedProduct.productOrigin ?? ""}
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
                  value={parseInt(editedProduct.productStock) || 0}
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
                  value={parseInt(editedProduct.productDiscount) || 0}
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
                  <span className="font-medium text-blue-600">{editedProduct.productCode || "N/A"}</span>
                </div>
                <small className="text-gray-500 mt-1 block">Mã sản phẩm tự động từ mã loại</small>
              </div>
              
              <div className="field">
                <label htmlFor="productWeight" className="block text-sm font-medium text-gray-700 mb-2">
                  Trọng lượng (gram)
                </label>
                <InputNumber
                  id="productWeight"
                  value={parseInt(editedProduct.productWeight) || 0}
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
                  value={editedProduct.productDescription ?? ""}
                  onChange={(e) => setEditedProduct(prev => ({
                    ...prev,
                    productDescription: e.target.value
                  }))}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Mỗi đặc điểm nên kết thúc bằng dấu chấm (.)"
                />
                <small className="text-gray-500 mt-1 block">Các đặc điểm được phân tách bằng dấu chấm (.)</small>
              </div>
              
              <div className="field">
                <label htmlFor="productInfo" className="block text-sm font-medium text-gray-700 mb-2">
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
              label="Cập nhật sản phẩm"
              icon="pi pi-check"
              loading={isSubmitting}
              className="p-button-sm h-11 px-4 rounded-md bg-[#51bb1a] hover:bg-[#45a011] border-[#51bb1a] hover:border-[#45a011] text-white transition-colors shadow-sm"
              style={{ minWidth: '160px', fontWeight: '500' }}
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
  handleUpdateProduct: PropTypes.func.isRequired,
  setProducts: PropTypes.func,
};

export default EditProduct;
