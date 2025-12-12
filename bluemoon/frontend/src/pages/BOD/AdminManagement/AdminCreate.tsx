// src/pages/BOD/AdminManagement/AdminCreate.tsx
import {
  Box,
  Typography,
  Grid,
  Card,
  Avatar,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosClient from '../../../api/axiosClient';

interface FormData {
  full_name: string;
  dob: string;
  gender: string;
  cccd: string;
  phone: string;
  email: string;
  role_id: number;
  username: string;
  password: string;
}

export default function AdminCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    dob: '',
    gender: 'Nam',
    cccd: '',
    phone: '',
    email: '',
    role_id: 1,
    username: '',
    password: '',
  });

  const handleChange = (field: keyof FormData) => (e: any) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError(null);
  };

  const handleCreateAdmin = async () => {
    // Validate required fields
    if (!formData.full_name || !formData.cccd || !formData.email || !formData.username) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc (Họ tên, CCCD, Email, Username)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        password: formData.password || '12345678', // Default password if empty
      };

      const response = await axiosClient.post('/users/create-admin', payload);

      if (response.data.success) {
        toast.success('Tạo tài khoản quản trị viên thành công!');
        navigate('/bod/admin/list');
      }
    } catch (err: any) {
      console.error('Create admin error:', err);
      const message = err.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      {/* Tiêu đề trang */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Tạo tài khoản quản trị viên
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* CỘT BÊN TRÁI: Avatar và ID */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                bgcolor: formData.role_id === 1 ? 'primary.main' : 'secondary.main',
                fontSize: '3rem',
              }}
            >
              {formData.full_name ? formData.full_name[0].toUpperCase() : '?'}
            </Avatar>
            <Typography variant="h6" gutterBottom>
              {formData.full_name || 'Quản trị viên mới'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.role_id === 1 ? 'Ban Quản Trị' : 'Kế toán'}
            </Typography>
          </Card>
        </Grid>

        {/* CỘT BÊN PHẢI: Form điền thông tin */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {/* Họ và tên */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Họ và tên *"
                  fullWidth
                  value={formData.full_name}
                  onChange={handleChange('full_name')}
                />
              </Grid>

              {/* Ngày sinh */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Ngày sinh"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.dob}
                  onChange={handleChange('dob')}
                />
              </Grid>

              {/* Giới tính */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Giới tính</InputLabel>
                  <Select
                    label="Giới tính"
                    value={formData.gender}
                    onChange={handleChange('gender')}
                  >
                    <MenuItem value="Nam">Nam</MenuItem>
                    <MenuItem value="Nữ">Nữ</MenuItem>
                    <MenuItem value="Khác">Khác</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* CCCD */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="CCCD *"
                  fullWidth
                  value={formData.cccd}
                  onChange={handleChange('cccd')}
                />
              </Grid>

              {/* Số điện thoại */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Số điện thoại"
                  fullWidth
                  value={formData.phone}
                  onChange={handleChange('phone')}
                />
              </Grid>

              {/* Email */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Email *"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleChange('email')}
                />
              </Grid>

              {/* Divider */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  Thông tin tài khoản
                </Typography>
              </Grid>

              {/* Vai trò */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Vai trò</InputLabel>
                  <Select
                    label="Vai trò"
                    value={formData.role_id}
                    onChange={handleChange('role_id')}
                  >
                    <MenuItem value={1}>BQT (Ban quản trị)</MenuItem>
                    <MenuItem value={2}>Kế toán</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Username */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Username *"
                  fullWidth
                  value={formData.username}
                  onChange={handleChange('username')}
                />
              </Grid>

              {/* Mật khẩu */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Mật khẩu"
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={handleChange('password')}
                  helperText="Mật khẩu mặc định sẽ là '12345678' nếu bỏ trống"
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* Nút Thêm */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
        mt: 3
      }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/bod/admin/list')}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleCreateAdmin}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Đang tạo...' : 'Thêm quản trị viên'}
        </Button>
      </Box>
    </Paper>
  );
}