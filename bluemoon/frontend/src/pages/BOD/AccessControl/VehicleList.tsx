// src/pages/BOD/AccessControl/VehicleList.tsx
import {
    Box, Typography, Paper, Button, Grid, CircularProgress, Alert,
    Modal, TextField, FormControl, InputLabel, Select, MenuItem,
    IconButton, Chip, Badge, Snackbar, Card, CardContent, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';

// Icons
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

import { vehicleApi, type Vehicle } from '../../../api/vehicleApi';

const modalStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '95%', sm: 550 },
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflow: 'auto'
};

export default function VehicleList({ readOnly = false }: { readOnly?: boolean }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isCQCN = location.pathname.startsWith('/cqcn');
    const basePath = isCQCN ? '/cqcn' : '/bod';

    // States
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [keyword, setKeyword] = useState('');

    // Pending Request Modal
    const [pendingModalOpen, setPendingModalOpen] = useState(false);
    const [pendingVehicles, setPendingVehicles] = useState<Vehicle[]>([]);
    const [pendingCount, setPendingCount] = useState(0);

    // Add Vehicle Modal
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        resident_id: '',
        vehicle_type: 'Xe máy' as 'Ô tô' | 'Xe máy',
        license_plate: '',
        brand: '',
        model: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success'
    });

    // Import
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch data
    const fetchVehicles = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await vehicleApi.getAllVehicles({
                status: statusFilter || undefined,
                keyword: keyword || undefined
            });
            setVehicles(data);
        } catch (err: any) {
            setError('Không thể tải danh sách xe');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingCount = async () => {
        try {
            const count = await vehicleApi.getPendingCount();
            setPendingCount(count);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchVehicles();
        fetchPendingCount();
    }, [statusFilter]);

    // Handle status update (approve/reject)
    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            await vehicleApi.updateVehicleStatus(id, status);
            setSnackbar({ open: true, message: `Đã cập nhật trạng thái: ${status}`, severity: 'success' });
            fetchVehicles();
            fetchPendingCount();
            // Update pending list if modal open
            if (pendingModalOpen) {
                const pending = await vehicleApi.getAllVehicles({ status: 'Chờ duyệt' });
                setPendingVehicles(pending);
            }
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Lỗi cập nhật', severity: 'error' });
        }
    };

    // Handle delete
    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa xe này?')) return;
        try {
            await vehicleApi.deleteVehicle(id);
            setSnackbar({ open: true, message: 'Đã xóa xe', severity: 'success' });
            fetchVehicles();
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Lỗi xóa xe', severity: 'error' });
        }
    };

    // Open Pending Modal
    const handleOpenPendingModal = async () => {
        try {
            const pending = await vehicleApi.getAllVehicles({ status: 'Chờ duyệt' });
            setPendingVehicles(pending);
            setPendingModalOpen(true);
        } catch (err) {
            console.error(err);
        }
    };

    // Handle Export
    const handleExport = async () => {
        try {
            // Create workbook from current data
            const exportData = vehicles.map(v => ({
                'Loại xe': v.vehicle_type,
                'Biển số': v.license_plate,
                'Hãng xe': v.brand || '',
                'Model': v.model || '',
                'Căn hộ': v.apartment_code || '',
                'Tòa nhà': v.building || '',
                'Chủ xe': v.owner_name || '',
                'Trạng thái': v.status,
                'Ngày đăng ký': v.registration_date || ''
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Danh sách xe');
            XLSX.writeFile(wb, `danh_sach_xe_${new Date().toISOString().split('T')[0]}.xlsx`);

            setSnackbar({ open: true, message: 'Xuất file thành công!', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: 'Lỗi xuất file', severity: 'error' });
        }
    };

    // Handle Import Click
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    // Handle File Change (Import)
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Preview and confirm
                const confirmed = window.confirm(`Tìm thấy ${jsonData.length} xe trong file. Bạn có muốn import?`);
                if (!confirmed) return;

                // Call API to import
                await vehicleApi.importVehicles(file);
                setSnackbar({ open: true, message: `Import thành công ${jsonData.length} xe`, severity: 'success' });
                fetchVehicles();
                fetchPendingCount();
            } catch (err: any) {
                setSnackbar({ open: true, message: err.response?.data?.message || 'Lỗi import file', severity: 'error' });
            }
        };
        reader.readAsBinaryString(file);

        // Reset input
        e.target.value = '';
    };

    // Handle Add Vehicle
    const handleAddVehicle = async () => {
        if (!newVehicle.license_plate || !newVehicle.resident_id) {
            setSnackbar({ open: true, message: 'Vui lòng nhập mã cư dân và biển số xe', severity: 'error' });
            return;
        }
        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('resident_id', newVehicle.resident_id);
            formData.append('vehicle_type', newVehicle.vehicle_type);
            formData.append('license_plate', newVehicle.license_plate.toUpperCase());
            if (newVehicle.brand) formData.append('brand', newVehicle.brand);
            if (newVehicle.model) formData.append('model', newVehicle.model);
            formData.append('status', 'Đang sử dụng'); // BOD add directly approved

            await vehicleApi.createVehicle(formData);
            setSnackbar({ open: true, message: 'Thêm xe thành công!', severity: 'success' });
            setAddModalOpen(false);
            setNewVehicle({ resident_id: '', vehicle_type: 'Xe máy', license_plate: '', brand: '', model: '' });
            fetchVehicles();
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Lỗi thêm xe', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // DataGrid Columns
    const columns: GridColDef[] = [
        {
            field: 'vehicle_type',
            headerName: 'Loại xe',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {params.value === 'Ô tô' ? <DirectionsCarIcon color="primary" /> : <TwoWheelerIcon color="secondary" />}
                    {params.value}
                </Box>
            )
        },
        {
            field: 'license_plate',
            headerName: 'Biển số',
            width: 130,
            renderCell: (params) => <strong>{params.value}</strong>
        },
        {
            field: 'brand',
            headerName: 'Hãng/Model',
            width: 150,
            valueGetter: (_value, row) => `${row.brand || ''} ${row.model ? `- ${row.model}` : ''}`
        },
        { field: 'apartment_code', headerName: 'Căn hộ', width: 100 },
        { field: 'building', headerName: 'Tòa', width: 80 },
        { field: 'owner_name', headerName: 'Chủ xe', width: 150 },
        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 140,
            renderCell: (params: GridRenderCellParams) => {
                let color: 'success' | 'warning' | 'default' = 'default';
                if (params.value === 'Đang sử dụng') color = 'success';
                if (params.value === 'Chờ duyệt') color = 'warning';
                return <Chip label={params.value} color={color} size="small" />;
            }
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 180,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {params.row.status === 'Chờ duyệt' && (
                        <>
                            <Tooltip title="Duyệt">
                                <IconButton
                                    color="success"
                                    size="small"
                                    onClick={() => handleStatusUpdate(params.row.id, 'Đang sử dụng')}
                                >
                                    <CheckCircleIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Từ chối">
                                <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => handleStatusUpdate(params.row.id, 'Ngừng sử dụng')}
                                >
                                    <CancelIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                    <Tooltip title="Xóa">
                        <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(params.row.id)}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    // Filter out actions column if readOnly
    const visibleColumns = readOnly ? columns.filter(col => col.field !== 'actions') : columns;

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => navigate(`${basePath}/access-control`)}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                <DirectionsCarIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                Danh sách Xe đăng ký
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tổng cộng: {vehicles.length} xe
                            </Typography>
                        </Box>
                    </Box>

                    {!readOnly && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                startIcon={<FileUploadIcon />}
                                onClick={handleImportClick}
                            >
                                Import
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<FileDownloadIcon />}
                                onClick={handleExport}
                            >
                                Export
                            </Button>
                            <Badge badgeContent={pendingCount} color="error">
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<PendingActionsIcon />}
                                    onClick={handleOpenPendingModal}
                                >
                                    Yêu cầu đăng ký
                                </Button>
                            </Badge>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={() => setAddModalOpen(true)}
                            >
                                Thêm xe
                            </Button>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Tìm biển số, tên chủ xe..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Trạng thái</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Trạng thái"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                <MenuItem value="Đang sử dụng">Đang sử dụng</MenuItem>
                                <MenuItem value="Chờ duyệt">Chờ duyệt</MenuItem>
                                <MenuItem value="Ngừng sử dụng">Ngừng sử dụng</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                        <Button
                            variant="contained"
                            onClick={fetchVehicles}
                            startIcon={<SearchIcon />}
                        >
                            Tìm kiếm
                        </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={() => { setKeyword(''); setStatusFilter(''); fetchVehicles(); }}
                            startIcon={<RefreshIcon />}
                        >
                            Làm mới
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Data Table */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <Paper sx={{ height: 600, borderRadius: 2 }}>
                    <DataGrid
                        rows={vehicles}
                        columns={visibleColumns}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 15 } }
                        }}
                        pageSizeOptions={[15, 30, 50]}
                        disableRowSelectionOnClick
                        getRowId={(row) => row.id}
                        sx={{ border: 0 }}
                    />
                </Paper>
            )}

            {/* Add Vehicle Modal */}
            <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        <AddCircleOutlineIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                        Thêm xe mới
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label="Mã cư dân *"
                                placeholder="VD: RES001"
                                value={newVehicle.resident_id}
                                onChange={(e) => setNewVehicle({ ...newVehicle, resident_id: e.target.value })}
                            />
                        </Grid>
                        <Grid size={12}>
                            <FormControl fullWidth>
                                <InputLabel>Loại xe</InputLabel>
                                <Select
                                    value={newVehicle.vehicle_type}
                                    label="Loại xe"
                                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value as any })}
                                >
                                    <MenuItem value="Xe máy">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TwoWheelerIcon /> Xe máy
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="Ô tô">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DirectionsCarIcon /> Ô tô
                                        </Box>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label="Biển số xe *"
                                placeholder="VD: 29A-12345"
                                value={newVehicle.license_plate}
                                onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value.toUpperCase() })}
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                fullWidth
                                label="Hãng xe"
                                placeholder="VD: Honda"
                                value={newVehicle.brand}
                                onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                fullWidth
                                label="Model"
                                placeholder="VD: Air Blade"
                                value={newVehicle.model}
                                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={() => setAddModalOpen(false)}>Hủy</Button>
                        <Button
                            variant="contained"
                            color="success"
                            disabled={submitting}
                            onClick={handleAddVehicle}
                        >
                            {submitting ? <CircularProgress size={20} /> : 'Thêm xe'}
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* Pending Requests Modal */}
            <Dialog
                open={pendingModalOpen}
                onClose={() => setPendingModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PendingActionsIcon color="warning" />
                        <Typography variant="h6" fontWeight="bold">
                            Yêu cầu đăng ký xe ({pendingVehicles.length})
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {pendingVehicles.length === 0 ? (
                        <Alert severity="info">Không có yêu cầu đăng ký nào đang chờ duyệt.</Alert>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            {pendingVehicles.map((vehicle) => (
                                <Card key={vehicle.id} variant="outlined">
                                    <CardContent>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid size={{ xs: 12, sm: 8 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    {vehicle.vehicle_type === 'Ô tô' ?
                                                        <DirectionsCarIcon sx={{ fontSize: 40 }} color="primary" /> :
                                                        <TwoWheelerIcon sx={{ fontSize: 40 }} color="secondary" />
                                                    }
                                                    <Box>
                                                        <Typography variant="h6" fontWeight="bold">
                                                            {vehicle.license_plate}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {vehicle.vehicle_type} | {vehicle.brand} {vehicle.model}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Căn hộ: <strong>{vehicle.apartment_code}</strong> |
                                                            Chủ xe: <strong>{vehicle.owner_name}</strong>
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        startIcon={<CheckCircleIcon />}
                                                        onClick={() => handleStatusUpdate(vehicle.id, 'Đang sử dụng')}
                                                    >
                                                        Duyệt
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        startIcon={<CancelIcon />}
                                                        onClick={() => handleStatusUpdate(vehicle.id, 'Ngừng sử dụng')}
                                                    >
                                                        Từ chối
                                                    </Button>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPendingModalOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
