/* eslint-disable no-unused-vars */
import { Card } from "primereact/card";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { toast as sonnerToast } from "sonner";
import { ProgressSpinner } from "primereact/progressspinner";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tooltip } from "primereact/tooltip";
import PropTypes from "prop-types";

import {
  BasicInfoFields,
  DetailInfoFields,
  DiscountDateFields,
  ExpiryDateField,
  DescriptionFields,
  UnitOptionsSection,
  ImageUploadSection,
} from "./FormFields";

const ProductForm = ({
  product,
  setProduct,
  loading,
  handleSubmit,
  handleInputChange,
  handleDropdownChange,
  handleNumberChange,
  handleDateChange,
  selectedCategory,
  categories,
  brands,
  suppliers,
  productDescription,
  setProductDescription,
  unitOptionsList,
  addUnitOption,
  handleUnitOptionChange,
  removeUnitOption,
  setDefaultUnit,
  imagePreviews,
  handleCloudinaryUpload,
  handleRemoveImage,
  activeIndex,
  setActiveIndex,
  confirmDialog,
  setConfirmDialog,
  isEditMode,
  handleCancel,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <ConfirmDialog
        visible={confirmDialog.visible}
        onHide={() => setConfirmDialog({ ...confirmDialog, visible: false })}
        message={confirmDialog.message}
        header={confirmDialog.header}
        icon="pi pi-exclamation-triangle"
        accept={confirmDialog.accept}
        reject={confirmDialog.reject}
        acceptLabel="Đồng ý"
        rejectLabel="Hủy"
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ProgressSpinner
              style={{ width: "50px", height: "50px" }}
              strokeWidth="4"
              animationDuration=".5s"
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <TabView
              activeIndex={activeIndex}
              onTabChange={(e) => setActiveIndex(e.index)}
              className="product-tabs"
              pt={{
                nav: { className: "flex border-b border-gray-200" },
                inkbar: { className: "bg-green-500" },
                navContainer: { className: "px-8" },
                panelContainer: { className: "p-8" },
              }}
            >
              <TabPanel
                header="Thông tin cơ bản"
                leftIcon="pi pi-info-circle mr-2 p-4"
              >
                <div className="p-6 bg-white rounded-lg mb-4">
                  <BasicInfoFields
                    product={product}
                    handleInputChange={handleInputChange}
                    handleDropdownChange={handleDropdownChange}
                    selectedCategory={selectedCategory}
                    categories={categories}
                    handleNumberChange={handleNumberChange}
                  />
                </div>
              </TabPanel>

              <TabPanel
                header="Thông tin chi tiết"
                leftIcon="pi pi-list mr-2 p-4"
              >
                <div className="p-6 bg-white rounded-lg mb-4">
                  <DetailInfoFields
                    product={product}
                    handleInputChange={handleInputChange}
                    handleDropdownChange={handleDropdownChange}
                    handleNumberChange={handleNumberChange}
                    brands={brands}
                    suppliers={suppliers}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <ExpiryDateField
                      product={product}
                      handleDateChange={handleDateChange}
                    />

                    <div className="field">
                      {product.productDiscount > 0 && (
                        <DiscountDateFields
                          product={product}
                          handleDateChange={handleDateChange}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel
                header="Mô tả sản phẩm"
                leftIcon="pi pi-align-left mr-2 p-4"
              >
                <div className="p-6 bg-white rounded-lg mb-4">
                  <DescriptionFields
                    product={product}
                    handleInputChange={handleInputChange}
                    productDescription={productDescription}
                    setProductDescription={setProductDescription}
                  />
                </div>
              </TabPanel>

              <TabPanel header="Đơn vị đo" leftIcon="pi pi-calculator mr-2 p-4">
                <div className="p-6 bg-white rounded-lg mb-4">
                  <UnitOptionsSection
                    unitOptionsList={unitOptionsList}
                    addUnitOption={addUnitOption}
                    handleUnitOptionChange={handleUnitOptionChange}
                    removeUnitOption={removeUnitOption}
                    setDefaultUnit={setDefaultUnit}
                    product={product}
                  />
                </div>
              </TabPanel>

              <TabPanel header="Hình ảnh" leftIcon="pi pi-images mr-2 p-4">
                <div className="p-6 bg-white rounded-lg mb-4">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">
                      Hình ảnh sản phẩm
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Tải lên tối đa 5 hình ảnh cho sản phẩm. Hình ảnh đầu tiên
                      sẽ được sử dụng làm ảnh đại diện.
                    </p>

                    <ImageUploadSection
                      imagePreviews={imagePreviews}
                      handleCloudinaryUpload={handleCloudinaryUpload}
                      handleRemoveImage={handleRemoveImage}
                    />
                  </div>
                </div>
              </TabPanel>
            </TabView>
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6 p-2">
          <Button
            type="button"
            label="Hủy"
            icon="pi pi-times"
            className="bg-red-600 hover:bg-red-700 text-white transition-colors px-5 py-2.5 rounded-md text-sm font-medium"
            onClick={handleCancel}
          />
          <Button
            type="submit"
            label={isEditMode ? "Cập nhật" : "Lưu"}
            icon="pi pi-check"
            className="bg-[#51bb1a] hover:bg-[#409114] text-white transition-colors px-5 py-2.5 rounded-md text-sm font-medium"
            disabled={loading}
          />
        </div>
      </form>
    </div>
  );
};

ProductForm.propTypes = {
  product: PropTypes.object.isRequired,
  setProduct: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  toast: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleDropdownChange: PropTypes.func.isRequired,
  handleNumberChange: PropTypes.func.isRequired,
  handleDateChange: PropTypes.func.isRequired,
  selectedCategory: PropTypes.string,
  categories: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  suppliers: PropTypes.array.isRequired,
  productDescription: PropTypes.string.isRequired,
  setProductDescription: PropTypes.func.isRequired,
  unitOptionsList: PropTypes.array.isRequired,
  addUnitOption: PropTypes.func.isRequired,
  handleUnitOptionChange: PropTypes.func.isRequired,
  removeUnitOption: PropTypes.func.isRequired,
  setDefaultUnit: PropTypes.func.isRequired,
  imagePreviews: PropTypes.array.isRequired,
  handleCloudinaryUpload: PropTypes.func.isRequired,
  handleRemoveImage: PropTypes.func.isRequired,
  activeIndex: PropTypes.number.isRequired,
  setActiveIndex: PropTypes.func.isRequired,
  confirmDialog: PropTypes.object.isRequired,
  setConfirmDialog: PropTypes.func.isRequired,
  isEditMode: PropTypes.bool,
  handleCancel: PropTypes.func.isRequired,
};

export default ProductForm;
