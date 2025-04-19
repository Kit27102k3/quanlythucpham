import { useState, useEffect } from "react";
import { Button, Dialog, InputText, Dropdown } from "primereact";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Paginator } from "primereact/paginator";
import productsApi from "../../api/productsApi";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";

const Products = () => {
  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Pagination states
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(8);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);
  
  useEffect(() => {
    // Filter products based on search term
    const filtered = products.filter((product) =>
      searchTerm
        ? product?.productName?.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );
    
    setFilteredProducts(filtered);
    setTotalRecords(filtered.length);
    // Reset to first page when filter changes
    setFirst(0);
  }, [products, searchTerm]);

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
    } catch (err) {
      console.error("Lỗi khi thêm sản phẩm:", err);
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
  
  // Handle pagination change
  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };
  
  // Get current page products
  const getCurrentPageProducts = () => {
    return filteredProducts.slice(first, first + rows);
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
            <th className="border border-gray-300 p-2 text-sm">Xuất xứ</th>
            <th className="border border-gray-300 p-2 text-sm w-[120px]">Chức Năng</th>
          </tr>
        </thead>
        <tbody>
          {getCurrentPageProducts().map((product) => (
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
          {filteredProducts.length === 0 && (
            <tr>
              <td colSpan="11" className="text-center p-4 text-gray-500">
                Không có sản phẩm nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      <div className="mt-6 flex flex-col items-center">
        <Paginator
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[10, 20, 30]}
          onPageChange={onPageChange}
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          className="border-0 shadow-sm"
          pt={{
            root: { className: 'bg-white rounded-lg p-2' },
            firstPageButton: { className: 'border rounded-md p-2 hover:bg-blue-50 text-blue-600 mx-1' },
            previousPageButton: { className: 'border rounded-md p-2 hover:bg-blue-50 text-blue-600 mx-1' },
            nextPageButton: { className: 'border rounded-md p-2 hover:bg-blue-50 text-blue-600 mx-1' },
            lastPageButton: { className: 'border rounded-md p-2 hover:bg-blue-50 text-blue-600 mx-1' },
            pageButton: { className: 'border rounded-md p-2 hover:bg-blue-50 mx-1' },
            currentPageReport: { className: 'text-sm text-gray-600 mx-2' }
          }}
        />
        <div className="text-sm text-gray-600 mt-3 mb-2">
          Hiển thị <span className="font-medium text-blue-600">{Math.min(first + 1, totalRecords)}</span> - <span className="font-medium text-blue-600">{Math.min(first + rows, totalRecords)}</span> trên tổng số <span className="font-medium text-blue-600">{totalRecords}</span> sản phẩm
        </div>
      </div>

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
        onHide={() => {
          setEditVisible(false);
          setEditingProduct(null);
        }}
        headerClassName="p-4"
      >
        {editingProduct && (
          <EditProduct
            product={editingProduct}
            setVisible={setEditVisible}
            handleUpdateProduct={handleUpdateProduct}
            setProducts={setProducts}
          />
        )}
      </Dialog>

      <ToastContainer />
    </div>
  );
};

export default Products;
