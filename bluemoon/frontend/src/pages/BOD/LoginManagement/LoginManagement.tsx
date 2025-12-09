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
  Alert,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosClient from '../../../api/axiosClient';
import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useLayout } from '../../../contexts/LayoutContext';

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const PAGE_PADDING = 48;

// Interface cho Login Log (Khớp với dữ liệu trả về từ API)
interface LoginLog {
  id: number;
  user_id: string;
  username: string;
  full_name: string;
  role_code: string;
  role_name: string;
  apartment_id: string | null;
  login_time: string;
  ip_address: string;
  user_agent: string;
  user_agent_parsed?: string;
}

export default function LoginManagement() {
  const windowWidth = useWindowWidth();
  const { isSidebarCollapsed } = useLayout();
  const dynamicPaperWidth = windowWidth - (isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN) - PAGE_PADDING;

  const [viewMode, setViewMode] = useState<'admin' | 'resident'>('admin');
  const [searchText, setSearchText] = useState('');

  // Data states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allLogs, setAllLogs] = useState<LoginLog[]>([]);

  // Helper parser
  const parseUserAgent = (ua: string): string => {
    if (!ua) return 'Unknown';
    if (ua.includes('Postman')) return 'Postman Runtime';
    if (ua.includes('iPhone')) return 'Mobile / iOS';
    if (ua.includes('Android')) return 'Mobile / Android';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Macintosh')) return 'MacOS';
    return 'Web Browser';
  };

  // Fetch Data từ API
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.get('/auth/all-history');
        if (response.data && response.data.success) {
          const logs = response.data.data.map((log: any) => ({
            ...log,
            user_agent_parsed: parseUserAgent(log.user_agent)
          }));
          setAllLogs(logs);
        }
      } catch (err: any) {
        console.error("Lỗi tải lịch sử đăng nhập:", err);
        setError("Không thể tải dữ liệu lịch sử đăng nhập.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: 'admin' | 'resident' | null,
  ) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  // Format Date
  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('vi-VN');
  };

  // Columns cho Admin
  const adminColumns: GridColDef[] = [
    {
      field: 'username',
      headerName: 'Tài khoản',
      width: 200,
      renderCell: (params: GridRenderCellParams<LoginLog>) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
            {params.value && typeof params.value === 'string' ? params.value[0].toUpperCase() : '?'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">{params.value}</Typography>
            <Typography variant="caption" color="text.secondary">{params.row.full_name}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      field: 'role_name',
      headerName: 'Vai trò',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value as string}
          size="small"
          color={['BOD', 'Ban quản trị'].includes(params.value as string) ? 'primary' : 'secondary'}
          variant="outlined"
        />
      )
    },
    {
      field: 'login_time',
      headerName: 'Thời gian',
      width: 180,
      valueFormatter: (value) => formatDate(value as string)
    },
    { field: 'ip_address', headerName: 'IP Address', width: 140 },
    { field: 'user_agent_parsed', headerName: 'Thiết bị', flex: 1, minWidth: 200 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 150,
      renderCell: () => (
        <Chip
          icon={<CheckCircleIcon />}
          label="Thành công"
          color="success"
          size="small"
        />
      )
    },
  ];

  // Columns cho Cư dân
  const residentColumns: GridColDef[] = [
    {
      field: 'username',
      headerName: 'Tài khoản',
      width: 200,
      renderCell: (params: GridRenderCellParams<LoginLog>) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: 'orange' }}>
            {params.value && typeof params.value === 'string' ? params.value[0].toUpperCase() : '?'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">{params.value}</Typography>
            <Typography variant="caption" color="text.secondary">{params.row.full_name}</Typography>
          </Box>
        </Stack>
      )
    },
    { field: 'apartment_id', headerName: 'Căn hộ', width: 100 },
    {
      field: 'login_time',
      headerName: 'Thời gian',
      width: 180,
      valueFormatter: (value) => formatDate(value as string)
    },
    { field: 'ip_address', headerName: 'IP Address', width: 140 },
    { field: 'user_agent_parsed', headerName: 'Thiết bị', flex: 1, minWidth: 200 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 150,
      renderCell: () => (
        <Chip
          icon={<CheckCircleIcon />}
          label="Thành công"
          color="success"
          size="small"
        />
      )
    },
  ];

  // Filter Data Logic
  const adminLogs = allLogs.filter(log => !log.apartment_id);
  const residentLogs = allLogs.filter(log => log.apartment_id);
  const currentRows = viewMode === 'admin' ? adminLogs : residentLogs;

  const filteredRows = currentRows.filter((row) =>
    row.username.toLowerCase().includes(searchText.toLowerCase()) ||
    row.full_name.toLowerCase().includes(searchText.toLowerCase())
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

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Data Grid */}
      <Paper sx={{
        height: 600,
        width: dynamicPaperWidth,
        borderRadius: 3,
        p: 0,
        overflow: 'auto'
      }}>
        <DataGrid
          loading={loading}
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