
import { Box, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { useEffect, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';


export default function FinanceStats() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        // Simulate fetching stats (or fetch real data if API ready)
        const fetchData = async () => {
            try {
                setLoading(true);
                // const res = await feeApi.getStats(); // TODO: Implement stats API
                // Mock data
                setTimeout(() => {
                    setStats({
                        totalRevenue: 1540000000,
                        collected: 1250000000,
                        pending: 290000000,
                        paymentRate: [
                            { id: 0, value: 75, label: 'Đã thanh toán', color: '#4caf50' },
                            { id: 1, value: 20, label: 'Chưa thanh toán', color: '#ff9800' },
                            { id: 2, value: 5, label: 'Quá hạn', color: '#f44336' },
                        ],
                        monthlyRevenue: [
                            { month: 'T1', revenue: 120 },
                            { month: 'T2', revenue: 135 },
                            { month: 'T3', revenue: 110 },
                            { month: 'T4', revenue: 160 },
                            { month: 'T5', revenue: 145 },
                            { month: 'T6', revenue: 180 },
                        ]
                    });
                    setLoading(false);
                }, 1000);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

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
                        <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                            +12% so với tháng trước
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
                            Đạt 81.2% tiến độ
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
                            Bao gồm 5% nợ quá hạn
                        </Typography>
                    </Paper>
                </Grid>

                {/* Charts */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom>Tỷ lệ thanh toán</Typography>
                        <PieChart
                            series={[
                                {
                                    data: stats?.paymentRate || [],
                                    highlightScope: { fade: 'global', highlight: 'item' },
                                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                },
                            ]}
                            height={300}
                        />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom>Doanh thu 6 tháng gần nhất (Triệu VNĐ)</Typography>
                        <BarChart
                            xAxis={[{ scaleType: 'band', data: stats?.monthlyRevenue.map((i: any) => i.month) }]}
                            series={[{ data: stats?.monthlyRevenue.map((i: any) => i.revenue) }]}
                            height={300}
                            barLabel="value"
                        />
                    </Paper>
                </Grid>

                {/* Cảnh báo */}
                <Grid size={{ xs: 12 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Có <strong>15 căn hộ</strong> đã quá hạn thanh toán trên 3 tháng. Cần lưu ý xử lý.
                    </Alert>
                    <Alert severity="info">
                        Kỳ thanh toán phí quản lý tháng 12/2025 sẽ kết thúc trong <strong>5 ngày</strong> tới.
                    </Alert>
                </Grid>
            </Grid>
        </Box>
    );
}
