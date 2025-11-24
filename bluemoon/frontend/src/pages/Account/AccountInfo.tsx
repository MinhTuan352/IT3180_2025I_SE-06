// src/pages/Account/AccountInfo.tsx
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Card,
  Divider,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import HistoryIcon from '@mui/icons-material/History';

export default function AccountInfo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Dữ liệu giả lập để hiển thị
  const [formData] = useState({
    username: user?.username || 'admin.bod',
    password: 'password123', // Giá trị giả để hiện dấu chấm
    fullName: 'Nguyễn Văn Quản Trị',
    role: user?.role?.toUpperCase() || 'BOD'
  });

  const handleNavigateToHistory = () => {
    navigate('/account/history');
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Thông tin Tài khoản
      </Typography>

      <Grid container spacing={3}>
        {/* Cột Trái: Avatar & Role */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ textAlign: 'center', p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Avatar 
                src="/static/images/avatar/2.jpg" 
                sx={{ width: 150, height: 150, border: '4px solid #f0f0f0' }} 
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{formData.fullName}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>{formData.role}</Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Button 
              variant="outlined" 
              startIcon={<HistoryIcon />} 
              fullWidth
              onClick={handleNavigateToHistory}
            >
              Lịch sử đăng nhập
            </Button>
          </Card>
        </Grid>

        {/* Cột Phải: Form thông tin (Read-only) */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 4, borderRadius: 3, height: '100%' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Chi tiết hồ sơ</Typography>
            </Box>

            <Grid container spacing={3}>
              {/* Tên đăng nhập */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Tên đăng nhập"
                  fullWidth
                  value={formData.username}
                  disabled // Luôn disable
                  variant="filled"
                  helperText="Không thể thay đổi tên đăng nhập"
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      backgroundColor: '#f0f0f0', // Màu nền xám nhẹ cho dễ nhìn
                    }
                  }}
                />
              </Grid>

              {/* Mật khẩu */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Mật khẩu"
                  type="password"
                  fullWidth
                  value={formData.password}
                  disabled // Luôn disable
                  variant="filled"
                  helperText="Vui lòng sử dụng chức năng 'Đổi mật khẩu' để thay đổi"
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      backgroundColor: '#f0f0f0',
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}