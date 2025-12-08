// src/pages/Resident/Notification/ResidentNotificationList.tsx
import { Box, Typography, Paper, Chip, IconButton, Tooltip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider } from '@mui/material';
import { DataGrid, type GridColDef, type GridCellParams } from '@mui/x-data-grid';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import { useEffect, useState } from 'react';
import notificationApi, { type Notification } from '../../../api/notificationApi';

export default function ResidentNotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state for viewing notification detail
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch notifications from API
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationApi.getAll({ role: 'resident' });
      const data = response.data.data || [];
      setNotifications(data);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách thông báo. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      // Update local state
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      alert('Không thể đánh dấu đã đọc. Vui lòng thử lại.');
    }
  };

  // Handle row click to show detail
  const handleRowClick = async (params: any) => {
    const notification = params.row as Notification;
    setSelectedNotification(notification);
    setDialogOpen(true);

    // Mark as read when opened
    if (!notification.is_read) {
      await handleMarkRead(notification.id);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedNotification(null);
  };

  const columns: GridColDef[] = [
    {
      field: 'status', headerName: 'Trạng thái', width: 120,
      renderCell: (params) => {
        const isRead = params.row.is_read;
        return <Chip label={isRead ? 'Đã đọc' : 'Chưa đọc'} color={isRead ? 'default' : 'warning'} size="small" variant={isRead ? 'outlined' : 'filled'} />;
      }
    },
    { field: 'title', headerName: 'Tiêu đề', flex: 1, minWidth: 250 },
    {
      field: 'created_by_name',
      headerName: 'Người gửi',
      width: 180,
      valueGetter: (value, row) => row.created_by_name || 'Ban quản trị'
    },
    {
      field: 'created_at', headerName: 'Ngày gửi', width: 160, type: 'dateTime',
      valueGetter: (value) => value ? new Date(value) : null,
      valueFormatter: (value: Date | null) => value ? value.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '',
    },
    {
      field: 'actions', headerName: 'Hành động', width: 100, sortable: false,
      renderCell: (params: GridCellParams) => {
        const isRead = params.row.is_read;
        return (
          <Tooltip title={isRead ? "Đã đọc" : "Đánh dấu đã đọc"}>
            <span>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                  handleMarkRead(params.row.id);
                }}
                disabled={isRead}
              >
                {isRead ? <MarkEmailReadIcon /> : <MarkEmailUnreadIcon color="warning" />}
              </IconButton>
            </span>
          </Tooltip>
        );
      }
    }
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Hòm thư Thông báo
      </Typography>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Data Grid */}
      {!isLoading && !error && (
        <Box sx={{ height: '70vh', width: '100%' }}>
          <DataGrid
            rows={notifications}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] }
            }}
            pageSizeOptions={[10, 20]}
            disableRowSelectionOnClick={false}
            onRowClick={handleRowClick}
            getRowId={(row) => row.id}
            sx={{ border: 0, cursor: 'pointer' }}
            localeText={{
              noRowsLabel: 'Không có thông báo nào.'
            }}
          />
        </Box>
      )}

      {/* Notification Detail Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {selectedNotification?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Người gửi: <strong>{selectedNotification?.created_by_name || 'Ban quản trị'}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ngày gửi: <strong>{selectedNotification?.created_at ? new Date(selectedNotification.created_at).toLocaleString('vi-VN') : ''}</strong>
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {selectedNotification?.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}