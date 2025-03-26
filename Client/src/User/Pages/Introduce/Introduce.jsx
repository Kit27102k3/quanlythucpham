import React from "react";

function Introduce() {
  return (
    <div className="bg-gradient-to-br from-white to-green-50 min-h-screen py-16">
      <div className="container mx-auto px-4 md:px-12 lg:px-24">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="p-8 md:p-12 lg:p-16">
            {/* Header Section */}
            <div className="flex items-center mb-10">
              <div className="w-2 h-10 bg-green-500 mr-4 rounded"></div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                DNC FOOD: Hệ Thống Quản Lý Toàn Diện Siêu Thị Thực Phẩm Sạch
              </h1>
            </div>

            {/* Introduction Paragraphs */}
            <div className="space-y-8">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                <span className="font-semibold text-green-600">DNC FOOD</span>{" "}
                là giải pháp công nghệ tiên phong, được phát triển đặc biệt cho
                các siêu thị thực phẩm sạch. Chúng tôi không chỉ cung cấp một
                phần mềm quản lý, mà còn là một hệ sinh thái công nghệ toàn
                diện, giúp các doanh nghiệp nâng cao hiệu quả vận hành, đảm bảo
                chất lượng sản phẩm và mang đến trải nghiệm xuất sắc cho khách
                hàng.
              </p>

              <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                Với sứ mệnh "Đảm bảo chất lượng - Tạo niềm tin",{" "}
                <span className="font-semibold text-green-600">DNC FOOD</span>{" "}
                kết hợp công nghệ tiên tiến với chuyên môn sâu về quản lý thực
                phẩm. Chúng tôi hiểu rằng mỗi sản phẩm không chỉ là hàng hóa, mà
                còn là cam kết về sức khỏe và trách nhiệm với người tiêu dùng.
              </p>
            </div>

            {/* Features Section */}
            <div className="mt-12 grid md:grid-cols-3 gap-6">
              {/* Quản Lý Kho Hàng */}
              <div className="bg-green-50 rounded-xl p-6 border-l-4 border-green-500 hover:shadow-md transition-all">
                <div className="flex items-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-green-500 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-green-700">
                    Quản Lý Kho Hàng Thông Minh
                  </h3>
                </div>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Theo dõi chi tiết hàng tồn</li>
                  <li>Cảnh báo hạn sử dụng</li>
                  <li>Quản lý nhiệt độ và điều kiện bảo quản</li>
                  <li>Dự báo nhu cầu nhập hàng</li>
                </ul>
              </div>

              {/* Truy Xuất Nguồn Gốc */}
              <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500 hover:shadow-md transition-all">
                <div className="flex items-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-blue-700">
                    Truy Xuất Nguồn Gốc Chính Xác
                  </h3>
                </div>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Mã QR cho từng sản phẩm</li>
                  <li>Thông tin chi tiết nhà cung cấp</li>
                  <li>Lịch sử vận chuyển và bảo quản</li>
                  <li>Báo cáo minh bạch</li>
                </ul>
              </div>

              {/* Báo Cáo Phân Tích */}
              <div className="bg-purple-50 rounded-xl p-6 border-l-4 border-purple-500 hover:shadow-md transition-all">
                <div className="flex items-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-purple-500 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-purple-700">
                    Báo Cáo & Phân Tích Chuyên Sâu
                  </h3>
                </div>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Thống kê doanh số chi tiết</li>
                  <li>Phân tích xu hướng tiêu dùng</li>
                  <li>Dự báo kinh doanh</li>
                  <li>Báo cáo hiệu quả nhân viên</li>
                </ul>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="mt-12 bg-gray-50 rounded-xl p-8 border-t-4 border-green-500">
              <h3 className="text-3xl font-bold text-gray-800 mb-6">
                Lợi Ích Cho Doanh Nghiệp
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xl font-semibold text-green-700 mb-3">
                    Tối Ưu Hóa Vận Hành
                  </h4>
                  <p className="text-gray-600">
                    Giảm thiểu sai sót, tăng hiệu suất quản lý, tiết kiệm thời
                    gian và chi phí vận hành.
                  </p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-green-700 mb-3">
                    Nâng Cao Uy Tín
                  </h4>
                  <p className="text-gray-600">
                    Minh bạch thông tin, đảm bảo chất lượng, tăng niềm tin của
                    khách hàng vào thương hiệu.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-12 text-center">
              <h3 className="text-3xl font-bold text-gray-800 mb-6">
                Hãy Đồng Hành Cùng DNC FOOD
              </h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
                Chúng tôi không chỉ cung cấp giải pháp công nghệ, mà còn là đối
                tác chiến lược, cam kết đồng hành và phát triển cùng doanh
                nghiệp của bạn.
              </p>
              <button className="bg-green-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-green-600 transition-colors">
                Liên Hệ Tư Vấn Ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Introduce;
