import "../../../App.css";

function ProductDetail() {
  return (
    <div className="text-black bg-white">
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-2 px-4">
        <div className="p-2 rounded-lg">
          <h2 className="text-[16px] font-medium uppercase">
            Đồ uống các loại
          </h2>
          <ul className="mt-2 text-[14px] flex flex-col font-extralight transition-none ">
            <a className="li-list">Nước ngọt, giải khát</a>
            <a className="li-list">Bia, nước uống có cồn</a>
            <a className="li-list">Nước suối</a>
            <a className="li-list">Nước trái cây ép</a>
            <a className="li-list">Nước yến</a>
            <a className="li-list">Cà phê, trà</a>
            <a className="li-list">Nước sữa trái cây</a>
          </ul>
        </div>
        <div className="p-2 rounded-lg">
          <h2 className="text-[16px] font-medium uppercase ">
            Sữa các loại, tã bỉm
          </h2>
          <ul className="mt-2 text-[14px] flex flex-col font-extralight transition-none ">
            <a className="li-list">Sữa tươi</a>
            <a className="li-list">Sữa đậu nành, sữa từ hạt</a>
            <a className="li-list">Sữa đặc</a>
            <a className="li-list">Sữa chua, phô mai</a>
            <a className="li-list">Sữa bột, bột ăn dặm</a>
          </ul>
        </div>
        <div className="p-2 rounded-lg">
          <h2 className="text-[16px] font-medium uppercase ">
            Mì, cháo, phở ăn liền
          </h2>
          <ul className="mt-2 text-[14px] flex flex-col font-extralight transition-none ">
            <a className="li-list">Mì ăn liền</a>
            <a className="li-list">Cháo ăn liền</a>
            <a className="li-list">Phở ăn liền</a>
            <a className="li-list">Thực phẩm ăn liền khác</a>
          </ul>
        </div>
        <div className="p-2 rounded-lg">
          <h2 className="text-[16px] font-medium uppercase ">
            Dầu ăn, nước chấm, gia vị
          </h2>
          <ul className="mt-2 text-[14px] flex flex-col font-extralight transition-none ">
            <a className="li-list">Dầu ăn</a>
            <a className="li-list">Nước tương</a>
            <a className="li-list">Nước mắm</a>
            <a className="li-list">Tương ớt, tương cà, tương đen</a>
            <a className="li-list">Đường, hạt nêm, bột ngọt, muối</a>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
