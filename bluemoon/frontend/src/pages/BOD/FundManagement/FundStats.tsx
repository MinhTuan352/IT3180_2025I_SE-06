// src/pages/BOD/FundManagement/FundStats.tsx
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Paper,
    LinearProgress,
    IconButton,
    Alert,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import donationApi, { type FundStatistics } from '../../../api/donationApi';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
}

const StatCard = ({ title, value, subtitle, icon, color }: StatCardProps) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: `${color}15`,
                    color: color,
                    display: 'flex'
                }}>
                    {icon}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary">{title}</Typography>
                    <Typography variant="h5" fontWeight="bold">{value}</Typography>
                    {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
                </Box>
            </Box>
        </CardContent>
    </Card>
);

export default function FundStats() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<FundStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await donationApi.getStatistics();
            setStats(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải thống kê');
        } finally {
            setLoading(false);
        }
    };

    const topCampaignColumns: GridColDef[] = [
        { field: 'rank', headerName: '#', width: 50 },
        { field: 'title', headerName: 'Tên quỹ', flex: 1, minWidth: 200 },
        {
            field: 'current_amount',
            headerName: 'Đã nhận',
            width: 150,
            renderCell: (params) => formatCurrency(params.value)
        },
        {
            field: 'target_amount',
            headerName: 'Mục tiêu',
            width: 150,
            renderCell: (params) => formatCurrency(params.value)
        },
        {
            field: 'progress_percent',
            headerName: 'Tiến độ',
            width: 120,
            renderCell: (params) => (
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(params.value || 0, 100)}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption">{params.value || 0}%</Typography>
                </Box>
            )
        },
    ];

    const topDonorColumns: GridColDef[] = [
        { field: 'rank', headerName: '#', width: 50 },
        { field: 'full_name', headerName: 'Họ tên', flex: 1, minWidth: 150 },
        { field: 'apartment_code', headerName: 'Căn hộ', width: 100 },
        {
            field: 'total_donated',
            headerName: 'Tổng đóng góp',
            width: 150,
            renderCell: (params) => (
                <Typography color="success.main" fontWeight="bold">
                    {formatCurrency(params.value)}
                </Typography>
            )
        },
        { field: 'donation_count', headerName: 'Số lần', width: 80 },
    ];

    if (loading) return <LinearProgress />;

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate('/bod/fund/list')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight="bold">
                    📊 Thống kê Quỹ Đóng góp
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {stats && (
                <>
                    {/* Overview Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <StatCard
                                title="Tổng số quỹ"
                                value={stats.overview.total_campaigns}
                                subtitle={`${stats.overview.active_campaigns} đang mở`}
                                icon={<VolunteerActivismIcon />}
                                color="#2196f3"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <StatCard
                                title="Tổng tiền đã nhận"
                                value={formatCurrency(stats.overview.total_raised)}
                                icon={<AccountBalanceIcon />}
                                color="#4caf50"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <StatCard
                                title="Mục tiêu tổng"
                                value={formatCurrency(stats.overview.total_target)}
                                icon={<TrendingUpIcon />}
                                color="#ff9800"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <StatCard
                                title="Tỷ lệ hoàn thành"
                                value={stats.overview.total_target > 0
                                    ? `${((stats.overview.total_raised / stats.overview.total_target) * 100).toFixed(1)}%`
                                    : 'N/A'
                                }
                                icon={<PeopleIcon />}
                                color="#9c27b0"
                            />
                        </Grid>
                    </Grid>

                    {/* Tables */}
                    <Grid container spacing={3}>
                        {/* Top Campaigns */}
                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    🏆 Top 5 Quỹ Nhiều Đóng góp Nhất
                                </Typography>
                                <DataGrid
                                    rows={stats.topCampaigns.map((c, idx) => ({ ...c, rank: idx + 1 }))}
                                    columns={topCampaignColumns}
                                    autoHeight
                                    hideFooter
                                    disableRowSelectionOnClick
                                    localeText={{ noRowsLabel: 'Chưa có dữ liệu' }}
                                />
                            </Paper>
                        </Grid>

                        {/* Top Donors */}
                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    ❤️ Top 10 Cư dân Đóng góp Nhiều Nhất
                                </Typography>
                                <DataGrid
                                    rows={stats.topDonors.map((d, idx) => ({ ...d, id: d.resident_id, rank: idx + 1 }))}
                                    columns={topDonorColumns}
                                    autoHeight
                                    hideFooter
                                    disableRowSelectionOnClick
                                    localeText={{ noRowsLabel: 'Chưa có dữ liệu' }}
                                />
                            </Paper>
                        </Grid>

                        {/* Monthly Chart (Simplified as table) */}
                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    📈 Đóng góp theo tháng (12 tháng gần nhất)
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                                    {stats.monthlyStats.length === 0 ? (
                                        <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                                    ) : (
                                        stats.monthlyStats.map((m) => (
                                            <Card key={m.month} sx={{ minWidth: 120, textAlign: 'center' }}>
                                                <CardContent sx={{ py: 1, px: 2 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {m.month}
                                                    </Typography>
                                                    <Typography variant="body1" fontWeight="bold" color="primary">
                                                        {formatCurrency(m.total_amount)}
                                                    </Typography>
                                                    <Typography variant="caption">
                                                        {m.donation_count} lượt
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
}
