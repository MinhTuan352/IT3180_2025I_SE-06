// File: frontend/src/pages/Resident/Dashboard/ResidentDashboard.tsx

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Avatar,
    Stack,
    Divider,
    CircularProgress,
    Alert,
    Button
} from '@mui/material';
import {
    Home as HomeIcon,
    Receipt as ReceiptIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Build as ServiceIcon,
    Notifications as NotificationsIcon,
    ReportProblem as IncidentIcon,
    Cloud as CloudIcon,
    Payment as PaymentIcon,
    SquareFoot as SquareFootIcon,
    People as PeopleIcon,
    Layers as LayersIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, type ResidentDashboardData } from '../../../api/dashboardApi';
import { useAuth } from '../../../contexts/AuthContext';

// Helper function to get time-based greeting
const getTimeGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
    if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
};

// Format currency
const formatCurrency = (value: number): string => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString('vi-VN');
};

// Greeting Banner Component for Resident
interface GreetingBannerProps {
    userName: string;
    apartmentCode?: string;
    unpaidInvoices: number;
    overdueInvoices: number;
}

function GreetingBanner({ userName, apartmentCode, unpaidInvoices, overdueInvoices }: GreetingBannerProps) {
    const greeting = getTimeGreeting();
    const navigate = useNavigate();

    return (
        <Card
            sx={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab3 100%)',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                color: 'white',
                mb: 3,
                minHeight: { xs: 160, sm: 180 },
            }}
        >
            {/* City skyline decorative background */}
            <Box
                sx={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: '50%',
                    height: '100%',
                    opacity: 0.3,
                    background: `
                        linear-gradient(to right, transparent 0%, rgba(30, 58, 95, 0.8) 100%),
                        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect x='20' y='80' width='40' height='120' fill='%23fff'/%3E%3Crect x='70' y='50' width='50' height='150' fill='%23fff'/%3E%3Crect x='130' y='100' width='35' height='100' fill='%23fff'/%3E%3Crect x='175' y='30' width='45' height='170' fill='%23fff'/%3E%3Crect x='230' y='70' width='55' height='130' fill='%23fff'/%3E%3Crect x='295' y='90' width='40' height='110' fill='%23fff'/%3E%3Crect x='345' y='60' width='50' height='140' fill='%23fff'/%3E%3C/svg%3E")
                    `,
                    backgroundPosition: 'right bottom',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    display: { xs: 'none', md: 'block' }
                }}
            />

            <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 2, sm: 3, md: 4 } }}>
                {/* Weather info badge */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                        icon={<CloudIcon sx={{ color: 'white !important', fontSize: 18 }} />}
                        label="Hà Nội: 28°C • Có mây"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 500,
                            fontSize: { xs: '0.7rem', sm: '0.8rem' },
                            '& .MuiChip-icon': { color: 'white' }
                        }}
                    />
                    {apartmentCode && (
                        <Chip
                            icon={<HomeIcon sx={{ color: 'white !important', fontSize: 18 }} />}
                            label={`Căn hộ ${apartmentCode}`}
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontWeight: 500,
                                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                '& .MuiChip-icon': { color: 'white' }
                            }}
                        />
                    )}
                </Stack>

                {/* Main greeting */}
                <Typography
                    variant="h3"
                    fontWeight="bold"
                    sx={{
                        mb: 1,
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                    }}
                >
                    {greeting}, {userName || 'Cư dân'}!
                </Typography>

                {/* Subtext with pending tasks */}
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 3, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                    {unpaidInvoices > 0 ? (
                        <>
                            Bạn có{' '}
                            <Box component="span" sx={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                                {unpaidInvoices} hóa đơn chưa thanh toán
                            </Box>
                            {overdueInvoices > 0 && ` (${overdueInvoices} hóa đơn quá hạn)`}.
                        </>
                    ) : (
                        'Tất cả hóa đơn của bạn đã được thanh toán đầy đủ!'
                    )}
                </Typography>

                {/* Action button */}
                {unpaidInvoices > 0 && (
                    <Button
                        variant="contained"
                        startIcon={<PaymentIcon />}
                        onClick={() => navigate('/resident/fee/list')}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.15)',
                            color: 'white',
                            borderRadius: 3,
                            px: 3,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.25)',
                            }
                        }}
                    >
                        Thanh toán ngay
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// Stat Card Component
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
}

function StatCard({ title, value, subtitle, icon, color, onClick }: StatCardProps) {
    return (
        <Card
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                border: `1px solid ${color}30`,
                borderRadius: { xs: 2, sm: 3 },
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${color}20`
                }
            }}
            onClick={onClick}
        >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}
                            noWrap
                        >
                            {title}
                        </Typography>
                        <Typography
                            variant="h4"
                            fontWeight="bold"
                            color={color}
                            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}
                        >
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Avatar sx={{
                        bgcolor: `${color}20`,
                        color: color,
                        width: { xs: 36, sm: 44, md: 50 },
                        height: { xs: 36, sm: 44, md: 50 },
                        ml: 1,
                        flexShrink: 0
                    }}>
                        {icon}
                    </Avatar>
                </Stack>
            </CardContent>
        </Card>
    );
}

// Apartment Info Card
interface ApartmentInfoCardProps {
    apartment: {
        apartment_code: string;
        building: string;
        floor: number;
        area: number;
        memberCount: number;
    } | null;
}

function ApartmentInfoCard({ apartment }: ApartmentInfoCardProps) {
    const navigate = useNavigate();
    if (!apartment) return null;

    return (
        <Card sx={{ height: '100%', borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, color: 'white' }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <HomeIcon />
                    <Typography variant="h6" fontWeight="bold">Căn hộ của tôi</Typography>
                </Stack>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                            <HomeIcon sx={{ fontSize: 24, mb: 0.5 }} />
                            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Tòa nhà</Typography>
                            <Typography variant="h6" fontWeight="bold">{apartment.building}</Typography>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                            <LayersIcon sx={{ fontSize: 24, mb: 0.5 }} />
                            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Tầng</Typography>
                            <Typography variant="h6" fontWeight="bold">{apartment.floor}</Typography>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                            <SquareFootIcon sx={{ fontSize: 24, mb: 0.5 }} />
                            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Diện tích</Typography>
                            <Typography variant="h6" fontWeight="bold">{apartment.area} m²</Typography>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 24, mb: 0.5 }} />
                            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Thành viên</Typography>
                            <Typography variant="h6" fontWeight="bold">{apartment.memberCount}</Typography>
                        </Box>
                    </Grid>
                </Grid>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/resident/apartment')}
                    sx={{
                        mt: 2,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                >
                    Xem chi tiết
                </Button>
            </CardContent>
        </Card>
    );
}

// Pending Invoices Table
interface PendingInvoicesTableProps {
    data: Array<{
        id: number;
        fee_type: string;
        total_amount: number;
        amount_remaining: number;
        due_date: string;
        days_overdue: number;
    }>;
}

function PendingInvoicesTable({ data }: PendingInvoicesTableProps) {
    const navigate = useNavigate();
    return (
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2, pb: 1 }}>
                    <ReceiptIcon color="warning" />
                    <Typography variant="h6" fontWeight="bold">Hóa đơn cần thanh toán</Typography>
                    {data.length > 0 && (
                        <Chip label={data.length} size="small" color="warning" />
                    )}
                </Stack>
                <Divider />

                {data.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography color="text.secondary">Không có hóa đơn cần thanh toán</Typography>
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Loại phí</TableCell>
                                <TableCell align="right">Số tiền</TableCell>
                                <TableCell align="right">Hạn TT</TableCell>
                                <TableCell align="center">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                                            {item.fee_type}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" color="error.main" fontWeight="bold">
                                            {item.amount_remaining.toLocaleString('vi-VN')} đ
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack alignItems="flex-end">
                                            <Typography variant="caption">
                                                {new Date(item.due_date).toLocaleDateString('vi-VN')}
                                            </Typography>
                                            {item.days_overdue > 0 && (
                                                <Chip
                                                    label={`Quá ${item.days_overdue} ngày`}
                                                    size="small"
                                                    color="error"
                                                    sx={{ fontSize: '0.65rem', height: 18 }}
                                                />
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="primary"
                                            onClick={() => navigate(`/resident/fee/payment/${item.id}`)}
                                            sx={{ minWidth: 60, fontSize: '0.7rem' }}
                                        >
                                            Thanh toán
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

// Recent Activities Table
interface RecentActivitiesProps {
    title: string;
    icon: React.ReactNode;
    data: Array<{
        id: number;
        name: string;
        status: string;
        time: string;
        priority?: string;
    }>;
}

function RecentActivitiesTable({ title, icon, data }: RecentActivitiesProps) {
    const getStatusColor = (status: string): 'warning' | 'info' | 'success' | 'error' | 'default' => {
        switch (status) {
            case 'Chờ xử lý': return 'warning';
            case 'Đang xử lý': return 'info';
            case 'Hoàn thành': return 'success';
            case 'Đã hủy': return 'error';
            default: return 'default';
        }
    };

    return (
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2, pb: 1 }}>
                    {icon}
                    <Typography variant="h6" fontWeight="bold">{title}</Typography>
                </Stack>
                <Divider />

                {data.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Nội dung</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Thời gian</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                            {item.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={item.status} size="small" color={getStatusColor(item.status)} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(item.time).toLocaleDateString('vi-VN')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

// Main Dashboard Component
export default function ResidentDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [data, setData] = useState<ResidentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await dashboardApi.getResidentStats();
                setData(result);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
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

    if (error || !data) {
        return <Alert severity="error" sx={{ m: 2 }}>{error || 'Đã xảy ra lỗi'}</Alert>;
    }

    const { apartment, stats, pendingInvoices, recentServiceRequests, recentIncidents } = data;

    // Transform data for tables
    const serviceTableData = recentServiceRequests.map(item => ({
        id: item.id,
        name: item.service_name,
        status: item.status,
        time: item.created_at
    }));

    const incidentTableData = recentIncidents.map(item => ({
        id: item.id,
        name: item.title,
        status: item.status,
        time: item.created_at,
        priority: item.priority
    }));

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Greeting Banner */}
            <GreetingBanner
                userName={user?.username || 'Cư dân'}
                apartmentCode={apartment?.apartment_code}
                unpaidInvoices={stats.unpaidInvoices}
                overdueInvoices={stats.overdueInvoices}
            />

            {/* Row 1: Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <StatCard
                        title="Tổng công nợ"
                        value={formatCurrency(stats.totalDebt) + ' đ'}
                        icon={<ReceiptIcon />}
                        color="#f44336"
                        onClick={() => navigate('/resident/fee/list')}
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <StatCard
                        title="Chưa thanh toán"
                        value={stats.unpaidInvoices}
                        subtitle={`${stats.overdueInvoices} quá hạn`}
                        icon={<WarningIcon />}
                        color="#ff9800"
                        onClick={() => navigate('/resident/fee/list')}
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <StatCard
                        title="Yêu cầu dịch vụ"
                        value={stats.pendingServiceRequests}
                        subtitle="Đang xử lý"
                        icon={<ServiceIcon />}
                        color="#2196f3"
                        onClick={() => navigate('/resident/service/list')}
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <StatCard
                        title="Thông báo mới"
                        value={stats.newNotifications}
                        subtitle="7 ngày gần đây"
                        icon={<NotificationsIcon />}
                        color="#9c27b0"
                        onClick={() => navigate('/resident/notification/list')}
                    />
                </Grid>
            </Grid>

            {/* Row 2: Apartment Info + Pending Invoices */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <ApartmentInfoCard apartment={apartment} />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <PendingInvoicesTable data={pendingInvoices} />
                </Grid>
            </Grid>

            {/* Row 3: Recent Activities */}
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <RecentActivitiesTable
                        title="Yêu cầu dịch vụ gần đây"
                        icon={<ServiceIcon color="primary" />}
                        data={serviceTableData}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <RecentActivitiesTable
                        title="Sự cố đã báo cáo"
                        icon={<IncidentIcon color="error" />}
                        data={incidentTableData}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
