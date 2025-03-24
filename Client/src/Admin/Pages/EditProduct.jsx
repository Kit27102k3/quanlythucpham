import React, { useState, useEffect } from "react";
import { Button, InputText, FloatLabel } from "primereact";
import { toast } from "react-toastify";

const EditProduct = ({
  product,
  setVisible,
  handleUpdateProduct,
  setProducts,
}) => {
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

  // Hàm xử lý upload ảnh
  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const previews = filesArray.map((file) => URL.createObjectURL(file));

    setImagePreviews((prev) => [...prev, ...previews]);
    setNewImages((prev) => [...prev, ...filesArray]);
  };

  // Hàm xử lý xóa ảnh
  const handleRemoveImage = (index) => {
    // Nếu là ảnh mới chưa upload
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Thêm các trường dữ liệu cơ bản
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
        if (editedProduct[field] !== undefined) {
          formData.append(field, String(editedProduct[field]));
        }
      });

      // Xử lý mô tả sản phẩm
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

      // Danh sách ảnh hiện tại muốn giữ lại
      const currentImages = imagePreviews.filter(
        (_, index) => index < imagePreviews.length - newImages.length
      );
      formData.append("keepImages", JSON.stringify(currentImages));

      // Gọi API cập nhật
      const response = await handleUpdateProduct(editedProduct._id, formData);

      toast.success("Cập nhật sản phẩm thành công!");
      setVisible(false);

      // Cập nhật lại danh sách sản phẩm
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
      // Dọn dẹp URL tạm
      newImages.forEach((file) => URL.revokeObjectURL(file.preview));
    }
  };

  // Cleanup effect
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

        {/* Danh mục sản phẩm */}
        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productCategory"
            name="productCategory"
            value={editedProduct.productCategory ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productCategory" className="text-sm -mt-3">
            Danh mục sản phẩm
          </label>
        </FloatLabel>

        {/* Thương hiệu */}
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

        {/* Tình trạng */}
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

        {/* Giảm giá */}
        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productDiscount"
            name="productDiscount"
            value={editedProduct.productDiscount ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productDiscount" className="text-sm -mt-3">
            Giảm giá
          </label>
        </FloatLabel>

        {/* Số lượng trong kho */}
        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productStock"
            name="productStock"
            value={editedProduct.productStock ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productStock" className="text-sm -mt-3">
            Số lượng trong kho
          </label>
        </FloatLabel>

        {/* Mã sản phẩm */}
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

        {/* Trọng lượng */}
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

        {/* Giá khuyến mãi */}
        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productPromoPrice"
            name="productPromoPrice"
            value={editedProduct.productPromoPrice ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productPromoPrice" className="text-sm -mt-3">
            Giá khuyến mãi
          </label>
        </FloatLabel>

        {/* Bảo hành */}
        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productWarranty"
            name="productWarranty"
            value={editedProduct.productWarranty ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productWarranty" className="text-sm -mt-3">
            Bảo hành
          </label>
        </FloatLabel>

        {/* Xuất xứ */}
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

        <FloatLabel>
          <textarea
            className="border p-2 rounded w-full"
            id="productDescription"
            name="productDescription"
            value={editedProduct.productDescription}
            onChange={handleInputChange}
          />
          <label htmlFor="productDescription" className="text-sm -mt-3">
            Mô tả sản phẩm
          </label>
        </FloatLabel>

        {/* Thông tin sản phẩm */}
        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productInfo"
            name="productInfo"
            value={editedProduct.productInfo ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productInfo" className="text-sm -mt-3">
            Thông tin sản phẩm
          </label>
        </FloatLabel>

        {/* Giới thiệu sản phẩm */}
        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productIntroduction"
            name="productIntroduction"
            value={editedProduct.productIntroduction ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productIntroduction" className="text-sm -mt-3">
            Giới thiệu sản phẩm
          </label>
        </FloatLabel>

        {/* Chi tiết sản phẩm */}
        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productDetails"
            name="productDetails"
            value={editedProduct.productDetails ?? ""}
            onChange={handleInputChange}
          />
          <label htmlFor="productDetails" className="text-sm -mt-3">
            Chi tiết sản phẩm
          </label>
        </FloatLabel>

        <div>
          <label className="block text-sm font-medium mb-2">Thêm ảnh mới</label>
          <input
            type="file"
            multiple
            onChange={handleImageUpload}
            accept="image/*"
            className="border p-2 rounded w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Chọn nhiều ảnh bằng cách giữ Ctrl (Windows) hoặc Command (Mac)
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index}`}
                className="w-32 h-32 object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Nút Cập nhật */}
        <Button
          label="Cập nhật"
          onClick={handleSubmit}
          className="p-3 bg-blue-500 text-white rounded text-[12px] gap-2"
        />
      </div>
    </div>
  );
};

export default EditProduct;
