import Footer from "./Footer";
import Header from "./Header";
import { useEffect } from "react";

function DefaultLayout({ children }) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);
  return (
    <div className="w-full mb-5">
      <Header />
      <div className="">{children}</div>
      <Footer />
    </div>
  );
}

export default DefaultLayout;
