import React, { useState, useEffect } from "react";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { FloatLabel } from "primereact/floatlabel";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { TrashIcon } from "lucide-react";
import categoriesApi from "../../api/categoriesApi";
import { ToastContainer, toast } from "react-toastify";

const Categories = () => {
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [visible, setVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    codeCategory: "",
    nameCategory: "",
  });
  const [editCategory, setEditCategory] = useState(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAllCategories();
      setCategories(response);
    } catch (error) {
      console.log("Lỗi khi tải danh mục:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(
    (category) =>
      category.codeCategory.toLowerCase().includes(searchCode.toLowerCase()) &&
      category.nameCategory.toLowerCase().includes(searchName.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editVisible) {
      setEditCategory({
        ...editCategory,
        [name]: value,
      });
    } else {
      setNewCategory({
        ...newCategory,
        [name]: value,
      });
    }
  };

  const handleAddCategory = async () => {
    try {
      const response = await categoriesApi.createCategory(newCategory);
      setCategories([...categories, response]);
      setVisible(false);
      setNewCategory({ codeCategory: "", nameCategory: "" });
      toast.success("Thêm danh mục thành công");
    } catch (error) {
      console.log("Lỗi khi thêm danh mục:", error);
    }
  };

  const handleDeleteCategory = async (_id) => {
    try {
      await categoriesApi.deleteCategory(_id);
      setCategories(categories.filter((category) => category._id !== _id));
      toast.success("Xóa danh mục thành công");
    } catch (error) {
      console.log("Lỗi khi xóa danh mục:", error);
    }
  };

  const handleEditClick = (category) => {
    setEditCategory(category);
    setEditVisible(true);
  };

  const handleUpdateCategory = async () => {
    try {
      const response = await categoriesApi.updateCategory(
        editCategory._id,
        editCategory
      );
      setCategories(
        categories.map((category) =>
          category._id === editCategory._id ? response : category
        )
      );
      setEditVisible(false);
      toast.success("Cập nhật danh mục thành công");
    } catch (error) {
      console.log("Lỗi khi cập nhật danh mục:", error);
    }
  };

  const handleDeleteClick = (_id) => {
    setDeleteCategoryId(_id);
    setDeleteVisible(true);
  };

  const confirmDelete = async () => {
    if (deleteCategoryId) {
      await handleDeleteCategory(deleteCategoryId);
      setDeleteVisible(false);
      setDeleteCategoryId(null);
    }
  };

  return (
    <div className="p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Danh Mục Sản Phẩm</h1>
      <div className="mb-4 lg:grid lg:grid-cols-[25%_55%_20%] lg:gap-2">
        <div className="mb-2 flex gap-3">
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search -mt-2"> </InputIcon>
            <InputText
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Tìm theo mã..."
              className="border p-3 w-full rounded px-10 text-[12px]"
            />
          </IconField>
        </div>
        <div className="mb-2 flex gap-3">
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search -mt-2"> </InputIcon>
            <InputText
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="border p-3 rounded px-10 text-[12px] w-[500px]"
            />
          </IconField>
        </div>
        <div className="mb-2 flex gap-3">
          <Button
            label="Thêm Danh Mục"
            icon="pi pi-plus"
            onClick={() => setVisible(true)}
            className="p-3 bg-blue-500 text-white rounded text-[12px] gap-2"
            style={{
              fontSize: "12px",
            }}
          />
        </div>
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 p-2">Mã Loại</th>
            <th className="border border-gray-300 p-2">Tên Loại</th>
            <th className="border border-gray-300 p-2 w-[120px]">Chức Năng</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map((category) => (
            <tr key={category._id} className="hover:bg-gray-100">
              <td className="border border-gray-300 p-2">
                {category.codeCategory}
              </td>
              <td className="border border-gray-300 p-2">
                {category.nameCategory}
              </td>
              <td className="border border-gray-300 p-2 flex items-center gap-4 w-[120px] justify-center">
                <Pencil1Icon
                  className="size-6 text-red-500 cursor-pointer p-1"
                  onClick={() => handleEditClick(category)}
                />
                <TrashIcon
                  className="size-6 cursor-pointer p-1"
                  onClick={() => handleDeleteClick(category._id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog
        header="Thêm Danh Mục"
        visible={visible}
        style={{ width: "30vw" }}
        onHide={() => setVisible(false)}
        headerClassName="p-4"
      >
        <div className="p-4 card flex flex-col justify-content-center mt-2">
          <div className="flex flex-col gap-8 mb-5">
            <FloatLabel>
              <InputText
                className="border p-2 rounded w-full"
                id="codeCategory"
                name="codeCategory"
                value={newCategory.codeCategory}
                onChange={handleInputChange}
              />
              <label htmlFor="codeCategory" className="text-sm -mt-3">
                Mã loại
              </label>
            </FloatLabel>
            <FloatLabel>
              <InputText
                className="border p-2 rounded w-full"
                id="nameCategory"
                name="nameCategory"
                value={newCategory.nameCategory}
                onChange={handleInputChange}
              />
              <label htmlFor="nameCategory" className="text-sm -mt-3">
                Tên loại
              </label>
            </FloatLabel>
          </div>
          <Button
            label="Thêm"
            onClick={handleAddCategory}
            className="p-3 bg-blue-500 text-white rounded text-[12px] gap-2"
          />
        </div>
      </Dialog>

      <Dialog
        header="Chỉnh Sửa Danh Mục"
        visible={editVisible}
        style={{ width: "30vw" }}
        onHide={() => setEditVisible(false)}
        headerClassName="p-4"
      >
        <div className="p-4 card flex flex-col justify-content-center mt-2">
          <div className="flex flex-col gap-8 mb-5">
            <FloatLabel>
              <InputText
                className="border p-2 rounded w-full"
                id="codeCategory"
                name="codeCategory"
                value={editCategory?.codeCategory || ""}
                onChange={handleInputChange}
              />
              <label htmlFor="codeCategory" className="text-sm -mt-3">
                Mã loại
              </label>
            </FloatLabel>
            <FloatLabel>
              <InputText
                className="border p-2 rounded w-full"
                id="nameCategory"
                name="nameCategory"
                value={editCategory?.nameCategory || ""}
                onChange={handleInputChange}
              />
              <label htmlFor="nameCategory" className="text-sm -mt-3">
                Tên loại
              </label>
            </FloatLabel>
          </div>
          <Button
            label="Cập nhật"
            onClick={handleUpdateCategory}
            className="p-3 bg-blue-500 text-white rounded text-[12px] gap-2"
          />
        </div>
      </Dialog>

      <Dialog
        header="Xác Nhận Xóa"
        visible={deleteVisible}
        style={{ width: "25vw" }}
        onHide={() => setDeleteVisible(false)}
        headerClassName="p-4"
      >
        <div className="px-4 mb-4 card flex flex-col justify-content-center ">
          <p className="mb-4 text-sm">Bạn có chắc chắn muốn xóa danh mục này không?</p>
          <div className="flex gap-2">
            <Button
              label="Có"
              onClick={confirmDelete}
              className="p-3 bg-green-500 text-white rounded text-[12px] gap-2 w-16"
            />
            <Button
              label="Không"
              onClick={() => setDeleteVisible(false)}
              className="p-3 bg-red-500 text-white rounded text-[12px] gap-2 w-16"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Categories;
