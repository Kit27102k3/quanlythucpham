import Footer from "./Footer";
import Header from "./Header";
import { useEffect } from "react";

function DefaultLayout({ children }) {
  useEffect(() => {
    // Cuộn lên đầu trang với hiệu ứng mượt mà
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []); // Dependency array rỗng để đảm bảo useEffect chỉ chạy một lần khi component mount

  return (
    <div className="w-full mb-5">
      <Header />
      <div className="">{children}</div>
      <Footer />
    </div>
  );
}

export default DefaultLayout;
