import Kitchen from '../Product/Kitchen'

function News() {
  return (
    <div className="">
      <div className="flex items-center gap-2 p-2 lg:px-[120px]">
        <a href="">Trang chủ</a> {" >"}
        <div>Tin tức</div>
      </div>
      <div className="border-b-gray-50 border"></div>
      <div className="p-2 mt-2 lg:px-[120px]">
        <div className="uppercase text-[16px] font-medium">Tất cả tin tức</div>
        <Kitchen />
      </div>
    </div>
  );
}

export default News;
