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
  Autocomplete, // <-- Để chọn Cư dân
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// Mock danh sách cư dân (Thay bằng API)
const mockResidents = [
  { id: 'R0001', name: 'Trần Văn Hộ', apartment: 'A-101' },
  { id: 'R0002', name: 'Lê Gia Đình', apartment: 'B-205' },
];

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
  const [setSelectedResident] = useState<any>(null);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, name: '', dvt: '', sl: 1, don_gia: 0, thanh_tien: 0 } // Bắt đầu với 1 dòng trống
  ]);

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

  // (Hàm chuyển số thành chữ - Bạn có thể tìm thư viện hoặc tự viết)
  const numberToWords = (num: number): string => {
    if (num === 0) return 'Không đồng';
    // ... (logic chuyển đổi phức tạp) ...
    return `${num.toLocaleString('vi-VN')} đồng`; // Placeholder
  }
  const totalInWords = numberToWords(totalAmount);


  // --- Logic Tạo Hóa đơn ---
  const handleCreateInvoice = () => {
    // 1. Thu thập dữ liệu từ state (selectedResident, items, totalAmount, totalInWords...)
    // 2. Gọi API để lưu hóa đơn
    // 3. Xử lý kết quả (thành công/thất bại)
    alert('Đã tạo Hóa đơn (Giả lập)');
    // Chuyển hướng về trang danh sách
    navigate('/accountance/fee/list');
    // Hoặc lý tưởng hơn là lấy ID hóa đơn mới trả về và chuyển sang trang chi tiết
    // navigate(`/accountance/fee/list/invoice/${newInvoiceId}`);
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
                  options={mockResidents}
                  getOptionLabel={(option) => `${option.apartment} - ${option.name}`}
                  onChange={(_, newValue) => setSelectedResident(newValue)}
                  renderInput={(params) => <TextField {...params} label="Chọn Căn hộ/Chủ hộ" />}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Ký hiệu HĐ"
                  fullWidth
                  defaultValue="BM/23E"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Số HĐ"
                  fullWidth
                  placeholder="Để trống để tự tạo"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Ngày HĐ"
                  type="date"
                  fullWidth
                  defaultValue={new Date().toISOString().split('T')[0]}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Hình thức TT</InputLabel>
                  <Select label="Hình thức TT" defaultValue="Chuyển khoản">
                    <MenuItem value="Chuyển khoản">Chuyển khoản</MenuItem>
                    <MenuItem value="Tiền mặt">Tiền mặt</MenuItem>
                    <MenuItem value="Khác">Khác</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái HĐ</InputLabel>
                  <Select label="Trạng thái HĐ" defaultValue="Chưa thanh toán">
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
            {/* (Thêm Thuế nếu cần) */}
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
        <Button variant="contained" size="large" onClick={handleCreateInvoice}>
          Tạo Hóa đơn
        </Button>
      </Box>
    </Paper>
  );
}