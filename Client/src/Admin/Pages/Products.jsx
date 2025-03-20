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
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
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

  const handleUpdateProduct = async (updatedProduct) => {
    try {
      const response = await productsApi.updateProduct(
        updatedProduct._id,
        updatedProduct
      );
      setProducts((prev) =>
        prev.map((p) => (p._id === updatedProduct._id ? response : p))
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
          options={products.map((product) => ({
            label: product.productCode,
            value: product._id,
          }))}
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
            .filter((product) =>
              product.productName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
            )
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
                    className="p-1 bg-blue-500 text-white rounded text-[12px] ml-2"
                    onClick={() => handleEditProduct(product)}
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

      {/* Dialog thêm sản phẩm */}
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

      {/* Dialog chỉnh sửa sản phẩm */}
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
        />
      </Dialog>

      <ToastContainer />
    </div>
  );
};

export default Products;
