// src/pages/BOD/ResidentManagement/ResidentCreate.tsx
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
import { useNavigate } from 'react-router-dom';
import { residentApi } from '../../../api/residentApi';
import { apartmentApi, type Apartment } from '../../../api/apartmentApi';

interface FormData {
  id: string;
  full_name: string;
  apartment_id: string;
  role: 'owner' | 'member';
  dob: string;
  gender: string;
  cccd: string;
  phone: string;
  email: string;
  status: string;
  hometown: string;
  occupation: string;
}

const initialFormData: FormData = {
  id: '',
  full_name: '',
  apartment_id: '',
  role: 'member',
  dob: '',
  gender: 'Nam',
  cccd: '',
  phone: '',
  email: '',
  status: 'Đang sinh sống',
  hometown: '',
  occupation: ''
};

export default function ResidentCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingApts, setLoadingApts] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  // Fetch apartments for dropdown
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const data = await apartmentApi.getAll();
        setApartments(data);
      } catch (error) {
        console.error('Error fetching apartments:', error);
      } finally {
        setLoadingApts(false);
      }
    };
    fetchApartments();
  }, []);

  // Generate next resident ID
  useEffect(() => {
    const generateId = async () => {
      try {
        const residents = await residentApi.getAll();
        // Get highest ID number
        const ids = residents.map(r => {
          const match = r.id.match(/R(\d+)/);
          return match ? parseInt(match[1]) : 0;
        });
        const maxId = Math.max(0, ...ids);
        const newId = `R${String(maxId + 1).padStart(4, '0')}`;
        setFormData(prev => ({ ...prev, id: newId }));
      } catch (error) {
        // Fallback ID
        setFormData(prev => ({ ...prev, id: `R${Date.now()}` }));
      }
    };
    generateId();
  }, []);

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSelectChange = (field: keyof FormData) => (e: SelectChangeEvent) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleCreateResident = async () => {
    // Validate required fields
    if (!formData.full_name || !formData.apartment_id || !formData.cccd) {
      setSnackbar({ open: true, message: 'Vui lòng điền đầy đủ: Họ tên, Căn hộ, CCCD', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      await residentApi.create({
        ...formData,
        apartment_id: parseInt(formData.apartment_id)
      } as any);

      setSnackbar({ open: true, message: 'Thêm cư dân thành công!', severity: 'success' });

      // Navigate back after short delay
      setTimeout(() => {
        navigate('/bod/resident/list');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating resident:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Không thể thêm cư dân. Vui lòng thử lại.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Tạo hồ sơ Cư dân
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
              {formData.full_name?.charAt(0) || '?'}
            </Avatar>
            <Typography variant="h6" gutterBottom color="primary">
              {formData.id || 'ID tự động'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID sẽ được tạo tự động.
            </Typography>
          </Card>
        </Grid>

        {/* CỘT BÊN PHẢI: Form điền thông tin */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {/* Họ và tên */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Họ và tên *"
                  fullWidth
                  value={formData.full_name}
                  onChange={handleChange('full_name')}
                />
              </Grid>

              {/* Chọn căn hộ */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Căn hộ *</InputLabel>
                  <Select
                    label="Căn hộ *"
                    value={formData.apartment_id}
                    onChange={handleSelectChange('apartment_id')}
                    disabled={loadingApts}
                  >
                    {loadingApts ? (
                      <MenuItem disabled>Đang tải...</MenuItem>
                    ) : (
                      apartments.map(apt => (
                        <MenuItem key={apt.id} value={String(apt.id)}>
                          {apt.apartment_code}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
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
                    onChange={handleSelectChange('gender')}
                  >
                    <MenuItem value="Nam">Nam</MenuItem>
                    <MenuItem value="Nữ">Nữ</MenuItem>
                    <MenuItem value="Khác">Khác</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Quê quán */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Quê quán"
                  fullWidth
                  value={formData.hometown}
                  onChange={handleChange('hometown')}
                />
              </Grid>

              {/* Nghề nghiệp */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nghề nghiệp"
                  fullWidth
                  value={formData.occupation}
                  onChange={handleChange('occupation')}
                />
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
                  label="Email"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleChange('email')}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  Thông tin Cư trú
                </Typography>
              </Grid>

              {/* Quyền hạn */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Quyền hạn</InputLabel>
                  <Select
                    label="Quyền hạn"
                    value={formData.role}
                    onChange={handleSelectChange('role')}
                  >
                    <MenuItem value="owner">Chủ hộ</MenuItem>
                    <MenuItem value="member">Thành viên</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Tình trạng */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tình trạng</InputLabel>
                  <Select
                    label="Tình trạng"
                    value={formData.status}
                    onChange={handleSelectChange('status')}
                  >
                    <MenuItem value="Đang sinh sống">Đang sinh sống</MenuItem>
                    <MenuItem value="Đã chuyển đi">Đã chuyển đi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/bod/resident/list')}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleCreateResident}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Đang tạo...' : 'Thêm cư dân'}
        </Button>
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