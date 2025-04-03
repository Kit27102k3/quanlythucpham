import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { Dropdown } from "primereact/dropdown";
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
        console.error("Lỗi khi lấy danh mục:", error);
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

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 mb-5">
        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productName"
            name="productName"
            value={editedProduct.productName ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productName" className="text-sm -mt-3">
            Tên sản phẩm
          </label>
        </FloatLabel>

        {/* Giá sản phẩm */}
        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productPrice"
            name="productPrice"
            value={editedProduct.productPrice ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productPrice" className="text-sm -mt-3">
            Giá sản phẩm
          </label>
        </FloatLabel>

        <div className="mb-4 relative z-50">
          <label htmlFor="productCategory" className="block text-sm font-medium mb-2">Danh mục sản phẩm</label>
          <Dropdown
            id="productCategory"
            value={editedProduct.productCategory}
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

        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productBrand"
            name="productBrand"
            value={editedProduct.productBrand ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productBrand" className="text-sm -mt-3">
            Thương hiệu
          </label>
        </FloatLabel>

        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productStatus"
            name="productStatus"
            value={editedProduct.productStatus ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productStatus" className="text-sm -mt-3">
            Tình trạng
          </label>
        </FloatLabel>

        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productDiscount"
            name="productDiscount"
            value={editedProduct.productDiscount ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productDiscount" className="text-sm -mt-3">
            Giảm giá (%)
          </label>
        </FloatLabel>

        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productStock"
            name="productStock"
            value={editedProduct.productStock ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productStock" className="text-sm -mt-3">
            Số lượng tồn kho
          </label>
        </FloatLabel>

        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productCode"
            name="productCode"
            value={editedProduct.productCode ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productCode" className="text-sm -mt-3">
            Mã sản phẩm
          </label>
        </FloatLabel>

        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productWeight"
            name="productWeight"
            value={editedProduct.productWeight ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productWeight" className="text-sm -mt-3">
            Trọng lượng
          </label>
        </FloatLabel>

        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productOrigin"
            name="productOrigin"
            value={editedProduct.productOrigin ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productOrigin" className="text-sm -mt-3">
            Xuất xứ
          </label>
        </FloatLabel>

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
            className="p-button-text"
            onClick={() => setVisible(false)}
          />
          <Button
            label="Lưu"
            icon="pi pi-check"
            onClick={handleSubmit}
            loading={isSubmitting}
          />
        </div>
      </div>
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
