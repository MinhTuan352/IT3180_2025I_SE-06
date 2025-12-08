// src/pages/Resident/Fee/ResidentFeePayment.tsx
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Tooltip,
  IconButton,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import toast, { Toaster } from 'react-hot-toast';
import feeApi, { type Fee } from '../../../api/feeApi';

// Thông tin thanh toán mặc định (trong thực tế nên lấy từ API payment_setup)
const defaultPaymentInfo = {
  bankName: 'Vietcombank',
  accountNumber: '1234567890123',
  accountName: 'BQL CHUNG CU BLUEMOON',
};

export default function ResidentFeePayment() {
  const { id: invoiceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Fee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetail();
    }
  }, [invoiceId]);

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await feeApi.getDetail(invoiceId!);
      const data = (response.data as any).data || response.data;
      setInvoice(data);

      // Generate transfer content
      // Format: [MaHoaDon] - [MaCanHo] - [LoaiPhi]
      const content = `${data.id} - ${data.apartment_code || 'N/A'} - ${data.fee_name || 'Phi'}`;
      setGeneratedContent(content);
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      if (err.response?.status === 403) {
        setError('Bạn không có quyền xem hóa đơn này.');
      } else if (err.response?.status === 404) {
        setError('Không tìm thấy hóa đơn.');
      } else {
        setError(err.response?.data?.message || 'Không thể tải thông tin thanh toán.');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Hàm Copy vào Clipboard ---
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Đã sao chép ${label}!`);
    }).catch(err => {
      toast.error('Không thể sao chép.');
      console.error('Lỗi sao chép:', err);
    });
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 1 }}>Đang tải thông tin thanh toán...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" onClick={() => navigate('/resident/fee/list')}>Quay lại</Button>
      </Paper>
    );
  }

  if (!invoice) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">Không thể tải thông tin thanh toán cho hóa đơn này.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/resident/fee/list')}>Quay lại</Button>
      </Paper>
    );
  }

  // Số tiền cần thanh toán (ưu tiên còn nợ, nếu không có thì lấy tổng)
  const amountToPay = invoice.amount_remaining > 0 ? invoice.amount_remaining : invoice.total_amount;

  return (
    <>
      <Toaster position="top-center" />
      <Paper sx={{ p: 3, borderRadius: 3, maxWidth: 800, margin: 'auto' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
          Thanh toán Phí Dịch vụ
        </Typography>
        <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 3 }}>
          Hóa đơn: #{invoice.id} - {invoice.fee_name || 'Phí dịch vụ'}
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          Sử dụng thông tin dưới đây để thanh toán qua ứng dụng Ngân hàng hoặc Internet Banking.
          Vui lòng kiểm tra kỹ thông tin trước khi xác nhận giao dịch.
        </Alert>

        <Grid container spacing={3} justifyContent="center" alignItems="flex-start">
          {/* Cột Thông tin Chuyển khoản */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Thông tin Chuyển khoản:</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography><strong>Ngân hàng:</strong></Typography>
                <Typography>{defaultPaymentInfo.bankName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography><strong>Số tài khoản:</strong></Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 1 }}>{defaultPaymentInfo.accountNumber}</Typography>
                  <Tooltip title="Sao chép STK">
                    <IconButton size="small" onClick={() => copyToClipboard(defaultPaymentInfo.accountNumber, 'Số tài khoản')}>
                      <ContentCopyIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography><strong>Chủ tài khoản:</strong></Typography>
                <Typography>{defaultPaymentInfo.accountName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography><strong>Số tiền:</strong></Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 1, color: 'red', fontWeight: 'bold' }}>
                    {amountToPay.toLocaleString('vi-VN')} VNĐ
                  </Typography>
                  <Tooltip title="Sao chép Số tiền">
                    <IconButton size="small" onClick={() => copyToClipboard(amountToPay.toString(), 'Số tiền')}>
                      <ContentCopyIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Divider sx={{ pt: 1 }} />

              <Typography sx={{ mt: 1 }}><strong>Nội dung chuyển khoản (BẮT BUỘC):</strong></Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                <Typography sx={{ fontFamily: 'monospace', flexGrow: 1, mr: 1 }}>
                  {generatedContent}
                </Typography>
                <Tooltip title="Sao chép Nội dung">
                  <IconButton size="small" onClick={() => copyToClipboard(generatedContent, 'Nội dung')}>
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Alert severity="warning" variant="outlined" sx={{ fontSize: '0.8rem' }}>
                Sao chép và dán đúng nội dung này vào phần "Nội dung/Diễn giải" khi chuyển khoản.
              </Alert>
            </Stack>
          </Grid>
        </Grid>

        {/* Thông tin hóa đơn */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Thông tin hóa đơn:</Typography>
          <Grid container spacing={1}>
            <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Căn hộ:</Typography></Grid>
            <Grid size={{ xs: 6 }}><Typography variant="body2">{invoice.apartment_code}</Typography></Grid>
            <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Cư dân:</Typography></Grid>
            <Grid size={{ xs: 6 }}><Typography variant="body2">{invoice.resident_name}</Typography></Grid>
            <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Loại phí:</Typography></Grid>
            <Grid size={{ xs: 6 }}><Typography variant="body2">{invoice.fee_name}</Typography></Grid>
            <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Tổng tiền:</Typography></Grid>
            <Grid size={{ xs: 6 }}><Typography variant="body2">{invoice.total_amount?.toLocaleString('vi-VN')} đ</Typography></Grid>
            {invoice.amount_paid > 0 && (
              <>
                <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Đã thanh toán:</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body2" color="success.main">{invoice.amount_paid?.toLocaleString('vi-VN')} đ</Typography></Grid>
              </>
            )}
          </Grid>
        </Box>

        {/* Nút Quay lại */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(invoiceId ? `/resident/fee/invoice_info/${invoiceId}` : '/resident/fee/list')}
          >
            Quay lại
          </Button>
        </Box>
      </Paper>
    </>
  );
}