import React, { useState, useEffect } from "react";
import { Button, Dialog, InputText, FloatLabel, Dropdown } from "primereact";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import productsApi from "../../api/productsApi";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";

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
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error("Data is not an array:", data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    }
  };

  const handleAddProduct = async (newProduct) => {
    try {
      setProducts(prevProducts => [newProduct, ...prevProducts]);
      await fetchProducts();
      toast.success("Thêm sản phẩm thành công!");
    } catch (error) {
      setProducts(prevProducts => 
        prevProducts.filter(product => product._id !== newProduct._id)
      );
      toast.error("Thêm sản phẩm thất bại!");
    }
  };

  const handleDeleteProduct = async (_id) => {
    try {
      await productsApi.deleteProduct(_id);
      setProducts(products.filter((product) => product._id !== _id));
      toast.success("Xóa sản phẩm thành công!");
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Xóa sản phẩm thất bại.");
    }
  };

  const handleProductChange = (e) => {
    setSelectedProduct(e.value);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditVisible(true);
  };

  const handleUpdateProduct = async (id, data) => {
    try {
      await productsApi.updateProduct(id, data);

      const updatedProducts = await productsApi.getAllProducts();
      setProducts(updatedProducts);

      toast.success("Cập nhật sản phẩm thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      toast.error("Có lỗi xảy ra khi cập nhật sản phẩm!");
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
          options={
            Array.isArray(products)
              ? products.map((product) => ({
                  label: product?.productCode,
                  value: product?._id,
                }))
              : []
          }
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
            <th className="border border-gray-300 p-2 text-sm">Tên sản phẩm</th>
            <th className="border border-gray-300 p-2 text-sm">Thương hiệu</th>
            <th className="border border-gray-300 p-2 text-sm">Loại sản phẩm</th>
            <th className="border border-gray-300 p-2 text-sm">Giá sản phẩm</th>
            <th className="border border-gray-300 p-2 text-sm">Tình trạng</th>
            <th className="border border-gray-300 p-2 text-sm">Giảm giá</th>
            <th className="border border-gray-300 p-2 text-sm">Số lượng tồn kho</th>
            <th className="border border-gray-300 p-2 text-sm">Mã Loại</th>
            <th className="border border-gray-300 p-2 text-sm">Tên Loại</th>
            <th className="border border-gray-300 p-2 text-sm">Xuất xứ</th>
            <th className="border border-gray-300 p-2 text-sm w-[120px]">Chức Năng</th>
          </tr>
        </thead>
        <tbody>
          {products?.length > 0 &&
            products
              .filter((product) =>
                searchTerm
                  ? product?.productName
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  : true
              )
              .map((product) => (
                <tr key={product?._id} className="border-b">
                  <td className="border border-gray-300 p-2 text-[14px]">
                    {product?.productName}
                  </td>
                  <td className="border border-gray-300 p-2 text-[14px]">
                    {product?.productBrand}
                  </td>
                  <td className="border border-gray-300 p-2 text-[14px]">
                    {product?.productCategory}
                  </td>
                  <td className="border border-gray-300 p-2 text-[14px]">
                    {product?.productPrice}
                  </td>
                  <td className="border border-gray-300 p-2 text-[14px]">
                    {product?.productStatus}
                  </td>
                  <td className="border border-gray-300 p-2 text-[14px]">
                    {product?.productDiscount}
                  </td>
                  <td className="border border-gray-300 p-2 text-[14px]">
                    {product?.productStock}
                  </td>
                  <td className="border border-gray-300 p-2 text-[14px]">
                    {product?.productCode}
                  </td>
                  <td className="border border-gray-300 p-2 text-[14px]">
                    {product?.productTypeName}
                  </td>
                  <td className="border border-gray-300 p-2 text-[14px]">
                    {product?.productOrigin}
                  </td>
                  <td className="border border-gray-300 p-2 text-[14px]">
                    <Button
                      label="Sửa"
                      className="p-1 bg-blue-500 text-white rounded text-[12px] ml-2"
                      onClick={() => handleEditProduct(product)}
                    />
                    <Button
                      label="Xóa"
                      className="p-1 bg-red-500 text-white rounded text-[12px] ml-2"
                      onClick={() => handleDeleteProduct(product?._id)}
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
          onProductAdd={handleAddProduct}
        />
      </Dialog>

      <Dialog
        header="Chỉnh Sửa Sản Phẩm"
        visible={editVisible}
        style={{ width: "50vw" }}
        onHide={() => setEditVisible(false)}
        headerClassName="p-4"
      >
        <EditProduct
          product={editingProduct}
          setVisible={setEditVisible}
          handleUpdateProduct={handleUpdateProduct}
          setProducts={setProducts}
        />
      </Dialog>

      <ToastContainer />
    </div>
  );
};

export default Products;
