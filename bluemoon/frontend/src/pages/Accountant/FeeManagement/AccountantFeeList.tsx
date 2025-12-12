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
import feeApi, { type Fee, type FeeType } from '../../../api/feeApi';
import toast, { Toaster } from 'react-hot-toast';

import { apartmentApi } from '../../../api/apartmentApi';
import { residentApi } from '../../../api/residentApi';
//import { format, parseISO } from 'date-fns';

type FeeStatus = 'Chưa thanh toán' | 'Đã thanh toán' | 'Quá hạn' | 'Đã hủy' | 'Thanh toán một phần';



const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const PAGE_PADDING = 48;

export default function AccountantFeeList() {
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const { isSidebarCollapsed } = useLayout();

  const [fees, setFees] = useState<Fee[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [remindLoading, setRemindLoading] = useState(false);

  const dynamicPaperWidth = windowWidth
    - (isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN)
    - PAGE_PADDING;

  useEffect(() => {
    fetchFees();
    fetchFeeTypes();
  }, []);

  const fetchFeeTypes = async () => {
    try {
      const response = await feeApi.getTypes();
      const data = (response.data as any).data || [];
      setFeeTypes(data);
    } catch (err) {
      console.error('Error fetching fee types:', err);
    }
  };

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

  // --- HELPERS FOR IMPORT ---
  const parseDate = (dateStr: any): string | null => {
    if (!dateStr) return null;
    // Handle Excel date number
    if (typeof dateStr === 'number') {
      const date = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    // Handle string "dd/MM/yyyy" or "yyyy-MM-dd"
    if (typeof dateStr === 'string') {
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          // Check format dd/MM/yyyy
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      // Try standards
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    }
    return null;
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Đang xử lý file...');
    setLoading(true);

    // 1. Fetch Lookups
    let apartments: any[] = [];
    let residents: any[] = [];
    const currentFeeTypes = feeTypes;

    try {
      const [aptRes, resRes] = await Promise.all([
        apartmentApi.getAll(),
        residentApi.getAll()
      ]);
      apartments = aptRes;
      residents = resRes;
    } catch (err) {
      console.error('Error fetching lookups for import:', err);
      toast.error('Lỗi tải dữ liệu căn hộ/cư dân để import.', { id: toastId });
      setLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        console.log('Raw Excel Data:', json);

        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        // 2. Process each row
        const promises = json.map(async (row, index) => {
          try {
            // Map keys
            const aptCode = row['Căn hộ'] || row['căn hộ'] || row['Căn Hộ'];
            const feeTypeName = row['Loại phí'] || row['loại phí'];
            const description = row['Nội dung'] || row['nội dung'] || `Phí nhập từ Excel`;
            const billingPeriod = row['Kỳ TT'] || row['kỳ tt'];
            const rawDueDate = row['Hạn TT'] || row['hạn tt'];
            const totalAmount = row['Tổng thu'] || row['tổng thu'];

            if (!aptCode || !totalAmount) {
              throw new Error(`Dòng ${index + 2}: Thiếu Căn hộ hoặc Tổng thu`);
            }

            // Find IDs
            const apartment = apartments.find(a => a.apartment_code === aptCode || a.apartment_code === aptCode.toString().trim());
            if (!apartment) throw new Error(`Dòng ${index + 2}: Không tìm thấy căn hộ ${aptCode}`);

            // Find Owner
            const owner = residents.find(r => r.apartment_id === apartment.id && (r.role === 'owner' || r.role === 'chủ hộ'));
            const resident = owner || residents.find(r => r.apartment_id === apartment.id);

            if (!resident) throw new Error(`Dòng ${index + 2}: Căn hộ ${aptCode} chưa có cư dân`);

            // Find Fee Type
            let feeTypeId = 1; // Default
            if (feeTypeName) {
              const safeFeeTypeName = String(feeTypeName).toLowerCase();
              const ft = currentFeeTypes.find(t => t.fee_name && String(t.fee_name).toLowerCase() === safeFeeTypeName);
              if (ft) feeTypeId = ft.id;
            }

            // Format Date
            let dueDate = parseDate(rawDueDate);
            if (!dueDate) {
              const d = new Date();
              d.setDate(d.getDate() + 15);
              dueDate = d.toISOString().split('T')[0];
            }

            // Clean Billing Period
            let cleanBillingPeriod = billingPeriod;
            if (billingPeriod && billingPeriod.toString().startsWith('T')) {
              const parts = billingPeriod.toString().substring(1).split('/');
              if (parts.length === 2) cleanBillingPeriod = `${parts[1]}-${parts[0]}`;
            }

            // Call API
            await feeApi.create({
              apartment_id: apartment.id,
              fee_type_id: feeTypeId,
              description: description,
              billing_period: cleanBillingPeriod || '2025-12',
              due_date: dueDate,
              total_amount: parseFloat(totalAmount),
              resident_id: resident.id,
              items: [{
                item_name: description || feeTypeName || 'Phí khác',
                unit: 'lần',
                quantity: 1,
                unit_price: parseFloat(totalAmount),
                amount: parseFloat(totalAmount)
              }]
            });

            successCount++;

          } catch (err: any) {
            console.error(err);
            failCount++;
            errors.push(err.message);
          }
        });

        await Promise.all(promises);

        if (failCount === 0) {
          toast.success(`Import thành công ${successCount} hóa đơn!`, { id: toastId });
        } else {
          toast.success(`Thành công: ${successCount}. Thất bại: ${failCount}`, { id: toastId });
          console.warn('Import Errors:', errors);
          alert(`Lỗi: \n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...' : ''}`);
        }

        fetchFees();

      } catch (error) {
        console.error("Lỗi khi đọc file Excel:", error);
        toast.error('Đã xảy ra lỗi khi đọc file.', { id: toastId });
      } finally {
        setLoading(false);
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
                    {feeTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.fee_name}
                      </MenuItem>
                    ))}
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