// src/pages/BOD/NotificationManagement/NotificationCreate.tsx
import {
  Box,
  Typography,
  Grid,
  Card,
  TextField,
  Button,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  MenuItem,
  Select,
  InputLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../../../api/notificationApi';
import { residentApi, type Resident } from '../../../api/residentApi';

export default function NotificationCreate() {
  const navigate = useNavigate();
  const [targetType, setTargetType] = useState('all_residents');
  const [targetValue] = useState<string>('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [typeLabel, setTypeLabel] = useState('Chung');

  const [selectedResidents, setSelectedResidents] = useState<Resident[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const data = await residentApi.getAll();
      setResidents(data);
    } catch (err) {
      console.error("Failed to fetch residents", err);
    }
  };

  const handleSendNotification = async () => {
    setError(null);
    if (!title || !content) {
      setError("Vui lòng nhập tiêu đề và nội dung.");
      return;
    }

    // Validate schedule time if enabled
    if (scheduleEnabled) {
      if (!scheduledAt) {
        setError("Vui lòng chọn thời gian hẹn lịch gửi.");
        return;
      }
      const scheduleDate = new Date(scheduledAt);
      if (scheduleDate <= new Date()) {
        setError("Thời gian hẹn lịch phải ở tương lai.");
        return;
      }
    }

    let target = 'Tất cả Cư dân';

    // Logic mapping basic
    if (targetType === 'specific_users') {
      if (selectedResidents.length === 0) {
        setError("Vui lòng chọn ít nhất một cư dân.");
        return;
      }
      target = 'Cá nhân';
    }

    setLoading(true);

    try {
      const sendNoti = async (recipientId?: string) => {
        // Send as JSON instead of FormData (no files anymore)
        const payload: any = {
          title,
          content,
          type_id: typeLabel === 'Chung' ? 1 : (typeLabel === 'Thu phí' ? 2 : 3),
          target,
        };

        if (recipientId) {
          payload.specific_recipient_id = recipientId;
        }
        if (targetValue) {
          payload.target_value = targetValue;
        }

        // FIX: Send scheduled_at as local datetime string (not UTC)
        if (scheduleEnabled && scheduledAt) {
          // scheduledAt from datetime-local is already in format "YYYY-MM-DDTHH:mm"
          // Convert to MySQL datetime format: "YYYY-MM-DD HH:mm:ss"
          payload.scheduled_at = scheduledAt.replace('T', ' ') + ':00';
        }

        await notificationApi.create(payload);
      }

      if (targetType === 'specific_users') {
        // Loop send if multiple (since backend might limit to 1)
        for (const res of selectedResidents) {
          await sendNoti(res.id);
        }
      } else {
        await sendNoti();
      }

      const successMsg = scheduleEnabled
        ? `Đã lên lịch gửi thông báo vào ${new Date(scheduledAt).toLocaleString('vi-VN')}!`
        : 'Gửi thông báo thành công!';
      alert(successMsg);
      navigate('/bod/notification/list');

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi thông báo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Soạn Thông Báo Mới
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Tiêu đề thông báo"
                  fullWidth
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Loại thông báo</InputLabel>
                  <Select
                    label="Loại thông báo"
                    value={typeLabel}
                    onChange={(e) => setTypeLabel(e.target.value)}
                  >
                    <MenuItem value="Chung">Chung</MenuItem>
                    <MenuItem value="Thu phí">Thu phí</MenuItem>
                    <MenuItem value="Khẩn cấp">Khẩn cấp</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Nội dung"
                  fullWidth
                  required
                  multiline
                  rows={10}
                  helperText="Nhập nội dung chi tiết của thông báo tại đây."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </Grid>

            </Grid>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 'bold' }}>Đối tượng gửi</FormLabel>
              <RadioGroup
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
              >
                <FormControlLabel
                  value="all_residents"
                  control={<Radio />}
                  label="Tất cả Cư dân"
                />

                <FormControlLabel
                  value="specific_users"
                  control={<Radio />}
                  label="Cư dân cụ thể"
                />
              </RadioGroup>
            </FormControl>

            {targetType === 'specific_users' && (
              <Box sx={{ mt: 2 }}>
                <Autocomplete
                  multiple
                  options={residents}
                  getOptionLabel={(option) => `${option.full_name} (${option.apartment_id || option.apartment_code || 'Chưa rõ'})`}
                  onChange={(_, newValue) => setSelectedResidents(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tìm kiếm Cư dân"
                      placeholder="Chọn một hoặc nhiều..."
                    />
                  )}
                />
              </Box>
            )}
          </Card>

          <Card sx={{ p: 3, mt: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 'bold' }}>Hẹn lịch gửi</FormLabel>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                  />
                }
                label="Gửi theo lịch"
              />

              {scheduleEnabled && (
                <TextField
                  type="datetime-local"
                  fullWidth
                  sx={{ mt: 1 }}
                  InputLabelProps={{ shrink: true }}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  helperText="Thông báo sẽ được gửi vào thời gian này"
                />
              )}
            </FormControl>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        mt: 3
      }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSendNotification}
          disabled={loading}
        >
          {loading ? 'Đang gửi...' : (scheduleEnabled ? 'Lên lịch gửi' : 'Gửi thông báo')}
        </Button>
      </Box>
    </Paper>
  );
}

