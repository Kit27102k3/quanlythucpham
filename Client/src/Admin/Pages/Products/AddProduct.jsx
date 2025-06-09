/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";
import { Toast } from "primereact/toast";
import { API_BASE_URL } from "../../../config/apiConfig";
import productsApi from "../../../api/productsApi";
import ProductForm from "./components/ProductForm";

const AddProduct = ({ onHide, onAddSuccess, currentUser = { _id: "", name: "Người dùng" } }) => {
  const navigate = useNavigate();
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [product, setProduct] = useState({
    productName: "",
    productCategory: "",
    productPrice: "",
    productStatus: "Còn hàng",
    productBrandId: "",
    productSupplierId: "",
    branchId: "",
    productOrigin: "",
    productStock: 0,
    productDiscount: 0,
    productWeight: 0,
    productUnit: "gram",
    productDescription: "",
    productIntroduction: "",
    productDetails: "",
    productInfo: "",
    productImages: [],
    discountStartDate: null,
    discountEndDate: null,
    expiryDate: null,
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productDescription, setProductDescription] = useState("");
  const [hasDiscount, setHasDiscount] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [unitOptionsList, setUnitOptionsList] = useState([
    {
      unit: "gram",
      price: 0,
      conversionRate: 1,
      inStock: 0,
      isDefault: true,
    },
  ]);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    message: "",
    header: "",
    accept: () => {},
    reject: () => {},
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get token for authorization
        const token = localStorage.getItem("accessToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [categoriesRes, brandsRes, suppliersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/categories`, { headers }),
          axios.get(`${API_BASE_URL}/api/brands`, { headers }),
          axios.get(`${API_BASE_URL}/api/suppliers`, { headers }),
        ]);

        setCategories(categoriesRes.data);
        setBrands(brandsRes.data);
        setSuppliers(suppliersRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể tải dữ liệu. Vui lòng thử lại sau.",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateProductCode = (categoryId) => {
    // Tìm thông tin danh mục được chọn
    const selectedCat = categories.find((cat) => cat._id === categoryId);
    if (!selectedCat) return "";

    // Lấy mã loại từ danh mục
    const categoryCode = selectedCat.codeCategory;

    // Tìm sản phẩm có cùng mã loại để tạo số thứ tự
    const getNextSequenceNumber = async () => {
      try {
        const products = await productsApi.getAllProducts();
        // Lọc sản phẩm cùng mã loại và có mã sản phẩm dạng CATXXX-NNN
        const regex = new RegExp(`^${categoryCode}-\\d{3}$`);
        const matchingProducts = products.filter((p) =>
          regex.test(p.productCode)
        );

        if (matchingProducts.length === 0) return `${categoryCode}-001`;

        // Tìm số thứ tự lớn nhất hiện tại
        const maxSequence = Math.max(
          ...matchingProducts.map((p) => {
            const match = p.productCode.match(/-(\d{3})$/);
            return match ? parseInt(match[1], 10) : 0;
          })
        );

        // Tăng số thứ tự lên 1
        const nextSequence = maxSequence + 1;
        return `${categoryCode}-${nextSequence.toString().padStart(3, "0")}`;
      } catch (error) {
        console.error("Lỗi khi tạo mã sản phẩm:", error);
        return `${categoryCode}-001`;
      }
    };

    getNextSequenceNumber().then((code) => {
      setProduct((prev) => ({
        ...prev,
        productCode: code,
      }));
    });

    return `${categoryCode}-XXX`;
  };

  // Handle dropdown changes
  const handleDropdownChange = (e, name) => {
    if (name === "productCategory") {
      const categoryId = e.value;

      // Tìm tên danh mục dựa vào ID
      const selectedCat = categories.find((cat) => cat._id === categoryId);
      if (selectedCat) {
        setProduct((prev) => ({
          ...prev,
          productCategory: categoryId,
          productTypeName: selectedCat.nameCategory,
        }));

        // Generate product code after setting category
        generateProductCode(categoryId);
      } else {
        console.error("Category not found for ID:", categoryId);
        toast.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không tìm thấy danh mục đã chọn. Vui lòng thử lại.",
          life: 3000,
        });

        setProduct((prev) => ({
          ...prev,
          productCategory: categoryId,
        }));
      }
    } else if (name === "productBrand") {
      const brandId = e.value;
      const selectedBrand = brands.find((brand) => brand._id === brandId);

      setProduct((prev) => ({
        ...prev,
        productBrand: selectedBrand ? selectedBrand.name : "",
        productBrandId: brandId,
      }));
    } else if (name === "productSupplier") {
      const supplierId = e.value;
      const selectedSupplier = suppliers.find(
        (supplier) => supplier._id === supplierId
      );

      setProduct((prev) => ({
        ...prev,
        productSupplier: selectedSupplier ? selectedSupplier.name : "",
        productSupplierId: supplierId,
      }));
    } else if (name === "productUnit") {
      setProduct((prev) => ({
        ...prev,
        productUnit: e.value,
      }));
    } else {
      setProduct((prev) => ({
        ...prev,
        [name]: e.value,
      }));
    }
  };

  const handleNumberChange = (e, name) => {
    setProduct((prev) => ({
      ...prev,
      [name]: e.value !== null ? e.value.toString() : "0",
    }));

    // Khi thay đổi giảm giá, kiểm tra và bật/tắt tùy chọn thời hạn giảm giá
    if (name === "productDiscount") {
      setHasDiscount(e.value > 0);

      if (e.value === 0 || e.value === null) {
        // Xóa thời hạn giảm giá khi đặt giảm giá = 0
        setProduct((prev) => ({
          ...prev,
          discountStartDate: null,
          discountEndDate: null,
        }));
      }
    }
  };

  const handleDateChange = (date, name) => {
    setProduct((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  const addUnitOption = () => {
    setUnitOptionsList([
      ...unitOptionsList,
      { unit: "", price: "", conversionRate: 1, inStock: 0, isDefault: false },
    ]);
  };

  const handleUnitOptionChange = (index, field, value) => {
    const updatedOptions = [...unitOptionsList];
    updatedOptions[index][field] = value;
    setUnitOptionsList(updatedOptions);
  };

  const removeUnitOption = (index) => {
    const updatedOptions = [...unitOptionsList];
    updatedOptions.splice(index, 1);

    // Nếu xóa đơn vị mặc định, đặt đơn vị đầu tiên là mặc định
    if (unitOptionsList[index].isDefault && updatedOptions.length > 0) {
      updatedOptions[0].isDefault = true;
    }

    setUnitOptionsList(updatedOptions);
  };

  const setDefaultUnit = (index) => {
    const updatedOptions = unitOptionsList.map((option, i) => ({
      ...option,
      isDefault: i === index,
    }));
    setUnitOptionsList(updatedOptions);
  };

  const handleCloudinaryUpload = () => {
    if (typeof window.cloudinary === "undefined") {
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Cloudinary widget không khả dụng",
        life: 3000,
      });
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: "drlxpdaub",
        uploadPreset: "quanlythucpham",
        sources: ["local", "url", "camera"],
        multiple: true,
        clientAllowedFormats: ["jpg", "png", "jpeg", "gif"],
        maxFileSize: 5000000, // 5MB
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          const imageUrl = result.info.secure_url;
          console.log("Image uploaded successfully:", imageUrl);

          // Add to image previews
          setImagePreviews((prev) => [...prev, imageUrl]);

          // Add to product images
          setProduct((prev) => ({
            ...prev,
            productImages: Array.isArray(prev.productImages) 
              ? [...prev.productImages, imageUrl] 
              : [imageUrl]
          }));
        } else if (error) {
          console.error("Error uploading image:", error);
          toast.current.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Lỗi khi tải ảnh lên Cloudinary",
            life: 3000,
          });
        }
      }
    );

    widget.open();
  };

  const handleRemoveImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setProduct((prev) => ({
      ...prev,
      productImages: Array.isArray(prev.productImages)
        ? prev.productImages.filter((_, i) => i !== index)
        : []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

      if (
        !product.productName ||
      !product.productPrice ||
      !product.productCategory
      ) {
      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Vui lòng điền đầy đủ thông tin bắt buộc: Tên, Giá và Danh mục",
          life: 3000,
        });
      } else {
        alert("Vui lòng điền đầy đủ thông tin bắt buộc: Tên, Giá và Danh mục");
      }
      return;
    }

    if (!Array.isArray(product.productImages) || product.productImages.length === 0) {
      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Vui lòng thêm ít nhất một hình ảnh sản phẩm",
          life: 3000,
        });
      } else {
        alert("Vui lòng thêm ít nhất một hình ảnh sản phẩm");
      }
      return;
    }

    // Kiểm tra thời hạn giảm giá
    if (hasDiscount && product.discountStartDate && product.discountEndDate) {
      const startDate = new Date(product.discountStartDate);
      const endDate = new Date(product.discountEndDate);

      if (startDate > endDate) {
        if (toast.current) {
          toast.current.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Ngày bắt đầu giảm giá không thể sau ngày kết thúc",
            life: 3000,
          });
        } else {
          alert("Ngày bắt đầu giảm giá không thể sau ngày kết thúc");
        }
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Chuẩn bị dữ liệu unitOptions
      const preparedUnitOptions = unitOptionsList.map((option) => ({
        unit: option.unit,
        price: parseFloat(option.price) || parseFloat(product.productPrice),
        conversionRate: parseFloat(option.conversionRate) || 1,
        inStock:
          parseInt(option.inStock) || parseInt(product.productStock) || 0,
        isDefault: option.isDefault,
      }));

      // Validate thông tin unitOptions
      if (preparedUnitOptions.length > 0) {
        const hasDefault = preparedUnitOptions.some((opt) => opt.isDefault);
        if (!hasDefault) {
          preparedUnitOptions[0].isDefault = true;
        }
      }

      // Cập nhật giá và đơn vị mặc định từ unitOptions
      const defaultOption = preparedUnitOptions.find((opt) => opt.isDefault);
      if (defaultOption) {
        product.productPrice = defaultOption.price.toString();
        product.productUnit = defaultOption.unit;
        product.productStock = defaultOption.inStock.toString();
      }

      // Tìm tên danh mục dựa vào ID đã chọn
      const selectedCat = categories.find(
        (cat) => cat._id === product.productCategory
      );
      if (!selectedCat) {
        if (toast.current) {
          toast.current.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không tìm thấy thông tin danh mục đã chọn",
            life: 3000,
          });
        } else {
          alert("Không tìm thấy thông tin danh mục đã chọn");
        }
        setIsSubmitting(false);
        return;
      }

      console.log("Sử dụng tên danh mục:", selectedCat.nameCategory);

      // Create data object for API request
      const productData = {
        productName: product.productName,
        productPrice: parseFloat(product.productPrice),
        productCategory: selectedCat.nameCategory,
        productCategoryId: product.productCategory,
        categoryId: product.productCategory,
        productBrand: product.productBrand || "",
        productBrandId: product.productBrandId || null,
        productSupplier: product.productSupplier || "",
        productSupplierId: product.productSupplierId || null,
        productStatus: product.productStatus || "Còn hàng",
        productDiscount: product.productDiscount || "0",
        productStock: parseInt(product.productStock),
        productCode: product.productCode || "",
        productWeight: parseFloat(product.productWeight) || 0,
        productOrigin: product.productOrigin || "",
        productIntroduction: product.productIntroduction || "",
        productInfo: product.productInfo || "",
        productDetails: product.productDetails || "",
        productTypeName: selectedCat.nameCategory,
        productUnit: product.productUnit || "gram",
        imageUrls: product.productImages, // Use Cloudinary URLs
        unitOptions: preparedUnitOptions,
        // Thêm trường để xác định quyền
        role: localStorage.getItem("userRole") || "user",
        branchId: localStorage.getItem("branchId") || ""
      };

      // Add discount dates if applicable
      if (hasDiscount && product.discountStartDate) {
        productData.discountStartDate = product.discountStartDate.toISOString();
      }
      if (hasDiscount && product.discountEndDate) {
        productData.discountEndDate = product.discountEndDate.toISOString();
      }

      // Add expiry date if set
      if (product.expiryDate) {
        productData.expiryDate = product.expiryDate.toISOString();
      }

      // Add description
      const descriptions = productDescription
        .split(".")
        .map((desc) => desc.trim())
        .filter((desc) => desc !== "");
      productData.productDescription = JSON.stringify(descriptions);

      const response = await productsApi.createProduct(productData);
      console.log("Thêm sản phẩm thành công:", response);
      
      // Hiển thị thông báo thành công
      if (toast.current) {
      toast.current.show({
        severity: "success",
        summary: "Thành công",
          detail: "Thêm sản phẩm thành công!",
        life: 3000,
      });
      } else {
        alert("Thêm sản phẩm thành công!");
      }
      
      // Gọi callback onAddSuccess nếu có
      if (onAddSuccess && typeof onAddSuccess === 'function') {
        onAddSuccess(response);
      }
      
      // Đóng form sau khi thêm thành công
      setTimeout(() => {
        if (onHide && typeof onHide === 'function') {
          onHide();
        }
      }, 1000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi không xác định";
      
      if (toast.current) {
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
          detail: `Thêm sản phẩm thất bại: ${errorMessage}`,
          life: 5000,
      });
      } else {
        alert(`Thêm sản phẩm thất bại: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (
      product.productName ||
      product.productDescription ||
      uploadedImages.length > 0
    ) {
      setConfirmDialog({
        visible: true,
        message: "Bạn có chắc chắn muốn hủy? Tất cả dữ liệu sẽ bị mất.",
        header: "Xác nhận hủy",
        accept: () => {
          if (onHide) {
            onHide();
          } else {
            navigate("/admin/products");
          }
        },
        reject: () => {
          setConfirmDialog({ ...confirmDialog, visible: false });
        },
      });
    } else {
      if (onHide) {
        onHide();
      } else {
        navigate("/admin/products");
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Thêm sản phẩm mới | Admin</title>
      </Helmet>

      <Toast ref={toast} />

      <ProductForm
        product={product}
        setProduct={setProduct}
        loading={loading}
        toast={toast}
        handleSubmit={handleSubmit}
        handleInputChange={handleInputChange}
        handleDropdownChange={handleDropdownChange}
        handleNumberChange={handleNumberChange}
        handleDateChange={handleDateChange}
        selectedCategory={selectedCategory}
        categories={categories}
        brands={brands}
        suppliers={suppliers}
        productDescription={productDescription}
        setProductDescription={setProductDescription}
        unitOptionsList={unitOptionsList}
        addUnitOption={addUnitOption}
        handleUnitOptionChange={handleUnitOptionChange}
        removeUnitOption={removeUnitOption}
        setDefaultUnit={setDefaultUnit}
        imagePreviews={imagePreviews}
        handleCloudinaryUpload={handleCloudinaryUpload}
        handleRemoveImage={handleRemoveImage}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        isSubmitting={isSubmitting}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        isEditMode={false}
        handleCancel={handleCancel}
      />
    </>
  );
};

AddProduct.propTypes = {
  currentUser: PropTypes.object,
  onHide: PropTypes.func.isRequired,
  onAddSuccess: PropTypes.func.isRequired,
};

export default AddProduct;
