/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { reportsApi } from '../../../../api/reportsApi';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { Analytics } from '@mui/icons-material';

const AnalysisReport = ({ userRole, branchId }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(branchId || 'all');
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Lấy danh sách chi nhánh khi component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const branchesData = await reportsApi.getBranches();
      setBranches(branchesData || []);
      
      // Kiểm tra nếu selectedBranch không tồn tại trong danh sách chi nhánh
      if (branchesData && branchesData.length > 0) {
        const branchExists = branchesData.some(branch => (branch.id || branch._id) === selectedBranch);
        if (!branchExists && selectedBranch !== 'all') {
          setSelectedBranch(userRole === 'admin' ? 'all' : branchesData[0].id || branchesData[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Không thể lấy danh sách chi nhánh');
    } finally {
      setLoadingBranches(false);
    }
  };

  // Xử lý khi thay đổi chi nhánh
  const handleBranchChange = (event) => {
    const value = event.target.value || (userRole === 'admin' ? 'all' : '');
    setSelectedBranch(value);
  };

  // Xử lý phân tích dữ liệu
  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Gọi API để lấy dữ liệu phân tích
      const response = await reportsApi.getAIAnalysisData({
        userRole: userRole,
        startDate: startDate,
        endDate: endDate,
        branchId: selectedBranch
      });
      
      console.log("API response:", response);
      
      // Kiểm tra cấu trúc dữ liệu trả về
      if (response) {
        // Kiểm tra các cấu trúc dữ liệu có thể có
        if (response.data && response.data.analysis) {
          // Nếu phân tích nằm trong response.data
          setAnalysisData(response.data);
        } else if (response.analysis) {
          // Nếu phân tích nằm trực tiếp trong response
          setAnalysisData(response);
        } else if (response.data && response.data.data && response.data.data.analysis) {
          // Nếu phân tích nằm trong response.data.data
          setAnalysisData(response.data.data);
        } else {
          // Nếu không tìm thấy phân tích, hiển thị dữ liệu thô
          console.log("Không tìm thấy phân tích AI trong dữ liệu trả về:", response);
          setAnalysisData(response.data || response);
          setError('Không tìm thấy phân tích AI trong dữ liệu trả về.');
        }
      } else {
        // Nếu không có dữ liệu trả về
        setError('Không thể lấy dữ liệu phân tích. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Lỗi khi phân tích dữ liệu:', err);
      setError('Đã xảy ra lỗi khi phân tích dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị trạng thái loading
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Đang phân tích dữ liệu...</Typography>
      </Box>
    );
  }

  // Kiểm tra nếu có phân tích từ AI
  if (analysisData && analysisData.analysis) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">Kết quả phân tích AI</Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => setAnalysisData(null)}
              >
                Phân tích mới
              </Button>
            </Box>
            
            {error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Hiển thị nội dung phân tích AI */}
            <Box sx={{ 
              whiteSpace: 'pre-line', 
              '& p': { mb: 1.5 },
              '& h1, & h2, & h3': { mt: 3, mb: 1.5 }
            }}>
              {analysisData.analysis.split('\n').map((line, index) => {
                // Xử lý tiêu đề
                if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
                  return <Typography key={index} variant="h6" sx={{ mt: 3, fontWeight: 'bold' }}>{line}</Typography>;
                }
                // Xử lý tiêu đề phụ
                else if (line.startsWith('-') || line.startsWith('•')) {
                  return <Typography key={index} variant="subtitle1" sx={{ ml: 2, fontWeight: 'medium' }}>{line}</Typography>;
                }
                // Xử lý đoạn văn thông thường
                else if (line.trim()) {
                  return <Typography key={index} variant="body1" paragraph>{line}</Typography>;
                }
                // Xử lý dòng trống
                return <Box key={index} sx={{ height: '0.5rem' }} />;
              })}
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  } 
  // Hiển thị dữ liệu thống kê nếu không có phân tích AI
  else if (analysisData) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">Dữ liệu phân tích</Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => setAnalysisData(null)}
              >
                Phân tích mới
              </Button>
            </Box>
            
            {error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Không tìm thấy phân tích AI. Hiển thị dữ liệu thô.
            </Alert>
            
            <Box sx={{ mt: 2 }}>
              <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
                {JSON.stringify(analysisData, null, 2)}
              </pre>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Hiển thị màn hình bắt đầu phân tích
  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Phân tích AI
          </Typography>
          <Typography variant="body1" paragraph>
            Sử dụng trí tuệ nhân tạo để phân tích dữ liệu kinh doanh và đưa ra các đề xuất cải thiện.
          </Typography>
          
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={loadingBranches}>
                <InputLabel>Chi nhánh</InputLabel>
                <Select
                  value={selectedBranch || (userRole === 'admin' ? 'all' : '')}
                  onChange={handleBranchChange}
                  label="Chi nhánh"
                >
                  {userRole === 'admin' && (
                    <MenuItem value="all">Tất cả chi nhánh</MenuItem>
                  )}
                  {branches.map((branch) => (
                    <MenuItem key={branch.id || branch._id} value={branch.id || branch._id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Vai trò người dùng</InputLabel>
                <Select
                  value={userRole}
                  label="Vai trò người dùng"
                  disabled
                >
                  <MenuItem value="admin">Quản trị viên</MenuItem>
                  <MenuItem value="manager">Quản lý</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Từ ngày"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Đến ngày"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAnalyze}
                disabled={loadingBranches || !selectedBranch}
                fullWidth
                startIcon={<Analytics />}
              >
                {loadingBranches ? 'Đang tải...' : 'Phân tích dữ liệu'}
              </Button>
            </Grid>
          </Grid>
          
          <Alert severity="info">
            Nhấn nút &quot;Phân tích dữ liệu&quot; để bắt đầu phân tích AI dựa trên dữ liệu kinh doanh thực tế.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalysisReport; 