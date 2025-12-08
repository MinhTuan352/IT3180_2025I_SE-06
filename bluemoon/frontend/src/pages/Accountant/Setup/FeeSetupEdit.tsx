import { Box, Typography, Paper, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem, Tooltip } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import feeApi from '../../../api/feeApi';
import toast from 'react-hot-toast';

export default function FeeSetupEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [feeData, setFeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const response: any = await feeApi.getTypes();
        // response.data = { success: true, data: [...] }
        if (response && response.data && response.data.data) {
          const found = response.data.data.find((f: any) => f.id.toString() === id);
          if (found) {
            setFeeData({
              id: found.id,
              fee_code: found.fee_code,
              name: found.fee_name,
              price: found.default_price,
              unit: found.unit,
              calculation: 'fixed',
              description: ''
            });
          } else {
            toast.error('Không tìm thấy loại phí này');
            navigate('/accountance/fee/setup/feeSetup');
          }
        }
      } catch (error) {
        console.error("Error fetching fee detail:", error);
        toast.error('Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setFeeData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await feeApi.updateType(id!, {
        fee_code: feeData.fee_code,
        fee_name: feeData.name,
        default_price: Number(feeData.price),
        unit: feeData.unit
      });
      toast.success('Cập nhật thành công!');
      navigate('/accountance/fee/setup/feeSetup');
    } catch (error: any) {
      console.error("Error updating fee:", error);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Typography sx={{ p: 3 }}>Đang tải...</Typography>;
  }

  if (!feeData) return null;

  return (
    <Paper sx={{ p: 3, maxWidth: 700, margin: 'auto', borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
        Chỉnh sửa Loại Phí (Mã: {feeData.fee_code})
      </Typography>
      <Grid container spacing={3}>
        <Grid size={12}>
          <TextField
            label="Mã Phí"
            fullWidth
            value={feeData.fee_code}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Tooltip title="Mã phí là định danh duy nhất, không thể thay đổi.">
                  <InfoIcon color="action" sx={{ cursor: 'help' }} />
                </Tooltip>
              )
            }}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            label="Tên Loại Phí"
            name="name"
            fullWidth
            required
            value={feeData.name}
            onChange={handleChange}
            helperText="Tên sẽ hiển thị trên hóa đơn cho cư dân."
          />
        </Grid>

        <Grid size={6}>
          <TextField
            label="Đơn giá (VNĐ)"
            name="price"
            type="number"
            fullWidth
            required
            value={feeData.price}
            onChange={handleChange}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Đơn vị tính"
            name="unit"
            fullWidth
            required
            value={feeData.unit}
            onChange={handleChange}
            helperText="Ví dụ: m², xe/tháng, hộ/tháng, m³, kWh"
          />
        </Grid>

        <Grid size={12}>
          <FormControl fullWidth>
            <InputLabel>Cách tính</InputLabel>
            <Select
              label="Cách tính"
              name="calculation"
              value={feeData.calculation}
              onChange={handleChange}
            >
              <MenuItem value="fixed">Thu cố định theo đơn vị</MenuItem>
              <MenuItem value="area">Nhân với diện tích căn hộ</MenuItem>
              <MenuItem value="usage">Nhân với chỉ số sử dụng (nước, điện)</MenuItem>
              <MenuItem value="manual">Nhập tay thủ công mỗi kỳ</MenuItem>
            </Select>
            <Typography variant="caption" sx={{ mt: 0.5, ml: 1.5, color: 'text.secondary' }}>
              Xác định cách hệ thống tự động tính tiền cho loại phí này. (Backend chưa dùng field này)
            </Typography>
          </FormControl>
        </Grid>

        <Grid size={12}>
          <TextField
            label="Mô tả (Tùy chọn)"
            name="description"
            fullWidth
            multiline
            rows={3}
            value={feeData.description}
            onChange={handleChange}
            helperText="Giải thích rõ hơn về loại phí này nếu cần. (Backend chưa dùng field này)"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        <Button onClick={() => navigate('/accountance/fee/setup/feeSetup')} disabled={saving}>
          Hủy
        </Button>
        <Button variant="contained" onClick={handleUpdate} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Cập nhật'}
        </Button>
      </Box>
    </Paper>
  );
}