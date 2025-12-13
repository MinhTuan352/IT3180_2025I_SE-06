// src/pages/BOD/ResidentManagement/ResidentList.tsx
import {
  Box,
  Typography,
  Button,
  Card,
  Avatar,
  Chip,
  Pagination,
  Grid,
  CircularProgress, // Thêm icon loading
  Alert, // Thêm Alert lỗi
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRef, type ChangeEvent, useState } from 'react';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query'; // Import React Query
import { residentApi, type Resident } from '../../../api/residentApi';

// Icons
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Định nghĩa màu cho vai trò (Giữ nguyên)
const roleMap = {
  owner: { label: 'Chủ hộ', color: 'primary' },
  member: { label: 'Thành viên', color: 'secondary' },
};

const ROWS_PER_PAGE = 10; // Số dòng mỗi trang

export default function ResidentList() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCQCN = location.pathname.startsWith('/cqcn');
  const basePath = isCQCN ? '/cqcn' : '/bod';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1); // State phân trang

  // --- 1. GỌI API LẤY DANH SÁCH ---
  const { data: residentList = [], isLoading, error } = useQuery({
    queryKey: ['residents'],
    queryFn: () => residentApi.getAll(),
  });

  // --- 2. XỬ LÝ PHÂN TRANG (Client-side) ---
  const totalRows = residentList.length;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const paginatedResidents = residentList.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Handlers cho Navigation (Yêu cầu 3) ---
  const handleCreateResident = () => {
    navigate(`${basePath}/resident/profile/create`);
  };

  const handleViewProfile = (residentId: string) => {
    navigate(`${basePath}/resident/profile/${residentId}`);
  }

  // --- Logic Import/Export (Giữ cấu trúc) ---
  const handleExport = () => {
    // Export dữ liệu thật từ API
    const dataToExport = residentList.map((res: Resident) => ({
      'ID': res.id,
      'Họ và Tên': res.full_name, // Mapping field từ API
      'Căn hộ': res.apartment_code || res.apartment_id, // Ưu tiên mã căn hộ
      'Quyền hạn': roleMap[res.role as keyof typeof roleMap]?.label || res.role
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachCuDan');
    XLSX.writeFile(wb, 'DanhSachCuDan.xlsx');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        console.log('Dữ liệu Cư dân Import từ Excel:', json);
        alert('Đã đọc file Excel thành công! Xem dữ liệu ở Console (F12).');
      } catch (error) {
        console.error("Lỗi khi đọc file Excel:", error);
        alert('Đã xảy ra lỗi khi đọc file.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <Box>
      {/* Input ẩn để Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".xlsx, .xls"
      />

      {/* HÀNG 1: Tiêu đề + Các nút */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          DANH SÁCH CƯ DÂN
        </Typography>

        <Box>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            sx={{ mr: 1, backgroundColor: 'white', /* ... */ }}
            onClick={handleImportClick}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            sx={{ mr: 1, backgroundColor: 'white', /* ... */ }}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateResident} // <-- CẬP NHẬT
          >
            Thêm cư dân
          </Button>
        </Box>
      </Box>

      {/* --- 3. HIỂN THỊ TRẠNG THÁI LOADING / ERROR --- */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Không thể tải danh sách cư dân. Vui lòng thử lại sau.
        </Alert>
      )}

      {/* HÀNG 2: Danh sách cư dân (dạng thẻ) */}
      {!isLoading && !error && (
        <Grid container spacing={2}>
          {paginatedResidents.map((res: Resident) => {
            const roleInfo = roleMap[res.role as keyof typeof roleMap] || { label: res.role, color: 'default' };

            return (
              <Grid
                size={{ xs: 12 }}
                key={res.id}>
                <Card sx={{ display: 'flex', alignItems: 'center', p: 2 }}>

                  <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: roleInfo.color === 'primary' ? 'primary.main' : 'secondary.main' }}>
                    {res.full_name.charAt(0).toUpperCase()}
                  </Avatar>

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{res.full_name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      ID: {res.id} | Căn hộ: <b>{res.apartment_code || `ID:${res.apartment_id}`}</b>
                    </Typography>
                    <Chip
                      label={roleInfo.label}
                      color={roleInfo.color as 'primary' | 'secondary' | 'default'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {res.status && res.status !== 'Đang sinh sống' && (
                      <Chip label={res.status} size="small" variant="outlined" />
                    )}
                  </Box>

                  <Button
                    variant="contained"
                    onClick={() => handleViewProfile(res.id)}
                  >
                    Xem thêm
                  </Button>
                </Card>
              </Grid>
            );
          })}

          {paginatedResidents.length === 0 && (
            <Typography sx={{ width: '100%', textAlign: 'center', mt: 4, color: 'text.secondary' }}>
              Chưa có dữ liệu cư dân.
            </Typography>
          )}
        </Grid>
      )}

      {/* HÀNG 3: Phân trang */}
      {!isLoading && !error && totalRows > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
}