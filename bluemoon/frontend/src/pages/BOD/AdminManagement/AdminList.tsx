// src/pages/BOD/AdminManagement/AdminList.tsx
import {
  Box,
  Typography,
  Button,
  Card,
  //CardContent,
  Avatar,
  Chip,
  Pagination,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  //CircularProgress, // Thêm icon loading
  //Alert, // Thêm thông báo lỗi
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, type ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../api/adminApi';
// Icons
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import * as XLSX from 'xlsx';

// Dữ liệu giả (Mock Data) để test (--- CẬP NHẬT --- Yêu cầu 4)
//const mockAdmins = [
  //{ id: 'ID0001', name: 'Nguyễn Văn A', role: 'bod' },
  //{ id: 'ID0002', name: 'Nguyễn Văn B', role: 'accountance' },
  //{ id: 'ID0003', name: 'Nguyễn Văn C', role: 'bod' },
  //{ id: 'ID0004', name: 'Nguyễn Văn D', role: 'accountance' },
  //{ id: 'ID0005', name: 'Trần Thị E', role: 'bod' },
  //{ id: 'ID0006', name: 'Lê Văn F', role: 'accountance' },
  //{ id: 'ID0007', name: 'Phạm Hữu G', role: 'bod' },
  //{ id: 'ID0008', name: 'Hoàng Minh H', role: 'bod' },
  //{ id: 'ID0009', name: 'Vũ Thị I', role: 'accountance' },
  //{ id: 'ID0010', name: 'Đặng Văn K', role: 'bod' },
//];

// Định nghĩa màu cho các vai trò (giữ nguyên)
// --- CẬP NHẬT MAP: Dùng role_id làm key ---
const roleMap: Record<number, { label: string, color: string, code: string }> = {
  1: { label: 'Ban quản trị', color: 'primary', code: 'bod' },
  2: { label: 'Kế toán', color: 'secondary', code: 'accountance' },
  3: { label: 'Cư dân', color: 'default', code: 'resident' }
};

// Cấu hình phân trang
const ROWS_PER_PAGE = 10;

export default function AdminList() {
  const navigate = useNavigate();

  // --- STATE PHÂN TRANG ---
  const [page, setPage] = useState(1);

  // --- KẾT NỐI API ---
  const { data: adminList = [], isLoading, error } = useQuery({
    queryKey: ['admins'], // Key định danh cho query này
    queryFn: adminApi.getAdminsOnly, // Gọi hàm lấy và lọc admin
  });

  // --- LOGIC TÍNH TOÁN PHÂN TRANG (Client-side) ---
  const totalRows = adminList.length;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  
  // Cắt mảng adminList theo trang hiện tại
  const paginatedAdmins = adminList.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Cuộn lên đầu trang khi chuyển trang (UX tốt hơn)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- THÊM MỚI: State cho các Modal ---
  const [openPrimary, setOpenPrimary] = useState(false);
  const [openExisting, setOpenExisting] = useState(false);
  const [existingId, setExistingId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenPrimaryModal = () => {
    setOpenPrimary(true);
  };

  const handleClosePrimaryModal = () => {
    setOpenPrimary(false);
  };

  const handleOpenExistingModal = () => {
    setOpenPrimary(false); // Đóng modal 1
    setOpenExisting(true); // Mở modal 2
  };

  const handleCloseExistingModal = () => {
    setOpenExisting(false);
    setExistingId(''); // Reset ID
  };

  // 1.2: Tạo tài khoản mới
  const handleNavigateToCreate = () => {
    navigate('/bod/admin/profile/create');
    handleClosePrimaryModal();
  };
  
  // 1.1: Xử lý thêm tài khoản có sẵn
  const handleAddExistingAccount = () => {
    // (Đây là nơi bạn sẽ gọi API để kiểm tra ID)
    // Giả lập logic
    if (existingId === 'dung') {
      alert('Thêm tài khoản thành công!');
    } else {
      alert('ID tài khoản không tồn tại.');
    }
    handleCloseExistingModal();
  };
  
  const handleViewProfile = (adminId: string) => {
    navigate(`/bod/admin/profile/${adminId}`); //
  }

  // --- THÊM MỚI: Logic EXPORT ---
  const handleExport = () => {
    // Export data thật từ API
    const dataToExport = adminList.map(admin => ({
      'ID': admin.id,
      'Username': admin.username,
      'Email': admin.email,
      'Vai trò': roleMap[admin.role_id || 3]?.label || 'Không xác định'
    }));

    // 2. Tạo worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    // 3. Tạo workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachQuanTriVien');
    
    // 4. Xuất file
    XLSX.writeFile(wb, 'DanhSachQuanTriVien.xlsx');
  };

  // --- THÊM MỚI: Logic IMPORT (Bước 1: Kích hoạt input ẩn) ---
  const handleImportClick = () => {
    // Mở hộp thoại chọn file của máy tính
    fileInputRef.current?.click();
  };

  // --- THÊM MỚI: Logic IMPORT (Bước 2: Xử lý file đã chọn) ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Lấy sheet đầu tiên
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Chuyển đổi sheet thành JSON
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        // (Đây là nơi bạn xử lý dữ liệu json, ví dụ: gửi lên server)
        console.log('Dữ liệu Import từ Excel:', json);
        alert('Đã đọc file Excel thành công! Xem dữ liệu ở Console (F12).');

      } catch (error) {
        console.error("Lỗi khi đọc file Excel:", error);
        alert('Đã xảy ra lỗi khi đọc file. Vui lòng kiểm tra định dạng file.');
      }
    };
    
    // Đọc file
    reader.readAsArrayBuffer(file);

    // Reset input để có thể chọn lại file y hệt
    e.target.value = '';
  };

  return (
    <Box>
      {/* --- THÊM MỚI: Input ẩn để Import --- */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".xlsx, .xls" // Chỉ chấp nhận file Excel
      />

      {/* HÀNG 1: Tiêu đề + Các nút (giữ nguyên) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          DANH SÁCH QUẢN TRỊ VIÊN
        </Typography>

        <Box>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            sx={{ 
              mr: 1, 
              backgroundColor: 'white', 
              color: '#333', 
              borderColor: '#ccc',
              '&:hover': { backgroundColor: '#f9f9f9', borderColor: '#bbb' }
            }}
            onClick={handleImportClick}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            sx={{ 
              mr: 1, 
              backgroundColor: 'white', 
              color: '#333', 
              borderColor: '#ccc',
              '&:hover': { backgroundColor: '#f9f9f9', borderColor: '#bbb' }
            }}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="contained"
            onClick={handleOpenPrimaryModal} //
          >
            Thêm quản trị viên
          </Button>
        </Box>
      </Box>

      {/* --- DANH SÁCH USER TỪ API --- */}
      {!isLoading && !error && (
        <Grid container spacing={2}>
          {paginatedAdmins.length === 0 ? (
            <Typography sx={{ p: 2, fontStyle: 'italic', color: 'text.secondary' }}>Chưa có quản trị viên nào.</Typography>
          ) : (
            // --- CẬP NHẬT: Dùng mảng đã phân trang (paginatedAdmins) ---
            paginatedAdmins.map((admin) => {
              const roleInfo = roleMap[admin.role_id || 3] || roleMap[3];
              
              // --- LOGIC HIỂN THỊ TÊN ---
              // Ưu tiên full_name nếu có và không rỗng, ngược lại dùng username
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
                        {displayName} {/* Hiển thị tên thật nếu có, ko thì username */}
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

      {/* --- CẬP NHẬT: Pagination Component --- */}
      {!isLoading && !error && totalRows > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={totalPages}      // Tổng số trang tính toán được
            page={page}             // Trang hiện tại
            onChange={handlePageChange} // Hàm xử lý khi đổi trang
            color="primary" 
            showFirstButton 
            showLastButton
          />
        </Box>
      )}

      {/* --- THÊM MỚI: MODAL 1 (Yêu cầu 1) --- */}
      <Dialog
        open={openPrimary}
        onClose={handleClosePrimaryModal}
        maxWidth="xs"
      >
        <DialogTitle>Tùy chọn thêm tài khoản</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List>
            {/* 1.1: Tài khoản sẵn có */}
            <ListItemButton onClick={handleOpenExistingModal}>
              <ListItemIcon>
                <PersonSearchIcon />
              </ListItemIcon>
              <ListItemText primary="Tài khoản sẵn có" />
            </ListItemButton>
            
            {/* 1.2: Tạo tài khoản mới */}
            <ListItemButton onClick={handleNavigateToCreate}>
              <ListItemIcon>
                <AddCircleOutlineIcon />
              </ListItemIcon>
              <ListItemText primary="Tạo tài khoản mới" />
            </ListItemButton>
          </List>
        </DialogContent>
      </Dialog>
      
      {/* --- THÊM MỚI: MODAL 2 (Yêu cầu 1.1) --- */}
      <Dialog
        open={openExisting}
        onClose={handleCloseExistingModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Thêm tài khoản có sẵn</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="existing-id"
            label="Nhập ID tài khoản"
            type="text"
            fullWidth
            variant="outlined"
            value={existingId}
            onChange={(e) => setExistingId(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExistingModal}>Hủy</Button>
          <Button onClick={handleAddExistingAccount} variant="contained">
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}