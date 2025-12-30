
import { Box, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { useEffect, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import feeApi from '../../../api/feeApi';

// Interface cho dữ liệu thống kê từ API
interface FinanceStatsData {
    totalRevenue: number;
    collected: number;
    pending: number;
    paymentRate: Array<{
        id: number;
        value: number;
        label: string;
        color: string;
    }>;
    monthlyRevenue: Array<{
        month: string;
        revenue: number;
    }>;
    overdueApartments: number;
    daysRemaining: number;
    percentChange: number;
    currentMonth: string;
}

export default function FinanceStats() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<FinanceStatsData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log('[FinanceStats] Đang gọi API...');
                const response: any = await feeApi.getStats();
                console.log('[FinanceStats] Full response:', response);

                // Axios wraps response in 'data' property
                const res = response.data || response;
                console.log('[FinanceStats] Actual data:', res);
                console.log('[FinanceStats] res.success:', res?.success);
                console.log('[FinanceStats] res.data:', res?.data);

                if (res && res.success && res.data) {
                    console.log('[FinanceStats] ✅ Dữ liệu hợp lệ, cập nhật state');
                    setStats(res.data);
                } else {
                    console.log('[FinanceStats] ❌ Dữ liệu không hợp lệ:', res);
                    setError('Không thể tải dữ liệu thống kê');
                }
            } catch (err: any) {
                console.error('[FinanceStats] LỖI:', err);
                console.error('[FinanceStats] err.response:', err?.response);
                console.error('[FinanceStats] err.response.data:', err?.response?.data);
                setError(err?.response?.data?.message || err.message || 'Lỗi kết nối đến server');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    // Tính tỷ lệ tiến độ thu
    const progressPercent = stats && stats.totalRevenue > 0
        ? Math.round((stats.collected / stats.totalRevenue) * 100)
        : 0;

    // Tính tỷ lệ quá hạn trong số còn phải thu
    const overduePercent = stats && stats.pending > 0 && stats.paymentRate
        ? stats.paymentRate.find(r => r.label === 'Quá hạn')?.value || 0
        : 0;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Thống Kê Tài Chính
            </Typography>

            <Grid container spacing={3}>
                {/* Tổng quan */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, height: '100%', borderRadius: 3, bgcolor: '#e3f2fd' }}>
                        <Typography variant="subtitle1" color="text.secondary">Tổng doanh thu dự kiến</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
                            {stats?.totalRevenue.toLocaleString()} đ
                        </Typography>
                        <Typography variant="body2" color={stats && stats.percentChange >= 0 ? "success.main" : "error.main"} sx={{ display: 'flex', alignItems: 'center' }}>
                            {stats && stats.percentChange >= 0 ? '+' : ''}{stats?.percentChange || 0}% so với tháng trước
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, height: '100%', borderRadius: 3, bgcolor: '#e8f5e9' }}>
                        <Typography variant="subtitle1" color="text.secondary">Đã thu</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1, color: 'success.main' }}>
                            {stats?.collected.toLocaleString()} đ
                        </Typography>
                        <Typography variant="body2">
                            Đạt {progressPercent}% tiến độ
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, height: '100%', borderRadius: 3, bgcolor: '#fff3e0' }}>
                        <Typography variant="subtitle1" color="text.secondary">Còn phải thu</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1, color: 'warning.main' }}>
                            {stats?.pending.toLocaleString()} đ
                        </Typography>
                        <Typography variant="body2">
                            Bao gồm {overduePercent}% nợ quá hạn
                        </Typography>
                    </Paper>
                </Grid>

                {/* Charts */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom>Tỷ lệ thanh toán</Typography>
                        {stats?.paymentRate && stats.paymentRate.length > 0 ? (
                            <PieChart
                                series={[
                                    {
                                        data: stats.paymentRate,
                                        highlightScope: { fade: 'global', highlight: 'item' },
                                        faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                    },
                                ]}
                                height={300}
                            />
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                                <Typography color="text.secondary">Chưa có dữ liệu hóa đơn</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom>Doanh thu 6 tháng gần nhất (Triệu VNĐ)</Typography>
                        {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
                            <BarChart
                                xAxis={[{ scaleType: 'band', data: stats.monthlyRevenue.map(i => i.month) }]}
                                series={[{ data: stats.monthlyRevenue.map(i => i.revenue) }]}
                                height={300}
                                barLabel="value"
                            />
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                                <Typography color="text.secondary">Chưa có dữ liệu doanh thu</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Cảnh báo */}
                <Grid size={{ xs: 12 }}>
                    {stats && stats.overdueApartments > 0 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Có <strong>{stats.overdueApartments} căn hộ</strong> đã quá hạn thanh toán trên 3 tháng. Cần lưu ý xử lý.
                        </Alert>
                    )}
                    {stats && stats.daysRemaining > 0 && stats.daysRemaining <= 10 && (
                        <Alert severity="info">
                            Kỳ thanh toán phí quản lý tháng {stats.currentMonth} sẽ kết thúc trong <strong>{stats.daysRemaining} ngày</strong> tới.
                        </Alert>
                    )}
                    {stats && stats.overdueApartments === 0 && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Không có căn hộ nào quá hạn thanh toán trên 3 tháng. Tốt lắm!
                        </Alert>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
