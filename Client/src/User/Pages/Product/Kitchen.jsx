import "../../../index.css";

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
  return (
    <div className="mb-5 p-4">
      {!isHide && (
        <>
          <h1 className="font-medium text-[#292929] uppercase text-sm lg:text-[35px]">
            Vào bếp
          </h1>
          <p className="text-sm text-gray-400">
            Cách nấu món ăn ngon mỗi ngày dễ làm cùng chuyên gia
          </p>
        </>
      )}
      <div
        className={`grid gap-3 ${
          !isHide ? "grid-cols-2 lg:grid-cols-4 mt-2" : "grid-cols-1"
        }`}
      >
        {foods.map((food, index) => (
          <div key={index} className={`${isHide ? "flex items-center" : ""}`}>
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default Kitchen;
