import React, { useState, useEffect } from 'react';
import RevenueChart from './RevenueChart';
import { Card, CardContent, Grid, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { FaChartLine, FaMoneyBillWave, FaCreditCard, FaCalendarAlt } from 'react-icons/fa';
import reportsApi from '../../../../api/reportsApi';
import ErrorBoundary from '../../../../components/ErrorBoundary';

const RevenueReport = ({ 
  exportToPDF, 
  exportToExcel, 
  sendReportEmail, 
  exportLoading, 
  setExportLoading,
  formatCurrency 
}) => {
  const [revenueData, setRevenueData] = useState([]);
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  
  // Tính tổng doanh thu từ dữ liệu
  const totalRevenue = revenueData.reduce((sum, item) => sum + (item.doanh_thu || 0), 0);
  
  // Tìm ngày có doanh thu cao nhất
  const bestDay = revenueData.length > 0 
    ? revenueData.reduce((best, current) => 
        (current.doanh_thu > best.doanh_thu) ? current : best, revenueData[0])
    : null;
  
  // Tính doanh thu trung bình
  const averageRevenue = revenueData.length > 0 
    ? totalRevenue / revenueData.length 
    : 0;

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        const data = await reportsApi.getRevenueData(timeRange);
        if (data && Array.isArray(data)) {
          console.log('Revenue data from API:', data);
          setRevenueData(data);
        } else {
          console.log('Using fallback revenue data');
          // Fallback data
          setRevenueData([
            { date: 'T2', doanh_thu: 500000 },
            { date: 'T3', doanh_thu: 700000 },
            { date: 'T4', doanh_thu: 600000 },
            { date: 'T5', doanh_thu: 800000 },
            { date: 'T6', doanh_thu: 900000 },
            { date: 'T7', doanh_thu: 800000 },
            { date: 'CN', doanh_thu: 600000 }
          ]);
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        // Fallback data
        setRevenueData([
          { date: 'T2', doanh_thu: 500000 },
          { date: 'T3', doanh_thu: 700000 },
          { date: 'T4', doanh_thu: 600000 },
          { date: 'T5', doanh_thu: 800000 },
          { date: 'T6', doanh_thu: 900000 },
          { date: 'T7', doanh_thu: 800000 },
          { date: 'CN', doanh_thu: 600000 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [timeRange]);

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
  };

  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  return (
    <div id="revenue-report" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo doanh thu</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF('revenue', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() => exportToExcel({ revenueData }, 'revenue', setExportLoading)}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail('revenue', setExportLoading)}
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

      {/* Bộ lọc và điều khiển */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-blue-500" />
            <span className="text-gray-700">Thời gian:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleTimeRangeChange('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                timeRange === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              7 ngày
            </button>
            <button
              onClick={() => handleTimeRangeChange('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                timeRange === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => handleTimeRangeChange('year')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                timeRange === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Năm
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FaChartLine className="text-green-500" />
            <span className="text-gray-700">Loại biểu đồ:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleChartTypeChange('line')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                chartType === 'line' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Đường
            </button>
            <button
              onClick={() => handleChartTypeChange('bar')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                chartType === 'bar' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Cột
            </button>
          </div>
        </div>
      </div>

      {/* Thẻ thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-blue-50 shadow-md transition-all hover:shadow-lg border-l-4 border-blue-500">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="textSecondary" component="p">
                  Tổng doanh thu
                </Typography>
                <Typography variant="h5" component="h2" className="font-bold">
                  {formatCurrency(totalRevenue)}
                </Typography>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <FaMoneyBillWave className="text-blue-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 shadow-md transition-all hover:shadow-lg border-l-4 border-green-500">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="textSecondary" component="p">
                  Doanh thu trung bình
                </Typography>
                <Typography variant="h5" component="h2" className="font-bold">
                  {formatCurrency(averageRevenue)}
                </Typography>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <FaChartLine className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 shadow-md transition-all hover:shadow-lg border-l-4 border-yellow-500">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="textSecondary" component="p">
                  Ngày tốt nhất
                </Typography>
                <Typography variant="h5" component="h2" className="font-bold">
                  {bestDay ? bestDay.date : 'N/A'}
                </Typography>
                {bestDay && (
                  <Typography variant="body2" color="textSecondary" component="p">
                    {formatCurrency(bestDay.doanh_thu)}
                  </Typography>
                )}
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <FaCalendarAlt className="text-yellow-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ doanh thu */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Biểu đồ doanh thu {timeRange === 'week' ? '7 ngày qua' : timeRange === 'month' ? 'tháng này' : 'năm nay'}</h3>
        <div className="bg-gray-50 p-4 rounded-lg h-96">
          <ErrorBoundary>
            <RevenueChart revenueData={revenueData} chartType={chartType} formatCurrency={formatCurrency} />
          </ErrorBoundary>
        </div>
      </div>

      {/* Bảng dữ liệu chi tiết */}
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Dữ liệu chi tiết</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-100">
                  <TableCell className="font-semibold">Ngày</TableCell>
                  <TableCell align="right" className="font-semibold">Doanh thu</TableCell>
                  <TableCell align="right" className="font-semibold">So với trung bình</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {revenueData.map((item, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <TableCell component="th" scope="row">
                      {item.date}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.doanh_thu)}</TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end">
                        <span 
                          className={`font-medium ${
                            item.doanh_thu > averageRevenue 
                              ? 'text-green-600' 
                              : item.doanh_thu < averageRevenue 
                                ? 'text-red-600' 
                                : 'text-gray-600'
                          }`}
                        >
                          {item.doanh_thu > averageRevenue 
                            ? '+' 
                            : item.doanh_thu < averageRevenue 
                              ? '-' 
                              : ''}
                          {formatCurrency(Math.abs(item.doanh_thu - averageRevenue))}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport; 