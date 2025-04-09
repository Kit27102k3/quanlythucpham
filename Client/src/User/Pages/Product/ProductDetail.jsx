import "../../../App.css";
import "../../../index.css";
import { useNavigate } from "react-router-dom";

function ProductDetail() {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    navigate(`/products/category/${encodeURIComponent(category)}`);
  };

  return (
    <div className="product-dropdown-container">
      <div className="product-dropdown-content text-black bg-white shadow-lg">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4 px-6">
          <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <h2 className="text-[16px] font-semibold uppercase text-[#51bb1a] mb-3">
              Đồ uống các loại
            </h2>
            <ul className="space-y-2">
              {[
                "Nước ngọt, giải khát",
                "Bia, nước uống có cồn",
                "Nước suối",
                "Nước trái cây ép",
                "Nước yến",
                "Cà phê, trà",
                "Nước sữa trái cây",
              ].map((item, index) => (
                <li key={index}>
                  <a
                    onClick={() => handleCategoryClick(item)}
                    className="text-[14px] text-gray-700 hover:text-[#51bb1a] hover:underline transition-colors cursor-pointer"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <h2 className="text-[16px] font-semibold uppercase text-[#51bb1a] mb-3">
              Sữa các loại, tã bỉm
            </h2>
            <ul className="space-y-2">
              {[
                "Sữa tươi",
                "Sữa đậu nành, sữa từ hạt",
                "Sữa đặc",
                "Sữa chua, phô mai",
                "Sữa bột, bột ăn dặm",
              ].map((item, index) => (
                <li key={index}>
                  <a
                    onClick={() => handleCategoryClick(item)}
                    className="text-[14px] text-gray-700 hover:text-[#51bb1a] hover:underline transition-colors cursor-pointer"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <h2 className="text-[16px] font-semibold uppercase text-[#51bb1a] mb-3">
              Mì, cháo, phở ăn liền
            </h2>
            <ul className="space-y-2">
              {[
                "Mì ăn liền",
                "Cháo ăn liền",
                "Phở ăn liền",
                "Thực phẩm ăn liền khác",
              ].map((item, index) => (
                <li key={index}>
                  <a
                    onClick={() => handleCategoryClick(item)}
                    className="text-[14px] text-gray-700 hover:text-[#51bb1a] hover:underline transition-colors cursor-pointer"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <h2 className="text-[16px] font-semibold uppercase text-[#51bb1a] mb-3">
              Dầu ăn, nước chấm, gia vị
            </h2>
            <ul className="space-y-2">
              {[
                "Dầu ăn",
                "Nước tương",
                "Nước mắm",
                "Tương ớt, tương cà, tương đen",
                "Đường, hạt nêm, bột ngọt, muối",
              ].map((item, index) => (
                <li key={index}>
                  <a
                    onClick={() => handleCategoryClick(item)}
                    className="text-[14px] text-gray-700 hover:text-[#51bb1a] hover:underline transition-colors cursor-pointer"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
