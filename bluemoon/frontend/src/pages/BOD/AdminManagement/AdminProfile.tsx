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
  Chip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axiosClient from '../../../api/axiosClient';

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
  const navigate = useNavigate();
  const [userData, setUserData] = useState<AdminProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    gender: '',
    cccd: '',
    phone: '',
    email: '',
    role_id: 1,
    newPassword: '',
  });

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
        const response = await axiosClient.get(`/users/${id}`);
        const data = response.data.data || response.data;
        setUserData(data);

        // Initialize form with fetched data
        setFormData({
          full_name: data.full_name || '',
          dob: data.dob ? data.dob.split('T')[0] : '',
          gender: data.gender || 'Nam',
          cccd: data.cccd || '',
          phone: data.phone || '',
          email: data.email || '',
          role_id: data.role_id || 1,
          newPassword: '',
        });
      } catch (err: any) {
        console.error('Error fetching admin data:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin người dùng.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [id]);

  const handleChange = (field: string) => (e: any) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleUpdateAdmin = async () => {
    if (!id) return;

    setSaving(true);
    try {
      // 1. Cập nhật thông tin cá nhân
      await axiosClient.put(`/users/${id}`, {
        email: formData.email,
        phone: formData.phone,
        role_id: formData.role_id,
        full_name: formData.full_name,
        dob: formData.dob || null,
        gender: formData.gender,
        cccd: formData.cccd,
      });

      // 2. Cập nhật mật khẩu nếu có
      if (formData.newPassword) {
        await axiosClient.post(`/users/${id}/reset-password`, {
          newPassword: formData.newPassword,
        });
        toast.success('Đã cập nhật mật khẩu thành công!');
      }

      // Cập nhật lại userData trong state
      setUserData(prev => prev ? {
        ...prev,
        email: formData.email,
        phone: formData.phone,
        role_id: formData.role_id,
        full_name: formData.full_name,
        dob: formData.dob,
        gender: formData.gender,
        cccd: formData.cccd,
      } : null);

      toast.success('Thông tin đã được lưu!');

    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!id || !userData) return;

    try {
      const newStatus = !userData.is_active;
      await axiosClient.put(`/users/${id}/status`, { is_active: newStatus });
      setUserData({ ...userData, is_active: newStatus });
      toast.success(newStatus ? 'Đã mở khóa tài khoản!' : 'Đã khóa tài khoản!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
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
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/bod/admin/list')} sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
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

  const getRoleColor = (roleId: number) => {
    switch (roleId) {
      case 1: return 'primary';
      case 2: return 'secondary';
      case 4: return 'info';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/bod/admin/list')} sx={{ mr: 2 }}>
          Quay lại
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold', flex: 1 }}>
          Hồ sơ Quản trị viên
        </Typography>
        <Chip
          label={userData.is_active ? 'Đang hoạt động' : 'Đã khóa'}
          color={userData.is_active ? 'success' : 'error'}
          sx={{ mr: 1 }}
        />
        <Button
          variant="outlined"
          color={userData.is_active ? 'error' : 'success'}
          onClick={handleToggleStatus}
          size="small"
        >
          {userData.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
        </Button>
      </Box>

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
                bgcolor: getRoleColor(userData.role_id) + '.main',
                fontSize: '3rem',
              }}
            >
              {userData.full_name ? userData.full_name[0].toUpperCase() : '?'}
            </Avatar>
            <Typography variant="h6" gutterBottom>
              {userData.full_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              @{userData.username}
            </Typography>
            <Chip
              label={userData.role_name || (userData.role_id === 1 ? 'Ban Quản Trị' : 'Kế toán')}
              color={getRoleColor(userData.role_id) as any}
              size="small"
            />
          </Card>
        </Grid>

        {/* CỘT BÊN PHẢI: Form điền thông tin */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Họ và tên"
                  fullWidth
                  value={formData.full_name}
                  onChange={handleChange('full_name')}
                />
              </Grid>
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="CCCD"
                  fullWidth
                  value={formData.cccd}
                  onChange={handleChange('cccd')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Số điện thoại"
                  fullWidth
                  value={formData.phone}
                  onChange={handleChange('phone')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleChange('email')}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  Thông tin tài khoản
                </Typography>
              </Grid>
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
                    <MenuItem value={4}>Cơ quan chức năng</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Username"
                  fullWidth
                  value={userData.username}
                  InputProps={{ readOnly: true }}
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Mật khẩu mới"
                  type="password"
                  fullWidth
                  value={formData.newPassword}
                  onChange={handleChange('newPassword')}
                  helperText="Bỏ trống nếu không muốn thay đổi mật khẩu"
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* Nút Cập nhật */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleUpdateAdmin}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {saving ? 'Đang lưu...' : 'Cập nhật thông tin'}
        </Button>
      </Box>
    </Paper>
  );
}