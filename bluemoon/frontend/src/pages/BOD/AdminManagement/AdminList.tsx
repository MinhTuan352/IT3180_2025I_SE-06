// src/pages/BOD/AdminManagement/AdminList.tsx
import {
  Box,
  Typography,
  Button,
  Card,
  Avatar,
  Chip,
  Pagination,
  Grid,
  CircularProgress,
  Alert,
  Modal,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, type ChangeEvent, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, type UserData } from '../../../api/adminApi';

// Icons
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import * as XLSX from 'xlsx';

// Định nghĩa màu cho các vai trò
const roleMap: Record<number, { label: string, color: string, code: string }> = {
  1: { label: 'Ban quản trị', color: 'primary', code: 'bod' },
  2: { label: 'Kế toán', color: 'secondary', code: 'accountance' },
  3: { label: 'Cư dân', color: 'default', code: 'resident' },
  4: { label: 'Cơ quan chức năng', color: 'warning', code: 'cqcn' }
};

// Cấu hình phân trang
const ROWS_PER_PAGE = 10;

// Interface cho filter state
interface FilterState {
  name: string;
  email: string;
  roleId: string;
  status: string;
}

// Interface cho sort state
interface SortState {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Modal style
const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

export default function AdminList() {
  const navigate = useNavigate();

  // --- STATE PHÂN TRANG ---
  const [page, setPage] = useState(1);

  // --- STATE CHO ADVANCED SEARCH ---
  const [openAdvancedSearch, setOpenAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    name: '',
    email: '',
    roleId: '',
    status: '',
  });
  const [sort, setSort] = useState<SortState>({
    sortBy: 'username',
    sortOrder: 'asc',
  });
  // Temp states cho modal
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  const [tempSort, setTempSort] = useState<SortState>(sort);

  // --- KẾT NỐI API ---
  const { data: adminList = [], isLoading, error } = useQuery({
    queryKey: ['admins'],
    queryFn: adminApi.getAdminsOnly,
  });

  // --- LOGIC FILTER VÀ SORT ---
  const filteredAndSortedAdmins = useMemo(() => {
    let result = [...adminList];

    // Apply filters
    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      result = result.filter(a =>
        (a.full_name || '').toLowerCase().includes(searchTerm) ||
        a.username.toLowerCase().includes(searchTerm)
      );
    }
    if (filters.email) {
      result = result.filter(a =>
        a.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    if (filters.roleId) {
      result = result.filter(a => Number(a.role_id) === Number(filters.roleId));
    }
    if (filters.status) {
      if (filters.status === 'active') {
        result = result.filter(a => a.is_active === true);
      } else if (filters.status === 'inactive') {
        result = result.filter(a => a.is_active === false);
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: string = '';
      let bVal: string = '';

      switch (sort.sortBy) {
        case 'username':
          aVal = a.username.toLowerCase();
          bVal = b.username.toLowerCase();
          break;
        case 'full_name':
          aVal = (a.full_name || a.username).toLowerCase();
          bVal = (b.full_name || b.username).toLowerCase();
          break;
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sort.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [adminList, filters, sort]);

  // --- PHÂN TRANG ---
  const totalRows = filteredAndSortedAdmins.length;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const paginatedAdmins = filteredAndSortedAdmins.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- HANDLERS CHO MODAL ---
  const handleOpenAdvancedSearch = () => {
    setTempFilters(filters);
    setTempSort(sort);
    setOpenAdvancedSearch(true);
  };

  const handleCloseAdvancedSearch = () => {
    setOpenAdvancedSearch(false);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setSort(tempSort);
    setPage(1);
    setOpenAdvancedSearch(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = { name: '', email: '', roleId: '', status: '' };
    const defaultSort = { sortBy: 'username', sortOrder: 'asc' as const };
    setTempFilters(clearedFilters);
    setTempSort(defaultSort);
    setFilters(clearedFilters);
    setSort(defaultSort);
    setPage(1);
    setOpenAdvancedSearch(false);
  };

  // Check if có filter đang active
  const hasActiveFilters = filters.name || filters.email || filters.roleId || filters.status;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleViewProfile = (adminId: string) => {
    navigate(`/bod/admin/profile/${adminId}`);
  };

  // --- EXPORT (dùng dữ liệu đã filter) ---
  const handleExport = () => {
    const dataToExport = filteredAndSortedAdmins.map((admin: UserData) => ({
      'ID': admin.id,
      'Username': admin.username,
      'Họ và Tên': admin.full_name || '',
      'Email': admin.email,
      'Vai trò': roleMap[admin.role_id || 3]?.label || 'Không xác định',
      'Trạng thái': admin.is_active ? 'Hoạt động' : 'Đã khóa',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachQuanTriVien');
    XLSX.writeFile(wb, 'DanhSachQuanTriVien.xlsx');
  };

  // --- IMPORT ---
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

        console.log('Dữ liệu Import từ Excel:', json);
        alert('Đã đọc file Excel thành công! Xem dữ liệu ở Console (F12).');

      } catch (error) {
        console.error("Lỗi khi đọc file Excel:", error);
        alert('Đã xảy ra lỗi khi đọc file. Vui lòng kiểm tra định dạng file.');
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
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          DANH SÁCH QUẢN TRỊ VIÊN
          {hasActiveFilters && (
            <Chip
              label="Đang lọc"
              size="small"
              color="info"
              sx={{ ml: 2 }}
              onDelete={handleClearFilters}
            />
          )}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            sx={{ backgroundColor: 'white', color: '#333', borderColor: '#ccc', '&:hover': { backgroundColor: '#f9f9f9', borderColor: '#bbb' } }}
            onClick={handleImportClick}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            sx={{ backgroundColor: 'white', color: '#333', borderColor: '#ccc', '&:hover': { backgroundColor: '#f9f9f9', borderColor: '#bbb' } }}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            sx={{ backgroundColor: 'white', color: '#333', borderColor: '#ccc', '&:hover': { backgroundColor: '#f9f9f9', borderColor: '#bbb' } }}
            onClick={handleOpenAdvancedSearch}
          >
            Tìm kiếm nâng cao
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/bod/admin/profile/create')}
          >
            Thêm quản trị viên
          </Button>
        </Box>
      </Box>

      {/* MODAL TÌM KIẾM NÂNG CAO */}
      <Modal
        open={openAdvancedSearch}
        onClose={handleCloseAdvancedSearch}
        aria-labelledby="advanced-search-modal"
      >
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              Tìm kiếm nâng cao
            </Typography>
            <IconButton onClick={handleCloseAdvancedSearch} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Filters */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Tên / Username"
              value={tempFilters.name}
              onChange={(e) => setTempFilters({ ...tempFilters, name: e.target.value })}
              size="small"
              fullWidth
              placeholder="Nhập tên hoặc username..."
            />

            <TextField
              label="Email"
              value={tempFilters.email}
              onChange={(e) => setTempFilters({ ...tempFilters, email: e.target.value })}
              size="small"
              fullWidth
              placeholder="Nhập email..."
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={tempFilters.roleId}
                label="Vai trò"
                onChange={(e) => setTempFilters({ ...tempFilters, roleId: e.target.value })}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="1">Ban quản trị</MenuItem>
                <MenuItem value="2">Kế toán</MenuItem>
                <MenuItem value="4">Cơ quan chức năng</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={tempFilters.status}
                label="Trạng thái"
                onChange={(e) => setTempFilters({ ...tempFilters, status: e.target.value })}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Đã khóa</MenuItem>
              </Select>
            </FormControl>

            {/* Sorting */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Sắp xếp theo</InputLabel>
                <Select
                  value={tempSort.sortBy}
                  label="Sắp xếp theo"
                  onChange={(e) => setTempSort({ ...tempSort, sortBy: e.target.value })}
                >
                  <MenuItem value="username">Username</MenuItem>
                  <MenuItem value="full_name">Tên</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="id">ID</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Thứ tự</InputLabel>
                <Select
                  value={tempSort.sortOrder}
                  label="Thứ tự"
                  onChange={(e) => setTempSort({ ...tempSort, sortOrder: e.target.value as 'asc' | 'desc' })}
                >
                  <MenuItem value="asc">Tăng dần</MenuItem>
                  <MenuItem value="desc">Giảm dần</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<FilterAltOffIcon />}
              onClick={handleClearFilters}
            >
              Xóa bộ lọc
            </Button>
            <Button
              variant="contained"
              onClick={handleApplyFilters}
            >
              Áp dụng
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* LOADING / ERROR */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Không thể tải danh sách quản trị viên. Vui lòng thử lại sau.
        </Alert>
      )}

      {/* Hiển thị số lượng kết quả khi có filter */}
      {!isLoading && !error && hasActiveFilters && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tìm thấy {totalRows} kết quả phù hợp
        </Alert>
      )}

      {/* DANH SÁCH ADMIN */}
      {!isLoading && !error && (
        <Grid container spacing={2}>
          {paginatedAdmins.length === 0 ? (
            <Typography sx={{ p: 2, fontStyle: 'italic', color: 'text.secondary' }}>
              {hasActiveFilters ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có quản trị viên nào.'}
            </Typography>
          ) : (
            paginatedAdmins.map((admin) => {
              const roleInfo = roleMap[admin.role_id || 3] || roleMap[3];
              const displayName = (admin.full_name && admin.full_name.trim() !== "")
                ? admin.full_name
                : admin.username;

              return (
                <Grid size={{ xs: 12 }} key={admin.id}>
                  <Card sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                    <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: roleInfo.color === 'primary' ? 'primary.main' : 'secondary.main' }}>
                      {displayName.charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        {displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        ID: {admin.id} | Email: {admin.email}
                      </Typography>
                      <Chip
                        label={roleInfo.label}
                        color={roleInfo.color as any}
                        size="small"
                      />
                      {!admin.is_active && (
                        <Chip label="Đã khóa" color="error" size="small" sx={{ ml: 1 }} />
                      )}
                    </Box>

                    <Button variant="contained" onClick={() => handleViewProfile(admin.id)}>
                      Xem thêm
                    </Button>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      {/* PHÂN TRANG */}
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