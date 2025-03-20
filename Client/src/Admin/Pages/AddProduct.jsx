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
  });
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

    // Cập nhật preview và productImages
    setImagePreviews((prev) => [...prev, ...previews]);
    setProduct((prev) => ({
      ...prev,
      productImages: [...prev.productImages, ...filesArray],
    }));
  };

  // Xóa ảnh preview
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

    // Kiểm tra các trường bắt buộc
    if (!product.productName || !product.productPrice) {
      toast.error("Vui lòng điền đầy đủ thông tin sản phẩm!");
      setIsSubmitting(false);
      return;
    }

    try {
      // Tạo FormData để gửi file và dữ liệu
      const formData = new FormData();
      formData.append("productName", product.productName);
      formData.append("productPrice", product.productPrice);

      // Thêm các file ảnh vào FormData
      product.productImages.forEach((file) => {
        formData.append("productImages", file);
      });

      // Gọi API để thêm sản phẩm
      const response = await productsApi.createProduct(formData);
      toast.success("Thêm sản phẩm thành công!");

      // Cập nhật danh sách sản phẩm và đóng dialog
      setProducts((prev) => [...prev, response]);
      setVisible(false);
    } catch (error) {
      console.error(error);
      toast.error("Thêm sản phẩm thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup ảnh preview khi component unmount
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
            <div className="flex justify-between gap-4">
              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-[350px]"
                  id="productName"
                  name="productName"
                  value={product.productName}
                  onChange={handleInputChange}
                />
                <label htmlFor="productName" className="text-sm -mt-3">
                  Tên sản phẩm
                </label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-[350px]"
                  id="productPrice"
                  name="productPrice"
                  value={product.productPrice}
                  onChange={handleInputChange}
                />
                <label htmlFor="productPrice" className="text-sm -mt-3">
                  Giá sản phẩm
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
            className="p-3 bg-blue-500 text-white rounded text-[12px] gap-2"
            disabled={isSubmitting}
          />
        </div>
      </Scrollbars>
      <ToastContainer />
    </>
  );
};

export default AddProduct;
