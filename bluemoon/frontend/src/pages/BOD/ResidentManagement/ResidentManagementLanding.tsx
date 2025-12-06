// src/pages/BOD/ResidentManagement/ResidentManagementLanding.tsx
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ApartmentIcon from '@mui/icons-material/Apartment';

export default function ResidentManagementLanding() {
  const navigate = useNavigate();

  return (
    <Box sx={{ mt: 5, px: 5 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
        QUẢN LÝ CƯ DÂN
      </Typography>
      <Typography variant="body1" sx={{ mb: 5, textAlign: 'center', color: 'text.secondary' }}>
        Vui lòng chọn phương thức tra cứu thông tin
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {/* Thẻ 1: Danh sách tổng hợp */}
        <Grid sx={{xs: 12, md: 5}}>
          <Card sx={{ height: '100%', borderRadius: 4, transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 } }}>
            <CardActionArea 
              sx={{ height: '100%', p: 4, textAlign: 'center' }}
              onClick={() => navigate('/bod/resident/list')}
            >
              <ListAltIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Tra cứu Danh sách Tổng hợp
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Xem dưới dạng bảng dữ liệu chi tiết, hỗ trợ lọc, tìm kiếm nhanh và thao tác hàng loạt.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Thẻ 2: Theo căn hộ */}
        <Grid sx={{xs: 12, md: 5}}>
          <Card sx={{ height: '100%', borderRadius: 4, transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 } }}>
            <CardActionArea 
              sx={{ height: '100%', p: 4, textAlign: 'center' }}
              onClick={() => navigate('/bod/resident/lookup')}
            >
              <ApartmentIcon sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
              <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Tra cứu theo Căn hộ
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Xem trực quan theo sơ đồ Tòa nhà - Tầng - Căn hộ. Kiểm tra trạng thái cư trú từng căn.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}