// src/pages/BOD/ServiceManagement/ServiceList.tsx
import {
  Box, Typography, Button, Paper, IconButton, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, MenuItem, Alert
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import axiosClient from '../../../api/axiosClient';
import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useLayout } from '../../../contexts/LayoutContext';

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const PAGE_PADDING = 48;

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

export default function ServiceList() {
  const windowWidth = useWindowWidth();
  const { isSidebarCollapsed } = useLayout();
  const dynamicPaperWidth = windowWidth - (isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN) - PAGE_PADDING;

  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [openEdit, setOpenEdit] = useState(false);
  const [editingService, setEditingService] = useState<any>(null); // Dùng any cho form state cho tiện
  const [isNew, setIsNew] = useState(false); // Check xem là Add mới hay Edit

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

  useEffect(() => {
    fetchServices();
  }, []);

  // --- Handlers ---

  const handleCreateClick = () => {
    setEditingService({
      name: '', description: '', base_price: 0, unit: 'Lượt', is_active: 1,
      category: '', location: '', open_hours: '', contact_phone: ''
    });
    setIsNew(true);
    setOpenEdit(true);
  }

  const handleEditClick = (service: ServiceType) => {
    setEditingService({ ...service });
    setIsNew(false);
    setOpenEdit(true);
  };

  const handleSave = async () => {
    try {
      if (isNew) {
        await axiosClient.post('/services', editingService);
        alert("Thêm dịch vụ thành công!");
      } else {
        await axiosClient.put(`/services/${editingService.id}`, editingService);
        alert("Cập nhật dịch vụ thành công!");
      }
      setOpenEdit(false);
      fetchServices(); // Reload data
    } catch (err: any) {
      console.error(err);
      alert("Lỗi khi lưu: " + (err.response?.data?.message || err.message));
    }
  };

  const handleChange = (e: any) => {
    setEditingService({ ...editingService, [e.target.name]: e.target.value });
  };

  // --- Columns ---
  const columns: GridColDef[] = [
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
      field: 'actions', headerName: 'Thao tác', width: 100,
      renderCell: (params) => (
        <Tooltip title="Chỉnh sửa thông tin">
          <IconButton onClick={() => handleEditClick(params.row)} color="primary">
            <EditIcon />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <StorefrontIcon sx={{ mr: 1, fontSize: 30, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">QUẢN LÝ DỊCH VỤ - TIỆN ÍCH</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleCreateClick}>
          Thêm mới
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ height: 600, width: dynamicPaperWidth, borderRadius: 3, overflow: 'auto' }}>
        <DataGrid
          loading={loading}
          rows={services}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10]}
          disableRowSelectionOnClick
          sx={{ border: 0 }}
        />
      </Paper>

      {/* Modal Chỉnh Sửa / Thêm Mới */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isNew ? 'Thêm Dịch vụ mới' : 'Cập nhật Dịch vụ'}</DialogTitle>
        <DialogContent dividers>
          {editingService && (
            <Grid container spacing={2}>
              <Grid sx={{ xs: 12, sm: 6 }}>
                <TextField label="Tên dịch vụ" name="name" fullWidth value={editingService.name || ''} onChange={handleChange} />
              </Grid>
              <Grid sx={{ xs: 12, sm: 6 }}>
                <TextField label="Danh mục" name="category" fullWidth value={editingService.category || ''} onChange={handleChange} placeholder="VD: Sức khỏe & Làm đẹp" />
              </Grid>

              <Grid sx={{ xs: 12, sm: 6 }}>
                <TextField type="number" label="Đơn giá cơ bản (VNĐ)" name="base_price" fullWidth value={editingService.base_price || 0} onChange={handleChange} />
              </Grid>
              <Grid sx={{ xs: 12, sm: 6 }}>
                <TextField label="Đơn vị tính" name="unit" fullWidth value={editingService.unit || ''} onChange={handleChange} placeholder="VD: Giờ, Lần, Tháng" />
              </Grid>

              <Grid sx={{ xs: 12, sm: 6 }}>
                <TextField label="Vị trí" name="location" fullWidth value={editingService.location || ''} onChange={handleChange} placeholder="VD: Tầng 3 - Tòa A" />
              </Grid>
              <Grid sx={{ xs: 12, sm: 6 }}>
                <TextField label="Giờ mở cửa" name="open_hours" fullWidth value={editingService.open_hours || ''} onChange={handleChange} placeholder="VD: 08:00 - 22:00" />
              </Grid>

              <Grid sx={{ xs: 12, sm: 6 }}>
                <TextField label="Hotline liên hệ" name="contact_phone" fullWidth value={editingService.contact_phone || ''} onChange={handleChange} placeholder="VD: 0901.234.567" />
              </Grid>
              <Grid sx={{ xs: 12, sm: 6 }}>
                <TextField select label="Trạng thái" name="is_active" fullWidth value={editingService.is_active ?? 1} onChange={handleChange}>
                  <MenuItem value={1}>Đang hoạt động</MenuItem>
                  <MenuItem value={0}>Tạm dừng</MenuItem>
                </TextField>
              </Grid>

              <Grid sx={{ xs: 12 }}>
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