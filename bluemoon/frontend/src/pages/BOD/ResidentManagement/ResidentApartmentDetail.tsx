// src/pages/BOD/ResidentManagement/ResidentApartmentDetail.tsx
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import { apartmentApi, type Apartment } from '../../../api/apartmentApi';
import { vehicleApi, type Vehicle } from '../../../api/vehicleApi';
import type { Resident } from '../../../api/residentApi';

interface ApartmentDetail extends Apartment {
  handover_date?: string;
}

export default function ResidentApartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCQCN = location.pathname.startsWith('/cqcn');
  const basePath = isCQCN ? '/cqcn' : '/bod';

  const [apartment, setApartment] = useState<ApartmentDetail | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApartmentDetail = async () => {
      if (!id) {
        setError('Không tìm thấy mã căn hộ.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // API /apartments/:id đã trả về cả members rồi, không cần gọi 2 API riêng
        const apartmentData = await apartmentApi.getById(id);
        setApartment(apartmentData);

        // Backend trả về members trong response, sử dụng trực tiếp
        // (members là danh sách cư dân của căn hộ này)
        setResidents((apartmentData as any).members || []);

        // Fetch vehicles cho căn hộ này
        try {
          const vehiclesData = await vehicleApi.getAllVehicles({ apartment_id: Number(id) });
          setVehicles(vehiclesData);
        } catch (vehicleErr) {
          console.error('Error fetching vehicles:', vehicleErr);
          // Không throw error, chỉ log - không hiển thị xe nếu lỗi
        }
      } catch (err: any) {
        console.error('Error fetching apartment detail:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin căn hộ.');
      } finally {
        setLoading(false);
      }
    };

    fetchApartmentDetail();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đang sinh sống':
        return 'success';
      case 'Trống':
        return 'warning';
      case 'Đang sửa chữa':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải thông tin căn hộ...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`${basePath}/resident/lookup`)}
          sx={{ mb: 3 }}
        >
          Quay lại sơ đồ
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!apartment) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`${basePath}/resident/lookup`)}
          sx={{ mb: 3 }}
        >
          Quay lại sơ đồ
        </Button>
        <Alert severity="warning">Không tìm thấy thông tin căn hộ.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`${basePath}/resident/lookup`)}
        sx={{ mb: 3 }}
      >
        Quay lại sơ đồ
      </Button>

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HomeIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">Căn hộ {apartment.apartment_code}</Typography>
              <Typography variant="body1" color="text.secondary">
                Tòa {apartment.building} - Tầng {apartment.floor}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={apartment.status}
            color={getStatusColor(apartment.status) as any}
            sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2, px: 1 }}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          {/* Thông tin cơ bản */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Thông tin Căn hộ</Typography>
            <List>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemText primary="Diện tích" secondary={`${apartment.area} m²`} />
              </ListItem>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemText primary="Tòa nhà" secondary={`Tòa ${apartment.building}`} />
              </ListItem>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemText primary="Số lượng cư dân" secondary={`${residents.length} người`} />
              </ListItem>
            </List>
          </Grid>

          {/* Danh sách thành viên */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">Danh sách Cư dân</Typography>
            </Box>

            {residents.length > 0 ? (
              <Grid container spacing={2}>
                {residents.map((member) => (
                  <Grid size={{ xs: 12 }} key={member.id}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:hover': { bgcolor: '#f5f5f5', cursor: 'pointer' }
                      }}
                      onClick={() => navigate(`${basePath}/resident/profile/${member.id}`)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{
                          bgcolor: member.role === 'owner' ? 'primary.main' : 'secondary.main',
                          mr: 2
                        }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">{member.full_name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {member.role || 'Thành viên'} • {member.gender || 'N/A'} • {member.dob ? (() => {
                              // Tránh lỗi timezone: parse trực tiếp date-only string
                              const dobStr = member.dob.includes('T') ? member.dob.split('T')[0] : member.dob;
                              const [year, month, day] = dobStr.split('-');
                              return `${parseInt(day)}/${parseInt(month)}/${year}`;
                            })() : 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <PhoneIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">{member.phone || 'Chưa cập nhật'}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Căn hộ này chưa có cư dân nào được đăng ký.
                </Typography>
                <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate(`${basePath}/resident/create`)}>
                  Thêm cư dân mới
                </Button>
              </Paper>
            )}
          </Grid>
        </Grid>

        {/* Section: Phương tiện đăng ký */}
        <Divider sx={{ my: 4 }} />
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Phương tiện đăng ký
        </Typography>
        {vehicles.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Căn hộ này chưa có phương tiện nào được đăng ký.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Loại xe</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Biển số</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Hãng / Model</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Chủ xe</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {v.vehicle_type === 'Ô tô' ? '🚗' : '🏍️'} {v.vehicle_type}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                      {v.license_plate}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {v.brand || 'N/A'} {v.model ? `- ${v.model}` : ''}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {v.owner_name || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <Box component="span" sx={{
                        px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.85rem',
                        bgcolor: v.status === 'Đang sử dụng' ? '#e8f5e9' : v.status === 'Chờ duyệt' ? '#fff3e0' : '#f5f5f5',
                        color: v.status === 'Đang sử dụng' ? '#2e7d32' : v.status === 'Chờ duyệt' ? '#e65100' : '#666'
                      }}>
                        {v.status}
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Paper>
    </Box>
  );
}