// src/pages/Resident/Fund/ResidentDonationHistory.tsx
import {
    Box,
    Typography,
    Paper,
    Chip,
    Alert,
    LinearProgress,
    IconButton,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import donationApi, { type Donation } from '../../../api/donationApi';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export default function ResidentDonationHistory() {
    const navigate = useNavigate();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await donationApi.getMyHistory();
            setDonations(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải lịch sử đóng góp');
        } finally {
            setLoading(false);
        }
    };

    const columns: GridColDef[] = [
        { field: 'stt', headerName: 'STT', width: 60 },
        {
            field: 'campaign_title',
            headerName: 'Quỹ',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Typography fontWeight="bold">{params.value || 'N/A'}</Typography>
            )
        },
        {
            field: 'amount',
            headerName: 'Số tiền',
            width: 150,
            renderCell: (params) => (
                <Typography color="success.main" fontWeight="bold">
                    {formatCurrency(params.value)}
                </Typography>
            )
        },
        {
            field: 'payment_method',
            headerName: 'Phương thức',
            width: 130,
            renderCell: (params) => params.value === 'Cash' ? 'Tiền mặt' : 'Chuyển khoản'
        },
        {
            field: 'is_anonymous',
            headerName: 'Hiển thị',
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Ẩn danh' : 'Công khai'}
                    size="small"
                    color={params.value ? 'default' : 'success'}
                />
            )
        },
        { field: 'note', headerName: 'Ghi chú', flex: 1, minWidth: 150 },
        {
            field: 'transaction_date',
            headerName: 'Ngày',
            width: 120,
            renderCell: (params) => new Date(params.value).toLocaleDateString('vi-VN')
        },
    ];

    const rows = donations.map((d, idx) => ({ ...d, stt: idx + 1 }));

    // Calculate total
    const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate('/resident/fund/list')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
                    📊 Lịch sử đóng góp của tôi
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {/* Summary Card */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6" gutterBottom>Tổng đóng góp</Typography>
                <Typography variant="h3" fontWeight="bold">
                    {formatCurrency(totalDonated)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    Qua {donations.length} lần đóng góp - Cảm ơn bạn đã chung tay cùng cộng đồng! 🙏
                </Typography>
            </Paper>

            {/* Data Table */}
            <Paper sx={{ p: 2 }}>
                {loading ? (
                    <LinearProgress />
                ) : (
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                        autoHeight
                        disableRowSelectionOnClick
                        localeText={{
                            noRowsLabel: 'Bạn chưa có đóng góp nào',
                        }}
                    />
                )}
            </Paper>
        </Box>
    );
}
