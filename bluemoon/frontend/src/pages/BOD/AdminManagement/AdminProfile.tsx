// src/pages/BOD/AdminManagement/AdminProfile.tsx
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
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { adminApi } from '../../../api/adminApi';

// Định nghĩa interface cho dữ liệu admin
interface AdminProfileData {
  id: string;
  username: string;
  email: string;
  phone: string;
  is_active: boolean;
  role_id: number;
  role_code: string;
  role_name: string;
  full_name: string;
  dob: string;
  gender: string;
  cccd: string;
}

export default function AdminProfile() {
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<AdminProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!id) {
        setError('Không tìm thấy ID người dùng.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await adminApi.getById(id);
        setUserData(data as unknown as AdminProfileData);
      } catch (err: any) {
        console.error('Error fetching admin data:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin người dùng.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [id]);

  const handleUpdateAdmin = () => {
    alert('Logic cập nhật tài khoản sẽ được thêm vào đây!');
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải thông tin...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (!userData) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Alert severity="warning">Không tìm thấy thông tin người dùng.</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      {/* Tiêu đề trang */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Hồ sơ Quản trị viên
      </Typography>

      <Grid container spacing={3}>
        {/* CỘT BÊN TRÁI: Avatar và ID */}
        <Grid size={{
          xs: 12,
          md: 4
        }}>
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
              }}
            />
            <Typography variant="h6" gutterBottom>
              {userData.full_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userData.username}
            </Typography>
          </Card>
        </Grid>

        {/* CỘT BÊN PHẢI: Form điền thông tin */}
        <Grid size={{
          xs: 12,
          md: 8
        }}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {/* (Các trường này được điền sẵn giá trị `defaultValue`) */}
              <Grid size={{
                xs: 12
              }}>
                <TextField label="Họ và tên" fullWidth defaultValue={userData.full_name} />
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <TextField
                  label="Ngày sinh"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  defaultValue={userData.dob}
                />
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <FormControl fullWidth>
                  <InputLabel>Giới tính</InputLabel>
                  <Select label="Giới tính" defaultValue={userData.gender}>
                    <MenuItem value="Nam">Nam</MenuItem>
                    <MenuItem value="Nữ">Nữ</MenuItem>
                    <MenuItem value="Khác">Khác</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <TextField label="CCCD" fullWidth defaultValue={userData.cccd} />
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <TextField label="Số điện thoại" fullWidth defaultValue={userData.phone} />
              </Grid>
              <Grid size={{
                xs: 12
              }}>
                <TextField label="Email" type="email" fullWidth defaultValue={userData.email} />
              </Grid>

              <Grid size={{
                xs: 12
              }}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  Thông tin tài khoản
                </Typography>
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <FormControl fullWidth>
                  <InputLabel>Vai trò</InputLabel>
                  <Select label="Vai trò" defaultValue={userData.role_id}>
                    <MenuItem value={1}>BQT (Ban quản trị)</MenuItem>
                    <MenuItem value={2}>Kế toán</MenuItem>
                    <MenuItem value={4}>Cơ quan chức năng</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <TextField label="Username" fullWidth defaultValue={userData.username} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <TextField
                  label="Mật khẩu"
                  type="password"
                  fullWidth
                  helperText="Bỏ trống nếu không muốn thay đổi mật khẩu"
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* Nút Cập nhật */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        mt: 3
      }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleUpdateAdmin}
        >
          Cập nhật thông tin
        </Button>
      </Box>
    </Paper>
  );
}