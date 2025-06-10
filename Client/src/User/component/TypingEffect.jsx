/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

/**
 * Component hiển thị hiệu ứng đánh máy từng chữ một
 * @param {Object} props - Props của component
 * @param {string} props.text - Nội dung văn bản cần hiển thị
 * @param {number} props.speed - Tốc độ hiển thị (ms giữa mỗi ký tự)
 * @param {Function} props.onComplete - Callback khi hoàn thành hiệu ứng
 * @returns {JSX.Element} - Component React
 */
const TypingEffect = ({ text, speed = 30, onComplete = () => {} }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Reset state khi text thay đổi
    if (!text) return;
    
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (!text) return;
    
    if (currentIndex < text.length) {
      // Thiết lập timeout để thêm ký tự tiếp theo
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, speed);
      
      // Cleanup timeout khi component unmount hoặc text thay đổi
      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      // Đánh dấu đã hoàn thành và gọi callback
      setIsComplete(true);
      onComplete();
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  // Trả về văn bản đã hiển thị với dấu nhấp nháy nếu đang đánh máy
  return (
    <div className="whitespace-pre-line">
      {displayedText}
      {!isComplete && <span className="typing-cursor">|</span>}
    </div>
  );
};

export default TypingEffect; 