// src/pages/BOD/FeeManagement/FeeList.tsx
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, type ChangeEvent } from 'react'; 
import * as XLSX from 'xlsx'; 
import { 
  DataGrid, 
  type GridColDef, 
  type GridRowsProp,
} from '@mui/x-data-grid';

// Icons
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PaymentIcon from '@mui/icons-material/Payment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
//import EditIcon from '@mui/icons-material/Edit'; // <-- THÊM EditIcon
//import EditIcon from '@mui/icons-material/Edit';
import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useLayout } from '../../../contexts/LayoutContext';

// Định nghĩa kiểu dữ liệu cho Trạng thái
type FeeStatus = 'Chưa thanh toán' | 'Đã thanh toán' | 'Quá hạn' | 'Đã hủy';

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
// p: 3 (padding của MainLayout) = 3 * 8px = 24px. (Trái 24px, Phải 24px)
const PAGE_PADDING = 48;

// --- TẠO DỮ LIỆU GIẢ (MOCK DATA) ---
const mockFees: GridRowsProp = [
  { 
    id: 'HD0001', 
    apartment_id: 'A-101', 
    resident_name: 'Trần Văn Hộ', 
    fee_type: 'Phí Quản lý', 
    description: 'PQL Tháng 10/2025', 
    billing_period: 'T10/2025',
    due_date: '2025-10-15',
    total_amount: 1200000,
    amount_paid: 1200000,
    amount_remaining: 0,
    status: 'Đã thanh toán',
    payment_date: '2025-10-10',
  },
  { 
    id: 'HD0002', 
    apartment_id: 'A-101', 
    resident_name: 'Trần Văn Hộ', 
    fee_type: 'Phí Gửi xe', 
    description: 'Xe ô tô BKS 29A-12345', 
    billing_period: 'T10/2025',
    due_date: '2025-10-15',
    total_amount: 1000000,
    amount_paid: 0,
    amount_remaining: 1000000,
    status: 'Chưa thanh toán',
    payment_date: null,
  },
  { 
    id: 'HD0003', 
    apartment_id: 'B-205', 
    resident_name: 'Lê Gia Đình', 
    fee_type: 'Phí Quản lý', 
    description: 'PQL Tháng 09/2025', 
    billing_period: 'T09/2025',
    due_date: '2025-09-15',
    total_amount: 1500000,
    amount_paid: 0,
    amount_remaining: 1500000,
    status: 'Quá hạn',
    payment_date: null,
  },
  { 
    id: 'HD0004', 
    apartment_id: 'C-1503', 
    resident_name: 'Phạm Văn B', 
    fee_type: 'Phí Nước', 
    description: 'Tiền nước T09 (25m³)', 
    billing_period: 'T09/2025',
    due_date: '2025-10-05',
    total_amount: 350000,
    amount_paid: 350000,
    amount_remaining: 0,
    status: 'Đã thanh toán',
    payment_date: '2025-10-01',
  },
  { 
    id: 'HD0005', 
    apartment_id: 'D-404', 
    resident_name: 'Hoàng Thị C', 
    fee_type: 'Sửa chữa', 
    description: 'Sửa rò rỉ ống nước', 
    billing_period: 'T10/2025',
    due_date: '2025-10-20',
    total_amount: 800000,
    amount_paid: 400000, // Thanh toán 1 phần
    amount_remaining: 400000,
    status: 'Chưa thanh toán',
    payment_date: null,
  },
];



// --- Component Chính ---
export default function AccountantFeeList() {
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();

  // 2. LẤY STATE TỪ CONTEXT
  const { isSidebarCollapsed } = useLayout(); 

  // 3. TÍNH TOÁN
  const dynamicPaperWidth = windowWidth 
                            - (isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN) 
                            - PAGE_PADDING;

  // --- ĐỊNH NGHĨA CÁC CỘT (COLUMNS) CHO BẢNG ---
  const columns: GridColDef[] = [
    // 1. Mã Công Nợ
    { field: 'id', headerName: 'Mã HĐ', width: 90 },
    // 2. Mã Căn Hộ
    { field: 'apartment_id', headerName: 'Căn hộ', width: 70 },
    // 3. Tên Chủ Hộ
    { field: 'resident_name', headerName: 'Người TT', width: 150 },
    // 4. Loại Phí
    { field: 'fee_type', headerName: 'Loại phí', width: 100 },
    // 5. Nội dung
    { field: 'description', headerName: 'Nội dung', width: 180 },
    // 6. Kỳ TT
    { field: 'billing_period', headerName: 'Kỳ TT', width: 70 },
    // 7. Hạn TT
    { 
      field: 'due_date', 
      headerName: 'Hạn TT', 
      width: 100,
      type: 'date',
      valueGetter: (value) => new Date(value),
    },
    // 8. Tổng Thu
    { 
      field: 'total_amount', 
      headerName: 'Tổng thu', 
      width: 100,
      type: 'number',
      valueFormatter: (value: number) => value.toLocaleString('vi-VN') + ' đ',
    },
    // 9. Đã Thu
    { 
      field: 'amount_paid', 
      headerName: 'Đã thu', 
      width: 100,
      type: 'number',
      valueFormatter: (value: number) => value.toLocaleString('vi-VN') + ' đ',
    },
    // 10. Còn Nợ
    { 
      field: 'amount_remaining', 
      headerName: 'Dư nợ', 
      width: 100,
      type: 'number',
      valueFormatter: (value: number) => value.toLocaleString('vi-VN') + ' đ',
    },
    // 11. Trạng Thái (Render Chip)
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      width: 130,
      renderCell: (params) => {
        const status = params.value as FeeStatus;
        let color: "success" | "warning" | "error" | "default" = "default";
        if (status === 'Đã thanh toán') color = 'success';
        if (status === 'Chưa thanh toán') color = 'warning';
        if (status === 'Quá hạn') color = 'error';
        return <Chip label={status} color={color} size="small" />;
      }
    },
    // 12. Ngày TT
    { 
      field: 'payment_date', 
      headerName: 'Ngày TT', 
      width: 100,
      type: 'date',
      valueGetter: (value) => (value ? new Date(value) : null),
    },
    // 13. Hành Động (Render Buttons)
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 150,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Xem chi tiết / In HĐ">
            <IconButton size="small" onClick={() => navigate(`/accountance/fee/list/invoice/${params.row.id}`)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xác nhận thanh toán">
            <IconButton 
              size="small" 
              onClick={() => navigate(`/accountance/fee/list/invoice/edit/${params.row.id}`)}
              disabled={params.row.status === 'Đã thanh toán'}
            >
              <PaymentIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gửi nhắc nhở">
            <IconButton 
              size="small" 
              onClick={() => alert(`Gửi nhắc nhở: ${params.row.id}`)}
              disabled={params.row.status === 'Đã thanh toán'}
            >
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
          {/* <Tooltip title="Sửa">
            <IconButton size="small"><EditIcon /></IconButton>
          </Tooltip> */}
        </Box>
      )
    }
  ];
  const [openAddModal, setOpenAddModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenAddModal = () => {
    setOpenAddModal(true);
  };

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
  };

  const handleAddNewFee = () => {
    // (Đây là nơi bạn sẽ thu thập dữ liệu từ form và gọi API)
    alert('Logic thêm hóa đơn mới... (chưa implement)');
    handleCloseAddModal();
  };

  const handleExport = () => {
      // 1. (Tùy chọn) Chuyển đổi dữ liệu cho dễ đọc hơn
      const dataToExport = mockFees.map(fee => ({
        'Mã HĐ': fee.id,
        'Căn hộ': fee.apartment_id,
        'Người TT': fee.resident_name,
        'Loại phí': fee.fee_type,
        'Nội dung': fee.description,
        'Kỳ TT': fee.billing_period,
        'Hạn TT': fee.due_date,
        'Tổng thu': fee.total_amount,
        'Đã thu': fee.amount_paid,
        'Dư nợ': fee.amount_remaining,
        'Trạng thái': fee.status,
        'Ngày TT': fee.payment_date,
      }));
  
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'DanhSachCongNo');
      XLSX.writeFile(wb, 'DanhSachCongNo.xlsx');
    };
  
    // --- THÊM LẠI: Logic IMPORT (Giống ResidentList) ---
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
          
          console.log('Dữ liệu Công nợ Import từ Excel:', json);
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
    <>
        {/* --- THÊM LẠI: Input ẩn --- */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".xlsx, .xls"
      />

      <Grid container spacing={2}>
        <Grid sx={{  
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
        >
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            DANH SÁCH CÔNG NỢ
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

            {/* --- NÚT MỚI: CHỐT CÔNG NỢ --- */}
            <Button
                variant="contained"
                color="success" // Màu khác biệt để nổi bật
                startIcon={<PlaylistAddIcon />}
                onClick={() => navigate('/accountance/fee/batch-create')}
                sx={{ ml: 1 }}
            >
                Chốt công nợ tháng
            </Button>
            
            {/* Nút thêm lẻ cũ */}
            <Button variant="contained" onClick={handleOpenAddModal} sx={{ ml: 1 }}>
                Thêm lẻ
            </Button>
            </Box>
        </Grid>

        <Grid sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <Paper sx={{ 
                height: '100%', 
                width: dynamicPaperWidth,
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
            }}>
            <DataGrid
                rows={mockFees}
                columns={columns}
                // Kích thước trang
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                    },
                }}
                pageSizeOptions={[10, 25, 50]}

                // Checkbox
                checkboxSelection
                disableRowSelectionOnClick

                // Styling
                sx={{
                    height: '100%',
                    width: dynamicPaperWidth,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    border: 0,
                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                    outline: 'none',
                    },
                    // Thêm padding cho bảng
                    '&.MuiDataGrid-root': {
                    p: 2,
                    },
                    minWidth: '900px',
                }}
            />
            </Paper>
        </Grid>
      </Grid>
        

        {/* --- THÊM MỚI: MODAL THÊM HÓA ĐƠN (Yêu cầu 3) --- */}
        <Dialog 
            open={openAddModal} 
            onClose={handleCloseAddModal} 
            maxWidth="sm" 
            fullWidth
        >
            <DialogTitle>Thêm Hóa đơn Mới</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Hàng 1: Căn hộ, Chủ hộ */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="Mã Căn hộ" fullWidth />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="Tên Chủ hộ" fullWidth />
                    </Grid>
                
                    {/* Hàng 2: Loại phí, Kỳ TT */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                        <InputLabel>Loại Phí</InputLabel>
                        <Select label="Loại Phí">
                            <MenuItem value="Phí Quản lý">Phí Quản lý</MenuItem>
                            <MenuItem value="Phí Gửi xe">Phí Gửi xe</MenuItem>
                            <MenuItem value="Phí Nước">Phí Nước</MenuItem>
                            <MenuItem value="Sửa chữa">Sửa chữa</MenuItem>
                            <MenuItem value="Khác">Khác</MenuItem>
                        </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="Kỳ Thanh toán (vd: T10/2025)" fullWidth />
                    </Grid>

                    {/* Hàng 3: Nội dung */}
                    <Grid size={{ xs: 12 }}>
                        <TextField label="Nội dung / Chi tiết" fullWidth />
                    </Grid>

                    {/* Hàng 4: Tổng thu, Hạn TT */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField 
                        label="Tổng Thu (VNĐ)" 
                        type="number" 
                        fullWidth 
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField 
                        label="Hạn Thanh toán" 
                        type="date" 
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    {/* Hàng 5: Trạng thái (thường là mặc định) */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select label="Trạng thái" defaultValue="Chưa thanh toán">
                            <MenuItem value="Chưa thanh toán">Chưa thanh toán</MenuItem>
                            <MenuItem value="Quá hạn">Quá hạn</MenuItem>
                            <MenuItem value="Đã hủy">Đã hủy</MenuItem>
                        </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseAddModal}>Hủy</Button>
                <Button onClick={handleAddNewFee} variant="contained">
                Thêm
                </Button>
            </DialogActions>
        </Dialog>
    </>
  );
}