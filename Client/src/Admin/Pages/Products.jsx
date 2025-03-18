import React, { useState, useEffect } from "react";
import { Button, Dialog, InputText, FloatLabel, Dropdown } from "primereact";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import productsApi from "../../api/productsApi";
import axios from "axios";
import { Scrollbars } from "react-custom-scrollbars-2";

const Products = () => {
  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleDeleteProduct = async (_id) => {
    try {
      await productsApi.deleteProduct(_id);
      setProducts(products.filter((product) => product._id !== _id));
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product.");
    }
  };

  const handleProductChange = (e) => {
    setSelectedProduct(e.value);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditVisible(true);
  };

  const handleUpdateProduct = async (updatedProduct) => {
    try {
      const response = await productsApi.updateProduct(
        updatedProduct._id,
        updatedProduct
      );
      setProducts(
        products.map((p) => (p._id === updatedProduct._id ? response : p))
      );
      toast.success("Cập nhật sản phẩm thành công!");
      setEditVisible(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      toast.error("Cập nhật sản phẩm thất bại.");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Quản Lý Sản Phẩm</h1>
      <div className="grid grid-cols-[55%_25%_20%] lg:gap-2 mb-5">
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search -mt-2"> </InputIcon>
          <InputText
            placeholder="Tìm kiếm theo tên sản phẩm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded w-full p-2 px-12"
          />
        </IconField>
        <Dropdown
          value={selectedProduct}
          // options={products.map((product) => ({
          //   label: product.productCode,
          //   value: product._id,
          // }))}
          onChange={handleProductChange}
          placeholder="Tất cả"
          className="w-[200px] text-[10px]"
          pt={{
            root: { className: "p-2" },
            item: { className: "py-2 px-4" },
            trigger: { className: "px-3" },
          }}
        />

        <Button
          label="Thêm Sản Phẩm"
          icon="pi pi-plus"
          onClick={() => setVisible(true)}
          className="bg-blue-500 text-white rounded text-[12px] w-[200px] p-2"
        />
      </div>

      <table className="w-full">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 p-2">Tên sản phẩm</th>
            <th className="border border-gray-300 p-2">Thương hiệu</th>
            <th className="border border-gray-300 p-2">Loại sản phẩm</th>
            <th className="border border-gray-300 p-2">Giá sản phẩm</th>
            <th className="border border-gray-300 p-2">Tình trạng</th>
            <th className="border border-gray-300 p-2">Giảm giá</th>
            <th className="border border-gray-300 p-2">Số lượng tồn kho</th>
            <th className="border border-gray-300 p-2">Mã Loại</th>
            <th className="border border-gray-300 p-2">Tên Loại</th>
            <th className="border border-gray-300 p-2">Xuất xứ</th>
            <th className="border border-gray-300 p-2 w-[120px]">Chức Năng</th>
          </tr>
        </thead>
        <tbody>
          {products
            .filter((product) => product) // Loại bỏ các phần tử undefined/null
            .map((product) => (
              <tr key={product._id} className="border-b">
                <td className="border border-gray-300 p-2">
                  {product.productName}
                </td>
                <td className="border border-gray-300 p-2">
                  {product.productBrand}
                </td>
                <td className="border border-gray-300 p-2">
                  {product.productCategory}
                </td>
                <td className="border border-gray-300 p-2">
                  {product.productPrice}
                </td>
                <td className="border border-gray-300 p-2">
                  {product.productStatus}
                </td>
                <td className="border border-gray-300 p-2">
                  {product.productDiscount}
                </td>
                <td className="border border-gray-300 p-2">
                  {product.productStock}
                </td>
                <td className="border border-gray-300 p-2">
                  {product.productCode}
                </td>
                <td className="border border-gray-300 p-2">
                  {product.productTypeName}
                </td>
                <td className="border border-gray-300 p-2">
                  {product.productOrigin}
                </td>
                <td className="border border-gray-300 p-2">
                  <Button
                    label="Sửa"
                    className="p-1 bg-red-500 text-white rounded text-[12px] ml-2"
                    onClick={() => handleUpdateProduct(product._id)}
                  />
                  <Button
                    label="Xóa"
                    className="p-1 bg-red-500 text-white rounded text-[12px] ml-2"
                    onClick={() => handleDeleteProduct(product._id)}
                  />
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <Dialog
        header="Thêm Sản Phẩm"
        visible={visible}
        style={{ width: "50vw" }}
        onHide={() => setVisible(false)}
        headerClassName="p-4"
      >
        <AddProduct
          setVisible={setVisible}
          products={products}
          setProducts={setProducts}
          fetchProducts={fetchProducts}
        />
      </Dialog>
      <ToastContainer />
    </div>
  );
};

const AddProduct = ({ setVisible, products, setProducts, fetchProducts }) => {
  const [product, setProduct] = useState({
    productName: "",
    productPrice: "",
    productImages: [],
    productCategory: "",
    productBrand: "",
    productStatus: "",
    productDiscount: "",
    productInfo: "",
    productDetails: "",
    productStock: "",
    productCode: "",
    productWeight: "",
    productPromoPrice: "",
    productWarranty: "",
    productOrigin: "",
    productIntroduction: "",
    productDescription: "",
  });
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsApi.getAllProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]: value,
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => file instanceof File);
    setProduct((prev) => ({
      ...prev,
      productImages: [...prev.productImages, ...validFiles],
    }));
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };
  const handleRemoveImage = (index) => {
    setProduct((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(product).forEach((key) => {
      if (product[key] !== null && product[key] !== undefined) {
        if (typeof product[key] === "object" && !Array.isArray(product[key])) {
          formData.append(key, JSON.stringify(product[key]));
        } else {
          formData.append(key, String(product[key]));
        }
      }
    });
    product.productImages.forEach((file) => {
      if (file instanceof File) {
        formData.append("productImages", file);
      }
    });
    try {
      const response = await productsApi.createProduct(formData);
      toast.success("Thêm sản phẩm thành công!");
      setVisible(false);
      setProducts((prev) => [...prev, response.data]);
      fetchProducts();
    } catch (error) {
      console.error(
        "Error while submitting data:",
        error.response?.data || error.message
      );
      if (error.response?.data?.error) {
        Object.entries(error.response.data.error).forEach(([key, message]) => {
          console.error(`${key}: ${message}`);
        });
      }
      toast.error(
        `Failed to add product: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  return (
    <>
      <Scrollbars
        style={{
          width: "100%",
          height: "550px",
        }}
      >
        <div className="p-4 card flex flex-col justify-content-center mt-2">
          <div className="flex flex-col gap-6 mb-5">
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

            <div className="flex justify-between items-center gap-2">
              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-full"
                  id="productCategory"
                  name="productCategory"
                  value={product.productCategory}
                  onChange={handleInputChange}
                />
                <label htmlFor="productCategory" className="text-sm -mt-3">
                  Loại sản phẩm
                </label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-full"
                  id="productBrand"
                  name="productBrand"
                  value={product.productBrand}
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
                  value={product.productStatus}
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
                  value={product.productDiscount}
                  onChange={handleInputChange}
                />
                <label htmlFor="productDiscount" className="text-sm -mt-3">
                  Giảm giá
                </label>
              </FloatLabel>
            </div>

            <FloatLabel>
              <InputText
                className="border p-2 rounded w-full"
                id="productInfo"
                name="productInfo"
                value={product.productInfo}
                onChange={handleInputChange}
              />
              <label htmlFor="productInfo" className="text-sm -mt-3">
                Thông tin
              </label>
            </FloatLabel>

            <FloatLabel>
              <InputText
                className="border p-2 rounded w-full"
                id="productDetails"
                name="productDetails"
                value={product.productDetails}
                onChange={handleInputChange}
              />
              <label htmlFor="productDetails" className="text-sm -mt-3">
                Thông tin chi tiết
              </label>
            </FloatLabel>

            <div className="flex items-center justify-between">
              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-[230px]"
                  id="productStock"
                  name="productStock"
                  value={product.productStock}
                  onChange={handleInputChange}
                />
                <label htmlFor="productStock" className="text-sm -mt-3">
                  Số lượng tồn kho
                </label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-[230px]"
                  id="productCode"
                  name="productCode"
                  value={product.productCode}
                  onChange={handleInputChange}
                />
                <label htmlFor="productCode" className="text-sm -mt-3">
                  Mã sản phẩm
                </label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-[230px]"
                  id="productWeight"
                  name="productWeight"
                  value={product.productWeight}
                  onChange={handleInputChange}
                />
                <label htmlFor="productWeight" className="text-sm -mt-3">
                  Khối lượng
                </label>
              </FloatLabel>
            </div>

            <div className="flex items-center justify-between">
              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-[230px]"
                  id="productPromoPrice"
                  name="productPromoPrice"
                  value={product.productPromoPrice}
                  onChange={handleInputChange}
                />
                <label htmlFor="productPromoPrice" className="text-sm -mt-3">
                  Giá khuyến mãi
                </label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-[230px]"
                  id="productWarranty"
                  name="productWarranty"
                  value={product.productWarranty}
                  onChange={handleInputChange}
                />
                <label htmlFor="productWarranty" className="text-sm -mt-3">
                  Bảo hành
                </label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  className="border p-2 rounded w-[230px]"
                  id="productOrigin"
                  name="productOrigin"
                  value={product.productOrigin}
                  onChange={handleInputChange}
                />
                <label htmlFor="productOrigin" className="text-sm -mt-3">
                  Xuất xứ
                </label>
              </FloatLabel>
            </div>
            <FloatLabel>
              <InputText
                className="border p-2 rounded w-full"
                id="productIntroduction"
                name="productIntroduction"
                value={product.productIntroduction}
                onChange={handleInputChange}
              />
              <label htmlFor="productIntroduction" className="text-sm -mt-3">
                Giới thiệu
              </label>
            </FloatLabel>

            <FloatLabel>
              <InputText
                className="border p-2 rounded w-full"
                id="productDescription"
                name="productDescription"
                value={product.productDescription}
                onChange={handleInputChange}
              />
              <label htmlFor="productDescription" className="text-sm -mt-3">
                Mô tả
              </label>
            </FloatLabel>
          </div>

          <Button
            label="Thêm"
            onClick={handleSubmit}
            className="p-3 bg-blue-500 text-white rounded text-[12px] gap-2"
          />
        </div>
      </Scrollbars>
    </>
  );
};

export default Products;
