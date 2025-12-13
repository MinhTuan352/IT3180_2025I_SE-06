// src/pages/BOD/ResidentManagement/ResidentProfile.tsx
import { useState, useEffect } from 'react';
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
  Snackbar,
  type SelectChangeEvent,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { residentApi, type Resident } from '../../../api/residentApi';
import { apartmentApi, type Apartment } from '../../../api/apartmentApi';

export default function ResidentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<Resident | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch resident and apartments in parallel
        const [resResponse, aptsData] = await Promise.all([
          residentApi.getById(id),
          apartmentApi.getAll()
        ]);

        // Handle response structure
        const data = (resResponse as any).data || resResponse;
        setUserData(data);
        setApartments(aptsData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin cư dân.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (field: keyof Resident) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!userData) return;
    setUserData({ ...userData, [field]: e.target.value });
  };

  const handleSelectChange = (field: keyof Resident) => (e: SelectChangeEvent) => {
    if (!userData) return;
    setUserData({ ...userData, [field]: e.target.value });
  };

  // Helper formatting Date for Input (YYYY-MM-DD)
  // Không dùng new Date() để tránh lỗi timezone khi parse date-only string
  const formatDateForInput = (isoDate?: string) => {
    if (!isoDate) return '';
    try {
      // Nếu là ISO string với time component (có chữ T), lấy phần date
      if (isoDate.includes('T')) {
        return isoDate.split('T')[0];
      }
      // Nếu đã là YYYY-MM-DD thì return luôn
      if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
        return isoDate;
      }
      return '';
    } catch (e) {
      return '';
    }
  };

  const handleUpdateResident = async () => {
    if (!id || !userData) return;

    setSaving(true);
    try {
      await residentApi.update(id, userData);
      setSnackbar({ open: true, message: 'Cập nhật thành công!', severity: 'success' });
    } catch (err: any) {
      console.error('Error updating resident:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Không thể cập nhật. Vui lòng thử lại.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResident = async () => {
    if (!id) return;

    if (!window.confirm('Bạn có chắc chắn muốn xóa cư dân này?')) return;

    try {
      await residentApi.delete(id);
      setSnackbar({ open: true, message: 'Đã xóa cư dân!', severity: 'success' });
      setTimeout(() => navigate('/bod/resident/list'), 1500);
    } catch (err: any) {
      console.error('Error deleting resident:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Không thể xóa cư dân.',
        severity: 'error'
      });
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
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
              {userData.full_name}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
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
                  onChange={handleChange('full_name')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Căn hộ</InputLabel>
                  <Select
                    label="Căn hộ"
                    value={String(userData.apartment_id) || ''}
                    onChange={handleSelectChange('apartment_id' as any)}
                  >
                    {apartments.map(apt => (
                      <MenuItem key={apt.id} value={String(apt.id)}>
                        {apt.apartment_code}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Ngày sinh"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formatDateForInput(userData.dob)}
                  onChange={handleChange('dob')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Giới tính</InputLabel>
                  <Select
                    label="Giới tính"
                    value={userData.gender || ''}
                    onChange={handleSelectChange('gender')}
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
                  onChange={handleChange('hometown')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nghề nghiệp"
                  fullWidth
                  value={userData.occupation || ''}
                  onChange={handleChange('occupation')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="CCCD"
                  fullWidth
                  value={userData.cccd || ''}
                  onChange={handleChange('cccd')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Số điện thoại"
                  fullWidth
                  value={userData.phone || ''}
                  onChange={handleChange('phone')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={userData.email || ''}
                  onChange={handleChange('email')}
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
                    value={userData.role || ''}
                    onChange={handleSelectChange('role')}
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
                    onChange={handleSelectChange('status')}
                  >
                    <MenuItem value="Đang sinh sống">Đang sinh sống</MenuItem>
                    <MenuItem value="Đã chuyển đi">Đã chuyển đi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* User account info (if owner) */}
              {userData.role === 'owner' && userData.user_id && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Tài khoản liên kết: User ID {userData.user_id}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDeleteResident}
        >
          Xóa cư dân
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/bod/resident/list')}
          >
            Quay lại
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleUpdateResident}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {saving ? 'Đang lưu...' : 'Cập nhật'}
          </Button>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}