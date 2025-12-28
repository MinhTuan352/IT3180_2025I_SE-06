// src/pages/BOD/AccessControl/AccessControlLanding.tsx
import { Box, Typography, Paper, Grid, Card, CardContent, Badge } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { vehicleApi } from '../../../api/vehicleApi';

export default function AccessControlLanding() {
    const navigate = useNavigate();
    const location = useLocation();
    const isCQCN = location.pathname.startsWith('/cqcn');
    const basePath = isCQCN ? '/cqcn' : '/bod';

    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                const count = await vehicleApi.getPendingCount();
                setPendingCount(count);
            } catch (error) {
                console.error('Error fetching pending count:', error);
            }
        };
        fetchPendingCount();
    }, []);

    const menuCards = [
        {
            title: 'Theo dõi ra vào',
            subtitle: 'TRUNG TÂM KIỂM SOÁT RA VÀO LIVE',
            description: 'Giám sát trực tiếp hoạt động ra vào của xe cộ',
            icon: <SecurityIcon sx={{ fontSize: 60 }} />,
            color: '#1976d2',
            path: `${basePath}/access-control/live`
        },
        {
            title: 'Danh sách xe đăng ký',
            subtitle: 'QUẢN LÝ PHƯƠNG TIỆN',
            description: 'Xem, thêm, sửa, xóa và duyệt xe đăng ký',
            icon: <DirectionsCarIcon sx={{ fontSize: 60 }} />,
            color: '#2e7d32',
            path: `${basePath}/access-control/vehicles`,
            badge: pendingCount
        }
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    <SecurityIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                    Quản lý Ra vào
                </Typography>
                <Typography color="text.secondary">
                    Chọn chức năng bạn muốn sử dụng
                </Typography>
            </Paper>

            <Grid container spacing={3}>
                {menuCards.map((card, index) => (
                    <Grid size={{ xs: 12, md: 6 }} key={index}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 6
                                },
                                height: '100%',
                                borderLeft: `5px solid ${card.color}`
                            }}
                            onClick={() => navigate(card.path)}
                        >
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                                    <Box sx={{ color: card.color }}>
                                        {card.badge && card.badge > 0 ? (
                                            <Badge badgeContent={card.badge} color="error">
                                                {card.icon}
                                            </Badge>
                                        ) : (
                                            card.icon
                                        )}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="overline" color="text.secondary">
                                            {card.subtitle}
                                        </Typography>
                                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                                            {card.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {card.description}
                                        </Typography>
                                        {card.badge && card.badge > 0 && (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    mt: 1,
                                                    color: 'warning.main',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                ⚠️ Có {card.badge} yêu cầu đang chờ duyệt
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
