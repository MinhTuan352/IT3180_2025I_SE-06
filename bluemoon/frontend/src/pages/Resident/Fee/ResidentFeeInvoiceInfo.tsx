// src/pages/Resident/Fee/ResidentFeeInvoiceInfo.tsx
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import { format, parseISO } from 'date-fns';
import feeApi, { type Fee, type FeeItem } from '../../../api/feeApi';

// Hàm chuyển số thành chữ tiếng Việt (đơn giản)
const numberToWords = (num: number): string => {
  if (num === 0) return 'Không đồng';
  // Đây là hàm đơn giản, có thể thay bằng thư viện chuyên dụng
  //const units = ['', 'nghìn', 'triệu', 'tỷ'];
  //const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  let result = num.toLocaleString('vi-VN') + ' đồng';
  return result;
};

export default function ResidentFeeInvoiceInfo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Fee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchInvoiceDetail();
    }
  }, [id]);

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await feeApi.getDetail(id!);
      const data = (response.data as any).data || response.data;
      setInvoice(data);
    } catch (err: any) {
      console.error('Error fetching invoice detail:', err);
      if (err.response?.status === 403) {
        setError('Bạn không có quyền xem hóa đơn này.');
      } else if (err.response?.status === 404) {
        setError('Không tìm thấy hóa đơn.');
      } else {
        setError(err.response?.data?.message || 'Không thể tải chi tiết hóa đơn.');
      }
    } finally {
      setLoading(false);
    }
  };

  const needsPayment = invoice?.status === 'Chưa thanh toán' || invoice?.status === 'Quá hạn' || invoice?.status === 'Thanh toán một phần';

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải chi tiết phiếu báo phí...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/resident/fee/list')}>
          Quay lại Danh sách Phí
        </Button>
      </Paper>
    );
  }

  if (!invoice) return null;

  // Format ngày tháng
  const invoiceDate = invoice.created_at ? parseISO(invoice.created_at) : new Date();
  const dueDate = invoice.due_date ? parseISO(invoice.due_date) : null;

  return (
    <>
      {/* KHUNG A4 */}
      <Paper
        ref={invoiceRef}
        elevation={3}
        sx={{
          width: '210mm',
          minHeight: '270mm',
          margin: '2rem auto',
          padding: '15mm',
          position: 'relative',
          fontSize: '11pt',
          fontFamily: '"Times New Roman", Times, serif',
          '&::before': {
            content: '""', position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
            backgroundSize: 'contain', width: '70%', height: '70%',
            opacity: 0.08, zIndex: 0,
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Grid container justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Grid>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>BLUEMOON</Typography>
              <Typography variant="body2">Ban Quản Lý Chung Cư</Typography>
              <Typography variant="body2">Địa chỉ: 123 Đường ABC, P.XYZ, Q.1, TP.HCM</Typography>
            </Grid>
            <Grid sx={{ textAlign: 'right' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>PHIẾU BÁO PHÍ DỊCH VỤ</Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                Ngày {format(invoiceDate, 'dd')} tháng {format(invoiceDate, 'MM')} năm {format(invoiceDate, 'yyyy')}
              </Typography>
              <Typography variant="body2">Số: {invoice.id}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Thông tin Cư dân */}
          <Typography sx={{ fontWeight: 'bold' }}>Kính gửi Ông/Bà:</Typography>
          <Typography sx={{ ml: 2 }}>{invoice.resident_name || 'N/A'}</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>Căn hộ:</Typography>
          <Typography sx={{ ml: 2 }}>{invoice.apartment_code || 'N/A'}</Typography>
          {dueDate && (
            <>
              <Typography sx={{ fontWeight: 'bold', mt: 1 }}>Hạn thanh toán:</Typography>
              <Typography sx={{ ml: 2, color: needsPayment ? 'error.main' : 'inherit', fontWeight: needsPayment ? 'bold' : 'normal' }}>
                {format(dueDate, 'dd/MM/yyyy')}
              </Typography>
            </>
          )}

          {/* Bảng Chi tiết Phí */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 3, mb: 1 }}>Chi tiết các khoản phí:</Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ccc' }}>
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
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item: FeeItem, index: number) => (
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
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">Không có chi tiết</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {/* Dòng Tổng cộng */}
                <TableRow sx={{ '& td': { fontWeight: 'bold', borderTop: '1px solid #ccc' } }}>
                  <TableCell colSpan={5} align="right">Tổng cộng:</TableCell>
                  <TableCell align="right">{invoice.total_amount?.toLocaleString('vi-VN')} đ</TableCell>
                </TableRow>
                {/* Dòng Đã thanh toán */}
                {invoice.amount_paid > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="right">Đã thanh toán:</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>
                      {invoice.amount_paid?.toLocaleString('vi-VN')} đ
                    </TableCell>
                  </TableRow>
                )}
                {/* Dòng Còn lại */}
                {invoice.amount_remaining > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>Còn phải thanh toán:</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      {invoice.amount_remaining?.toLocaleString('vi-VN')} đ
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ mt: 2 }}>Bằng chữ: {numberToWords(invoice.total_amount || 0)}</Typography>

          {/* Trạng thái */}
          <Typography sx={{ mt: 3, fontWeight: 'bold' }}>
            Trạng thái:{' '}
            <Typography
              component="span"
              sx={{
                color: invoice.status === 'Đã thanh toán' ? 'success.main' :
                  invoice.status === 'Quá hạn' ? 'error.main' : 'warning.main',
                fontStyle: 'italic'
              }}
            >
              {invoice.status}
            </Typography>
          </Typography>

          {/* Thông tin thêm */}
          <Typography variant="body2" sx={{ mt: 4, fontStyle: 'italic', color: 'text.secondary' }}>
            Quý cư dân vui lòng thanh toán trước hạn. Mọi thắc mắc xin liên hệ Văn phòng BQL. Xin cảm ơn!
          </Typography>
        </Box>
      </Paper>

      {/* Nút chức năng */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, my: 3, position: 'sticky', bottom: 16 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/resident/fee/list')}>
          Quay lại Danh sách Phí
        </Button>
        {needsPayment && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PaymentIcon />}
            onClick={() => navigate(`/resident/fee/payment/${id}`)}
          >
            Xem Thông tin Thanh toán
          </Button>
        )}
      </Box>
    </>
  );
}