// src/pages/Resident/Service/ResidentServiceDetail.tsx
import { 
  Box, Typography, Paper, Grid, Button, Divider, 
  Container, Chip, Stack, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import toast, { Toaster } from 'react-hot-toast';
import { mockServices } from '../../../data/mockServices';

export default function ResidentServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [openBooking, setOpenBooking] = useState(false);

  useEffect(() => {
    const found = mockServices.find(s => s.id === id);
    if (found) setService(found);
  }, [id]);

  const handleBookingSubmit = () => {
    // Logic gửi thông tin đăng ký lên API
    setOpenBooking(false);
    toast.success('Gửi yêu cầu thành công! Đơn vị dịch vụ sẽ liên hệ lại với bạn.');
  };

  if (!service) return <Typography>Đang tải...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Toaster position="top-right" />
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/resident/service/list')} sx={{ mb: 2 }}>
        Quay lại danh sách
      </Button>

      <Grid container spacing={4}>
        {/* Cột Trái: Ảnh & Thông tin chính */}
        <Grid sx={{xs: 12, md: 8}}>
          <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', mb: 3 }}>
            <Box 
              component="img" 
              src={service.image} 
              alt={service.name}
              sx={{ width: '100%', height: 400, objectFit: 'cover' }}
            />
          </Paper>

          <Paper elevation={0} sx={{ p: 4, borderRadius: 4 }}>
            <Typography variant="h4" fontWeight="800" gutterBottom>{service.name}</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              <Chip label={service.category} color="primary" variant="outlined" />
              <Chip label={service.status} color={service.status === 'Đang hoạt động' ? 'success' : 'default'} />
            </Stack>

            <Typography variant="h6" fontWeight="bold" gutterBottom>Giới thiệu dịch vụ</Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary' }}>
              {service.description}
            </Typography>
          </Paper>
        </Grid>

        {/* Cột Phải: Liên hệ & Hành động */}
        <Grid sx={{xs: 12, md: 4}}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 4, position: 'sticky', top: 100 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Thông tin liên hệ</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex' }}>
                <LocationOnIcon color="action" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2">Địa điểm</Typography>
                  <Typography variant="body2">{service.location}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex' }}>
                <AccessTimeIcon color="action" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2">Giờ mở cửa</Typography>
                  <Typography variant="body2">{service.openTime}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex' }}>
                <PhoneIcon color="action" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2">Hotline</Typography>
                  <Typography variant="body2" color="primary" fontWeight="bold">{service.phone}</Typography>
                </Box>
              </Box>
            </Stack>

            <Button 
              variant="contained" 
              fullWidth 
              size="large"
              startIcon={<HowToRegIcon />}
              onClick={() => setOpenBooking(true)}
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
        <DialogTitle>Đăng ký quan tâm dịch vụ</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Vui lòng để lại thông tin, bộ phận CSKH của <b>{service.name}</b> sẽ liên hệ lại tư vấn cho bạn.
          </Typography>
          <TextField label="Họ tên cư dân" fullWidth margin="dense" defaultValue="Trần Văn Hộ" />
          <TextField label="Số điện thoại" fullWidth margin="dense" defaultValue="0909xxxxxx" />
          <TextField label="Căn hộ" fullWidth margin="dense" defaultValue="A-101" disabled />
          <TextField 
            label="Lời nhắn / Yêu cầu đặc biệt" 
            fullWidth margin="dense" multiline rows={3} 
            placeholder="Ví dụ: Tôi muốn đăng ký tập thử Yoga khung giờ 18h..." 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBooking(false)}>Hủy</Button>
          <Button onClick={handleBookingSubmit} variant="contained">Gửi Yêu cầu</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}