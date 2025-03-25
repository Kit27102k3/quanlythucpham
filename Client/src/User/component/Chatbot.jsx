import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookMessenger } from "@fortawesome/free-brands-svg-icons";
import { MinusIcon } from "@radix-ui/react-icons";

const Chatbot = ({ productId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFirstOpen, setIsFirstOpen] = useState(true); 
  const userId = localStorage.getItem("userId");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); 

  useEffect(() => {
    if (isOpen && isFirstOpen) {
      const welcomeMessage = "Xin chào, tôi có thể giúp gì cho bạn?";
      setMessages((prev) => [...prev, { text: welcomeMessage, sender: "bot" }]);
      setIsFirstOpen(false); 
    }
  }, [isOpen, isFirstOpen]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8080/api/chat", {
        userId: userId,
        message: input,
        productId: productId,
      });

      setMessages((prev) => [
        ...prev,
        { text: response.data.message, sender: "bot" },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "Lỗi kết nối đến server.", sender: "bot" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 -right-60 w-80">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full shadow-lg transition duration-300 flex items-center justify-center"
      >
        {isOpen ? (
          <MinusIcon className="h-5 w-5 hide-on-pc hide-on-mobile" />
        ) : (
          <FontAwesomeIcon
            icon={faFacebookMessenger}
            size="lg"
            className="bg-blue-500 p-3 rounded-full text-white cursor-pointer"
          />
        )}
      </button>

      {isOpen && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mt-2 border border-gray-300 -ml-64 mr-64">
          <div className="bg-blue-500 text-white p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chatbot</h2>
            <button onClick={() => setIsOpen(false)}>
              <MinusIcon className="h-5 w-5 cursor-pointer" />
            </button>
          </div>

          <div className="p-4 h-64 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${
                  msg.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`inline-block px-4 py-2 rounded-lg ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {isLoading && (
              <div className="text-left">
                <span className="inline-block px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">
                  Đang xử lý...
                </span>
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              className={`mt-2 w-full px-4 py-2 rounded-lg ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white transition duration-300`}
              disabled={isLoading}
            >
              {isLoading ? "Đang gửi..." : "Gửi"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
