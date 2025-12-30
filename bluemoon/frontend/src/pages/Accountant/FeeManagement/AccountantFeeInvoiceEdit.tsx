// src/pages/Accountant/FeeManagement/AccountantFeeInvoiceEdit.tsx
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import feeApi from '../../../api/feeApi';
import type { Fee } from '../../../api/feeApi';
import { residentApi } from '../../../api/residentApi';

interface InvoiceItem {
  id: number;
  name: string;
  dvt: string;
  sl: number;
  don_gia: number;
  thanh_tien: number;
}

export default function AccountantFeeInvoiceEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [kyHieu, setKyHieu] = useState('');
  const [soHD, setSoHD] = useState('');

  // Fetch Data
  useEffect(() => {
    const fetchInvoiceDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await feeApi.getDetail(id);
        const data: Fee = response.data?.data || response.data;

        // Populate State
        setKyHieu('BM/23E');
        setSoHD(data.id);
        setInvoiceDate(data.created_at ? data.created_at.split('T')[0] : '');
        setInvoiceStatus(data.status);
        setPaymentMethod(data.payment_method || '');

        // Resident Info
        if (data.resident_id) {
          try {
            const res = await residentApi.getById(data.resident_id);
            // Cast to any because residentApi type says Resident but runtime might be different wrapper
            const resAny = res as any;
            setSelectedResident(resAny.data?.data || resAny.data || res);
          } catch (e) {
            console.warn('Could not fetch resident info', e);
            setSelectedResident({ full_name: data.resident_name || 'N/A', apartment_code: data.apartment_code || 'N/A' });
          }
        }

        if (data.items && data.items.length > 0) {
          setItems(data.items.map((it, idx) => ({
            id: idx,
            name: it.item_name,
            dvt: it.unit,
            sl: it.quantity,
            don_gia: it.unit_price,
            thanh_tien: it.amount
          })));
        } else {
          setItems([{
            id: 1,
            name: data.description || 'Phí dịch vụ',
            dvt: 'Lần',
            sl: 1,
            don_gia: data.total_amount,
            thanh_tien: data.total_amount
          }]);
        }

      } catch (err: any) {
        console.error('Error fetching invoice:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin hóa đơn');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceDetail();
  }, [id]);

  const totalAmount = items.reduce((sum, item) => sum + item.thanh_tien, 0);

  const numberToWords = (num: number): string => {
    if (num === 0) return 'Không đồng';
    return `${new Intl.NumberFormat('vi-VN').format(num)} đồng`;
  }
  const totalInWords = numberToWords(totalAmount);

  const handleUpdateInvoice = async () => {
    toast.error('Hiện tại hệ thống chưa hỗ trợ chỉnh sửa chi tiết hóa đơn đã tạo. Vui lòng xóa và tạo mới nếu sai sót.');
  };

  if (loading) return <Box p={3}><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Chi tiết Hóa đơn (ID: {id})
      </Typography>

      <Grid container spacing={3}>
        <Grid size={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Thông tin Chung</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Căn hộ/Chủ hộ"
                  fullWidth
                  value={selectedResident ? `${selectedResident.apartment_code || ''} - ${selectedResident.full_name || selectedResident.name}` : ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Ký hiệu HĐ"
                  fullWidth
                  value={kyHieu}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Số HĐ"
                  fullWidth
                  value={soHD}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Ngày HĐ"
                  type="date"
                  fullWidth
                  value={invoiceDate}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Hình thức TT</InputLabel>
                  <Select
                    label="Hình thức TT"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    readOnly
                  >
                    <MenuItem value="Chuyển khoản">Chuyển khoản</MenuItem>
                    <MenuItem value="Tiền mặt">Tiền mặt</MenuItem>
                    <MenuItem value="Khác">Khác</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái HĐ</InputLabel>
                  <Select
                    label="Trạng thái HĐ"
                    value={invoiceStatus}
                    onChange={(e) => setInvoiceStatus(e.target.value)}
                    readOnly
                  >
                    <MenuItem value="Chưa thanh toán">Chưa thanh toán</MenuItem>
                    <MenuItem value="Đã thanh toán">Đã thanh toán</MenuItem>
                    <MenuItem value="Đã hủy">Đã hủy</MenuItem>
                    <MenuItem value="Quá hạn">Quá hạn</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Chi tiết Hóa đơn</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tên hàng hóa, dịch vụ</TableCell>
                    <TableCell width={80}>ĐVT</TableCell>
                    <TableCell width={100} align="right">Số lượng</TableCell>
                    <TableCell width={150} align="right">Đơn giá</TableCell>
                    <TableCell width={150} align="right">Thành tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <TextField
                          fullWidth size="small" variant="standard"
                          value={item.name}
                          InputProps={{ readOnly: true }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth size="small" variant="standard"
                          value={item.dvt}
                          InputProps={{ readOnly: true }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number" fullWidth size="small" variant="standard"
                          inputProps={{ style: { textAlign: 'right' }, readOnly: true }}
                          value={item.sl}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number" fullWidth size="small" variant="standard"
                          inputProps={{ style: { textAlign: 'right' }, readOnly: true }}
                          value={item.don_gia}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {item.thanh_tien.toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ mr: 2, fontWeight: 'bold' }}>Tổng cộng tiền thanh toán:</Typography>
              <Typography variant="h6">{totalAmount.toLocaleString('vi-VN')} đ</Typography>
            </Box>
            <TextField
              label="Số tiền viết bằng chữ"
              fullWidth
              value={totalInWords}
              InputProps={{ readOnly: true }}
            />
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="outlined" sx={{ mr: 2 }} onClick={() => navigate('/accountance/fee/list')}>
          Quay lại
        </Button>
        <Button variant="contained" size="large" onClick={handleUpdateInvoice} color="warning" disabled>
          Lưu thay đổi
        </Button>
      </Box>
    </Paper>
  );
}