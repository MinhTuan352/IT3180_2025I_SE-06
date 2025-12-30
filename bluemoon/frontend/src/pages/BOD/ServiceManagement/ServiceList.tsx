// src/pages/BOD/ServiceManagement/ServiceList.tsx
import {
  Box, Typography, Button, Paper, IconButton, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, MenuItem, Alert, Tab, Tabs, FormHelperText
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';

import axiosClient from '../../../api/axiosClient';
import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useLayout } from '../../../contexts/LayoutContext';

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const PAGE_PADDING = 48;

// Danh sách danh mục dịch vụ
const SERVICE_CATEGORIES = [
  'Tiện ích chung',
  'Sức khỏe & Làm đẹp',
  'Giặt ủi',
  'Sửa chữa',
  'Vệ sinh',
  'Ẩm thực',
  'Khác'
];

interface ServiceType {
  id: number;
  name: string;
  description: string;
  base_price: number;
  unit: string;
  is_active: number; // 1 or 0
  category: string | null;
  location: string | null;
  open_hours: string | null;
  contact_phone: string | null;
}

interface ServiceBooking {
  id: string;
  resident_name: string;
  service_name: string;
  booking_date: string;
  quantity: number;
  total_amount: number;
  status: string;
  note: string;
}

interface FormErrors {
  name?: string;
  base_price?: string;
  location?: string;
  contact_phone?: string;
  open_time?: string;
  close_time?: string;
}

export default function ServiceList() {
  const windowWidth = useWindowWidth();
  const { isSidebarCollapsed } = useLayout();
  const dynamicPaperWidth = windowWidth - (isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN) - PAGE_PADDING;

  // Tab state
  const [tabIndex, setTabIndex] = useState(0);

  const [services, setServices] = useState<ServiceType[]>([]);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [openEdit, setOpenEdit] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Time picker state (thay vì text input)
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('22:00');

  // Fetch Data
  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/services');
      if (response.data && response.data.success) {
        setServices(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axiosClient.get('/services/bookings');
      if (response.data && response.data.success) {
        setBookings(response.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchBookings();
  }, []);

  // --- Validation ---
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!editingService.name || editingService.name.trim() === '') {
      errors.name = 'Tên dịch vụ là bắt buộc';
    }

    if (editingService.base_price < 0) {
      errors.base_price = 'Đơn giá không được là số âm';
    }

    if (!editingService.location || editingService.location.trim() === '') {
      errors.location = 'Vị trí là bắt buộc';
    }

    // Validate phone format (Vietnamese phone)
    if (editingService.contact_phone) {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      const cleanPhone = editingService.contact_phone.replace(/[\s.-]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.contact_phone = 'Số điện thoại không hợp lệ (VD: 0901234567)';
      }
    }

    // Validate open/close time
    if (openTime >= closeTime) {
      errors.open_time = 'Giờ mở cửa phải trước giờ đóng cửa';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Handlers ---
  const handleCreateClick = () => {
    setEditingService({
      name: '', description: '', base_price: 0, unit: 'Lượt', is_active: 1,
      category: 'Tiện ích chung', location: '', open_hours: '', contact_phone: ''
    });
    setOpenTime('08:00');
    setCloseTime('22:00');
    setFormErrors({});
    setIsNew(true);
    setOpenEdit(true);
  };

  const handleEditClick = (service: ServiceType) => {
    setEditingService({ ...service });
    // Parse open_hours back to time inputs
    if (service.open_hours) {
      const [open, close] = service.open_hours.split(' - ');
      setOpenTime(open || '08:00');
      setCloseTime(close || '22:00');
    } else {
      setOpenTime('08:00');
      setCloseTime('22:00');
    }
    setFormErrors({});
    setIsNew(false);
    setOpenEdit(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc muốn xóa dịch vụ này?")) {
      try {
        await axiosClient.delete(`/services/${id}`);
        toast.success("Đã xóa dịch vụ!");
        fetchServices();
      } catch (err: any) {
        toast.error("Lỗi khi xóa: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSave = async () => {
    // Combine open/close time
    editingService.open_hours = `${openTime} - ${closeTime}`;

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin nhập');
      return;
    }

    try {
      if (isNew) {
        await axiosClient.post('/services', editingService);
        toast.success("Thêm dịch vụ thành công!");
      } else {
        await axiosClient.put(`/services/${editingService.id}`, editingService);
        toast.success("Cập nhật dịch vụ thành công!");
      }
      setOpenEdit(false);
      fetchServices();
    } catch (err: any) {
      console.error(err);
      toast.error("Lỗi khi lưu: " + (err.response?.data?.message || err.message));
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    // Xử lý riêng cho base_price để đảm bảo là số
    if (name === 'base_price') {
      const numValue = Math.max(0, Number(value)); // Không cho phép số âm
      setEditingService({ ...editingService, [name]: numValue });
    } else {
      setEditingService({ ...editingService, [name]: value });
    }
  };

  // --- Booking Status Handlers ---
  const handleApproveBooking = async (id: string) => {
    try {
      await axiosClient.put(`/services/bookings/${id}`, { status: 'Đã duyệt' });
      toast.success('Đã duyệt đơn đặt dịch vụ!');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi duyệt đơn');
    }
  };

  const handleRejectBooking = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn từ chối đơn này?')) {
      try {
        await axiosClient.put(`/services/bookings/${id}`, { status: 'Đã hủy' });
        toast.success('Đã từ chối đơn đặt dịch vụ!');
        fetchBookings();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Lỗi khi từ chối đơn');
      }
    }
  };

  // --- Columns ---
  const serviceColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Tên Dịch vụ', flex: 1, minWidth: 180 },
    { field: 'category', headerName: 'Danh mục', width: 150 },
    {
      field: 'base_price', headerName: 'Đơn giá (VNĐ)', width: 130,
      valueFormatter: (value) => new Intl.NumberFormat('vi-VN').format(value as number)
    },
    { field: 'unit', headerName: 'Đơn vị', width: 80 },
    { field: 'location', headerName: 'Vị trí', width: 150 },
    { field: 'open_hours', headerName: 'Giờ mở cửa', width: 120 },
    { field: 'contact_phone', headerName: 'Hotline', width: 120 },
    {
      field: 'is_active', headerName: 'Trạng thái', width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Đang hoạt động' : 'Tạm dừng'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'actions', headerName: 'Thao tác', width: 120,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Chỉnh sửa thông tin">
            <IconButton onClick={() => handleEditClick(params.row)} color="primary" size="small">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa dịch vụ">
            <IconButton onClick={() => handleDelete(params.row.id)} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const bookingColumns: GridColDef[] = [
    { field: 'id', headerName: 'Mã đơn', width: 130 },
    { field: 'resident_name', headerName: 'Cư dân', flex: 1, minWidth: 150 },
    { field: 'service_name', headerName: 'Dịch vụ', width: 180 },
    {
      field: 'booking_date', headerName: 'Ngày đặt', width: 120,
      valueFormatter: (value) => value ? new Date(value as string).toLocaleDateString('vi-VN') : '---'
    },
    { field: 'quantity', headerName: 'Số lượng', width: 90 },
    {
      field: 'total_amount', headerName: 'Thành tiền', width: 120,
      valueFormatter: (value) => new Intl.NumberFormat('vi-VN').format(value as number) + ' đ'
    },
    {
      field: 'status', headerName: 'Trạng thái', width: 130,
      renderCell: (params) => {
        let color: 'warning' | 'success' | 'error' | 'default' = 'default';
        if (params.value === 'Chờ duyệt') color = 'warning';
        if (params.value === 'Đã duyệt') color = 'success';
        if (params.value === 'Đã hủy') color = 'error';
        if (params.value === 'Hoàn thành') color = 'success';
        return <Chip label={params.value} color={color} size="small" />;
      }
    },
    {
      field: 'actions', headerName: 'Phê duyệt', width: 120,
      renderCell: (params) => {
        if (params.row.status !== 'Chờ duyệt') return null;
        return (
          <Box>
            <Tooltip title="Duyệt đơn">
              <IconButton color="success" size="small" onClick={() => handleApproveBooking(params.row.id)}>
                <CheckCircleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Từ chối">
              <IconButton color="error" size="small" onClick={() => handleRejectBooking(params.row.id)}>
                <CancelIcon />
              </IconButton>
            </Tooltip>
          </Box>
        );
      }
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <StorefrontIcon sx={{ mr: 1, fontSize: 30, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">QUẢN LÝ DỊCH VỤ - TIỆN ÍCH</Typography>
        </Box>
        {tabIndex === 0 && (
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleCreateClick}>
            Thêm mới
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 2 }}>
        <Tab icon={<StorefrontIcon />} label="Danh sách Dịch vụ" iconPosition="start" />
        <Tab icon={<HistoryIcon />} label="Lịch sử Đặt dịch vụ" iconPosition="start" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ height: 600, width: dynamicPaperWidth, borderRadius: 3, overflow: 'auto' }}>
        {tabIndex === 0 ? (
          <DataGrid
            loading={loading}
            rows={services}
            columns={serviceColumns}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10]}
            disableRowSelectionOnClick
            sx={{ border: 0 }}
          />
        ) : (
          <DataGrid
            rows={bookings}
            columns={bookingColumns}
            getRowId={(row) => row.id}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10]}
            disableRowSelectionOnClick
            sx={{ border: 0 }}
          />
        )}
      </Paper>

      {/* Modal Chỉnh Sửa / Thêm Mới */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isNew ? 'Thêm Dịch vụ mới' : 'Cập nhật Dịch vụ'}</DialogTitle>
        <DialogContent dividers>
          {editingService && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Tên dịch vụ *"
                  name="name"
                  fullWidth
                  value={editingService.name || ''}
                  onChange={handleChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Danh mục"
                  name="category"
                  fullWidth
                  value={editingService.category || 'Tiện ích chung'}
                  onChange={handleChange}
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="number"
                  label="Đơn giá cơ bản (VNĐ) *"
                  name="base_price"
                  fullWidth
                  value={editingService.base_price || 0}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                  error={!!formErrors.base_price}
                  helperText={formErrors.base_price}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Đơn vị tính"
                  name="unit"
                  fullWidth
                  value={editingService.unit || ''}
                  onChange={handleChange}
                  placeholder="VD: Giờ, Lần, Tháng"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Vị trí *"
                  name="location"
                  fullWidth
                  value={editingService.location || ''}
                  onChange={handleChange}
                  placeholder="VD: Tầng 3 - Tòa A"
                  error={!!formErrors.location}
                  helperText={formErrors.location}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Hotline liên hệ"
                  name="contact_phone"
                  fullWidth
                  value={editingService.contact_phone || ''}
                  onChange={handleChange}
                  placeholder="VD: 0901234567"
                  error={!!formErrors.contact_phone}
                  helperText={formErrors.contact_phone}
                />
              </Grid>

              {/* Time Pickers thay vì text input */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Giờ mở cửa *"
                  type="time"
                  fullWidth
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.open_time}
                />
                {formErrors.open_time && <FormHelperText error>{formErrors.open_time}</FormHelperText>}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Giờ đóng cửa *"
                  type="time"
                  fullWidth
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Trạng thái" name="is_active" fullWidth value={editingService.is_active ?? 1} onChange={handleChange}>
                  <MenuItem value={1}>Đang hoạt động</MenuItem>
                  <MenuItem value={0}>Tạm dừng</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField label="Mô tả chi tiết" name="description" fullWidth multiline rows={3} value={editingService.description || ''} onChange={handleChange} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Hủy</Button>
          <Button onClick={handleSave} variant="contained">{isNew ? 'Thêm mới' : 'Lưu Cập Nhật'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
