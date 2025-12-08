// src/pages/Resident/Report/ResidentReportList.tsx
import { Box, Typography, Paper, Chip, Button, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Rating, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useEffect, useState } from 'react';
import incidentApi, { type Incident } from '../../../api/incidentApi';

type ReportStatusResident = 'Mới' | 'Đang xử lý' | 'Hoàn thành' | 'Đã hủy';

export default function ResidentReportList() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state for viewing report detail
  const [selectedReport, setSelectedReport] = useState<Incident | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Feedback state (for completed reports)
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Fetch reports from API
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await incidentApi.getAll();
      const data = (response.data as any).data || [];
      setReports(data);
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách báo cáo. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle row click to show detail
  const handleRowClick = (params: any) => {
    const report = params.row as Incident;
    setSelectedReport(report);
    setRating(report.rating || null);
    setFeedback(report.feedback || '');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedReport(null);
    setRating(null);
    setFeedback('');
  };

  // Submit feedback for completed report
  const handleSubmitFeedback = async () => {
    if (!selectedReport) return;

    try {
      setSubmittingFeedback(true);
      await incidentApi.update(selectedReport.id, { rating, feedback });
      // Update local state
      setReports(prev => prev.map(r =>
        r.id === selectedReport.id ? { ...r, rating: rating || undefined, feedback } : r
      ));
      handleCloseDialog();
      alert('Đánh giá thành công!');
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      alert(err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Mã SC', width: 100 },
    {
      field: 'status', headerName: 'Trạng thái', width: 140,
      renderCell: (params) => {
        const status = params.value as ReportStatusResident;
        let color: "info" | "warning" | "success" | "default" = "info";
        if (status === 'Mới') color = 'info';
        if (status === 'Đang xử lý') color = 'warning';
        if (status === 'Hoàn thành') color = 'success';
        if (status === 'Đã hủy') color = 'default';
        return <Chip label={status} color={color} size="small" />;
      }
    },
    { field: 'title', headerName: 'Tiêu đề', flex: 1, minWidth: 250 },
    { field: 'location', headerName: 'Vị trí', width: 180 },
    {
      field: 'created_at', headerName: 'Ngày gửi', width: 160, type: 'dateTime',
      valueGetter: (value) => value ? new Date(value) : null,
      valueFormatter: (value: Date | null) => value ? value.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '',
    },
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Lịch sử Báo cáo Sự cố / Yêu cầu
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => navigate('/resident/report/send')}
        >
          Gửi Báo cáo Mới
        </Button>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Data Grid */}
      {!isLoading && !error && (
        <Box sx={{ height: '70vh', width: '100%' }}>
          <DataGrid
            rows={reports}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] }
            }}
            pageSizeOptions={[10, 20]}
            disableRowSelectionOnClick={false}
            onRowClick={handleRowClick}
            getRowId={(row) => row.id}
            sx={{ border: 0, cursor: 'pointer' }}
            localeText={{
              noRowsLabel: 'Bạn chưa có báo cáo sự cố nào.'
            }}
          />
        </Box>
      )}

      {/* Report Detail Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Chi tiết Báo cáo: {selectedReport?.id}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">{selectedReport?.title}</Typography>
            <Chip
              label={selectedReport?.status}
              color={selectedReport?.status === 'Hoàn thành' ? 'success' : selectedReport?.status === 'Đang xử lý' ? 'warning' : 'info'}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Vị trí:</strong> {selectedReport?.location}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Ngày gửi:</strong> {selectedReport?.created_at ? new Date(selectedReport.created_at).toLocaleString('vi-VN') : ''}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
            <strong>Mô tả:</strong><br />{selectedReport?.description}
          </Typography>

          {selectedReport?.admin_response && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
              <Typography variant="body2" fontWeight="bold" color="primary">Phản hồi từ BQL:</Typography>
              <Typography variant="body2">{selectedReport.admin_response}</Typography>
            </Box>
          )}

          {/* Feedback section (only for completed reports) */}
          {selectedReport?.status === 'Hoàn thành' && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Đánh giá chất lượng xử lý
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ mr: 2 }}>Mức độ hài lòng:</Typography>
                <Rating
                  value={rating}
                  onChange={(_, newValue) => setRating(newValue)}
                />
              </Box>
              <TextField
                label="Góp ý thêm (tùy chọn)"
                fullWidth
                multiline
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                size="small"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Đóng</Button>
          {selectedReport?.status === 'Hoàn thành' && (
            <Button
              variant="contained"
              onClick={handleSubmitFeedback}
              disabled={submittingFeedback || !rating}
            >
              {submittingFeedback ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
}