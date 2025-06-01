import { useState, useEffect } from "react";
import { Button, Dialog, InputText, Dropdown } from "primereact";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import Pagination from "../../utils/Paginator";
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
  const [rowsPerPage, setRowsPerPage] = useState(8);

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
      setProducts((prevProducts) => [newProduct, ...prevProducts]);
      await fetchProducts();
      toast.success("Thêm sản phẩm thành công!");
    } catch (err) {
      console.error("Lỗi khi thêm sản phẩm:", err);
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product._id !== newProduct._id)
      );
      toast.error("Thêm sản phẩm thất bại!");
    }
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
  const handlePageChange = ({ page, rows }) => {
    setFirst((page - 1) * rows);
    setRowsPerPage(rows);
  };

  // Get current page products
  const getCurrentPageProducts = () =>
    filteredProducts.slice(first, first + rowsPerPage);

  return (
    <div className="p-2 md:p-4">
      <h1 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">
        Quản Lý Sản Phẩm
      </h1>
      <div className="flex flex-col md:flex-row gap-2 mb-3 md:mb-5">
        <div className="w-full md:w-1/2 lg:w-3/5">
          <IconField iconPosition="left" className="w-full">
            <InputIcon className="pi pi-search -mt-2"> </InputIcon>
            <InputText
              placeholder="Tìm kiếm theo tên sản phẩm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded w-full p-2 px-12"
            />
          </IconField>
        </div>
        <div className="w-full md:w-1/4 lg:w-1/5">
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
            onChange={setSelectedProduct}
            placeholder="Tất cả"
            className="w-full"
            pt={{
              root: { className: "p-2" },
              item: { className: "py-2 px-4" },
              trigger: { className: "px-3" },
            }}
          />
        </div>
        <div className="w-full md:w-1/4 lg:w-1/5">
          <Button
            label="Thêm Sản Phẩm"
            icon="pi pi-plus"
            onClick={() => setVisible(true)}
            className="bg-blue-500 text-white rounded text-xs md:text-sm w-full p-2"
          />
        </div>
      </div>

      {/* Table container with horizontal scroll for mobile */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                Tên sản phẩm
              </th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                Thương hiệu
              </th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                Loại sản phẩm
              </th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                Giá sản phẩm
              </th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                Tình trạng
              </th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                Giảm giá
              </th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                Số lượng tồn kho
              </th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                Thương hiệu
              </th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                Xuất xứ
              </th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm w-[100px] md:w-[120px]">
                Chức Năng
              </th>
            </tr>
          </thead>
          <tbody>
            {getCurrentPageProducts().map((product) => (
              <tr key={product?._id} className="border-b">
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {product?.productName}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {product?.productBrand}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {product?.productCategory}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {product?.productPrice}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {product?.productStatus}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {product?.productDiscount}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {product?.productStock}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {product?.productCode}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {product?.productOrigin}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  <div className="flex justify-center space-x-1 md:space-x-2">
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-warning p-button-sm text-[10px] md:text-xs p-1 md:p-2"
                      onClick={() => handleEditProduct(product)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <Pagination
          totalRecords={filteredProducts.length}
          rowsPerPageOptions={[8, 16, 24]}
          onPageChange={handlePageChange}
        />
      </div>

      <Dialog
        header="Thêm Sản Phẩm Mới"
        visible={visible}
        onHide={() => setVisible(false)}
        className="w-[95vw] md:w-[90vw] lg:w-[80vw] xl:w-[70vw] "
      >
        <AddProduct
          onHide={() => setVisible(false)}
          onAddSuccess={handleAddProduct}
        />
      </Dialog>

      <Dialog
        header="Chỉnh Sửa Sản Phẩm"
        visible={editVisible}
        onHide={() => setEditVisible(false)}
        className="w-[95vw] md:w-[90vw] lg:w-[80vw] xl:w-[70vw]"
      >
        {editingProduct && (
          <EditProduct
            product={editingProduct}
            setVisible={setEditVisible}
            onUpdateSuccess={handleUpdateProduct}
          />
        )}
      </Dialog>

      <ToastContainer />
    </div>
  );
};

export default Products;
