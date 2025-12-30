// src/pages/Resident/Fund/ResidentFundList.tsx
import {
    Box,
    Typography,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Grid,
    Chip,
    LinearProgress,
    Button,
    Alert,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import donationApi, { type FundCampaign } from '../../../api/donationApi';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export default function ResidentFundList() {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<FundCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const response = await donationApi.getCampaigns();
            // Only show Active campaigns for residents
            const activeCampaigns = response.data.data.filter(
                (c: FundCampaign) => c.status === 'Active' && new Date(c.end_date) >= new Date()
            );
            setCampaigns(activeCampaigns);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải danh sách quỹ');
        } finally {
            setLoading(false);
        }
    };

    const getProgress = (current: number, target: number) => {
        if (!target || target === 0) return 0;
        return Math.min((current / target) * 100, 100);
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    🎗️ Quỹ Đóng góp
                </Typography>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/resident/fund/history')}
                >
                    Lịch sử của tôi
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {loading ? (
                <LinearProgress />
            ) : campaigns.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary">Hiện tại chưa có quỹ đóng góp nào đang mở.</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {campaigns.map((campaign) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={campaign.id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                            }}>
                                <CardMedia
                                    component="img"
                                    height="160"
                                    image={campaign.image_path ? `http://localhost:3000${campaign.image_path}` : 'https://via.placeholder.com/400x200?text=Qu%E1%BB%B9'}
                                    alt={campaign.title}
                                    sx={{ objectFit: 'cover' }}
                                />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        {campaign.title}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                                        {campaign.description?.substring(0, 100) || 'Chưa có mô tả'}...
                                    </Typography>

                                    {/* Progress */}
                                    <Box sx={{ mb: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2" color="primary" fontWeight="bold">
                                                {formatCurrency(campaign.current_amount)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                / {formatCurrency(campaign.target_amount)}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={getProgress(campaign.current_amount, campaign.target_amount)}
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                            Đạt {getProgress(campaign.current_amount, campaign.target_amount).toFixed(1)}% mục tiêu
                                        </Typography>
                                    </Box>

                                    {/* Dates */}
                                    <Typography variant="caption" color="text.secondary">
                                        📅 Đến {new Date(campaign.end_date).toLocaleDateString('vi-VN')}
                                    </Typography>
                                </CardContent>

                                <CardActions sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        fullWidth
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => navigate(`/resident/fund/detail/${campaign.id}`)}
                                    >
                                        Xem chi tiết & Đóng góp
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
