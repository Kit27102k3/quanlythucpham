import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Scrollbars } from 'react-custom-scrollbars-2';
import { COLORS } from '../utils/reportUtils';

const DeliveryReport = ({ 
  deliveryData,
  exportToPDF,
  exportToExcel,
  sendReportEmail,
  exportLoading,
  setExportLoading
}) => {
  // Check if we have data to display
  const hasData = deliveryData && Object.keys(deliveryData).length > 0;
  const hasDeliveries = hasData && Array.isArray(deliveryData.deliveries) && deliveryData.deliveries.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Báo cáo giao hàng</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="delivery-report" className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo giao hàng</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportToPDF('delivery', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() => exportToExcel(deliveryData.deliveries || [], 'delivery', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail('delivery', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Gửi Email
          </button>
        </div>
      </div>

      {/* Thống kê giao hàng */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-700">Giao hàng thành công</h3>
          <p className="text-xl md:text-2xl font-bold text-blue-900">{deliveryData.statistics?.completed || 0}</p>
        </div>
        <div className="bg-yellow-50 p-3 md:p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-700">Đang giao</h3>
          <p className="text-xl md:text-2xl font-bold text-yellow-900">{deliveryData.statistics?.inProgress || 0}</p>
        </div>
        <div className="bg-red-50 p-3 md:p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-700">Giao hàng trễ</h3>
          <p className="text-xl md:text-2xl font-bold text-red-900">{deliveryData.statistics?.delayed || 0}</p>
        </div>
        <div className="bg-green-50 p-3 md:p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-700">Thời gian giao trung bình</h3>
          <p className="text-xl md:text-2xl font-bold text-green-900">{deliveryData.statistics?.avgDeliveryTime || "N/A"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Tỷ lệ đối tác giao hàng */}
        {deliveryData.deliveryPartners && deliveryData.deliveryPartners.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Tỷ lệ đối tác giao hàng</h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliveryData.deliveryPartners}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deliveryData.deliveryPartners.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} đơn hàng (${((value / (deliveryData.statistics?.total || 1)) * 100).toFixed(1)}%)`, 
                      name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Thời gian giao hàng theo khu vực */}
        {deliveryData.deliveryTimeByRegion && deliveryData.deliveryTimeByRegion.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Thời gian giao hàng theo khu vực</h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deliveryData.deliveryTimeByRegion}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis label={{ value: 'Giờ', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} giờ`, "Thời gian giao hàng"]} />
                  <Legend />
                  <Bar dataKey="time" name="Thời gian giao hàng (giờ)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Bảng thông tin giao hàng gần đây */}
      {hasDeliveries && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Giao hàng gần đây</h3>
          <div className="overflow-hidden" style={{ height: '400px' }}>
            <Scrollbars 
              autoHide 
              autoHideTimeout={1000} 
              autoHideDuration={200}
              renderThumbVertical={props => <div {...props} className="bg-gray-400 rounded-full" />}
              renderTrackVertical={props => <div {...props} className="bg-gray-200" />}
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã đơn hàng
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Địa chỉ
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đối tác giao hàng
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveryData.deliveries.map((delivery, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {delivery.orderId}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {delivery.customerName}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {delivery.address}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {delivery.partner}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {delivery.deliveryTime}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            delivery.status === "Hoàn thành" || delivery.status === "Đã giao" || delivery.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : delivery.status === "Đang giao"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {delivery.status === "Hoàn thành" || delivery.status === "delivered" ? "Đã giao" : delivery.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Scrollbars>
          </div>
        </div>
      )}
    </div>
  );
};

// PropTypes validation
DeliveryReport.propTypes = {
  deliveryData: PropTypes.shape({
    statistics: PropTypes.shape({
      completed: PropTypes.number,
      inProgress: PropTypes.number,
      delayed: PropTypes.number,
      total: PropTypes.number,
      avgDeliveryTime: PropTypes.string
    }),
    deliveryPartners: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        value: PropTypes.number
      })
    ),
    deliveryTimeByRegion: PropTypes.arrayOf(
      PropTypes.shape({
        region: PropTypes.string,
        time: PropTypes.number
      })
    ),
    deliveries: PropTypes.arrayOf(
      PropTypes.shape({
        orderId: PropTypes.string,
        customerName: PropTypes.string,
        address: PropTypes.string,
        partner: PropTypes.string,
        deliveryTime: PropTypes.string,
        status: PropTypes.string
      })
    )
  }),
  exportToPDF: PropTypes.func.isRequired,
  exportToExcel: PropTypes.func.isRequired,
  sendReportEmail: PropTypes.func.isRequired,
  exportLoading: PropTypes.bool.isRequired,
  setExportLoading: PropTypes.func.isRequired
};

export default DeliveryReport; 