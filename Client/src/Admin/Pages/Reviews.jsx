/* eslint-disable no-unused-vars */
import { toast, Toaster } from "sonner";
import reviewsApi from "../../api/reviewsApi";
import productsApi from "../../api/productsApi";
import { useState, useEffect } from "react";
import {
  Star,
  StarHalf,
  Eye,
  EyeOff,
  XCircle,
  MessageCircle,
  Save,
  X,
  Search,
  RefreshCcw,
} from "lucide-react";
import Pagination from "../../utils/Paginator";
import "./styles.css";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const userRole = localStorage.getItem("userRole");
  const [first, setFirst] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const isAdmin =
      localStorage.getItem("role") === "admin" ||
      localStorage.getItem("userRole") === "admin";
    const accessToken = localStorage.getItem("accessToken");

    if (isAdmin && accessToken === "admin-token-for-TKhiem") {
      if (!localStorage.getItem("access_token")) {
        localStorage.setItem("access_token", "admin-token-for-TKhiem");
      }
    }

    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await reviewsApi.getAllReviews();
        console.log("Loaded reviews data:", data);
        console.log("Reviews array:", data.reviews || []);
        setReviews(data.reviews || []);
      } catch (error) {
        console.error("Lỗi khi tải đánh giá:", error);
        setError(
          error.message || "Không thể tải đánh giá. Vui lòng thử lại sau."
        );
        toast.error(
          "Không thể tải đánh giá: " +
            (error.response?.data?.message || error.message)
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const data = await productsApi.getAllProducts();
        console.log(
          "Loaded products data:",
          data ? data.length : 0,
          "products"
        );
        setProducts(data || []);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
        toast.error("Không thể tải danh sách sản phẩm");
      }
    };

    if (userRole === "admin" || userRole === "manager") {
      fetchReviews();
    }
    fetchProducts();
  }, [userRole]);

  // Hàm tải lại dữ liệu đánh giá
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewsApi.getAllReviews();
      setReviews(data.reviews || []);
      toast.success("Đã cập nhật dữ liệu đánh giá");
    } catch (error) {
      console.error("Lỗi khi tải lại đánh giá:", error);
      setError(
        error.message || "Không thể tải đánh giá. Vui lòng thử lại sau."
      );
      toast.error(
        "Không thể tải lại đánh giá: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
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

  // Hàm xử lý chuyển đổi trạng thái hiển thị
  const handleTogglePublish = async (reviewId, currentStatus) => {
    try {
      await reviewsApi.toggleReviewStatus(reviewId);

      // Cập nhật trạng thái trong state
      setReviews(
        reviews.map((review) => {
          if (review._id === reviewId) {
            return { ...review, isPublished: !currentStatus };
          }
          return review;
        })
      );

      toast.success(currentStatus ? "Đã ẩn đánh giá" : "Đã hiển thị đánh giá");
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đánh giá:", error);
      toast.error("Không thể cập nhật trạng thái. Vui lòng thử lại sau.");
    }
  };

  // Hàm xử lý gửi phản hồi cho đánh giá
  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    // Kiểm tra tất cả các loại token
    const token = localStorage.getItem("access_token");
    const accessToken = localStorage.getItem("accessToken");
    const adminToken =
      token === "admin-token-for-TKhiem" ||
      accessToken === "admin-token-for-TKhiem"
        ? "admin-token-for-TKhiem"
        : null;

    if (!token && !accessToken && !adminToken) {
      toast.error("Vui lòng đăng nhập lại để thực hiện chức năng này");
      return;
    }

    setSubmitting(true);

    try {
      
      const response = await reviewsApi.addReplyToReview(reviewId, replyText);
      
      const data = await reviewsApi.getAllReviews();
      setReviews(data.reviews || []);

      setReplyText("");
      setReplyingTo(null);

      toast.success("Đã gửi phản hồi thành công!");
    } catch (error) {
      console.error("Lỗi khi gửi phản hồi:", error);

      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = "Không thể gửi phản hồi. Vui lòng thử lại sau.";

      if (error.response) {
        errorMessage = `Lỗi (${error.response.status}): ${
          error.response.data?.message || "Không thể gửi phản hồi"
        }`;
        console.log("Error response:", error.response);
      } else if (error.request) {
        errorMessage = "Không thể kết nối đến server. Kiểm tra kết nối mạng.";
      } else {
        errorMessage = error.message || errorMessage;
      }

      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa phản hồi
  const handleDeleteReply = async (reviewId, replyId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phản hồi này?")) {
      return;
    }

    try {
      await reviewsApi.deleteReply(reviewId, replyId);

      // Refresh the review list
      const data = await reviewsApi.getAllReviews();
      setReviews(data.reviews || []);

      toast.success("Đã xóa phản hồi thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa phản hồi:", error);
      toast.error("Không thể xóa phản hồi. Vui lòng thử lại sau.");
    }
  };

  // Lọc đánh giá
  const filteredReviews = reviews
    .filter((review) => {
      // Lọc theo sản phẩm
      if (selectedProduct !== "all") {
        // Handle case when productId is an object or a string
        const reviewProductId =
          typeof review.productId === "object"
            ? review.productId._id ||
              review.productId.id ||
              review.productId.toString()
            : review.productId;

        // Use string comparison to avoid issues with object references
        return String(reviewProductId) === String(selectedProduct);
      }

      // Lọc theo trạng thái
      if (filterBy === "published" && !review.isPublished) {
        return false;
      }
      if (filterBy === "hidden" && review.isPublished) {
        return false;
      }

      // Tìm kiếm
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          review.userName.toLowerCase().includes(searchLower) ||
          review.comment.toLowerCase().includes(searchLower)
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Sắp xếp
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === "rating-high") {
        return b.rating - a.rating;
      }
      if (sortBy === "rating-low") {
        return a.rating - b.rating;
      }
      return 0;
    });

  // Handle pagination change
  const handlePageChange = ({ page, rows }) => {
    setFirst((page - 1) * rows);
    setRowsPerPage(rows);
  };

  // Lấy reviews cho trang hiện tại
  const paginatedReviews = filteredReviews.slice(first, first + rowsPerPage);

  // Tổng số đánh giá
  const totalReviews = reviews.length;
  const publishedReviews = reviews.filter((r) => r.isPublished).length;
  const hiddenReviews = totalReviews - publishedReviews;

  // Tính điểm trung bình
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  // Debug effect to track filtering
  useEffect(() => {
    if (reviews.length > 0) {
      console.log("Current filtering state:", {
        totalReviews: reviews.length,
        selectedProduct,
        filterBy,
        searchQuery,
        filteredResults: filteredReviews.length,
      });

      if (selectedProduct !== "all") {
        console.log("Product filter active, showing first few reviews:");
        reviews.slice(0, 3).forEach((review) => {
          console.log("Review:", {
            id: review._id,
            productId:
              typeof review.productId === "object"
                ? review.productId._id
                : review.productId,
            matches:
              (typeof review.productId === "object"
                ? review.productId._id
                : review.productId) === selectedProduct,
          });
        });
      }
    }
  }, [reviews, selectedProduct, filterBy, searchQuery, filteredReviews.length]);

  if (
    userRole !== "admin" &&
    userRole !== "manager" &&
    userRole !== "employee"
  ) {
    return (
      <div className="text-center text-red-500 font-bold text-xl mt-10">
        Bạn không có quyền xem tất cả đánh giá.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-right" richColors />
      <h1 className="text-2xl font-bold mb-6">Quản lý đánh giá sản phẩm</h1>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <XCircle className="mr-2" size={20} />
            <div>
              <p className="font-medium">Lỗi tải dữ liệu</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-2 flex items-center bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md text-sm"
          >
            <RefreshCcw size={16} className="mr-1" /> Thử lại
          </button>
        </div>
      )}

      {/* Thống kê - chỉ hiển thị cho admin và manager */}
      {(userRole === "admin" || userRole === "manager") && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Tổng đánh giá</h3>
            <p className="text-3xl font-bold">{totalReviews}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Đánh giá hiển thị</h3>
            <p className="text-3xl font-bold text-green-600">
              {publishedReviews}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Đánh giá đã ẩn</h3>
            <p className="text-3xl font-bold text-red-500">{hiddenReviews}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Điểm trung bình</h3>
            <div className="flex items-center">
              <p className="text-3xl font-bold text-yellow-500 mr-2">
                {averageRating.toFixed(1)}
              </p>
              <div className="flex">{renderStars(averageRating)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Bộ lọc - chỉ cho phép admin và manager thay đổi trạng thái hiển thị */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Tìm kiếm đánh giá
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo tên khách hàng hoặc nội dung..."
                className="w-full p-2 border rounded-md pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Lọc theo sản phẩm
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedProduct}
              onChange={(e) => {
                console.log("Selected product changed to:", e.target.value);
                setSelectedProduct(e.target.value);
              }}
            >
              <option value="all">Tất cả sản phẩm</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.productName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Sắp xếp theo
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="rating-high">Đánh giá cao nhất</option>
                <option value="rating-low">Đánh giá thấp nhất</option>
              </select>
            </div>

            {/* Chỉ admin và manager có thể lọc theo trạng thái hiển thị */}
            {userRole === "admin" || userRole === "manager" ? (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Hiển thị
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                >
                  <option value="all">Tất cả đánh giá</option>
                  <option value="published">Đã công khai</option>
                  <option value="hidden">Đã ẩn</option>
                </select>
              </div>
            ) : (
              // Employee chỉ xem được đánh giá đã công khai
              <div>
                <label className="block text-sm font-medium mb-1">
                  Hiển thị
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value="published"
                  disabled={true}
                >
                  <option value="published">Đã công khai</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-gray-200 rounded-md flex items-center gap-2 hover:bg-gray-300 transition-colors"
            onClick={handleRefresh}
          >
            <RefreshCcw size={16} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Danh sách đánh giá */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Danh sách đánh giá</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-20">
            <div className="loader"></div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có đánh giá nào phù hợp với tiêu chí tìm kiếm
          </div>
        ) : (
          <>
            <div className="divide-y">
              {paginatedReviews.map((review) => {
                // Tìm tên sản phẩm
                const product = products.find((p) => {
                  // Use string comparison for more reliable matching
                  const reviewProductId =
                    typeof review.productId === "object"
                      ? review.productId._id ||
                        review.productId.id ||
                        review.productId.toString()
                      : review.productId;

                  return String(p._id) === String(reviewProductId);
                });

                let productName = "Sản phẩm không xác định";

                // Hiển thị productId hoặc tên sản phẩm
                if (product) {
                  productName = product.productName;
                } else if (
                  review.productId &&
                  typeof review.productId === "object"
                ) {
                  // Trường hợp productId đã được populate từ API
                  productName =
                    review.productId.productName ||
                    `Sản phẩm ID: ${review.productId._id}`;
                } else if (review.productId) {
                  // Trường hợp chỉ có ID
                  productName = `Sản phẩm ID: ${review.productId}`;
                }

                return (
                  <div
                    key={review._id}
                    className={`p-4 ${!review.isPublished ? "bg-gray-50" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium mr-2">
                            {review.userName}
                          </h3>
                          <div className="flex mr-1">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">
                            ({review.rating})
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Đánh giá cho:{" "}
                          <span className="font-medium">{productName}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString(
                            "vi-VN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                      {/* Chỉ admin và manager có thể ẩn/hiện đánh giá */}
                      {(userRole === "admin" || userRole === "manager") && (
                        <div className="flex gap-2">
                          <button
                            className={`p-2 rounded-full ${
                              review.isPublished
                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                : "bg-green-100 text-green-600 hover:bg-green-200"
                            }`}
                            onClick={() =>
                              handleTogglePublish(
                                review._id,
                                review.isPublished
                              )
                            }
                            title={
                              review.isPublished
                                ? "Ẩn đánh giá"
                                : "Hiển thị đánh giá"
                            }
                          >
                            {review.isPublished ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <p>{review.comment}</p>
                    </div>

                    {/* Phần phản hồi */}
                    {review.replies && review.replies.length > 0 && (
                      <div className="mt-4 ml-6 space-y-3 border-l-2 border-green-200 pl-4">
                        <div className="text-sm text-green-600 font-medium">
                          {review.replies.length} phản hồi từ quản trị viên
                        </div>
                        {review.replies.map((reply) => (
                          <div
                            key={reply._id}
                            className="bg-gray-50 p-3 rounded"
                          >
                            <div className="flex justify-between">
                              <span className="font-medium text-green-600">
                                {reply.isAdmin ? "Admin" : reply.userName}:
                              </span>
                              {/* Chỉ admin và manager có thể xóa phản hồi */}
                              {(userRole === "admin" ||
                                userRole === "manager") && (
                                <button
                                  onClick={() =>
                                    handleDeleteReply(review._id, reply._id)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                  title="Xóa phản hồi"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 text-sm">{reply.text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(reply.createdAt).toLocaleDateString(
                                "vi-VN",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Form trả lời - tất cả các role đều có thể trả lời */}
                    {/* Nếu là employee, chỉ hiển thị form trả lời cho đánh giá đã công khai */}
                    {(userRole !== "employee" ||
                      (userRole === "employee" && review.isPublished)) && (
                      <div className="mt-3">
                        {replyingTo === review._id ? (
                          <div className="bg-gray-50 p-3 rounded border">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Trả lời đánh giá</h4>
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText("");
                                }}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="w-full p-2 border rounded-md mt-2"
                              rows={3}
                              placeholder="Nhập phản hồi của bạn..."
                            ></textarea>
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleSubmitReply(review._id)}
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center gap-2"
                                disabled={submitting}
                              >
                                {submitting ? (
                                  <>
                                    <RefreshCcw
                                      size={16}
                                      className="animate-spin"
                                    />
                                    Đang gửi...
                                  </>
                                ) : (
                                  <>
                                    <Save size={16} />
                                    Gửi phản hồi
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReplyingTo(review._id);
                              setReplyText("");
                            }}
                            className="mt-2 flex items-center gap-1 text-blue-500 hover:text-blue-700"
                          >
                            <MessageCircle size={16} />
                            Trả lời
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Thêm phân trang */}
            <div className="p-4 border-t">
              <Pagination
                totalRecords={filteredReviews.length}
                rowsPerPageOptions={[5, 10, 20, 50]}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reviews;
