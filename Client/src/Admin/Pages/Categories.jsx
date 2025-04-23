import { useState, useEffect } from "react";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { FloatLabel } from "primereact/floatlabel";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { TrashIcon } from "lucide-react";
import categoriesApi from "../../api/categoriesApi";
import { toast } from "sonner";

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

  // Tạo mã loại tự động khi mở dialog thêm mới
  const handleOpenAddDialog = () => {
    // Tìm mã lớn nhất hiện tại
    const generateNewCode = () => {
      if (categories.length === 0) return "CAT001";

      // Lọc ra các mã có định dạng CATxxx
      const codePrefixPattern = /^CAT(\d{3})$/;
      const existingCodes = categories
        .map((cat) => cat.codeCategory)
        .filter((code) => codePrefixPattern.test(code))
        .map((code) => {
          const match = code.match(codePrefixPattern);
          return match ? parseInt(match[1], 10) : 0;
        });

      // Nếu không có mã nào phù hợp với pattern
      if (existingCodes.length === 0) return "CAT001";

      // Tìm số lớn nhất và tăng lên 1
      const maxCodeNumber = Math.max(...existingCodes);
      const newCodeNumber = maxCodeNumber + 1;
      return `CAT${newCodeNumber.toString().padStart(3, "0")}`;
    };

    const newCode = generateNewCode();
    setNewCategory({
      codeCategory: newCode,
      nameCategory: "",
    });
    setVisible(true);
  };

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
      // Kiểm tra xem đã nhập tên danh mục chưa
      if (!newCategory.nameCategory.trim()) {
        toast.error("Vui lòng nhập tên danh mục");
        return;
      }

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
    <div className="p-2 md:p-4">
      <h1 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">Danh Mục Sản Phẩm</h1>
      <div className="flex flex-col md:flex-row gap-2 mb-3 md:mb-4">
        <div className="w-full md:w-1/4">
          <IconField iconPosition="left" className="w-full">
            <InputIcon className="pi pi-search -mt-2"> </InputIcon>
            <InputText
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Tìm theo mã..."
              className="border p-2 md:p-3 w-full rounded px-10 text-xs md:text-sm"
            />
          </IconField>
        </div>
        <div className="w-full md:w-1/2">
          <IconField iconPosition="left" className="w-full">
            <InputIcon className="pi pi-search -mt-2"> </InputIcon>
            <InputText
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="border p-2 md:p-3 rounded px-10 text-xs md:text-sm w-full"
            />
          </IconField>
        </div>
        <div className="w-full md:w-1/4">
          <Button
            label="Thêm Danh Mục"
            icon="pi pi-plus"
            onClick={handleOpenAddDialog}
            className="p-2 md:p-3 bg-blue-500 text-white rounded text-xs md:text-sm w-full"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">Mã Loại</th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">Tên Loại</th>
              <th className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm w-[100px] md:w-[120px]">Chức Năng</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((category) => (
              <tr key={category._id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {category.codeCategory}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  {category.nameCategory}
                </td>
                <td className="border border-gray-300 p-1 md:p-2 text-xs md:text-sm">
                  <div className="flex justify-center space-x-1 md:space-x-2">
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-warning p-button-sm text-[10px] md:text-xs p-1 md:p-2"
                      onClick={() => handleEditClick(category)}
                    />
                    <Button
                      icon="pi pi-trash"
                      className="p-button-danger p-button-sm text-[10px] md:text-xs p-1 md:p-2"
                      onClick={() => handleDeleteClick(category._id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filteredCategories.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center p-4 text-xs md:text-sm text-gray-500">
                  Không có danh mục nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        header="Thêm Danh Mục"
        visible={visible}
        onHide={() => setVisible(false)}
        className="w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw]"
      >
        <div className="p-2 md:p-4">
          <div className="mb-3 md:mb-4">
            <FloatLabel>
              <InputText
                id="codeCategory"
                name="codeCategory"
                value={newCategory.codeCategory}
                onChange={handleInputChange}
                className="w-full p-2 md:p-3 text-xs md:text-sm"
                readOnly
              />
              <label htmlFor="codeCategory" className="text-xs md:text-sm">Mã Danh Mục</label>
            </FloatLabel>
          </div>
          <div className="mb-3 md:mb-4">
            <FloatLabel>
              <InputText
                id="nameCategory"
                name="nameCategory"
                value={newCategory.nameCategory}
                onChange={handleInputChange}
                className="w-full p-2 md:p-3 text-xs md:text-sm"
              />
              <label htmlFor="nameCategory" className="text-xs md:text-sm">Tên Danh Mục</label>
            </FloatLabel>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              label="Hủy"
              icon="pi pi-times"
              onClick={() => setVisible(false)}
              className="p-button-text text-xs md:text-sm"
            />
            <Button
              label="Lưu"
              icon="pi pi-check"
              onClick={handleAddCategory}
              className="p-button-success text-xs md:text-sm"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Chỉnh Sửa Danh Mục"
        visible={editVisible}
        onHide={() => setEditVisible(false)}
        className="w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw]"
      >
        {editCategory && (
          <div className="p-2 md:p-4">
            <div className="mb-3 md:mb-4">
              <FloatLabel>
                <InputText
                  id="codeCategory"
                  name="codeCategory"
                  value={editCategory.codeCategory}
                  onChange={handleInputChange}
                  className="w-full p-2 md:p-3 text-xs md:text-sm"
                  readOnly
                />
                <label htmlFor="codeCategory" className="text-xs md:text-sm">Mã Danh Mục</label>
              </FloatLabel>
            </div>
            <div className="mb-3 md:mb-4">
              <FloatLabel>
                <InputText
                  id="nameCategory"
                  name="nameCategory"
                  value={editCategory.nameCategory}
                  onChange={handleInputChange}
                  className="w-full p-2 md:p-3 text-xs md:text-sm"
                />
                <label htmlFor="nameCategory" className="text-xs md:text-sm">Tên Danh Mục</label>
              </FloatLabel>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                label="Hủy"
                icon="pi pi-times"
                onClick={() => setEditVisible(false)}
                className="p-button-text text-xs md:text-sm"
              />
              <Button
                label="Lưu"
                icon="pi pi-check"
                onClick={handleUpdateCategory}
                className="p-button-success text-xs md:text-sm"
              />
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        header="Xác Nhận Xóa"
        visible={deleteVisible}
        onHide={() => setDeleteVisible(false)}
        className="w-[90vw] sm:w-[60vw] md:w-[40vw] lg:w-[30vw]"
      >
        <div className="p-2 md:p-4">
          <p className="text-xs md:text-sm mb-4">Bạn có chắc chắn muốn xóa danh mục này?</p>
          <div className="flex justify-end gap-2">
            <Button
              label="Không"
              icon="pi pi-times"
              onClick={() => setDeleteVisible(false)}
              className="p-button-text text-xs md:text-sm"
            />
            <Button
              label="Có"
              icon="pi pi-check"
              onClick={confirmDelete}
              className="p-button-danger text-xs md:text-sm"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Categories;
