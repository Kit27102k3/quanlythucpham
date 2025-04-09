import { motion } from "framer-motion";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const Introduce = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white px-[120px]">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 py-16 lg:py-24"
      >
        <div className="text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-800 mb-6">
            Chào mừng đến với{" "}
            <span className="text-[#51bb1a]">Fresh Food Market</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Nơi bạn tìm thấy những sản phẩm thực phẩm tươi ngon, an toàn và chất lượng cao
          </p>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div 
            data-aos="fade-up"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="text-[#51bb1a] text-4xl mb-4">
              <i className="fas fa-leaf"></i>
            </div>
            <h3 className="text-xl font-semibold mb-4">Sản phẩm tươi ngon</h3>
            <p className="text-gray-600">
              Chúng tôi cam kết cung cấp những sản phẩm tươi ngon nhất, được thu hoạch và vận chuyển trong ngày.
            </p>
          </div>

          <div 
            data-aos="fade-up" 
            data-aos-delay="100"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="text-[#51bb1a] text-4xl mb-4">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 className="text-xl font-semibold mb-4">An toàn & Chất lượng</h3>
            <p className="text-gray-600">
              Tất cả sản phẩm đều được kiểm định chất lượng nghiêm ngặt và đảm bảo vệ sinh an toàn thực phẩm.
            </p>
          </div>

          <div 
            data-aos="fade-up"
            data-aos-delay="200"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="text-[#51bb1a] text-4xl mb-4">
              <i className="fas fa-truck"></i>
            </div>
            <h3 className="text-xl font-semibold mb-4">Giao hàng nhanh chóng</h3>
            <p className="text-gray-600">
              Dịch vụ giao hàng nhanh chóng, đảm bảo sản phẩm đến tay khách hàng trong tình trạng tốt nhất.
            </p>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-800">
                Về chúng tôi
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Fresh Food Market là điểm đến lý tưởng cho những người yêu thích thực phẩm sạch và lành mạnh. 
                Chúng tôi làm việc trực tiếp với các nhà cung cấp uy tín, các trang trại organic để mang đến 
                những sản phẩm chất lượng cao nhất.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Với hơn 5 năm kinh nghiệm trong ngành thực phẩm, chúng tôi tự hào là đối tác tin cậy của hàng 
                nghìn khách hàng, mang đến không chỉ sản phẩm chất lượng mà còn là dịch vụ tận tâm.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                  alt="Fresh Food Market" 
                  className="object-cover w-full h-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quality Commitment Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Cam kết chất lượng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="text-[#51bb1a] text-3xl mb-4">
                <i className="fas fa-certificate"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Chứng nhận ATTP</h3>
              <p className="text-gray-600">Đạt tiêu chuẩn an toàn thực phẩm quốc tế ISO 22000</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="text-[#51bb1a] text-3xl mb-4">
                <i className="fas fa-seedling"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">100% Organic</h3>
              <p className="text-gray-600">Sản phẩm được trồng và chăm sóc theo tiêu chuẩn organic</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="text-[#51bb1a] text-3xl mb-4">
                <i className="fas fa-microscope"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Kiểm định nghiêm ngặt</h3>
              <p className="text-gray-600">Quy trình kiểm định chất lượng 3 lớp</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="text-[#51bb1a] text-3xl mb-4">
                <i className="fas fa-award"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Cam kết hoàn tiền</h3>
              <p className="text-gray-600">Đảm bảo hoàn tiền 100% nếu sản phẩm không đạt chất lượng</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Quy trình làm việc
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div 
              data-aos="fade-up"
              className="relative"
            >
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-[#51bb1a] text-4xl mb-4">
                  <i className="fas fa-hand-holding-seedling"></i>
                </div>
                <h3 className="text-xl font-semibold mb-4">Thu hoạch & Chọn lọc</h3>
                <p className="text-gray-600">
                  Sản phẩm được thu hoạch đúng thời điểm và được chọn lọc kỹ càng bởi đội ngũ chuyên gia.
                </p>
              </div>
              <div className="hidden lg:block absolute -right-8 top-1/2 transform -translate-y-1/2 text-[#51bb1a] text-2xl">
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>

            <div 
              data-aos="fade-up"
              data-aos-delay="100"
              className="relative"
            >
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-[#51bb1a] text-4xl mb-4">
                  <i className="fas fa-box-open"></i>
                </div>
                <h3 className="text-xl font-semibold mb-4">Đóng gói & Bảo quản</h3>
                <p className="text-gray-600">
                  Sử dụng công nghệ đóng gói hiện đại, đảm bảo độ tươi ngon tối đa cho sản phẩm.
                </p>
              </div>
              <div className="hidden lg:block absolute -right-8 top-1/2 transform -translate-y-1/2 text-[#51bb1a] text-2xl">
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>

            <div 
              data-aos="fade-up"
              data-aos-delay="200"
              className="relative"
            >
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-[#51bb1a] text-4xl mb-4">
                  <i className="fas fa-truck-fast"></i>
                </div>
                <h3 className="text-xl font-semibold mb-4">Vận chuyển & Phân phối</h3>
                <p className="text-gray-600">
                  Hệ thống vận chuyển chuyên nghiệp, đảm bảo giao hàng nhanh chóng và an toàn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Thành tựu của chúng tôi
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="p-6"
            >
              <div className="text-4xl font-bold text-[#51bb1a] mb-2">50+</div>
              <p className="text-gray-600">Đối tác tin cậy</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6"
            >
              <div className="text-4xl font-bold text-[#51bb1a] mb-2">10K+</div>
              <p className="text-gray-600">Khách hàng hài lòng</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6"
            >
              <div className="text-4xl font-bold text-[#51bb1a] mb-2">1K+</div>
              <p className="text-gray-600">Sản phẩm đa dạng</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-6"
            >
              <div className="text-4xl font-bold text-[#51bb1a] mb-2">5+</div>
              <p className="text-gray-600">Năm kinh nghiệm</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div 
        data-aos="fade-up"
        className="container mx-auto px-4 py-16 text-center"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          Liên hệ với chúng tôi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <i className="fas fa-phone text-[#51bb1a] text-2xl mb-4"></i>
            <h3 className="text-lg font-semibold mb-2">Điện thoại</h3>
            <p className="text-gray-600">0123 456 789</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <i className="fas fa-envelope text-[#51bb1a] text-2xl mb-4"></i>
            <h3 className="text-lg font-semibold mb-2">Email</h3>
            <p className="text-gray-600">contact@freshfood.com</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <i className="fas fa-map-marker-alt text-[#51bb1a] text-2xl mb-4"></i>
            <h3 className="text-lg font-semibold mb-2">Địa chỉ</h3>
            <p className="text-gray-600">123 Đường ABC, Quận XYZ, TP.HCM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Introduce; 