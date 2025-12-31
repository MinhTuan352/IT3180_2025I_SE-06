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
    FormControl,
    FormLabel,
    Stack,
    Tooltip,
    Divider,
    CircularProgress
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import donationApi, { type FundCampaign, type Donation } from '../../../api/donationApi';
import { API_BASE_URL } from '../../../api/axiosClient';
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

    // Donate Modal State
    const [donateOpen, setDonateOpen] = useState(false);
    const [step, setStep] = useState<'input' | 'qr' | 'success'>('input');
    const [qRInfo, setQRInfo] = useState<any>(null); // Store info from initiate response

    // Form Data
    const [donationData, setDonationData] = useState({
        amount: '',
        note: '',
        is_anonymous: false,
    });
    const [submitting, setSubmitting] = useState(false);
    const [amountError, setAmountError] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    // Polling Effect
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (donateOpen && step === 'qr' && qRInfo && qRInfo.tempId) {
            const pollStatus = async () => {
                try {
                    const res = await donationApi.checkStatus(qRInfo.tempId);
                    if (res.data?.status === 'completed') {
                        setStep('success');
                        toast.success('Đóng góp thành công!');
                        fetchData(); // Refresh list
                    }
                } catch (err) {
                    console.error('Polling error', err);
                }
            };

            // Poll every 3 seconds
            intervalId = setInterval(pollStatus, 3000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [donateOpen, step, qRInfo]);

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

    const handleInitiateDonate = async () => {
        if (!donationData.amount || Number(donationData.amount) <= 0) {
            setAmountError(true);
            toast.error('Vui lòng nhập số tiền hợp lệ');
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading('Đang tạo mã QR...');

        try {
            const res = await donationApi.initiateDonation({
                campaign_id: Number(id),
                amount: Number(donationData.amount),
                note: donationData.note,
                is_anonymous: donationData.is_anonymous,
            });

            if (res.data.success) {
                setQRInfo(res.data.data);
                setStep('qr');
                toast.dismiss(toastId);
            }
        } catch (err: any) {
            toast.dismiss(toastId);
            toast.error(err.response?.data?.message || 'Lỗi khi tạo giao dịch. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setDonateOpen(false);
        // Reset state after a delay or immediately
        setTimeout(() => {
            setStep('input');
            setQRInfo(null);
            setDonationData({ amount: '', note: '', is_anonymous: false });
            setAmountError(false);
        }, 300);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Đã sao chép!');
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
                                    src={`${API_BASE_URL}${campaign.image_path}`}
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
            <Dialog open={donateOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Đóng góp vào quỹ
                    <IconButton onClick={handleCloseModal} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>

                    {/* STEP 1: INPUT */}
                    {step === 'input' && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <Alert severity="info" icon={<QrCodeScannerIcon />}>
                                Bạn cần nhập số tiền và bấm <strong>"Tạo mã QR"</strong> để nhận thông tin chuyển khoản.
                            </Alert>

                            <TextField
                                label="Số tiền (VNĐ) *"
                                type="number"
                                value={donationData.amount}
                                onChange={(e) => {
                                    setDonationData(prev => ({ ...prev, amount: e.target.value }));
                                    setAmountError(false);
                                }}
                                fullWidth
                                placeholder="Nhập số tiền muốn đóng góp"
                                autoFocus
                                error={amountError}
                                helperText={amountError ? "Vui lòng nhập số tiền lớn hơn 0" : "Hệ thống sẽ tạo mã QR tương ứng với số tiền này"}
                            />

                            <FormControl>
                                <FormLabel>Phương thức thanh toán</FormLabel>
                                <Box sx={{ p: 1.5, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f5f5f5', mt: 0.5 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <QrCodeScannerIcon color="primary" />
                                        <Typography variant="body2" fontWeight="medium">Chuyển khoản Ngân hàng (QR Code)</Typography>
                                    </Stack>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                    * Nếu muốn đóng góp bằng tiền mặt, vui lòng liên hệ trực tiếp Văn phòng Kế toán (Tầng 1 - Tòa A).
                                </Typography>
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
                        </Box>
                    )}

                    {/* STEP 2: QR CODE */}
                    {step === 'qr' && qRInfo && (
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    Vui lòng chuyển khoản chính xác <strong>Số tiền</strong> và <strong>Nội dung</strong> dưới đây để hệ thống tự động ghi nhận.
                                </Alert>
                            </Grid>

                            {/* QR Image */}
                            <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: 'center' }}>
                                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                    <img
                                        src={qRInfo.qrUrl}
                                        alt="QR Code"
                                        style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #eee' }}
                                    />
                                    <Chip
                                        icon={<RefreshIcon sx={{ animation: 'spin 1s linear infinite' }} />}
                                        label="Đang chờ nhận tiền..."
                                        color="primary"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            bottom: -15,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            bgcolor: 'white',
                                            boxShadow: 2,
                                            '@keyframes spin': {
                                                '0%': { transform: 'rotate(0deg)' },
                                                '100%': { transform: 'rotate(360deg)' }
                                            }
                                        }}
                                    />
                                </Box>
                            </Grid>

                            {/* Info */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Stack spacing={2} sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 2 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" textTransform="uppercase">Ngân hàng</Typography>
                                        <Typography variant="body1" fontWeight="bold">{qRInfo.bankName}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" textTransform="uppercase">Số tài khoản</Typography>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>{qRInfo.accountNo}</Typography>
                                            <Tooltip title="Sao chép">
                                                <IconButton size="small" onClick={() => copyToClipboard(qRInfo.accountNo)}>
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" textTransform="uppercase">Chủ tài khoản</Typography>
                                        <Typography variant="body1" fontWeight="bold">{qRInfo.accountName}</Typography>
                                    </Box>
                                    <Divider />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" textTransform="uppercase">Số tiền</Typography>
                                        <Typography variant="h5" color="primary" fontWeight="bold">
                                            {formatCurrency(qRInfo.amount)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 1, border: '1px dashed #2196f3' }}>
                                        <Typography variant="caption" color="primary" fontWeight="bold" textTransform="uppercase">Nội dung chuyển khoản (Bắt buộc)</Typography>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography variant="h6" fontWeight="bold" color="primary" sx={{ fontFamily: 'monospace' }}>
                                                {qRInfo.transferContent}
                                            </Typography>
                                            <Tooltip title="Sao chép">
                                                <IconButton size="small" color="primary" onClick={() => copyToClipboard(qRInfo.transferContent)}>
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Grid>


                        </Grid>
                    )}

                    {/* STEP 3: SUCCESS */}
                    {step === 'success' && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                            <Typography variant="h5" gutterBottom color="success.main" fontWeight="bold">
                                Cảm ơn bạn!
                            </Typography>
                            <Typography color="text.secondary">
                                Đóng góp của bạn đã được ghi nhận thành công.
                            </Typography>
                        </Box>
                    )}

                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    {step === 'success' ? (
                        <Button onClick={handleCloseModal} variant="contained" fullWidth size="large">Đóng</Button>
                    ) : (
                        <>
                            <Button onClick={handleCloseModal} color="inherit">
                                {step === 'qr' ? 'Thoát' : 'Hủy'}
                            </Button>
                            {step === 'input' && (
                                <Button
                                    variant="contained"
                                    onClick={handleInitiateDonate}
                                    disabled={submitting}
                                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <QrCodeScannerIcon />}
                                >
                                    {submitting ? 'Đang tạo mã...' : 'Tạo mã QR & Cú pháp'}
                                </Button>
                            )}
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}
