// src/pages/Resident/Apartment/ResidentApartmentInfo.tsx
import {
    Box, Typography, Paper, Grid, Avatar, Chip, Divider,
    List, ListItem, ListItemAvatar, ListItemText,
    CircularProgress, Alert, Button,
    Dialog, DialogContent, DialogActions,
    IconButton, Stack, Modal, TextField, FormControl, InputLabel, Select, MenuItem, Snackbar
} from '@mui/material';
import { useState, useEffect } from 'react';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import LayersIcon from '@mui/icons-material/Layers';
import HomeIcon from '@mui/icons-material/Home';
import CloseIcon from '@mui/icons-material/Close';
import CakeIcon from '@mui/icons-material/Cake';
import WcIcon from '@mui/icons-material/Wc';
import BadgeIcon from '@mui/icons-material/Badge';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { apartmentApi } from '../../../api/apartmentApi';
import { vehicleApi, type Vehicle } from '../../../api/vehicleApi';

interface Member {
    id: string;
    full_name: string;
    role: 'owner' | 'member';
    phone?: string;
    email?: string;
    gender?: string;
    dob?: string;
    status?: string;
}

interface ApartmentWithMembers {
    id: number;
    apartment_code: string;
    building: string;
    floor: number;
    area: number;
    status: string;
    members: Member[];
}

// Member Detail Modal Component
interface MemberDetailModalProps {
    open: boolean;
    onClose: () => void;
    member: Member | null;
}

function MemberDetailModal({ open, onClose, member }: MemberDetailModalProps) {
    if (!member) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Chưa cập nhật';
        try {
            // Xử lý date-only string (YYYY-MM-DD) để tránh lỗi timezone
            // Parse trực tiếp thay vì dùng new Date() để tránh bị lùi 1 ngày
            if (dateString.includes('T')) {
                // ISO string với time component
                const date = new Date(dateString);
                return date.toLocaleDateString('vi-VN');
            } else {
                // Date-only string: "1980-01-01"
                const parts = dateString.split('-');
                if (parts.length === 3) {
                    const [year, month, day] = parts;
                    return `${parseInt(day)}/${parseInt(month)}/${year}`;
                }
                return dateString;
            }
        } catch {
            return dateString;
        }
    };

    const getGenderText = (gender?: string) => {
        if (!gender) return 'Chưa cập nhật';
        switch (gender.toLowerCase()) {
            case 'male':
            case 'nam':
                return 'Nam';
            case 'female':
            case 'nữ':
            case 'nu':
                return 'Nữ';
            default:
                return gender;
        }
    };

    const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, borderBottom: '1px solid', borderColor: 'grey.100' }}>
            <Box sx={{ color: 'primary.main', mr: 2, display: 'flex', alignItems: 'center' }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                    {label}
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                    {value}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, overflow: 'hidden' }
            }}
        >
            {/* Header with gradient background */}
            <Box
                sx={{
                    background: member.role === 'owner'
                        ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
                        : 'linear-gradient(135deg, #546e7a 0%, #90a4ae 100%)',
                    color: 'white',
                    pt: 3,
                    pb: 5,
                    px: 3,
                    position: 'relative'
                }}
            >
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <Typography variant="h6" fontWeight="bold" textAlign="center">
                    Thông tin cá nhân
                </Typography>
            </Box>

            {/* Avatar centered overlapping header and content */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: -4, mb: 2 }}>
                <Avatar
                    sx={{
                        width: 80,
                        height: 80,
                        bgcolor: member.role === 'owner' ? 'primary.main' : 'grey.500',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        border: '4px solid white',
                        boxShadow: 3
                    }}
                >
                    {member.full_name?.charAt(0) || 'U'}
                </Avatar>
            </Box>

            <DialogContent sx={{ pt: 0 }}>
                {/* Name and Role */}
                <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold" textAlign="center">
                        {member.full_name}
                    </Typography>
                    <Chip
                        label={member.role === 'owner' ? 'Chủ hộ' : 'Thành viên'}
                        color={member.role === 'owner' ? 'primary' : 'default'}
                        size="small"
                    />
                    {member.status && (
                        <Chip
                            label={member.status}
                            color="success"
                            size="small"
                            variant="outlined"
                        />
                    )}
                </Stack>

                {/* Info Rows */}
                <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, px: 2 }}>
                    <InfoRow
                        icon={<PhoneIcon />}
                        label="Số điện thoại"
                        value={member.phone || 'Chưa cập nhật'}
                    />
                    <InfoRow
                        icon={<EmailIcon />}
                        label="Email"
                        value={member.email || 'Chưa cập nhật'}
                    />
                    <InfoRow
                        icon={<WcIcon />}
                        label="Giới tính"
                        value={getGenderText(member.gender)}
                    />
                    <InfoRow
                        icon={<CakeIcon />}
                        label="Ngày sinh"
                        value={formatDate(member.dob)}
                    />
                    <InfoRow
                        icon={<BadgeIcon />}
                        label="Vai trò"
                        value={member.role === 'owner' ? 'Chủ hộ' : 'Thành viên'}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    fullWidth
                    sx={{ borderRadius: 2 }}
                >
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function ResidentApartmentInfo() {
    const [apartment, setApartment] = useState<ApartmentWithMembers | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [memberModalOpen, setMemberModalOpen] = useState(false);

    // Vehicle states
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [openVehicleModal, setOpenVehicleModal] = useState(false);
    const [vehicleFormData, setVehicleFormData] = useState({
        vehicle_type: 'Xe máy' as 'Ô tô' | 'Xe máy',
        license_plate: '',
        brand: '',
        model: ''
    });
    const [vehicleFiles, setVehicleFiles] = useState<{ vehicle_image?: File; registration_cert?: File }>({});
    const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success'
    });

    useEffect(() => {
        fetchApartment();
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const vehiclesData = await vehicleApi.getMyVehicles();
            setVehicles(vehiclesData);
        } catch (err) {
            console.error('Error fetching vehicles:', err);
        }
    };

    const fetchApartment = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apartmentApi.getMyApartment();
            setApartment(data);
        } catch (err: any) {
            console.error('Error fetching apartment:', err);
            setError(err.response?.data?.message || 'Không thể tải thông tin căn hộ. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const handleMemberClick = (member: Member) => {
        setSelectedMember(member);
        setMemberModalOpen(true);
    };

    const handleCloseMemberModal = () => {
        setMemberModalOpen(false);
        setSelectedMember(null);
    };

    // Loading state
    if (loading) {
        return (
            <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Paper>
        );
    }

    // Error state
    if (error) {
        return (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="contained" onClick={fetchApartment}>
                    Thử lại
                </Button>
            </Paper>
        );
    }

    // No apartment data
    if (!apartment) {
        return (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Alert severity="info">
                    Không tìm thấy thông tin căn hộ.
                </Alert>
            </Paper>
        );
    }

    // Info box component for reuse
    const InfoBox = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                height: '100%',
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: 100
            }}
        >
            <Box sx={{ color: 'primary.main', mb: 1 }}>{icon}</Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>
            <Typography variant="h5" fontWeight="bold" color="text.primary">{value}</Typography>
        </Paper>
    );

    return (
        <Box>
            {/* Apartment Info Card */}
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3,
                    flexWrap: 'wrap',
                    gap: 2
                }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                        <ApartmentIcon fontSize="large" />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            Căn hộ {apartment.apartment_code}
                        </Typography>
                        <Chip
                            label={apartment.status}
                            color={apartment.status === 'Đang sinh sống' ? 'success' : 'warning'}
                            size="small"
                            sx={{ mt: 0.5 }}
                        />
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Responsive Grid for apartment details - FULL WIDTH */}
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <InfoBox
                            icon={<HomeIcon fontSize="large" />}
                            label="Tòa nhà"
                            value={apartment.building}
                        />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <InfoBox
                            icon={<LayersIcon fontSize="large" />}
                            label="Tầng"
                            value={apartment.floor}
                        />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <InfoBox
                            icon={<SquareFootIcon fontSize="large" />}
                            label="Diện tích"
                            value={`${apartment.area} m²`}
                        />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <InfoBox
                            icon={<PersonIcon fontSize="large" />}
                            label="Số thành viên"
                            value={apartment.members?.length || 0}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Members List Card */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Danh sách Thành viên
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Nhấn vào thành viên để xem thông tin chi tiết
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {apartment.members && apartment.members.length > 0 ? (
                    <List disablePadding>
                        {apartment.members.map((member, index) => (
                            <Box key={member.id}>
                                <ListItem
                                    alignItems="flex-start"
                                    onClick={() => handleMemberClick(member)}
                                    sx={{
                                        px: 1,
                                        py: 2,
                                        cursor: 'pointer',
                                        borderRadius: 2,
                                        transition: 'background-color 0.2s',
                                        '&:hover': {
                                            bgcolor: 'primary.50',
                                            '& .MuiAvatar-root': {
                                                transform: 'scale(1.05)',
                                                boxShadow: 2
                                            }
                                        }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{
                                            bgcolor: member.role === 'owner' ? 'primary.main' : 'grey.400',
                                            width: 48,
                                            height: 48,
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}>
                                            {member.full_name?.charAt(0) || 'U'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        sx={{ ml: 1 }}
                                        primary={
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                flexWrap: 'wrap'
                                            }}>
                                                <Typography fontWeight="bold" variant="subtitle1">{member.full_name}</Typography>
                                                <Chip
                                                    label={member.role === 'owner' ? 'Chủ hộ' : 'Thành viên'}
                                                    size="small"
                                                    color={member.role === 'owner' ? 'primary' : 'default'}
                                                    variant={member.role === 'owner' ? 'filled' : 'outlined'}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                                {member.phone && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {member.phone}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {member.email && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {member.email}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < apartment.members.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                ) : (
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        Không có thành viên nào trong căn hộ.
                    </Typography>
                )}
            </Paper>

            {/* Member Detail Modal */}
            <MemberDetailModal
                open={memberModalOpen}
                onClose={handleCloseMemberModal}
                member={selectedMember}
            />

            {/* Vehicle Section */}
            <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DirectionsCarIcon color="primary" /> Xe của căn hộ
                    </Typography>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => setOpenVehicleModal(true)}
                    >
                        Đăng ký xe
                    </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {vehicles.length === 0 ? (
                    <Alert severity="info">Căn hộ chưa đăng ký phương tiện nào.</Alert>
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
                                            {v.vehicle_type === 'Ô tô' ? <DirectionsCarIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} color="primary" /> : <TwoWheelerIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} color="secondary" />}
                                            {v.vehicle_type}
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
            </Paper>

            {/* Vehicle Registration Modal */}
            <Modal open={openVehicleModal} onClose={() => setOpenVehicleModal(false)}>
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: { xs: '95%', sm: 500 }, bgcolor: 'background.paper', borderRadius: 2,
                    boxShadow: 24, p: 4, maxHeight: '90vh', overflow: 'auto'
                }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DirectionsCarIcon color="primary" /> Đăng ký xe mới
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Điền đầy đủ thông tin để đăng ký phương tiện. Sau khi đăng ký, xe sẽ ở trạng thái "Chờ duyệt".
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid size={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Loại xe *</InputLabel>
                                <Select
                                    value={vehicleFormData.vehicle_type}
                                    label="Loại xe *"
                                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicle_type: e.target.value as 'Ô tô' | 'Xe máy' })}
                                >
                                    <MenuItem value="Xe máy">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TwoWheelerIcon fontSize="small" /> Xe máy
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="Ô tô">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DirectionsCarIcon fontSize="small" /> Ô tô
                                        </Box>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Biển số xe *"
                                fullWidth
                                required
                                placeholder="VD: 29A-12345"
                                value={vehicleFormData.license_plate}
                                onChange={(e) => setVehicleFormData({ ...vehicleFormData, license_plate: e.target.value.toUpperCase() })}
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                label="Hãng xe"
                                fullWidth
                                placeholder="VD: Honda, Toyota"
                                value={vehicleFormData.brand}
                                onChange={(e) => setVehicleFormData({ ...vehicleFormData, brand: e.target.value })}
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                label="Model"
                                fullWidth
                                placeholder="VD: Vios, Air Blade"
                                value={vehicleFormData.model}
                                onChange={(e) => setVehicleFormData({ ...vehicleFormData, model: e.target.value })}
                            />
                        </Grid>

                        {/* File Upload */}
                        <Grid size={12}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                                Ảnh xe (không bắt buộc)
                            </Typography>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setVehicleFiles({ ...vehicleFiles, vehicle_image: e.target.files[0] });
                                    }
                                }}
                            />
                            {vehicleFiles.vehicle_image && (
                                <Typography variant="caption" color="success.main">
                                    Đã chọn: {vehicleFiles.vehicle_image.name}
                                </Typography>
                            )}
                        </Grid>
                        <Grid size={12}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                                Ảnh đăng ký xe (không bắt buộc)
                            </Typography>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setVehicleFiles({ ...vehicleFiles, registration_cert: e.target.files[0] });
                                    }
                                }}
                            />
                            {vehicleFiles.registration_cert && (
                                <Typography variant="caption" color="success.main">
                                    Đã chọn: {vehicleFiles.registration_cert.name}
                                </Typography>
                            )}
                        </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={() => setOpenVehicleModal(false)}>Hủy</Button>
                        <Button
                            variant="contained"
                            color="success"
                            disabled={vehicleSubmitting || !vehicleFormData.license_plate.trim()}
                            onClick={async () => {
                                try {
                                    setVehicleSubmitting(true);

                                    const formData = new FormData();
                                    formData.append('vehicle_type', vehicleFormData.vehicle_type);
                                    formData.append('license_plate', vehicleFormData.license_plate.trim());
                                    if (vehicleFormData.brand) formData.append('brand', vehicleFormData.brand);
                                    if (vehicleFormData.model) formData.append('model', vehicleFormData.model);
                                    if (vehicleFiles.vehicle_image) formData.append('vehicle_image', vehicleFiles.vehicle_image);
                                    if (vehicleFiles.registration_cert) formData.append('registration_cert', vehicleFiles.registration_cert);

                                    await vehicleApi.registerVehicle(formData);

                                    setSnackbar({ open: true, message: 'Đăng ký xe thành công! Vui lòng chờ BQL duyệt.', severity: 'success' });
                                    setOpenVehicleModal(false);

                                    // Reset form
                                    setVehicleFormData({ vehicle_type: 'Xe máy', license_plate: '', brand: '', model: '' });
                                    setVehicleFiles({});

                                    // Reload vehicles
                                    await fetchVehicles();
                                } catch (err: any) {
                                    setSnackbar({ open: true, message: err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký xe.', severity: 'error' });
                                } finally {
                                    setVehicleSubmitting(false);
                                }
                            }}
                        >
                            {vehicleSubmitting ? <CircularProgress size={20} /> : 'Đăng ký'}
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
