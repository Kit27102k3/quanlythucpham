import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";

export default function MenuDropDown() {
  const [isOpen, setIsOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleSubMenu = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSubOptionClick = (option) => {
    // Chuyển hướng đến trang danh mục với tên danh mục đã được mã hóa
    navigate(`/san-pham/${encodeURIComponent(option)}`);
    setIsOpen(false);
    setOpenIndex(null);
  };

  const options = [
    {
      label: "Đồ Uống Các Loại",
      subOptions: [
        { name: "NƯỚC NGỌT, GIẢI KHÁT", path: "nuoc-ngot-giai-khat" },
        { name: "BIA, NƯỚC UỐNG CÓ CỒN", path: "bia-nuoc-uong-co-con" },
        { name: "NƯỚC SUỐI", path: "nuoc-suoi" },
        { name: "NƯỚC TRÁI CÂY ÉP", path: "nuoc-trai-cay-ep" },
        { name: "NƯỚC YẾN", path: "nuoc-yen" },
        { name: "CÀ PHÊ, TRÀ", path: "ca-phe-tra" },
        { name: "NƯỚC SỮA TRÁI CÂY", path: "nuoc-sua-trai-cay" }
      ],
    },
    {
      label: "Sữa Các Loại, Tã Bỉm",
      subOptions: [
        { name: "SỮA TƯƠI", path: "sua-tuoi" },
        { name: "SỮA ĐẬU NÀNH, SỮA TỪ HẠT", path: "sua-dau-nanh-sua-tu-hat" },
        { name: "SỮA ĐẶC", path: "sua-dac" },
        { name: "SỮA CHUA, PHÔ MAI", path: "sua-chua-pho-mai" },
        { name: "SỮA BỘT, BỘT ĂN DẶM", path: "sua-bot-bot-an-dam" }
      ],
    },
    {
      label: "Mì, Cháo, Phở Ăn Liền",
      subOptions: [
        { name: "MÌ ĂN LIỀN", path: "mi-an-lien" },
        { name: "CHÁO ĂN LIỀN", path: "chao-an-lien" },
        { name: "PHỞ ĂN LIỀN", path: "pho-an-lien" },
        { name: "THỰC PHẨM ĂN LIỀN KHÁC", path: "thuc-pham-an-lien-khac" }
      ],
    },
    {
      label: "Dầu Ăn, Nước Chấm, Gia Vị",
      subOptions: [
        { name: "DẦU ĂN", path: "dau-an" },
        { name: "NƯỚC TƯƠNG", path: "nuoc-tuong" },
        { name: "NƯỚC MẮM", path: "nuoc-mam" },
        { name: "TƯƠNG ỚT, TƯƠNG CÀ, TƯƠNG ĐEN", path: "tuong-ot-tuong-ca-tuong-den" },
        { name: "ĐƯỜNG, HẠT NÊM, BỘT NGỌT, MUỐI", path: "duong-hat-nem-bot-ngot-muoi" }
      ],
    },
  ];

  return (
    <div className="relative w-64 bg-white text-black text-sm">
      <button
        onClick={toggleMenu}
        className="w-full flex justify-between items-center bg-white text-black"
      >
        Sản Phẩm
        {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>

      {isOpen && (
        <ul>
          {options.map((option, index) => (
            <li key={option.label} className="">
              <button
                className="w-full flex justify-between items-center p-2 text-left hover:bg-gray-100"
                onClick={() => toggleSubMenu(index)}
              >
                {option.label}
                {openIndex === index ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </button>
              {openIndex === index && (
                <ul className="pl-4 bg-gray-50">
                  {option.subOptions.map((sub) => (
                    <li
                      key={sub.name}
                      className="p-2 hover:bg-gray-200 cursor-pointer"
                      onClick={() => handleSubOptionClick(sub.name)}
                    >
                      {sub.name}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
