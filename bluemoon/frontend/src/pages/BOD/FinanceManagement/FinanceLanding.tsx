
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

export default function FinanceLanding() {
    const navigate = useNavigate();

    const menuItems = [
        {
            title: 'Thống kê tài chính',
            description: 'Xem biểu đồ thu chi, tỷ lệ thanh toán và báo cáo tổng quan.',
            icon: <AnalyticsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />,
            path: '/bod/finance/stats',
            color: '#e3f2fd',
        },
        {
            title: 'Danh sách công nợ',
            description: 'Tra cứu hóa đơn, theo dõi tình trạng thanh toán của cư dân.',
            icon: <ReceiptLongIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />,
            path: '/bod/finance/debt',
            color: '#e8f5e9',
        },
        {
            title: 'Danh sách phí',
            description: 'Quản lý các loại phí dịch vụ, định mức và đơn giá.',
            icon: <AccountBalanceWalletIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />,
            path: '/bod/finance/fee-types',
            color: '#fff3e0',
        },
        {
            title: 'Quản lý kế toán',
            description: 'Giao việc, theo dõi tiến độ và lịch sử hoạt động của kế toán.',
            icon: <SupervisorAccountIcon sx={{ fontSize: 60, color: 'info.main', mb: 2 }} />,
            path: '/bod/finance/accountant',
            color: '#ede7f6',
        },
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#1a237e' }}>
                Quản Lý Tài Chính
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Trung tâm kiểm soát tài chính, công nợ và kế toán của tòa nhà.
            </Typography>

            <Grid container spacing={4}>
                {menuItems.map((item, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 6 }} key={index}>
                        <Card
                            sx={{
                                height: '100%',
                                borderRadius: 4,
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: 6,
                                }
                            }}
                        >
                            <CardActionArea
                                onClick={() => navigate(item.path)}
                                sx={{ height: '100%', p: 3, backgroundColor: item.color }}
                            >
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                    {item.icon}
                                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {item.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {item.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
