// src/pages/BOD/ServiceManagement/ServiceList.tsx
import {
  Box, Typography, Button, Paper, IconButton, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, MenuItem
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { mockServices } from '../../../data/mockServices';

export default function ServiceList() {
  const [services, setServices] = useState(mockServices);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const handleEditClick = (service: any) => {
    setEditingService({ ...service });
    setOpenEdit(true);
  };

  const handleSave = () => {
    // Logic cập nhật state hoặc gọi API PUT
    setServices(prev => prev.map(s => s.id === editingService.id ? editingService : s));
    setOpenEdit(false);
    alert("Cập nhật thông tin dịch vụ thành công!");
  };

  const handleChange = (e: any) => {
    setEditingService({ ...editingService, [e.target.name]: e.target.value });
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Mã DV', width: 90 },
    { field: 'name', headerName: 'Tên Dịch vụ', flex: 1, minWidth: 200 },
    { field: 'category', headerName: 'Danh mục', width: 150 },
    { field: 'location', headerName: 'Vị trí', width: 180 },
    { field: 'phone', headerName: 'Hotline', width: 120 },
    { 
      field: 'status', headerName: 'Trạng thái', width: 140,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'Đang hoạt động' ? 'success' : 'default'} 
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <StorefrontIcon sx={{ mr: 1, fontSize: 30, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight="bold">QUẢN LÝ DỊCH VỤ - TIỆN ÍCH</Typography>
      </Box>

      <Paper sx={{ height: 600, width: '100%', borderRadius: 2 }}>
        <DataGrid
          rows={services}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10]}
          disableRowSelectionOnClick
          sx={{ border: 0 }}
        />
      </Paper>

      {/* Modal Chỉnh Sửa */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="md" fullWidth>
        <DialogTitle>Cập nhật thông tin Dịch vụ</DialogTitle>
        <DialogContent dividers>
          {editingService && (
            <Grid container spacing={2}>
              <Grid sx={{xs: 12, sm: 6}}>
                <TextField label="Tên dịch vụ" name="name" fullWidth value={editingService.name} onChange={handleChange} />
              </Grid>
              <Grid sx={{xs: 12, sm: 6}}>
                <TextField label="Danh mục" name="category" fullWidth value={editingService.category} onChange={handleChange} />
              </Grid>
              <Grid sx={{xs: 12, sm: 6}}>
                <TextField label="Vị trí" name="location" fullWidth value={editingService.location} onChange={handleChange} />
              </Grid>
              <Grid sx={{xs: 12, sm: 6}}>
                <TextField label="Hotline" name="phone" fullWidth value={editingService.phone} onChange={handleChange} />
              </Grid>
              <Grid sx={{xs: 12, sm: 6}}>
                <TextField label="Giờ mở cửa" name="openTime" fullWidth value={editingService.openTime} onChange={handleChange} />
              </Grid>
              <Grid sx={{xs: 12, sm: 6}}>
                <TextField select label="Trạng thái" name="status" fullWidth value={editingService.status} onChange={handleChange}>
                  <MenuItem value="Đang hoạt động">Đang hoạt động</MenuItem>
                  <MenuItem value="Tạm dừng">Tạm dừng</MenuItem>
                  <MenuItem value="Bảo trì">Bảo trì</MenuItem>
                </TextField>
              </Grid>
              <Grid sx={{xs: 12, sm: 6}}>
                <TextField label="Mô tả chi tiết" name="description" fullWidth multiline rows={4} value={editingService.description} onChange={handleChange} />
              </Grid>
              <Grid sx={{xs: 12, sm: 6}}>
                <TextField label="Link Ảnh (URL)" name="image" fullWidth value={editingService.image} onChange={handleChange} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Hủy</Button>
          <Button onClick={handleSave} variant="contained">Lưu Cập Nhật</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}