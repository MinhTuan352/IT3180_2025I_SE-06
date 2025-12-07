// src/pages/BOD/ReportManagement/ReportDetail.tsx
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  //Alert,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import incidentApi, { type Incident } from '../../../api/incidentApi';

export default function ReportDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form handling
  const [currentStatus, setCurrentStatus] = useState<string>('Mới');
  const [responseNote, setResponseNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDetail(id);
    }
  }, [id]);

  const fetchDetail = async (reportId: string) => {
    try {
      setLoading(true);
      const res = await incidentApi.getDetail(reportId);
      // Safety check response structure
      const data = (res as any).data || res;
      if (data) {
        setReport(data);
        setCurrentStatus(data.status);
        setResponseNote(data.admin_response || '');
      }
    } catch (err: any) {
      console.error(err);
      setError("Không tải được thông tin sự cố.");
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async () => {
    if (!report) return;
    try {
      setProcessing(true);
      // Payload for update
      const payload = {
        status: currentStatus,
        admin_response: responseNote
      };
      await incidentApi.update(report.id, payload);
      alert('Cập nhật trạng thái thành công!');
      fetchDetail(report.id); // Reload to ensure sync
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi cập nhật');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Đang tải chi tiết sự cố...</Typography>
      </Paper>
    );
  }

  if (error || !report) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">{error || 'Không tìm thấy sự cố'}</Typography>
        <Button onClick={() => navigate('/bod/report/list')}>Quay lại</Button>
      </Paper>
    );
  }

  // Lấy màu chip
  let chipColor: "error" | "warning" | "success" | "default" = "error";
  if (report.status === 'Đang xử lý') chipColor = 'warning';
  if (report.status === 'Hoàn thành') chipColor = 'success';
  if (report.status === 'Đã hủy') chipColor = 'default';

  return (
    <Paper sx={{ p: 4, borderRadius: 3 }}>
      {/* Hàng 1: Nút Back và Tiêu đề */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/bod/report/list')}
          sx={{ mr: 2 }}
        >
          Quay lại
        </Button>
        <Chip
          label={report.status}
          color={chipColor}
        />
        {report.priority === 'Khẩn cấp' && (
          <Chip label="Khẩn cấp" color="error" size="small" sx={{ ml: 1 }} variant="outlined" />
        )}
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        {report.title}
      </Typography>

      {/* Hàng 2: Thông tin meta */}
      <Grid container spacing={2} sx={{ color: 'text.secondary', my: 2 }}>
        <Grid sx={{ xs: 12, sm: 6 }}>
          <Typography variant="body2">
            <strong>Người báo cáo:</strong> {report.reported_by}
            {/* Note: reported_by is ID, ideally backend should join name or we maintain a map. 
               The backend model sends 'assigned_to', but reported_by might be just ID. 
               If backend sends name populated, great. */}
          </Typography>
          <Typography variant="body2">
            <strong>Vị trí:</strong> {report.location}
          </Typography>
        </Grid>
        <Grid sx={{ xs: 12, sm: 6 }}>
          <Typography variant="body2">
            <strong>Ngày báo cáo:</strong> {new Date(report.created_at).toLocaleString('vi-VN')}
          </Typography>
          <Typography variant="body2">
            <strong>Mức độ:</strong> {report.priority}
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* Hàng 3: Mô tả chi tiết */}
      <Typography variant="h6" sx={{ mb: 1 }}>Mô tả của Cư dân:</Typography>
      <Box sx={{
        minHeight: 150,
        mb: 3,
        whiteSpace: 'pre-wrap',
        bgcolor: 'background.default',
        p: 2,
        borderRadius: 2,
      }}>
        <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
          {report.description}
        </Typography>
      </Box>

      {report.images && report.images.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Hình ảnh đính kèm:</Typography>
          <Grid container spacing={1}>
            {report.images.map((img, idx) => (
              <Grid key={idx}>
                {/* Assuming backend images are paths relative to root or similar, need full URL if external */}
                {/* Backend implementation: path: `/uploads/incidents/${file.filename}` */}
                <img
                  src={`http://localhost:3000${typeof img === 'string' ? img : (img as any).path}`}
                  alt="evidence"
                  style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, border: '1px solid #ddd' }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Hàng 4: Khu vực xử lý của B.O.D. */}
      <Typography variant="h6" sx={{ mb: 2 }}>Cập nhật xử lý</Typography>
      <Grid container spacing={2} alignItems="flex-start">
        <Grid sx={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Cập nhật trạng thái</InputLabel>
            <Select
              label="Cập nhật trạng thái"
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
            >
              <MenuItem value="Mới">Mới</MenuItem>
              <MenuItem value="Đang xử lý">Đang xử lý</MenuItem>
              <MenuItem value="Hoàn thành">Hoàn thành</MenuItem>
              <MenuItem value="Đã hủy">Đã hủy</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid sx={{ xs: 12, sm: 8 }}>
          <TextField
            label="Ghi chú nội bộ (Tùy chọn)"
            fullWidth
            multiline
            rows={3}
            value={responseNote}
            onChange={(e) => setResponseNote(e.target.value)}
            placeholder="Ghi lại quá trình xử lý, vd: Đã gọi thợ..."
          />
        </Grid>
        <Grid sx={{ xs: 12, display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleUpdateStatus}
            disabled={processing}
          >
            {processing ? 'Đang lưu...' : 'Lưu cập nhật'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}