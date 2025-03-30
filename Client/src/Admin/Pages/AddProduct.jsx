import React, { useState, useEffect } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
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
        setCategories(response);
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

      await productsApi.createProduct(formData, {
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
      console.error("Chi tiết lỗi:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Scrollbars
        style={{ width: "100%", height: "600px" }}
        renderThumbVertical={() => <div style={{ display: "none" }} />}
        renderThumbHorizontal={() => <div style={{ display: "none" }} />}
      >
        <div className="p-4 card flex flex-col justify-content-center mt-2">
          <div className="flex flex-col gap-4 mb-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "productName", label: "Tên sản phẩm" },
                { name: "productPrice", label: "Giá sản phẩm" },
                { name: "productBrand", label: "Thương hiệu" },
                { name: "productCategory", label: "Danh mục sản phẩm" },
                { name: "productStatus", label: "Tình trạng" },
                { name: "productDiscount", label: "Giảm giá (%)" },
                { name: "productStock", label: "Số lượng tồn kho" },
                { name: "productCode", label: "Mã sản phẩm" },
                { name: "productWeight", label: "Trọng lượng" },
                { name: "productOrigin", label: "Xuất xứ" },
              ].map(({ name, label }) => (
                <FloatLabel key={name}>
                  <InputText
                    id={name}
                    name={name}
                    value={product[name]}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
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

            <div className="flex justify-between gap-4">
              {[
                { name: "productDetails", label: "Chi tiết sản phẩm" },
                { name: "productIntroduction", label: "Giới thiệu sản phẩm" },
              ].map(({ name, label }) => (
                <FloatLabel key={name}>
                  <InputText
                    className="border p-2 rounded w-[360px]"
                    id={name}
                    name={name}
                    value={product[name]}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={name} className="text-sm -mt-3">
                    {label}
                  </label>
                </FloatLabel>
              ))}
            </div>

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
