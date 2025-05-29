import { memo } from "react";
import PropTypes from "prop-types";

const StatusTransitionInfo = ({
  order,
  formatDate,
  getStatusText,
  getStatusColor,
}) => {
  if (!order || !order.statusHistory || order.statusHistory.length === 0) {
    return null;
  }

  // Sắp xếp lịch sử trạng thái theo thời gian
  const sortedHistory = [...order.statusHistory].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  return (
    <div className="mt-6">
      <h3 className="font-medium text-blue-700 mb-3 flex items-center">
        <i className="pi pi-history mr-2"></i>
        Lịch sử trạng thái
      </h3>

      <div className="relative">
        {/* Đường dọc kết nối các bước */}
        <div className="absolute left-3 top-5 bottom-5 w-0.5 bg-gray-200"></div>

        <div className="space-y-4">
          {sortedHistory.map((item, index) => (
            <div key={index} className="flex">
              <div
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${getStatusColor(
                  item.status
                )}`}
              >
                <i className="pi pi-circle-fill text-xs"></i>
              </div>

              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {getStatusText(item.status)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {formatDate(item.timestamp)}
                  </span>
                </div>

                {item.note && (
                  <p className="text-gray-600 text-sm">{item.note}</p>
                )}

                {item.updatedBy && (
                  <div className="text-xs text-gray-500 mt-1">
                    Cập nhật bởi:{" "}
                    {item.updatedBy.fullName ||
                      item.updatedBy.email ||
                      "Hệ thống"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

StatusTransitionInfo.propTypes = {
  order: PropTypes.object.isRequired,
  formatDate: PropTypes.func.isRequired,
  getStatusText: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired,
};

export default memo(StatusTransitionInfo);
