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
import PublishIcon from '@mui/icons-material/Publish';
import toast, { Toaster } from 'react-hot-toast';

// --- MOCK DATA (Giả lập Database Backend) ---
// 1. Danh sách căn hộ (Cần có diện tích và số xe)
const mockResidentsData = [
  { id: 'R001', name: 'Trần Văn Hộ', apartment: 'A-101', area: 80, cars: 1, motorbikes: 2 },
  { id: 'R002', name: 'Nguyễn Thị B', apartment: 'A-102', area: 100, cars: 2, motorbikes: 0 },
  { id: 'R003', name: 'Lê Văn C', apartment: 'B-205', area: 75, cars: 0, motorbikes: 2 },
  { id: 'R004', name: 'Phạm D', apartment: 'C-1503', area: 90, cars: 1, motorbikes: 1 },
  { id: 'R005', name: 'Hoàng E', apartment: 'D-404', area: 120, cars: 2, motorbikes: 2 },
  // ... Giả sử có 500 căn hộ
];

// 2. Cấu hình giá (Lấy từ FeeSetup)
const feeConfig = {
  PQL: 15000,       // 15k/m2
  OTO: 1200000,     // 1.2tr/xe
  XEMAY: 100000,    // 100k/xe
};

const steps = ['Chọn Kỳ Thu Phí', 'Xem Trước (Review)', 'Hoàn Tất'];

export default function AccountantFeeBatchCreate() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedInvoices, setGeneratedInvoices] = useState<any[]>([]);

  // --- LOGIC XỬ LÝ (Mô phỏng Backend Process) ---
  const handleGenerateDraft = () => {
    setIsProcessing(true);
    
    // Giả lập độ trễ mạng/xử lý
    setTimeout(() => {
      const drafts = mockResidentsData.map((res, index) => {
        // 1. Tính Phí Quản lý
        const feePQL = res.area * feeConfig.PQL;
        
        // 2. Tính Phí Gửi xe
        const feeVehicle = (res.cars * feeConfig.OTO) + (res.motorbikes * feeConfig.XEMAY);
        
        // 3. Tổng cộng
        const total = feePQL + feeVehicle;

        return {
          id: index + 1, // ID tạm
          apartment: res.apartment,
          resident: res.name,
          details: `PQL (${res.area}m²) + Xe (${res.cars} ô tô, ${res.motorbikes} xe máy)`,
          amount: total,
          status: 'Nháp (Draft)',
        };
      });

      setGeneratedInvoices(drafts);
      setIsProcessing(false);
      setActiveStep(1); // Chuyển sang bước Review
      toast.success(`Đã sinh ra ${drafts.length} hóa đơn nháp!`);
    }, 1500);
  };

  const handlePublish = () => {
    setIsProcessing(true);
    // Gọi API thực tế để lưu vào DB với status="Chưa thanh toán"
    setTimeout(() => {
      setIsProcessing(false);
      setActiveStep(2); // Chuyển sang bước Hoàn tất
      toast.success('Đã phát hành công nợ thành công!');
    }, 1000);
  };

  // --- Cột cho bảng Review ---
  const columns: GridColDef[] = [
    { field: 'apartment', headerName: 'Căn hộ', width: 100 },
    { field: 'resident', headerName: 'Chủ hộ', width: 180 },
    { field: 'details', headerName: 'Diễn giải phí', flex: 1 },
    { 
      field: 'amount', 
      headerName: 'Tổng tiền', 
      width: 150,
      valueFormatter: (value: number) => value.toLocaleString('vi-VN') + ' đ',
    },
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      width: 120,
      renderCell: () => <Typography color="text.secondary" variant="caption" sx={{fontStyle:'italic'}}>Draft</Typography>
    },
  ];

  // Tính tổng dự kiến
  const totalExpectedRevenue = generatedInvoices.reduce((sum, item) => sum + item.amount, 0);

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
              Hệ thống sẽ tự động lấy dữ liệu căn hộ và bảng giá hiện tại để tính toán công nợ.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid sx={{xs: 12}}>
                <TextField
                  label="Tháng / Năm"
                  type="month"
                  fullWidth
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid sx={{xs: 12}}>
                <Alert severity="info">
                  Quy trình: 500+ căn hộ sẽ được quét. Các loại phí cố định (PQL, Gửi xe) sẽ được tự động tính toán.
                </Alert>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, textAlign: 'right' }}>
              <Button 
                variant="contained" 
                size="large"
                startIcon={isProcessing ? <CircularProgress size={20} color="inherit"/> : <PlayCircleOutlineIcon />}
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
            <Grid sx={{xs: 12, md: 4}}>
              <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                <CardContent>
                  <Typography variant="subtitle2">Tổng số hóa đơn</Typography>
                  <Typography variant="h4" fontWeight="bold">{generatedInvoices.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{xs: 12, md: 8}}>
              <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                <CardContent>
                  <Typography variant="subtitle2">Tổng doanh thu dự kiến (Kỳ {billingMonth})</Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {totalExpectedRevenue.toLocaleString('vi-VN')} VNĐ
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mb: 2 }}>Danh sách chi tiết (Xem trước)</Typography>
          <Box sx={{ height: 400, width: '100%', mb: 3 }}>
            <DataGrid
              rows={generatedInvoices}
              columns={columns}
              initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
              pageSizeOptions={[5, 10, 50]}
              checkboxSelection
              disableRowSelectionOnClick
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => setActiveStep(0)}>
              Quay lại / Chỉnh sửa
            </Button>
            <Button 
              variant="contained" 
              color="success"
              size="large"
              startIcon={<PublishIcon />}
              onClick={handlePublish}
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang phát hành...' : 'Xác nhận & Phát hành'}
            </Button>
          </Box>
        </Box>
      )}

      {/* BƯỚC 3: HOÀN TẤT */}
      {activeStep === 2 && (
        <Box sx={{ textAlign: 'center', mt: 5 }}>
          <PlayCircleOutlineIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Thành Công!
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Hệ thống đã tạo và gửi thông báo công nợ tháng {billingMonth} đến {generatedInvoices.length} căn hộ.
          </Typography>
          
          <Button variant="contained" onClick={() => navigate('/accountance/fee/list')}>
            Quay về Danh sách Hóa đơn
          </Button>
        </Box>
      )}

    </Paper>
  );
}