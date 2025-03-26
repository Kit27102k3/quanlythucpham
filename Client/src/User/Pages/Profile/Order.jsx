import React from "react";
import { ClipboardListIcon, PackageIcon, CreditCardIcon } from "lucide-react";

export default function Order() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardListIcon className="w-6 h-6 text-[#51bb1a]" />
        <h2 className="text-xl font-semibold text-gray-800 lg:text-2xl">
          ĐƠN HÀNG CỦA BẠN
        </h2>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-50 border-b border-green-100">
              <tr>
                {[
                  "Đơn hàng",
                  "Ngày",
                  "Địa chỉ",
                  "Giá trị đơn hàng",
                  "TT thanh toán",
                  "TT vận chuyển",
                ].map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="text-center">
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-gray-500 bg-gray-50"
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <PackageIcon className="w-12 h-12 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Không có đơn hàng nào.
                    </p>
                    <button className="px-4 py-2 bg-[#51bb1a] text-white rounded-md hover:bg-[#51bb1a] transition-colors">
                      Bắt đầu mua sắm
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <OrderStatusCard
          icon={<PackageIcon className="w-6 h-6 text-blue-600" />}
          title="Đang xử lý"
          count={0}
        />
        <OrderStatusCard
          icon={<CreditCardIcon className="w-6 h-6 text-[#51bb1a]" />}
          title="Đã thanh toán"
          count={0}
        />
        <OrderStatusCard
          icon={<ClipboardListIcon className="w-6 h-6 text-purple-600" />}
          title="Hoàn thành"
          count={0}
        />
      </div>
    </div>
  );
}

const OrderStatusCard = ({ icon, title, count }) => (
  <div className="bg-white shadow-md rounded-lg p-4 flex items-center justify-between hover:shadow-lg transition-shadow">
    <div className="flex items-center space-x-4">
      {icon}
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-semibold text-gray-800">{count}</p>
      </div>
    </div>
  </div>
);
