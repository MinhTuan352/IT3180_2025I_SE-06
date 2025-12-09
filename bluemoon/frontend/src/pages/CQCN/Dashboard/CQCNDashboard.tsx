// src/pages/CQCN/Dashboard/CQCNDashboard.tsx
import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Stack,
    Avatar,
    CircularProgress,
    Alert,
    Paper,
    Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    HomeWork as ApartmentIcon,
    People as PeopleIcon,
    Security as SecurityIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardBanner, { type SmartInsight } from '../../../components/dashboard/DashboardBanner';
import { getAccessStats, type AccessStats } from '../../../api/accessApi';

// Stat Card Component
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
    return (
        <Card
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                border: `1px solid ${color}30`,
                borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${color}20`
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color={color}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 56, height: 56 }}>
                        {icon}
                    </Avatar>
                </Stack>
            </CardContent>
        </Card>
    );
}

// Main Dashboard Component
export default function CQCNDashboard() {
    const { user } = useAuth();
    const [accessStats, setAccessStats] = useState<AccessStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const stats = await getAccessStats();
                setAccessStats(stats);
            } catch (err) {
                console.error('Error fetching CQCN dashboard data:', err);
                setError('Không thể tải dữ liệu dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    }

    // Generate Smart Insights
    const smartInsights: SmartInsight[] = [
        {
            id: 'welcome',
            type: 'tip',
            title: 'Chào mừng Cơ quan chức năng',
            description: 'Bạn có quyền truy cập thông tin cư dân và lịch sử ra vào của chung cư để phục vụ công tác quản lý.'
        }
    ];

    if (accessStats && accessStats.warningCount > 0) {
        smartInsights.push({
            id: 'warning',
            type: 'warning',
            title: `${accessStats.warningCount} cảnh báo hôm nay`,
            description: 'Có trường hợp xe lạ hoặc biển số bất thường đã được ghi nhận. Xem chi tiết tại "Quản lý Ra vào".'
        });
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Greeting Banner */}
            <DashboardBanner
                userName={user?.username || 'Cơ quan chức năng'}
                userRole={user?.role}
                pendingTasks={accessStats?.warningCount || 0}
                insights={smartInsights}
            />

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <StatCard
                        title="Tổng lượt ra vào hôm nay"
                        value={accessStats?.totalToday || 0}
                        icon={<SecurityIcon />}
                        color="#1976d2"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <StatCard
                        title="Trường hợp cảnh báo"
                        value={accessStats?.warningCount || 0}
                        subtitle="Xe lạ / Bất thường"
                        icon={<WarningIcon />}
                        color="#ff9800"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <StatCard
                        title="Trường hợp bình thường"
                        value={(accessStats?.totalToday || 0) - (accessStats?.warningCount || 0)}
                        icon={<CheckCircleIcon />}
                        color="#4caf50"
                    />
                </Grid>
            </Grid>

            {/* Quick Links */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Truy cập nhanh
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card
                            sx={{
                                p: 2,
                                textAlign: 'center',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                            onClick={() => window.location.href = '/cqcn/resident'}
                        >
                            <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography fontWeight="bold">Tra cứu Cư dân</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Xem thông tin cư dân
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card
                            sx={{
                                p: 2,
                                textAlign: 'center',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                            onClick={() => window.location.href = '/cqcn/access-control'}
                        >
                            <SecurityIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                            <Typography fontWeight="bold">Quản lý Ra vào</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Giám sát + Báo cáo
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card
                            sx={{
                                p: 2,
                                textAlign: 'center',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                            onClick={() => window.location.href = '/building-info'}
                        >
                            <ApartmentIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                            <Typography fontWeight="bold">Thông tin Tòa nhà</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Xem thông tin chung
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card
                            sx={{
                                p: 2,
                                textAlign: 'center',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                            onClick={() => window.location.href = '/cqcn/access-report'}
                        >
                            <WarningIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                            <Typography fontWeight="bold">Xuất báo cáo</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Phân tích + PDF
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
