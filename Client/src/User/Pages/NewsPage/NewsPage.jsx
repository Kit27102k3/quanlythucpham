import React, { useState } from "react";

function NewsPage() {
  // Giả lập dữ liệu tin tức
  const [news, setNews] = useState([
    {
      id: 1,
      title: "DNC FOOD hợp tác với 10 nhà cung cấp rau hữu cơ mới",
      category: "Hợp Tác",
      date: "28/03/2025",
      image: "/images/organic-farm.jpg",
      summary:
        "Mở rộng mạng lưới nhà cung cấp rau hữu cơ để đáp ứng nhu cầu ngày càng tăng của người tiêu dùng.",
      content:
        "DNC FOOD vừa ký kết thỏa thuận hợp tác với 10 trang trại rau hữu cơ được chứng nhận từ các tỉnh Lâm Đồng, Đà Lạt và vùng Tây Nguyên. Sự hợp tác này không chỉ giúp DNC FOOD đa dạng hóa nguồn cung cấp mà còn đảm bảo nguồn rau tươi, sạch quanh năm cho người tiêu dùng...",
      isHighlight: true,
    },
    {
      id: 2,
      title:
        "Ứng dụng công nghệ blockchain trong truy xuất nguồn gốc thực phẩm",
      category: "Công Nghệ",
      date: "23/03/2025",
      image: "/images/blockchain.jpg",
      summary:
        "DNC FOOD tiên phong áp dụng công nghệ blockchain để minh bạch hóa toàn bộ chuỗi cung ứng.",
      content:
        "Trong kỷ nguyên số, minh bạch thông tin trở thành yếu tố quyết định niềm tin của người tiêu dùng. Nhận thức được điều này, DNC FOOD đã triển khai hệ thống truy xuất nguồn gốc dựa trên công nghệ blockchain, giúp khách hàng có thể theo dõi toàn bộ hành trình của sản phẩm...",
      isHighlight: false,
    },
    {
      id: 3,
      title: "DNC FOOD mở rộng thêm 5 chi nhánh tại TP.HCM",
      category: "Phát Triển",
      date: "15/03/2025",
      image: "/images/new-store.jpg",
      summary:
        "Chiến lược mở rộng mạng lưới phân phối tại các quận trung tâm và khu vực đông dân cư.",
      content:
        "Đáp ứng nhu cầu ngày càng tăng về thực phẩm sạch, an toàn, DNC FOOD chính thức khai trương thêm 5 chi nhánh mới tại các quận trung tâm TP.HCM. Các cửa hàng mới được thiết kế theo concept hiện đại, thân thiện với môi trường và trang bị công nghệ quản lý tiên tiến...",
      isHighlight: true,
    },
    {
      id: 4,
      title:
        "Chương trình đào tạo 'Nhận diện thực phẩm sạch' cho người tiêu dùng",
      category: "Giáo Dục",
      date: "10/03/2025",
      image: "/images/education.jpg",
      summary:
        "Series workshop miễn phí giúp người tiêu dùng nâng cao kiến thức về an toàn thực phẩm.",
      content:
        "DNC FOOD khởi động series workshop 'Nhận diện thực phẩm sạch' tại các chi nhánh trên toàn quốc. Chương trình cung cấp kiến thức cơ bản giúp người tiêu dùng phân biệt thực phẩm sạch, cách đọc nhãn mác, hiểu về các chứng nhận an toàn thực phẩm và phương pháp bảo quản...",
      isHighlight: false,
    },
    {
      id: 5,
      title: "DNC FOOD được vinh danh 'Doanh nghiệp xanh' năm 2025",
      category: "Giải Thưởng",
      date: "05/03/2025",
      image: "/images/award.jpg",
      summary:
        "Nỗ lực giảm thiểu rác thải nhựa và xây dựng chuỗi cung ứng bền vững được ghi nhận.",
      content:
        "Tại Lễ trao giải thường niên 'Doanh nghiệp vì môi trường', DNC FOOD vinh dự nhận giải thưởng 'Doanh nghiệp xanh' năm 2025. Giải thưởng ghi nhận những nỗ lực của công ty trong việc giảm thiểu rác thải nhựa, sử dụng bao bì tái chế và xây dựng chuỗi cung ứng thực phẩm bền vững...",
      isHighlight: false,
    },
    {
      id: 6,
      title: "Ưu đãi đặc biệt nhân dịp kỷ niệm 5 năm thành lập DNC FOOD",
      category: "Khuyến Mãi",
      date: "01/03/2025",
      image: "/images/promotion.jpg",
      summary:
        "Chuỗi chương trình khuyến mãi hấp dẫn và hoạt động tri ân khách hàng trong tháng 3.",
      content:
        "Nhân dịp kỷ niệm 5 năm thành lập, DNC FOOD triển khai chuỗi chương trình khuyến mãi hấp dẫn tại tất cả các chi nhánh trên toàn quốc. Khách hàng có cơ hội nhận được nhiều ưu đãi giảm giá, quà tặng và tham gia các hoạt động trải nghiệm thú vị...",
      isHighlight: true,
    },
  ]);

  const [activeCategory, setActiveCategory] = useState("all");

  // Danh sách các danh mục
  const categories = [
    { id: "all", name: "Tất Cả" },
    { id: "Hợp Tác", name: "Hợp Tác" },
    { id: "Công Nghệ", name: "Công Nghệ" },
    { id: "Phát Triển", name: "Phát Triển" },
    { id: "Giáo Dục", name: "Giáo Dục" },
    { id: "Giải Thưởng", name: "Giải Thưởng" },
    { id: "Khuyến Mãi", name: "Khuyến Mãi" },
  ];

  // Lọc tin tức theo danh mục
  const filteredNews =
    activeCategory === "all"
      ? news
      : news.filter((item) => item.category === activeCategory);

  // Lấy tin nổi bật
  const highlightedNews = news.filter((item) => item.isHighlight);

  return (
    <div className="bg-gradient-to-br from-white to-green-50 min-h-screen py-16">
      <div className="container mx-auto px-4 md:px-12 lg:px-24">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="p-8 md:p-12 lg:p-16">
            {/* Header Section */}
            <div className="flex items-center mb-10">
              <div className="w-2 h-10 bg-green-500 mr-4 rounded"></div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                Tin Tức & Sự Kiện
              </h1>
            </div>

            {/* Tin Nổi Bật Section */}
            {highlightedNews.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-yellow-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Tin Nổi Bật
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {highlightedNews.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <div className="h-48 bg-gray-200 relative">
                        {/* Placeholder for image */}
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-16 w-16"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center mb-2">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            {item.category}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {item.date}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{item.summary}</p>
                        <button className="text-green-600 hover:text-green-800 font-medium flex items-center">
                          Đọc tiếp
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Navigation */}
            <div className="mb-8 overflow-x-auto">
              <div className="flex space-x-2 pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      activeCategory === category.id
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Main News Section */}
            <div className="grid md:grid-cols-2 gap-8">
              {filteredNews.map((item) => (
                <div
                  key={item.id}
                  className="flex bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition-shadow"
                >
                  <div className="w-1/3 bg-gray-200 relative">
                    {/* Placeholder for image */}
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="w-2/3 p-5">
                    <div className="flex items-center mb-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        {item.category}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {item.date}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.summary}
                    </p>
                    <button className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
                      Đọc tiếp
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex justify-center">
              <nav className="inline-flex rounded-md shadow">
                <a
                  href="#"
                  className="py-2 px-4 border border-gray-300 bg-white rounded-l-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Trước
                </a>
                <a
                  href="#"
                  className="py-2 px-4 border-t border-b border-gray-300 bg-green-500 text-sm font-medium text-white"
                >
                  1
                </a>
                <a
                  href="#"
                  className="py-2 px-4 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  2
                </a>
                <a
                  href="#"
                  className="py-2 px-4 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  3
                </a>
                <a
                  href="#"
                  className="py-2 px-4 border border-gray-300 bg-white rounded-r-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Tiếp
                </a>
              </nav>
            </div>

            {/* Newsletter Subscription */}
            <div className="mt-16 bg-green-50 rounded-xl p-8 border-l-4 border-green-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Đăng Ký Nhận Tin
              </h3>
              <p className="text-gray-600 mb-6">
                Hãy đăng ký để nhận những thông tin mới nhất về sản phẩm, ưu đãi
                và hoạt động của DNC FOOD.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="px-4 py-3 flex-1 rounded-lg border-gray-200 focus:ring-green-500 focus:border-green-500"
                />
                <button className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors">
                  Đăng Ký
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsPage;
