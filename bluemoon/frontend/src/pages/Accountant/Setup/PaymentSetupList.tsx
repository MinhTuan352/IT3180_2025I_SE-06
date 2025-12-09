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
} from '@mui/material';
import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

// --- Mock Data: Shared Bank Info ---
const mockSharedBankInfo = {
  bankName: 'Vietcombank',
  accountNumber: '123456789012',
  accountName: 'BQL CHUNG CU BLUEMOON',
  qrCodeUrl: '/shared-qr.png',
};

// --- Mock Data: Fee Syntax Configuration ---
const mockFeeSyntaxes = [
  { id: 'TT-PQL', feeName: 'Phí Quản lý', syntax: '[MaCanHo] PQL T[Thang]/[Nam]' },
  { id: 'TT-XEOTO', feeName: 'Phí Gửi xe Ô tô', syntax: '[MaCanHo] XEOTO [BienSo] T[Thang]' },
  { id: 'TT-XEMAY', feeName: 'Phí Gửi xe Máy', syntax: '[MaCanHo] XEMAY [BienSo] T[Thang]' },
  { id: 'TT-NUOC', feeName: 'Phí Nước', syntax: '[MaCanHo] NUOC T[Thang]' },
  { id: 'TT-DIEN', feeName: 'Phí Điện', syntax: '[MaCanHo] DIEN T[Thang]' },
  { id: 'TT-KHAC', feeName: 'Phí Khác', syntax: '[MaCanHo] KHAC [NoiDung]' },
];

export default function PaymentSetupList() {
  // State for Shared Info
  const [bankInfo, setBankInfo] = useState(mockSharedBankInfo);
  const [openBankModal, setOpenBankModal] = useState(false);
  const [tempBankInfo, setTempBankInfo] = useState(mockSharedBankInfo);

  // State for Syntaxes
  const [syntaxes, setSyntaxes] = useState(mockFeeSyntaxes);
  const [editingSyntaxId, setEditingSyntaxId] = useState<string | null>(null);
  const [tempSyntax, setTempSyntax] = useState('');

  // --- Handlers: Bank Info ---
  const handleEditBankInfo = () => {
    setTempBankInfo({ ...bankInfo });
    setOpenBankModal(true);
  };

  const handleSaveBankInfo = () => {
    setBankInfo({ ...tempBankInfo });
    setOpenBankModal(false);
    // TODO: Call API to save shared settings
  };

  // --- Handlers: Syntax ---
  const handleEditSyntax = (id: string, currentSyntax: string) => {
    setEditingSyntaxId(id);
    setTempSyntax(currentSyntax);
  };

  const handleSaveSyntax = (id: string) => {
    setSyntaxes(prev => prev.map(item =>
      item.id === id ? { ...item, syntax: tempSyntax } : item
    ));
    setEditingSyntaxId(null);
    // TODO: Call API to save syntax config
  };

  const handleCancelEditSyntax = () => {
    setEditingSyntaxId(null);
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Thiết lập Thông tin Thanh toán & Cú pháp
      </Typography>

      <Grid container spacing={3}>
        {/* --- SECTION 1: SHARED BANK INFO --- */}
        <Grid sx={{ xs: 12, md: 5 }}>
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
                      style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                    />
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* --- SECTION 2: SYNTAX TABLE --- */}
        <Grid sx={{ xs: 12, md: 7 }}>
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
                    {syntaxes.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.feeName}</TableCell>
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
                              {row.syntax}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {editingSyntaxId === row.id ? (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <IconButton size="small" color="success" onClick={() => handleSaveSyntax(row.id)}>
                                <SaveIcon fontSize="small" />
                              </IconButton>
                              <Button size="small" color="inherit" onClick={handleCancelEditSyntax} sx={{ minWidth: 30 }}>
                                X
                              </Button>
                            </Box>
                          ) : (
                            <Tooltip title="Chỉnh sửa cú pháp">
                              <IconButton size="small" onClick={() => handleEditSyntax(row.id, row.syntax)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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