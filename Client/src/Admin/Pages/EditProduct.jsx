import React, { useState } from "react";
import { Button, InputText, FloatLabel } from "primereact";
import { toast } from "react-toastify";

const EditProduct = ({ product, setVisible, handleUpdateProduct }) => {
  const [editedProduct, setEditedProduct] = useState({
    ...product,
    productImages: product.productImages || [],
  });
  const [imagePreviews, setImagePreviews] = useState(
    product.productImages || []
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct({
      ...editedProduct,
      [name]: value,
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));

    setImagePreviews((prev) => [...prev, ...previews]);
    setEditedProduct((prev) => ({
      ...prev,
      productImages: [...prev.productImages, ...files],
    }));
  };

  const handleRemoveImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setEditedProduct((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(editedProduct).forEach((key) => {
        if (key === "productImages") {
          editedProduct.productImages.forEach((file) => {
            formData.append("productImages", file);
          });
        } else {
          formData.append(key, editedProduct[key]);
        }
      });

      await handleUpdateProduct(editedProduct._id, formData);
      toast.success("Cập nhật sản phẩm thành công!");
      setVisible(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      toast.error("Có lỗi xảy ra khi cập nhật sản phẩm.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 mb-5">
        {/* Tên sản phẩm */}
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
