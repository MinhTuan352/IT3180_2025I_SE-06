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
  //Avatar,
  Divider,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useEffect, useRef } from 'react';
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

// --- TYPE DEFINITIONS ---
type SecurityStatus = 'Normal' | 'Warning' | 'Alert';
type Direction = 'In' | 'Out';
type VehicleType = 'Oto' | 'Xemay';

interface AccessLog {
  id: number;
  plate_number: string;
  time: Date;
  gate: string;
  direction: Direction;
  vehicle_type: VehicleType;
  status: SecurityStatus;
  image_url: string; // URL ảnh chụp từ camera
  resident_name?: string; // Có nếu là cư dân
  note?: string;
}

// --- MOCK DATA GENERATOR (Để test UI real-time) ---
const generateRandomLog = (id: number): AccessLog => {
  const statuses: SecurityStatus[] = ['Normal', 'Normal', 'Normal', 'Warning', 'Alert'];
  const directions: Direction[] = ['In', 'Out'];
  const gates = ['Cổng A', 'Cổng B', 'Hầm B1'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    id: id,
    plate_number: randomStatus === 'Normal' ? `30A-${Math.floor(Math.random()*99999)}` : 'UNKNOWN',
    time: new Date(),
    gate: gates[Math.floor(Math.random() * gates.length)],
    direction: directions[Math.floor(Math.random() * directions.length)],
    vehicle_type: Math.random() > 0.5 ? 'Oto' : 'Xemay',
    status: randomStatus,
    image_url: 'https://via.placeholder.com/300x200?text=Camera+Capture', // Ảnh giả
    resident_name: randomStatus === 'Normal' ? 'Nguyễn Văn A' : undefined,
    note: randomStatus === 'Alert' ? 'Biển số trong danh sách đen!' : (randomStatus === 'Warning' ? 'Xe lạ chưa đăng ký' : 'Cư dân A101'),
  };
};

export default function AccessControl() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [isLive, setIsLive] = useState(true); // Trạng thái nhận dữ liệu real-time
  const [latestLog, setLatestLog] = useState<AccessLog | null>(null);
  
  // Ref để giả lập ID tăng dần
  const idCounter = useRef(1);

  // --- SIMULATE REAL-TIME SOCKET (Giả lập) ---
  useEffect(() => {
    let interval: any;
    if (isLive) {
      interval = setInterval(() => {
        const newLog = generateRandomLog(idCounter.current++);
        setLatestLog(newLog); // Cập nhật bảng Live Feed bên trái
        
        // Cập nhật bảng lịch sử (Thêm vào đầu mảng)
        setLogs((prevLogs) => [newLog, ...prevLogs].slice(0, 50)); // Chỉ giữ 50 logs gần nhất trên UI
      }, 3000); // 3 giây có 1 xe qua
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
        field: 'time', 
        headerName: 'Thời gian', 
        width: 150, 
        // Sửa: Nhận trực tiếp 'value' và ép kiểu 'any' hoặc 'Date' để tránh lỗi TypeScript
        valueFormatter: (value: any) => value ? format(new Date(value), 'HH:mm:ss dd/MM') : '' 
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
      renderCell: (params) => params.value === 'Oto' ? <DirectionsCarIcon color="action"/> : <TwoWheelerIcon color="action"/>
    },
    { field: 'resident_name', headerName: 'Chủ xe', width: 150, valueFormatter: (v) => v || '---' },
    { 
      field: 'status', headerName: 'An ninh', width: 140,
      renderCell: (params: GridRenderCellParams) => getStatusChip(params.value)
    },
    { field: 'note', headerName: 'Ghi chú', flex: 1, minWidth: 200 },
  ];

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
        <Grid sx={{xs: 12, md: 4}}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <span className="live-indicator" style={{ height: 10, width: 10, backgroundColor: 'red', borderRadius: '50%', display: 'inline-block', marginRight: 8 }}></span>
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
                    src={latestLog.image_url} 
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
                    <Typography variant="h4" fontWeight="bold">{format(latestLog.time, 'HH:mm:ss')}</Typography>
                    {getStatusChip(latestLog.status)}
                  </Box>
                  <Divider />
                  <Grid container>
                    <Grid sx={{xs: 6}}><Typography color="text.secondary">Cổng:</Typography> <strong>{latestLog.gate}</strong></Grid>
                    <Grid sx={{xs: 6}}><Typography color="text.secondary">Hướng:</Typography> <strong>{latestLog.direction === 'In' ? 'VÀO' : 'RA'}</strong></Grid>
                    <Grid sx={{xs: 6}}><Typography color="text.secondary">Loại xe:</Typography> <strong>{latestLog.vehicle_type}</strong></Grid>
                    <Grid sx={{xs: 6}}><Typography color="text.secondary">Chủ hộ:</Typography> <strong>{latestLog.resident_name || 'Khách'}</strong></Grid>
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
                <Grid sx={{xs: 6}}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                        <Typography variant="h4" color="primary.main">1,205</Typography>
                        <Typography variant="body2">Lượt vào/ra hôm nay</Typography>
                    </Paper>
                </Grid>
                <Grid sx={{xs: 6}}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee' }}>
                        <Typography variant="h4" color="error.main">3</Typography>
                        <Typography variant="body2">Cảnh báo an ninh</Typography>
                    </Paper>
                </Grid>
             </Grid>
          </Box>
        </Grid>

        {/* --- KHỐI 2: LỊCH SỬ RA VÀO (Cột Phải - 8 phần) --- */}
        <Grid sx={{xs: 12, md: 8}}>
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