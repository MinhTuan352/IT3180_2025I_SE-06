// src/pages/BOD/AssetManagement/AssetDetail.tsx
import {
  Box, Typography, Paper, Grid, Button, Divider, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Card, CardContent, Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react'; // <-- Thêm useEffect
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import EventIcon from '@mui/icons-material/Event';
import SaveIcon from '@mui/icons-material/Save';

const mockAssetDetail = {
  id: 'TS001', name: 'Thang máy A1', type: 'Thang máy', location: 'Tòa A, Sảnh chính',
  status: 'Hoạt động', manufacturer: 'Mitsubishi', installDate: '2020-01-15',
  maintenanceCycle: '30 ngày', nextMaintenance: '2025-12-20',
  history: [
    { date: '2025-11-20', type: 'Bảo trì định kỳ', performer: 'Kỹ thuật viên A', note: 'Tra dầu, kiểm tra cáp', cost: 500000 },
    { date: '2025-10-20', type: 'Sửa chữa', performer: 'Công ty Thang máy XYZ', note: 'Thay nút bấm tầng 5', cost: 2500000 },
  ]
};

export default function AssetDetail() {
  const navigate = useNavigate();
  const { id } = useParams(); // Lấy ID từ URL

  // --- SỬA LỖI: Sử dụng biến 'id' ---
  useEffect(() => {
    // Giả lập việc gọi API lấy chi tiết tài sản khi ID thay đổi
    if (id) {
        console.log(`Đang tải dữ liệu cho tài sản ID: ${id}`);
        // Trong thực tế: const data = await assetApi.getById(id);
    }
  }, [id]);

  // (Mock) Logic lưu lịch nhắc nhở
  const handleUpdateSchedule = () => {
    alert('Đã cập nhật lịch nhắc nhở bảo trì!');
  };

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/bod/asset/list')} sx={{ mb: 2 }}>
        Quay lại
      </Button>

      <Grid container spacing={3}>
        {/* Cột Trái: Thông tin chung */}
        <Grid sx={{xs: 12, md: 4}}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">{mockAssetDetail.name}</Typography>
              <Chip label={mockAssetDetail.status} color="success" sx={{ mb: 2 }} />
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary">Mã tài sản:</Typography>
              <Typography variant="body1" gutterBottom>{mockAssetDetail.id}</Typography>
              
              <Typography variant="body2" color="text.secondary">Vị trí:</Typography>
              <Typography variant="body1" gutterBottom>{mockAssetDetail.location}</Typography>
              
              <Typography variant="body2" color="text.secondary">Nhà sản xuất:</Typography>
              <Typography variant="body1" gutterBottom>{mockAssetDetail.manufacturer}</Typography>
              
              <Typography variant="body2" color="text.secondary">Ngày lắp đặt:</Typography>
              <Typography variant="body1" gutterBottom>{mockAssetDetail.installDate}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Cột Phải: Lịch trình & Lịch sử */}
        <Grid sx={{xs: 12, md: 8}}>
          {/* 1. Lập lịch & Nhắc nhở */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Lập lịch & Nhắc nhở</Typography>
            </Box>
            <Grid container spacing={2} alignItems="center">
              <Grid sx={{xs: 12, md: 4}}>
                <TextField label="Chu kỳ bảo trì" defaultValue={mockAssetDetail.maintenanceCycle} fullWidth size="small" />
              </Grid>
              <Grid sx={{xs: 12, md: 4}}>
                <TextField label="Ngày bảo trì tiếp theo" type="date" defaultValue={mockAssetDetail.nextMaintenance} fullWidth size="small" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid sx={{xs: 12, md: 4}}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleUpdateSchedule}>Lưu lịch</Button>
              </Grid>
            </Grid>
          </Paper>

          {/* 2. Lịch sử bảo trì */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HistoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Lịch sử Bảo trì / Sửa chữa</Typography>
              </Box>
              <Button size="small" variant="outlined">Ghi nhận mới</Button>
            </Box>
            
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Ngày</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Người thực hiện</TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell align="right">Chi phí</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockAssetDetail.history.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.performer}</TableCell>
                      <TableCell>{row.note}</TableCell>
                      <TableCell align="right">{row.cost.toLocaleString()} đ</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}