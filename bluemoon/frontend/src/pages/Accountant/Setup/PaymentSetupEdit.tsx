// src/pages/Accountant/Setup/PaymentSetupEdit.tsx
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import toast from 'react-hot-toast';
import feeApi, { type FeeType } from '../../../api/feeApi';

export default function PaymentSetupEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [currentFeeType, setCurrentFeeType] = useState<FeeType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fee_type_id: '',
    syntax_template: '',
    description: '',
  });

  // Fetch fee types and current config on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await feeApi.getTypes();
        const data = response.data?.data || response.data || [];
        setFeeTypes(data);

        // Find the fee type being edited
        if (id) {
          const feeType = data.find((f: FeeType) => f.id === Number(id));
          if (feeType) {
            setCurrentFeeType(feeType);
            setFormData({
              fee_type_id: String(feeType.id),
              syntax_template: (feeType as any).syntax_template || getDefaultSyntax(feeType.fee_code),
              description: '',
            });
          } else {
            setError('Không tìm thấy cấu hình thanh toán.');
          }
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Không thể tải thông tin.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Generate default syntax based on fee code
  const getDefaultSyntax = (feeCode: string) => {
    const code = feeCode.toUpperCase();
    if (code.includes('PQL') || code.includes('QUANLY')) {
      return '[MaCanHo] PQL T[Thang]/[Nam]';
    }
    if (code.includes('NUOC')) {
      return '[MaCanHo] NUOC T[Thang]';
    }
    if (code.includes('DIEN')) {
      return '[MaCanHo] DIEN T[Thang]';
    }
    if (code.includes('XE')) {
      return '[MaCanHo] GUIXE [BienSo] T[Thang]';
    }
    return `[MaCanHo] ${code} T[Thang]`;
  };

  const handleChange = (field: string) => (e: any) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError(null);
  };

  const handleFeeTypeChange = (e: any) => {
    const feeTypeId = e.target.value;
    const selectedFee = feeTypes.find(f => f.id === Number(feeTypeId));
    if (selectedFee) {
      setFormData({
        ...formData,
        fee_type_id: feeTypeId,
        syntax_template: (selectedFee as any).syntax_template || getDefaultSyntax(selectedFee.fee_code),
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.fee_type_id || !formData.syntax_template) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    setSaving(true);
    try {
      await feeApi.updateType(formData.fee_type_id, {
        syntax_template: formData.syntax_template,
      });

      toast.success('Đã cập nhật cấu hình thanh toán!');
      navigate('/accountant/setup/payment');
    } catch (err: any) {
      console.error('Error saving:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải thông tin...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/accountant/setup/payment')}
          sx={{ mr: 2 }}
        >
          Quay lại
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Chỉnh sửa Cấu hình Thanh toán
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Alert severity="info" sx={{ mb: 3 }}>
        Chỉnh sửa cú pháp nội dung chuyển khoản cho loại phí <strong>{currentFeeType?.fee_name}</strong>.
        <br />
        <strong>Các biến hỗ trợ:</strong> [MaCanHo], [Thang], [Nam], [BienSo], [NoiDung]
      </Alert>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Loại phí</InputLabel>
            <Select
              label="Loại phí"
              value={formData.fee_type_id}
              onChange={handleFeeTypeChange}
            >
              {feeTypes.map(fee => (
                <MenuItem key={fee.id} value={fee.id}>
                  {fee.fee_name} ({fee.fee_code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Cú pháp Nội dung Chuyển khoản"
            fullWidth
            value={formData.syntax_template}
            onChange={handleChange('syntax_template')}
            placeholder="Ví dụ: [MaCanHo] PQL T[Thang]/[Nam]"
            helperText="Nội dung này sẽ xuất hiện trên hóa đơn và khi chuyển khoản"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Ghi chú (Tùy chọn)"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={handleChange('description')}
            placeholder="Mô tả thêm về cấu hình này..."
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/accountant/setup/payment')}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}