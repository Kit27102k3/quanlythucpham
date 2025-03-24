import { useEffect, useState, useRef } from "react";
import { DotFilledIcon, MinusIcon, PlusIcon } from "@radix-ui/react-icons";
import { Card, CardContent } from "../../component/ui/card";
import { ChevronDown, ChevronRight, DivideCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import productsApi from "../../../api/productsApi";
import { useParams } from "react-router-dom";
import formatCurrency from "../../Until/FotmatPrice";
import "../../../index.css";
import Kitchen from "./Kitchen";
import RelatedProducts from "./RelatedProducts";
import Chatbot from "../../component/ChatBot";

export default function ProductDetails() {
  const [selectedImage, setSelectedImage] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [count, setCount] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [overview, setOverview] = useState(false);
  const [introduce, setIntroduce] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [products, setProducts] = useState(null);
  const { id } = useParams();
  const topElementRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productsApi.getProductById(id); // Lấy thông tin sản phẩm
        setProducts(data);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin sản phẩm:", error);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (topElementRef.current) {
      topElementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsApi.getProductById(id);
        setProducts(data);
        setProductImages(data.productImages);
        setSelectedImage(data?.productImages[0] || null);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
      }
    };
    fetchProducts();
  }, [id]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const toggleOverview = () => {
    setOverview(!overview);
  };

  const toggleIntroduce = () => {
    setIntroduce(!introduce);
  };

  useEffect(() => {
    if (productImages?.length > 0) {
      setSelectedImage(productImages[0]);
    }
  }, [productImages]);

  const descriptionArray =
    typeof products?.productDescription === "string"
      ? products.productDescription.includes("[")
        ? JSON.parse(products.productDescription) // Nếu là JSON string
        : products.productDescription
            .split(".") // Nếu là plain string
            .map((item) => item.trim())
            .filter((item) => item)
      : products?.productDescription || [];

  return (
    <div ref={topElementRef} className="p-2 lg:mb-5">
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
                  <span className="text-[#51bb1a] ">
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
                            Nước dừa xiêm hương vị sen Cocoxim
                          </span>{" "}
                          <span className="text-[12px]">
                            được sản xuất theo công nghệ hiện đại, mọi khâu từ
                            tuyển chọn nguyên liệu tới chế biến, đóng bao bì đều
                            diễn ra khép kín dưới sự giám sát và kiểm tra nghiêm
                            ngặt. Sản phẩm không chứa hóa chất, chất bảo quản
                            độc hại, đảm bảo an toàn cho sức khỏe người tiêu
                            dùng. Sản phẩm có hương vị của những nguyên liệu tự
                            nhiên được chọn lọc kỹ càng, sẽ mang lại cho bạn
                            những phút giải trí và thưởng thức thật tuyệt vời
                            bên cạnh bạn bè hoặc người thân.
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
                      className=" size-8 border p-2 text-black"
                    />
                    <input
                      type="text"
                      className="text-black w-16 border p-[4.5px] border-l-0 border-r-0 outline-none text-center"
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value) || 1)}
                    />
                    <PlusIcon
                      onClick={() => setCount(count + 1)}
                      className=" size-8 border p-2 text-black cursor-pointer"
                    />
                  </div>
                </div>
                <button className="bg-[#51bb1a] w-full cursor-pointer text-white text-sm p-2 mt-4 flex flex-col hover:opacity-90">
                  <span className="uppercase">
                    {" "}
                    MUA NGAY VỚI GIÁ {formatCurrency(products?.productPrice)}đ
                  </span>
                  <span className="text-[12px]">Đặt mua giao hàng tận nơi</span>
                </button>
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
                      Nước dừa xiêm hương vị sen Cocoxim
                    </span>

                    <span className="text-[12px]">
                      được sản xuất theo công nghệ hiện đại, mọi khâu từ tuyển
                      chọn nguyên liệu tới chế biến, đóng bao bì đều diễn ra
                      khép kín dưới sự giám sát và kiểm tra nghiêm ngặt. Sản
                      phẩm không chứa hóa chất, chất bảo quản độc hại, đảm bảo
                      an toàn cho sức khỏe người tiêu dùng. Sản phẩm có hương vị
                      của những nguyên liệu tự nhiên được chọn lọc kỹ càng, sẽ
                      mang lại cho bạn những phút giải trí và thưởng thức thật
                      tuyệt vời bên cạnh bạn bè hoặc người thân.
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
                    <span className="text-black font-bold">
                      Nước dừa xiêm hương vị sen Cocoxim
                    </span>{" "}
                    <span className="text-[12px]">
                      được sản xuất theo công nghệ hiện đại, mọi khâu từ tuyển
                      chọn nguyên liệu tới chế biến, đóng bao bì đều diễn ra
                      khép kín dưới sự giám sát và kiểm tra nghiêm ngặt. Sản
                      phẩm không chứa hóa chất, chất bảo quản độc hại, đảm bảo
                      an toàn cho sức khỏe người tiêu dùng. Sản phẩm có hương vị
                      của những nguyên liệu tự nhiên được chọn lọc kỹ càng, sẽ
                      mang lại cho bạn những phút giải trí và thưởng thức thật
                      tuyệt vời bên cạnh bạn bè hoặc người thân.
                    </span>
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
          <button className="hover-animation-button p-2 bg-[#51bb1a] text-white border-[#51bb1a]  mt-2 container mx-auto lg:text-sm">
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
            ) : (
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
            )}
          </div>
        </div>
        <div className="lg:grid lg:grid-cols-1 mt-3 ">
          <h1 className="text-[16px] uppercase font-medium mb-[6px]">
            TIN KHUYẾN MÃI
          </h1>
          <div className="border-b"></div>
          <Kitchen isHide={true} />
        </div>
      </div>
      <div className="mt-10 mx-auto">
        <RelatedProducts currentProduct={products} />
      </div>
      <div>
        <Chatbot productId={id} />
      </div>
    </div>
  );
}
