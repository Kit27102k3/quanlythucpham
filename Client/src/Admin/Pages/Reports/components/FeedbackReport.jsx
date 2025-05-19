import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { COLORS } from '../utils/reportUtils';

const FeedbackReport = ({ 
  feedbackData,
  exportToPDF,
  exportToExcel,
  sendReportEmail,
  exportLoading,
  setExportLoading
}) => {
  return (
    <div id="feedback-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo đánh giá khách hàng</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF('feedback', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() => exportToExcel(feedbackData.recentFeedback, 'feedback', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail('feedback', setExportLoading)}
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

      {/* Thống kê đánh giá */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-700">Đánh giá trung bình</h3>
          <p className="text-2xl font-bold text-green-900">{feedbackData.statistics?.averageRating || 0} / 5</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-700">Tổng đánh giá</h3>
          <p className="text-2xl font-bold text-blue-900">{feedbackData.statistics?.totalFeedback || 0}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-700">Phản hồi tích cực</h3>
          <p className="text-2xl font-bold text-yellow-900">{feedbackData.statistics?.positiveFeedback || 0}%</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-700">Phản hồi tiêu cực</h3>
          <p className="text-2xl font-bold text-red-900">{feedbackData.statistics?.negativeFeedback || 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Phân phối đánh giá */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Phân phối đánh giá</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={feedbackData.ratingDistribution}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} đánh giá`, "Số lượng"]} />
                <Legend />
                <Bar dataKey="count" name="Số lượng đánh giá" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Xu hướng đánh giá theo thời gian */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Xu hướng đánh giá theo thời gian</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={feedbackData.ratingTrend}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 5]} />
                <Tooltip formatter={(value) => [`${value}`, "Điểm đánh giá"]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rating"
                  name="Điểm đánh giá"
                  stroke={COLORS[0]}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Từ khóa phổ biến */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Từ khóa phổ biến trong đánh giá</h3>
        <div className="flex flex-wrap gap-2">
          {feedbackData.commonKeywords && feedbackData.commonKeywords.map((keyword, index) => (
            <div
              key={index}
              className={`px-3 py-2 rounded-full text-sm font-medium ${
                keyword.sentiment === "positive"
                  ? "bg-green-100 text-green-800"
                  : keyword.sentiment === "negative"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {keyword.word} ({keyword.count})
            </div>
          ))}
        </div>
      </div>

      {/* Đánh giá gần đây */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">Đánh giá gần đây</h3>
        <div className="space-y-4">
          {feedbackData.recentFeedback && feedbackData.recentFeedback.map((feedback, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-900">{feedback.customerName}</span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${
                        i < feedback.rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-1">{feedback.comment}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{feedback.productName}</span>
                <span>{feedback.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedbackReport; 