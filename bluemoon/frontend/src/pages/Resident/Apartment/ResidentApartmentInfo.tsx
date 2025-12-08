// src/pages/Resident/Apartment/ResidentApartmentInfo.tsx
import {
    Box, Typography, Paper, Grid, Avatar, Chip, Divider,
    List, ListItem, ListItemAvatar, ListItemText,
    CircularProgress, Alert, Button
} from '@mui/material';
import { useState, useEffect } from 'react';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import LayersIcon from '@mui/icons-material/Layers';
import HomeIcon from '@mui/icons-material/Home';
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

export default function ResidentApartmentInfo() {
    const [apartment, setApartment] = useState<ApartmentWithMembers | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                <Divider sx={{ mb: 2 }} />

                {apartment.members && apartment.members.length > 0 ? (
                    <List disablePadding>
                        {apartment.members.map((member, index) => (
                            <Box key={member.id}>
                                <ListItem
                                    alignItems="flex-start"
                                    sx={{
                                        px: 1,
                                        py: 2
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{
                                            bgcolor: member.role === 'owner' ? 'primary.main' : 'grey.400',
                                            width: 48,
                                            height: 48
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
        </Box>
    );
}
