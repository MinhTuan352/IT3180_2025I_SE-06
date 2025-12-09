// src/pages/BOD/AccessControl/AccessControl.tsx
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Chip,
  Stack,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';

// Icons
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

// API
import { getAccessLogs, getLatestAccess, getAccessStats, type AccessLog, type AccessStats } from '../../../api/accessApi';

// --- TYPE DEFINITIONS ---
type SecurityStatus = 'Normal' | 'Warning' | 'Alert';

export default function AccessControl() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [isLive, setIsLive] = useState(true); // Trạng thái nhận dữ liệu real-time
  const [latestLog, setLatestLog] = useState<AccessLog | null>(null);
  const [stats, setStats] = useState<AccessStats>({ totalToday: 0, warningCount: 0 });
  const [loading, setLoading] = useState(true);

  // Ref để tracking ID mới nhất đã xem
  const lastIdRef = useRef(0);

  // --- LOAD INITIAL DATA ---
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // Load logs
      const logsResponse = await getAccessLogs(1, 50);
      setLogs(logsResponse.data);

      // Set latest log
      if (logsResponse.data.length > 0) {
        setLatestLog(logsResponse.data[0]);
        lastIdRef.current = logsResponse.data[0].id;
      }

      // Load stats
      const statsData = await getAccessStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading access data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // --- POLLING FOR NEW DATA ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isLive) {
      interval = setInterval(async () => {
        try {
          // Check for new logs
          const response = await getLatestAccess(lastIdRef.current);

          if (response.hasNew && response.data.length > 0) {
            // Update latest log (show newest)
            setLatestLog(response.data[0]);
            lastIdRef.current = response.data[0].id;

            // Add new logs to the list
            setLogs((prevLogs) => [...response.data, ...prevLogs].slice(0, 50));

            // Refresh stats
            const statsData = await getAccessStats();
            setStats(statsData);
          }
        } catch (error) {
          console.error('Error polling for new data:', error);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => clearInterval(interval);
  }, [isLive]);

  // --- UI COMPONENTS ---

  // 1. Status Chip Helper
  const getStatusChip = (status: SecurityStatus) => {
    let color: "success" | "warning" | "error" = "success";
    let icon = <CheckCircleIcon />;
    let label = "Bình thường";

    if (status === 'Warning') { color = 'warning'; icon = <WarningIcon />; label = "Cảnh báo"; }
    if (status === 'Alert') { color = 'error'; icon = <SecurityIcon />; label = "BÁO ĐỘNG"; }

    return <Chip icon={icon} label={label} color={color} sx={{ fontWeight: 'bold' }} />;
  };

  // 2. Columns definition
  const columns: GridColDef[] = [
    {
      field: 'created_at',
      headerName: 'Thời gian',
      width: 150,
      valueFormatter: (value: string) => value ? format(new Date(value), 'HH:mm:ss dd/MM') : ''
    },
    { field: 'gate', headerName: 'Cổng', width: 100 },
    {
      field: 'direction', headerName: 'Hướng', width: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value === 'In' ? 'Vào' : 'Ra'} size="small" color={params.value === 'In' ? 'info' : 'default'} variant="outlined" />
      )
    },
    { field: 'plate_number', headerName: 'Biển số', width: 120, renderCell: (params) => <strong>{params.value}</strong> },
    {
      field: 'vehicle_type', headerName: 'Loại xe', width: 80,
      renderCell: (params) => params.value === 'Ô tô' ? <DirectionsCarIcon color="action" /> : <TwoWheelerIcon color="action" />
    },
    { field: 'resident_name', headerName: 'Chủ xe', width: 150, valueFormatter: (v) => v || '---' },
    {
      field: 'status', headerName: 'An ninh', width: 140,
      renderCell: (params: GridRenderCellParams) => getStatusChip(params.value)
    },
    { field: 'note', headerName: 'Ghi chú', flex: 1, minWidth: 200 },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* HEADER & CONTROLS */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          TRUNG TÂM KIỂM SOÁT RA VÀO (LIVE)
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant={isLive ? "contained" : "outlined"}
            color={isLive ? "success" : "inherit"}
            startIcon={isLive ? <PauseCircleOutlineIcon /> : <PlayCircleOutlineIcon />}
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? "Đang giám sát trực tiếp" : "Đã tạm dừng"}
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* --- KHỐI 1: LIVE FEED (Cột Trái - 4 phần) --- */}
        <Grid sx={{ xs: 12, md: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <span className="live-indicator" style={{ height: 10, width: 10, backgroundColor: isLive ? 'red' : 'gray', borderRadius: '50%', display: 'inline-block', marginRight: 8 }}></span>
            Camera Nhận diện
          </Typography>

          {latestLog ? (
            <Card sx={{
              border: latestLog.status === 'Alert' ? '3px solid red' : (latestLog.status === 'Warning' ? '3px solid orange' : '1px solid #ccc'),
              animation: latestLog.status === 'Alert' ? 'flash 1s infinite' : 'none'
            }}>
              <CardContent>
                <Box sx={{ position: 'relative' }}>
                  <img
                    src={latestLog.image_url || 'https://via.placeholder.com/300x200?text=Camera+Capture'}
                    alt="Vehicle"
                    style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
                  />
                  <Chip
                    label={latestLog.plate_number}
                    sx={{ position: 'absolute', bottom: 24, left: 8, bgcolor: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}
                  />
                </Box>

                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" fontWeight="bold">{format(new Date(latestLog.created_at), 'HH:mm:ss')}</Typography>
                    {getStatusChip(latestLog.status)}
                  </Box>
                  <Divider />
                  <Grid container>
                    <Grid sx={{ xs: 6 }}><Typography color="text.secondary">Cổng:</Typography> <strong>{latestLog.gate}</strong></Grid>
                    <Grid sx={{ xs: 6 }}><Typography color="text.secondary">Hướng:</Typography> <strong>{latestLog.direction === 'In' ? 'VÀO' : 'RA'}</strong></Grid>
                    <Grid sx={{ xs: 6 }}><Typography color="text.secondary">Loại xe:</Typography> <strong>{latestLog.vehicle_type}</strong></Grid>
                    <Grid sx={{ xs: 6 }}><Typography color="text.secondary">Chủ hộ:</Typography> <strong>{latestLog.resident_name || 'Khách'}</strong></Grid>
                  </Grid>
                  {latestLog.status !== 'Normal' && (
                    <Paper sx={{ p: 1, bgcolor: latestLog.status === 'Alert' ? '#ffebee' : '#fff3e0' }}>
                      <Typography color={latestLog.status === 'Alert' ? 'error' : 'warning.main'} fontWeight="bold">
                        ⚠️ {latestLog.note}
                      </Typography>
                    </Paper>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Paper sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f0f0' }}>
              <Typography color="text.secondary">Đang chờ tín hiệu...</Typography>
            </Paper>
          )}

          {/* Quick Stats (Thống kê nhanh) */}
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid sx={{ xs: 6 }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                  <Typography variant="h4" color="primary.main">{stats.totalToday.toLocaleString()}</Typography>
                  <Typography variant="body2">Lượt vào/ra hôm nay</Typography>
                </Paper>
              </Grid>
              <Grid sx={{ xs: 6 }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee' }}>
                  <Typography variant="h4" color="error.main">{stats.warningCount}</Typography>
                  <Typography variant="body2">Cảnh báo an ninh</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* --- KHỐI 2: LỊCH SỬ RA VÀO (Cột Phải - 8 phần) --- */}
        <Grid sx={{ xs: 12, md: 8 }}>
          <Typography variant="h6" gutterBottom>
            <HistoryIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Nhật ký Hoạt động
          </Typography>
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={logs}
              columns={columns}
              initialState={{
                pagination: { paginationModel: { pageSize: 15 } },
              }}
              pageSizeOptions={[15, 30, 50]}
              disableRowSelectionOnClick
              getRowId={(row) => row.id}
              sx={{ border: 0 }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* CSS Animation cho Alert */}
      <style>
        {`
          @keyframes flash {
            0% { border-color: red; box-shadow: 0 0 10px red; }
            50% { border-color: transparent; box-shadow: none; }
            100% { border-color: red; box-shadow: 0 0 10px red; }
          }
        `}
      </style>
    </Box>
  );
}