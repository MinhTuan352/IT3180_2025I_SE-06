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
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { useState, useEffect } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import assetApi, { type Asset } from '../../../api/assetApi';

// Default images for different asset types
const getDefaultImage = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('thang máy')) {
    return 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80';
  }
  if (lowerName.includes('máy phát') || lowerName.includes('điện')) {
    return 'https://images.unsplash.com/photo-1563273941-768537b00366?auto=format&fit=crop&w=600&q=80';
  }
  if (lowerName.includes('pccc') || lowerName.includes('bơm')) {
    return 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=600&q=80';
  }
  if (lowerName.includes('cổng') || lowerName.includes('barrier') || lowerName.includes('an ninh')) {
    return 'https://images.unsplash.com/photo-1615890696771-8c467e335527?auto=format&fit=crop&w=600&q=80';
  }
  // Default generic building image
  return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80';
};

// Infer type/category from asset name
const inferAssetType = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('thang máy')) return 'Thang máy';
  if (lowerName.includes('máy phát') || lowerName.includes('điện')) return 'Hệ thống Điện';
  if (lowerName.includes('pccc') || lowerName.includes('bơm') || lowerName.includes('chữa cháy')) return 'PCCC';
  if (lowerName.includes('cổng') || lowerName.includes('barrier') || lowerName.includes('camera') || lowerName.includes('an ninh')) return 'An ninh';
  if (lowerName.includes('điều hòa') || lowerName.includes('hvac')) return 'HVAC';
  return 'Thiết bị khác';
};

export default function ResidentAssetList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch assets from API
  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await assetApi.getForResident();
      // Backend returns { success: true, count: X, data: [...] }
      const data = (response.data as any).data || response.data || [];
      setAssets(data);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách tài sản. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.asset_code && asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (asset.location && asset.location.toLowerCase().includes(searchTerm.toLowerCase()))
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

      {/* LOADING STATE */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      )}

      {/* ERROR STATE */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* EMPTY STATE */}
      {!isLoading && !error && filteredAssets.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'Không tìm thấy tài sản phù hợp.' : 'Chưa có tài sản nào trong hệ thống.'}
          </Typography>
        </Box>
      )}

      {/* GRID */}
      {!isLoading && !error && filteredAssets.length > 0 && (
        <Grid container spacing={3} alignItems="stretch">
          {filteredAssets.map((asset) => {
            const statusConfig = getStatusConfig(asset.status);
            const assetType = inferAssetType(asset.name);
            const assetImage = getDefaultImage(asset.name);

            return (
              <Grid sx={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={asset.id}>
                <Card
                  sx={{
                    height: '100%',
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
                      image={assetImage}
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
                      title={asset.name}
                      sx={{
                        fontWeight: 'bold', fontSize: '1.1rem', lineHeight: 1.4, mb: 1,
                        height: '2.8em',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {asset.name}
                    </Typography>

                    <Divider sx={{ mb: 2, mt: 'auto' }} />

                    <Stack spacing={1}>
                      {/* Loại: 1 dòng, không wrap */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CategoryIcon sx={{ fontSize: 18, color: 'primary.main', mr: 1.5, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight="500" noWrap>
                          {assetType}
                        </Typography>
                      </Box>

                      {/* Vị trí: 1 dòng, cắt bớt nếu dài */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOnIcon sx={{ fontSize: 18, color: 'error.main', mr: 1.5, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" noWrap title={asset.location || 'Chưa xác định'}>
                          {asset.location || 'Chưa xác định'}
                        </Typography>
                      </Box>
                    </Stack>

                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}