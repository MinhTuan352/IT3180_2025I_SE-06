import { Box, Typography, Grid, Card, CardContent, CardActions, Button, Paper, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useEffect, useState } from 'react';
import feeApi from '../../../api/feeApi';
import toast from 'react-hot-toast';

export default function FeeSetupList() {
  const navigate = useNavigate();
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeeTypes = async () => {
    try {
      const response: any = await feeApi.getTypes();
      // response.data = { success: true, data: [...] }
      // So the array is in response.data.data
      if (response && response.data && response.data.data) {
        setFeeTypes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching fee types:", error);
      toast.error("Không thể tải danh sách loại phí");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeTypes();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa loại phí này? Nếu đã có hóa đơn sử dụng phí này, bạn sẽ không thể xóa.')) {
      try {
        await feeApi.deleteType(id.toString());
        toast.success('Đã xóa loại phí thành công');
        fetchFeeTypes();
      } catch (error: any) {
        console.error("Error deleting fee type:", error);
        toast.error(error.response?.data?.message || 'Lỗi khi xóa loại phí');
      }
    }
  };

  if (loading) {
    return <Typography sx={{ p: 3 }}>Đang tải dữ liệu...</Typography>;
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Thiết lập Các Loại Phí
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/accountance/fee/setup/feeSetup/create')}
        >
          Thêm loại phí
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {feeTypes.map((fee) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={fee.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>{fee.fee_name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Mã: {fee.fee_code}
                </Typography>
                <Typography sx={{ my: 1 }}>
                  <strong>Đơn giá:</strong> {Number(fee.default_price).toLocaleString('vi-VN')} đ / {fee.unit}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(fee.id)}
                >
                  Xóa
                </Button>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate('/accountance/fee/setup/feeSetup/edit/' + fee.id)}
                >
                  Chỉnh sửa
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {feeTypes.length === 0 && (
          <Typography sx={{ p: 3, width: '100%', textAlign: 'center', color: 'text.secondary' }}>
            Chưa có loại phí nào được thiết lập.
          </Typography>
        )}
      </Grid>
    </Paper>
  );
}