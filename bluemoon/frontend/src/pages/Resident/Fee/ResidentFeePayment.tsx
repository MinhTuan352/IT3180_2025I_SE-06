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
  Chip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import toast, { Toaster } from 'react-hot-toast';
import axiosClient from '../../../api/axiosClient';
import feeApi, { type Fee } from '../../../api/feeApi';

// Polling interval (5 giây)
const POLL_INTERVAL = 5000;

interface QRData {
  qrUrl: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  transferContent: string;
}

export default function ResidentFeePayment() {
  const { id: invoiceId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Fee | null>(null);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Fetch invoice và QR data
  const fetchData = useCallback(async () => {
    if (!invoiceId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Lấy thông tin hóa đơn
      const invoiceRes = await feeApi.getDetail(invoiceId);
      const invoiceData = (invoiceRes.data as any).data || invoiceRes.data;
      setInvoice(invoiceData);

      // Kiểm tra nếu đã thanh toán
      if (invoiceData.status === 'Đã thanh toán') {
        setIsPaid(true);
        return;
      }

      // 2. Tạo QR code
      const qrRes = await axiosClient.get(`/payment/generate-qr/${invoiceId}`);
      if (qrRes.data?.success) {
        setQrData(qrRes.data.data);
        setIsPolling(true); // Bắt đầu polling
      }

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin thanh toán.');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  // Polling check status
  useEffect(() => {
    if (!isPolling || !invoiceId || isPaid) return;

    const pollStatus = async () => {
      try {
        const res = await axiosClient.get(`/payment/status/${invoiceId}`);
        if (res.data?.data?.isPaid) {
          setIsPaid(true);
          setIsPolling(false);
          toast.success('🎉 Thanh toán thành công!', { duration: 5000 });

          // Update invoice state
          const invoiceRes = await feeApi.getDetail(invoiceId);
          setInvoice((invoiceRes.data as any).data || invoiceRes.data);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const intervalId = setInterval(pollStatus, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isPolling, invoiceId, isPaid]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Đã sao chép ${label}!`);
    }).catch(() => {
      toast.error('Không thể sao chép.');
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
        <Alert severity="error">Không thể tải thông tin hóa đơn.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/resident/fee/list')}>Quay lại</Button>
      </Paper>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <Paper sx={{ p: 3, borderRadius: 3, maxWidth: 900, margin: 'auto' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
          Thanh toán Hóa đơn
        </Typography>
        <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 3 }}>
          Mã hóa đơn: #{invoice.id} - {invoice.fee_name || 'Phí dịch vụ'}
        </Typography>

        {/* Hiển thị khi ĐÃ THANH TOÁN */}
        {isPaid ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" color="success.main" fontWeight="bold">
              Thanh toán thành công!
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Hóa đơn đã được cập nhật. Cảm ơn bạn đã thanh toán!
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 3 }}
              onClick={() => navigate('/resident/fee/list')}
            >
              Quay về danh sách hóa đơn
            </Button>
          </Box>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              Quét mã QR bên dưới bằng ứng dụng Ngân hàng để thanh toán.
              Hệ thống sẽ tự động xác nhận khi nhận được tiền.
            </Alert>

            <Grid container spacing={3}>
              {/* Cột QR Code */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>Quét mã QR để thanh toán</Typography>

                  {qrData?.qrUrl ? (
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={qrData.qrUrl}
                        alt="QR Code thanh toán"
                        style={{
                          maxWidth: '300px',
                          height: 'auto',
                          borderRadius: '12px',
                          border: '2px solid #e0e0e0'
                        }}
                      />
                      {isPolling && (
                        <Chip
                          icon={<RefreshIcon sx={{ animation: 'spin 1s linear infinite' }} />}
                          label="Đang chờ thanh toán..."
                          color="warning"
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: -10,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' }
                            }
                          }}
                        />
                      )}
                    </Box>
                  ) : (
                    <CircularProgress />
                  )}

                  <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                    Hỗ trợ tất cả ngân hàng và ví điện tử
                  </Typography>
                </Box>
              </Grid>

              {/* Cột Thông tin chuyển khoản */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Thông tin Chuyển khoản:</Typography>
                <Divider sx={{ mb: 2 }} />

                {qrData && (
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography><strong>Ngân hàng:</strong></Typography>
                      <Typography>{qrData.bankName}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography><strong>Số tài khoản:</strong></Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ mr: 1 }}>{qrData.accountNo}</Typography>
                        <Tooltip title="Sao chép">
                          <IconButton size="small" onClick={() => copyToClipboard(qrData.accountNo, 'STK')}>
                            <ContentCopyIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography><strong>Chủ tài khoản:</strong></Typography>
                      <Typography>{qrData.accountName}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography><strong>Số tiền:</strong></Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ mr: 1, color: 'error.main', fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {qrData.amount.toLocaleString('vi-VN')} đ
                        </Typography>
                        <Tooltip title="Sao chép">
                          <IconButton size="small" onClick={() => copyToClipboard(qrData.amount.toString(), 'Số tiền')}>
                            <ContentCopyIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography><strong>Nội dung chuyển khoản:</strong></Typography>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'warning.light',
                      p: 1.5,
                      borderRadius: 1
                    }}>
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {qrData.transferContent}
                      </Typography>
                      <Tooltip title="Sao chép">
                        <IconButton size="small" onClick={() => copyToClipboard(qrData.transferContent, 'Nội dung')}>
                          <ContentCopyIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Alert severity="warning" variant="outlined" sx={{ fontSize: '0.8rem' }}>
                      <strong>Lưu ý:</strong> Nếu quét QR, nội dung sẽ được tự động điền.
                      Nếu nhập thủ công, hãy sao chép chính xác nội dung trên.
                    </Alert>
                  </Stack>
                )}
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
              </Grid>
            </Box>
          </>
        )}

        {/* Nút Quay lại */}
        {!isPaid && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(invoiceId ? `/resident/fee/invoice_info/${invoiceId}` : '/resident/fee/list')}
            >
              Quay lại
            </Button>
          </Box>
        )}
      </Paper>
    </>
  );
}
