// src/pages/BOD/AssetManagement/AssetDetail.tsx
import {
  Box, Typography, Paper, Grid, Button, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Card, CardContent, Chip, CircularProgress, Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import EventIcon from '@mui/icons-material/Event';
import SaveIcon from '@mui/icons-material/Save';
import toast from 'react-hot-toast';
import assetApi, { type Asset } from '../../../api/assetApi';

interface AssetDetail extends Asset {
  manufacturer?: string;
  install_date?: string;
  maintenance_cycle?: string;
}

interface MaintenanceHistory {
  date: string;
  type: string;
  performer: string;
  note: string;
  cost: number;
}

export default function AssetDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for maintenance schedule
  const [maintenanceCycle, setMaintenanceCycle] = useState('');
  const [nextMaintenance, setNextMaintenance] = useState('');

  // Mock history for now (can be replaced with API later)
  const [history] = useState<MaintenanceHistory[]>([
    { date: '2025-11-20', type: 'Bảo trì định kỳ', performer: 'Kỹ thuật viên A', note: 'Tra dầu, kiểm tra cáp', cost: 500000 },
    { date: '2025-10-20', type: 'Sửa chữa', performer: 'Công ty Thang máy XYZ', note: 'Thay nút bấm tầng 5', cost: 2500000 },
  ]);

  useEffect(() => {
    const fetchAssetDetail = async () => {
      if (!id) {
        setError('Không tìm thấy ID tài sản.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await assetApi.getDetail(Number(id));
        const data = response.data?.data || response.data;
        setAsset(data);

        // Initialize form with fetched data
        setMaintenanceCycle(data.maintenance_cycle || '30 ngày');
        setNextMaintenance(data.next_maintenance ? data.next_maintenance.split('T')[0] : '');
      } catch (err: any) {
        console.error('Error fetching asset:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin tài sản.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssetDetail();
  }, [id]);

  const handleUpdateSchedule = async () => {
    if (!id || !asset) return;

    setSaving(true);
    try {
      await assetApi.update(Number(id), {
        ...asset,
        next_maintenance: nextMaintenance,
      });
      toast.success('Đã cập nhật lịch nhắc nhở bảo trì!');
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hoạt động':
      case 'tốt':
        return 'success';
      case 'cần bảo trì':
      case 'sửa chữa':
        return 'warning';
      case 'hỏng':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải thông tin tài sản...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/bod/asset/list')} sx={{ mb: 2 }}>
          Quay lại
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!asset) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/bod/asset/list')} sx={{ mb: 2 }}>
          Quay lại
        </Button>
        <Alert severity="warning">Không tìm thấy thông tin tài sản.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/bod/asset/list')} sx={{ mb: 2 }}>
        Quay lại
      </Button>

      <Grid container spacing={3}>
        {/* Cột Trái: Thông tin chung */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">{asset.name}</Typography>
              <Chip
                label={asset.status}
                color={getStatusColor(asset.status) as any}
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">Mã tài sản:</Typography>
              <Typography variant="body1" gutterBottom>{asset.asset_code}</Typography>

              <Typography variant="body2" color="text.secondary">Vị trí:</Typography>
              <Typography variant="body1" gutterBottom>{asset.location || 'Chưa cập nhật'}</Typography>

              <Typography variant="body2" color="text.secondary">Mô tả:</Typography>
              <Typography variant="body1" gutterBottom>{asset.description || 'Không có mô tả'}</Typography>

              <Typography variant="body2" color="text.secondary">Ngày mua/lắp đặt:</Typography>
              <Typography variant="body1" gutterBottom>
                {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
              </Typography>

              {asset.price && (
                <>
                  <Typography variant="body2" color="text.secondary">Giá trị:</Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Intl.NumberFormat('vi-VN').format(asset.price)} đ
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cột Phải: Lịch trình & Lịch sử */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* 1. Lập lịch & Nhắc nhở */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Lập lịch & Nhắc nhở</Typography>
            </Box>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Chu kỳ bảo trì"
                  value={maintenanceCycle}
                  onChange={(e) => setMaintenanceCycle(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Ngày bảo trì tiếp theo"
                  type="date"
                  value={nextMaintenance}
                  onChange={(e) => setNextMaintenance(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleUpdateSchedule}
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : 'Lưu lịch'}
                </Button>
              </Grid>
            </Grid>

            {asset.last_maintenance && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Lần bảo trì gần nhất: {new Date(asset.last_maintenance).toLocaleDateString('vi-VN')}
              </Typography>
            )}
          </Paper>

          {/* 2. Lịch sử bảo trì */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HistoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Lịch sử Bảo trì / Sửa chữa</Typography>
              </Box>
              <Button size="small" variant="outlined">Ghi nhận mới</Button>
            </Box>

            {history.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell>Ngày</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell>Người thực hiện</TableCell>
                      <TableCell>Ghi chú</TableCell>
                      <TableCell align="right">Chi phí</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>{row.performer}</TableCell>
                        <TableCell>{row.note}</TableCell>
                        <TableCell align="right">{row.cost.toLocaleString()} đ</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" textAlign="center" py={3}>
                Chưa có lịch sử bảo trì
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}