// src/pages/BOD/ResidentManagement/ResidentApartmentLookup.tsx
import {
  Box, Typography, Button, Paper, Grid, Card, CardActionArea,
  Breadcrumbs, Link, Chip, Avatar, Stack, IconButton, Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
//import * as XLSX from 'xlsx';

// Icons
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import BusinessIcon from '@mui/icons-material/Business';
import LayersIcon from '@mui/icons-material/Layers';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// --- MOCK DATA HELPER ---
const FLOORS = 31;
const APARTMENTS_PER_FLOOR = 8;

// Hàm sinh dữ liệu giả cho 1 tầng
const generateApartments = (building: string, floor: number) => {
  return Array.from({ length: APARTMENTS_PER_FLOOR }, (_, i) => {
    const aptNumber = `${building}-${floor}${String(i + 1).padStart(2, '0')}`; // VD: A-101
    const isOccupied = Math.random() > 0.3; // 70% có người
    
    return {
      id: aptNumber,
      name: `Căn hộ ${aptNumber}`,
      status: isOccupied ? 'occupied' : 'empty',
      residents: isOccupied ? [
        { id: 'R001', name: 'Nguyễn Văn A', role: 'Chủ hộ' },
        { id: 'R002', name: 'Trần Thị B', role: 'Vợ/Chồng' },
        ...(Math.random() > 0.5 ? [{ id: 'R003', name: 'Nguyễn Văn Con', role: 'Con' }] : [])
      ] : []
    };
  });
};

export default function ResidentApartmentLookup() {
  const navigate = useNavigate();
  
  // --- STATE QUẢN LÝ CẤP ĐỘ ---
  const [selectedBuilding, setSelectedBuilding] = useState<'A' | 'B' | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  // --- HEADER ACTIONS (GIỮ NGUYÊN TỪ RESIDENT LIST) ---
  const handleExport = () => { alert("Export excel từ view Căn hộ"); };
  const handleImportClick = () => { alert("Import excel vào view Căn hộ"); };
  const handleCreateResident = () => { navigate('/bod/resident/profile/create'); };

  // --- NAVIGATION HANDLERS ---
  const handleSelectBuilding = (b: 'A' | 'B') => setSelectedBuilding(b);
  const handleSelectFloor = (f: number) => setSelectedFloor(f);
  const resetSelection = () => { setSelectedBuilding(null); setSelectedFloor(null); };
  const backToFloorSelection = () => { setSelectedFloor(null); };

  // --- HÀM ĐIỀU HƯỚNG MỚI ---
  const handleViewApartmentDetail = (aptId: string) => {
    navigate(`/bod/resident/apartment/${aptId}`);
  };

  const handleViewResidentProfile = (e: React.MouseEvent, residentId: string) => {
    e.stopPropagation(); // Ngăn không cho click vào thẻ căn hộ (parent)
    navigate(`/bod/resident/profile/${residentId}`);
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    // 1. CẤP ĐỘ 1: CHỌN TÒA NHÀ
    if (!selectedBuilding) {
      return (
        <Grid container spacing={4} justifyContent="center" sx={{ mt: 2 }}>
          {['A', 'B'].map((building) => (
            <Grid sx={{xs: 12, sm: 5}} key={building}>
              <Card sx={{ borderRadius: 4, bgcolor: building === 'A' ? '#e3f2fd' : '#f3e5f5', height: 200 }}>
                <CardActionArea 
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => handleSelectBuilding(building as 'A' | 'B')}
                >
                  <BusinessIcon sx={{ fontSize: 60, mb: 2, color: building === 'A' ? 'primary.main' : 'secondary.main' }} />
                  <Typography variant="h3" fontWeight="bold">TÒA {building}</Typography>
                  <Typography variant="body2" color="text.secondary">{FLOORS} Tầng • {FLOORS * APARTMENTS_PER_FLOOR} Căn hộ</Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    // 2. CẤP ĐỘ 2: CHỌN TẦNG
    if (selectedBuilding && selectedFloor === null) {
      return (
        <Box>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <LayersIcon sx={{ mr: 1 }} /> Danh sách Tầng - Tòa {selectedBuilding}
          </Typography>
          <Grid container spacing={2}>
            {Array.from({ length: FLOORS }, (_, i) => i + 1).map((floor) => (
              <Grid sx={{xs: 6, sm: 4, md:3, lg: 2}} key={floor}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ 
                    height: 60, fontSize: '1.1rem', borderRadius: 2,
                    borderColor: '#ddd', color: 'text.primary',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.light', color: 'primary.main' }
                  }}
                  onClick={() => handleSelectFloor(floor)}
                >
                  Tầng {floor}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      );
    }

    // 3. CẤP ĐỘ 3: DANH SÁCH CĂN HỘ (CHI TIẾT)
    if (selectedBuilding && selectedFloor !== null) {
      const apartments = generateApartments(selectedBuilding, selectedFloor);
      
      return (
        <Box>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <HomeIcon sx={{ mr: 1 }} /> Danh sách Căn hộ - Tầng {selectedFloor} - Tòa {selectedBuilding}
          </Typography>
          
          <Grid container spacing={2}>
            {apartments.map((apt) => (
              <Grid sx={{xs: 12}} key={apt.id}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, borderRadius: 2, border: '1px solid #eee',
                    borderLeft: `6px solid ${apt.status === 'occupied' ? '#4caf50' : '#bdbdbd'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
                    cursor: 'pointer', // Thêm con trỏ chuột
                    '&:hover': { bgcolor: '#f9f9f9', boxShadow: 2 } // Thêm hiệu ứng hover
                  }}
                  onClick={() => handleViewApartmentDetail(apt.id)} // <--- THÊM SỰ KIỆN CLICK VÀO THẺ
                >
                  {/* Thông tin Căn hộ */}
                  <Box sx={{ minWidth: 100 }}>
                    <Typography variant="h6" fontWeight="bold">{apt.name}</Typography>
                    <Chip 
                      label={apt.status === 'occupied' ? 'Đã có người' : 'Trống'} 
                      size="small" 
                      color={apt.status === 'occupied' ? 'success' : 'default'}
                      variant={apt.status === 'occupied' ? 'filled' : 'outlined'}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  {/* Danh sách thành viên (nếu có) */}
                  <Box sx={{ flexGrow: 1 }}>
                    {apt.status === 'occupied' ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {apt.residents.map((res) => (
                          <Chip
                            key={res.id}
                            avatar={<Avatar><PersonIcon /></Avatar>}
                            label={
                              <Box>
                                <Typography variant="caption" display="block" lineHeight={1} fontWeight="bold">{res.name}</Typography>
                                <Typography variant="caption" display="block" fontSize="0.65rem">{res.role}</Typography>
                              </Box>
                            }
                            onClick={(e) => handleViewResidentProfile(e, res.id)} 
                            sx={{ height: 'auto', py: 0.5, cursor: 'pointer', '&:hover': { bgcolor: '#e3f2fd' } }}
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        Chưa có thông tin cư trú
                      </Typography>
                    )}
                  </Box>

                  {/* Actions nhỏ nếu cần */}
                  <Box>
                    <Tooltip title="Xem chi tiết căn hộ">
                        <IconButton size="small"><ArrowForwardIcon /></IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      );
    }
  };

  return (
    <Box>
      {/* 1. HEADER + ACTIONS (GIỮ NGUYÊN) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>TRA CỨU THEO CĂN HỘ</Typography>
            {/* Breadcrumbs Navigation */}
            <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
                <Link underline="hover" color="inherit" onClick={() => navigate('/bod/resident')} sx={{ cursor: 'pointer' }}>
                    Quản lý Cư dân
                </Link>
                {selectedBuilding ? (
                    <Link underline="hover" color="inherit" onClick={resetSelection} sx={{ cursor: 'pointer' }}>
                        Tòa {selectedBuilding}
                    </Link>
                ) : <Typography color="text.primary">Chọn Tòa</Typography>}
                
                {selectedFloor && (
                    <Typography color="text.primary">Tầng {selectedFloor}</Typography>
                )}
            </Breadcrumbs>
        </Box>

        {/* Các nút chức năng (Giữ nguyên như ResidentList) */}
        <Box>
          <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={handleImportClick} sx={{ mr: 1, bgcolor: 'white' }}>
            Import
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport} sx={{ mr: 1, bgcolor: 'white' }}>
            Export
          </Button>
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleCreateResident}>
            Thêm cư dân
          </Button>
        </Box>
      </Box>

      {/* 2. MAIN CONTENT AREA */}
      <Paper sx={{ p: 3, borderRadius: 3, minHeight: 600, bgcolor: '#fafafa' }}>
        {selectedFloor && (
            <Button startIcon={<ArrowBackIcon />} onClick={backToFloorSelection} sx={{ mb: 2 }}>
                Quay lại danh sách tầng
            </Button>
        )}
        
        {renderContent()}
      </Paper>
    </Box>
  );
}