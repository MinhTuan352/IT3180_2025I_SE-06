// src/pages/BOD/Account/LoginHistory.tsx
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

// Mock Data
const mockLoginHistory = [
  { id: 1, timestamp: '2025-11-24 09:30:00', ip: '192.168.1.1', device: 'Chrome / Windows 10', status: 'Thành công' },
  { id: 2, timestamp: '2025-11-23 14:15:00', ip: '192.168.1.1', device: 'Chrome / Windows 10', status: 'Thành công' },
  { id: 3, timestamp: '2025-11-22 20:00:00', ip: '14.168.x.x', device: 'Safari / iPhone 13', status: 'Thành công' },
  { id: 4, timestamp: '2025-11-22 19:55:00', ip: '14.168.x.x', device: 'Safari / iPhone 13', status: 'Thất bại (Sai MK)' },
  { id: 5, timestamp: '2025-11-20 08:00:00', ip: '113.190.x.x', device: 'Firefox / MacOS', status: 'Thành công' },
];

const columns: GridColDef[] = [
  { field: 'timestamp', headerName: 'Thời gian', width: 200 },
  { field: 'device', headerName: 'Thiết bị / Trình duyệt', flex: 1, minWidth: 250 },
  { field: 'ip', headerName: 'Địa chỉ IP', width: 150 },
  { 
    field: 'status', 
    headerName: 'Trạng thái', 
    width: 180,
    renderCell: (params) => {
      const status = params.value as string;
      const color = status.includes('Thành công') ? 'success' : 'error';
      return <Chip label={status} color={color} size="small" variant="outlined" />;
    }
  },
];

export default function LoginHistory() {
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Header nav */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/account/info')}
          sx={{ mr: 2 }}
        >
          Quay lại
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Lịch sử Đăng nhập
        </Typography>
      </Box>

      <Paper sx={{ p: 0, borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
        <DataGrid
          rows={mockLoginHistory}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25]}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            // Header style
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              borderBottom: '1px solid #e0e0e0',
            },
          }}
        />
      </Paper>
    </Box>
  );
}