import "../../../index.css";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const foods = [
  {
    urlImage:
      "https://bizweb.dktcdn.net/thumb/large/100/360/151/articles/thuong-thuc-bach-tuoc-600x400.jpg?v=1562726991657",
    title: "Bạch tuộc nướng và 5 cách chế biến thơm ngon để bạn đón mùa mưa về",
    detailTitle:
      "1. Hàm lượng dinh dưỡng trong bạch tuộc trước khi cùng nhau chế biến, chúng ta cùng kiểm trai lại ngoài việc dễ hấp dẫn người thưởng thức về vị ngon, bạch tuộc liệu có tác dụng như thế nào cho sức khỏe không, để nếu có dùng ",
  },
  {
    urlImage:
      "https://bizweb.dktcdn.net/thumb/large/100/360/151/articles/muc-chien-xu.jpg?v=1562726939323",
    title: "Bạch tuộc nướng và 5 cách chế biến thơm ngon để bạn đón mùa mưa về",
    detailTitle:
      "1. Hàm lượng dinh dưỡng trong bạch tuộc trước khi cùng nhau chế biến, chúng ta cùng kiểm trai lại ngoài việc dễ hấp dẫn người thưởng thức về vị ngon, bạch tuộc liệu có tác dụng như thế nào cho sức khỏe không, để nếu có dùng ",
  },
  {
    urlImage:
      "https://bizweb.dktcdn.net/thumb/large/100/360/151/articles/tom-rang-600x400.jpg?v=1562726861663",
    title: "Bạch tuộc nướng và 5 cách chế biến thơm ngon để bạn đón mùa mưa về",
    detailTitle:
      "1. Hàm lượng dinh dưỡng trong bạch tuộc trước khi cùng nhau chế biến, chúng ta cùng kiểm trai lại ngoài việc dễ hấp dẫn người thưởng thức về vị ngon, bạch tuộc liệu có tác dụng như thế nào cho sức khỏe không, để nếu có dùng ",
  },
  {
    urlImage:
      "https://bizweb.dktcdn.net/thumb/large/100/360/151/articles/mon-salad-dau-giam.jpg?v=1562726797760",
    title: "Bạch tuộc nướng và 5 cách chế biến thơm ngon để bạn đón mùa mưa về",
    detailTitle:
      "1. Hàm lượng dinh dưỡng trong bạch tuộc trước khi cùng nhau chế biến, chúng ta cùng kiểm trai lại ngoài việc dễ hấp dẫn người thưởng thức về vị ngon, bạch tuộc liệu có tác dụng như thế nào cho sức khỏe không, để nếu có dùng ",
  },
];

function Kitchen({ isHide }) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Force re-render animation khi component mount
    setKey(prevKey => prevKey + 1);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <AnimatePresence mode="sync">
      <motion.div className="mb-5 p-4" key={key}>
        {!isHide && (
          <>
            <motion.h1 
              className="font-medium text-[#292929] uppercase text-sm lg:text-[35px]"
              variants={titleVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false }}
            >
              Vào bếp
            </motion.h1>
            <motion.p 
              className="text-sm text-gray-400"
              variants={titleVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false }}
            >
              Cách nấu món ăn ngon mỗi ngày dễ làm cùng chuyên gia
            </motion.p>
          </>
        )}
        <motion.div
          className={`grid gap-3 ${
            !isHide ? "grid-cols-2 lg:grid-cols-4 mt-2" : "grid-cols-1"
          }`}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false }}
        >
          {foods.map((food, index) => (
            <motion.div 
              key={index} 
              className={`${isHide ? "flex items-center" : ""}`}
              variants={itemVariants}
            >
              <div
                className={`overflow-hidden rounded-md ${
                  isHide ? "w-[150px]" : "w-full"
                }`}
              >
                <img
                  src={food.urlImage}
                  alt=""
                  className={`hover-scale-up ${
                    isHide
                      ? "w-[80px] h-[60px] object-cover"
                      : "w-full h-[160px] object-cover"
                  }`}
                />
              </div>
              <div className="flex flex-col mt-2 cursor-pointer">
                <p className="uppercase text-[11px] font-medium text-[#1c1c1c] text-left hover:text-[#51aa1b]">
                  {food.title}
                </p>
                <p className="text-[10px] mt-1">
                  {food.detailTitle.slice(0, 100)}...
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default Kitchen;
