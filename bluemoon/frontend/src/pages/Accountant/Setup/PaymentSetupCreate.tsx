// src/pages/Accountant/Setup/PaymentSetupCreate.tsx
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
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import toast from 'react-hot-toast';
import feeApi, { type FeeType } from '../../../api/feeApi';

export default function PaymentSetupCreate() {
  const navigate = useNavigate();
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fee_type_id: '',
    syntax_template: '',
    description: '',
  });

  // Fetch fee types on mount
  useEffect(() => {
    const fetchFeeTypes = async () => {
      try {
        setLoading(true);
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
    fetchFeeTypes();
  }, []);

  const handleChange = (field: string) => (e: any) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError(null);
  };

  // Auto-generate syntax when fee type is selected
  const handleFeeTypeChange = (e: any) => {
    const feeTypeId = e.target.value;
    setFormData({ ...formData, fee_type_id: feeTypeId });

    // Find selected fee type and generate default syntax
    const selectedFee = feeTypes.find(f => f.id === Number(feeTypeId));
    if (selectedFee) {
      const code = selectedFee.fee_code.toUpperCase();
      let defaultSyntax = `[MaCanHo] ${code} T[Thang]`;

      if (code.includes('PQL') || code.includes('QUANLY')) {
        defaultSyntax = '[MaCanHo] PQL T[Thang]/[Nam]';
      } else if (code.includes('NUOC')) {
        defaultSyntax = '[MaCanHo] NUOC T[Thang]';
      } else if (code.includes('DIEN')) {
        defaultSyntax = '[MaCanHo] DIEN T[Thang]';
      } else if (code.includes('XE')) {
        defaultSyntax = '[MaCanHo] GUIXE [BienSo] T[Thang]';
      }

      setFormData(prev => ({ ...prev, fee_type_id: feeTypeId, syntax_template: defaultSyntax }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.fee_type_id || !formData.syntax_template) {
      setError('Vui lòng chọn loại phí và nhập cú pháp.');
      return;
    }

    setSaving(true);
    try {
      // Update the fee type with syntax template
      await feeApi.updateType(formData.fee_type_id, {
        syntax_template: formData.syntax_template,
      });

      toast.success('Đã lưu cấu hình thanh toán!');
      navigate('/accountant/setup/payment');
    } catch (err: any) {
      console.error('Error saving:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu.');
    } finally {
      setSaving(false);
    }
  };

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
          Thêm Cấu hình Thanh toán
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Alert severity="info" sx={{ mb: 3 }}>
        Thiết lập cú pháp nội dung chuyển khoản cho từng loại phí. Cú pháp này sẽ được sử dụng khi tạo hóa đơn cho cư dân.
        <br />
        <strong>Các biến hỗ trợ:</strong> [MaCanHo], [Thang], [Nam], [BienSo], [NoiDung]
      </Alert>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Chọn Loại phí</InputLabel>
              <Select
                label="Chọn Loại phí"
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
              placeholder="Ví dụ: [MaCanHo] - [Ten] - PQL T[Thang]/[Nam]"
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
                {saving ? 'Đang lưu...' : 'Lưu Cấu hình'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
}