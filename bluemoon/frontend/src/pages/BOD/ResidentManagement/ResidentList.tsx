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
import { useNavigate, useLocation } from 'react-router-dom';
import { useRef, type ChangeEvent, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query'; // Import React Query
import { residentApi, type Resident } from '../../../api/residentApi';
import { apartmentApi } from '../../../api/apartmentApi';
import { profileEditRequestApi, type ProfileEditRequest } from '../../../api/profileEditRequestApi';

// Icons
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

// Định nghĩa màu cho vai trò (Giữ nguyên)
const roleMap = {
  owner: { label: 'Chủ hộ', color: 'primary' },
  member: { label: 'Thành viên', color: 'secondary' },
};

const ROWS_PER_PAGE = 10;

// Interface cho filter state
interface FilterState {
  name: string;
  apartmentCode: string;
  role: string;
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

export default function ResidentList() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCQCN = location.pathname.startsWith('/cqcn');
  const basePath = isCQCN ? '/cqcn' : '/bod';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);

  // --- STATE CHO ADVANCED SEARCH ---
  const [openAdvancedSearch, setOpenAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    name: '',
    apartmentCode: '',
    role: '',
    status: '',
  });
  const [sort, setSort] = useState<SortState>({
    sortBy: 'full_name',
    sortOrder: 'asc',
  });
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  const [tempSort, setTempSort] = useState<SortState>(sort);
  const [openEditRequestsModal, setOpenEditRequestsModal] = useState(false);

  // --- BULK SELECTION STATE ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  // --- API CALL ---
  const { data: residentList = [], isLoading, error } = useQuery({
    queryKey: ['residents'],
    queryFn: () => residentApi.getAll(),
  });

  // Fetch all edit requests
  const { data: editRequestsData } = useQuery({
    queryKey: ['allEditRequests'],
    queryFn: () => profileEditRequestApi.getAllRequests(),
  });
  const allRequests: ProfileEditRequest[] = editRequestsData?.data || [];
  const pendingCount = editRequestsData?.pendingCount || 0;

  // --- LOGIC FILTER VÀ SORT ---
  const filteredAndSortedResidents = useMemo(() => {
    let result = [...residentList];

    // Apply filters
    if (filters.name) {
      result = result.filter(r =>
        r.full_name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.apartmentCode) {
      result = result.filter(r =>
        (r.apartment_code || '').toLowerCase().includes(filters.apartmentCode.toLowerCase())
      );
    }
    if (filters.role) {
      result = result.filter(r => r.role === filters.role);
    }
    if (filters.status) {
      result = result.filter(r => r.status === filters.status);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sort.sortBy) {
        case 'full_name':
          aVal = a.full_name.toLowerCase();
          bVal = b.full_name.toLowerCase();
          break;
        case 'apartment_code':
          aVal = (a.apartment_code || '').toLowerCase();
          bVal = (b.apartment_code || '').toLowerCase();
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
  }, [residentList, filters, sort]);

  // --- PHÂN TRANG ---
  const totalRows = filteredAndSortedResidents.length;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const paginatedResidents = filteredAndSortedResidents.slice(
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
    const clearedFilters = { name: '', apartmentCode: '', role: '', status: '' };
    const defaultSort = { sortBy: 'full_name', sortOrder: 'asc' as const };
    setTempFilters(clearedFilters);
    setTempSort(defaultSort);
    setFilters(clearedFilters);
    setSort(defaultSort);
    setPage(1);
    setOpenAdvancedSearch(false);
  };

  // Check if có filter đang active
  const hasActiveFilters = filters.name || filters.apartmentCode || filters.role || filters.status;

  // --- BULK ACTIONS LOGIC ---

  // Toggle selection for one item
  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle selection for all items on CURRENT PAGE
  const handleSelectAllPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Select all IDs on current page that are not already selected
      const pageIds = paginatedResidents.map(r => r.id);
      setSelectedIds(prev => {
        const uniqueIds = new Set([...prev, ...pageIds]);
        return Array.from(uniqueIds);
      });
    } else {
      // Deselect all IDs on current page
      const pageIds = paginatedResidents.map(r => r.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  // Helper to check if item is selected
  const isSelected = (id: string) => selectedIds.includes(id);

  // Check state for "Select All" checkbox
  const pageIds = paginatedResidents.map(r => r.id);
  const isAllPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
  const isSomePageSelected = pageIds.some(id => selectedIds.includes(id));

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} cư dân đã chọn?\n\nLƯU Ý: Những cư dân có dữ liệu ràng buộc (Hóa đơn, Xe, Sự cố...) sẽ KHÔNG thể xóa.`)) return;

    setDeleting(true);
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Loop through selected items
    for (const id of selectedIds) {
      try {
        await residentApi.delete(id);
        successCount++;
      } catch (err: any) {
        failCount++;
        // Try to extract resident name for better error message
        const resName = residentList.find(r => r.id === id)?.full_name || id;
        // Only log unique error types or generic message
        console.error(`Failed to delete ${id}:`, err);
        errors.push(`${resName}: ${err.response?.data?.message || 'Lỗi không xác định'}`);
      }
    }

    setDeleting(false);

    // Show summary
    if (failCount === 0) {
      alert(`Đã xóa thành công ${successCount} cư dân.`);
      // Refresh data
      window.location.reload(); // Simple reload or invalidate query
    } else {
      alert(`Đã xóa ${successCount} cư dân.\nThất bại ${failCount} cư dân.\n\nChi tiết lỗi (3 lỗi đầu):\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`);
      // Optionally generic reload or just refetch
      navigate(0);
    }
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
    // Export dữ liệu đã lọc HOẶC dữ liệu đã chọn
    let dataToProcess = filteredAndSortedResidents;

    // Nếu có chọn ít nhất 1 item -> Chỉ export những item đó
    if (selectedIds.length > 0) {
      dataToProcess = residentList.filter(r => selectedIds.includes(r.id));
    }

    const dataToExport = dataToProcess.map((res: Resident) => ({
      'ID': res.id,
      'Họ và Tên': res.full_name,
      'Căn hộ': res.apartment_code || res.apartment_id,
      'Ngày sinh': res.dob ? new Date(res.dob).toLocaleDateString('vi-VN') : '',
      'Giới tính': res.gender || '',
      'CCCD': res.cccd || '',
      'Ngày cấp': res.identity_date ? new Date(res.identity_date).toLocaleDateString('vi-VN') : '',
      'Nơi cấp': res.identity_place || '',
      'SĐT': res.phone || '',
      'Email': res.email || '',
      'Quê quán': res.hometown || '',
      'Nghề nghiệp': res.occupation || '',
      'Quan hệ với chủ hộ': res.relationship_with_owner || '',
      'Quyền hạn': roleMap[res.role as keyof typeof roleMap]?.label || res.role,
      'Trạng thái': res.status || 'Đang sinh sống',
      'Tài khoản': res.has_account ? 'Có' : 'Không',
      'Username': res.account_username || '',
      'Password': res.account_password || '',
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachCuDan');

    // Tạo file và download thủ công để đảm bảo đúng tên file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DanhSachCuDan.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Sử dụng raw: false để đảm bảo đọc ngày tháng dưới dạng chuỗi (text formatted) thay vì số
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        console.log('Dữ liệu Cư dân Import từ Excel:', json);

        // Fetch danh sách căn hộ để map Code -> ID
        let apartmentMap = new Map<string, number>();
        try {
          const apartments = await apartmentApi.getAll();
          apartments.forEach(a => {
            if (a.apartment_code) apartmentMap.set(a.apartment_code, a.id);
          });
        } catch (err) {
          console.error('Không thể lấy danh sách căn hộ:', err);
          alert('Lỗi: Không thể lấy dữ liệu căn hộ để đối chiếu.');
          return;
        }

        // Duyệt qua từng dòng và gọi API tạo
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        // Hiển thị loading (tạm thời dùng alert hoặc console, nâng cao thì dùng state)
        // alert(`Đang xử lý ${json.length} bản ghi...`);

        for (const row of json) {
          try {
            // Mapping dữ liệu từ Excel sang format API
            // Giả sử Excel có các cột: ID, Họ Tên, Căn Hộ (Mã), Vai trò, CCCD, Điện thoại, Email
            // Note: Mã căn hộ cần map sang ID (nếu API cần ID). 
            // Ở đây ta giả định API backend đã handle việc tìm apartment_id hoặc ta phải tìm trước.
            // Tuy nhiên residentController yêu cầu apartment_id.
            // => Đơn giản hoá: Ta gửi apartment_id nếu Excel có, hoặc map từ code.
            // (Để nhanh, giả sử Excel người dùng nhập sẵn Apartment ID hoặc Code đúng format)

            // Helper parse Date dd/mm/yyyy -> yyyy-mm-dd
            const parseDate = (val: any) => {
              if (!val) return null;
              if (typeof val === 'string') {
                const parts = val.split('/'); // 20/12/1990
                if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
              return val;
            };

            // Map Apartment Code -> ID
            const aptCode = row['Mã Căn Hộ'] || row['apartment_id'] || row['Căn hộ'] || row['Can ho'];
            const aptId = apartmentMap.get(aptCode);

            if (!aptId && aptCode) {
              throw new Error(`Mã căn hộ "${aptCode}" không tồn tại.`);
            }

            const payload = {
              // ID tự sinh, ko lấy từ Excel
              // id: row['ID'] || row['id'], 
              full_name: row['Họ và Tên'] || row['full_name'],
              apartment_id: aptId,  // Use mapped ID
              role: (row['Quyền hạn'] || row['role'] || '').includes('Chủ') ? 'owner' : 'member',
              cccd: row['CCCD'] || row['cccd'],
              phone: row['SĐT'] || row['Điện thoại'] || row['phone'],
              email: row['Email'] || row['email'],
              gender: row['Giới tính'] || row['gender'],
              dob: parseDate(row['Ngày sinh'] || row['dob']),

              identity_date: parseDate(row['Ngày cấp'] || row['identity_date']),
              identity_place: row['Nơi cấp'] || row['identity_place'],
              hometown: row['Quê quán'] || row['hometown'],
              occupation: row['Nghề nghiệp'] || row['occupation'],
              relationship_with_owner: row['Quan hệ với chủ hộ'] || row['relationship_with_owner'],

              account_username: row['Username'] || row['username'],
              account_password: row['Password'] || row['password'],

              status: 'Đang sinh sống'
            };

            // Bỏ qua nếu thiếu key fields
            if (!payload.full_name || !payload.apartment_id) {
              const missing = [];
              if (!payload.full_name) missing.push('Họ tên');
              if (!payload.apartment_id) missing.push('Căn hộ');
              throw new Error(`Thiếu thông tin bắt buộc: ${missing.join(', ')}`);
            }

            await residentApi.create(payload as any);
            successCount++;
          } catch (err: any) {
            console.error('Lỗi import dòng:', row, err);
            failCount++;
            const name = row['Họ và Tên'] || `Dòng ${typeof json.indexOf === 'function' ? json.indexOf(row) + 2 : '?'}`;
            errors.push(`${name}: ${err.response?.data?.message || err.message}`);
          }
        }

        if (failCount === 0) {
          alert(`Import thành công ${successCount} cư dân!`);
          window.location.reload();
        } else {
          alert(`Hoàn tất import.\nThành công: ${successCount}\nThất bại: ${failCount}\n\nLỗi:\n${errors.slice(0, 5).join('\n')}`);
          if (successCount > 0) window.location.reload();
        }

      } catch (error) {
        console.error("Lỗi khi đọc file Excel:", error);
        alert('Đã xảy ra lỗi khi đọc file.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      alignItems: 'stretch'  // Đảm bảo tất cả children đều full width
    }}>
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

        <Box>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            sx={{ mr: 1, backgroundColor: 'white' }}
            onClick={handleImportClick}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            sx={{ mr: 1, backgroundColor: 'white' }}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            sx={{ mr: 1, backgroundColor: 'white' }}
            onClick={handleOpenAdvancedSearch}
          >
            Tìm kiếm nâng cao
          </Button>
          <Button
            variant="outlined"
            color="warning"
            sx={{ mr: 1, backgroundColor: 'white' }}
            onClick={() => setOpenEditRequestsModal(true)}
          >
            Yêu cầu chỉnh sửa {pendingCount > 0 && `(${pendingCount})`}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateResident}
          >
            Thêm cư dân
          </Button>
        </Box>
      </Box>

      {/* Alert yêu cầu chờ duyệt */}
      {pendingCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Có <strong>{pendingCount}</strong> yêu cầu chỉnh sửa thông tin từ cư dân đang chờ duyệt.
          <Button size="small" sx={{ ml: 1 }} onClick={() => setOpenEditRequestsModal(true)}>
            Xem ngay
          </Button>
        </Alert>
      )}

      {/* Modal Danh sách yêu cầu chỉnh sửa */}
      <Modal open={openEditRequestsModal} onClose={() => setOpenEditRequestsModal(false)}>
        <Box sx={{
          ...modalStyle,
          width: { xs: '95%', md: 700 },
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Tất cả yêu cầu chỉnh sửa ({allRequests.length})
            </Typography>
            <IconButton onClick={() => setOpenEditRequestsModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {allRequests.length === 0 ? (
            <Alert severity="info">Chưa có yêu cầu nào.</Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Cư dân</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Căn hộ</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nội dung</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Trạng thái</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Ngày gửi</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Xem</th>
                  </tr>
                </thead>
                <tbody>
                  {allRequests.map((req) => (
                    <tr key={req.id}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 500 }}>
                        {req.resident_name}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        {req.apartment_code || '-'}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '0.85rem' }}>
                        {Object.entries(req.requested_changes || {}).slice(0, 2).map(([key, val]) => (
                          <div key={key}><strong>{key}:</strong> {String(val)}</div>
                        ))}
                        {Object.keys(req.requested_changes || {}).length > 2 && (
                          <span style={{ color: '#666' }}>+{Object.keys(req.requested_changes).length - 2} trường khác</span>
                        )}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <Box component="span" sx={{
                          px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.8rem',
                          bgcolor: req.status === 'Đã duyệt' ? '#e8f5e9' : req.status === 'Chờ duyệt' ? '#fff3e0' : '#ffebee',
                          color: req.status === 'Đã duyệt' ? '#2e7d32' : req.status === 'Chờ duyệt' ? '#e65100' : '#c62828'
                        }}>
                          {req.status}
                        </Box>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                        {req.created_at ? new Date(req.created_at).toLocaleDateString('vi-VN') : ''}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setOpenEditRequestsModal(false);
                            navigate(`${basePath}/resident/profile/${req.resident_id}`);
                          }}
                        >
                          Xem Profile
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Box>
      </Modal>

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
              label="Tên cư dân"
              value={tempFilters.name}
              onChange={(e) => setTempFilters({ ...tempFilters, name: e.target.value })}
              size="small"
              fullWidth
              placeholder="Nhập tên để tìm kiếm..."
            />

            <TextField
              label="Mã căn hộ"
              value={tempFilters.apartmentCode}
              onChange={(e) => setTempFilters({ ...tempFilters, apartmentCode: e.target.value })}
              size="small"
              fullWidth
              placeholder="Ví dụ: A-101"
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={tempFilters.role}
                label="Vai trò"
                onChange={(e) => setTempFilters({ ...tempFilters, role: e.target.value })}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="owner">Chủ hộ</MenuItem>
                <MenuItem value="member">Thành viên</MenuItem>
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
                <MenuItem value="Đang sinh sống">Đang sinh sống</MenuItem>
                <MenuItem value="Đã chuyển đi">Đã chuyển đi</MenuItem>
                <MenuItem value="Tạm vắng">Tạm vắng</MenuItem>
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
                  <MenuItem value="full_name">Tên</MenuItem>
                  <MenuItem value="apartment_code">Mã căn hộ</MenuItem>
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

      {/* Hiển thị số lượng kết quả khi có filter */}
      {!isLoading && !error && hasActiveFilters && (
        <Alert severity="info" sx={{ mb: 2, width: '100%' }}>
          Tìm thấy {totalRows} kết quả phù hợp
        </Alert>
      )}

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

      {/* Bulk Actions Indicator & Select All */}
      {!isLoading && !error && paginatedResidents.length > 0 && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isAllPageSelected}
                indeterminate={!isAllPageSelected && isSomePageSelected}
                onChange={handleSelectAllPage}
                color="primary"
              />
            }
            label={selectedIds.length > 0 ? `Đã chọn ${selectedIds.length} cư dân` : "Chọn tất cả trang này"}
          />
        </Box>
      )}

      {/* HÀNG 2: Danh sách cư dân (dạng thẻ) */}
      {!isLoading && !error && (
        <Grid container spacing={2} sx={{ width: '100%' }}>
          {paginatedResidents.map((res: Resident) => {
            const roleInfo = roleMap[res.role as keyof typeof roleMap] || { label: res.role, color: 'default' };

            return (
              <Grid
                size={{ xs: 12 }}
                key={res.id}>
                <Card sx={{ display: 'flex', alignItems: 'center', p: 2, border: isSelected(res.id) ? '1px solid #1976d2' : 'none' }}>
                  {/* Tickbox cho mỗi thẻ */}
                  <Checkbox
                    checked={isSelected(res.id)}
                    onChange={() => handleSelectOne(res.id)}
                    sx={{ mr: 1 }}
                  />

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
                      <Chip label={res.status} size="small" variant="outlined" sx={{ mr: 1 }} />
                    )}
                    {res.has_account ? (
                      <Chip label="Có TK" size="small" color="info" variant="outlined" />
                    ) : (
                      <Chip label="Chưa có TK" size="small" variant="outlined" sx={{ color: '#999' }} />
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
      {/* Bulk Action Footer */}
      {selectedIds.length > 0 && (
        <Box sx={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          bgcolor: 'white',
          boxShadow: 3,
          borderRadius: 2,
          p: 2,
          zIndex: 1000,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          border: '1px solid #ddd'
        }}>
          <Typography variant="body1" fontWeight="bold">
            Đang chọn: {selectedIds.length}
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            onClick={handleBulkDelete}
            disabled={deleting}
          >
            {deleting ? 'Đang xóa...' : 'Xóa đã chọn'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
          >
            Export đã chọn
          </Button>
        </Box>
      )}
    </Box>
  );
}