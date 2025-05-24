import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Typography, Card, Space, Row, Col, Divider, Rate, Progress, Table, Avatar, Tag, Skeleton, Empty, Alert } from 'antd';
import { UserOutlined, StarFilled, LikeOutlined, DislikeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import reportsApi from '../../../../api/reportsApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDate, formatCurrency } from '../../../../utils/helpers';

const { Title, Text } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FD0'];
const RATING_COLORS = ['#FF4D4F', '#FFA940', '#FADB14', '#73D13D', '#40A9FF'];

const FeedbackReport = () => {
  const [feedbackData, setFeedbackData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await reportsApi.getFeedbackData();
        setFeedbackData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching feedback data:', err);
        setError('Không thể tải dữ liệu phản hồi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Dữ liệu mẫu cho trường hợp API chưa trả về đúng cấu trúc
  const sampleData = {
    totalReviews: feedbackData.totalReviews || 0,
    averageRating: feedbackData.averageRating ? parseFloat(feedbackData.averageRating.toFixed(1)) : 0,
    ratingDistribution: feedbackData.ratingDistribution || [
      { rating: 5, count: 0 },
      { rating: 4, count: 0 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 }
    ],
    recentReviews: feedbackData.recentReviews || [],
    topReviewedProducts: feedbackData.topReviewedProducts || [],
    reviewsOverTime: feedbackData.reviewsOverTime || []
  };

  const { totalReviews, averageRating, ratingDistribution, recentReviews, topReviewedProducts, reviewsOverTime } = sampleData;

  // Format data for rating distribution chart
  const chartData = ratingDistribution.map(item => ({
    name: `${item.rating} sao`,
    count: item.count,
    percentage: totalReviews > 0 ? Math.round((item.count / totalReviews) * 100) : 0
  }));

  // Format data for reviews over time chart
  const timeChartData = reviewsOverTime?.map(item => ({
    date: formatDate(item.date, { dateOnly: true }),
    'Số lượng': item.count,
    'Đánh giá TB': item.avgRating || 0
  })) || [];

  // Configure columns for recent reviews table
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

  // Custom tooltip for rating distribution chart
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
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
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
            dataSource={recentReviews.map(item => ({ ...item, key: item.id }))}
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
  loading: PropTypes.bool,
  setLoading: PropTypes.func.isRequired
};

FeedbackReport.defaultProps = {
  loading: false
};

export default FeedbackReport; 