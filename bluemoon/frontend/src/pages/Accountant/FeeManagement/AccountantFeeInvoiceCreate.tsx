// src/pages/Accountant/FeeManagement/AccountantFeeInvoiceCreate.tsx
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import toast from 'react-hot-toast';
import { residentApi } from '../../../api/residentApi';
import type { Resident } from '../../../api/residentApi';
import feeApi from '../../../api/feeApi'; // feeApi is default export object

// Định nghĩa kiểu cho một dòng trong bảng chi tiết
interface InvoiceItem {
  id: number; // ID tạm thời để xóa
  name: string;
  dvt: string;
  sl: number;
  don_gia: number;
  thanh_tien: number;
}

export default function AccountantFeeInvoiceCreate() {
  const navigate = useNavigate();

  // State data
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(false);

  // Form State
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [kyHieu, setKyHieu] = useState('BM/23E');
  const [soHD, setSoHD] = useState('');
  const [ngayHD, setNgayHD] = useState(new Date().toISOString().split('T')[0]);
  const [hinhThucTT, setHinhThucTT] = useState('Chuyển khoản');
  const [trangThai, setTrangThai] = useState('Chưa thanh toán');

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, name: '', dvt: '', sl: 1, don_gia: 0, thanh_tien: 0 } // Bắt đầu với 1 dòng trống
  ]);

  const [submitting, setSubmitting] = useState(false);

  // Fetch Residents on mount
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        setLoadingResidents(true);
        const data = await residentApi.getAll({ status: 'Đang sinh sống' });
        setResidents(data);
      } catch (error) {
        console.error('Error fetching residents:', error);
        toast.error('Không thể tải danh sách cư dân');
      } finally {
        setLoadingResidents(false);
      }
    };
    fetchResidents();
  }, []);

  // --- Logic thêm/xóa/sửa dòng ---
  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), name: '', dvt: '', sl: 1, don_gia: 0, thanh_tien: 0 }]);
  };

  const handleDeleteItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: number, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        // Tự động tính thành tiền nếu sửa Số lượng hoặc Đơn giá
        if (field === 'sl' || field === 'don_gia') {
          const sl = field === 'sl' ? Number(value) : newItem.sl;
          const don_gia = field === 'don_gia' ? Number(value) : newItem.don_gia;
          newItem.thanh_tien = sl * don_gia;
        }
        return newItem;
      }
      return item;
    }));
  };

  // --- Tính tổng tiền ---
  const totalAmount = items.reduce((sum, item) => sum + item.thanh_tien, 0);

  // (Hàm chuyển số thành chữ - Placeholder đơn giản)
  const numberToWords = (num: number): string => {
    if (num === 0) return 'Không đồng';
    return `${new Intl.NumberFormat('vi-VN').format(num)} đồng`;
  }
  const totalInWords = numberToWords(totalAmount);


  // --- Logic Tạo Hóa đơn ---
  const handleCreateInvoice = async () => {
    if (!selectedResident) {
      toast.error('Vui lòng chọn Cư dân / Căn hộ');
      return;
    }
    if (items.length === 0 || totalAmount === 0) {
      toast.error('Vui lòng nhập chi tiết hóa đơn');
      return;
    }

    setSubmitting(true);
    try {
      // Construct payload match with Backend API expectation
      const payload = {
        resident_id: selectedResident.id,
        apartment_id: selectedResident.apartment_id,
        fee_type_id: 1, // Mặc định phí quản lý hoặc để user chọn
        description: items.map(i => `${i.name} (${i.sl} ${i.dvt})`).join(', '),
        billing_period: `${new Date(ngayHD).getMonth() + 1}/${new Date(ngayHD).getFullYear()}`,
        due_date: new Date(new Date(ngayHD).setDate(new Date(ngayHD).getDate() + 7)).toISOString(), // Hạn 7 ngày
        items: items.map(i => ({
          item_name: i.name,
          unit: i.dvt,
          quantity: i.sl,
          unit_price: i.don_gia,
          amount: i.thanh_tien
        })),
        total_amount: totalAmount,
        status: trangThai,
        payment_method: hinhThucTT
      };

      await feeApi.create(payload);
      toast.success('Tạo hóa đơn thành công!');
      navigate('/accountance/fee/list');
    } catch (error: any) {
      console.error('Create invoice error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi khi tạo hóa đơn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Tạo Hóa đơn Dịch vụ Mới
      </Typography>

      <Grid container spacing={3}>
        {/* === Phần Thông tin Chung === */}
        <Grid size={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Thông tin Chung</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                {/* Chọn Cư dân */}
                <Autocomplete
                  options={residents}
                  loading={loadingResidents}
                  getOptionLabel={(option) => `${option.apartment_code || 'N/A'} - ${option.full_name}`}
                  onChange={(_, newValue) => setSelectedResident(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Chọn Căn hộ/Chủ hộ"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingResidents ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Ký hiệu HĐ"
                  fullWidth
                  value={kyHieu}
                  onChange={(e) => setKyHieu(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Số HĐ"
                  fullWidth
                  value={soHD}
                  onChange={(e) => setSoHD(e.target.value)}
                  placeholder="Để trống để tự tạo"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Ngày HĐ"
                  type="date"
                  fullWidth
                  value={ngayHD}
                  onChange={(e) => setNgayHD(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Hình thức TT</InputLabel>
                  <Select
                    label="Hình thức TT"
                    value={hinhThucTT}
                    onChange={(e) => setHinhThucTT(e.target.value)}
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
                    value={trangThai}
                    onChange={(e) => setTrangThai(e.target.value)}
                  >
                    <MenuItem value="Chưa thanh toán">Chưa thanh toán</MenuItem>
                    <MenuItem value="Đã thanh toán">Đã thanh toán</MenuItem>
                    <MenuItem value="Đã hủy">Đã hủy</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* === Phần Chi tiết Hóa đơn === */}
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
                    <TableCell width={50}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          variant="standard"
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          variant="standard"
                          value={item.dvt}
                          onChange={(e) => handleItemChange(item.id, 'dvt', e.target.value)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          fullWidth
                          size="small"
                          variant="standard"
                          inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                          value={item.sl}
                          onChange={(e) => handleItemChange(item.id, 'sl', Math.max(0, Number(e.target.value)))}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          fullWidth
                          size="small"
                          variant="standard"
                          inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                          value={item.don_gia}
                          onChange={(e) => handleItemChange(item.id, 'don_gia', Math.max(0, Number(e.target.value)))}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {item.thanh_tien.toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.id)} disabled={items.length <= 1}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Button startIcon={<AddIcon />} onClick={handleAddItem} sx={{ mt: 1 }}>
              Thêm dòng
            </Button>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ mr: 2, fontWeight: 'bold' }}>Tổng tiền hàng:</Typography>
              <Typography variant="h6">{totalAmount.toLocaleString('vi-VN')} đ</Typography>
            </Box>
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

      {/* Nút Tạo */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleCreateInvoice}
          disabled={submitting}
        >
          {submitting ? 'Đang tạo...' : 'Tạo Hóa đơn'}
        </Button>
      </Box>
    </Paper>
  );
}