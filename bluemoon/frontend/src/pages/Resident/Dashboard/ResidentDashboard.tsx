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
    Payment as PaymentIcon,
    SquareFoot as SquareFootIcon,
    People as PeopleIcon,
    Layers as LayersIcon,
    RateReview as RateReviewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, type ResidentDashboardData } from '../../../api/dashboardApi';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardBanner, { type SmartInsight } from '../../../components/dashboard/DashboardBanner';

// Format currency
const formatCurrency = (value: number): string => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString('vi-VN');
};


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

    // Generate Smart Insights for residents
    const smartInsights: SmartInsight[] = [];

    if (stats.overdueInvoices > 0) {
        smartInsights.push({
            id: 'overdue',
            type: 'warning',
            title: 'Hóa đơn quá hạn',
            description: `Bạn có ${stats.overdueInvoices} hóa đơn quá hạn thanh toán. Vui lòng thanh toán sớm để tránh phí trễ.`
        });
    }

    if (stats.unpaidInvoices === 0) {
        smartInsights.push({
            id: 'all-paid',
            type: 'success',
            title: 'Thanh toán đầy đủ',
            description: 'Tất cả hóa đơn đã được thanh toán. Cảm ơn bạn!'
        });
    }

    if (stats.pendingServiceRequests > 0) {
        smartInsights.push({
            id: 'service',
            type: 'info',
            title: 'Yêu cầu dịch vụ đang xử lý',
            description: `Có ${stats.pendingServiceRequests} yêu cầu dịch vụ đang được xử lý.`
        });
    }

    if (stats.newNotifications > 0) {
        smartInsights.push({
            id: 'notif',
            type: 'info',
            title: 'Thông báo mới',
            description: `Có ${stats.newNotifications} thông báo mới trong 7 ngày qua. Nhớ kiểm tra!`
        });
    }

    smartInsights.push({
        id: 'tip',
        type: 'tip',
        title: 'Mẹo: Thanh toán online',
        description: 'Sử dụng QR Code để thanh toán nhanh chóng và tiện lợi qua ngân hàng.'
    });

    // Custom action button for payment & review
    const actionButtons = (
        <Stack direction="row" spacing={1}>
            {stats.unpaidInvoices > 0 && (
                <Button
                    variant="contained"
                    startIcon={<PaymentIcon />}
                    onClick={() => navigate('/resident/fee/list')}
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.15)',
                        color: 'white',
                        borderRadius: 3,
                        px: { xs: 2, sm: 3 },
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        fontSize: { xs: '0.8rem', sm: '0.9rem' },
                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.25)',
                        }
                    }}
                >
                    Thanh toán ngay
                </Button>
            )}
            <Button
                variant="contained"
                startIcon={<RateReviewIcon />}
                onClick={() => navigate('/resident/review')}
                sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    borderRadius: 3,
                    px: { xs: 2, sm: 3 },
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.25)',
                    }
                }}
            >
                Đánh giá
            </Button>
        </Stack>
    );

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Greeting Banner with Smart Report */}
            <DashboardBanner
                userName={user?.username || 'Cư dân'}
                userRole="resident"
                apartmentCode={apartment?.apartment_code}
                unpaidInvoices={stats.unpaidInvoices}
                overdueCount={stats.overdueInvoices}
                insights={smartInsights}
                actionButton={actionButtons}
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
