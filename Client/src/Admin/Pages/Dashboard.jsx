import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  ShoppingCart,
  Users,
  Box,
  TrendingUp,
} from "lucide-react";

// Dữ liệu mẫu
const revenueData = [
  { month: "Tháng 1", doanh_thu: 4000, chi_phi: 2400 },
  { month: "Tháng 2", doanh_thu: 3000, chi_phi: 1398 },
  { month: "Tháng 3", doanh_thu: 2000, chi_phi: 9800 },
  { month: "Tháng 4", doanh_thu: 2780, chi_phi: 3908 },
  { month: "Tháng 5", doanh_thu: 1890, chi_phi: 4800 },
  { month: "Tháng 6", doanh_thu: 2390, chi_phi: 3800 },
];

const productCategoryData = [
  { name: "Rau Sạch", value: 400 },
  { name: "Thịt Hữu Cơ", value: 300 },
  { name: "Trái Cây", value: 200 },
  { name: "Gạo Sạch", value: 150 },
  { name: "Khác", value: 50 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const Dashboard = () => {
  const renderContent = () => {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Tổng Quan</h2>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg flex items-center">
            <TrendingUp className="mr-3" />
            <div>
              <p className="text-sm">Doanh Thu</p>
              <h3 className="text-xl font-bold">500.000.000 đ</h3>
            </div>
          </div>
          <div className="bg-green-100 p-4 rounded-lg flex items-center">
            <ShoppingCart className="mr-3" />
            <div>
              <p className="text-sm">Đơn Hàng</p>
              <h3 className="text-xl font-bold">1,234</h3>
            </div>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg flex items-center">
            <Box className="mr-3" />
            <div>
              <p className="text-sm">Sản Phẩm</p>
              <h3 className="text-xl font-bold">456</h3>
            </div>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg flex items-center">
            <Users className="mr-3" />
            <div>
              <p className="text-sm">Khách Hàng</p>
              <h3 className="text-xl font-bold">789</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Doanh Thu Theo Tháng</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="doanh_thu" fill="#8884d8" name="Doanh Thu" />
                <Bar dataKey="chi_phi" fill="#82ca9d" name="Chi Phí" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Nhóm Sản Phẩm</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productCategoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex items-center p-3 mb-2 cursor-pointer `}
    >
      <div className="flex-1 bg-gray-100 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
