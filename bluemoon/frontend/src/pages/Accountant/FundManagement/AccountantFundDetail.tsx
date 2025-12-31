// src/pages/Accountant/FundManagement/AccountantFundDetail.tsx
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
    Autocomplete,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import donationApi, { type FundCampaign, type Donation } from '../../../api/donationApi';
import { residentApi, type Resident } from '../../../api/residentApi';
import * as XLSX from 'xlsx';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export default function AccountantFundDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [campaign, setCampaign] = useState<FundCampaign | null>(null);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [residents, setResidents] = useState<Resident[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit Modal
    const [editOpen, setEditOpen] = useState(false);
    const [editData, setEditData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        target_amount: '',
    });
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

    // Add Contribution Modal
    const [addOpen, setAddOpen] = useState(false);
    const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
    const [contributionData, setContributionData] = useState({
        amount: '',
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
            const [campaignRes, donationsRes, residentsRes] = await Promise.all([
                donationApi.getCampaignDetail(Number(id)),
                donationApi.getStatement(Number(id)),
                residentApi.getAll(),
            ]);

            setCampaign(campaignRes.data.data);
            setDonations(donationsRes.data.data);
            setResidents(residentsRes);

            // Populate edit form
            const c = campaignRes.data.data;
            setEditData({
                title: c.title,
                description: c.description || '',
                start_date: c.start_date?.split('T')[0] || '',
                end_date: c.end_date?.split('T')[0] || '',
                target_amount: String(c.target_amount || ''),
            });
            // Reset image state
            setEditImageFile(null);
            setEditImagePreview(c.image_path ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${c.image_path}` : null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải thông tin quỹ');
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubmit = async () => {
        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', editData.title);
            data.append('description', editData.description);
            data.append('start_date', editData.start_date);
            data.append('end_date', editData.end_date);
            data.append('target_amount', editData.target_amount || '0');
            if (editImageFile) {
                data.append('image', editImageFile);
            }

            await donationApi.updateCampaign(Number(id), data);
            setEditOpen(false);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddContribution = async () => {
        if (!selectedResident || !contributionData.amount) {
            setError('Vui lòng chọn cư dân và nhập số tiền');
            return;
        }

        setSubmitting(true);
        try {
            await donationApi.recordOffline({
                campaign_id: Number(id),
                resident_id: selectedResident.id,
                amount: Number(contributionData.amount),
                note: contributionData.note,
                is_anonymous: contributionData.is_anonymous,
            });

            setAddOpen(false);
            setSelectedResident(null);
            setContributionData({ amount: '', note: '', is_anonymous: false });
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi khi ghi nhận đóng góp');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseCampaign = async () => {
        if (!confirm('Bạn có chắc muốn đóng quỹ này? Sau khi đóng sẽ không thể nhận thêm đóng góp.')) return;

        try {
            await donationApi.closeCampaign(Number(id));
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi khi đóng quỹ');
        }
    };

    const handleExport = () => {
        const exportData = donations.map((d, idx) => ({
            'STT': idx + 1,
            'Người đóng góp': d.full_name,
            'Căn hộ': d.apartment_code,
            'Số tiền': d.amount,
            'Phương thức': d.payment_method === 'Cash' ? 'Tiền mặt' : 'Chuyển khoản',
            'Ghi chú': d.note || '',
            'Ngày': new Date(d.transaction_date).toLocaleDateString('vi-VN'),
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sao kê');
        XLSX.writeFile(wb, `SaoKe_${campaign?.title || 'Quy'}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
            field: 'payment_method',
            headerName: 'Phương thức',
            width: 120,
            renderCell: (params) => params.value === 'Cash' ? 'Tiền mặt' : 'Chuyển khoản'
        },
        { field: 'note', headerName: 'Ghi chú', flex: 1, minWidth: 120 },
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
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate('/accountance/fund/list')}>
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
                                    src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${campaign.image_path}`}
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
                                    <strong>{donations.length}</strong> lượt đóng góp
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
                            Chỉnh sửa quỹ
                        </Button>
                        {isActive && (
                            <>
                                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
                                    Ghi nhận đóng góp
                                </Button>
                                <Button variant="outlined" color="warning" startIcon={<LockIcon />} onClick={handleCloseCampaign}>
                                    Đóng quỹ
                                </Button>
                            </>
                        )}
                    </Box>
                </Grid>
            </Grid>

            {/* Donations Table */}
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">📋 Sao kê đóng góp</Typography>
                    <Button startIcon={<FileDownloadIcon />} onClick={handleExport} disabled={donations.length === 0}>
                        Xuất Excel
                    </Button>
                </Box>

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

            {/* Edit Modal */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Chỉnh sửa quỹ
                    <IconButton onClick={() => setEditOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
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
                                id="edit-fund-image"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setEditImageFile(file);
                                        setEditImagePreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                            <label htmlFor="edit-fund-image">
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
                                        backgroundImage: editImagePreview ? `url(${editImagePreview})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        '&:hover': { borderColor: 'primary.main' }
                                    }}
                                >
                                    {!editImagePreview && (
                                        <Box sx={{ textAlign: 'center' }}>
                                            <PhotoCameraIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary">Thêm/Thay đổi ảnh</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </label>
                            {editImagePreview && (
                                <Button size="small" onClick={() => {
                                    setEditImageFile(null);
                                    setEditImagePreview(null);
                                }} sx={{ mt: 1 }}>Xóa ảnh</Button>
                            )}
                        </Box>
                        <TextField
                            label="Tên quỹ"
                            value={editData.title}
                            onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                            fullWidth
                        />
                        <TextField
                            label="Mô tả"
                            value={editData.description}
                            onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Ngày bắt đầu"
                                    type="date"
                                    value={editData.start_date}
                                    onChange={(e) => setEditData(prev => ({ ...prev, start_date: e.target.value }))}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Ngày kết thúc"
                                    type="date"
                                    value={editData.end_date}
                                    onChange={(e) => setEditData(prev => ({ ...prev, end_date: e.target.value }))}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                        <TextField
                            label="Mục tiêu (VNĐ)"
                            type="number"
                            value={editData.target_amount}
                            onChange={(e) => setEditData(prev => ({ ...prev, target_amount: e.target.value }))}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleEditSubmit} disabled={submitting}>
                        {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Contribution Modal */}
            <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Ghi nhận đóng góp
                    <IconButton onClick={() => setAddOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <Autocomplete
                            options={residents}
                            getOptionLabel={(option) => `${option.full_name} (${option.apartment_code || 'N/A'})`}
                            value={selectedResident}
                            onChange={(_, newValue) => setSelectedResident(newValue)}
                            renderInput={(params) => <TextField {...params} label="Chọn cư dân *" />}
                        />
                        <TextField
                            label="Số tiền (VNĐ) *"
                            type="number"
                            value={contributionData.amount}
                            onChange={(e) => setContributionData(prev => ({ ...prev, amount: e.target.value }))}
                            fullWidth
                        />
                        <TextField
                            label="Ghi chú"
                            value={contributionData.note}
                            onChange={(e) => setContributionData(prev => ({ ...prev, note: e.target.value }))}
                            fullWidth
                            multiline
                            rows={2}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={contributionData.is_anonymous}
                                    onChange={(e) => setContributionData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                                />
                            }
                            label="Ẩn danh (không hiển thị tên trong sao kê công khai)"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddOpen(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleAddContribution} disabled={submitting}>
                        {submitting ? 'Đang lưu...' : 'Ghi nhận'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
