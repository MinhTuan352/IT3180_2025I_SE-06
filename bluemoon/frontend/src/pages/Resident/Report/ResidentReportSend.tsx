// src/pages/Resident/Report/ResidentReportSend.tsx
import { Box, Typography, Paper, Grid, TextField, Button, Alert, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import incidentApi from '../../../api/incidentApi';

export default function ResidentReportSend() {
    const navigate = useNavigate();

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [priority, setPriority] = useState('Trung bình');

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmitReport = async () => {
        // Validate
        if (!title.trim()) {
            setError('Vui lòng nhập tiêu đề sự cố.');
            return;
        }
        if (!description.trim()) {
            setError('Vui lòng nhập mô tả chi tiết.');
            return;
        }
        if (!location.trim()) {
            setError('Vui lòng nhập vị trí xảy ra sự cố.');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            // Send as JSON instead of FormData (no images)
            await incidentApi.create({
                title: title.trim(),
                description: description.trim(),
                location: location.trim(),
                priority
            });

            setSuccess(true);
            // Navigate to list after a short delay
            setTimeout(() => {
                navigate('/resident/report/list');
            }, 1500);

        } catch (err: any) {
            console.error('Error submitting report:', err);
            setError(err.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Paper sx={{ p: 3, maxWidth: 800, margin: 'auto', borderRadius: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                Gửi Báo cáo Sự cố / Yêu cầu
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Gửi báo cáo thành công! Đang chuyển hướng...
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid size={12}>
                    <TextField
                        label="Tiêu đề sự cố / yêu cầu"
                        fullWidth
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        helperText="Mô tả ngắn gọn vấn đề (ví dụ: Mất nước căn hộ A-101, Đèn hành lang T5 bị hỏng)"
                        disabled={isSubmitting || success}
                    />
                </Grid>
                <Grid size={12}>
                    <TextField
                        label="Vị trí xảy ra"
                        fullWidth
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        helperText="Ví dụ: Căn hộ A-101, Hành lang tầng 5 Tòa B, Hầm B2 cột 10"
                        disabled={isSubmitting || success}
                    />
                </Grid>
                <Grid size={12}>
                    <FormControl fullWidth>
                        <InputLabel>Mức độ ưu tiên</InputLabel>
                        <Select
                            value={priority}
                            label="Mức độ ưu tiên"
                            onChange={(e) => setPriority(e.target.value)}
                            disabled={isSubmitting || success}
                        >
                            <MenuItem value="Thấp">Thấp</MenuItem>
                            <MenuItem value="Trung bình">Trung bình</MenuItem>
                            <MenuItem value="Cao">Cao</MenuItem>
                            <MenuItem value="Khẩn cấp">Khẩn cấp</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={12}>
                    <TextField
                        label="Mô tả chi tiết"
                        fullWidth
                        required
                        multiline
                        rows={6}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        helperText="Vui lòng mô tả rõ ràng vấn đề bạn gặp phải."
                        disabled={isSubmitting || success}
                    />
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/resident/report/list')}
                    disabled={isSubmitting}
                >
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmitReport}
                    disabled={isSubmitting || success}
                >
                    {isSubmitting ? <CircularProgress size={24} /> : 'Gửi Báo Cáo'}
                </Button>
            </Box>
        </Paper>
    );
}
