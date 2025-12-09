// src/pages/Simulator/BarrierSimulator.tsx
import {
    Box,
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    Alert,
    Snackbar,
    CircularProgress,
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';

// Icons
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningIcon from '@mui/icons-material/Warning';

// API
import { getSimulatorVehicles, simulateAccess, type SimulatorVehicle } from '../../api/accessApi';

export default function BarrierSimulator() {
    const [vehicles, setVehicles] = useState<SimulatorVehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
        open: false,
        message: '',
        severity: 'success'
    });
    const [simulating, setSimulating] = useState<string | null>(null);

    // Load vehicles
    const loadVehicles = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getSimulatorVehicles();
            setVehicles(data);
        } catch (error) {
            console.error('Error loading vehicles:', error);
            setSnackbar({
                open: true,
                message: 'Không thể tải danh sách xe',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadVehicles();
    }, [loadVehicles]);

    // Handle simulate
    const handleSimulate = async (vehicle: SimulatorVehicle, direction: 'In' | 'Out') => {
        try {
            setSimulating(`${vehicle.id}-${direction}`);

            await simulateAccess({
                plate_number: vehicle.license_plate,
                direction
            });

            setSnackbar({
                open: true,
                message: `✅ Đã ghi nhận xe ${vehicle.license_plate} ${direction === 'In' ? 'VÀO' : 'RA'}`,
                severity: 'success'
            });
        } catch (error) {
            console.error('Error simulating access:', error);
            setSnackbar({
                open: true,
                message: 'Lỗi khi mô phỏng ra vào',
                severity: 'error'
            });
        } finally {
            setSimulating(null);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#1a237e', color: 'white' }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    🚧 BARRIER SIMULATOR
                </Typography>
                <Typography variant="body1">
                    Trang mô phỏng hệ thống cổng ra vào. Click vào nút "Vào" hoặc "Ra" để giả lập xe đi qua barrier.
                </Typography>
            </Paper>

            <Alert severity="info" sx={{ mb: 3 }}>
                <strong>Hướng dẫn:</strong> Chọn xe từ danh sách và nhấn nút "Vào" hoặc "Ra" để mô phỏng.
                Dữ liệu sẽ tự động cập nhật trên trang Quản lý Ra Vào của BOD.
            </Alert>

            {/* Vehicle Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell><strong>Biển số</strong></TableCell>
                            <TableCell><strong>Loại xe</strong></TableCell>
                            <TableCell><strong>Chủ xe</strong></TableCell>
                            <TableCell><strong>Căn hộ</strong></TableCell>
                            <TableCell><strong>Hãng / Model</strong></TableCell>
                            <TableCell align="center"><strong>Hành động</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {vehicles.map((vehicle) => (
                            <TableRow
                                key={vehicle.id}
                                sx={{
                                    bgcolor: vehicle.isBlacklist ? '#ffebee' : (vehicle.isSimulated ? '#fff3e0' : 'inherit'),
                                    '&:hover': { bgcolor: vehicle.isBlacklist ? '#ffcdd2' : (vehicle.isSimulated ? '#ffe0b2' : '#f5f5f5') }
                                }}
                            >
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        {vehicle.isBlacklist && <WarningIcon color="error" fontSize="small" />}
                                        <Typography fontWeight="bold" color={vehicle.isBlacklist ? 'error' : 'inherit'}>
                                            {vehicle.license_plate}
                                        </Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        {vehicle.vehicle_type === 'Ô tô' ?
                                            <DirectionsCarIcon color="action" /> :
                                            <TwoWheelerIcon color="action" />
                                        }
                                        <span>{vehicle.vehicle_type}</span>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    {vehicle.isSimulated ? (
                                        <Chip
                                            label={vehicle.owner_name}
                                            size="small"
                                            color={vehicle.isBlacklist ? 'error' : 'warning'}
                                        />
                                    ) : (
                                        vehicle.owner_name
                                    )}
                                </TableCell>
                                <TableCell>{vehicle.apartment_code}</TableCell>
                                <TableCell>
                                    {vehicle.brand !== 'N/A' ? `${vehicle.brand} ${vehicle.model}` : '---'}
                                </TableCell>
                                <TableCell align="center">
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="small"
                                            startIcon={<LoginIcon />}
                                            onClick={() => handleSimulate(vehicle, 'In')}
                                            disabled={simulating === `${vehicle.id}-In`}
                                        >
                                            {simulating === `${vehicle.id}-In` ? <CircularProgress size={16} /> : 'Vào'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                            startIcon={<LogoutIcon />}
                                            onClick={() => handleSimulate(vehicle, 'Out')}
                                            disabled={simulating === `${vehicle.id}-Out`}
                                        >
                                            {simulating === `${vehicle.id}-Out` ? <CircularProgress size={16} /> : 'Ra'}
                                        </Button>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
