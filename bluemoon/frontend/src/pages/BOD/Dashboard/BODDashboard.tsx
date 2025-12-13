// File: frontend/src/pages/BOD/Dashboard/BODDashboard.tsx

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    LinearProgress,
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
    HomeWork as ApartmentIcon,
    People as PeopleIcon,
    Build as ServiceIcon,
    Warning as IncidentIcon,
    TrendingUp as TrendingUpIcon,
    Assignment as TaskIcon,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon,
    RateReview as RateReviewIcon
} from '@mui/icons-material';
import { dashboardApi, type BODDashboardData } from '../../../api/dashboardApi';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardBanner, { type SmartInsight } from '../../../components/dashboard/DashboardBanner';


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
                borderRadius: { xs: 2, sm: 3 },
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${color}20`
                }
            }}
        >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
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
                        width: { xs: 36, sm: 44, md: 56 },
                        height: { xs: 36, sm: 44, md: 56 },
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

// Payment Progress Card
interface PaymentProgressProps {
    rate: number;
    paid: number;
    unpaid: number;
    collected: number;
}

function PaymentProgressCard({ rate, paid, unpaid, collected }: PaymentProgressProps) {
    return (
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">Tỷ lệ thu phí tháng này</Typography>
                    <Chip
                        label={`${rate}%`}
                        color={rate >= 80 ? 'success' : rate >= 50 ? 'warning' : 'error'}
                        sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                    />
                </Stack>

                <LinearProgress
                    variant="determinate"
                    value={rate}
                    sx={{
                        height: 12,
                        borderRadius: 6,
                        bgcolor: 'grey.200',
                        mb: 3,
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 6,
                            background: rate >= 80
                                ? 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)'
                                : rate >= 50
                                    ? 'linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)'
                                    : 'linear-gradient(90deg, #f44336 0%, #e57373 100%)'
                        }
                    }}
                />

                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                        <Typography variant="h5" fontWeight="bold" color="success.dark">{paid}</Typography>
                        <Typography variant="caption" color="success.dark">Đã TT</Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                        <Typography variant="h5" fontWeight="bold" color="warning.dark">{unpaid}</Typography>
                        <Typography variant="caption" color="warning.dark">Chưa TT</Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                        <Typography variant="h5" fontWeight="bold" color="info.dark">
                            {(collected / 1000000).toFixed(1)}M
                        </Typography>
                        <Typography variant="caption" color="info.dark">Đã thu</Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

// Simple Pie Chart (CSS-based)
interface PieChartProps {
    title: string;
    data: Array<{ label: string; value: number; color: string }>;
}

function SimplePieChart({ title, data }: PieChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercent = 0;

    // Generate conic gradient
    const gradientParts = data.map(item => {
        const percent = total > 0 ? (item.value / total) * 100 : 0;
        const start = cumulativePercent;
        cumulativePercent += percent;
        return `${item.color} ${start}% ${cumulativePercent}%`;
    }).join(', ');

    return (
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <PieChartIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">{title}</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={3}>
                    {/* Pie */}
                    <Box
                        sx={{
                            width: 140,
                            height: 140,
                            borderRadius: '50%',
                            background: total > 0 ? `conic-gradient(${gradientParts})` : '#e0e0e0',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            position: 'relative',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: '25%',
                                left: '25%',
                                width: '50%',
                                height: '50%',
                                borderRadius: '50%',
                                bgcolor: 'background.paper',
                                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.1)'
                            }
                        }}
                    />

                    {/* Legend */}
                    <Stack spacing={1} flex={1}>
                        {data.map((item, index) => (
                            <Stack key={index} direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: item.color }} />
                                <Typography variant="body2" sx={{ flex: 1 }}>{item.label}</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

// Horizontal Bar Chart
interface HorizontalBarChartProps {
    title: string;
    data: Array<{ label: string; value: number; color: string }>;
}

function HorizontalBarChart({ title, data }: HorizontalBarChartProps) {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <BarChartIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">{title}</Typography>
                </Stack>

                <Stack spacing={2}>
                    {data.map((item, index) => (
                        <Box key={index}>
                            <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                <Typography variant="body2">{item.label}</Typography>
                                <Typography variant="body2" fontWeight="bold">{item.value}</Typography>
                            </Stack>
                            <Box sx={{ height: 20, bgcolor: 'grey.100', borderRadius: 2, overflow: 'hidden' }}>
                                <Box
                                    sx={{
                                        height: '100%',
                                        width: `${(item.value / maxValue) * 100}%`,
                                        background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}99 100%)`,
                                        borderRadius: 2,
                                        transition: 'width 0.5s ease'
                                    }}
                                />
                            </Box>
                        </Box>
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
}

// Recent Items Table
interface RecentTableProps {
    title: string;
    icon: React.ReactNode;
    data: Array<{
        id: number;
        name: string;
        apartment: string;
        status: string;
        time: string;
        priority?: string;
    }>;
}

function RecentTable({ title, icon, data }: RecentTableProps) {
    const getStatusColor = (status: string): 'warning' | 'info' | 'success' | 'error' | 'default' => {
        switch (status) {
            case 'Chờ xử lý': return 'warning';
            case 'Đang xử lý': return 'info';
            case 'Hoàn thành': return 'success';
            case 'Đã hủy': return 'error';
            default: return 'default';
        }
    };

    const getPriorityColor = (priority?: string): 'error' | 'warning' | 'success' | 'default' => {
        switch (priority) {
            case 'Cao': return 'error';
            case 'Trung bình': return 'warning';
            case 'Thấp': return 'success';
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
                        <Typography color="text.secondary">Không có dữ liệu</Typography>
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Nội dung</TableCell>
                                <TableCell>Căn hộ</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Thời gian</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                                                {item.name}
                                            </Typography>
                                            {item.priority && (
                                                <Chip
                                                    label={item.priority}
                                                    size="small"
                                                    color={getPriorityColor(item.priority)}
                                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                                />
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={item.apartment || 'N/A'} size="small" variant="outlined" />
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

// Simple Bar Chart
interface SimpleBarChartProps {
    data: Array<{ month: string; total_collected: number }>;
}

function SimpleBarChart({ data }: SimpleBarChartProps) {
    const maxValue = Math.max(...data.map(d => Number(d.total_collected) || 0), 1);

    const monthNames: Record<string, string> = {
        '01': 'T1', '02': 'T2', '03': 'T3', '04': 'T4',
        '05': 'T5', '06': 'T6', '07': 'T7', '08': 'T8',
        '09': 'T9', '10': 'T10', '11': 'T11', '12': 'T12'
    };

    return (
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight="bold">Doanh thu theo tháng</Typography>
                    <TrendingUpIcon color="primary" />
                </Stack>

                {data.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                    </Box>
                ) : (
                    <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ height: 180 }}>
                        {data.map((item, index) => {
                            const height = maxValue > 0 ? (Number(item.total_collected) / maxValue) * 140 : 0;
                            const monthKey = item.month.split('-')[1];
                            return (
                                <Box key={index} sx={{ flex: 1, textAlign: 'center' }}>
                                    <Typography variant="caption" fontWeight="bold" color="primary" fontSize="0.65rem">
                                        {(Number(item.total_collected) / 1000000).toFixed(1)}M
                                    </Typography>
                                    <Box
                                        sx={{
                                            height: Math.max(height, 4),
                                            background: 'linear-gradient(180deg, #1976d2 0%, #42a5f5 100%)',
                                            borderRadius: '6px 6px 0 0',
                                            mx: 0.5,
                                            transition: 'height 0.3s',
                                            '&:hover': { opacity: 0.8 }
                                        }}
                                    />
                                    <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                                        {monthNames[monthKey] || monthKey}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}

// Main Dashboard Component
export default function BODDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<BODDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await dashboardApi.getBODStats();
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

    const { stats, charts, recentIncidents, recentServices } = data;

    // Data for pie chart - Payment status
    const paymentPieData = [
        { label: 'Đã thanh toán', value: Number(stats.paidInvoices), color: '#4caf50' },
        { label: 'Chưa thanh toán', value: Number(stats.unpaidInvoices), color: '#ff9800' }
    ];

    // Data for horizontal bar chart - Overview stats
    const overviewBarData = [
        { label: 'Căn hộ', value: Number(stats.totalApartments), color: '#1976d2' },
        { label: 'Cư dân', value: Number(stats.totalResidents), color: '#9c27b0' },
        { label: 'Dịch vụ chờ', value: Number(stats.pendingServiceRequests), color: '#ff9800' },
        { label: 'Sự cố mới', value: Number(stats.pendingIncidents), color: '#f44336' }
    ];

    const incidentTableData = recentIncidents.map(item => ({
        id: item.id,
        name: item.title,
        apartment: item.apartment_code,
        status: item.status,
        time: item.created_at,
        priority: item.priority
    }));

    const serviceTableData = recentServices.map(item => ({
        id: item.id,
        name: item.service_name,
        apartment: item.apartment_code,
        status: item.status,
        time: item.created_at
    }));

    // Generate Smart Insights for the report
    const smartInsights: SmartInsight[] = [];

    if (stats.pendingIncidents > 5) {
        smartInsights.push({
            id: 'inc-high',
            type: 'warning',
            title: 'Nhiều sự cố chưa xử lý',
            description: `Có ${stats.pendingIncidents} sự cố đang chờ xử lý. Cần ưu tiên giải quyết để đảm bảo chất lượng dịch vụ.`
        });
    }

    if (stats.pendingServiceRequests > 10) {
        smartInsights.push({
            id: 'srv-high',
            type: 'warning',
            title: 'Yêu cầu dịch vụ tích tụ',
            description: `Có ${stats.pendingServiceRequests} yêu cầu dịch vụ đang chờ. Nên tăng cường nhân sự xử lý.`
        });
    }

    if (stats.paymentRate < 70) {
        smartInsights.push({
            id: 'pay-low',
            type: 'warning',
            title: 'Tỷ lệ thanh toán thấp',
            description: `Tỷ lệ thanh toán hiện tại là ${stats.paymentRate}%. Cần gửi nhắc nhở cho các căn hộ chưa thanh toán.`
        });
    } else if (stats.paymentRate >= 90) {
        smartInsights.push({
            id: 'pay-high',
            type: 'success',
            title: 'Tỷ lệ thanh toán tốt',
            description: `Tỷ lệ thanh toán đạt ${stats.paymentRate}%. Hệ thống thu phí hoạt động hiệu quả.`
        });
    }

    if (stats.pendingIncidents === 0 && stats.pendingServiceRequests === 0) {
        smartInsights.push({
            id: 'all-clear',
            type: 'success',
            title: 'Hệ thống hoạt động ổn định',
            description: 'Không có sự cố và yêu cầu dịch vụ cần xử lý. Tiếp tục duy trì chất lượng dịch vụ!'
        });
    }

    smartInsights.push({
        id: 'tip-overview',
        type: 'tip',
        title: 'Mẹo: Theo dõi định kỳ',
        description: 'Kiểm tra Dashboard mỗi ngày để nắm bắt tình hình tòa nhà kịp thời.'
    });

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Greeting Banner with Smart Report */}
            <DashboardBanner
                userName={user?.username || 'Người dùng'}
                userRole={user?.role}
                pendingTasks={Number(stats.pendingServiceRequests) + Number(stats.pendingIncidents)}
                insights={smartInsights}
                actionButton={
                    <Button
                        variant="contained"
                        startIcon={<RateReviewIcon />}
                        onClick={() => window.location.href = '/bod/reviews'} // Using href for simplicity or navigate if hook available
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
                        Xem đánh giá
                    </Button>
                }
            />

            {/* Stats Cards Row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <StatCard
                        title="Tổng số căn hộ"
                        value={stats.totalApartments}
                        icon={<ApartmentIcon />}
                        color="#1976d2"
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <StatCard
                        title="Tổng số cư dân"
                        value={stats.totalResidents}
                        icon={<PeopleIcon />}
                        color="#9c27b0"
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <StatCard
                        title="Đơn dịch vụ chờ"
                        value={stats.pendingServiceRequests}
                        subtitle="Cần xử lý"
                        icon={<ServiceIcon />}
                        color="#ff9800"
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <StatCard
                        title="Sự cố mới"
                        value={stats.pendingIncidents}
                        subtitle="Chưa giải quyết"
                        icon={<IncidentIcon />}
                        color="#f44336"
                    />
                </Grid>
            </Grid>

            {/* Row 2: Payment Progress + Pie Chart */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <PaymentProgressCard
                        rate={Number(stats.paymentRate)}
                        paid={Number(stats.paidInvoices)}
                        unpaid={Number(stats.unpaidInvoices)}
                        collected={Number(stats.totalCollected)}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <SimplePieChart title="Tỷ lệ thanh toán" data={paymentPieData} />
                </Grid>
            </Grid>

            {/* Row 3: Bar Charts */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <SimpleBarChart data={charts.monthlyRevenue} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <HorizontalBarChart title="Thống kê tổng quan" data={overviewBarData} />
                </Grid>
            </Grid>

            {/* Row 4: Recent Tables */}
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <RecentTable
                        title="Sự cố gần đây"
                        icon={<IncidentIcon color="error" />}
                        data={incidentTableData}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <RecentTable
                        title="Yêu cầu dịch vụ gần đây"
                        icon={<TaskIcon color="primary" />}
                        data={serviceTableData}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
