import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../../config/apiConfig";
import productsApi from "../../../api/productsApi";

import ProductForm from "./components/ProductForm";

const EditProduct = ({ currentUser, product: initialProduct, setVisible, onUpdateSuccess }) => {
  const navigate = useNavigate();
  const params = useParams();
  const toast = useRef(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Product state
  const [product, setProduct] = useState(initialProduct || {});
  
  // Form state
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productDescription, setProductDescription] = useState("");
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [unitOptionsList, setUnitOptionsList] = useState([]);
  
  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    message: "",
    header: "",
    accept: () => {},
    reject: () => {},
  });

  // Fetch product and other data
  useEffect(() => {
    const fetchData = async () => {
      const id = params.id || initialProduct?._id;
      
      // Get token for authorization
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (initialProduct && Object.keys(initialProduct).length > 0) {
        try {
          setLoading(true);
          
          // Fetch reference data only (categories, brands, suppliers)
          const [categoriesRes, brandsRes, suppliersRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/categories`, { headers }),
            axios.get(`${API_BASE_URL}/api/brands`, { headers }),
            axios.get(`${API_BASE_URL}/api/suppliers`, { headers }),
          ]);
          
          // Convert expiryDate to Date object if it's a string
          const productWithDateFixed = {
            ...initialProduct,
            expiryDate: initialProduct.expiryDate ? new Date(initialProduct.expiryDate) : null
          };
          
          // Set product data from props
          setProduct(productWithDateFixed);
          setSelectedCategory(initialProduct.productCategory?._id || initialProduct.productCategory);
          
          // Ensure productDescription is a string
          const descriptionText = Array.isArray(initialProduct.productDescription) 
            ? initialProduct.productDescription.join('\n') 
            : (initialProduct.productDescription || "");
          setProductDescription(descriptionText);
          
          // Set images
          if (initialProduct.productImages && initialProduct.productImages.length > 0) {
            setImagePreviews(initialProduct.productImages);
            setUploadedImages(initialProduct.productImages);
          }
          
          // Thiết lập đơn vị
          if (initialProduct.unitOptions && initialProduct.unitOptions.length > 0) {
            setUnitOptionsList(initialProduct.unitOptions);
          } else {
            // Tạo đơn vị mặc định nếu không có
            setUnitOptionsList([
              {
                unit: initialProduct.productUnit || "gram",
                price: initialProduct.productPrice || 0,
                conversionRate: 1,
                inStock: initialProduct.productStock || 0,
                isDefault: true,
              },
            ]);
          }
          
          // Set reference data
          setCategories(categoriesRes.data);
          setBrands(brandsRes.data);
          setSuppliers(suppliersRes.data);
        } catch (error) {
          console.error("Error fetching reference data:", error);
          toast.current.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể tải dữ liệu tham chiếu. Vui lòng thử lại sau.",
            life: 3000,
          });
        } finally {
          setLoading(false);
        }
      } else {
        try {
          setLoading(true);
          
          // Fetch product, categories, brands, and suppliers in parallel
          const [productRes, categoriesRes, brandsRes, suppliersRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/products/${id}`, { headers }),
            axios.get(`${API_BASE_URL}/api/categories`, { headers }),
            axios.get(`${API_BASE_URL}/api/brands`, { headers }),
            axios.get(`${API_BASE_URL}/api/suppliers`, { headers }),
          ]);
          
          const productData = productRes.data;
          
          // Convert expiryDate to Date object if it's a string
          if (productData.expiryDate && typeof productData.expiryDate === 'string') {
            productData.expiryDate = new Date(productData.expiryDate);
          }
          
          // Set product data
          setProduct(productData);
          setSelectedCategory(productData.productCategory?._id);
          
          // Ensure productDescription is a string
          const descriptionText = Array.isArray(productData.productDescription) 
            ? productData.productDescription.join('\n') 
            : (productData.productDescription || "");
          setProductDescription(descriptionText);
          
          // Set images
          if (productData.productImages && productData.productImages.length > 0) {
            setImagePreviews(productData.productImages);
            setUploadedImages(productData.productImages);
          }
          
          // Set unit options
          if (productData.unitOptions && productData.unitOptions.length > 0) {
            setUnitOptionsList(productData.unitOptions);
          } else {
            // Create default unit option if none exists
            setUnitOptionsList([
              {
                unit: productData.productUnit || "gram",
                price: productData.productPrice || 0,
                conversionRate: 1,
                inStock: productData.productStock || 0,
                isDefault: true,
              },
            ]);
          }
          
          // Set reference data
          setCategories(categoriesRes.data);
          setBrands(brandsRes.data);
          setSuppliers(suppliersRes.data);
        } catch (error) {
          console.error("Error fetching data:", error);
          toast.current.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.",
            life: 3000,
          });
          if (navigate) {
            navigate("/admin/products");
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [params.id, navigate, initialProduct]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  // Handle dropdown changes
  const handleDropdownChange = (e, name) => {
    if (name === "productCategory") {
      const selectedCat = e.value;
      setSelectedCategory(selectedCat);
      
      // Find the category object
      const category = categories.find((cat) => cat._id === selectedCat);
      if (category) {
        // Keep existing code or generate new one if needed
        const productCode = product.productCode || `${category.codeCategory}${new Date().getTime().toString().slice(-6)}`;
        setProduct({ 
          ...product, 
          productCategory: selectedCat, 
          productCode 
        });
      }
    } else if (name === "productBrand") {
      setProduct({ ...product, productBrandId: e.value });
    } else if (name === "productSupplier") {
      setProduct({ ...product, productSupplierId: e.value });
    } else if (name === "branchId") {
      setProduct({ ...product, branchId: e.value });
    } else if (name === "productUnit") {
      // Update the default unit in unitOptionsList
      const updatedUnitOptions = unitOptionsList.map((option) => {
        if (option.isDefault) {
          return { ...option, unit: e.value };
        }
        return option;
      });
      
      setUnitOptionsList(updatedUnitOptions);
      setProduct({ ...product, [name]: e.value });
    } else {
      setProduct({ ...product, [name]: e.value });
    }
  };

  // Handle number input changes
  const handleNumberChange = (e, name) => {
    setProduct({ ...product, [name]: e.value });
  };

  // Handle date changes
  const handleDateChange = (value, name) => {
    setProduct({ ...product, [name]: value });
  };

  // Handle unit options
  const addUnitOption = () => {
    setUnitOptionsList([
      ...unitOptionsList,
      {
        unit: product.productUnit,
        price: product.productPrice,
        conversionRate: 1,
        inStock: 0,
        isDefault: false,
      },
    ]);
  };

  const handleUnitOptionChange = (index, field, value) => {
    const updatedOptions = [...unitOptionsList];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setUnitOptionsList(updatedOptions);
  };

  const removeUnitOption = (index) => {
    // If removing default option, set another as default
    if (unitOptionsList[index].isDefault && unitOptionsList.length > 1) {
      const newDefaultIndex = index === 0 ? 1 : 0;
      const updatedOptions = unitOptionsList.map((option, i) => {
        if (i === newDefaultIndex) {
          return { ...option, isDefault: true };
        }
        return { ...option, isDefault: i !== index && option.isDefault };
      });
      
      setUnitOptionsList(updatedOptions.filter((_, i) => i !== index));
    } else {
      setUnitOptionsList(unitOptionsList.filter((_, i) => i !== index));
    }
  };

  const setDefaultUnit = (index) => {
    const updatedOptions = unitOptionsList.map((option, i) => ({
      ...option,
      isDefault: i === index,
    }));
    setUnitOptionsList(updatedOptions);
  };

  // Handle image upload
  const handleCloudinaryUpload = async () => {
    if (uploadedImages.length >= 5) {
      toast.current.show({
        severity: "warn",
        summary: "Giới hạn",
        detail: "Bạn chỉ có thể tải lên tối đa 5 hình ảnh",
        life: 3000,
      });
      return;
    }

    if (typeof window.cloudinary === "undefined") {
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Cloudinary widget không khả dụng",
        life: 3000,
      });
      return;
    }

    // Create a widget configuration
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: "drlxpdaub",
        uploadPreset: "quanlythucpham",
        sources: ["local", "url", "camera"],
        multiple: true,
        clientAllowedFormats: ["jpg", "png", "jpeg", "gif"],
        maxFileSize: 5000000, // 5MB
        folder: "products"
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          toast.current.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Có lỗi xảy ra khi tải lên hình ảnh",
            life: 3000,
          });
          return;
        }
        
        if (result && result.event === "success") {
          const imageUrl = result.info.secure_url;
          console.log("Image uploaded successfully:", imageUrl);
          
          setImagePreviews([...imagePreviews, imageUrl]);
          setUploadedImages([...uploadedImages, imageUrl]);
        }
      }
    );

    // Open the upload widget
    widget.open();
  };

  const handleRemoveImage = (index) => {
    const newPreviews = [...imagePreviews];
    const newUploaded = [...uploadedImages];
    
    newPreviews.splice(index, 1);
    newUploaded.splice(index, 1);
    
    setImagePreviews(newPreviews);
    setUploadedImages(newUploaded);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!product.productName || !product.productCategory || !product.productPrice) {
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Vui lòng điền đầy đủ các trường bắt buộc",
        life: 3000,
      });
      return;
    }

    if (uploadedImages.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Bạn chưa tải lên hình ảnh nào cho sản phẩm",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      
      // Get branchId from localStorage or use current user's branch or keep existing
      const branchId = localStorage.getItem("userBranch") || currentUser?.branchId || product.branchId;
      
      // Prepare product data
      const productData = {
        ...product,
        branchId: branchId, // Add branchId to product data
        productImages: uploadedImages,
        productDescription: productDescription.split("\n"),
        unitOptions: unitOptionsList,
        updatedBy: currentUser?._id || "unknown",
      };
      
      // Submit product update using productsApi
      const id = params.id || product._id;
      const response = await productsApi.updateProduct(id, productData);
      
      // Handle success
      if (onUpdateSuccess) {
        onUpdateSuccess(id, response);
      }
      
      if (setVisible) {
        setVisible(false);
      } else {
        setTimeout(() => {
          navigate("/admin/products");
        }, 1500);
      }
      
      toast.current.show({
        severity: "success",
        summary: "Thành công",
        detail: "Cập nhật sản phẩm thành công",
        life: 3000,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      
      // Hiển thị thông báo lỗi cụ thể từ API hoặc thông báo lỗi mặc định
      const errorMessage = error.message || "Có lỗi xảy ra khi cập nhật sản phẩm";
      
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: errorMessage,
        life: 5000,
      });
      
      // Nếu lỗi xác thực, có thể chuyển hướng đến trang đăng nhập
      if (error.message?.includes("đăng nhập lại") || 
          error.response?.status === 401 || 
          error.response?.status === 403) {
        setTimeout(() => {
          navigate("/login", { state: { from: `/admin/products/edit/${params.id}` } });
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setConfirmDialog({
      visible: true,
      message: "Bạn có chắc chắn muốn hủy? Các thay đổi sẽ không được lưu.",
      header: "Xác nhận hủy",
      accept: () => {
        navigate("/admin/products");
      },
      reject: () => {
        setConfirmDialog({ ...confirmDialog, visible: false });
      },
    });
  };

  return (
    <>
      <Helmet>
        <title>Cập nhật sản phẩm | Admin</title>
      </Helmet>
      
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
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        isEditMode={true}
        handleCancel={handleCancel}
      />
    </>
  );
};

EditProduct.propTypes = {
  currentUser: PropTypes.object.isRequired,
  product: PropTypes.object,
  setVisible: PropTypes.func,
  onUpdateSuccess: PropTypes.func,
};

export default EditProduct; 