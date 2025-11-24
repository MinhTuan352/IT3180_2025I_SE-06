// src/pages/BOD/LoginManagement/LoginManagement.tsx
import {
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Avatar,
  Stack,
  TextField,
  InputAdornment,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useState } from 'react';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

// --- Mock Data ---
const mockAdminLogins = [
  { id: 1, username: 'admin.a', fullName: 'Nguyễn Văn A', role: 'BOD', time: '2025-10-28 08:30:00', ip: '192.168.1.10', device: 'Chrome / Windows', status: 'Thành công' },
  { id: 2, username: 'ketoan.b', fullName: 'Trần Thị B', role: 'Kế toán', time: '2025-10-28 09:00:00', ip: '192.168.1.15', device: 'Safari / MacOS', status: 'Thành công' },
  { id: 3, username: 'admin.a', fullName: 'Nguyễn Văn A', role: 'BOD', time: '2025-10-27 17:45:00', ip: '14.162.x.x', device: 'Mobile / iOS', status: 'Thất bại (Sai MK)' },
  { id: 4, username: 'ketoan.c', fullName: 'Lê Văn C', role: 'Kế toán', time: '2025-10-27 08:15:00', ip: '192.168.1.20', device: 'Firefox / Windows', status: 'Thành công' },
];

const mockResidentLogins = [
  { id: 101, username: 'chuho_a101', fullName: 'Trần Văn Hộ', apartment: 'A-101', time: '2025-10-28 19:30:00', ip: '42.113.x.x', device: 'App Mobile / Android', status: 'Thành công' },
  { id: 102, username: 'mem_b205', fullName: 'Lê Gia Đình', apartment: 'B-205', time: '2025-10-28 18:00:00', ip: '113.160.x.x', device: 'Chrome / Windows', status: 'Thành công' },
  { id: 103, username: 'chuho_c1503', fullName: 'Phạm Văn B', apartment: 'C-1503', time: '2025-10-27 21:15:00', ip: '14.232.x.x', device: 'App Mobile / iOS', status: 'Thất bại (Khóa TK)' },
];

export default function LoginManagement() {
  const [viewMode, setViewMode] = useState<'admin' | 'resident'>('admin');
  const [searchText, setSearchText] = useState('');

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: 'admin' | 'resident' | null,
  ) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  // Columns cho Admin
  const adminColumns: GridColDef[] = [
    { 
      field: 'username', 
      headerName: 'Tài khoản', 
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{params.value[0].toUpperCase()}</Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">{params.value}</Typography>
            <Typography variant="caption" color="text.secondary">{params.row.fullName}</Typography>
          </Box>
        </Stack>
      )
    },
    { 
      field: 'role', 
      headerName: 'Vai trò', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value === 'BOD' ? 'primary' : 'secondary'} 
          variant="outlined"
        />
      )
    },
    { field: 'time', headerName: 'Thời gian', width: 180 },
    { field: 'ip', headerName: 'IP Address', width: 140 },
    { field: 'device', headerName: 'Thiết bị', flex: 1, minWidth: 200 },
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      width: 180,
      renderCell: (params) => {
        const isSuccess = params.value === 'Thành công';
        return (
          <Chip 
            icon={isSuccess ? <CheckCircleIcon /> : <ErrorIcon />}
            label={params.value} 
            color={isSuccess ? 'success' : 'error'} 
            size="small"
          />
        );
      }
    },
  ];

  // Columns cho Cư dân
  const residentColumns: GridColDef[] = [
    { 
      field: 'username', 
      headerName: 'Tài khoản', 
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: 'orange' }}>{params.value[0].toUpperCase()}</Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">{params.value}</Typography>
            <Typography variant="caption" color="text.secondary">{params.row.fullName}</Typography>
          </Box>
        </Stack>
      )
    },
    { field: 'apartment', headerName: 'Căn hộ', width: 100 },
    { field: 'time', headerName: 'Thời gian', width: 180 },
    { field: 'ip', headerName: 'IP Address', width: 140 },
    { field: 'device', headerName: 'Thiết bị', flex: 1, minWidth: 200 },
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      width: 180,
      renderCell: (params) => {
        const isSuccess = params.value === 'Thành công';
        return (
          <Chip 
            icon={isSuccess ? <CheckCircleIcon /> : <ErrorIcon />}
            label={params.value} 
            color={isSuccess ? 'success' : 'error'} 
            size="small"
          />
        );
      }
    },
  ];

  // Filter data
  const currentRows = viewMode === 'admin' ? mockAdminLogins : mockResidentLogins;
  const filteredRows = currentRows.filter((row) => 
    row.username.toLowerCase().includes(searchText.toLowerCase()) ||
    row.fullName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        QUẢN LÝ LỊCH SỬ ĐĂNG NHẬP
      </Typography>

      {/* Header Controls */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        
        {/* Toggle Button Group (QTV vs Cư dân) */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewChange}
          aria-label="view mode"
          sx={{ 
            '& .MuiToggleButton-root': { 
              px: 3, 
              py: 1, 
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px !important',
              mx: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': { backgroundColor: 'primary.dark' }
              }
            } 
          }}
        >
          <ToggleButton value="admin">
            <AdminPanelSettingsIcon sx={{ mr: 1 }} />
            QTV
          </ToggleButton>
          <ToggleButton value="resident">
            <PeopleIcon sx={{ mr: 1 }} />
            Cư dân
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Search Box */}
        <TextField
          size="small"
          placeholder="Tìm kiếm tài khoản..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%', borderRadius: 3, p: 0, overflow: 'hidden' }}>
        <DataGrid
          rows={filteredRows}
          columns={viewMode === 'admin' ? adminColumns : residentColumns}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f4f6f8',
              borderBottom: '1px solid #e0e0e0',
            },
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
          }}
        />
      </Paper>
    </Box>
  );
}