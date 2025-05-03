import Footer from "./Footer";
import Header from "./Header";
import { useEffect, useState } from "react";
import React from "react";
import ChatBotWithErrorBoundary from "../component/Chatbot";

const DefaultLayout = ({ children }) => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  
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
      <ChatBotWithErrorBoundary isOpen={isChatbotOpen} setIsOpen={setIsChatbotOpen} />
    </div>
  );
};

export default DefaultLayout;
