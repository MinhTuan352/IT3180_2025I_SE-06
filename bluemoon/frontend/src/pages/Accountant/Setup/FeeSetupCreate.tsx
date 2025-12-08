import { Box, Typography, Paper, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InfoIcon from '@mui/icons-material/Info';
import { useState } from 'react';
import feeApi from '../../../api/feeApi';
import toast from 'react-hot-toast';

export default function FeeSetupCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fee_code: '',
    fee_name: '',
    default_price: '',
    unit: '',
    calculation: 'fixed',
    description: ''
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    if (!formData.fee_code || !formData.fee_name || !formData.default_price || !formData.unit) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }

    setLoading(true);
    try {
      await feeApi.createType({
        fee_code: formData.fee_code,
        fee_name: formData.fee_name,
        default_price: Number(formData.default_price),
        unit: formData.unit
      });
      toast.success('Tạo loại phí thành công!');
      navigate('/accountance/fee/setup/feeSetup');
    } catch (error: any) {
      console.error("Error creating fee type:", error);
      toast.error(error.response?.data?.message || 'Lỗi khi tạo loại phí');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 700, margin: 'auto', borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
        Thêm Loại Phí Mới
      </Typography>
      <Grid container spacing={3}>
        <Grid size={12}>
          <TextField
            label="Mã Phí (Viết liền, không dấu)"
            name="fee_code"
            value={formData.fee_code}
            onChange={handleChange}
            fullWidth
            required
            helperText="Ví dụ: PQL, PXEOTO, PNUOC. Mã này không thể thay đổi sau khi tạo."
            InputProps={{
              endAdornment: (
                <Tooltip title="Mã phí là định danh duy nhất, dùng trong công thức hoặc import/export.">
                  <InfoIcon color="action" sx={{ cursor: 'help' }} />
                </Tooltip>
              )
            }}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            label="Tên Loại Phí"
            name="fee_name"
            value={formData.fee_name}
            onChange={handleChange}
            fullWidth
            required
            helperText="Tên sẽ hiển thị trên hóa đơn cho cư dân."
          />
        </Grid>

        <Grid size={6}>
          <TextField
            label="Đơn giá (VNĐ)"
            name="default_price"
            value={formData.default_price}
            onChange={handleChange}
            type="number"
            fullWidth
            required
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Đơn vị tính"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            fullWidth
            required
            helperText="Ví dụ: m², xe/tháng, hộ/tháng, m³, kWh"
          />
        </Grid>

        <Grid size={12}>
          <FormControl fullWidth>
            <InputLabel>Cách tính</InputLabel>
            <Select
              label="Cách tính"
              name="calculation"
              value={formData.calculation}
              onChange={handleChange}
            >
              <MenuItem value="fixed">Thu cố định theo đơn vị</MenuItem>
              <MenuItem value="area">Nhân với diện tích căn hộ</MenuItem>
              <MenuItem value="usage">Nhân với chỉ số sử dụng (nước, điện)</MenuItem>
              <MenuItem value="manual">Nhập tay thủ công mỗi kỳ</MenuItem>
            </Select>
            <Typography variant="caption" sx={{ mt: 0.5, ml: 1.5, color: 'text.secondary' }}>
              Xác định cách hệ thống tự động tính tiền cho loại phí này khi lập hóa đơn hàng loạt. (Hiện tại backend chưa hỗ trợ logic tự động này)
            </Typography>
          </FormControl>
        </Grid>

        <Grid size={12}>
          <TextField
            label="Mô tả (Tùy chọn)"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            helperText="Giải thích rõ hơn về loại phí này nếu cần. (Hiện tại chỉ lưu nội bộ frontend)"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        <Button onClick={() => navigate('/accountance/fee/setup/feeSetup')} disabled={loading}>
          Hủy
        </Button>
        <Button variant="contained" onClick={handleCreate} disabled={loading}>
          {loading ? 'Đang tạo...' : 'Tạo Loại Phí'}
        </Button>
      </Box>
    </Paper>
  );
}