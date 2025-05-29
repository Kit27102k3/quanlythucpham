import { useState, useEffect } from "react";
import { MapPinIcon, PhoneIcon, ClockIcon, InfoIcon, ChevronRightIcon } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";

const StoreLocations = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  const stores = [
    {
      id: 1,
      name: "DNC FOOD - Chi nhánh Cần Thơ",
      address: "Trường Đại học Nam Cần Thơ, Nguyễn Văn Cừ nối dài, Cần Thơ City",
      phone: "0326 743 391",
      email: "kit10012003@gmail.com",
      hours: "7:00 - 21:00",
      days: "Thứ 2 - Chủ nhật",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.107887665177!2d105.72025667460117!3d10.0079464900979!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a08903d92d1d0d%3A0x2c147a40ead97caa!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBOYW0gQ-G6p24gVGjGoQ!5e0!3m2!1svi!2s!4v1739710011236!5m2!1svi!2s",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: 2,
      name: "DNC FOOD - Chi nhánh Sóc Trăng",
      address: "122, ấp Mỹ Khánh A, xã Long Hưng, huyện Mỹ Tú, tỉnh Sóc Trăng",
      phone: "0326 743 391",
      email: "kit10012003@gmail.com",
      hours: "7:00 - 20:00",
      days: "Thứ 2 - Chủ nhật",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3932.8655103547044!2d105.799366!3d9.666481399999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0373bf212f747%3A0x15c4a6c774cb5477!2zTXkgVHUsIFPDs2MgVHLEg25nLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1684317133651!5m2!1svi!2s",
      image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check if device is mobile
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mobile store selector component
  const MobileStoreSelector = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6 ">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Chọn cửa hàng</h2>
      <div className="flex overflow-x-auto py-2 gap-4 scrollbar-hide">
        {stores.map((store, index) => (
          <div 
            key={store.id}
            className={`flex-shrink-0 w-64 p-3 rounded-lg cursor-pointer ${
              activeTab === index 
                ? "bg-green-50 border-2 border-green-500" 
                : "bg-gray-50 border-2 border-transparent"
            }`}
            onClick={() => setActiveTab(index)}
          >
            <h3 className="font-medium text-base text-gray-800">{store.name}</h3>
            <div className="flex items-start mt-2 text-sm text-gray-600">
              <MapPinIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{store.address}</span>
            </div>
            <div className="flex justify-end mt-2">
              <ChevronRightIcon className={`w-5 h-5 ${activeTab === index ? "text-green-500" : "text-gray-400"}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>Cửa hàng | DNC FOOD</title>
        <meta name="description" content="Hệ thống cửa hàng DNC FOOD - Thực phẩm sạch, an toàn" />
      </Helmet>

      {/* Hero section */}
      <div className=" text-black py-10 md:py-16">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Hệ Thống Cửa Hàng</h1>
          <p className="text-base md:text-xl max-w-2xl mx-auto">
            DNC FOOD - Hệ thống cửa hàng thực phẩm sạch, an toàn. Cam kết chất lượng, phục vụ tận tâm.
          </p>
        </div>
      </div>

      {/* Store selection tabs */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Mobile store selector */}
        {isMobile && <MobileStoreSelector />}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Store tabs - desktop only */}
          {!isMobile && (
            <div className="md:w-1/3">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Cửa hàng của chúng tôi</h2>
                
                <div className="space-y-4">
                  {stores.map((store, index) => (
                    <div 
                      key={store.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        activeTab === index 
                          ? "bg-green-50 border-l-4 border-green-500" 
                          : "bg-gray-50 hover:bg-green-50"
                      }`}
                      onClick={() => setActiveTab(index)}
                    >
                      <h3 className="font-medium text-lg text-gray-800">{store.name}</h3>
                      <div className="flex items-start mt-2 text-gray-600">
                        <MapPinIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                        <span>{store.address}</span>
                      </div>
                      <div className="flex items-center mt-2 text-gray-600">
                        <PhoneIcon className="w-5 h-5 text-green-500 mr-2" />
                        <span>{store.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Giờ mở cửa</h2>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <ClockIcon className="w-5 h-5 text-green-500 mr-2" />
                    <span>{stores[activeTab].hours}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <InfoIcon className="w-5 h-5 text-green-500 mr-2" />
                    <span>{stores[activeTab].days}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Store details */}
          <div className={isMobile ? "w-full" : "md:w-2/3"}>
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <img 
                src={stores[activeTab].image} 
                alt={stores[activeTab].name}
                className="w-full h-48 md:h-64 object-cover"
              />
              
              <div className="p-4 md:p-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                  {stores[activeTab].name}
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <MapPinIcon className="w-5 md:w-6 h-5 md:h-6 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-700">Địa chỉ</p>
                      <p className="text-gray-600 text-sm md:text-base">{stores[activeTab].address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <PhoneIcon className="w-5 md:w-6 h-5 md:h-6 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-700">Liên hệ</p>
                      <p className="text-gray-600 text-sm md:text-base">{stores[activeTab].phone}</p>
                      <p className="text-gray-600 text-sm md:text-base">{stores[activeTab].email}</p>
                    </div>
                  </div>
                  
                  {/* Show opening hours on mobile */}
                  {isMobile && (
                    <div className="flex items-start">
                      <ClockIcon className="w-5 md:w-6 h-5 md:h-6 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-700">Giờ mở cửa</p>
                        <p className="text-gray-600 text-sm md:text-base">{stores[activeTab].hours}</p>
                        <p className="text-gray-600 text-sm md:text-base">{stores[activeTab].days}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="rounded-lg overflow-hidden w-full h-60 md:h-80">
                  <iframe
                    src={stores[activeTab].mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map location for ${stores[activeTab].name}`}
                  ></iframe>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Call to action section */}
      <div className="bg-[#51bb1a] text-white py-8 md:py-12 mt-8 md:mt-12">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Đến thăm cửa hàng của chúng tôi!</h2>
          <p className="text-base md:text-xl max-w-3xl mx-auto mb-6 md:mb-8">
            Hãy ghé thăm cửa hàng DNC FOOD gần nhất để trải nghiệm các sản phẩm thực phẩm sạch, 
            an toàn với giá cả phải chăng và đội ngũ nhân viên nhiệt tình.
          </p>
          <button 
            onClick={() => window.location.href = '/lien-he'}
            className="px-6 md:px-8 py-2 md:py-3 bg-white text-green-600 rounded-full font-semibold hover:bg-gray-100 transition duration-300"
          >
            Liên hệ với chúng tôi
          </button>
        </div>
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default StoreLocations; 