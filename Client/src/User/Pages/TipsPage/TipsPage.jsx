import React, { useState } from "react";

function TipsPage() {
  // Dữ liệu mẫu cho các mẹo về thực phẩm sạch
  const [tips, setTips] = useState([
    {
      id: 1,
      title: "Cách nhận biết rau củ hữu cơ đúng chuẩn",
      category: "Mua Sắm",
      image: "/images/organic-vegetables.jpg",
      content:
        "Rau hữu cơ thường có kích thước không đồng đều, đôi khi có vết sâu tự nhiên nhỏ. Tuy vẻ ngoài không hoàn hảo nhưng hương vị đậm đà và giá trị dinh dưỡng cao hơn. Hãy tìm kiếm các chứng nhận hữu cơ trên bao bì, và nếu có thể, hãy hỏi về nguồn gốc, quy trình trồng trọt.",
      author: "Nguyễn Thị Minh",
      authorTitle: "Chuyên gia dinh dưỡng",
      tags: ["rau hữu cơ", "mua sắm thông minh", "thực phẩm sạch"],
      likes: 152,
      datePublished: "25/03/2025",
    },
    {
      id: 2,
      title: "5 cách bảo quản rau củ tươi lâu không cần túi nilon",
      category: "Bảo Quản",
      image: "/images/vegetable-storage.jpg",
      content:
        "Sử dụng hộp thủy tinh hoặc hộp kim loại thay vì túi nilon. Một số loại rau như xà lách, rau mùi nên được bọc bằng khăn ẩm và cất trong ngăn mát. Rau có rễ như cà rốt, củ cải nên được cắt bỏ phần lá trước khi bảo quản. Không rửa rau trước khi cất trữ, chỉ rửa khi chuẩn bị nấu.",
      author: "Trần Văn Hải",
      authorTitle: "Đầu bếp, Nhà sáng tạo ẩm thực",
      tags: ["bảo quản thực phẩm", "giảm rác thải nhựa", "rau củ tươi"],
      likes: 207,
      datePublished: "20/03/2025",
    },
    {
      id: 3,
      title: "Cách đọc nhãn thực phẩm: Hiểu đúng thông tin dinh dưỡng",
      category: "Kiến Thức",
      image: "/images/food-label.jpg",
      content:
        "Tập trung vào thành phần nguyên liệu thay vì chỉ nhìn vào bảng thông tin dinh dưỡng. Các nguyên liệu được liệt kê theo thứ tự từ nhiều đến ít. Cẩn thận với các tên nguyên liệu phức tạp hoặc khó hiểu, chúng thường là phụ gia. Tránh các sản phẩm có quá nhiều đường, muối hoặc chất béo bão hòa.",
      author: "Lê Thị Hồng",
      authorTitle: "Thạc sĩ Khoa học Thực phẩm",
      tags: ["nhãn thực phẩm", "thực phẩm lành mạnh", "mua sắm thông minh"],
      likes: 178,
      datePublished: "15/03/2025",
    },
    {
      id: 4,
      title: "Lịch trình mua sắm theo mùa: Tiết kiệm và tươi ngon hơn",
      category: "Mua Sắm",
      image: "/images/seasonal-shopping.jpg",
      content:
        "Thực phẩm theo mùa không chỉ tươi ngon hơn mà còn giá thành hợp lý. Mùa xuân là thời điểm tuyệt vời cho rau lá xanh, mùa hè phù hợp với các loại quả mọng, mùa thu là thời gian thu hoạch các loại củ và quả có vỏ cứng, mùa đông nên chú trọng các loại rau họ cải.",
      author: "Phạm Minh Tú",
      authorTitle: "Chuyên gia về nông nghiệp bền vững",
      tags: ["thực phẩm theo mùa", "mua sắm thông minh", "tiết kiệm"],
      likes: 134,
      datePublished: "10/03/2025",
    },
    {
      id: 5,
      title: "Nấu ăn xanh: Tận dụng toàn bộ nguyên liệu không lãng phí",
      category: "Nấu Ăn",
      image: "/images/zero-waste-cooking.jpg",
      content:
        "Vỏ cà rốt, khoai tây có thể được rửa sạch và nấu thành nước dùng. Phần thân bông cải xanh thường bị bỏ đi nhưng lại giàu dinh dưỡng, có thể thái nhỏ hoặc xay nhuyễn cho vào súp. Lá của nhiều loại rau củ như củ cải, cà rốt có thể chế biến thành pesto hoặc xào như rau bình thường.",
      author: "Nguyễn Văn Nam",
      authorTitle: "Đầu bếp chuyên về ẩm thực bền vững",
      tags: ["nấu ăn không lãng phí", "bền vững", "thực phẩm xanh"],
      likes: 226,
      datePublished: "05/03/2025",
    },
    {
      id: 6,
      title: "Cách tự trồng rau thơm trong căn hộ nhỏ",
      category: "Làm Vườn",
      image: "/images/apartment-herbs.jpg",
      content:
        "Kể cả trong không gian nhỏ, bạn vẫn có thể trồng các loại rau thơm thường dùng như húng quế, húng lủi, rau mùi. Sử dụng hệ thống trồng cây thẳng đứng hoặc treo để tối ưu không gian. Đảm bảo đủ ánh sáng hoặc sử dụng đèn trồng cây. Tái sử dụng bã cà phê và vỏ trứng làm phân bón tự nhiên.",
      author: "Vũ Thị Thanh",
      authorTitle: "Chuyên gia làm vườn đô thị",
      tags: ["trồng rau tại nhà", "vườn trong nhà", "tự cung tự cấp"],
      likes: 192,
      datePublished: "01/03/2025",
    },
    {
      id: 7,
      title: "Thay thế thực phẩm chế biến sẵn bằng lựa chọn tự làm lành mạnh",
      category: "Nấu Ăn",
      image: "/images/homemade-alternatives.jpg",
      content:
        "Thay vì mua sữa chua đóng hộp có nhiều đường, hãy tự làm sữa chua và thêm mật ong hoặc trái cây tươi. Thay thế nước xốt salad bằng dầu olive, giấm và các loại thảo mộc tươi. Làm granola từ yến mạch, hạt và chút mật ong thay vì ngũ cốc đóng hộp. Tự làm bánh mì thơm ngon không có chất bảo quản.",
      author: "Trần Thị Mai",
      authorTitle: "Chuyên gia ẩm thực lành mạnh",
      tags: ["tự làm tại nhà", "thực phẩm lành mạnh", "thay thế"],
      likes: 168,
      datePublished: "25/02/2025",
    },
    {
      id: 8,
      title: "Làm sạch rau củ đúng cách: Loại bỏ tối đa hóa chất",
      category: "Bảo Quản",
      image: "/images/cleaning-vegetables.jpg",
      content:
        "Ngâm rau củ trong nước muối loãng hoặc nước giấm pha loãng trong 15-20 phút, sau đó rửa lại với nước sạch. Một số loại rau lá nên được tách riêng từng lá để làm sạch hiệu quả. Sử dụng bàn chải mềm để làm sạch các loại củ có bề mặt sần sùi. Cắt bỏ phần đầu và phần cuối của một số loại rau củ.",
      author: "Phan Thanh Tùng",
      authorTitle: "Kỹ sư An toàn Thực phẩm",
      tags: ["vệ sinh thực phẩm", "rau củ an toàn", "sức khỏe"],
      likes: 214,
      datePublished: "20/02/2025",
    },
  ]);

  // Danh sách các danh mục
  const categories = [
    { id: "all", name: "Tất Cả" },
    { id: "Mua Sắm", name: "Mua Sắm" },
    { id: "Bảo Quản", name: "Bảo Quản" },
    { id: "Nấu Ăn", name: "Nấu Ăn" },
    { id: "Kiến Thức", name: "Kiến Thức" },
    { id: "Làm Vườn", name: "Làm Vườn" },
  ];

  // State cho bộ lọc
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTip, setExpandedTip] = useState(null);

  // Lọc tips theo danh mục và tìm kiếm
  const filteredTips = tips
    .filter(
      (tip) => activeCategory === "all" || tip.category === activeCategory
    )
    .filter(
      (tip) =>
        tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tip.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tip.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

  // Toggle mở rộng/thu gọn một tip
  const toggleExpand = (id) => {
    if (expandedTip === id) {
      setExpandedTip(null);
    } else {
      setExpandedTip(id);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-green-50 min-h-screen py-16">
      <div className="container mx-auto px-4 md:px-12 lg:px-24">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="p-8 md:p-12 lg:p-16">
            {/* Header Section */}
            <div className="flex items-center mb-10">
              <div className="w-2 h-10 bg-green-500 mr-4 rounded"></div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                Mẹo Hay Về Thực Phẩm Sạch
              </h1>
            </div>

            {/* Intro paragraph */}
            <p className="text-lg text-gray-700 mb-10 max-w-4xl">
              Khám phá những mẹo hữu ích giúp bạn mua sắm, bảo quản và chế biến
              thực phẩm sạch một cách thông minh. Những kiến thức này sẽ giúp
              bạn tận dụng tối đa giá trị dinh dưỡng, giảm thiểu lãng phí và bảo
              vệ sức khỏe gia đình.
            </p>

            {/* Search and Filter Bar */}
            <div className="mb-10 bg-gray-50 p-6 rounded-xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm kiếm mẹo hay..."
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-gray-200 focus:ring-green-500 focus:border-green-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400 absolute left-3 top-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <select
                    className="w-full md:w-auto px-4 py-3 rounded-lg border-gray-200 focus:ring-green-500 focus:border-green-500"
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Featured Tip */}
            <div className="mb-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl overflow-hidden shadow-lg">
              <div className="md:flex">
                <div className="md:w-1/2 h-64 md:h-auto bg-gray-200 relative">
                  {/* Placeholder for image */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-20 w-20"
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
                <div className="md:w-1/2 p-8">
                  <div className="mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      Mẹo Nổi Bật
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Nấu ăn xanh: Tận dụng toàn bộ nguyên liệu không lãng phí
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Vỏ cà rốt, khoai tây có thể được rửa sạch và nấu thành nước
                    dùng. Phần thân bông cải xanh thường bị bỏ đi nhưng lại giàu
                    dinh dưỡng, có thể thái nhỏ hoặc xay nhuyễn cho vào súp...
                  </p>
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        Nguyễn Văn Nam
                      </p>
                      <p className="text-sm text-gray-500">
                        Đầu bếp chuyên về ẩm thực bền vững
                      </p>
                    </div>
                  </div>
                  <button className="bg-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-green-600 transition-colors">
                    Đọc Thêm
                  </button>
                </div>
              </div>
            </div>

            {/* Tips Grid */}
            <div className="space-y-6">
              {filteredTips.length > 0 ? (
                filteredTips.map((tip) => (
                  <div
                    key={tip.id}
                    className="bg-white rounded-xl overflow-hidden shadow border-l-4 border-green-500 hover:shadow-md transition-all"
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800 md:mr-4">
                          {tip.title}
                        </h3>
                        <div className="flex items-center mt-2 md:mt-0">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold mr-2">
                            {tip.category}
                          </span>
                          <span className="text-sm text-gray-500">
                            {tip.datePublished}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`text-gray-600 ${
                          expandedTip === tip.id ? "" : "line-clamp-3"
                        }`}
                      >
                        {tip.content}
                      </div>

                      {/* Expand/Collapse button */}
                      <button
                        onClick={() => toggleExpand(tip.id)}
                        className="text-green-600 hover:text-green-800 font-medium mt-2 flex items-center text-sm"
                      >
                        {expandedTip === tip.id ? "Thu gọn" : "Xem thêm"}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 ml-1 transition-transform ${
                            expandedTip === tip.id ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Author and tags only shown when expanded */}
                      {expandedTip === tip.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center mb-3">
                            <div className="w-8 h-8 bg-gray-300 rounded-full mr-2"></div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                {tip.author}
                              </p>
                              <p className="text-xs text-gray-500">
                                {tip.authorTitle}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {tip.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center mt-4">
                            <button className="flex items-center text-gray-500 hover:text-green-600">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                              <span className="text-sm">
                                {tip.likes} lượt thích
                              </span>
                            </button>

                            <button className="flex items-center text-gray-500 hover:text-blue-600 ml-4">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                />
                              </svg>
                              <span className="text-sm">Chia sẻ</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-gray-300 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Không tìm thấy mẹo nào
                  </h3>
                  <p className="text-gray-500">
                    Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác
                  </p>
                </div>
              )}
            </div>

            {/* Share Your Tip Section */}
            <div className="mt-16 bg-blue-50 rounded-xl p-8 border-l-4 border-blue-500">
              <div className="md:flex items-center">
                <div className="md:w-3/4 mb-6 md:mb-0 md:pr-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Chia Sẻ Mẹo Hay Của Bạn
                  </h3>
                  <p className="text-gray-600">
                    Bạn có mẹo hay về việc lựa chọn, bảo quản hoặc chế biến thực
                    phẩm sạch? Hãy chia sẻ với cộng đồng DNC FOOD để cùng nhau
                    xây dựng lối sống lành mạnh và bền vững.
                  </p>
                </div>
                <div className="md:w-1/4 flex justify-center md:justify-end">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    Gửi Mẹo Hay
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Access Tags */}
            <div className="mt-12">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Chủ Đề Phổ Biến
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "rau hữu cơ",
                  "bảo quản thực phẩm",
                  "thực phẩm theo mùa",
                  "nấu ăn không lãng phí",
                  "vệ sinh thực phẩm",
                  "thực phẩm lành mạnh",
                  "trồng rau tại nhà",
                  "giảm rác thải nhựa",
                  "thay thế",
                  "sức khỏe",
                ].map((tag, index) => (
                  <button
                    key={index}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
                    onClick={() => setSearchQuery(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TipsPage;
