// src/pages/Resident/Service/ResidentServiceList.tsx
import {
  Box, Typography, Grid, Card, CardContent, CardMedia,
  Chip, TextField, InputAdornment, Container, Paper,
  Tab, Tabs, Stack, Divider, CircularProgress, Alert
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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
    'Sức khỏe & Làm đẹp': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    'Tiện ích đời sống': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    'Ẩm thực & Giải trí': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    'Giáo dục': 'https://images.unsplash.com/photo-1587654780291-39c940483719?auto=format&fit=crop&w=600&q=80',
    'Giải trí': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=600&q=80',
  };
  return images[category || ''] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80';
};

export default function ResidentServiceList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axiosClient.get('/services/public');
        if (response.data && response.data.success) {
          setServices(response.data.data);
        }
      } catch (err) {
        console.error(err);
        setError('Không thể tải danh sách dịch vụ.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Extract unique categories
  const categories = [...new Set(services.map(s => s.category).filter(Boolean))] as string[];

  const filteredServices = services.filter(service => {
    const matchName = service.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'Tất cả' || service.category === selectedCategory;
    return matchName && matchCategory;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header & Filter */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, bgcolor: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: '800', color: '#1a202c' }}>
              Dịch vụ & Tiện ích Thương mại
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Khám phá các dịch vụ đẳng cấp ngay tại tòa nhà Bluemoon
            </Typography>
          </Box>
          <TextField
            placeholder="Tìm kiếm dịch vụ..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
            }}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Tabs
          value={selectedCategory}
          onChange={(_, newVal) => setSelectedCategory(newVal)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Tất cả" value="Tất cả" sx={{ fontWeight: 'bold' }} />
          {categories.map(cat => (
            <Tab key={cat} label={cat} value={cat} sx={{ fontWeight: 'bold' }} />
          ))}
        </Tabs>
      </Paper>

      {/* Grid Services */}
      <Grid container spacing={3}>
        {filteredServices.map((service) => (
          <Grid sx={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={service.id}>
            <Card
              sx={{
                height: '100%', display: 'flex', flexDirection: 'column',
                borderRadius: 4, transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: 6, cursor: 'pointer' }
              }}
              onClick={() => navigate(`/resident/service/detail/${service.id}`)}
            >
              <Box sx={{ position: 'relative', height: 200 }}>
                <CardMedia
                  component="img"
                  height="100%"
                  image={getServiceImage(service.category)}
                  alt={service.name}
                  sx={{ objectFit: 'cover' }}
                />
                <Chip
                  label={service.category || 'Dịch vụ'}
                  size="small"
                  sx={{
                    position: 'absolute', top: 12, left: 12,
                    bgcolor: 'rgba(255,255,255,0.95)', fontWeight: 'bold', color: 'primary.main'
                  }}
                />
                <Chip
                  label={service.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                  color={service.is_active ? 'success' : 'warning'}
                  size="small"
                  sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 'bold' }}
                />
              </Box>

              <CardContent sx={{ flexGrow: 1, p: 2.5, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, minHeight: '3em', lineHeight: 1.4 }}>
                  {service.name}
                </Typography>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <LocationOnIcon color="action" sx={{ fontSize: 18, mr: 1, mt: 0.3 }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {service.location || 'Chưa cập nhật'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon color="action" sx={{ fontSize: 18, mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {service.open_hours || 'Liên hệ để biết thêm'}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 'auto' }} />

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Typography variant="button" color="primary" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                    Xem chi tiết <ArrowForwardIcon sx={{ ml: 0.5, fontSize: 18 }} />
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredServices.length === 0 && !loading && (
        <Box textAlign="center" py={5}>
          <Typography color="text.secondary">Không tìm thấy dịch vụ nào.</Typography>
        </Box>
      )}
    </Container>
  );
}
