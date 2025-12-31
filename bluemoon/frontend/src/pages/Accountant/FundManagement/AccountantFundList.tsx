// src/pages/Accountant/FundManagement/AccountantFundList.tsx
import {
    Box,
    Typography,
    Button,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Grid,
    Chip,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    IconButton,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import donationApi, { type FundCampaign } from '../../../api/donationApi';
import { API_BASE_URL } from '../../../api/axiosClient';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const getStatusChip = (status: string, endDate: string) => {
    const isExpired = new Date(endDate) < new Date();
    if (status === 'Closed' || isExpired) {
        return <Chip label="Đã kết thúc" color="default" size="small" />;
    }
    if (status === 'Active') {
        return <Chip label="Đang mở" color="success" size="small" />;
    }
    return <Chip label={status} color="info" size="small" />;
};

export default function AccountantFundList() {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<FundCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [openModal, setOpenModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        target_amount: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const response = await donationApi.getCampaigns();
            setCampaigns(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải danh sách quỹ');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.start_date || !formData.end_date) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('start_date', formData.start_date);
            data.append('end_date', formData.end_date);
            data.append('target_amount', formData.target_amount || '0');
            if (imageFile) {
                data.append('image', imageFile);
            }

            await donationApi.createCampaign(data);
            setOpenModal(false);
            setFormData({ title: '', description: '', start_date: '', end_date: '', target_amount: '' });
            setImageFile(null);
            setImagePreview(null);
            fetchCampaigns();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi khi tạo quỹ');
        } finally {
            setSubmitting(false);
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
                    🎗️ Quản lý Quỹ Đóng góp
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<BarChartIcon />}
                        onClick={() => navigate('/accountance/fund/stats')}
                    >
                        Thống kê
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenModal(true)}
                    >
                        Tạo quỹ mới
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {loading ? (
                <LinearProgress />
            ) : campaigns.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary">Chưa có quỹ nào. Hãy tạo quỹ đầu tiên!</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {campaigns.map((campaign) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={campaign.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                                <CardMedia
                                    component="img"
                                    height="160"
                                    image={campaign.image_path ? `${API_BASE_URL}${campaign.image_path}` : 'https://via.placeholder.com/400x200?text=Qu%E1%BB%B9+%C4%90%C3%B3ng+G%C3%B3p'}
                                    alt={campaign.title}
                                    sx={{ objectFit: 'cover' }}
                                />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
                                            {campaign.title}
                                        </Typography>
                                        {getStatusChip(campaign.status, campaign.end_date)}
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                                        {campaign.description?.substring(0, 80) || 'Chưa có mô tả'}...
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
                                        📅 {new Date(campaign.start_date).toLocaleDateString('vi-VN')} - {new Date(campaign.end_date).toLocaleDateString('vi-VN')}
                                    </Typography>
                                </CardContent>

                                <CardActions sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<VisibilityIcon />}
                                        fullWidth
                                        onClick={() => navigate(`/accountance/fund/detail/${campaign.id}`)}
                                    >
                                        Xem chi tiết
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Create Fund Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Tạo Quỹ Mới
                    <IconButton onClick={() => setOpenModal(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        {/* Image Upload */}
                        <Box sx={{ textAlign: 'center' }}>
                            <input
                                type="file"
                                accept="image/*"
                                id="fund-image-upload"
                                style={{ display: 'none' }}
                                onChange={handleImageChange}
                            />
                            <label htmlFor="fund-image-upload">
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: 150,
                                        border: '2px dashed #ccc',
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        '&:hover': { borderColor: 'primary.main' }
                                    }}
                                >
                                    {!imagePreview && (
                                        <Box sx={{ textAlign: 'center' }}>
                                            <PhotoCameraIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary">Thêm ảnh đại diện</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </label>
                        </Box>

                        <TextField
                            label="Tên quỹ *"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />

                        <TextField
                            label="Mô tả"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            fullWidth
                            multiline
                            rows={3}
                        />

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Ngày bắt đầu *"
                                    name="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Ngày kết thúc *"
                                    name="end_date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={handleInputChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            label="Mục tiêu (VNĐ)"
                            name="target_amount"
                            type="number"
                            value={formData.target_amount}
                            onChange={handleInputChange}
                            fullWidth
                            placeholder="Để trống nếu không có mục tiêu cụ thể"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenModal(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Đang tạo...' : 'Tạo quỹ'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
