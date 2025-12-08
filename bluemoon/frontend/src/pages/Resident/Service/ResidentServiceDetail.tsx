// src/pages/Resident/Service/ResidentServiceDetail.tsx
import {
  Box, Typography, Paper, Grid, Button, Divider,
  Container, Chip, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import toast, { Toaster } from 'react-hot-toast';
import axiosClient from '../../../api/axiosClient';

interface ServiceType {
  id: number;
  name: string;
  description: string;
  base_price: number;
  unit: string;
  is_active: number;
  category: string | null;
  location: string | null;
  open_hours: string | null;
  contact_phone: string | null;
}

// Placeholder image khi không có ảnh
const getServiceImage = (category: string | null) => {
  const images: Record<string, string> = {
    'Sức khỏe & Làm đẹp': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    'Tiện ích đời sống': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    'Ẩm thực & Giải trí': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    'Giáo dục': 'https://images.unsplash.com/photo-1587654780291-39c940483719?auto=format&fit=crop&w=1200&q=80',
    'Giải trí': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=80',
  };
  return images[category || ''] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80';
};

export default function ResidentServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [openBooking, setOpenBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    quantity: 1,
    booking_date: '',
    note: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await axiosClient.get(`/services/detail/${id}`);
        if (response.data && response.data.success) {
          setService(response.data.data);
        }
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải thông tin dịch vụ.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchService();
  }, [id]);

  const handleBookingSubmit = async () => {
    if (!service) return;

    setSubmitting(true);
    try {
      const response = await axiosClient.post('/services/bookings', {
        service_type_id: service.id,
        booking_date: bookingData.booking_date || new Date().toISOString(),
        quantity: bookingData.quantity,
        note: bookingData.note
      });

      if (response.data.success) {
        setOpenBooking(false);
        toast.success(response.data.message || 'Gửi yêu cầu thành công! Đơn vị dịch vụ sẽ liên hệ lại với bạn.');
        setBookingData({ quantity: 1, booking_date: '', note: '' });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đặt dịch vụ.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!service) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Không tìm thấy thông tin dịch vụ.</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/resident/service/list')} sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Toaster position="top-right" />
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/resident/service/list')} sx={{ mb: 2 }}>
        Quay lại danh sách
      </Button>

      <Grid container spacing={4}>
        {/* Cột Trái: Ảnh & Thông tin chính */}
        <Grid sx={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', mb: 3 }}>
            <Box
              component="img"
              src={getServiceImage(service.category)}
              alt={service.name}
              sx={{ width: '100%', height: 400, objectFit: 'cover' }}
            />
          </Paper>

          <Paper elevation={0} sx={{ p: 4, borderRadius: 4 }}>
            <Typography variant="h4" fontWeight="800" gutterBottom>{service.name}</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              <Chip label={service.category || 'Dịch vụ'} color="primary" variant="outlined" />
              <Chip label={service.is_active ? 'Đang hoạt động' : 'Tạm dừng'} color={service.is_active ? 'success' : 'default'} />
            </Stack>

            <Typography variant="h6" fontWeight="bold" gutterBottom>Giới thiệu dịch vụ</Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary' }}>
              {service.description || 'Chưa có mô tả chi tiết.'}
            </Typography>
          </Paper>
        </Grid>

        {/* Cột Phải: Liên hệ & Hành động */}
        <Grid sx={{ xs: 12, md: 4 }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 4, position: 'sticky', top: 100 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Thông tin liên hệ</Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex' }}>
                <LocationOnIcon color="action" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2">Địa điểm</Typography>
                  <Typography variant="body2">{service.location || 'Chưa cập nhật'}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex' }}>
                <AccessTimeIcon color="action" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2">Giờ mở cửa</Typography>
                  <Typography variant="body2">{service.open_hours || 'Liên hệ để biết thêm'}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex' }}>
                <PhoneIcon color="action" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2">Hotline</Typography>
                  <Typography variant="body2" color="primary" fontWeight="bold">{service.contact_phone || 'Chưa cập nhật'}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex' }}>
                <AttachMoneyIcon color="action" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2">Đơn giá</Typography>
                  <Typography variant="body2" color="primary" fontWeight="bold">
                    {new Intl.NumberFormat('vi-VN').format(service.base_price)} VNĐ / {service.unit}
                  </Typography>
                </Box>
              </Box>
            </Stack>

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<HowToRegIcon />}
              onClick={() => setOpenBooking(true)}
              disabled={!service.is_active}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
            >
              Đăng ký / Đặt lịch ngay
            </Button>
            <Typography variant="caption" display="block" align="center" sx={{ mt: 1, color: 'text.secondary' }}>
              *Chúng tôi sẽ gửi thông tin của bạn đến nhà cung cấp dịch vụ.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal Đăng Ký */}
      <Dialog open={openBooking} onClose={() => setOpenBooking(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Đăng ký dịch vụ: {service.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Vui lòng để lại thông tin, bộ phận CSKH của <b>{service.name}</b> sẽ liên hệ lại tư vấn cho bạn.
          </Typography>

          <TextField
            label="Số lượng / Số giờ"
            type="number"
            fullWidth
            margin="dense"
            value={bookingData.quantity}
            onChange={(e) => setBookingData({ ...bookingData, quantity: parseInt(e.target.value) || 1 })}
            InputProps={{ inputProps: { min: 1 } }}
          />

          <TextField
            label="Ngày/giờ mong muốn"
            type="datetime-local"
            fullWidth
            margin="dense"
            value={bookingData.booking_date}
            onChange={(e) => setBookingData({ ...bookingData, booking_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Lời nhắn / Yêu cầu đặc biệt"
            fullWidth
            margin="dense"
            multiline
            rows={3}
            value={bookingData.note}
            onChange={(e) => setBookingData({ ...bookingData, note: e.target.value })}
            placeholder="Ví dụ: Tôi muốn đăng ký tập thử Yoga khung giờ 18h..."
          />

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Tổng ước tính:</strong> {new Intl.NumberFormat('vi-VN').format(service.base_price * bookingData.quantity)} VNĐ
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBooking(false)} disabled={submitting}>Hủy</Button>
          <Button onClick={handleBookingSubmit} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Gửi Yêu cầu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
