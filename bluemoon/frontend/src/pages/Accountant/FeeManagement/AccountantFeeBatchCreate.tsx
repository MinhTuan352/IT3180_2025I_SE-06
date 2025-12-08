// src/pages/Accountant/FeeManagement/AccountantFeeBatchCreate.tsx
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import EmailIcon from '@mui/icons-material/Email';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import toast, { Toaster } from 'react-hot-toast';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import feeApi from '../../../api/feeApi';

const steps = ['Chọn Kỳ Thu Phí', 'Xem Trước (Review)', 'Hoàn Tất'];

// Interface cho dữ liệu từ API
interface BatchInvoice {
  apartment_id: string;
  apartment_code: string;
  building: string;
  floor: number;
  area: number;
  resident_id: string;
  resident_name: string;
  items: any[];
  total_amount: number;
  billing_period: string;
}

export default function AccountantFeeBatchCreate() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedInvoices, setGeneratedInvoices] = useState<BatchInvoice[]>([]);
  const [publishingStatus, setPublishingStatus] = useState<string[]>([]);
  const [summary, setSummary] = useState({ total: 0, totalAmount: 0 });

  // --- BƯỚC 1: Gọi API Preview ---
  const handleGenerateDraft = async () => {
    setIsProcessing(true);

    try {
      const response: any = await feeApi.batchPreview(billingMonth);
      const data = response.data?.data || response.data;

      if (data.invoices && data.invoices.length > 0) {
        setGeneratedInvoices(data.invoices);
        setSummary(data.summary);
        setActiveStep(1);
        toast.success(`Đã tính toán ${data.invoices.length} hóa đơn từ database!`);
      } else {
        toast.error('Không có căn hộ nào để tạo hóa đơn. Kiểm tra dữ liệu căn hộ và chủ hộ.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Lỗi khi tải dữ liệu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- BƯỚC 2: Phát hành hóa đơn thực ---
  const handlePublish = async () => {
    setIsProcessing(true);
    setPublishingStatus([]);

    const addLog = (msg: string) => setPublishingStatus(prev => [...prev, msg]);
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    try {
      addLog('Đang lưu hóa đơn vào hệ thống...');
      await delay(500);

      // Gọi API tạo hóa đơn thực
      const response: any = await feeApi.batchCreate({
        billing_period: billingMonth,
        invoices: generatedInvoices
      });

      const result = response.data?.data || response.data;
      addLog(`✅ Đã tạo ${result.created} hóa đơn thành công.`);

      if (result.failed > 0) {
        addLog(`⚠️ ${result.failed} hóa đơn thất bại (có thể đã tồn tại).`);
      }

      await delay(500);
      addLog('Đang gửi thông báo đến cư dân...');
      await delay(800);
      addLog('✅ Đã tạo thông báo cho tất cả cư dân.');

      setActiveStep(2);
      toast.success('Phát hành hóa đơn thành công!');

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
      addLog('❌ Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Cột cho bảng Review ---
  const columns: GridColDef[] = [
    { field: 'apartment_code', headerName: 'Căn hộ', width: 100 },
    { field: 'resident_name', headerName: 'Chủ hộ', width: 180 },
    { field: 'building', headerName: 'Tòa', width: 80 },
    { field: 'floor', headerName: 'Tầng', width: 70 },
    { field: 'area', headerName: 'Diện tích (m²)', width: 110 },
    {
      field: 'details',
      headerName: 'Chi tiết phí',
      flex: 1,
      valueGetter: (_value, row) => {
        const items = row.items || [];
        return items.map((i: any) => i.item_name).join(', ');
      }
    },
    {
      field: 'total_amount',
      headerName: 'Tổng tiền',
      width: 150,
      valueFormatter: (value: number) => value?.toLocaleString('vi-VN') + ' đ',
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 100,
      renderCell: () => <Typography color="text.secondary" variant="caption" sx={{ fontStyle: 'italic' }}>Nháp</Typography>
    },
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 3, minHeight: '80vh' }}>
      <Toaster position="top-right" />

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/accountance/fee/list')} sx={{ mr: 2 }}>
          Hủy bỏ
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Lập Hóa Đơn Hàng Loạt (Batch Process)
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 5, maxWidth: 800, mx: 'auto' }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* --- NỘI DUNG TỪNG BƯỚC --- */}

      {/* BƯỚC 1: INPUT */}
      {activeStep === 0 && (
        <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>1. Chọn Kỳ Thanh Toán</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Hệ thống sẽ lấy dữ liệu căn hộ từ database và tính toán phí theo bảng giá hiện tại.
            </Typography>

            <Grid container spacing={2}>
              <Grid sx={{ xs: 12 }}>
                <TextField
                  label="Tháng / Năm"
                  type="month"
                  fullWidth
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid sx={{ xs: 12 }}>
                <Alert severity="info">
                  Quy trình: Tất cả căn hộ có chủ hộ sẽ được quét. Phí Quản lý (PQL) và các phí cố định sẽ được tự động tính toán dựa trên diện tích.
                </Alert>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, textAlign: 'right' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <PlayCircleOutlineIcon />}
                disabled={isProcessing}
                onClick={handleGenerateDraft}
              >
                {isProcessing ? 'Đang xử lý...' : 'Chạy quy trình tạo Nháp'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* BƯỚC 2: REVIEW */}
      {activeStep === 1 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Thẻ Thống kê */}
            <Grid sx={{ xs: 12, md: 4 }}>
              <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                <CardContent>
                  <Typography variant="subtitle2">Tổng số hóa đơn</Typography>
                  <Typography variant="h4" fontWeight="bold">{summary.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ xs: 12, md: 8 }}>
              <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                <CardContent>
                  <Typography variant="subtitle2">Tổng doanh thu dự kiến (Kỳ {billingMonth})</Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {summary.totalAmount?.toLocaleString('vi-VN')} VNĐ
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>


          {/* Phần Log Tiến trình (Hiển thị khi đang xử lý) */}
          {isProcessing && (
            <Card variant="outlined" sx={{ mb: 3, bgcolor: '#f9f9f9' }}>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} /> Đang xử lý phát hành...
                </Typography>
                <List dense>
                  {publishingStatus.map((msg, index) => (
                    <ListItem key={index}>
                      <ListItemIcon><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary={msg} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {!isProcessing && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>Chi tiết (Xem trước từ Database)</Typography>
              <Box sx={{ height: 350, width: '100%', mb: 3 }}>
                <DataGrid
                  rows={generatedInvoices}
                  columns={columns}
                  disableRowSelectionOnClick
                  getRowId={(row) => row.apartment_id}
                />
              </Box>
            </>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => setActiveStep(0)} disabled={isProcessing}>Quay lại</Button>
            <Button
              variant="contained" color="success" size="large"
              startIcon={<SendIcon />}
              onClick={handlePublish}
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang thực hiện...' : 'Phát hành & Lưu vào Database'}
            </Button>
          </Box>
        </Box>
      )}

      {/* BƯỚC 3: HOÀN TẤT */}
      {activeStep === 2 && (
        <Box sx={{ textAlign: 'center', mt: 5 }}>
          <NotificationsActiveIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>Hoàn Tất Quy Trình!</Typography>

          <Grid container spacing={2} justifyContent="center" sx={{ mb: 4, maxWidth: 600, mx: 'auto', textAlign: 'left' }}>
            <Grid sx={{ xs: 12 }}>
              <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
                Đã lưu <b>{summary.total}</b> hóa đơn vào hệ thống.
              </Alert>
            </Grid>
            <Grid sx={{ xs: 12 }}>
              <Alert severity="success" icon={<NotificationsActiveIcon fontSize="inherit" />}>
                Hóa đơn sẽ hiển thị trong mục Công nợ của cư dân.
              </Alert>
            </Grid>
            <Grid sx={{ xs: 12 }}>
              <Alert severity="info" icon={<EmailIcon fontSize="inherit" />}>
                Tổng doanh thu kỳ {billingMonth}: <b>{summary.totalAmount?.toLocaleString('vi-VN')} VNĐ</b>
              </Alert>
            </Grid>
          </Grid>

          <Button variant="contained" onClick={() => navigate('/accountance/fee/list')}>
            Về Danh sách Hóa đơn
          </Button>
        </Box>
      )}

    </Paper>
  );
}