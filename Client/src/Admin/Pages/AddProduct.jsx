import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { Scrollbars } from "react-custom-scrollbars-2";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { Dropdown } from "primereact/dropdown";
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDropdownChange = (e, name) => {
    setProduct((prev) => ({
      ...prev,
      [name]: e.value,
    }));
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
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(product).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });
      const descriptions = productDescription
        .split(".")
        .map((desc) => desc.trim())
        .filter((desc) => desc !== "");
      formData.append("productDescription", JSON.stringify(descriptions));
      product.productImages.forEach((file) => {
        formData.append("productImages", file);
      });

      const response = await productsApi.createProduct(formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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

  return (
    <div className="relative">
      <Scrollbars
        style={{ width: "100%", height: "600px" }}
        renderThumbVertical={() => <div style={{ display: "none" }} />}
        renderThumbHorizontal={() => <div style={{ display: "none" }} />}
      >
        <div className="p-4 card flex flex-col justify-content-center mt-2">
          <div className="flex flex-col gap-4 mb-5">
            <div className="mb-4 relative z-50">
              <label htmlFor="productCategory" className="block text-sm font-medium mb-2">Danh mục sản phẩm</label>
              <Dropdown
                id="productCategory"
                value={product.productCategory}
                onChange={(e) => handleDropdownChange(e, 'productCategory')}
                options={categories.map(cat => ({ label: cat.nameCategory, value: cat._id }))}
                className="border p-2 rounded w-full"
                placeholder="Chọn danh mục"
                filter
                showClear
                emptyFilterMessage="Không tìm thấy danh mục"
                emptyMessage="Không có danh mục nào"
                appendTo="self"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "productName", label: "Tên sản phẩm", type: "text" },
                { name: "productPrice", label: "Giá sản phẩm", type: "text" },
                { name: "productBrand", label: "Thương hiệu", type: "text" },
                { name: "productStatus", label: "Tình trạng", type: "text" },
                { name: "productDiscount", label: "Giảm giá (%)", type: "text" },
                { name: "productStock", label: "Số lượng tồn kho", type: "text" },
                { name: "productCode", label: "Mã sản phẩm", type: "text" },
                { name: "productWeight", label: "Trọng lượng", type: "text" },
                { name: "productOrigin", label: "Xuất xứ", type: "text" },
              ].map(({ name, label, type }) => (
                <FloatLabel key={name}>
                  <InputText
                    id={name}
                    name={name}
                    value={product[name]}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                    type={type}
                  />
                  <label htmlFor={name}>{label}</label>
                </FloatLabel>
              ))}
            </div>

            <div className="flex justify-between gap-4">
              {[
                {
                  name: "productDescription",
                  label: "Mô tả sản phẩm",
                  value: productDescription,
                  onChange: (e) => setProductDescription(e.target.value),
                },
                {
                  name: "productInfo",
                  label: "Thông tin sản phẩm",
                },
              ].map(({ name, label, value, onChange }) => (
                <FloatLabel key={name}>
                  <InputText
                    className="border p-2 rounded w-[360px]"
                    id={name}
                    name={name}
                    value={value || product[name]}
                    onChange={onChange || handleInputChange}
                  />
                  <label htmlFor={name} className="text-sm -mt-3">
                    {label}
                  </label>
                </FloatLabel>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Hình ảnh sản phẩm</label>
              <div className="flex flex-wrap gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="w-24 h-24 border-2 border-dashed rounded flex items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <span className="text-2xl">+</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                label="Hủy"
                icon="pi pi-times"
                className="p-button-text bg-red-500 text-white hover:bg-red-600 p-2 px-4 text-[16px] gap-2 rounded"
                onClick={() => setVisible(false)}
              />
              <Button
                label="Lưu"
                icon="pi pi-check"
                onClick={handleSubmit}
                loading={isSubmitting}
                className="bg-[#51bb1a] text-white hover:bg-[#45a116] p-2 px-4 text-[16px] gap-2 rounded"
              />
            </div>
          </div>
        </div>
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
