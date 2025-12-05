// src/pages/Resident/Service/ResidentServiceList.tsx
import { 
  Box, Typography, Grid, Card, CardContent, CardMedia, 
  Chip, TextField, InputAdornment, Container, Paper, 
  Tab, Tabs, Stack, Divider
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { mockServices, SERVICE_CATEGORIES } from '../../../data/mockServices';

export default function ResidentServiceList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const filteredServices = mockServices.filter(service => {
    const matchName = service.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'Tất cả' || service.category === selectedCategory;
    return matchName && matchCategory;
  });

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
        
        <Tabs 
          value={selectedCategory} 
          onChange={(_, newVal) => setSelectedCategory(newVal)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Tất cả" value="Tất cả" sx={{fontWeight: 'bold'}}/>
          {SERVICE_CATEGORIES.map(cat => (
            <Tab key={cat} label={cat} value={cat} sx={{fontWeight: 'bold'}}/>
          ))}
        </Tabs>
      </Paper>

      {/* Grid Services */}
      <Grid container spacing={3}>
        {filteredServices.map((service) => (
          <Grid sx={{xs: 12, sm: 6, md: 4, lg: 3}} key={service.id}>
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
                  image={service.image}
                  alt={service.name}
                  sx={{ objectFit: 'cover' }}
                />
                <Chip 
                  label={service.category} 
                  size="small"
                  sx={{ 
                    position: 'absolute', top: 12, left: 12, 
                    bgcolor: 'rgba(255,255,255,0.95)', fontWeight: 'bold', color: 'primary.main'
                  }}
                />
                <Chip 
                  label={service.status}
                  color={service.status === 'Đang hoạt động' ? 'success' : 'warning'}
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
                      {service.location}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon color="action" sx={{ fontSize: 18, mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {service.openTime}
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
    </Container>
  );
}