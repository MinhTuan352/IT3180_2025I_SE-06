// src/pages/Accountant/FeeManagement/AccountantFeeInvoice.tsx
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import PrintIcon from '@mui/icons-material/Print';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';

import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import feeApi, { type Fee } from '../../../api/feeApi';

export default function AccountantFeeInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Fee | null>(null);
  const [loading, setLoading] = useState(false);
  //const [openSend, setOpenSend] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  // Payment state
  const [openPay, setOpenPay] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
  const [paying, setPaying] = useState(false);

  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchDetail(id);
    }
  }, [id]);

  const fetchDetail = async (feeId: string) => {
    try {
      setLoading(true);
      const res: any = await feeApi.getDetail(feeId);
      // Safety check
      const resData = (res as any).data || res;
      // Handle response structure: { success: true, data: Fee } OR direct Fee
      const finalData = resData.data ? resData.data : resData;

      if (finalData) {
        setInvoice(finalData);
        // Default pay amount to remaining if not set
        setPayAmount(finalData.amount_remaining || 0);
      }
    } catch (err) {
      console.error(err);
      alert("Không tải được hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `HoaDon_${invoice?.id || 'moi'}`,
  });

  const handleSavePdf = async () => {
    if (!invoiceRef.current) return;
    setIsSavingPdf(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const margin = 10;
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      pdf.save(`HoaDon_${invoice?.id || 'moi'}.pdf`);
    } catch (error) {
      console.error("Lỗi PDF:", error);
    } finally {
      setIsSavingPdf(false);
    }
  };

  const handleConfirmPay = async () => {
    if (!invoice || !id) return;
    try {
      setPaying(true);
      await feeApi.pay(id, {
        amount_paid: Number(payAmount),
        payment_method: paymentMethod
      });
      alert("Thanh toán thành công!");
      setOpenPay(false);
      fetchDetail(id); // Reload
    } catch (err) {
      console.error(err);
      alert("Lỗi khi thanh toán");
    } finally {
      setPaying(false);
    }
  };

  const numberToWords = (num: number) => {
    // Basic placeholder for "Read number". Real impl needs library like `n2vi`
    return `${num.toLocaleString('vi-VN')} đồng`;
  }

  if (loading) return <Typography>Đang tải...</Typography>;
  if (!invoice) return <Typography>Không tìm thấy hóa đơn.</Typography>;

  return (
    <>
      <Paper
        ref={invoiceRef}
        elevation={5}
        sx={{
          width: '210mm',
          minHeight: '297mm',
          margin: '2rem auto',
          padding: '15mm',
          position: 'relative',
          fontSize: '11pt',
          fontFamily: '"Times New Roman", Times, serif',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Grid>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>BLUEMOON</Typography>
              <Typography variant="body2">Đơn vị bán hàng: Ban Quản Lý Chung Cư Bluemoon</Typography>
              <Typography variant="body2">Địa chỉ: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM</Typography>
            </Grid>
            <Grid sx={{ textAlign: 'right' }}>
              <Typography variant="body2">Mẫu số: 01GTKT0/001</Typography>
              <Typography variant="body2">Ký hiệu: BM/23E</Typography>
              <Typography variant="body2">Số: {invoice.id ? String(invoice.id).slice(-7) : '...'}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>HÓA ĐƠN DỊCH VỤ</Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                Ngày {new Date(invoice.created_at || Date.now()).getDate()} tháng {new Date(invoice.created_at || Date.now()).getMonth() + 1} năm {new Date(invoice.created_at || Date.now()).getFullYear()}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography>Họ tên người mua hàng: {invoice.resident_name}</Typography>
          <Typography>Tên đơn vị: Căn hộ {invoice.apartment_code || invoice.apartment_id}</Typography>
          <Typography>Mã số cư dân: {invoice.resident_id}</Typography>
          <Typography>Hình thức thanh toán: {invoice.payment_method || '...'}</Typography>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ccc', my: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f4f6f8' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tên hàng hóa, dịch vụ</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>ĐVT</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Số lượng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Đơn giá</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Thành tiền</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{item.unit_price.toLocaleString('vi-VN')}</TableCell>
                      <TableCell align="right">{item.amount.toLocaleString('vi-VN')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  // Fallback if no items (e.g. detailed items not saved in fee table but only total)
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>{invoice.description}</TableCell>
                    <TableCell>Gói</TableCell>
                    <TableCell align="right">1</TableCell>
                    <TableCell align="right">{invoice.total_amount.toLocaleString('vi-VN')}</TableCell>
                    <TableCell align="right">{invoice.total_amount.toLocaleString('vi-VN')}</TableCell>
                  </TableRow>
                )}

                <TableRow sx={{ '& td': { border: 0 } }}>
                  <TableCell colSpan={4} />
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Cộng tiền hàng:</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">{invoice.total_amount.toLocaleString('vi-VN')} đ</TableCell>
                </TableRow>
                <TableRow sx={{ '& td': { border: 0 } }}>
                  <TableCell colSpan={4} />
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Đã thanh toán:</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">{invoice.amount_paid.toLocaleString('vi-VN')} đ</TableCell>
                </TableRow>
                <TableRow sx={{ '& td': { border: 0 } }}>
                  <TableCell colSpan={4} />
                  <TableCell sx={{ fontWeight: 'bold', color: 'red' }} align="right">Còn lại:</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'red' }} align="right">{invoice.amount_remaining.toLocaleString('vi-VN')} đ</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography>Số tiền viết bằng chữ: {numberToWords(invoice.total_amount)}</Typography>

          {/* Status Stamp */}
          {invoice.status === 'Đã thanh toán' && (
            <Box
              sx={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-30deg)',
                border: '5px solid green',
                color: 'green',
                padding: '10px 40px',
                fontSize: '30px',
                fontWeight: 'bold',
                opacity: 0.6,
                borderRadius: '10px'
              }}
            >
              ĐÃ THANH TOÁN
            </Box>
          )}

          <Grid container justifyContent="space-between" sx={{ mt: 5 }}>
            <Grid sx={{ xs: 5, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 'bold' }}>Người mua hàng</Typography>
              <Typography sx={{ fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</Typography>
              <Box sx={{ height: 80 }} />
              <Typography>{invoice.resident_name}</Typography>
            </Grid>
            <Grid sx={{ xs: 5, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 'bold' }}>Người bán hàng</Typography>
              <Typography sx={{ fontStyle: 'italic' }}>(Ký, đóng dấu, ghi rõ họ tên)</Typography>
              <Box sx={{ height: 80 }} />
              <Typography>{invoice.created_by || 'Admin'}</Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, my: 3, position: 'sticky', bottom: 16 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/accountance/fee/list')}>
          Quay lại DS
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={isSavingPdf ? <CircularProgress size={20} color="inherit" /> : <SaveAltIcon />}
          onClick={handleSavePdf}>
          {isSavingPdf ? 'Đang lưu...' : 'Lưu PDF'}
        </Button>
        <Button variant="contained" color="secondary" startIcon={<PrintIcon />} onClick={handlePrint}>In hóa đơn</Button>
        <Button variant="contained" startIcon={<SendIcon />} onClick={() => alert("Chức năng gửi thông báo đang phát triển")}>Gửi thông báo</Button>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => alert("Chức năng chỉnh sửa đang phát triển")}>Chỉnh sửa</Button>

        {invoice.amount_remaining > 0 && (
          <Button
            variant="contained"
            color="success"
            startIcon={<PaymentIcon />}
            onClick={() => setOpenPay(true)}
          >
            Xác nhận Thanh toán
          </Button>
        )}
      </Box>

      {/* Modal Payment */}
      <Dialog open={openPay} onClose={() => setOpenPay(false)}>
        <DialogTitle>Xác nhận thanh toán</DialogTitle>
        <DialogContent>
          <TextField
            label="Số tiền thanh toán"
            type="number"
            fullWidth
            sx={{ mt: 2 }}
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Phương thức</InputLabel>
            <Select
              value={paymentMethod}
              label="Phương thức"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <MenuItem value="Tiền mặt">Tiền mặt</MenuItem>
              <MenuItem value="Chuyển khoản">Chuyển khoản</MenuItem>
              <MenuItem value="Thẻ">Thẻ</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPay(false)}>Hủy</Button>
          <Button onClick={handleConfirmPay} variant="contained" color="success" disabled={paying}>
            {paying ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
}