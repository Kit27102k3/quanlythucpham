import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";

export default function MenuDropDown() {
  const [isOpen, setIsOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleSubMenu = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const options = [
    {
      label: "Đồ Uống Các Loại",
      subOptions: ["Nước Ngọt", "Nước Suối", "Nước Ép"],
    },
    {
      label: "Sữa Các Loại, Tã Bỉm",
      subOptions: ["Sữa Bột", "Sữa Tươi", "Tã Em Bé"],
    },
    {
      label: "Mì, Cháo, Phở Ăn Liền",
      subOptions: ["Mì Gói", "Phở Ăn Liền", "Cháo Gói"],
    },
    {
      label: "Dầu Ăn, Nước Chấm, Gia Vị",
      subOptions: ["Dầu Ăn", "Nước Mắm", "Gia Vị"],
    },
  ];

  return (
    <div className="relative w-64 bg-white text-black text-sm ">
      <button
        onClick={toggleMenu}
        className="w-full flex justify-between items-center  bg-white text-black "
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
                      key={sub}
                      className="p-2 hover:bg-gray-200 cursor-pointer"
                    >
                      {sub}
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
