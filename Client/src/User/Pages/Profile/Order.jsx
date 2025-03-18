export default function Order() {
  return (
    <div className="">
      <h2 className="text-sm font-normal mb-4 lg:text-[20px]">ĐƠN HÀNG CỦA BẠN</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-zinc-300">
          <thead className="bg-zinc-100">
            <tr>
              <th className="border text-sm font-normal border-zinc-300 px-8">Đơn hàng</th>
              <th className="border text-sm font-normal border-zinc-300 px-8">Ngày</th>
              <th className="border text-sm font-normal border-zinc-300 px-8">Địa chỉ</th>
              <th className="border text-sm font-normal border-zinc-300 px-8 ">Giá trị đơn hàng</th>
              <th className="border text-sm font-normal border-zinc-300 px-8">TT thanh toán</th>
              <th className="border text-sm font-normal border-zinc-300 px-8">TT vận chuyển</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border text-sm font-normal border-zinc-300 p-2" colSpan="6">
                Không có đơn hàng nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
