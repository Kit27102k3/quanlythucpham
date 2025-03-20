import { Scrollbars } from "react-custom-scrollbars-2";
import React, { useState, useEffect } from "react";
import { Button, InputText, FloatLabel } from "primereact";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import productsApi from "../../api/productsApi";

const AddProduct = ({ setVisible, products, setProducts }) => {
  const [product, setProduct] = useState({
    productName: "",
    productPrice: "",
    productImages: [],
    productCategory: "", // Danh mục sản phẩm
    productBrand: "", // Thương hiệu
    productStatus: "", // Tình trạng
    productDiscount: "", // Giảm giá
    productStock: "", // Số lượng trong kho
    productCode: "", // Mã sản phẩm
    productWeight: "", // Trọng lượng
    productPromoPrice: "", // Giá khuyến mãi
    productWarranty: "", // Bảo hành
    productOrigin: "", // Xuất xứ
    productIntroduction: "", // Giới thiệu sản phẩm
    productInfo: "", // Thông tin sản phẩm
    productDetails: "", // Chi tiết sản phẩm
  });
  const [productDescription, setProductDescription] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    const descriptions = value
      .split(",") 
      .map((desc) => desc.trim()) 
      .filter((desc) => desc !== ""); 
    setProductDescription(descriptions);
  };

  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]: value,
    });
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const previews = filesArray.map((file) => URL.createObjectURL(file));

    setImagePreviews((prev) => [...prev, ...previews]);
    setProduct((prev) => ({
      ...prev,
      productImages: [...prev.productImages, ...filesArray],
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

    if (!product.productName || !product.productPrice) {
      toast.error("Vui lòng điền đầy đủ thông tin sản phẩm!");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(product).forEach((key) => {
        if (key === "productImages") {
          product.productImages.forEach((file) => {
            formData.append("productImages", file);
          });
        } else {
          formData.append(key, product[key]);
        }
      });
      formData.append("productDescription", JSON.stringify(productDescription));
      const response = await productsApi.createProduct(formData);
      toast.success("Thêm sản phẩm thành công!");
      setProducts((prev) => [...prev, response]);
      setVisible(false);
    } catch (error) {
      console.error(error);
      toast.error("Thêm sản phẩm thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  return (
    <>
      <Scrollbars style={{ width: "100%", height: "550px" }}>
        <div className="p-4 card flex flex-col justify-content-center mt-2">
          <div className="flex flex-col gap-6 mb-5">
            {/* Các trường nhập liệu */}
            <div className="grid grid-cols-2 gap-4">
              <FloatLabel>
                <InputText
                  id="productName"
                  name="productName"
                  value={product.productName}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                />
                <label htmlFor="productName">Tên sản phẩm</label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  id="productPrice"
                  name="productPrice"
                  value={product.productPrice}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                />
                <label htmlFor="productPrice">Giá sản phẩm</label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  id="productBrand"
                  name="productBrand"
                  value={product.productBrand}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                />
                <label htmlFor="productBrand">Thương hiệu</label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  id="productCategory"
                  name="productCategory"
                  value={product.productCategory}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                />
                <label htmlFor="productCategory">Danh mục sản phẩm</label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  id="productStatus"
                  name="productStatus"
                  value={product.productStatus}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                />
                <label htmlFor="productStatus">Tình trạng</label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  id="productDiscount"
                  name="productDiscount"
                  value={product.productDiscount}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                />
                <label htmlFor="productDiscount">Giảm giá (%)</label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  id="productStock"
                  name="productStock"
                  value={product.productStock}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                />
                <label htmlFor="productStock">Số lượng tồn kho</label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  id="productCode"
                  name="productCode"
                  value={product.productCode}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                />
                <label htmlFor="productCode">Mã sản phẩm</label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  id="productWeight"
                  name="productWeight"
                  value={product.productWeight}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                />
                <label htmlFor="productWeight">Trọng lượng</label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  id="productOrigin"
                  name="productOrigin"
                  value={product.productOrigin}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                />
                <label htmlFor="productOrigin">Xuất xứ</label>
              </FloatLabel>
            </div>

            {/* Mô tả và thông tin chi tiết */}
            <div className="flex justify-between gap-4">
              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-[350px]"
                  id="productDescription"
                  name="productDescription"
                  onChange={handleChange}
                  value={productDescription.join(", ")}
                />
                <label htmlFor="productDescription" className="text-sm -mt-3">
                  Mô tả sản phẩm
                </label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-[350px]"
                  id="productInfo"
                  name="productInfo"
                  value={product.productInfo}
                  onChange={handleInputChange}
                />
                <label htmlFor="productInfo" className="text-sm -mt-3">
                  Thông tin sản phẩm
                </label>
              </FloatLabel>
            </div>

            <div className="flex justify-between gap-4">
              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-[350px]"
                  id="productDetails"
                  name="productDetails"
                  value={product.productDetails}
                  onChange={handleInputChange}
                />
                <label htmlFor="productDetails" className="text-sm -mt-3">
                  Chi tiết sản phẩm
                </label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-[350px]"
                  id="productIntroduction"
                  name="productIntroduction"
                  value={product.productIntroduction}
                  onChange={handleInputChange}
                />
                <label htmlFor="productIntroduction" className="text-sm -mt-3">
                  Giới thiệu sản phẩm
                </label>
              </FloatLabel>
            </div>

            {/* Upload ảnh */}
            <div>
              <label className="block text-sm font-medium mb-2">Hình ảnh</label>
              <input
                type="file"
                multiple
                onChange={handleImageUpload}
                accept="image/*"
                className="border p-2 rounded w-full"
              />
              <div className="flex flex-wrap mt-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative mr-2 mb-2">
                    <img
                      src={preview}
                      alt={`Preview ${index}`}
                      className="w-24 h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Nút thêm sản phẩm */}
          <Button
            label="Thêm"
            onClick={handleSubmit}
            className="p-3 bg-blue-500 text-white rounded"
            disabled={isSubmitting}
          />
        </div>
      </Scrollbars>
      <ToastContainer />
    </>
  );
};

export default AddProduct;
