import "../../../index.css";

const products = [
  {
    urlImage:
      "https://bizweb.dktcdn.net/thumb/large/100/360/151/products/nuocdua.jpg?v=1562726113047",
    title: "Nước dừa xiêm hương vị sen Cocoxim hộp 330ml",
    price: "13.000",
  },
  {
    urlImage:
      "https://bizweb.dktcdn.net/thumb/large/100/360/151/products/nuocdua.jpg?v=1562726113047",
    title: "Nước dừa xiêm hương vị sen Cocoxim hộp 330ml",
    price: "13.000",
  },
  {
    urlImage:
      "https://bizweb.dktcdn.net/thumb/large/100/360/151/products/nuocdua.jpg?v=1562726113047",
    title: "Nước dừa xiêm hương vị sen Cocoxim hộp 330ml",
    price: "13.000",
  },
  {
    urlImage:
      "https://bizweb.dktcdn.net/thumb/large/100/360/151/products/nuocdua.jpg?v=1562726113047",
    title: "Nước dừa xiêm hương vị sen Cocoxim hộp 330ml",
    price: "13.000",
  },
  {
    urlImage:
      "https://bizweb.dktcdn.net/thumb/large/100/360/151/products/nuocdua.jpg?v=1562726113047",
    title: "Nước dừa xiêm hương vị sen Cocoxim hộp 330ml",
    price: "13.000",
  },
  {
    urlImage:
      "https://bizweb.dktcdn.net/thumb/large/100/360/151/products/nuocdua.jpg?v=1562726113047",
    title: "Nước dừa xiêm hương vị sen Cocoxim hộp 330ml",
    price: "13.000",
  },
];

function AllProducts() {
  return (
    <div className="px-4 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {products.map((product, index) => (
          <div
            key={index}
            className="relative items-center justify-center group cursor-pointer bg-white rounded-md overflow-hidden"
          >
            <div className="relative overflow-hidden ">
              <img
                src={product.urlImage}
                alt=""
                className="w-full mx-auto h-[197px] object-cover hover-scale-up lg:w-[272px] lg:h-[272px]"
              />
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <button className="px-4 py-2 bg-[#51aa1b] text-white uppercase text-[12px] hover:text-[#51aa1b] hover:bg-white hover:border hover:border-[#51aa1b]">
                  Thêm vào giỏ
                </button>
                <button className="px-4 py-2 bg-[#51aa1b] text-white uppercase text-[12px] hover:text-[#51aa1b] hover:bg-white hover:border hover:border-[#51aa1b]">
                  Xem chi tiết
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center mt-auto p-4 text-center">
              <p className="font-medium text-[10px] hover:text-[#51aa1b] line-clamp-1 lg:text-[14px]">
                {product.title}
              </p>
              <p className="text-[#51aa1b] text-[10px] mt-1 lg:text-[14px]">
                {product.price}đ
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AllProducts;
