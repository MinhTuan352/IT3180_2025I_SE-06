// src/pages/Resident/Fund/ResidentFundDetail.tsx
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    LinearProgress,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Checkbox,
    Alert,
    IconButton,
    RadioGroup,
    Radio,
    FormControl,
    FormLabel,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import CloseIcon from '@mui/icons-material/Close';
import donationApi, { type FundCampaign, type Donation } from '../../../api/donationApi';
import toast, { Toaster } from 'react-hot-toast';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export default function ResidentFundDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [campaign, setCampaign] = useState<FundCampaign | null>(null);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Donate Modal
    const [donateOpen, setDonateOpen] = useState(false);
    const [donationData, setDonationData] = useState({
        amount: '',
        payment_method: 'Transfer',
        note: '',
        is_anonymous: false,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [campaignRes, donationsRes] = await Promise.all([
                donationApi.getCampaignDetail(Number(id)),
                donationApi.getStatement(Number(id)),
            ]);

            setCampaign(campaignRes.data.data);
            setDonations(donationsRes.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải thông tin quỹ');
        } finally {
            setLoading(false);
        }
    };

    const handleDonate = async () => {
        if (!donationData.amount || Number(donationData.amount) <= 0) {
            toast.error('Vui lòng nhập số tiền hợp lệ');
            return;
        }

        setSubmitting(true);
        try {
            await donationApi.donate({
                campaign_id: Number(id),
                amount: Number(donationData.amount),
                payment_method: donationData.payment_method,
                note: donationData.note,
                is_anonymous: donationData.is_anonymous,
            });

            toast.success('Đóng góp thành công! Cảm ơn bạn đã chung tay.');
            setDonateOpen(false);
            setDonationData({ amount: '', payment_method: 'Transfer', note: '', is_anonymous: false });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Lỗi khi đóng góp');
        } finally {
            setSubmitting(false);
        }
    };

    const columns: GridColDef[] = [
        { field: 'stt', headerName: 'STT', width: 60 },
        { field: 'full_name', headerName: 'Người đóng góp', flex: 1, minWidth: 150 },
        { field: 'apartment_code', headerName: 'Căn hộ', width: 100 },
        {
            field: 'amount',
            headerName: 'Số tiền',
            width: 130,
            renderCell: (params) => (
                <Typography color="success.main" fontWeight="bold">
                    {formatCurrency(params.value)}
                </Typography>
            )
        },
        {
            field: 'transaction_date',
            headerName: 'Ngày',
            width: 120,
            renderCell: (params) => new Date(params.value).toLocaleDateString('vi-VN')
        },
    ];

    const rows = donations.map((d, idx) => ({ ...d, stt: idx + 1 }));

    if (loading) return <LinearProgress />;
    if (!campaign) return <Alert severity="error">Không tìm thấy quỹ</Alert>;

    const progress = campaign.target_amount > 0
        ? Math.min((campaign.current_amount / campaign.target_amount) * 100, 100)
        : 0;
    const isActive = campaign.status === 'Active' && new Date(campaign.end_date) >= new Date();

    return (
        <Box>
            <Toaster position="top-right" />

            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate('/resident/fund/list')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
                    {campaign.title}
                </Typography>
                <Chip
                    label={isActive ? 'Đang mở' : 'Đã kết thúc'}
                    color={isActive ? 'success' : 'default'}
                />
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {/* Info Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, lg: 9 }}>
                    <Card>
                        <CardContent>
                            {/* Image */}
                            {campaign.image_path && (
                                <Box
                                    component="img"
                                    src={`http://localhost:3000${campaign.image_path}`}
                                    alt={campaign.title}
                                    sx={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 2, mb: 2 }}
                                />
                            )}

                            <Typography variant="h6" fontWeight="bold" gutterBottom>Nội dung</Typography>
                            <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                {campaign.description || 'Chưa có mô tả'}
                            </Typography>

                            <Box sx={{ mt: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    📅 Thời gian: {new Date(campaign.start_date).toLocaleDateString('vi-VN')} - {new Date(campaign.end_date).toLocaleDateString('vi-VN')}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 3 }}>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Tiến độ</Typography>

                            <Typography variant="h4" color="primary" fontWeight="bold">
                                {formatCurrency(campaign.current_amount)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                / Mục tiêu: {formatCurrency(campaign.target_amount)}
                            </Typography>

                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ height: 12, borderRadius: 6, my: 2 }}
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">
                                    <strong>{progress.toFixed(1)}%</strong> hoàn thành
                                </Typography>
                                <Typography variant="body2">
                                    <strong>{donations.length}</strong> lượt
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Donate Button */}
                    {isActive && (
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<VolunteerActivismIcon />}
                            onClick={() => setDonateOpen(true)}
                            sx={{ py: 1.5 }}
                        >
                            Đóng góp ngay
                        </Button>
                    )}
                </Grid>
            </Grid>

            {/* Donations Table */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>📋 Danh sách đóng góp</Typography>

                <DataGrid
                    rows={rows}
                    columns={columns}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    autoHeight
                    disableRowSelectionOnClick
                    localeText={{
                        noRowsLabel: 'Chưa có đóng góp nào',
                    }}
                />
            </Paper>

            {/* Donate Modal */}
            <Dialog open={donateOpen} onClose={() => setDonateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Đóng góp vào quỹ
                    <IconButton onClick={() => setDonateOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Số tiền (VNĐ) *"
                            type="number"
                            value={donationData.amount}
                            onChange={(e) => setDonationData(prev => ({ ...prev, amount: e.target.value }))}
                            fullWidth
                            placeholder="Nhập số tiền muốn đóng góp"
                        />

                        <FormControl>
                            <FormLabel>Phương thức thanh toán</FormLabel>
                            <RadioGroup
                                value={donationData.payment_method}
                                onChange={(e) => setDonationData(prev => ({ ...prev, payment_method: e.target.value }))}
                            >
                                <FormControlLabel value="Transfer" control={<Radio />} label="Chuyển khoản" />
                                <FormControlLabel value="Cash" control={<Radio />} label="Tiền mặt" />
                            </RadioGroup>
                        </FormControl>

                        <TextField
                            label="Ghi chú"
                            value={donationData.note}
                            onChange={(e) => setDonationData(prev => ({ ...prev, note: e.target.value }))}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Lời nhắn (tùy chọn)"
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={donationData.is_anonymous}
                                    onChange={(e) => setDonationData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                                />
                            }
                            label="Ẩn danh (không hiển thị tên trong danh sách công khai)"
                        />

                        <Alert severity="info">
                            Sau khi đóng góp, số tiền sẽ được ghi nhận và hiển thị trong sao kê.
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDonateOpen(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleDonate} disabled={submitting}>
                        {submitting ? 'Đang xử lý...' : 'Xác nhận đóng góp'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
