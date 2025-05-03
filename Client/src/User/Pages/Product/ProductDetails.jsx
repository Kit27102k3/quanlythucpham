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
import { toast, Toaster } from 'sonner';

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
  const { slug } = useParams();
  const topElementRef = useRef(null);
  const navigate = useNavigate();

  // Kiểm tra xem người dùng đã đăng nhập chưa
  const checkIsAuthenticated = () => {
    const accessToken = localStorage.getItem('accessToken');
    const token = localStorage.getItem('token');
    const userAccessToken = localStorage.getItem('userAccessToken');
    const adminAccessToken = localStorage.getItem('adminAccessToken');
    
    // Log để debug
    console.log('Authentication tokens:', {
      accessToken,
      token,
      userAccessToken,
      adminAccessToken
    });
    
    return !!(accessToken || token || userAccessToken || adminAccessToken); // Chuyển token thành boolean
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
          setProducts(product);
          setProductImages(product.productImages);
          setSelectedImage(product.productImages[0] || null);
          
          // Lấy đánh giá từ API
          fetchProductReviews(product._id);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin sản phẩm:", error);
      }
    };
    fetchProduct();

    // Cleanup function
    return () => {
      if (reviewsInterval) {
        clearInterval(reviewsInterval);
      }
    };
  }, [slug]);

  // Tham chiếu đến interval để refresh đánh giá
  const [reviewsInterval, setReviewsInterval] = useState(null);

  // Hàm lấy đánh giá sản phẩm
  const fetchProductReviews = async (productId) => {
    try {
      const reviewData = await reviewsApi.getProductReviews(productId);
      setReviews(reviewData.reviews || []);
      setRating(reviewData.averageRating || 0);
      
      // Thiết lập auto-refresh cho đánh giá (cứ 10 giây refresh một lần)
      if (!reviewsInterval) {
        const intervalId = setInterval(() => {
          refreshReviews(productId);
        }, 5000); // 5 giây refresh một lần
        setReviewsInterval(intervalId);
      }
    } catch (error) {
      console.error("Lỗi khi lấy đánh giá:", error);
      // Khởi tạo mặc định nếu có lỗi
      setReviews([]);
      setRating(0);
    }
  };
  
  // Hàm refresh đánh giá
  const refreshReviews = async (productId) => {
    try {
      const reviewData = await reviewsApi.getProductReviews(productId);
      
      // Kiểm tra nếu có thay đổi mới cập nhật state để tránh re-render không cần thiết
      const currentReviewCount = reviews.length;
      const newReviewCount = reviewData.reviews?.length || 0;
      
      // Nếu số lượng đánh giá thay đổi hoặc rating thay đổi
      if (currentReviewCount !== newReviewCount || Math.abs(rating - (reviewData.averageRating || 0)) > 0.01) {
        console.log("Đã phát hiện thay đổi trong đánh giá, cập nhật giao diện");
        setReviews(reviewData.reviews || []);
        setRating(reviewData.averageRating || 0);
      }
    } catch (error) {
      console.error("Lỗi khi refresh đánh giá:", error);
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
    const storedName = localStorage.getItem('fullName');
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

  const handleBuyNow = () => {
    if (products) {
      // Tạo đối tượng sản phẩm để thêm vào giỏ hàng
      const cartItem = {
        product: products,
        quantity: count,
        price: products.productPrice,
      };

      // Lưu thông tin sản phẩm vào localStorage để truy cập trong trang thanh toán
      localStorage.setItem("checkoutItems", JSON.stringify([cartItem]));

      // Chuyển hướng đến trang thanh toán
      navigate("/checkout");
    }
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
    
    if (!checkIsAuthenticated()) {
      toast.error("Vui lòng đăng nhập để đánh giá sản phẩm");
      return;
    }
    
    if (!userReview.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }
    
    try {
      const userId = localStorage.getItem('userId');
      const displayName = userName || localStorage.getItem('fullName') || 'Người dùng';
      
      const reviewData = {
        productId: products._id,
        rating: userRating,
        comment: userReview,
        userName: displayName,
        userId: userId
      };
      
      await reviewsApi.addReview(reviewData);
      
      // Cập nhật danh sách đánh giá
      const updatedReviewData = await reviewsApi.getProductReviews(products._id);
      setReviews(updatedReviewData.reviews || []);
      setRating(updatedReviewData.averageRating || 0);
      
      // Reset form
      setUserReview("");
      setUserRating(5);
      
      toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      toast.error(error.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại sau.");
    }
  };
  
  // Hàm hiển thị sao dựa trên rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="fill-yellow-400 text-yellow-400" size={16} />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="fill-yellow-400 text-yellow-400" size={16} />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-star-${i}`} className="text-gray-300" size={16} />);
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
        <div className="flex gap-1">
          {stars}
        </div>
        <span className="text-sm font-medium">{userRating.toFixed(1)}</span>
      </div>
    );
  };

  // Hàm xử lý gửi phản hồi cho đánh giá
  const handleSubmitReply = async (reviewId) => {
    if (!checkIsAuthenticated()) {
      toast.error("Vui lòng đăng nhập để trả lời đánh giá");
      return;
    }
    
    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    
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
      toast.error(error.response?.data?.message || "Không thể gửi phản hồi. Vui lòng thử lại sau.");
    }
  };
  
  // Hàm xử lý cập nhật phản hồi
  const handleUpdateReply = async (reviewId, replyId) => {
    if (!editReplyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    
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
      toast.error(error.response?.data?.message || "Không thể cập nhật phản hồi. Vui lòng thử lại sau.");
    }
  };
  
  // Hàm xử lý xóa phản hồi
  const handleDeleteReply = async (reviewId, replyId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phản hồi này?")) {
      return;
    }
    
    try {
      await reviewsApi.deleteReply(reviewId, replyId);
      
      // Cập nhật danh sách đánh giá
      await refreshReviews(products._id);
      
      toast.success("Đã xóa phản hồi thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa phản hồi:", error);
      toast.error(error.response?.data?.message || "Không thể xóa phản hồi. Vui lòng thử lại sau.");
    }
  };
  
  // Hàm kiểm tra quyền chỉnh sửa hoặc xóa phản hồi
  const canModifyReply = (reply) => {
    if (!checkIsAuthenticated()) return false;
    
    console.log("Checking permissions for reply:", reply);
    console.log("Current user tokens:", {
      userId: localStorage.getItem('userId'),
      role: localStorage.getItem('role'),
      isAdmin: localStorage.getItem('isAdmin')
    });
    
    const userId = localStorage.getItem('userId');
    const isAdmin = localStorage.getItem('role') === 'admin' || localStorage.getItem('isAdmin') === 'true';
    
    console.log(`Reply userId: ${reply.userId}, Current userId: ${userId}, isAdmin: ${isAdmin}`);
    
    return isAdmin || reply.userId === userId;
  };

  // Tính tổng số đánh giá + phản hồi
  const getTotalReviewsAndReplies = () => {
    let total = reviews.length;
    
    // Cộng thêm số lượng replies từ mỗi review
    reviews.forEach(review => {
      if (review.replies && review.replies.length > 0) {
        total += review.replies.length;
      }
    });
    
    return total;
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
                <p className="lg:text-[24px] lg:font-medium">
                  {formatCurrency(products?.productPrice)}đ
                </p>
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
                  <button
                    onClick={handleBuyNow}
                    className="bg-[#51bb1a] w-full cursor-pointer text-white text-sm p-2 mt-4 flex flex-col hover:opacity-90"
                  >
                    <span className="uppercase">
                      {" "}
                      MUA NGAY VỚI GIÁ {formatCurrency(products?.productPrice)}đ
                    </span>
                    <span className="text-[12px]">
                      Đặt mua giao hàng tận nơi
                    </span>
                  </button>
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
                      <div className="flex">
                        {renderStars(rating)}
                      </div>
                      <span className="text-[12px] font-medium">{rating.toFixed(1)}/5</span>
                      <span className="text-[12px] text-gray-500">({getTotalReviewsAndReplies()} đánh giá)</span>
                    </div>
                    
                    {/* Danh sách đánh giá */}
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {reviews.length > 0 ? (
                        reviews.map((review) => (
                          <div key={review._id || review.id} className="border-b pb-2">
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium text-[12px]">{review.userName}</h3>
                              <span className="text-[10px] text-gray-500">{new Date(review.createdAt || review.date).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="flex my-1">
                              {renderStars(review.rating)}
                            </div>
                            <p className="text-[12px] mt-1">{review.comment}</p>
                            
                            {/* Phần phản hồi */}
                            {review.replies && review.replies.length > 0 && (
                              <div className="ml-4 mt-2 space-y-2 border-l-2 border-green-200 pl-2">
                                <div className="text-[10px] text-green-600 font-medium">
                                  {review.replies.length} phản hồi cho đánh giá này
                                </div>
                                {review.replies.map((reply) => (
                                  <div key={reply._id} className="text-[11px]">
                                    <div className="flex justify-between items-center">
                                      <span className={`font-medium ${reply.isAdmin ? 'text-green-600' : ''}`}>
                                        {reply.isAdmin ? 'Admin' : reply.userName}:
                    </span>
                                      <div className="flex gap-1">
                                        {canModifyReply(reply) && (
                                          <>
                                            <Edit2 
                                              size={10} 
                                              className="cursor-pointer text-blue-500" 
                                              onClick={() => {
                                                setEditingReply({reviewId: review._id, replyId: reply._id});
                                                setEditReplyText(reply.text);
                                              }} 
                                            />
                                            <Trash2 
                                              size={10} 
                                              className="cursor-pointer text-red-500" 
                                              onClick={() => handleDeleteReply(review._id, reply._id)} 
                                            />
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {editingReply && editingReply.reviewId === review._id && editingReply.replyId === reply._id ? (
                                      <div className="mt-1">
                                        <textarea
                                          value={editReplyText}
                                          onChange={(e) => setEditReplyText(e.target.value)}
                                          className="w-full p-1 border rounded-md text-[11px]"
                                          rows={2}
                                        ></textarea>
                                        <div className="flex gap-1 mt-1">
                                          <button
                                            onClick={() => handleUpdateReply(review._id, reply._id)}
                                            className="bg-blue-500 text-white py-0.5 px-2 rounded-md text-[10px]"
                                          >
                                            Lưu
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
                                      onChange={(e) => setReplyText(e.target.value)}
                                      className="w-full p-1 border rounded-md text-[11px]"
                                      rows={2}
                                      placeholder="Nhập phản hồi của bạn..."
                                    ></textarea>
                                    <div className="flex gap-1 mt-1">
                                      <button
                                        onClick={() => handleSubmitReply(review._id)}
                                        className="bg-[#51bb1a] text-white py-0.5 px-2 rounded-md text-[10px]"
                                      >
                                        Gửi
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
                        <h3 className="font-medium text-[12px] mb-2">Viết đánh giá</h3>
                        <form onSubmit={handleSubmitReview} className="space-y-3">
                          <div>
                            <label className="block text-[11px] mb-1">Đánh giá của bạn</label>
                            {renderRatingInput()}
                          </div>
                          <div>
                            <label className="block text-sm mb-1">Nhận xét của bạn *</label>
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
                        <p className="text-[12px] text-gray-600 mb-2">Bạn cần đăng nhập để đánh giá</p>
                        <button
                          onClick={() => navigate('/login')}
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
            className="hover-animation-button cursor-pointer p-2 bg-[#51bb1a] text-white border-[#51bb1a]  mt-2 container mx-auto lg:text-sm"
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
                  <div className="flex">
                    {renderStars(rating)}
                  </div>
                  <span className="text-sm font-medium">{rating.toFixed(1)}/5</span>
                  <span className="text-sm text-gray-500">({getTotalReviewsAndReplies()} đánh giá)</span>
                </div>
                
                {/* Danh sách đánh giá */}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review._id || review.id} className="border-b pb-3">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{review.userName}</h3>
                          <span className="text-xs text-gray-500">{new Date(review.createdAt || review.date).toLocaleDateString('vi-VN')}</span>
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
                                  <span className={`font-medium ${reply.isAdmin ? 'text-green-600' : ''}`}>
                                    {reply.isAdmin ? 'Admin' : reply.userName}:
                                  </span>
                                  <div className="flex gap-2">
                                    {canModifyReply(reply) && (
                                      <>
                                        <Edit2 
                                          size={14} 
                                          className="cursor-pointer text-blue-500" 
                                          onClick={() => {
                                            setEditingReply({reviewId: review._id, replyId: reply._id});
                                            setEditReplyText(reply.text);
                                          }} 
                                        />
                                        <Trash2 
                                          size={14} 
                                          className="cursor-pointer text-red-500" 
                                          onClick={() => handleDeleteReply(review._id, reply._id)} 
                                        />
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {editingReply && editingReply.reviewId === review._id && editingReply.replyId === reply._id ? (
                                  <div className="mt-2">
                                    <textarea
                                      value={editReplyText}
                                      onChange={(e) => setEditReplyText(e.target.value)}
                                      className="w-full p-2 border rounded-md text-sm"
                                      rows={2}
                                    ></textarea>
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => handleUpdateReply(review._id, reply._id)}
                                        className="bg-blue-500 text-white py-1 px-3 rounded-md text-sm"
                                      >
                                        Lưu
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingReply(null);
                                          setEditReplyText("");
                                        }}
                                        className="bg-gray-300 text-gray-700 py-1 px-3 rounded-md text-sm"
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
                                    onClick={() => handleSubmitReply(review._id)}
                                    className="bg-[#51bb1a] text-white py-1 px-3 rounded-md text-sm"
                                  >
                                    Gửi phản hồi
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
                    <h3 className="font-medium mb-2">Viết đánh giá cho sản phẩm này</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-3">
                      <div>
                        <label className="block text-sm mb-1">Đánh giá của bạn</label>
                        {renderRatingInput()}
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Nhận xét của bạn *</label>
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
                    <p className="text-gray-600 mb-2">Bạn cần đăng nhập để đánh giá sản phẩm này</p>
                    <button
                      onClick={() => navigate('/login')}
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
