// src/pages/Resident/Profile/ResidentProfileEdit.tsx
import { Typography, Paper, Grid, TextField, Button, Avatar, Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel, Card, Box } from '@mui/material';
import { useState, useEffect } from 'react';
import { residentApi, type Resident } from '../../../api/residentApi';
import { vehicleApi, type Vehicle } from '../../../api/vehicleApi';

export default function ResidentProfileEdit() {
    // State cho dữ liệu profile
    const [profileData, setProfileData] = useState<Resident | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    // State cho form (các trường được phép sửa)
    const [formData, setFormData] = useState({
        phone: '',
        email: '',
        hometown: '',
        occupation: ''
    });



    // Fetch dữ liệu khi component mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await residentApi.getMyProfile();
            setProfileData(data);
            // Khởi tạo form data từ dữ liệu nhận được
            setFormData({
                phone: data.phone || '',
                email: data.email || '',
                hometown: data.hometown || '',
                occupation: data.occupation || ''
            });

            // Fetch vehicles
            const vehiclesData = await vehicleApi.getMyVehicles();
            setVehicles(vehiclesData);
        } catch (err: any) {
            console.error('Error fetching profile:', err);
            setError(err.response?.data?.message || 'Không thể tải thông tin cá nhân. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };





    // Hiển thị loading
    if (loading) {
        return (
            <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Paper>
        );
    }

    // Hiển thị lỗi
    if (error) {
        return (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="contained" onClick={fetchProfile}>
                    Thử lại
                </Button>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Thông tin Cá nhân
            </Typography>
            <Grid container spacing={3}>
                {/* Avatar Column */}
                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'center' }}>
                    <Avatar
                        sx={{ width: 120, height: 120, mb: 2, margin: 'auto', bgcolor: 'primary.main', fontSize: '3rem' }}
                    >
                        {profileData?.full_name?.charAt(0) || 'U'}
                    </Avatar>
                    {/* Avatar change button removed */}
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        {profileData?.full_name || 'Chưa có tên'}
                    </Typography>
                    <Typography color="text.secondary">
                        Căn hộ: {profileData?.apartment_code || 'N/A'}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        {profileData?.role === 'owner' ? 'Chủ hộ' : 'Thành viên'}
                    </Typography>
                </Grid>

                {/* Info Column */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Grid container spacing={2}>
                        {/* Các trường KHÔNG được sửa */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Họ và tên"
                                fullWidth
                                value={profileData?.full_name || ''}
                                InputProps={{ readOnly: true }}
                                helperText="Liên hệ BQL để thay đổi thông tin này."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Ngày sinh"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={profileData?.dob ? new Date(profileData.dob).toISOString().split('T')[0] : ''}
                                InputProps={{ readOnly: true }}
                                helperText="Liên hệ BQL để thay đổi."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Giới tính</InputLabel>
                                <Select
                                    value={profileData?.gender || ''}
                                    label="Giới tính"
                                    inputProps={{ readOnly: true }}
                                >
                                    <MenuItem value="Nam">Nam</MenuItem>
                                    <MenuItem value="Nữ">Nữ</MenuItem>
                                    <MenuItem value="Khác">Khác</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Các trường ĐƯỢC sửa */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Số điện thoại"
                                fullWidth
                                name="phone"
                                value={formData.phone}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Email"
                                type="email"
                                fullWidth
                                name="email"
                                value={formData.email}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Quê quán"
                                fullWidth
                                name="hometown"
                                value={formData.hometown}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Nghề nghiệp"
                                fullWidth
                                name="occupation"
                                value={formData.occupation}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        {/* Trường KHÔNG được sửa */}
                        <Grid size={12}>
                            <TextField
                                label="CCCD"
                                fullWidth
                                value={profileData?.cccd || ''}
                                InputProps={{ readOnly: true }}
                                helperText="Liên hệ BQL để thay đổi thông tin này."
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Save button removed */}

            {/* Section: Xe của tôi */}
            <Card sx={{ mt: 3, p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Xe của tôi
                </Typography>
                {vehicles.length === 0 ? (
                    <Alert severity="info">Bạn chưa đăng ký phương tiện nào.</Alert>
                ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Loại xe</th>
                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Biển số</th>
                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Hãng / Model</th>
                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehicles.map((v) => (
                                    <tr key={v.id}>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                            {v.vehicle_type === 'Ô tô' ? '🚗' : '🏍️'} {v.vehicle_type}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                                            {v.license_plate}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                            {v.brand || 'N/A'} {v.model ? `- ${v.model}` : ''}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
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
            </Card>

        </Paper>
    );
}