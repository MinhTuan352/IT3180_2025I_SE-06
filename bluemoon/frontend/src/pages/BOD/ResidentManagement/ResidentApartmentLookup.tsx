// src/pages/BOD/ResidentManagement/ResidentApartmentLookup.tsx
import {
  Box, Typography, Button, Paper, Grid, Card, CardActionArea,
  Breadcrumbs, Link, Chip, Avatar, Stack, IconButton, Tooltip, CircularProgress
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query'; // Import React Query
import { apartmentApi, type Apartment } from '../../../api/apartmentApi.ts'; // Import Apartment API
import { residentApi } from '../../../api/residentApi';

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

export default function ResidentApartmentLookup() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCQCN = location.pathname.startsWith('/cqcn');
  const basePath = isCQCN ? '/cqcn' : '/bod';

  // --- STATE QUẢN LÝ CẤP ĐỘ ---
  const [selectedBuilding, setSelectedBuilding] = useState<'A' | 'B' | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  // --- 1. GỌI API (Lấy toàn bộ dữ liệu về) ---
  const { data: dbApartments = [], isLoading: loadingApt } = useQuery<Apartment[]>({
    queryKey: ['apartments'],
    queryFn: apartmentApi.getAll,
  });

  const { data: dbResidents = [], isLoading: loadingRes } = useQuery({
    queryKey: ['residents'],
    queryFn: () => residentApi.getAll(),
  });

  // --- 2. XỬ LÝ DỮ LIỆU (Ghép Cư dân vào Căn hộ có sẵn trong DB) ---
  const apartmentsWithResidents = useMemo(() => {
    return dbApartments.map(apt => ({
      ...apt,
      // Tìm cư dân thuộc căn hộ này
      residents: dbResidents.filter(r => String(r.apartment_id) === String(apt.id))
    }));
  }, [dbApartments, dbResidents]);

  // --- HEADER ACTIONS (GIỮ NGUYÊN TỪ RESIDENT LIST) ---
  const handleExport = () => { alert("Export excel từ view Căn hộ"); };
  const handleImportClick = () => { alert("Import excel vào view Căn hộ"); };
  const handleCreateResident = () => { navigate(`${basePath}/resident/profile/create`); };

  // --- NAVIGATION HANDLERS ---
  const handleSelectBuilding = (b: 'A' | 'B') => setSelectedBuilding(b);
  const handleSelectFloor = (f: number) => setSelectedFloor(f);
  const resetSelection = () => { setSelectedBuilding(null); setSelectedFloor(null); };
  const backToFloorSelection = () => { setSelectedFloor(null); };

  // --- HÀM ĐIỀU HƯỚNG MỚI ---
  const handleViewApartmentDetail = (aptId?: number) => {
    if (aptId) {
      navigate(`${basePath}/resident/apartment/${aptId}`);
    } else {
      alert("Căn hộ này chưa được thiết lập dữ liệu trên hệ thống.");
    }
  };

  const handleViewResidentProfile = (e: React.MouseEvent, residentId: string) => {
    e.stopPropagation(); // Ngăn không cho click vào thẻ căn hộ (parent)
    navigate(`${basePath}/resident/profile/${residentId}`);
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    if (loadingApt || loadingRes) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

    // 1. CẤP ĐỘ 1: CHỌN TÒA NHÀ
    if (!selectedBuilding) {
      return (
        <Grid container spacing={4} justifyContent="center" sx={{ mt: 2 }}>
          {['A', 'B'].map((building) => (
            <Grid sx={{ xs: 12, sm: 5 }} key={building}>
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
              <Grid sx={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={floor}>
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
      // Tạo ra 8 slot trống theo đúng cấu trúc bạn yêu cầu
      const apartmentSlots = Array.from({ length: APARTMENTS_PER_FLOOR }, (_, i) => {
        // Tạo mã căn hộ kỳ vọng theo quy tắc (Ví dụ: A-101, A-1001)
        const roomSuffix = String(i + 1).padStart(2, '0'); // 01, 02... 08
        const expectedCode = `${selectedBuilding}-${selectedFloor}${roomSuffix}`; // VD: A-101

        // Tìm trong dữ liệu API xem có căn nào khớp mã này không
        const matchedData = apartmentsWithResidents.find(
          apt => apt.apartment_code === expectedCode
        );

        return {
          virtualCode: expectedCode, // Mã hiển thị (luôn có)
          data: matchedData || null, // Dữ liệu thật (có thể null)
        };
      });

      return (
        <Box>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <HomeIcon sx={{ mr: 1 }} /> Danh sách Căn hộ - Tầng {selectedFloor} - Tòa {selectedBuilding}
          </Typography>

          <Grid container spacing={2}>
            {apartmentSlots.map((slot, index) => {
              const hasData = !!slot.data;
              const isOccupied = slot.data?.status === 'Đang sinh sống';

              return (
                <Grid sx={{ xs: 12 }} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2, borderRadius: 2, border: '1px solid #eee',
                      // Nếu có người -> viền xanh, Chưa có -> viền xám
                      borderLeft: `6px solid ${hasData && isOccupied ? '#4caf50' : '#bdbdbd'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
                      // Nếu không có dữ liệu thật, làm mờ đi một chút
                      opacity: hasData ? 1 : 0.6,
                      bgcolor: hasData ? 'white' : '#fafafa',
                      cursor: hasData ? 'pointer' : 'default',
                      '&:hover': { bgcolor: hasData ? '#f9f9f9' : '#fafafa', boxShadow: hasData ? 2 : 0 }
                    }}
                    onClick={() => handleViewApartmentDetail(slot.data?.id)}
                  >
                    {/* Thông tin Căn hộ (Luôn hiển thị Mã căn) */}
                    <Box sx={{ minWidth: 100 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {slot.virtualCode}
                      </Typography>
                      <Chip
                        // Nếu có data thì hiện status thật, ko thì hiện "Chưa thông tin"
                        label={hasData ? slot.data?.status : 'Chưa có thông tin'}
                        size="small"
                        color={isOccupied ? 'success' : 'default'}
                        variant={isOccupied ? 'filled' : 'outlined'}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>

                    {/* Danh sách cư dân (Chỉ hiện nếu khớp được dữ liệu) */}
                    <Box sx={{ flexGrow: 1 }}>
                      {hasData && slot.data?.residents && slot.data.residents.length > 0 ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {slot.data.residents.map((res: any) => (
                            <Chip
                              key={res.id}
                              avatar={<Avatar sx={{ bgcolor: res.role === 'owner' ? 'primary.main' : 'grey.400' }}><PersonIcon /></Avatar>}
                              label={
                                <Box>
                                  <Typography variant="caption" display="block" lineHeight={1} fontWeight="bold">{res.full_name}</Typography>
                                  <Typography variant="caption" display="block" fontSize="0.65rem">{res.role === 'owner' ? 'Chủ hộ' : 'Thành viên'}</Typography>
                                </Box>
                              }
                              onClick={(e) => handleViewResidentProfile(e, res.id)}
                              sx={{ height: 'auto', py: 0.5, cursor: 'pointer', '&:hover': { bgcolor: '#e3f2fd' } }}
                            />
                          ))}
                        </Stack>
                      ) : (
                        // Nếu không có dữ liệu hoặc danh sách cư dân rỗng
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          ---
                        </Typography>
                      )}
                    </Box>

                    {/* Nút mũi tên chỉ hiện khi có dữ liệu để bấm vào */}
                    <Box sx={{ minWidth: 40, textAlign: 'right' }}>
                      {hasData && (
                        <Tooltip title="Xem chi tiết căn hộ">
                          <IconButton size="small"><ArrowForwardIcon /></IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
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
            <Link underline="hover" color="inherit" onClick={() => navigate(`${basePath}/resident`)} sx={{ cursor: 'pointer' }}>
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