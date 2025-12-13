// src/pages/Resident/Apartment/ResidentApartmentInfo.tsx
import {
    Box, Typography, Paper, Grid, Avatar, Chip, Divider,
    List, ListItem, ListItemAvatar, ListItemText,
    CircularProgress, Alert, Button,
    Dialog, DialogContent, DialogActions,
    IconButton, Stack
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
import { apartmentApi } from '../../../api/apartmentApi';

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

    useEffect(() => {
        fetchApartment();
    }, []);

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
        </Box>
    );
}

