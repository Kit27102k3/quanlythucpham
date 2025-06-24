/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Typography, Card, Space, Row, Col, Divider, Rate, Progress, Table, Avatar, Tag, Skeleton, Empty, Alert } from 'antd';
import { UserOutlined, StarFilled, LikeOutlined, DislikeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import {reportsApi} from '../../../../api/reportsApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDate, formatCurrency } from '../../../../utils/helpers';

const { Title, Text } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FD0'];
const RATING_COLORS = ['#FF4D4F', '#FFA940', '#FADB14', '#73D13D', '#40A9FF'];

const FeedbackReport = ({ 
  feedbackData: propsFeedbackData,
  exportToPDF,
  exportToExcel,
  sendReportEmail,
  exportLoading,
  setExportLoading 
}) => {
  const [feedbackData, setFeedbackData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If feedbackData is provided as props, use it
    if (propsFeedbackData) {
      console.log("Using feedback data from props:", propsFeedbackData);
      setFeedbackData(propsFeedbackData);
      return;
    }

    // Otherwise fetch it
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await reportsApi.getFeedbackData();
        console.log("Fetched feedback data:", data);
        setFeedbackData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching feedback data:", err);
        setError('Không thể tải dữ liệu phản hồi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propsFeedbackData]);

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  if (loading) {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Skeleton active />
        <Skeleton active />
        <Skeleton active />
      </Space>
    );
  }

  if (!feedbackData) {
    return <Empty description="Không có dữ liệu phản hồi" />;
  }

  // Create a sample data structure if the actual data is missing properties
  const processedData = {
    totalReviews: feedbackData.totalReviews || 0,
    averageRating: feedbackData.averageRating ? parseFloat(feedbackData.averageRating.toFixed(1)) : 0,
    ratingDistribution: feedbackData.ratingDistribution || [
      { rating: 5, count: feedbackData.rating5Count || 0 },
      { rating: 4, count: feedbackData.rating4Count || 0 },
      { rating: 3, count: feedbackData.rating3Count || 0 },
      { rating: 2, count: feedbackData.rating2Count || 0 },
      { rating: 1, count: feedbackData.rating1Count || 0 }
    ],
    recentReviews: feedbackData.recentReviews || [],
    topReviewedProducts: feedbackData.topReviewedProducts || [],
    reviewsOverTime: feedbackData.reviewsOverTime || []
  };

  // If we have recentFeedback field instead of recentReviews, map it
  if (!processedData.recentReviews.length && feedbackData.recentFeedback && Array.isArray(feedbackData.recentFeedback)) {
    console.log("Processing recentFeedback data:", feedbackData.recentFeedback);
    processedData.recentReviews = feedbackData.recentFeedback.map(feedback => ({
      id: feedback.id || feedback._id,
      user: feedback.customer || feedback.userName || feedback.user?.name || 'Khách hàng',
      product: feedback.product || feedback.productName || 'Sản phẩm',
      rating: feedback.rating,
      comment: feedback.comment || feedback.content || '',
      date: feedback.createdAt || feedback.date || new Date(),
      isPublished: feedback.isPublished !== undefined ? feedback.isPublished : true,
      userImage: feedback.userImage || feedback.avatar,
      productImage: feedback.productImage || feedback.image
    }));
    
    // Sort by date (newest first)
    processedData.recentReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // If we have ratings but no distribution, create it
  if (!feedbackData.ratingDistribution && feedbackData.ratings && Array.isArray(feedbackData.ratings)) {
    const distribution = [
      { rating: 5, count: 0 },
      { rating: 4, count: 0 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 }
    ];
    
    feedbackData.ratings.forEach(rating => {
      const ratingValue = Math.round(rating.rating);
      if (ratingValue >= 1 && ratingValue <= 5) {
        distribution[5 - ratingValue].count++;
      }
    });
    
    processedData.ratingDistribution = distribution;
    processedData.recentReviews = feedbackData.ratings.slice(0, 10).map(rating => ({
      id: rating._id || rating.id || `review-${Math.random()}`,
      user: rating.userName || rating.user?.name || 'Khách hàng',
      product: rating.productName || rating.product?.name || 'Sản phẩm',
      rating: rating.rating,
      comment: rating.comment || rating.content || '',
      date: rating.createdAt || rating.date || new Date(),
      isPublished: rating.isPublished !== undefined ? rating.isPublished : true
    }));
  }

  const { totalReviews, averageRating, ratingDistribution, recentReviews, topReviewedProducts, reviewsOverTime } = processedData;

  const chartData = ratingDistribution.map(item => ({
    name: `${item.rating} sao`,
    count: item.count,
    percentage: totalReviews > 0 ? Math.round((item.count / totalReviews) * 100) : 0
  }));

  const timeChartData = reviewsOverTime?.map(item => ({
    date: formatDate(item.date, { dateOnly: true }),
    'Số lượng': item.count,
    'Đánh giá TB': item.avgRating || 0
  })) || [];

  const recentReviewColumns = [
    {
      title: 'Khách hàng',
      dataIndex: 'user',
      key: 'user',
      render: (text, record) => (
        <Space>
          <Avatar src={record.userImage} icon={<UserOutlined />} />
          <Text>{text}</Text>
          {record.isVerified && <CheckCircleOutlined style={{ color: '#52c41a' }} title="Đã xác thực" />}
        </Space>
      ),
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'product',
      key: 'product',
      render: (text, record) => (
        <Space>
          {record.productImage && (
            <Avatar shape="square" src={record.productImage} />
          )}
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      render: rating => <Rate disabled defaultValue={rating} />,
    },
    {
      title: 'Nội dung',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'date',
      key: 'date',
      render: date => formatDate(date, { dateOnly: true }),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isPublished ? 'green' : 'red'}>
          {record.isPublished ? 'Công khai' : 'Ẩn'}
        </Tag>
      ),
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card size="small" style={{ padding: '10px' }}>
          <p><strong>{data.name}</strong></p>
          <p>Số lượng: {data.count}</p>
          <p>Phần trăm: {data.percentage}%</p>
        </Card>
      );
    }
    return null;
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo phản hồi khách hàng</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF('feedback', setExportLoading)}
            disabled={exportLoading || !feedbackData}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất PDF
          </button>
          <button
            onClick={() => exportToExcel(recentReviews || [], 'feedback', setExportLoading)}
            disabled={exportLoading || !feedbackData}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Xuất Excel
          </button>
          <button
            onClick={() => sendReportEmail('feedback', setExportLoading)}
            disabled={exportLoading || !feedbackData}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50"
          >
            {exportLoading ? (
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
            ) : null}
            Gửi Email
          </button>
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3}>Tổng đánh giá</Title>
              <Title>{totalReviews}</Title>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3}>Đánh giá trung bình</Title>
              <Space>
                <Title>{averageRating.toFixed(1)}</Title>
                <Rate disabled defaultValue={averageRating} allowHalf />
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3}>Tỷ lệ đánh giá tích cực</Title>
              <Title>
                {ratingDistribution
                  ? Math.round(
                      ((ratingDistribution.find(item => item.rating === 4)?.count || 0) +
                        (ratingDistribution.find(item => item.rating === 5)?.count || 0)) /
                        (totalReviews || 1) *
                        100
                    )
                  : 0}%
              </Title>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">Phân bố đánh giá</Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="Phân bố theo số sao">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Số lượng">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RATING_COLORS[4 - index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Chi tiết đánh giá">
            <Space direction="vertical" style={{ width: '100%' }}>
              {ratingDistribution.map((item, index) => (
                <div key={index}>
                  <Space align="center" style={{ marginBottom: 8 }}>
                    <Text>{item.rating} sao</Text>
                    <Progress
                      percent={totalReviews > 0 ? Math.round((item.count / totalReviews) * 100) : 0}
                      strokeColor={RATING_COLORS[item.rating - 1]}
                    />
                    <Text>{item.count}</Text>
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {reviewsOverTime && reviewsOverTime.length > 0 && (
        <>
          <Divider orientation="left">Đánh giá theo thời gian</Divider>
          <Card title="Xu hướng đánh giá">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={timeChartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="Số lượng" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="Đánh giá TB" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {topReviewedProducts && topReviewedProducts.length > 0 && (
        <>
          <Divider orientation="left">Top sản phẩm được đánh giá</Divider>
          <Card>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topReviewedProducts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="reviewCount"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {topReviewedProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${value} đánh giá`, props.payload.name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Sản phẩm</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Đánh giá</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Số lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topReviewedProducts.map((product, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {product.image ? (
                              <Avatar shape="square" src={product.image} size="small" />
                            ) : (
                              <div style={{ width: 24, height: 24, background: '#f0f0f0', borderRadius: 2 }} />
                            )}
                            <Text ellipsis style={{ maxWidth: 200 }}>{product.name}</Text>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <Rate disabled defaultValue={product.avgRating} allowHalf style={{ fontSize: 14 }} />
                            <Text style={{ marginLeft: 8 }}>{product.avgRating}</Text>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>{product.reviewCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Col>
            </Row>
          </Card>
        </>
      )}

      <Divider orientation="left">Đánh giá gần đây</Divider>
      <Card>
        {recentReviews && recentReviews.length > 0 ? (
          <Table
            columns={recentReviewColumns}
            dataSource={recentReviews
              .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date (newest first)
              .map(item => ({ ...item, key: item.id || item._id || `review-${Math.random()}` }))}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 'max-content' }}
          />
        ) : (
          <Empty description="Chưa có đánh giá nào" />
        )}
      </Card>
    </Space>
  );
};

FeedbackReport.propTypes = {
  feedbackData: PropTypes.object,
  exportToPDF: PropTypes.func.isRequired,
  exportToExcel: PropTypes.func.isRequired,
  sendReportEmail: PropTypes.func.isRequired,
  exportLoading: PropTypes.bool,
  setExportLoading: PropTypes.func.isRequired
};

export default FeedbackReport; 