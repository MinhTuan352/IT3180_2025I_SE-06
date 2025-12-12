// src/pages/Accountant/Setup/PaymentSetupList.tsx
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import toast from 'react-hot-toast';
import feeApi, { type FeeType } from '../../../api/feeApi';

// Default bank info (can be made configurable later)
const DEFAULT_BANK_INFO = {
  bankName: 'MB Bank',
  accountNumber: '016785366886',
  accountName: 'LE HOANG PHUONG LINH',
  qrCodeUrl: '/qr-mbbank.png',
};

export default function PaymentSetupList() {
  // State for Shared Info
  const [bankInfo, setBankInfo] = useState(DEFAULT_BANK_INFO);
  const [openBankModal, setOpenBankModal] = useState(false);
  const [tempBankInfo, setTempBankInfo] = useState(DEFAULT_BANK_INFO);

  // State for Fee Types (as syntax config)
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [editingSyntaxId, setEditingSyntaxId] = useState<number | null>(null);
  const [tempSyntax, setTempSyntax] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch fee types on mount
  useEffect(() => {
    fetchFeeTypes();
  }, []);

  const fetchFeeTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await feeApi.getTypes();
      const data = response.data?.data || response.data || [];
      setFeeTypes(data);
    } catch (err: any) {
      console.error('Error fetching fee types:', err);
      setError('Không thể tải danh sách loại phí.');
    } finally {
      setLoading(false);
    }
  };

  // Generate default syntax based on fee code
  const getDefaultSyntax = (feeCode: string) => {
    const code = feeCode.toUpperCase();
    if (code.includes('PQL') || code.includes('QUANLY')) {
      return '[MaCanHo] PQL T[Thang]/[Nam]';
    }
    if (code.includes('NUOC') || code.includes('WATER')) {
      return '[MaCanHo] NUOC T[Thang]';
    }
    if (code.includes('DIEN') || code.includes('ELECTRIC')) {
      return '[MaCanHo] DIEN T[Thang]';
    }
    if (code.includes('XE') || code.includes('PARK')) {
      return '[MaCanHo] GUIXE [BienSo] T[Thang]';
    }
    return `[MaCanHo] ${code} T[Thang]`;
  };

  // --- Handlers: Bank Info ---
  const handleEditBankInfo = () => {
    setTempBankInfo({ ...bankInfo });
    setOpenBankModal(true);
  };

  const handleSaveBankInfo = () => {
    setBankInfo({ ...tempBankInfo });
    setOpenBankModal(false);
    toast.success('Đã lưu thông tin tài khoản!');
    // Note: In future, save to backend API
  };

  // --- Handlers: Syntax ---
  const handleEditSyntax = (id: number, currentSyntax: string) => {
    setEditingSyntaxId(id);
    setTempSyntax(currentSyntax);
  };

  const handleSaveSyntax = async (id: number) => {
    setSaving(true);
    try {
      // Update via API
      await feeApi.updateType(String(id), { syntax_template: tempSyntax });

      // Update local state
      setFeeTypes(prev => prev.map(item =>
        item.id === id ? { ...item, syntax_template: tempSyntax } as any : item
      ));
      setEditingSyntaxId(null);
      toast.success('Đã lưu cú pháp!');
    } catch (err: any) {
      console.error('Error saving syntax:', err);
      toast.error('Không thể lưu cú pháp.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEditSyntax = () => {
    setEditingSyntaxId(null);
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Thiết lập Thông tin Thanh toán & Cú pháp
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* --- SECTION 1: SHARED BANK INFO --- */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%', bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                  <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                  Tài khoản Nhận tiền (Chung)
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditBankInfo}
                >
                  Chỉnh sửa
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Ngân hàng</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">{bankInfo.bankName}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Số tài khoản</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ fontFamily: 'monospace', fontSize: '1.2rem' }}>
                    {bankInfo.accountNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Chủ tài khoản</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">{bankInfo.accountName}</Typography>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Mã QR Mặc định</Typography>
                  <Box sx={{ p: 1, bgcolor: 'white', borderRadius: 2, border: '1px solid #eee', display: 'flex', justifyContent: 'center' }}>
                    <img
                      src={bankInfo.qrCodeUrl}
                      alt="QR Code"
                      style={{ maxWidth: '100%', height: 'auto', display: 'block', maxHeight: 200 }}
                    />
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* --- SECTION 2: SYNTAX TABLE --- */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Cấu hình Cú pháp Chuyển khoản
              </Typography>
              <Alert severity="info" sx={{ mb: 2, fontSize: '0.875rem' }}>
                Hệ thống sẽ tự động tạo nội dung chuyển khoản dựa trên cú pháp này khi cư dân thanh toán.
                <br />
                Các biến hỗ trợ: <strong>[MaCanHo], [Thang], [Nam], [BienSo], [NoiDung]</strong>
              </Alert>

              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer sx={{ border: '1px solid #eee', borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f1f1f1' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Loại phí</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Cú pháp (Template)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', width: 100 }}>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {feeTypes.map((row) => {
                        const currentSyntax = (row as any).syntax_template || getDefaultSyntax(row.fee_code);
                        return (
                          <TableRow key={row.id}>
                            <TableCell>{row.fee_name}</TableCell>
                            <TableCell>
                              {editingSyntaxId === row.id ? (
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={tempSyntax}
                                  onChange={(e) => setTempSyntax(e.target.value)}
                                  sx={{ bgcolor: 'white' }}
                                />
                              ) : (
                                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'primary.main' }}>
                                  {currentSyntax}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {editingSyntaxId === row.id ? (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleSaveSyntax(row.id)}
                                    disabled={saving}
                                  >
                                    {saving ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
                                  </IconButton>
                                  <Button size="small" color="inherit" onClick={handleCancelEditSyntax} sx={{ minWidth: 30 }}>
                                    X
                                  </Button>
                                </Box>
                              ) : (
                                <Tooltip title="Chỉnh sửa cú pháp">
                                  <IconButton size="small" onClick={() => handleEditSyntax(row.id, currentSyntax)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {feeTypes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            Chưa có loại phí nào. Vui lòng thêm loại phí trước.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* --- Modal Edit Bank Info --- */}
      <Dialog open={openBankModal} onClose={() => setOpenBankModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cập nhật Thông tin Tài khoản</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tên Ngân hàng"
              fullWidth
              value={tempBankInfo.bankName}
              onChange={(e) => setTempBankInfo({ ...tempBankInfo, bankName: e.target.value })}
            />
            <TextField
              label="Số tài khoản"
              fullWidth
              value={tempBankInfo.accountNumber}
              onChange={(e) => setTempBankInfo({ ...tempBankInfo, accountNumber: e.target.value })}
            />
            <TextField
              label="Chủ tài khoản"
              fullWidth
              value={tempBankInfo.accountName}
              onChange={(e) => setTempBankInfo({ ...tempBankInfo, accountName: e.target.value })}
            />
            <Button variant="outlined" component="label" startIcon={<QrCode2Icon />}>
              Tải lên QR Code mới
              <input type="file" hidden accept="image/*" />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBankModal(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveBankInfo}>Lưu thay đổi</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}