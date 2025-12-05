// src/pages/Resident/Asset/ResidentAssetList.tsx
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Chip, 
  TextField,
  InputAdornment,
  Stack,
  Container,
  Paper,
  Divider
} from '@mui/material';
import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const mockAssets = [
  { 
    id: 'TS001', 
    name: 'Thang máy A1 (Cư dân)', 
    type: 'Thang máy', 
    location: 'Sảnh Tòa A - Khu vực thang khách', 
    status: 'Hoạt động', 
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80' 
  },
  { 
    id: 'TS002', 
    name: 'Thang máy A2 (Chở hàng)', 
    type: 'Thang máy', 
    location: 'Sảnh Tòa A - Khu vực phía sau (Lối đi riêng cho vận chuyển)', // Tên dài để test cắt dòng
    status: 'Đang bảo trì', 
    image: 'https://images.unsplash.com/photo-1621503947474-0672e4236966?auto=format&fit=crop&w=600&q=80' 
  },
  { 
    id: 'TS003', 
    name: 'Máy phát điện dự phòng', 
    type: 'Hệ thống Điện', 
    location: 'Hầm B1 - Khu kỹ thuật điện', 
    status: 'Hoạt động', 
    image: 'https://images.unsplash.com/photo-1563273941-768537b00366?auto=format&fit=crop&w=600&q=80' 
  },
  { 
    id: 'TS004', 
    name: 'Hệ thống bơm PCCC', 
    type: 'PCCC', 
    location: 'Hầm B2 - Trạm bơm trung tâm', 
    status: 'Hỏng', 
    image: 'https://images.unsplash.com/photo-1574976722234-a09c27776161?auto=format&fit=crop&w=600&q=80' 
  },
  { 
    id: 'TS005', 
    name: 'Cổng Barie Số 1', 
    type: 'An ninh', 
    location: 'Cổng chính', 
    status: 'Hoạt động', 
    image: 'https://images.unsplash.com/photo-1615890696771-8c467e335527?auto=format&fit=crop&w=600&q=80' 
  },
];

export default function ResidentAssetList() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssets = mockAssets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Hoạt động': return { color: 'success', label: 'Hoạt động' };
      case 'Đang bảo trì': return { color: 'warning', label: 'Bảo trì' };
      case 'Hỏng': return { color: 'error', label: 'Sự cố' };
      default: return { color: 'default', label: status };
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* HEADER */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, mb: 4, borderRadius: 4, bgcolor: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: '800', color: '#1a202c' }}>
            Tài sản & Thiết bị Tòa nhà
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tra cứu trạng thái hoạt động của các tiện ích kỹ thuật
          </Typography>
        </Box>

        <TextField
          placeholder="Tìm kiếm..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }}
          sx={{ width: { xs: '100%', sm: 320 }, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f7fafc' } }}
        />
      </Paper>

      {/* GRID */}
      <Grid container spacing={3} alignItems="stretch"> {/* alignItems="stretch" giúp các cột bằng nhau */}
        {filteredAssets.map((asset) => {
          const statusConfig = getStatusConfig(asset.status);
          
          return (
            <Grid sx={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={asset.id}>
              <Card 
                sx={{ 
                  height: '100%', // Card sẽ giãn hết chiều cao của Grid item
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 4,
                  border: '1px solid', borderColor: 'divider', boxShadow: 'none',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-5px)', boxShadow: 4 }
                }}
              >
                {/* 1. ẢNH: Cố định chiều cao 180px */}
                <Box sx={{ position: 'relative', height: 180 }}>
                  <CardMedia
                    component="img"
                    image={asset.image}
                    alt={asset.name}
                    sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
                  />
                  <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                    <Chip 
                      icon={<FiberManualRecordIcon style={{ fontSize: 10 }} />}
                      label={statusConfig.label} 
                      color={statusConfig.color as any}
                      size="small" 
                      sx={{ fontWeight: '700', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', color: `${statusConfig.color}.main` }}
                    />
                  </Box>
                </Box>

                {/* 2. NỘI DUNG */}
                <CardContent sx={{ flexGrow: 1, p: 2.5, display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Tiêu đề: Khóa cứng chiều cao cho 2 dòng */}
                  <Typography 
                    variant="h6" 
                    title={asset.name} // Hover vào sẽ hiện full tên
                    sx={{ 
                      fontWeight: 'bold', fontSize: '1.1rem', lineHeight: 1.4, mb: 1,
                      height: '2.8em', // Cố định chiều cao = 2 dòng
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {asset.name}
                  </Typography>

                  <Divider sx={{ mb: 2, mt: 'auto' }} /> {/* mt: 'auto' đẩy phần dưới xuống đáy */}

                  <Stack spacing={1}>
                    {/* Loại: 1 dòng, không wrap */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CategoryIcon sx={{ fontSize: 18, color: 'primary.main', mr: 1.5, flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" fontWeight="500" noWrap>
                        {asset.type}
                      </Typography>
                    </Box>
                    
                    {/* Vị trí: 1 dòng, cắt bớt nếu dài */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOnIcon sx={{ fontSize: 18, color: 'error.main', mr: 1.5, flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" noWrap title={asset.location}>
                        {asset.location}
                      </Typography>
                    </Box>
                  </Stack>

                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}