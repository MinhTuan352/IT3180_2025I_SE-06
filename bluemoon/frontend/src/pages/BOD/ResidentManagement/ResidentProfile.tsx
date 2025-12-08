// src/pages/BOD/ResidentManagement/ResidentProfile.tsx
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
  type SelectChangeEvent,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { residentApi, type Resident } from '../../../api/residentApi';

export default function ResidentProfile() {
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<Resident | null>(null);
  const [currentRole, setCurrentRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResident = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await residentApi.getById(id);
        // Handle response structure
        const data = (response as any).data || response;
        setUserData(data);
        setCurrentRole(data.role || '');
      } catch (err: any) {
        console.error('Error fetching resident:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin cư dân.');
      } finally {
        setLoading(false);
      }
    };

    fetchResident();
  }, [id]);

  const handleRoleChange = (event: SelectChangeEvent) => {
    setCurrentRole(event.target.value as string);
  };

  const handleUpdateResident = async () => {
    if (!id || !userData) return;

    try {
      await residentApi.update(id, {
        ...userData,
        role: currentRole as 'owner' | 'member'
      });
      alert('Cập nhật thành công!');
    } catch (err: any) {
      alert('Lỗi: ' + (err.response?.data?.message || 'Không thể cập nhật.'));
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
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
        <Alert severity="warning">Không tìm thấy thông tin cư dân với ID: {id}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Hồ sơ Cư dân
      </Typography>

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
            <Avatar sx={{ width: 120, height: 120, mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}>
              {userData.full_name?.charAt(0) || '?'}
            </Avatar>
            <Typography variant="h6" gutterBottom>
              {id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Căn hộ: {userData.apartment_code || 'N/A'}
            </Typography>
          </Card>
        </Grid>

        {/* CỘT BÊN PHẢI: Form điền thông tin */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Họ và tên"
                  fullWidth
                  value={userData.full_name || ''}
                  onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Số căn hộ"
                  fullWidth
                  value={userData.apartment_code || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Ngày sinh"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={userData.dob || ''}
                  onChange={(e) => setUserData({ ...userData, dob: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Giới tính</InputLabel>
                  <Select
                    label="Giới tính"
                    value={userData.gender || ''}
                    onChange={(e) => setUserData({ ...userData, gender: e.target.value })}
                  >
                    <MenuItem value="Nam">Nam</MenuItem>
                    <MenuItem value="Nữ">Nữ</MenuItem>
                    <MenuItem value="Khác">Khác</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Quê quán"
                  fullWidth
                  value={userData.hometown || ''}
                  onChange={(e) => setUserData({ ...userData, hometown: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nghề nghiệp"
                  fullWidth
                  value={userData.occupation || ''}
                  onChange={(e) => setUserData({ ...userData, occupation: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="CCCD"
                  fullWidth
                  value={userData.cccd || ''}
                  onChange={(e) => setUserData({ ...userData, cccd: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Số điện thoại"
                  fullWidth
                  value={userData.phone || ''}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={userData.email || ''}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  Thông tin Cư trú & Tài khoản
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Quyền hạn</InputLabel>
                  <Select
                    label="Quyền hạn"
                    value={currentRole}
                    onChange={handleRoleChange}
                  >
                    <MenuItem value="owner">Chủ hộ</MenuItem>
                    <MenuItem value="member">Thành viên</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tình trạng</InputLabel>
                  <Select
                    label="Tình trạng"
                    value={userData.status || ''}
                    onChange={(e) => setUserData({ ...userData, status: e.target.value })}
                  >
                    <MenuItem value="Đang sinh sống">Đang sinh sống</MenuItem>
                    <MenuItem value="Đã chuyển đi">Đã chuyển đi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Khối tài khoản (Conditional) */}
              {currentRole === 'owner' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Username (tài khoản Cư dân)"
                      fullWidth
                      value={userData.user_id || ''}
                      helperText="Cư dân sẽ dùng tài khoản này để đăng nhập"
                      sx={{ mt: 2 }}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Mật khẩu (tài khoản Cư dân)"
                      type="password"
                      fullWidth
                      helperText="Bỏ trống nếu không muốn đổi mật khẩu"
                      sx={{ mt: 2 }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        mt: 3
      }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleUpdateResident}
        >
          Cập nhật
        </Button>
      </Box>
    </Paper>
  );
}