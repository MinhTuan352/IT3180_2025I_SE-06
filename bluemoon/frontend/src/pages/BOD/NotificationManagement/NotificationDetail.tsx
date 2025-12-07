// src/pages/BOD/NotificationManagement/NotificationDetail.tsx
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
  Grid,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import notificationApi, { type Notification } from '../../../api/notificationApi';

export default function NotificationDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDetail(id);
    }
  }, [id]);

  const fetchDetail = async (notiId: string) => {
    try {
      setLoading(true);
      const response = await notificationApi.getDetail(notiId);
      // Assuming response structure
      if (response && (response as any).data) {
        setNotification((response as any).data);
      } else {
        // fallback
        setNotification(response as any);
      }
    } catch (error) {
      console.error("Failed to fetch detail", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Đang tải thông báo...</Typography>
      </Paper>
    );
  }

  if (!notification) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Không tìm thấy thông báo.</Typography>
        <Button onClick={() => navigate('/bod/notification/list')}>Quay lại</Button>
      </Paper>
    );
  }

  // Helper for type color
  let typeColor: "error" | "warning" | "primary" = "primary";
  if (notification.type_name === 'Khẩn cấp') typeColor = 'error';
  if (notification.type_name === 'Thu phí') typeColor = 'warning';

  return (
    <Paper sx={{ p: 4, borderRadius: 3 }}>
      {/* Hàng 1: Nút Back và Tiêu đề */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/bod/notification/list')}
          sx={{ mr: 2 }}
        >
          Quay lại
        </Button>
        <Chip
          label={notification.type_name || 'Thông báo'}
          color={typeColor}
        />
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        {notification.title}
      </Typography>

      {/* Hàng 2: Thông tin meta */}
      <Grid container spacing={2} sx={{ color: 'text.secondary', my: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2">
            <strong>Người gửi:</strong> {notification.created_by_name || notification.created_by}
          </Typography>
          <Typography variant="body2">
            <strong>Đối tượng:</strong> {notification.target}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2">
            <strong>Ngày tạo:</strong> {new Date(notification.created_at).toLocaleString('vi-VN')}
          </Typography>
          <Typography variant="body2">
            <strong>Lịch gửi:</strong> {notification.scheduled_at
              ? new Date(notification.scheduled_at).toLocaleString('vi-VN')
              : 'Gửi ngay'}
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* Hàng 3: Nội dung văn bản */}
      <Box sx={{
        minHeight: 200,
        mb: 3,
        whiteSpace: 'pre-wrap',
      }}>
        <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
          {notification.content}
        </Typography>
      </Box>

      {/* Hàng 4: File đính kèm (nếu có) */}
      {notification.attachments && notification.attachments.length > 0 && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>File đính kèm:</Typography>
          {notification.attachments.map((file, index) => (
            <Button
              key={index}
              href={`http://localhost:3000${file.file_path}`} // Assuming backend url
              target="_blank"
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            >
              {file.file_name}
            </Button>
          ))}
        </>
      )}
    </Paper>
  );
}
