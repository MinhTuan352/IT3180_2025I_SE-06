// src/pages/Account/LoginHistory.tsx
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
import { useEffect, useState } from 'react';
import { authApi } from '../../api/authApi';

interface LoginHistoryItem {
  id: number; // Backend might not return ID for history log if using simple query, let's check model. 
  // Model select query: SELECT login_time, ip_address, user_agent FROM login_history
  // It doesn't return ID. data grid needs ID. We can map index.
  login_time: string;
  ip_address: string;
  user_agent: string;
}

const columns: GridColDef[] = [
  {
    field: 'login_time',
    headerName: 'Thời gian',
    width: 200,
    valueFormatter: (value: string) => value ? new Date(value).toLocaleString('vi-VN') : ''
  },
  { field: 'user_agent', headerName: 'Thiết bị / Trình duyệt', flex: 1, minWidth: 250 },
  { field: 'ip_address', headerName: 'Địa chỉ IP', width: 150 },
  {
    field: 'status',
    headerName: 'Trạng thái',
    width: 180,
    renderCell: () => {
      // Backend only logs successful logins via logic "createLoginHistory" inside "login" controller.
      // So all history records are successes.
      return <Chip label="Thành công" color="success" size="small" variant="outlined" />;
    }
  },
];

export default function LoginHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res: any = await authApi.getLoginHistory();
      // Wrapper: { success: true, count: n, data: [...] }
      // Axios interceptor might return res.data directly or not.
      // authApi.login returns parsed object.
      // authApi.getLoginHistory returns axiosClient.get (Promise<AxiosResponse>)
      // Let's assume axiosClient interceptor returns response.data
      const dataList = res.data || res; // fallback

      if (Array.isArray(dataList)) {
        // Map index to ID
        const mapped = dataList.map((item: any, index: number) => ({
          ...item,
          id: index
        }));
        setHistory(mapped);
      } else if (dataList.data && Array.isArray(dataList.data)) {
        const mapped = dataList.data.map((item: any, index: number) => ({
          ...item,
          id: index
        }));
        setHistory(mapped);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

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
          rows={history}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
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