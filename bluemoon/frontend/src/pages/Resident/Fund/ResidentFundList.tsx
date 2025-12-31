// src/pages/Resident/Fund/ResidentFundList.tsx
import {
    Box, Typography, CircularProgress, Alert, Card, CardMedia,
    CardContent, CardActions, Grid, Button, LinearProgress
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import donationApi, { type FundCampaign } from '../../../api/donationApi';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const getProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
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
            setError(null);
            const response = await donationApi.getCampaigns();
            // Filter for active campaigns only
            const activeCampaigns = response.data.data.filter(
                (c: FundCampaign) => c.status === 'Active' && new Date(c.end_date) >= new Date()
            );
            setCampaigns(activeCampaigns);
        } catch (err: any) {
            console.error('Error fetching campaigns:', err);
            setError('Không thể tải danh sách quỹ');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    }

    return (
        <>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Quỹ đóng góp
            </Typography>

            {campaigns.length === 0 ? (
                <Alert severity="info">Hiện không có quỹ đóng góp nào đang hoạt động.</Alert>
            ) : (
                <Grid container spacing={3}>
                    {campaigns.map((campaign) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={campaign.id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4
                                }
                            }}>
                                {campaign.image_path && (
                                    <CardMedia
                                        component="img"
                                        height="160"
                                        image={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${campaign.image_path}`}
                                        alt={campaign.title}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                )}
                                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                                    <Typography variant="h6" gutterBottom fontWeight="bold" noWrap>
                                        {campaign.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {campaign.description}
                                    </Typography>

                                    <Typography variant="caption" color="text.secondary" display="block">
                                        Ngày bắt đầu: {new Date(campaign.start_date).toLocaleDateString('vi-VN')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                        Ngày kết thúc: {new Date(campaign.end_date).toLocaleDateString('vi-VN')}
                                    </Typography>

                                    <Box sx={{ mt: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                {formatCurrency(campaign.current_amount)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Mục tiêu: {formatCurrency(campaign.target_amount)}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={getProgress(campaign.current_amount, campaign.target_amount)}
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                            {getProgress(campaign.current_amount, campaign.target_amount).toFixed(1)}% hoàn thành
                                        </Typography>
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => navigate(`/resident/fund/detail/${campaign.id}`)}
                                    >
                                        Xem chi tiết
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </>
    );
}
