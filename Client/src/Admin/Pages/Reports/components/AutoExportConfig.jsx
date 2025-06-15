import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  PlayArrow as RunNowIcon
} from '@mui/icons-material';
import { toast } from 'sonner';
import { 
  loadAutoExportConfigs, 
  addAutoExportConfig, 
  updateAutoExportConfig, 
  deleteAutoExportConfig,
  exportNow,
  initAutoExport
} from '../utils/autoExport';

// Initialize auto export system
initAutoExport();

const AutoExportConfig = ({ reportId, setExportLoading }) => {
  const [configs, setConfigs] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    reportId: reportId,
    format: 'pdf',
    frequency: 'daily',
    time: '00:00',
    email: '',
    active: true
  });

  // Load existing configurations
  useEffect(() => {
    const loadedConfigs = loadAutoExportConfigs();
    // Filter configs for this report
    setConfigs(loadedConfigs.filter(config => config.reportId === reportId));
  }, [reportId]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingConfig(null);
    setFormData({
      reportId: reportId,
      format: 'pdf',
      frequency: 'daily',
      time: '00:00',
      email: '',
      active: true
    });
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'active' ? checked : value
    }));
  };

  const handleSubmit = () => {
    try {
      let updatedConfigs;
      
      if (editingConfig) {
        updatedConfigs = updateAutoExportConfig(editingConfig.id, formData);
        toast.success('Cấu hình xuất tự động đã được cập nhật!');
      } else {
        updatedConfigs = addAutoExportConfig(formData);
        toast.success('Đã thêm cấu hình xuất tự động mới!');
      }
      
      // Update local state with filtered configs for this report
      setConfigs(updatedConfigs.filter(config => config.reportId === reportId));
      handleClose();
    } catch (error) {
      console.error('Error saving auto export config:', error);
      toast.error('Không thể lưu cấu hình xuất tự động.');
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      reportId: config.reportId,
      format: config.format || 'pdf',
      frequency: config.frequency || 'daily',
      time: config.time || '00:00',
      email: config.email || '',
      active: config.active !== false
    });
    setOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cấu hình xuất tự động này?')) {
      const updatedConfigs = deleteAutoExportConfig(id);
      setConfigs(updatedConfigs.filter(config => config.reportId === reportId));
      toast.success('Đã xóa cấu hình xuất tự động!');
    }
  };

  const handleRunNow = async (config) => {
    try {
      await exportNow(config.reportId, config.format, setExportLoading);
    } catch (error) {
      console.error('Error running export:', error);
    }
  };

  const formatFrequency = (frequency) => {
    switch (frequency) {
      case 'daily':
        return 'Hàng ngày';
      case 'weekly':
        return 'Hàng tuần';
      case 'monthly':
        return 'Hàng tháng';
      default:
        return frequency;
    }
  };

  const formatLastExport = (timestamp) => {
    if (!timestamp) return 'Chưa xuất';
    
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Cấu hình xuất tự động</h3>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={handleOpen}
          size="small"
        >
          Thêm cấu hình
        </Button>
      </div>

      {configs.length > 0 ? (
        <TableContainer component={Paper} className="shadow-sm">
          <Table size="small">
            <TableHead style={{ backgroundColor: "#f9fafb" }}>
              <TableRow>
                <TableCell>Định dạng</TableCell>
                <TableCell>Tần suất</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Xuất lần cuối</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>{config.format === 'pdf' ? 'PDF' : 'Excel'}</TableCell>
                  <TableCell>{formatFrequency(config.frequency)}</TableCell>
                  <TableCell>{config.time || 'Mặc định'}</TableCell>
                  <TableCell>{config.email || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${config.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {config.active ? 'Đang hoạt động' : 'Tạm dừng'}
                    </span>
                  </TableCell>
                  <TableCell>{formatLastExport(config.lastExport)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Tooltip title="Xuất ngay">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleRunNow(config)}
                        >
                          <RunNowIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEdit(config)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDelete(config.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Chưa có cấu hình xuất tự động nào</p>
        </div>
      )}

      {/* Add/Edit Configuration Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingConfig ? 'Chỉnh sửa cấu hình xuất tự động' : 'Thêm cấu hình xuất tự động'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <FormControl fullWidth margin="dense">
              <InputLabel>Định dạng</InputLabel>
              <Select
                name="format"
                value={formData.format}
                onChange={handleChange}
                label="Định dạng"
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="dense">
              <InputLabel>Tần suất</InputLabel>
              <Select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                label="Tần suất"
              >
                <MenuItem value="daily">Hàng ngày</MenuItem>
                <MenuItem value="weekly">Hàng tuần</MenuItem>
                <MenuItem value="monthly">Hàng tháng</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              margin="dense"
              label="Thời gian (HH:MM)"
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
            
            <TextField
              fullWidth
              margin="dense"
              label="Email (tùy chọn)"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Để trống nếu chỉ xuất file"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={handleChange}
                  name="active"
                  color="primary"
                />
              }
              label="Kích hoạt"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editingConfig ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

AutoExportConfig.propTypes = {
  reportId: PropTypes.string.isRequired,
  setExportLoading: PropTypes.func.isRequired
};

export default AutoExportConfig; 