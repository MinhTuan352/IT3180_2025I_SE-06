// src/pages/Accountant/FeeManagement/AccountantFeeList.tsx
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
import { useState, useRef, type ChangeEvent, useEffect } from 'react';
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
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';

import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useLayout } from '../../../contexts/LayoutContext';
import feeApi, { type Fee } from '../../../api/feeApi';
import toast, { Toaster } from 'react-hot-toast';

type FeeStatus = 'Chưa thanh toán' | 'Đã thanh toán' | 'Quá hạn' | 'Đã hủy' | 'Thanh toán một phần';

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const PAGE_PADDING = 48;

export default function AccountantFeeList() {
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const { isSidebarCollapsed } = useLayout();

  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(false);
  const [remindLoading, setRemindLoading] = useState(false);

  const dynamicPaperWidth = windowWidth
    - (isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN)
    - PAGE_PADDING;

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res: any = await feeApi.getAll();
      // Response structure from controller: { success: true, count: n, data: [] }
      const dataList = res.data || res; // handle potential direct data or nested
      if (Array.isArray(dataList)) {
        setFees(dataList);
      } else if (dataList.data && Array.isArray(dataList.data)) {
        setFees(dataList.data);
      }
    } catch (error) {
      console.error("Failed to fetch fees", error);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef<Fee>[] = [
    { field: 'id', headerName: 'Mã HĐ', width: 120 },
    {
      field: 'apartment_code',
      headerName: 'Căn hộ',
      width: 100,
      // Backend joins 'apartment_code', checking if it exists in 'fee' object
      valueGetter: (_value, row) => row.apartment_code || row.apartment_id
    },
    { field: 'resident_name', headerName: 'Người TT', width: 150 },
    { field: 'fee_name', headerName: 'Loại phí', width: 120 },
    { field: 'description', headerName: 'Nội dung', width: 200 },
    { field: 'billing_period', headerName: 'Kỳ TT', width: 90 },
    {
      field: 'due_date',
      headerName: 'Hạn TT',
      width: 100,
      type: 'date',
      valueGetter: (value) => value ? new Date(value) : null,
      valueFormatter: (value: Date) => value ? value.toLocaleDateString('vi-VN') : '',
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
        let color: "success" | "warning" | "error" | "default" | "primary" = "default";
        if (status === 'Đã thanh toán') color = 'success';
        if (status === 'Chưa thanh toán') color = 'warning';
        if (status === 'Quá hạn') color = 'error';
        if (status === 'Thanh toán một phần') color = 'primary';

        return <Chip label={status} color={color} size="small" />;
      }
    },
    {
      field: 'payment_date',
      headerName: 'Ngày TT',
      width: 110,
      type: 'date',
      valueGetter: (value) => (value ? new Date(value) : null),
      valueFormatter: (value: Date) => value ? value.toLocaleDateString('vi-VN') : '',
    },
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

          {params.row.status !== 'Đã thanh toán' && (
            <Tooltip title="Xác nhận thanh toán">
              {/* Reuse Invoice Edit page or make a quick action? 
                       The plan said integrate pay in Invoice page but user might expect here.
                       Redirecting to invoice detail (which has pay button) or invoice Edit is fine.
                       Code used "/invoice/edit/:id" for payment icon.
                       Wait, payment is usually "processing".
                       Let's link to the Invoice Detail page which we will update to have "Action" buttons 
                       including Payment. Or keep 'edit' route if that page is for payment.
                       Actually `AccountantFeeInvoice` (Detail) has "Cập nhật".
                       Let's replicate existing behavior: navigate to Edit page for specific payment/update?
                       Or simply navigate to Invoice Detail where everything is centrally managed.
                       Let's map PaymentIcon to Invoice Detail for now, as that's where I'm adding `pay`.
                       OR, keep the existing `invoice/edit` link IF that page exists/works (it does, likely).
                       But my plan was: "AccountantFeeInvoice.tsx ... Integrate feeApi.pay". 
                       So I should link to `invoice/:id` or strictly follow current UX. 
                       Let's link to `invoice/:id` (detail) because that's what I'm modifying. 
                    */}
              <IconButton
                size="small"
                onClick={() => navigate(`/accountance/fee/list/invoice/${params.row.id}`)}
              >
                <PaymentIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Gửi nhắc nhở">
            <IconButton
              size="small"
              onClick={() => handleSendReminder(params.row.id)}
              disabled={params.row.status === 'Đã thanh toán' || remindLoading}
            >
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // Gửi nhắc nợ cho 1 hóa đơn
  const handleSendReminder = async (id: string) => {
    try {
      setRemindLoading(true);
      const res: any = await feeApi.sendReminder(id);
      toast.success(res.data?.message || 'Đã gửi nhắc nợ thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi gửi nhắc nợ');
    } finally {
      setRemindLoading(false);
    }
  };

  // Gửi nhắc nợ hàng loạt
  const handleBatchReminder = async () => {
    if (!window.confirm('Bạn có chắc muốn gửi nhắc nợ cho TẤT CẢ hóa đơn chưa thanh toán?')) return;

    try {
      setRemindLoading(true);
      const res: any = await feeApi.sendBatchReminder({ filter: 'all_unpaid' });
      const data = res.data?.data || res.data;
      toast.success(`Đã gửi nhắc nợ cho ${data?.sent || 0} cư dân (${data?.total_invoices || 0} hóa đơn)`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi gửi nhắc nợ hàng loạt');
    } finally {
      setRemindLoading(false);
    }
  };

  const [openAddModal, setOpenAddModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newFee, setNewFee] = useState({
    apartment_code: '',
    fee_type_id: 1,
    description: '',
    billing_period: `${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
    due_date: new Date().toISOString().split('T')[0],
    total_amount: 0,
  });

  const handleOpenAddModal = () => {
    setOpenAddModal(true);
  };

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
  };

  const handleSaveNewFee = async () => {
    try {
      await feeApi.create({
        ...newFee,
        // Ensure backend can handle apartment_code resolution
        amount: newFee.total_amount
      });
      alert('Tạo hóa đơn thành công');
      setOpenAddModal(false);
      fetchFees();
    } catch (error) {
      console.error(error);
      alert('Lỗi tạo hóa đơn');
    }
  };

  const handleExport = () => {
    const dataToExport = fees.map(fee => ({
      'Mã HĐ': fee.id,
      'Căn hộ': fee.apartment_code || fee.apartment_id,
      'Người TT': fee.resident_name,
      'Loại phí': fee.fee_name,
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // ... same logic as before, just client side parse
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        console.log('Dữ liệu Công nợ Import từ Excel:', json);
        alert('Đã đọc file Excel thành công! (Chưa lưu DB)');
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
      <Toaster position="top-right" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".xlsx, .xls"
      />

      <Grid container spacing={2}>
        <Grid sx={{
          xs: 12,
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
              sx={{ mr: 1, backgroundColor: 'white', color: '#333', borderColor: '#ccc' }}
              onClick={handleImportClick}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              sx={{ mr: 1, backgroundColor: 'white', color: '#333', borderColor: '#ccc' }}
              onClick={handleExport}
            >
              Export
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={<PlaylistAddIcon />}
              onClick={() => navigate('/accountance/fee/batch-create')}
              sx={{ ml: 1 }}
            >
              Quét công nợ
            </Button>

            <Button
              variant="contained"
              color="warning"
              startIcon={<NotificationsIcon />}
              onClick={handleBatchReminder}
              disabled={remindLoading}
              sx={{ ml: 1 }}
            >
              {remindLoading ? 'Đang gửi...' : 'Nhắc nợ hàng loạt'}
            </Button>

            <Button variant="contained" onClick={handleOpenAddModal} sx={{ ml: 1 }}>
              Thêm lẻ
            </Button>
          </Box>
        </Grid>

        <Grid sx={{
          xs: 12,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Paper sx={{
            height: '100%',
            width: dynamicPaperWidth >= 0 ? dynamicPaperWidth : '100%',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // changed to hidden for datagrid internal scroll
          }}>
            <DataGrid
              rows={fees}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              checkboxSelection
              disableRowSelectionOnClick
              sx={{
                height: '100%',
                width: '100%', // ensure full width
                borderRadius: 3,
                border: 0,
                '& .MuiDataGrid-cell:focus': { outline: 'none' },
                '&.MuiDataGrid-root': { p: 2 },
                minWidth: '900px',
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Modal Add Fee */}
      <Dialog
        open={openAddModal}
        onClose={handleCloseAddModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Thêm Hóa đơn Mới</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Mã căn hộ"
                  value={newFee.apartment_code}
                  onChange={(e) => setNewFee({ ...newFee, apartment_code: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Kỳ thanh toán (MM/YYYY)"
                  value={newFee.billing_period}
                  onChange={(e) => setNewFee({ ...newFee, billing_period: e.target.value })}
                />
              </Grid>

              <Grid size={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="fee-type-label">Loại phí</InputLabel>
                  <Select
                    labelId="fee-type-label"
                    value={String(newFee.fee_type_id)}
                    label="Loại phí"
                    onChange={(e) => setNewFee({ ...newFee, fee_type_id: Number(e.target.value) })}
                  >
                    {/* Try to populate if types available, else hardcode common or simple input */}
                    <MenuItem value={1}>Phí quản lý</MenuItem>
                    <MenuItem value={2}>Phí gửi xe</MenuItem>
                    <MenuItem value={3}>Phí điện</MenuItem>
                    <MenuItem value={4}>Phí nước</MenuItem>
                    <MenuItem value={5}>Khác</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={12}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Số tiền (VNĐ)"
                  type="number"
                  value={newFee.total_amount}
                  onChange={(e) => setNewFee({ ...newFee, total_amount: Number(e.target.value) })}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Mô tả / Nội dung"
                  multiline
                  rows={2}
                  value={newFee.description}
                  onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Hạn thanh toán"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={newFee.due_date}
                  onChange={(e) => setNewFee({ ...newFee, due_date: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal}>Hủy</Button>
          <Button onClick={handleSaveNewFee} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}