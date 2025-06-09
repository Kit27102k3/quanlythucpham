/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { DotFilledIcon, MinusIcon, PlusIcon } from "@radix-ui/react-icons";
import { Card, CardContent } from "../../component/ui/card";
import { ChevronDown, ChevronRight, Reply, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import productsApi from "../../../api/productsApi";
import reviewsApi from "../../../api/reviewsApi";
import { useParams, useNavigate } from "react-router-dom";
import formatCurrency from "../../Until/FotmatPrice";
import "../../../index.css";
import RelatedProducts from "./RelatedProducts";
import { Star, StarHalf } from "lucide-react";
import { toast, Toaster } from "sonner";
import cartApi from "../../../api/cartApi";
import axios from "axios";
import { API_BASE_URL } from "../../../config/apiConfig";

const Kitchen = lazy(() => import("./Kitchen"));

export default function ProductDetails() {
  const [selectedImage, setSelectedImage] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [count, setCount] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [overview, setOverview] = useState(false);
  const [introduce, setIntroduce] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [products, setProducts] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [userName, setUserName] = useState("");
  const [reviewsVisible, setReviewsVisible] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { slug } = useParams();
  const topElementRef = useRef(null);
  const navigate = useNavigate();
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [unitPrice, setUnitPrice] = useState(0);
  const checkIsAuthenticated = () => {
    const accessToken = localStorage.getItem("accessToken");
    const access_token = localStorage.getItem("access_token");
    const token = localStorage.getItem("token");
    const userAccessToken = localStorage.getItem("userAccessToken");
    const adminAccessToken = localStorage.getItem("adminAccessToken");
    return !!(
      accessToken ||
      access_token ||
      token ||
      userAccessToken ||
      adminAccessToken
    ); // Chuyển token thành boolean
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const allProducts = await productsApi.getAllProducts();

        const product = allProducts.find(
          (p) =>
            p.productName
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "") === slug
        );
        if (product) {
          // Fetch branch name if branchId exists
          if (product.branchId) {
            try {
              const token = localStorage.getItem("accessToken");
              const headers = token ? { Authorization: `Bearer ${token}` } : {};
              const branchResponse = await axios.get(
                `${API_BASE_URL}/api/branches/${product.branchId}`,
                { headers }
              );
              if (branchResponse.data && branchResponse.data.branch) {
                product.branchName = branchResponse.data.branch.name;
              }
            } catch (branchError) {
              console.error("Error fetching branch info:", branchError);
            }
          }

          setProducts(product);
          setProductImages(product.productImages);
          setSelectedImage(product.productImages[0] || null);
          sessionStorage.setItem("currentProductId", product._id);
          fetchProductReviews(product._id);
          if (product) {
            if (product.unitOptions && product.unitOptions.length > 0) {
              setAvailableUnits(product.unitOptions);
              const defaultUnit = product.unitOptions.find(
                (opt) => opt.isDefault
              );
              if (defaultUnit) {
                setSelectedUnit(defaultUnit);
                setUnitPrice(defaultUnit.price);
              } else {
                setSelectedUnit(product.unitOptions[0]);
                setUnitPrice(product.unitOptions[0].price);
              }
            } else {
              const defaultUnit = {
                unit: product.productUnit || "gram",
                price: product.productPrice,
                conversionRate: 1,
                inStock: product.productStock,
                isDefault: true,
              };
              setAvailableUnits([defaultUnit]);
              setSelectedUnit(defaultUnit);
              setUnitPrice(product.productPrice);
            }
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin sản phẩm:", error);
      }
    };
    fetchProduct();
    return () => {
      if (reviewsInterval) {
        clearInterval(reviewsInterval);
      }
    };
  }, [slug]);

  const [reviewsInterval, setReviewsInterval] = useState(null);
  const fetchProductReviews = async (productId) => {
    try {
      const reviewData = await reviewsApi.getProductReviews(productId);

      const reviewsList = Array.isArray(reviewData?.reviews)
        ? reviewData.reviews
        : [];
      const ratingAvg = reviewData?.averageRating || 0;

      setReviews(reviewsList);
      setRating(ratingAvg);

      if (!reviewsInterval) {
        const intervalId = setInterval(() => {
          refreshReviews(productId);
        }, 10000); // 10 giây refresh một lần
        setReviewsInterval(intervalId);
      }
    } catch (error) {
      console.error("Lỗi khi lấy đánh giá sản phẩm:", error);
      setReviews([]);
      setRating(0);
    }
  };

  // Hàm refresh đánh giá
  const refreshReviews = async (productId) => {
    try {
      const reviewData = await reviewsApi.getProductReviews(productId);

      // Đảm bảo reviews là mảng
      const refreshedReviews = Array.isArray(reviewData?.reviews)
        ? reviewData.reviews
        : [];
      const refreshedRating = reviewData?.averageRating || 0;

      // Kiểm tra nếu có thay đổi mới cập nhật state để tránh re-render không cần thiết
      const currentReviewCount = reviews.length;
      const newReviewCount = refreshedReviews.length;

      // Nếu số lượng đánh giá thay đổi hoặc rating thay đổi
      if (
        currentReviewCount !== newReviewCount ||
        Math.abs(rating - refreshedRating) > 0.01
      ) {
        setReviews(refreshedReviews);
        setRating(refreshedRating);
      }
    } catch (error) {
      console.error("Lỗi khi refresh đánh giá:", error);
      // Không cập nhật state nếu có lỗi để giữ nguyên dữ liệu cũ
    }
  };

  useEffect(() => {
    if (topElementRef.current) {
      topElementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  useEffect(() => {
    if (productImages?.length > 0) {
      setSelectedImage(productImages[0]);
    }
  }, [productImages]);

  // Nếu có fullName trong localStorage, sử dụng nó làm username
  useEffect(() => {
    const storedName = localStorage.getItem("fullName");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const toggleOverview = () => {
    setOverview(!overview);
  };

  const toggleIntroduce = () => {
    setIntroduce(!introduce);
  };

  const descriptionArray =
    typeof products?.productDescription === "string"
      ? products.productDescription.includes("[")
        ? JSON.parse(products.productDescription)
        : products.productDescription
            .split(".")
            .map((item) => item.trim())
            .filter((item) => item)
      : products?.productDescription || [];

  const toggleReviews = () => {
    setReviewsVisible(!reviewsVisible);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    // Đảm bảo token được lưu ở cả hai vị trí
    const accessToken = localStorage.getItem("accessToken");
    const access_token = localStorage.getItem("access_token");

    // Đồng bộ token nếu một trong hai tồn tại
    if (accessToken && !access_token) {
      localStorage.setItem("access_token", accessToken);
    } else if (!accessToken && access_token) {
      localStorage.setItem("accessToken", access_token);
    }

    if (!checkIsAuthenticated()) {
      toast.error("Vui lòng đăng nhập để đánh giá sản phẩm");
      return;
    }

    if (!userReview.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        toast.error(
          "Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại"
        );
        return;
      }

      const displayName =
        userName || localStorage.getItem("fullName") || "Người dùng";

      const reviewData = {
        productId: products._id,
        rating: userRating,
        comment: userReview.trim(),
        userName: displayName,
        userId: userId,
      };

      const response = await reviewsApi.addReview(reviewData);

      const newReview = {
        _id: response._id || Date.now().toString(), // Dùng ID từ response nếu có, nếu không dùng timestamp
        productId: products._id,
        rating: userRating,
        comment: userReview.trim(),
        userName: displayName,
        userId: userId,
        createdAt: new Date().toISOString(),
        replies: [],
      };

      // Tính lại rating trung bình
      const allReviews = [...reviews, newReview];
      const avgRating =
        allReviews.reduce((sum, r) => sum + Number(r.rating), 0) /
        allReviews.length;

      // Cập nhật state
      setReviews(allReviews);
      setRating(avgRating);

      // Reset form
      setUserReview("");
      setUserRating(5);

      toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");

      // Cập nhật lại đánh giá từ server sau khi thêm thành công
      setTimeout(() => {
        fetchProductReviews(products._id);
      }, 1000);
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Không thể gửi đánh giá. Vui lòng thử lại sau.";
      toast.error(errorMessage);
    }
  };

  // Hàm hiển thị sao dựa trên rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`star-${i}`}
          className="fill-yellow-400 text-yellow-400"
          size={16}
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf
          key="half-star"
          className="fill-yellow-400 text-yellow-400"
          size={16}
        />
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-star-${i}`} className="text-gray-300" size={16} />
      );
    }

    return stars;
  };

  // Hàm để chọn đánh giá bằng số sao
  const handleStarClick = (index, half = false) => {
    const newRating = half ? index + 0.5 : index + 1;
    setUserRating(newRating);
  };

  // Tạo giao diện đánh giá half-star hover
  const renderRatingInput = () => {
    const stars = [];

    for (let i = 0; i < 5; i++) {
      const wholeStar = i + 1;
      const halfStar = i + 0.5;

      stars.push(
        <div key={`rating-${i}`} className="relative inline-block">
          {/* Phần nửa sao đầu tiên */}
          <div
            className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10"
            onClick={() => handleStarClick(i, true)}
            title={`${halfStar} sao`}
          ></div>

          {/* Phần nửa sao thứ hai */}
          <div
            className="absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10"
            onClick={() => handleStarClick(i, false)}
            title={`${wholeStar} sao`}
          ></div>

          {/* Hiển thị sao */}
          {userRating >= wholeStar ? (
            <Star className="fill-yellow-400 text-yellow-400" size={24} />
          ) : userRating >= halfStar ? (
            <StarHalf className="fill-yellow-400 text-yellow-400" size={24} />
          ) : (
            <Star className="text-gray-300" size={24} />
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">{stars}</div>
        <span className="text-sm font-medium">{userRating.toFixed(1)}</span>
      </div>
    );
  };

  // Hàm xử lý gửi phản hồi cho đánh giá
  const handleSubmitReply = async (reviewId) => {
    // Đảm bảo token được lưu ở cả hai vị trí
    const accessToken = localStorage.getItem("accessToken");
    const access_token = localStorage.getItem("access_token");

    // Đồng bộ token nếu một trong hai tồn tại
    if (accessToken && !access_token) {
      localStorage.setItem("access_token", accessToken);
    } else if (!accessToken && access_token) {
      localStorage.setItem("accessToken", access_token);
    }

    if (!checkIsAuthenticated()) {
      toast.error("Vui lòng đăng nhập để trả lời đánh giá");
      return;
    }

    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    setSubmitting(true);

    try {
      await reviewsApi.addReplyToReview(reviewId, replyText);

      // Cập nhật danh sách đánh giá
      await refreshReviews(products._id);

      // Reset form
      setReplyText("");
      setReplyingTo(null);

      toast.success("Đã gửi phản hồi thành công!");
    } catch (error) {
      console.error("Lỗi khi gửi phản hồi:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể gửi phản hồi. Vui lòng thử lại sau."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Hàm xử lý cập nhật phản hồi
  const handleUpdateReply = async (reviewId, replyId) => {
    if (!editReplyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    setSubmitting(true);

    try {
      await reviewsApi.updateReply(reviewId, replyId, editReplyText);

      // Cập nhật danh sách đánh giá
      await refreshReviews(products._id);

      // Reset form
      setEditReplyText("");
      setEditingReply(null);

      toast.success("Đã cập nhật phản hồi thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật phản hồi:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể cập nhật phản hồi. Vui lòng thử lại sau."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Hàm xử lý xóa phản hồi
  const handleDeleteReply = async (reviewId, replyId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phản hồi này?")) {
      return;
    }

    setSubmitting(true);

    try {
      await reviewsApi.deleteReply(reviewId, replyId);

      // Cập nhật danh sách đánh giá
      await refreshReviews(products._id);

      toast.success("Đã xóa phản hồi thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa phản hồi:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể xóa phản hồi. Vui lòng thử lại sau."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Hàm kiểm tra quyền chỉnh sửa hoặc xóa phản hồi
  const canModifyReply = (reply) => {
    if (!checkIsAuthenticated()) return false;

    const userId = localStorage.getItem("userId");
    const isAdmin =
      localStorage.getItem("role") === "admin" ||
      localStorage.getItem("isAdmin") === "true";

    return isAdmin || reply.userId === userId;
  };

  // Tính tổng số đánh giá + phản hồi
  const getTotalReviewsAndReplies = () => {
    let total = reviews.length;

    // Cộng thêm số lượng replies từ mỗi review
    reviews.forEach((review) => {
      if (review.replies && review.replies.length > 0) {
        total += review.replies.length;
      }
    });

    return total;
  };

  // Lưu thông tin sản phẩm vào localStorage khi click vào nút chat
  const saveProductInfoToChat = () => {
    try {
      // Lấy URL đầy đủ của hình ảnh sản phẩm (đảm bảo là URL hoàn chỉnh)
      let imageUrl =
        selectedImage ||
        (products?.productImages && products.productImages.length > 0
          ? products.productImages[0]
          : "");

      if (imageUrl && !imageUrl.includes("cloudinary.com")) {
        // Xóa các tham số URL không cần thiết (nếu có)
        imageUrl = imageUrl.split("?")[0];

        // Kiểm tra nếu URL không phải là http/https, thêm origin vào trước
        if (!imageUrl.startsWith("http")) {
          // Đảm bảo không có nhiều dấu gạch chéo (/) trùng lặp
          if (imageUrl.startsWith("/")) {
            imageUrl = window.location.origin + imageUrl;
          } else {
            imageUrl = window.location.origin + "/" + imageUrl;
          }
        }
      }

      // Tạo đối tượng hình ảnh để kiểm tra tải
      const img = new Image();
      img.src = imageUrl;

      // Lưu thông tin sản phẩm vào localStorage
      const productInfo = {
        id: products?._id || "",
        name: products?.productName || "Sản phẩm",
        price: products?.productPrice || 0,
        image: imageUrl,
        url: window.location.href,
      };

      // Đánh dấu thời gian lưu để tránh sử dụng dữ liệu quá cũ
      productInfo.timestamp = Date.now();

      localStorage.setItem("chatProduct", JSON.stringify(productInfo));

      // Thêm sự kiện lỗi cho hình ảnh
      img.onerror = () => {
        productInfo.image =
          "https://via.placeholder.com/250x250.png?text=No+Image";
        localStorage.setItem("chatProduct", JSON.stringify(productInfo));
      };

      return true;
    } catch (error) {
      console.error("Lỗi khi lưu thông tin sản phẩm:", error);
      return false;
    }
  };

  // Hàm mở chat với sản phẩm hiện tại
  const handleChatProduct = () => {
    try {
      if (saveProductInfoToChat()) {
        // Thông báo cho người dùng
        toast.success("Bạn đang trao đổi với Người bán về sản phẩm này");

        // Chuyển hướng đến trang tin nhắn
        navigate("/tai-khoan/tin-nhan");
      } else {
        throw new Error("Không thể lưu thông tin sản phẩm");
      }
    } catch (error) {
      console.error("Lỗi khi chuẩn bị chat với sản phẩm:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  };

  // Thêm hàm xử lý thay đổi đơn vị đo
  const handleUnitChange = (unit) => {
    setSelectedUnit(unit);
    setUnitPrice(unit.price);
    // Reset số lượng về 1 khi thay đổi đơn vị
    setCount(1);
  };

  // Cập nhật hàm thêm vào giỏ hàng để sử dụng đơn vị đo đã chọn
  const handleAddToCart = async () => {
    if (!checkIsAuthenticated()) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      navigate("/login");
      return;
    }

    try {
      // Lấy userId từ localStorage
      let userId = localStorage.getItem("userId");

      if (!userId) {
        // Nếu không có userId trực tiếp, thử lấy từ user object
        try {
          const user = JSON.parse(localStorage.getItem("user"));
          if (user && user._id) {
            userId = user._id;
          }
        } catch (e) {
          console.error("Lỗi khi parse user từ localStorage:", e);
        }
      }

      // Kiểm tra lại userId
      if (!userId) {
        toast.error("Không thể xác định người dùng, vui lòng đăng nhập lại");
        navigate("/login");
        return;
      }

      const unitToAdd = selectedUnit || {
        unit: products.productUnit,
        price: products.productPrice,
        conversionRate: 1,
      };

      console.log("Đang thêm vào giỏ hàng với userId:", userId);

      await cartApi.addToCart({
        userId: userId,
        productId: products._id,
        quantity: count,
        unit: unitToAdd.unit,
        unitPrice: unitToAdd.price,
        conversionRate: unitToAdd.conversionRate,
      });

      toast.success("Thêm vào giỏ hàng thành công!");
      triggerCartUpdateEvent();
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      toast.error("Có lỗi xảy ra khi thêm vào giỏ hàng");
    }
  };

  // Hàm mua ngay - chuyển thẳng đến trang thanh toán
  const handleBuyNow = async () => {
    if (!checkIsAuthenticated()) {
      toast.error("Vui lòng đăng nhập để mua sản phẩm");
      navigate("/login");
      return;
    }

    try {
      // Lấy userId từ localStorage
      let userId = localStorage.getItem("userId");

      if (!userId) {
        // Nếu không có userId trực tiếp, thử lấy từ user object
        try {
          const user = JSON.parse(localStorage.getItem("user"));
          if (user && user._id) {
            userId = user._id;
          }
        } catch (e) {
          console.error("Lỗi khi parse user từ localStorage:", e);
        }
      }

      // Kiểm tra lại userId
      if (!userId) {
        toast.error("Không thể xác định người dùng, vui lòng đăng nhập lại");
        navigate("/login");
        return;
      }

      const unitToAdd = selectedUnit || {
        unit: products.productUnit,
        price: products.productPrice,
        conversionRate: 1,
      };

      // Tạo đối tượng sản phẩm để thanh toán
      const productData = {
        productId: products._id,
        quantity: count,
        price: unitToAdd.price,
      };

      // Tạo đối tượng payment
      const paymentData = {
        userId: userId,
        products: [productData],
        paymentMethod: "cod", // Mặc định là COD
        amount: unitToAdd.price * count,
      };

      // Gọi API để tạo payment
      const response = await axios.post("/api/payments", paymentData);

      // Chuyển hướng đến trang thanh toán
      const paymentId = response.data?._id || response.data?.data?._id;
      if (paymentId) {
        navigate(`/thanh-toan/${paymentId}`);
      } else {
        toast.error("Không nhận được ID thanh toán từ server");
      }
    } catch (error) {
      console.error("Lỗi khi xử lý mua ngay:", error);
      toast.error("Có lỗi xảy ra khi xử lý đơn hàng");
    }
  };

  // Add triggerCartUpdateEvent function
  const triggerCartUpdateEvent = () => {
    window.dispatchEvent(new Event("cart-updated"));
  };

  return (
    <div ref={topElementRef} className="p-2 lg:mb-5">
      <Toaster position="bottom-right" richColors />
      <div className="text-sm text-[#333333] lg:px-[120px] p-2">
        <a href="/">Trang chủ</a> {"> "}
        <span>Sản phẩm mới</span> {"> "}
        <span className="text-[#51bb1a]">{products?.productName}</span>
      </div>
      <div className="border border-gray-100 lg:mt-2"></div>
      <div className="lg:grid lg:grid-cols-[80%_20%] lg:mt-10 lg:gap-4 lg:px-[120px]">
        <div className="lg:grid lg:grid-cols-2">
          <div className=" bg-white gap-2 lg:grid lg:grid-cols-1">
            <img
              src={`${selectedImage}`}
              alt=""
              className="w-[280px] h-[300px] border-gray-600 mx-auto p-4 object-cover"
            />
            <div className="grid grid-cols-4 mb-5 lg:grid lg:grid-cols-4 gap-2 lg:place-items-center lg:mt-4">
              {productImages?.map((img, index) => (
                <img
                  key={index}
                  src={`${img}`}
                  alt="Thumbnail"
                  className={`border-[#51bb1a] h-16 w-16 cursor-pointer transition-all duration-300 ${
                    selectedImage === img ? "border-2 border-[#51bb1a]" : ""
                  }`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </div>
          <div className="lg:grid lg:grid-cols-1">
            <div>
              <div className="grid grid-cols-1 place-items-center lg:place-items-start gap-2 ">
                <p className="text-[20px] text-[#000000] lg:text-[26px] lg:font-medium">
                  {products?.productName}
                </p>
                <div className="lg:grid lg:grid-cols-2 lg:gap-4">
                  <p className="text-[12px] text-left">
                    SKU:{" "}
                    <span className="text-[#51bb1a] ">(Đang cập nhật...)</span>
                  </p>
                  <p className="text-[12px] text-left">
                    Thương hiệu:{" "}
                    <span className="text-[#51bb1a] ">
                      {products?.productBrand}
                    </span>
                  </p>
                </div>

                {/* Chi nhánh */}
                <p className="text-[12px] text-left mt-1">
                  Chi nhánh:{" "}
                  <span className="text-[#51bb1a]">
                    {products?.branchName || "Chi nhánh chính"}
                  </span>
                </p>

                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium text-xl">
                    Giá:
                  </span>
                  {products && products.productDiscount > 0 ? (
                    <div className="flex items-center mt-1">
                      <span className="text-3xl font-bold text-[#51bb1a]">
                        {formatCurrency(
                          unitPrice -
                            (unitPrice * products.productDiscount) / 100
                        )}
                        đ
                      </span>
                      <span className="ml-2 text-gray-500 line-through">
                        {formatCurrency(unitPrice)}đ
                      </span>
                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md">
                        -{products.productDiscount}%
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <span className="text-3xl font-bold text-[#51bb1a]">
                        {formatCurrency(unitPrice)}đ
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:mt-1">
                <p className="text-[12px] lg:text-sm lg:font-medium">
                  Tình trạng:{" "}
                  <span
                    className={`${
                      products?.productStatus === "Hết hàng"
                        ? "text-red-600"
                        : "text-[#51bb1a]"
                    }`}
                  >
                    {products?.productStatus}
                  </span>
                </p>
                <ul className="flex flex-col text-sm gap-1 mt-2">
                  {descriptionArray.map((desc, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <DotFilledIcon />
                      <span>{desc}</span>
                    </li>
                  ))}
                </ul>
                <Card className="w-full hide-on-pc">
                  <div
                    className="flex justify-between items-center mt-4 cursor-pointer"
                    onClick={toggleOverview}
                  >
                    {overview ? (
                      <span className="text-[12px] text-[#51bb1a] font-semibold">
                        TỔNG QUAN
                      </span>
                    ) : (
                      <span className="text-[12px] text-black font-semibold">
                        TỔNG QUAN
                      </span>
                    )}
                    {overview ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </div>
                  <AnimatePresence>
                    {overview && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardContent className="border-t border-t-gray-400 text-[12px]">
                          <span className="text-black font-bold">
                            {products?.productInfo}
                          </span>{" "}
                          <span className="text-[12px]">
                            {products?.productIntroduction}
                          </span>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

                <div className="items-center mt-4 text-[14px] font-medium grid grid-cols-[20%_80%] ">
                  <p>Số lượng:</p>
                  <div className="flex items-center cursor-pointer">
                    <MinusIcon
                      onClick={() =>
                        setCount((prevCount) =>
                          prevCount > 1 ? prevCount - 1 : 1
                        )
                      }
                      className={`size-8 border p-2 text-black ${
                        products?.productStock === 0 ||
                        products?.productStatus === "Hết hàng"
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      aria-disabled={
                        products?.productStock === 0 ||
                        products?.productStatus === "Hết hàng"
                      }
                    />
                    <input
                      type="text"
                      className="text-black w-16 border p-[4.5px] border-l-0 border-r-0 outline-none text-center"
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value) || 1)}
                      disabled={
                        products?.productStock === 0 ||
                        products?.productStatus === "Hết hàng"
                      }
                    />
                    <PlusIcon
                      onClick={() => setCount(count + 1)}
                      className={`size-8 border p-2 text-black ${
                        products?.productStock === 0 ||
                        products?.productStatus === "Hết hàng"
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      aria-disabled={
                        products?.productStock === 0 ||
                        products?.productStatus === "Hết hàng"
                      }
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="font-medium text-gray-700 mr-2">
                    Đơn vị:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableUnits.map((unit, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleUnitChange(unit)}
                        className={`px-3 py-1 border rounded-md text-sm ${
                          selectedUnit && selectedUnit.unit === unit.unit
                            ? "border text-black cursor-pointer border-[#51bb1a]"
                            : " text-gray-700 border-gray-300 hover:border-[#51bb1a]"
                        }`}
                      >
                        {unit.conversionRate} {unit.unit}
                      </button>
                    ))}
                  </div>
                </div>
                {products?.productStock === 0 ||
                products?.productStatus === "Hết hàng" ? (
                  <button
                    className="bg-gray-400 w-full text-white text-sm p-2 mt-4 flex flex-col cursor-not-allowed"
                    disabled
                  >
                    <span className="uppercase">HẾT HÀNG</span>
                    <span className="text-[12px]">Vui lòng quay lại sau</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleBuyNow}
                      className="bg-[#51bb1a] w-full cursor-pointer text-white text-sm p-2 mt-4 flex flex-col hover:opacity-90"
                    >
                      <span className="uppercase">
                        {" "}
                        MUA NGAY VỚI GIÁ {formatCurrency(unitPrice)}đ
                      </span>
                      <span className="text-[12px]">
                        Đặt mua giao hàng tận nơi
                      </span>
                    </button>
                    <button
                      onClick={handleAddToCart}
                      className="border border-[#51bb1a] w-full cursor-pointer text-[#51bb1a] text-sm p-2 mt-4 flex flex-col hover:bg-[#f0f9ed]"
                    >
                      <span className="uppercase">THÊM VÀO GIỎ HÀNG</span>
                      <span className="text-[12px]">
                        Thêm sản phẩm vào giỏ hàng của bạn
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Card className="w-full md:hidden">
            <div
              className="flex justify-between items-center mt-4 cursor-pointer"
              onClick={toggleOpen}
            >
              {isOpen ? (
                <span className="text-[12px] text-[#51bb1a] font-semibold">
                  MÔ TẢ
                </span>
              ) : (
                <span className="text-[12px] text-black font-semibold">
                  MÔ TẢ
                </span>
              )}
              {isOpen ? (
                <ChevronDown className="size-4 hide-on-pc" />
              ) : (
                <ChevronRight className="size-4 hide-on-pc" />
              )}
            </div>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="border-t border-t-gray-400 text-[12px]">
                    <span className="text-black font-bold">
                      {products?.productInfo}{" "}
                    </span>

                    <span className="text-[12px]">
                      {products?.productDetails}
                    </span>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <Card className="w-full mb-4 md:hidden">
            <div
              className="flex justify-between items-center mt-4 cursor-pointer"
              onClick={toggleIntroduce}
            >
              {introduce ? (
                <span className="text-[12px] text-[#51bb1a] font-semibold">
                  GIỚI THIỆU
                </span>
              ) : (
                <span className="text-[12px] text-black font-semibold">
                  GIỚI THIỆU
                </span>
              )}
              {introduce ? (
                <ChevronDown className="size-4 hide-on-pc" />
              ) : (
                <ChevronRight className="size-4 hide-on-pc" />
              )}
            </div>
            <AnimatePresence>
              {introduce && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="border-t border-t-gray-400 text-[12px]">
                    <p>
                      Website thương mại điện tử Dnc Food do Evo Group là đơn vị
                      chủ quản, chịu trách nhiệm và thực hiện các giao dịch liên
                      quan mua sắm sản phẩm hàng hoá tiêu dùng thiết yếu. Đối
                      tượng phục vụ là tất cả khách hàng trên 63 tỉnh thành Việt
                      Nam có nhu cầu mua hàng online và nhận hàng hóa tại nhà.
                    </p>
                    <p>
                      Sản phẩm được kinh doanh tại Dnc Food phải đáp ứng đầy đủ
                      các quy định của pháp luật, không bán hàng nhái, hàng
                      không rõ nguồn gốc, hàng xách tay.
                    </p>
                    <p>
                      Hoạt động mua bán tại Dnc Food phải được thực hiện công
                      khai, minh bạch, đảm bảo quyền lợi của người tiêu dùng.
                    </p>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Card đánh giá cho mobile */}
          <Card className="w-full mb-4 md:hidden">
            <div
              className="flex justify-between items-center mt-4 cursor-pointer"
              onClick={toggleReviews}
            >
              {reviewsVisible ? (
                <span className="text-[12px] text-[#51bb1a] font-semibold">
                  ĐÁNH GIÁ ({getTotalReviewsAndReplies()})
                </span>
              ) : (
                <span className="text-[12px] text-black font-semibold">
                  ĐÁNH GIÁ ({getTotalReviewsAndReplies()})
                </span>
              )}
              {reviewsVisible ? (
                <ChevronDown className="size-4 hide-on-pc" />
              ) : (
                <ChevronRight className="size-4 hide-on-pc" />
              )}
            </div>
            <AnimatePresence>
              {reviewsVisible && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="border-t border-t-gray-400 text-[12px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{renderStars(rating)}</div>
                      <span className="text-[12px] font-medium">
                        {rating.toFixed(1)}/5
                      </span>
                      <span className="text-[12px] text-gray-500">
                        ({getTotalReviewsAndReplies()} đánh giá)
                      </span>
                    </div>

                    {/* Danh sách đánh giá */}
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {reviews.length > 0 ? (
                        reviews.map((review) => (
                          <div
                            key={review._id || review.id}
                            className="border-b pb-2"
                          >
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium text-[12px]">
                                {review.userName}
                              </h3>
                              <span className="text-[10px] text-gray-500">
                                {new Date(
                                  review.createdAt || review.date
                                ).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            <div className="flex my-1">
                              {renderStars(review.rating)}
                            </div>
                            <p className="text-[12px] mt-1">{review.comment}</p>

                            {/* Phần phản hồi */}
                            {review.replies && review.replies.length > 0 && (
                              <div className="ml-4 mt-2 space-y-2 border-l-2 border-green-200 pl-2">
                                <div className="text-[10px] text-green-600 font-medium">
                                  {review.replies.length} phản hồi cho đánh giá
                                  này
                                </div>
                                {review.replies.map((reply) => (
                                  <div key={reply._id} className="text-[11px]">
                                    <div className="flex justify-between items-center">
                                      <span
                                        className={`font-medium ${
                                          reply.isAdmin ? "text-green-600" : ""
                                        }`}
                                      >
                                        {reply.isAdmin
                                          ? "Admin"
                                          : reply.userName}
                                        :
                                      </span>
                                      <div className="flex gap-1">
                                        {canModifyReply(reply) && (
                                          <>
                                            <Edit2
                                              size={10}
                                              className="cursor-pointer text-blue-500"
                                              onClick={() => {
                                                setEditingReply({
                                                  reviewId: review._id,
                                                  replyId: reply._id,
                                                });
                                                setEditReplyText(reply.text);
                                              }}
                                            />
                                            <Trash2
                                              size={10}
                                              className="cursor-pointer text-red-500"
                                              onClick={() =>
                                                handleDeleteReply(
                                                  review._id,
                                                  reply._id
                                                )
                                              }
                                            />
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {editingReply &&
                                    editingReply.reviewId === review._id &&
                                    editingReply.replyId === reply._id ? (
                                      <div className="mt-1">
                                        <textarea
                                          value={editReplyText}
                                          onChange={(e) =>
                                            setEditReplyText(e.target.value)
                                          }
                                          className="w-full p-1 border rounded-md text-[11px]"
                                          rows={2}
                                        ></textarea>
                                        <div className="flex gap-1 mt-1">
                                          <button
                                            onClick={() =>
                                              handleUpdateReply(
                                                review._id,
                                                reply._id
                                              )
                                            }
                                            className="bg-blue-500 text-white py-0.5 px-2 rounded-md text-[10px]"
                                            disabled={submitting}
                                          >
                                            {submitting ? "Đang lưu..." : "Lưu"}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingReply(null);
                                              setEditReplyText("");
                                            }}
                                            className="bg-gray-300 text-gray-700 py-0.5 px-2 rounded-md text-[10px]"
                                          >
                                            Hủy
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p>{reply.text}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Form trả lời */}
                            {checkIsAuthenticated() && (
                              <div className="mt-1">
                                {replyingTo === review._id ? (
                                  <div>
                                    <textarea
                                      value={replyText}
                                      onChange={(e) =>
                                        setReplyText(e.target.value)
                                      }
                                      className="w-full p-1 border rounded-md text-[11px]"
                                      rows={2}
                                      placeholder="Nhập phản hồi của bạn..."
                                    ></textarea>
                                    <div className="flex gap-1 mt-1">
                                      <button
                                        onClick={() =>
                                          handleSubmitReply(review._id)
                                        }
                                        className="bg-[#51bb1a] text-white py-0.5 px-2 rounded-md text-[10px]"
                                        disabled={submitting}
                                      >
                                        {submitting ? "Đang gửi..." : "Gửi"}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setReplyingTo(null);
                                          setReplyText("");
                                        }}
                                        className="bg-gray-300 text-gray-700 py-0.5 px-2 rounded-md text-[10px]"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setReplyingTo(review._id)}
                                    className="flex items-center gap-1 text-[10px] text-blue-500 mt-1"
                                  >
                                    <Reply size={10} /> Trả lời
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-3 text-gray-500 text-[12px]">
                          Chưa có đánh giá nào cho sản phẩm này
                        </div>
                      )}
                    </div>

                    {/* Form đánh giá */}
                    {checkIsAuthenticated() ? (
                      <div className="mt-3 pt-2 border-t">
                        <h3 className="font-medium text-[12px] mb-2">
                          Viết đánh giá
                        </h3>
                        <form
                          onSubmit={handleSubmitReview}
                          className="space-y-3"
                        >
                          <div>
                            <label className="block text-[11px] mb-1">
                              Đánh giá của bạn
                            </label>
                            {renderRatingInput()}
                          </div>
                          <div>
                            <label className="block text-sm mb-1">
                              Nhận xét của bạn *
                            </label>
                            <textarea
                              value={userReview}
                              onChange={(e) => setUserReview(e.target.value)}
                              className="w-full p-1 border rounded-md text-[12px]"
                              rows={3}
                              required
                            ></textarea>
                          </div>
                          <button
                            type="submit"
                            className="bg-[#51bb1a] text-white py-1 px-3 rounded-md hover:opacity-90 text-[12px] transition-colors duration-200"
                          >
                            Gửi đánh giá
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-t text-center">
                        <p className="text-[12px] text-gray-600 mb-2">
                          Bạn cần đăng nhập để đánh giá
                        </p>
                        <button
                          onClick={() => navigate("/login")}
                          className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 text-[12px] transition-colors duration-200"
                        >
                          Đăng nhập
                        </button>
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        <div className="hide-on-mobile h-[400px] w-[100%] max-w-sm mx-auto bg-white dark:bg-card rounded-lg border border-gray-300 p-5">
          <div>
            <h2 className="text-[16px] font-medium lg:text-center ">
              CHÚNG TÔI LUÔN SẴN SÀNG ĐỂ GIÚP ĐỠ BẠN
            </h2>
          </div>
          <div className="flex items-center">
            <img
              src="https://bizweb.dktcdn.net/100/360/151/themes/727143/assets/ant_product_support.png?1721896755861"
              alt="Customer Support"
              className="rounded-full mr-4 w-full"
            />
          </div>
          <p className="mt-4 lg:text-sm lg:text-center">
            Để được hỗ trợ tốt nhất. Hãy gọi
          </p>
          <p className="text-2xl font-bold text-red-600 text-center lg:text-[20px] mt-1">
            03267 43391
          </p>
          <p className="mt-2 lg:text-[14px] lg:text-center ">HOẶC</p>
          <p className="mt-2 lg:text-[16px] lg:text-center lg:font-medium">
            Để được hỗ trợ tốt nhất. Hãy gọi
          </p>
          <button
            className="hover-animation-button cursor-pointer p-2 bg-[#51bb1a] text-white border-[#51bb1a] mt-2 container mx-auto lg:text-sm"
            onClick={handleChatProduct}
          >
            CHAT VỚI CHÚNG TÔI
          </button>
        </div>
      </div>

      <div className="lg:grid-cols-[70%_30%] lg:grid mt-10 lg:gap-10 lg:px-[120px]">
        <div className=" hidden md:flex flex-col ">
          <div className="hidden md:flex border-b justify-center">
            <button
              className={`px-4 py-2 font-semibold cursor-pointer  ${
                activeTab === "description"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("description")}
            >
              MÔ TẢ
            </button>
            <button
              className={`px-4 py-2 font-semibold cursor-pointer  ${
                activeTab === "introduction"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("introduction")}
            >
              GIỚI THIỆU
            </button>
            <button
              className={`px-4 py-2 font-semibold cursor-pointer  ${
                activeTab === "reviews"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("reviews")}
            >
              ĐÁNH GIÁ ({getTotalReviewsAndReplies()})
            </button>
          </div>
          <div className="hidden md:block mt-4">
            {activeTab === "description" ? (
              <div className="flex flex-col gap-2">
                <p className="font-medium text-sm justify-between">
                  {products?.productInfo}{" "}
                  <span className="font-normal">
                    {products?.productIntroduction}
                  </span>
                </p>
                <img
                  src={`${selectedImage}`}
                  alt={products?.productName}
                  className="w-[200px] h-[220px] border-gray-600 mx-auto p-4 object-cover"
                />
                <p className="font-medium text-sm justify-between">
                  {products?.productInfo}{" "}
                  <span className="font-normal">
                    {products?.productDetails}
                  </span>
                </p>
              </div>
            ) : activeTab === "introduction" ? (
              <div className="flex flex-col gap-2 text-sm">
                <p>
                  Website thương mại điện tử Dnc Food do Evo Group là đơn vị chủ
                  quản, chịu trách nhiệm và thực hiện các giao dịch liên quan
                  mua sắm sản phẩm hàng hoá tiêu dùng thiết yếu. Đối tượng phục
                  vụ là tất cả khách hàng trên 63 tỉnh thành Việt Nam có nhu cầu
                  mua hàng online và nhận hàng hóa tại nhà.
                </p>
                <p>
                  Sản phẩm được kinh doanh tại Dnc Food phải đáp ứng đầy đủ các
                  quy định của pháp luật, không bán hàng nhái, hàng không rõ
                  nguồn gốc, hàng xách tay.
                </p>
                <p>
                  Hoạt động mua bán tại Dnc Food phải được thực hiện công khai,
                  minh bạch, đảm bảo quyền lợi của người tiêu dùng.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">{renderStars(rating)}</div>
                  <span className="text-sm font-medium">
                    {rating.toFixed(1)}/5
                  </span>
                  <span className="text-sm text-gray-500">
                    ({getTotalReviewsAndReplies()} đánh giá)
                  </span>
                </div>

                {/* Danh sách đánh giá */}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div
                        key={review._id || review.id}
                        className="border-b pb-3"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{review.userName}</h3>
                          <span className="text-xs text-gray-500">
                            {new Date(
                              review.createdAt || review.date
                            ).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <div className="flex my-1">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-sm mt-1">{review.comment}</p>

                        {/* Phần phản hồi */}
                        {review.replies && review.replies.length > 0 && (
                          <div className="ml-5 mt-3 space-y-3 border-l-2 border-green-200 pl-3">
                            <div className="text-sm text-green-600 font-medium">
                              {review.replies.length} phản hồi cho đánh giá này
                            </div>
                            {review.replies.map((reply) => (
                              <div key={reply._id} className="text-sm">
                                <div className="flex justify-between items-center">
                                  <span
                                    className={`font-medium ${
                                      reply.isAdmin ? "text-green-600" : ""
                                    }`}
                                  >
                                    {reply.isAdmin ? "Admin" : reply.userName}:
                                  </span>
                                  <div className="flex gap-2">
                                    {canModifyReply(reply) && (
                                      <>
                                        <Edit2
                                          size={14}
                                          className="cursor-pointer text-blue-500"
                                          onClick={() => {
                                            setEditingReply({
                                              reviewId: review._id,
                                              replyId: reply._id,
                                            });
                                            setEditReplyText(reply.text);
                                          }}
                                        />
                                        <Trash2
                                          size={14}
                                          className="cursor-pointer text-red-500"
                                          onClick={() =>
                                            handleDeleteReply(
                                              review._id,
                                              reply._id
                                            )
                                          }
                                        />
                                      </>
                                    )}
                                  </div>
                                </div>

                                {editingReply &&
                                editingReply.reviewId === review._id &&
                                editingReply.replyId === reply._id ? (
                                  <div className="mt-2">
                                    <textarea
                                      value={editReplyText}
                                      onChange={(e) =>
                                        setEditReplyText(e.target.value)
                                      }
                                      className="w-full p-2 border rounded-md text-sm"
                                      rows={2}
                                    ></textarea>
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() =>
                                          handleUpdateReply(
                                            review._id,
                                            reply._id
                                          )
                                        }
                                        className="bg-blue-500 text-white py-0.5 px-2 rounded-md text-sm"
                                        disabled={submitting}
                                      >
                                        {submitting ? "Đang lưu..." : "Lưu"}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingReply(null);
                                          setEditReplyText("");
                                        }}
                                        className="bg-gray-300 text-gray-700 py-0.5 px-2 rounded-md text-sm"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p>{reply.text}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Form trả lời */}
                        {checkIsAuthenticated() && (
                          <div className="mt-2">
                            {replyingTo === review._id ? (
                              <div>
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  className="w-full p-2 border rounded-md text-sm"
                                  rows={3}
                                  placeholder="Nhập phản hồi của bạn..."
                                ></textarea>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() =>
                                      handleSubmitReply(review._id)
                                    }
                                    className="bg-[#51bb1a] text-white py-1 px-3 rounded-md text-sm"
                                    disabled={submitting}
                                  >
                                    {submitting ? (
                                      <span className="flex items-center gap-1">
                                        <span className="animate-spin">↻</span>{" "}
                                        Đang gửi...
                                      </span>
                                    ) : (
                                      "Gửi phản hồi"
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText("");
                                    }}
                                    className="bg-gray-300 text-gray-700 py-1 px-3 rounded-md text-sm"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setReplyingTo(review._id)}
                                className="flex items-center gap-1 text-sm text-blue-500 mt-2"
                              >
                                <Reply size={16} /> Trả lời
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Chưa có đánh giá nào cho sản phẩm này
                    </div>
                  )}
                </div>

                {/* Form đánh giá sản phẩm */}
                {checkIsAuthenticated() ? (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="font-medium mb-2">
                      Viết đánh giá cho sản phẩm này
                    </h3>
                    <form onSubmit={handleSubmitReview} className="space-y-3">
                      <div>
                        <label className="block text-sm mb-1">
                          Đánh giá của bạn
                        </label>
                        {renderRatingInput()}
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Nhận xét của bạn *
                        </label>
                        <textarea
                          value={userReview}
                          onChange={(e) => setUserReview(e.target.value)}
                          className="w-full p-2 border rounded-md"
                          rows={4}
                          required
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        className="bg-[#51bb1a] text-white py-2 px-4 rounded-md hover:bg-[#429716] transition-colors duration-200"
                      >
                        Gửi đánh giá
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="mt-4 border-t pt-4 text-center">
                    <p className="text-gray-600 mb-2">
                      Bạn cần đăng nhập để đánh giá sản phẩm này
                    </p>
                    <button
                      onClick={() => navigate("/login")}
                      className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200"
                    >
                      Đăng nhập
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="lg:grid lg:grid-cols-1 mt-3 ">
          <h1 className="text-[16px] uppercase font-medium mb-[6px]">
            TIN KHUYẾN MÃI
          </h1>
          <div className="border-b"></div>
          <Suspense fallback={<div>Loading...</div>}>
            <Kitchen isHide={true} />
          </Suspense>
        </div>
      </div>
      <div className="mt-10 mx-auto">
        <RelatedProducts currentProduct={products} />
      </div>
    </div>
  );
}
