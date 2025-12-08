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
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import {
  DataGrid,
  type GridColDef,
} from '@mui/x-data-grid';

// Icons
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PaymentIcon from '@mui/icons-material/Payment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PrintIcon from '@mui/icons-material/Print';
import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useLayout } from '../../../contexts/LayoutContext';
import feeApi, { type Fee, type FeeItem } from '../../../api/feeApi';
import { format, parseISO } from 'date-fns';

// Định nghĩa kiểu dữ liệu cho Trạng thái
type FeeStatus = 'Chưa thanh toán' | 'Đã thanh toán' | 'Quá hạn' | 'Thanh toán một phần' | 'Đã hủy';

interface FeeType {
  id: number;
  name: string;
  default_amount?: number;
}

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const PAGE_PADDING = 48;

// Hàm chuyển số thành chữ
const numberToWords = (num: number): string => {
  if (num === 0) return 'Không đồng';
  return num.toLocaleString('vi-VN') + ' đồng';
};

export default function FeeList() {
  const windowWidth = useWindowWidth();
  const { isSidebarCollapsed } = useLayout();

  const dynamicPaperWidth = windowWidth
    - (isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN)
    - PAGE_PADDING;

  // --- STATE ---
  const [fees, setFees] = useState<Fee[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  // Modal state - Add new invoice
  const [openAddModal, setOpenAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state - View invoice detail
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Fee | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form state for new invoice
  const [formData, setFormData] = useState({
    apartment_id: '',
    fee_type_id: '',
    description: '',
    billing_period: '',
    due_date: '',
    total_amount: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FETCH DATA ---
  useEffect(() => {
    fetchFees();
    fetchFeeTypes();
  }, []);

  const fetchFees = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await feeApi.getAll();
      const data = (response.data as any).data || [];
      setFees(data);
    } catch (err: any) {
      console.error('Error fetching fees:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách công nợ.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeeTypes = async () => {
    try {
      const response = await feeApi.getTypes();
      const data = (response.data as any).data || [];
      setFeeTypes(data);
    } catch (err) {
      console.error('Error fetching fee types:', err);
    }
  };

  // --- HANDLERS ---
  const handleOpenAddModal = () => {
    setFormData({
      apartment_id: '',
      fee_type_id: '',
      description: '',
      billing_period: '',
      due_date: '',
      total_amount: '',
    });
    setOpenAddModal(true);
  };

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewFee = async () => {
    // Validate
    if (!formData.apartment_id || !formData.fee_type_id || !formData.total_amount || !formData.due_date) {
      setSnackbar({ open: true, message: 'Vui lòng điền đầy đủ thông tin bắt buộc.', severity: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      await feeApi.create({
        apartment_id: formData.apartment_id,
        fee_type_id: parseInt(formData.fee_type_id),
        description: formData.description,
        billing_period: formData.billing_period,
        due_date: formData.due_date,
        total_amount: parseFloat(formData.total_amount),
      });

      setSnackbar({ open: true, message: 'Thêm hóa đơn thành công!', severity: 'success' });
      handleCloseAddModal();
      fetchFees(); // Refresh list
    } catch (err: any) {
      console.error('Error creating fee:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Không thể thêm hóa đơn.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // View invoice detail
  const handleViewDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      setOpenViewModal(true);
      const response = await feeApi.getDetail(id);
      const data = (response.data as any).data || response.data;
      setSelectedInvoice(data);
    } catch (err: any) {
      console.error('Error fetching invoice detail:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Không thể tải chi tiết hóa đơn.', severity: 'error' });
      setOpenViewModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseViewModal = () => {
    setOpenViewModal(false);
    setSelectedInvoice(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendReminder = async (fee: Fee) => {
    setSnackbar({ open: true, message: `Đã gửi nhắc nhở cho căn hộ ${fee.apartment_code || fee.apartment_id}`, severity: 'success' });
  };

  const handleExport = () => {
    const dataToExport = fees.map(fee => ({
      'Mã HĐ': fee.id,
      'Căn hộ': fee.apartment_code || fee.apartment_id,
      'Người TT': fee.resident_name || '',
      'Loại phí': fee.fee_name || '',
      'Nội dung': fee.description,
      'Kỳ TT': fee.billing_period,
      'Hạn TT': fee.due_date,
      'Tổng thu': fee.total_amount,
      'Đã thu': fee.amount_paid,
      'Dư nợ': fee.amount_remaining,
      'Trạng thái': fee.status,
      'Ngày TT': fee.payment_date || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachCongNo');
    XLSX.writeFile(wb, 'DanhSachCongNo.xlsx');
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

        console.log('Dữ liệu Công nợ Import từ Excel:', json);
        setSnackbar({ open: true, message: 'Đã đọc file Excel thành công! Xem Console (F12).', severity: 'success' });

      } catch (error) {
        console.error("Lỗi khi đọc file Excel:", error);
        setSnackbar({ open: true, message: 'Đã xảy ra lỗi khi đọc file.', severity: 'error' });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // --- COLUMNS ---
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Mã HĐ', width: 100 },
    {
      field: 'apartment_code',
      headerName: 'Căn hộ',
      width: 80,
      valueGetter: (_value, row) => row.apartment_code || row.apartment_id
    },
    { field: 'resident_name', headerName: 'Người TT', width: 150 },
    { field: 'fee_name', headerName: 'Loại phí', width: 120 },
    { field: 'description', headerName: 'Nội dung', width: 180 },
    { field: 'billing_period', headerName: 'Kỳ TT', width: 80 },
    {
      field: 'due_date',
      headerName: 'Hạn TT',
      width: 100,
      type: 'date',
      valueGetter: (value) => value ? new Date(value) : null,
    },
    {
      field: 'total_amount',
      headerName: 'Tổng thu',
      width: 110,
      type: 'number',
      valueFormatter: (value: number) => value ? value.toLocaleString('vi-VN') + ' đ' : '0 đ',
    },
    {
      field: 'amount_paid',
      headerName: 'Đã thu',
      width: 110,
      type: 'number',
      valueFormatter: (value: number) => value ? value.toLocaleString('vi-VN') + ' đ' : '0 đ',
    },
    {
      field: 'amount_remaining',
      headerName: 'Dư nợ',
      width: 110,
      type: 'number',
      valueFormatter: (value: number) => value ? value.toLocaleString('vi-VN') + ' đ' : '0 đ',
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 140,
      renderCell: (params) => {
        const status = params.value as FeeStatus;
        let color: "success" | "warning" | "error" | "info" | "default" = "default";
        if (status === 'Đã thanh toán') color = 'success';
        if (status === 'Chưa thanh toán') color = 'warning';
        if (status === 'Quá hạn') color = 'error';
        if (status === 'Thanh toán một phần') color = 'info';
        return <Chip label={status} color={color} size="small" />;
      }
    },
    {
      field: 'payment_date',
      headerName: 'Ngày TT',
      width: 100,
      type: 'date',
      valueGetter: (value) => (value ? new Date(value) : null),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 130,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Xem chi tiết">
            <IconButton size="small" onClick={() => handleViewDetail(params.row.id)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xác nhận thanh toán">
            <IconButton
              size="small"
              onClick={() => handleViewDetail(params.row.id)}
              disabled={params.row.status === 'Đã thanh toán'}
            >
              <PaymentIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gửi nhắc nhở">
            <IconButton
              size="small"
              onClick={() => handleSendReminder(params.row)}
              disabled={params.row.status === 'Đã thanh toán'}
            >
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <>
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
        }}>
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
            <Button
              variant="contained"
              onClick={handleOpenAddModal}
            >
              Thêm mới
            </Button>
          </Box>
        </Grid>

        <Grid sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Loading State */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress />
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Data Grid */}
          {!isLoading && !error && (
            <Paper sx={{
              height: '100%',
              width: dynamicPaperWidth,
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
            }}>
              <DataGrid
                rows={fees}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  },
                  sorting: {
                    sortModel: [{ field: 'due_date', sort: 'asc' }]
                  }
                }}
                pageSizeOptions={[10, 25, 50]}
                checkboxSelection
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
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
                  '&.MuiDataGrid-root': {
                    p: 2,
                  },
                  minWidth: '900px',
                }}
                localeText={{
                  noRowsLabel: 'Không có hóa đơn nào.'
                }}
              />
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Modal Thêm Hóa đơn */}
      <Dialog
        open={openAddModal}
        onClose={handleCloseAddModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Thêm Hóa đơn Mới</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Mã Căn hộ"
                fullWidth
                required
                value={formData.apartment_id}
                onChange={(e) => handleFormChange('apartment_id', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Loại Phí</InputLabel>
                <Select
                  label="Loại Phí"
                  value={formData.fee_type_id}
                  onChange={(e) => handleFormChange('fee_type_id', e.target.value)}
                >
                  {feeTypes.map(type => (
                    <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Kỳ Thanh toán (vd: T10/2025)"
                fullWidth
                value={formData.billing_period}
                onChange={(e) => handleFormChange('billing_period', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Hạn Thanh toán"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={formData.due_date}
                onChange={(e) => handleFormChange('due_date', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Nội dung / Chi tiết"
                fullWidth
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Tổng Thu (VNĐ)"
                type="number"
                fullWidth
                required
                value={formData.total_amount}
                onChange={(e) => handleFormChange('total_amount', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal} disabled={isSubmitting}>Hủy</Button>
          <Button onClick={handleAddNewFee} variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Xem Chi tiết Hóa đơn */}
      <Dialog
        open={openViewModal}
        onClose={handleCloseViewModal}
        maxWidth="md"
        fullWidth
        className="invoice-dialog"
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">Chi tiết Phiếu Báo Phí</Typography>
          <Tooltip title="In hóa đơn">
            <IconButton onClick={handlePrint} className="no-print">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent>
          {loadingDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedInvoice ? (
            <Box sx={{ p: 2 }}>
              {/* Header */}
              <Grid container justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Grid>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>BLUEMOON</Typography>
                  <Typography variant="body2">Ban Quản Lý Chung Cư</Typography>
                  <Typography variant="body2">Địa chỉ: 123 Đường ABC, P.XYZ, Q.1, TP.HCM</Typography>
                </Grid>
                <Grid sx={{ textAlign: 'right' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>PHIẾU BÁO PHÍ</Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                    Ngày {selectedInvoice.created_at ? format(parseISO(selectedInvoice.created_at), 'dd/MM/yyyy') : ''}
                  </Typography>
                  <Typography variant="body2">Số: {selectedInvoice.id}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Thông tin Cư dân */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Cư dân:</Typography>
                  <Typography fontWeight="bold">{selectedInvoice.resident_name || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Căn hộ:</Typography>
                  <Typography fontWeight="bold">{selectedInvoice.apartment_code || selectedInvoice.apartment_id}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Loại phí:</Typography>
                  <Typography>{selectedInvoice.fee_name || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Hạn thanh toán:</Typography>
                  <Typography
                    fontWeight="bold"
                    color={selectedInvoice.status !== 'Đã thanh toán' ? 'error.main' : 'inherit'}
                  >
                    {selectedInvoice.due_date ? format(parseISO(selectedInvoice.due_date), 'dd/MM/yyyy') : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Bảng Chi tiết Phí */}
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Chi tiết các khoản phí:</Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ccc', mb: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f4f6f8' }}>
                    <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                      <TableCell>STT</TableCell>
                      <TableCell>Nội dung</TableCell>
                      <TableCell>ĐVT</TableCell>
                      <TableCell align="right">Số lượng</TableCell>
                      <TableCell align="right">Đơn giá</TableCell>
                      <TableCell align="right">Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item: FeeItem, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.stt || index + 1}</TableCell>
                          <TableCell>{item.item_name}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{item.unit_price?.toLocaleString('vi-VN')}</TableCell>
                          <TableCell align="right">{item.amount?.toLocaleString('vi-VN')}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell>1</TableCell>
                        <TableCell>{selectedInvoice.description || selectedInvoice.fee_name}</TableCell>
                        <TableCell>Khoản</TableCell>
                        <TableCell align="right">1</TableCell>
                        <TableCell align="right">{selectedInvoice.total_amount?.toLocaleString('vi-VN')}</TableCell>
                        <TableCell align="right">{selectedInvoice.total_amount?.toLocaleString('vi-VN')}</TableCell>
                      </TableRow>
                    )}
                    {/* Dòng Tổng cộng */}
                    <TableRow sx={{ '& td': { fontWeight: 'bold', borderTop: '2px solid #ccc' } }}>
                      <TableCell colSpan={5} align="right">Tổng cộng:</TableCell>
                      <TableCell align="right">{selectedInvoice.total_amount?.toLocaleString('vi-VN')} đ</TableCell>
                    </TableRow>
                    {/* Dòng Đã thanh toán */}
                    {selectedInvoice.amount_paid > 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="right">Đã thanh toán:</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          {selectedInvoice.amount_paid?.toLocaleString('vi-VN')} đ
                        </TableCell>
                      </TableRow>
                    )}
                    {/* Dòng Còn lại */}
                    {selectedInvoice.amount_remaining > 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>Còn phải thanh toán:</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                          {selectedInvoice.amount_remaining?.toLocaleString('vi-VN')} đ
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="body2" sx={{ mb: 2 }}>
                Bằng chữ: <strong>{numberToWords(selectedInvoice.total_amount || 0)}</strong>
              </Typography>

              {/* Trạng thái */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <Typography fontWeight="bold">Trạng thái:</Typography>
                <Chip
                  label={selectedInvoice.status}
                  color={
                    selectedInvoice.status === 'Đã thanh toán' ? 'success' :
                      selectedInvoice.status === 'Quá hạn' ? 'error' :
                        selectedInvoice.status === 'Thanh toán một phần' ? 'info' : 'warning'
                  }
                />
              </Box>

              {selectedInvoice.payment_date && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Ngày thanh toán: {format(parseISO(selectedInvoice.payment_date), 'dd/MM/yyyy')}
                </Typography>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions className="no-print">
          <Button onClick={handleCloseViewModal}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}