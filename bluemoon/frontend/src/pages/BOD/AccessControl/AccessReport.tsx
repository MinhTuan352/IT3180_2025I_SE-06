// src/pages/BOD/AccessControl/AccessReport.tsx
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    TextField,
    CircularProgress,
    Chip,
    Stack,
    Card,
    CardContent,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarningIcon from '@mui/icons-material/Warning';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// API
import { getReportData, exportReportPDF, type ReportData } from '../../../api/accessApi';

export default function AccessReport() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    // Date filters - default to last 7 days
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Load report data
    const loadReport = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getReportData(startDate, endDate);
            setReportData(data);
        } catch (error) {
            console.error('Error loading report:', error);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    // Initial load
    useEffect(() => {
        loadReport();
    }, []);

    // Handle export PDF
    const handleExportPDF = () => {
        exportReportPDF(startDate, endDate);
    };

    // Status chip helper
    const getStatusChip = (status: string) => {
        if (status === 'Alert') {
            return <Chip icon={<SecurityIcon />} label="BÁO ĐỘNG" color="error" size="small" sx={{ fontWeight: 'bold' }} />;
        }
        return <Chip icon={<WarningIcon />} label="Cảnh báo" color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
    };

    // Columns for anomaly table
    const columns: GridColDef[] = [
        {
            field: 'created_at',
            headerName: 'Thời gian',
            width: 160,
            valueFormatter: (value: string) => value ? format(new Date(value), 'HH:mm:ss dd/MM/yyyy') : ''
        },
        { field: 'plate_number', headerName: 'Biển số', width: 130, renderCell: (params) => <strong>{params.value}</strong> },
        { field: 'vehicle_type', headerName: 'Loại xe', width: 100 },
        { field: 'gate', headerName: 'Cổng', width: 100 },
        {
            field: 'direction',
            headerName: 'Hướng',
            width: 80,
            renderCell: (params: GridRenderCellParams) => (
                <Chip label={params.value === 'In' ? 'Vào' : 'Ra'} size="small" variant="outlined" />
            )
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 140,
            renderCell: (params: GridRenderCellParams) => getStatusChip(params.value)
        },
        { field: 'note', headerName: 'Ghi chú', flex: 1, minWidth: 200 },
    ];

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/bod/access-control')}
                    >
                        Quay lại
                    </Button>
                    <Typography variant="h5" fontWeight="bold">
                        <AssessmentIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                        BÁO CÁO PHÂN TÍCH RA VÀO
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="error"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={handleExportPDF}
                    disabled={!reportData}
                >
                    Xuất PDF
                </Button>
            </Box>

            {/* Date Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        label="Từ ngày"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                    />
                    <TextField
                        label="Đến ngày"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                    />
                    <Button
                        variant="contained"
                        onClick={loadReport}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={20} /> : 'Lọc'}
                    </Button>
                </Stack>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            ) : reportData ? (
                <>
                    {/* Stats Cards */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ bgcolor: '#e3f2fd' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                    <Typography variant="h3" color="primary.main" fontWeight="bold">
                                        {reportData.stats.total}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Tổng lượt ra vào</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ bgcolor: '#e8f5e9' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                                    <Typography variant="h3" color="success.main" fontWeight="bold">
                                        {reportData.stats.normalCount}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Bình thường</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ bgcolor: '#fff3e0' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                                    <Typography variant="h3" color="warning.main" fontWeight="bold">
                                        {reportData.stats.warningCount}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Cảnh báo</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ bgcolor: '#ffebee' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <SecurityIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                                    <Typography variant="h3" color="error.main" fontWeight="bold">
                                        {reportData.stats.alertCount}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Báo động</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Anomaly Table */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            <WarningIcon sx={{ mr: 1, verticalAlign: 'bottom', color: 'warning.main' }} />
                            Danh sách trường hợp bất thường ({reportData.anomalies.length})
                        </Typography>
                        {reportData.anomalies.length > 0 ? (
                            <Box sx={{ height: 400 }}>
                                <DataGrid
                                    rows={reportData.anomalies}
                                    columns={columns}
                                    initialState={{
                                        pagination: { paginationModel: { pageSize: 10 } },
                                    }}
                                    pageSizeOptions={[10, 25, 50]}
                                    disableRowSelectionOnClick
                                    getRowId={(row) => row.id}
                                    sx={{ border: 0 }}
                                />
                            </Box>
                        ) : (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                                <Typography color="text.secondary">
                                    Không có trường hợp bất thường trong khoảng thời gian này.
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </>
            ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Chọn khoảng thời gian và nhấn "Lọc" để xem báo cáo</Typography>
                </Paper>
            )}
        </Box>
    );
}
