// src/pages/Accountant/FeeManagement/AccountantMeasureImport.tsx
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Step,
  Stepper,
  StepLabel,
  Divider
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useState, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import toast, { Toaster } from 'react-hot-toast';

// --- MOCK CONFIG (Lấy từ FeeSetup) ---
const UNIT_PRICE_WATER = 15000; // 15k/m3

// --- CÁC BƯỚC ---
const steps = ['Tải File Mẫu', 'Upload & Review', 'Lưu Dữ Liệu'];

export default function AccountantMeasureImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');

  // 1. Tải file mẫu
  const handleDownloadTemplate = () => {
    // Tạo dữ liệu mẫu giả lập
    const templateData = [
      { MaCanHo: 'A-101', ChuHo: 'Trần Văn Hộ', ChiSoCu: 120, ChiSoMoi: '' },
      { MaCanHo: 'A-102', ChuHo: 'Nguyễn Thị B', ChiSoCu: 345, ChiSoMoi: '' },
      { MaCanHo: 'B-205', ChuHo: 'Lê Văn C', ChiSoCu: 88, ChiSoMoi: '' },
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'NhapChiSoNuoc');
    XLSX.writeFile(wb, 'Mau_Nhap_Chi_So_Nuoc_T12_2025.xlsx');
    
    toast.success('Đã tải file mẫu thành công!');
    setActiveStep(1); // Chuyển sang bước 2
  };

  // 2. Xử lý Upload & Đọc file
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        // --- LOGIC XỬ LÝ NGHIỆP VỤ ---
        const processedData = jsonData.map((row, index) => {
          const oldIndex = Number(row['ChiSoCu'] || 0);
          const newIndex = Number(row['ChiSoMoi'] || 0);
          
          // Validate cơ bản
          let status = 'Hợp lệ';
          if (!row['ChiSoMoi']) status = 'Thiếu chỉ số mới';
          else if (newIndex < oldIndex) status = 'Lỗi: Chỉ số mới < cũ';

          const usage = newIndex >= oldIndex ? newIndex - oldIndex : 0;
          const amount = usage * UNIT_PRICE_WATER;

          return {
            id: index,
            apartmentId: row['MaCanHo'],
            residentName: row['ChuHo'],
            oldIndex,
            newIndex,
            usage,
            amount,
            status,
          };
        });

        setImportedData(processedData);
        setActiveStep(2); // Chuyển sang bước sẵn sàng lưu
        toast.success(`Đã đọc ${processedData.length} dòng dữ liệu.`);

      } catch (error) {
        console.error(error);
        toast.error('Lỗi đọc file. Vui lòng kiểm tra định dạng.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 3. Lưu vào hệ thống
  const handleSaveData = () => {
    // Kiểm tra dữ liệu lỗi
    const hasError = importedData.some(item => item.status !== 'Hợp lệ');
    if (hasError) {
      toast.error('Có dòng dữ liệu lỗi. Vui lòng kiểm tra lại file Excel!');
      return;
    }

    setIsProcessing(true);
    // Giả lập gọi API lưu
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Đã cập nhật chỉ số và tính phí thành công!');
      navigate('/accountance/fee/list'); // Quay về danh sách
    }, 2000);
  };

  // Cấu hình cột cho bảng Review
  const columns: GridColDef[] = [
    { field: 'apartmentId', headerName: 'Căn hộ', width: 100 },
    { field: 'residentName', headerName: 'Chủ hộ', width: 180 },
    { field: 'oldIndex', headerName: 'Chỉ số Cũ', width: 120, type: 'number' },
    { 
      field: 'newIndex', 
      headerName: 'Chỉ số Mới', 
      width: 120, 
      type: 'number',
      editable: true, // Cho phép sửa trực tiếp nếu sai sót nhỏ
      cellClassName: (params) => params.row.newIndex < params.row.oldIndex ? 'text-red-600 font-bold' : '',
    },
    { field: 'usage', headerName: 'Tiêu thụ (m3)', width: 120, type: 'number' },
    { 
      field: 'amount', 
      headerName: 'Thành tiền (Dự kiến)', 
      width: 150, 
      valueFormatter: (value: number) => value.toLocaleString('vi-VN') + ' đ' 
    },
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      width: 180,
      renderCell: (params) => (
        <Typography 
          color={params.value === 'Hợp lệ' ? 'success.main' : 'error.main'} 
          variant="body2" 
          fontWeight="bold"
        >
          {params.value}
        </Typography>
      )
    },
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 3, minHeight: '85vh' }}>
      <Toaster position="top-right" />
      
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/accountance/fee/list')} sx={{ mr: 2 }}>
          Quay lại
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Import Chỉ Số Nước (Kỳ T12/2025)
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4, maxWidth: 700, mx: 'auto' }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={3}>
        {/* CỘT TRÁI: KHU VỰC THAO TÁC */}
        <Grid sx={{xs: 12, md: 4}}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6">Thao tác</Typography>
              
              {/* Bước 1: Download */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Bước 1: Tải file mẫu</Typography>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<DownloadIcon />} 
                  onClick={handleDownloadTemplate}
                >
                  Tải Excel Mẫu (.xlsx)
                </Button>
                <Typography variant="caption" color="text.secondary">
                  File chứa danh sách căn hộ và chỉ số cũ chốt đến tháng trước.
                </Typography>
              </Box>

              <Divider />

              {/* Bước 2: Upload */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Bước 2: Upload dữ liệu</Typography>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <Button 
                  fullWidth 
                  variant="contained" 
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Chọn File Excel
                </Button>
                {fileName && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'green' }}>
                    Đã chọn: {fileName}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Hướng dẫn */}
          <Alert severity="info" sx={{ mt: 2 }}>
            Lưu ý: <br/>
            - Hệ thống sẽ tự động tính: <b>(Mới - Cũ) * 15.000đ</b>.<br/>
            - Các dòng lỗi (Chỉ số mới nhỏ hơn cũ) sẽ được bôi đỏ.
          </Alert>
        </Grid>

        {/* CỘT PHẢI: BẢNG REVIEW DATA */}
        <Grid sx={{xs: 12, md: 8}}>
          <Paper sx={{ height: 500, width: '100%', position: 'relative' }}>
            {isProcessing && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} />}
            
            {importedData.length > 0 ? (
              <>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f5f5f5' }}>
                  <Typography variant="subtitle1">
                    Dữ liệu đọc được: <b>{importedData.length}</b> dòng
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveData}
                    disabled={isProcessing}
                  >
                    Xác nhận & Lưu
                  </Button>
                </Box>
                <DataGrid
                  rows={importedData}
                  columns={columns}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  pageSizeOptions={[10, 50, 100]}
                  disableRowSelectionOnClick
                />
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                <Typography>Vui lòng tải file mẫu và upload dữ liệu để xem trước.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}