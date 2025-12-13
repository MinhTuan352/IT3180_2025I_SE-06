// File: frontend/src/pages/Accountant/Dashboard/AccountantDashboard.tsx
import * as XLSX from 'xlsx';

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
    Alert
} from '@mui/material';
import {
    Receipt as ReceiptIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    AccountBalance as AccountBalanceIcon,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon,
    Timeline as TimelineIcon,
    AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { dashboardApi, type AccountantDashboardData } from '../../../api/dashboardApi';
import feeApi, { type Fee } from '../../../api/feeApi';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardBanner, { type SmartInsight } from '../../../components/dashboard/DashboardBanner';


// Format currency
const formatCurrency = (value: number): string => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
};

// Stat Card Component
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; isPositive: boolean };
}

function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
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
                        {trend && (
                            <Chip
                                size="small"
                                icon={trend.isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                                label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
                                sx={{
                                    mt: 0.5,
                                    bgcolor: trend.isPositive ? 'success.light' : 'error.light',
                                    color: trend.isPositive ? 'success.dark' : 'error.dark',
                                    fontWeight: 'bold',
                                    height: { xs: 18, sm: 22 },
                                    fontSize: { xs: '0.65rem', sm: '0.75rem' }
                                }}
                            />
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

// Prediction Card
interface PredictionCardProps {
    prediction: { nextMonth: number; trend: 'up' | 'down' | 'stable' };
    collectionRate: number;
}

function PredictionCard({ prediction, collectionRate }: PredictionCardProps) {
    const trendInfo = {
        up: { icon: <TrendingUpIcon />, color: '#4caf50', text: 'Tăng trưởng' },
        down: { icon: <TrendingDownIcon />, color: '#f44336', text: 'Giảm' },
        stable: { icon: <TimelineIcon />, color: '#2196f3', text: 'Ổn định' }
    };
    const trend = trendInfo[prediction.trend];

    return (
        <Card sx={{ height: '100%', borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ p: 3, color: 'white' }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <TimelineIcon />
                    <Typography variant="h6" fontWeight="bold">Dự đoán & Phân tích</Typography>
                </Stack>

                <Grid container spacing={2}>
                    <Grid sx={{ xs: 16 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 2, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>Dự đoán tháng tới</Typography>
                            <Typography variant="h5" fontWeight="bold">
                                {formatCurrency(prediction.nextMonth)}
                            </Typography>
                            <Chip
                                size="small"
                                icon={trend.icon}
                                label={trend.text}
                                sx={{ mt: 1, bgcolor: trend.color, color: 'white' }}
                            />
                        </Box>
                    </Grid>
                    <Grid sx={{ xs: 16 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 2, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>Tỷ lệ thu</Typography>
                            <Typography variant="h5" fontWeight="bold">{collectionRate}%</Typography>
                            <LinearProgress
                                variant="determinate"
                                value={collectionRate}
                                sx={{
                                    mt: 1,
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: 'rgba(255,255,255,0.3)',
                                    '& .MuiLinearProgress-bar': {
                                        bgcolor: collectionRate >= 80 ? '#4caf50' : collectionRate >= 50 ? '#ff9800' : '#f44336'
                                    }
                                }}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}

// Revenue Line Chart (CSS-based)
interface LineChartProps {
    data: Array<{ month: string; collected: number; remaining: number }>;
}

function RevenueLineChart({ data }: LineChartProps) {
    const maxValue = Math.max(...data.map(d => Math.max(Number(d.collected) || 0, Number(d.remaining) || 0)), 1);

    const monthNames: Record<string, string> = {
        '01': 'T1', '02': 'T2', '03': 'T3', '04': 'T4',
        '05': 'T5', '06': 'T6', '07': 'T7', '08': 'T8',
        '09': 'T9', '10': 'T10', '11': 'T11', '12': 'T12'
    };

    return (
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">Doanh thu theo tháng</Typography>
                    <Stack direction="row" spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: 1 }} />
                            <Typography variant="caption">Đã thu</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Box sx={{ width: 12, height: 12, bgcolor: '#ff9800', borderRadius: 1 }} />
                            <Typography variant="caption">Còn nợ</Typography>
                        </Stack>
                    </Stack>
                </Stack>

                {data.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                    </Box>
                ) : (
                    <Stack direction="row" spacing={0.5} alignItems="flex-end" sx={{ height: 200, pt: 3 }}>
                        {data.slice(-8).map((item, index) => {
                            const collectedHeight = (Number(item.collected) / maxValue) * 150;
                            const remainingHeight = (Number(item.remaining) / maxValue) * 150;
                            const monthKey = item.month.split('-')[1];
                            return (
                                <Box key={index} sx={{ flex: 1, textAlign: 'center' }}>
                                    <Stack spacing={0.3} alignItems="center">
                                        <Typography variant="caption" fontSize="0.6rem" color="text.secondary">
                                            {formatCurrency(Number(item.collected))}
                                        </Typography>
                                        <Stack direction="row" spacing={0.3} alignItems="flex-end" sx={{ height: 160 }}>
                                            <Box
                                                sx={{
                                                    width: 14,
                                                    height: Math.max(collectedHeight, 2),
                                                    bgcolor: '#4caf50',
                                                    borderRadius: '4px 4px 0 0'
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    width: 14,
                                                    height: Math.max(remainingHeight, 2),
                                                    bgcolor: '#ff9800',
                                                    borderRadius: '4px 4px 0 0'
                                                }}
                                            />
                                        </Stack>
                                        <Typography variant="caption" fontSize="0.65rem">
                                            {monthNames[monthKey] || monthKey}
                                        </Typography>
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}

// Fee Type Pie Chart
interface FeeTypePieChartProps {
    data: Array<{ fee_type: string; total: number }>;
}

function FeeTypePieChart({ data }: FeeTypePieChartProps) {
    const colors = ['#1976d2', '#9c27b0', '#4caf50', '#ff9800', '#f44336', '#00bcd4'];
    const total = data.reduce((sum, item) => sum + Number(item.total), 0);
    let cumulativePercent = 0;

    const gradientParts = data.map((item, i) => {
        const percent = total > 0 ? (Number(item.total) / total) * 100 : 0;
        const start = cumulativePercent;
        cumulativePercent += percent;
        return `${colors[i % colors.length]} ${start}% ${cumulativePercent}%`;
    }).join(', ');

    return (
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <PieChartIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">Phân bổ theo loại phí</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                        sx={{
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            background: total > 0 ? `conic-gradient(${gradientParts})` : '#e0e0e0',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            flexShrink: 0
                        }}
                    />
                    <Stack spacing={0.5} flex={1}>
                        {data.slice(0, 5).map((item, index) => (
                            <Stack key={index} direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: colors[index % colors.length] }} />
                                <Typography variant="caption" sx={{ flex: 1 }} noWrap>{item.fee_type}</Typography>
                                <Typography variant="caption" fontWeight="bold">
                                    {formatCurrency(Number(item.total))}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

// Top Debtors Chart
interface TopDebtorsChartProps {
    data: Array<{ apartment_code: string; total_debt: number }>;
}

function TopDebtorsChart({ data }: TopDebtorsChartProps) {
    const maxValue = Math.max(...data.map(d => Number(d.total_debt)), 1);

    return (
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <BarChartIcon color="error" />
                    <Typography variant="h6" fontWeight="bold">Top căn hộ nợ nhiều</Typography>
                </Stack>

                {data.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography color="text.secondary">Không có căn hộ nợ</Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.5}>
                        {data.map((item, index) => (
                            <Box key={index}>
                                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                    <Typography variant="body2" fontWeight="bold">{item.apartment_code}</Typography>
                                    <Typography variant="body2" color="error.main" fontWeight="bold">
                                        {formatCurrency(Number(item.total_debt))}
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={(Number(item.total_debt) / maxValue) * 100}
                                    color="error"
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </Box>
                        ))}
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}

// Overdue Invoices Table
interface OverdueTableProps {
    data: Array<{
        id: number;
        apartment_code: string;
        fee_type: string;
        amount_remaining: number;
        days_overdue: number;
    }>;
}

function OverdueTable({ data }: OverdueTableProps) {
    return (
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2, pb: 1 }}>
                    <AccessTimeIcon color="warning" />
                    <Typography variant="h6" fontWeight="bold">Hóa đơn quá hạn</Typography>
                    {data.length > 0 && (
                        <Chip label={data.length} size="small" color="error" />
                    )}
                </Stack>
                <Divider />

                {data.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography color="text.secondary">Không có hóa đơn quá hạn</Typography>
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Căn hộ</TableCell>
                                <TableCell>Loại phí</TableCell>
                                <TableCell align="right">Còn nợ</TableCell>
                                <TableCell align="right">Quá hạn</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.slice(0, 8).map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>
                                        <Chip label={item.apartment_code} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
                                            {item.fee_type}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" color="error.main" fontWeight="bold">
                                            {formatCurrency(item.amount_remaining)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={`${item.days_overdue} ngày`}
                                            size="small"
                                            color={item.days_overdue > 30 ? 'error' : 'warning'}
                                        />
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

// Helper: Format full currency for export
const formatCurrencyFull = (value: number): string => {
    return value ? value.toLocaleString('vi-VN') + ' đ' : '0 đ';
};

// Main Dashboard Component
export default function AccountantDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<AccountantDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fees, setFees] = useState<Fee[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await dashboardApi.getAccountantStats();
                setData(result);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Không thể tải dữ liệu dashboard');
            } finally {
                setLoading(false);
            }
        };
        const fetchFees = async () => {
            try {
                const res: any = await feeApi.getAll();
                const dataList = res.data || res;
                if (Array.isArray(dataList)) {
                    setFees(dataList);
                } else if (dataList.data && Array.isArray(dataList.data)) {
                    setFees(dataList.data);
                }
            } catch (err) {
                console.error('Error fetching fees:', err);
            }
        };
        fetchData();
        fetchFees();
    }, []);

    // Export Financial Report as Excel with 4 sheets
    const handleExportFinanceReport = () => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const fileName = `BaoCaoTaiChinh_${dateStr}.xlsx`;

        // Current dashboard data
        const currentStats = data?.stats;

        // === Sheet 1: Tổng quan (Overview) ===
        const overviewData = [
            ['BÁO CÁO TÀI CHÍNH'],
            [`Ngày xuất: ${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN')}`],
            [],
            ['THỐNG KÊ TỔNG QUAN'],
            ['Chỉ số', 'Giá trị'],
            ['Tổng số hóa đơn', currentStats?.totalInvoices || 0],
            ['Tổng thu dự kiến', formatCurrencyFull(currentStats?.totalRevenue || 0)],
            ['Đã thu', formatCurrencyFull((currentStats?.totalRevenue || 0) - (currentStats?.totalDebt || 0))],
            ['Dư nợ', formatCurrencyFull(currentStats?.totalDebt || 0)],
            ['Tỷ lệ thu', `${currentStats?.collectionRate || 0}%`],
            [],
            ['THỐNG KÊ THEO TRẠNG THÁI'],
            ['Trạng thái', 'Số lượng'],
            ['Đã thanh toán', currentStats?.paidInvoices || 0],
            ['Chưa thanh toán', currentStats?.unpaidInvoices || 0],
            ['Quá hạn', currentStats?.overdueInvoices || 0],
            ['Thanh toán một phần', fees.filter(f => f.status === 'Thanh toán một phần').length],
        ];
        const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);

        // === Sheet 2: Theo loại phí (By Fee Type) ===
        const feeTypeData = [
            ['THỐNG KÊ THEO LOẠI PHÍ'],
            ['Tên loại phí', 'Số lượng hóa đơn', 'Tổng thu', 'Đã thu', 'Dư nợ', 'Tỷ lệ thu (%)'],
        ];
        // Group fees by fee type
        const feeByType: { [key: string]: { count: number; total: number; paid: number; remaining: number } } = {};
        fees.forEach(fee => {
            const typeName = fee.fee_name || 'Khác';
            if (!feeByType[typeName]) {
                feeByType[typeName] = { count: 0, total: 0, paid: 0, remaining: 0 };
            }
            feeByType[typeName].count++;
            feeByType[typeName].total += Number(fee.total_amount) || 0;
            feeByType[typeName].paid += Number(fee.amount_paid) || 0;
            feeByType[typeName].remaining += Number(fee.amount_remaining) || 0;
        });
        Object.entries(feeByType).forEach(([typeName, data]) => {
            const rate = data.total > 0 ? ((data.paid / data.total) * 100).toFixed(1) : '0';
            feeTypeData.push([
                typeName,
                data.count as any,
                formatCurrencyFull(data.total) as any,
                formatCurrencyFull(data.paid) as any,
                formatCurrencyFull(data.remaining) as any,
                `${rate}%` as any
            ]);
        });
        const wsFeeType = XLSX.utils.aoa_to_sheet(feeTypeData);

        // === Sheet 3: Theo trạng thái (By Status) ===
        const statusData = [
            ['THỐNG KÊ THEO TRẠNG THÁI'],
            ['Trạng thái', 'Số lượng', 'Tổng dư nợ'],
        ];
        const statuses = ['Đã thanh toán', 'Chưa thanh toán', 'Quá hạn', 'Thanh toán một phần', 'Đã hủy'];
        statuses.forEach(status => {
            const filtered = fees.filter(f => f.status === status);
            const totalRemaining = filtered.reduce((sum, f) => sum + (Number(f.amount_remaining) || 0), 0);
            statusData.push([status, filtered.length as any, formatCurrencyFull(totalRemaining) as any]);
        });
        const wsStatus = XLSX.utils.aoa_to_sheet(statusData);

        // === Sheet 4: Chi tiết hóa đơn (Invoice Details) ===
        const invoiceDetailData = [
            ['CHI TIẾT HÓA ĐƠN'],
            ['Mã HĐ', 'Căn hộ', 'Người thanh toán', 'Loại phí', 'Nội dung', 'Kỳ thanh toán', 'Hạn thanh toán', 'Tổng thu', 'Đã thu', 'Dư nợ', 'Trạng thái', 'Ngày thanh toán'],
        ];
        fees.forEach(fee => {
            invoiceDetailData.push([
                fee.id as any,
                (fee.apartment_code || fee.apartment_id) as any,
                (fee.resident_name || '') as any,
                (fee.fee_name || '') as any,
                (fee.description || '') as any,
                (fee.billing_period || '') as any,
                fee.due_date ? new Date(fee.due_date).toLocaleDateString('vi-VN') : '' as any,
                formatCurrencyFull(Number(fee.total_amount) || 0) as any,
                formatCurrencyFull(Number(fee.amount_paid) || 0) as any,
                formatCurrencyFull(Number(fee.amount_remaining) || 0) as any,
                fee.status as any,
                fee.payment_date ? new Date(fee.payment_date).toLocaleDateString('vi-VN') : '' as any,
            ]);
        });
        const wsInvoiceDetail = XLSX.utils.aoa_to_sheet(invoiceDetailData);

        // Create workbook and add sheets
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan');
        XLSX.utils.book_append_sheet(wb, wsFeeType, 'Theo loại phí');
        XLSX.utils.book_append_sheet(wb, wsStatus, 'Theo trạng thái');
        XLSX.utils.book_append_sheet(wb, wsInvoiceDetail, 'Chi tiết hóa đơn');

        // Export
        XLSX.writeFile(wb, fileName);
    };

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

    const { stats, charts, overdueInvoices, prediction } = data;

    // Generate Smart Insights for the report
    const smartInsights: SmartInsight[] = [];

    if (stats.overdueInvoices > 10) {
        smartInsights.push({
            id: 'overdue-high',
            type: 'warning',
            title: 'Nhiều hóa đơn quá hạn',
            description: `Có ${stats.overdueInvoices} hóa đơn đã quá hạn thanh toán. Cần gửi nhắc nhở ngay.`
        });
    }

    if (stats.collectionRate < 70) {
        smartInsights.push({
            id: 'rate-low',
            type: 'warning',
            title: 'Tỷ lệ thu thấp',
            description: `Tỷ lệ thu phí hiện tại là ${stats.collectionRate}%. Cần áp dụng biện pháp thu hồi.`
        });
    } else if (stats.collectionRate >= 90) {
        smartInsights.push({
            id: 'rate-high',
            type: 'success',
            title: 'Tỷ lệ thu phí xuất sắc',
            description: `Tỷ lệ thu đạt ${stats.collectionRate}%. Tiếp tục duy trì!`
        });
    }

    if (prediction.trend === 'up') {
        smartInsights.push({
            id: 'trend-up',
            type: 'success',
            title: 'Doanh thu tăng trưởng',
            description: 'Xu hướng doanh thu đang tăng so với tháng trước. Tiếp tục phát huy!'
        });
    } else if (prediction.trend === 'down') {
        smartInsights.push({
            id: 'trend-down',
            type: 'warning',
            title: 'Doanh thu giảm',
            description: 'Xu hướng doanh thu đang giảm. Cần xem xét nguyên nhân.'
        });
    }

    if (charts.topDebtors.length > 0) {
        const topDebtor = charts.topDebtors[0];
        smartInsights.push({
            id: 'top-debtor',
            type: 'info',
            title: 'Căn hộ nợ nhiều nhất',
            description: `Căn hộ ${topDebtor.apartment_code} đang nợ ${formatCurrency(topDebtor.total_debt)} đồng.`
        });
    }

    smartInsights.push({
        id: 'tip-debt',
        type: 'tip',
        title: 'Mẹo: Nhắc nợ định kỳ',
        description: 'Gửi thông báo nhắc nợ tự động mỗi tuần giúp cải thiện tỷ lệ thu phí.'
    });

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Greeting Banner with Smart Report */}
            <DashboardBanner
                userName={user?.username || 'Người dùng'}
                userRole={user?.role}
                unpaidInvoices={stats.unpaidInvoices}
                overdueCount={overdueInvoices.length}
                insights={smartInsights}
                onExportFinanceReport={handleExportFinanceReport}
            />

            {/* Row 1: Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <StatCard
                        title="Tổng hóa đơn"
                        value={stats.totalInvoices}
                        icon={<ReceiptIcon />}
                        color="#1976d2"
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <StatCard
                        title="Đã thanh toán"
                        value={stats.paidInvoices}
                        subtitle={`${stats.collectionRate}% tỷ lệ`}
                        icon={<CheckCircleIcon />}
                        color="#4caf50"
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <StatCard
                        title="Chưa thanh toán"
                        value={stats.unpaidInvoices}
                        icon={<WarningIcon />}
                        color="#ff9800"
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <StatCard
                        title="Tổng doanh thu"
                        value={formatCurrency(stats.totalRevenue)}
                        subtitle={`Nợ: ${formatCurrency(stats.totalDebt)}`}
                        icon={<AccountBalanceIcon />}
                        color="#9c27b0"
                    />
                </Grid>
            </Grid>

            {/* Row 2: Prediction + Revenue Chart */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <PredictionCard prediction={prediction} collectionRate={stats.collectionRate} />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <RevenueLineChart data={charts.monthlyRevenue} />
                </Grid>
            </Grid>

            {/* Row 3: Fee Type Pie + Top Debtors */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FeeTypePieChart data={charts.feeTypeStats} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TopDebtorsChart data={charts.topDebtors} />
                </Grid>
            </Grid>

            {/* Row 4: Overdue Invoices Table */}
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <OverdueTable data={overdueInvoices} />
                </Grid>
            </Grid>
        </Box>
    );
}
