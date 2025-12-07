// src/pages/BOD/NotificationManagement/NotificationList.tsx
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility';

import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useLayout } from '../../../contexts/LayoutContext';
import notificationApi, { type Notification } from '../../../api/notificationApi';

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const PAGE_PADDING = 48;

export default function NotificationList() {
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const { isSidebarCollapsed } = useLayout();

  const [loading, setLoading] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dynamicPaperWidth = windowWidth
    - (isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN)
    - PAGE_PADDING;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getAll({ role: 'bod' });
      // Helper to safely extract data
      const responseData = (response as any).data || response;

      if (Array.isArray(responseData)) {
        setNotifications(responseData);
      } else if (responseData && Array.isArray(responseData.data)) {
        setNotifications(responseData.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = () => {
    navigate('/bod/notification/create');
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Mã TB', width: 120 },
    { field: 'title', headerName: 'Tiêu đề', flex: 1, minWidth: 250 },
    {
      field: 'type_name',
      headerName: 'Loại',
      width: 150,
      renderCell: (params) => {
        const type = params.value;
        let color: "error" | "warning" | "primary" | "default" = "primary";
        if (type === 'Khẩn cấp') color = 'error';
        if (type === 'Thu phí') color = 'warning';
        return <Chip label={type || 'Thông báo'} color={color} size="small" />;
      }
    },
    { field: 'created_by_name', headerName: 'Người gửi', width: 150 },
    {
      field: 'created_at',
      headerName: 'Ngày tạo',
      width: 180,
      type: 'dateTime',
      valueGetter: (value) => value ? new Date(value) : null,
      valueFormatter: (value: Date) => value ? value.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '',
    },
    {
      field: 'scheduled_at',
      headerName: 'Lịch gửi',
      width: 180,
      type: 'dateTime',
      valueGetter: (value) => (value ? new Date(value) : null),
      renderCell: (params) => {
        if (!params.value) {
          return <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>Gửi ngay</Typography>;
        }
        return params.value.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
      }
    },
    { field: 'target', headerName: 'Đối tượng', width: 150 },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 120,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        return (
          <Box>
            <Tooltip title="Xem chi tiết">
              <IconButton size="small" onClick={() => navigate(`/bod/notification/detail/${params.row.id}`)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
          </Box>
        );
      }
    }
  ];

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }} sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            LỊCH SỬ THÔNG BÁO
          </Typography>
          <Button
            variant="contained"
            onClick={handleCreateNotification}
          >
            Tạo thông báo
          </Button>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper
            sx={{
              height: '100%',
              width: dynamicPaperWidth >= 0 ? dynamicPaperWidth : '100%',
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
            <DataGrid
              rows={notifications}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              sx={{
                border: 0,
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                  outline: 'none',
                },
                '&.MuiDataGrid-root': { p: 2 },
                minWidth: '900px',
              }}
            />
          </Paper>
        </Grid>

      </Grid>
    </>
  );
}
