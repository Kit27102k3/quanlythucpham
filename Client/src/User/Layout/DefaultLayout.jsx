import Footer from "./Footer";
import Header from "./Header";
import { useEffect } from "react";
import React from "react";

const DefaultLayout = ({ children }) => {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);
  return (
    <div className="w-full mb-5">
      <Header />
      <div>{children}</div>
      <Footer />
    </div>
  );
};

export default DefaultLayout;
