import React, { useState } from "react";
import { Button, InputText, FloatLabel } from "primereact";

const EditProduct = ({ product, setVisible, handleUpdateProduct }) => {
  const [editedProduct, setEditedProduct] = useState(product);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct({
      ...editedProduct,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleUpdateProduct(editedProduct);
  };

  return (
    <div className="p-4">
      <div className="flex flex-col gap-6 mb-5">
        <FloatLabel>
          <InputText
            className="border p-2 rounded w-full"
            id="productName"
            name="productName"
            value={editedProduct.productName}
            onChange={handleInputChange}
          />
          <label htmlFor="productName" className="text-sm -mt-3">
            Tên sản phẩm
          </label>
        </FloatLabel>

        {/* Thêm các trường khác tương tự */}

        <Button
          label="Cập nhật"
          onClick={handleSubmit}
          className="p-3 bg-blue-500 text-white rounded text-[12px] gap-2"
        />
      </div>
    </div>
  );
};

export default EditProduct;
