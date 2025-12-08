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
  Chip,
  Stack,
  Alert,
} from '@mui/material';
import { useState, type ChangeEvent, useRef, useEffect } from 'react';
import UploadFileIcon from '@mui/icons-material/UploadFile';
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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);

        let tId = 1;
        if (typeLabel === 'Thu phí') tId = 2;
        if (typeLabel === 'Khẩn cấp') tId = 3;

        formData.append('type_id', tId.toString());
        formData.append('target', target);

        if (recipientId) {
          formData.append('specific_recipient_id', recipientId);
        }
        if (targetValue) formData.append('target_value', targetValue);

        if (selectedFiles.length > 0) {
          selectedFiles.forEach((file) => {
            formData.append('attachments', file);
          });
        }

        await notificationApi.create(formData);
      }

      if (targetType === 'specific_users') {
        // Loop send if multiple (since backend might limit to 1)
        for (const res of selectedResidents) {
          await sendNoti(res.id);
        }
      } else {
        await sendNoti();
      }

      alert('Gửi thông báo thành công!');
      navigate('/bod/notification/list');

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files!)]);
    }
    e.target.value = '';
  };

  const handleFileDelete = (fileToDelete: File) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file !== fileToDelete));
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Soạn Thông Báo Mới
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: 'none' }}
        multiple
        accept="image/*, application/pdf, .doc, .docx, .xls, .xlsx"
      />

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

              <Grid size={{ xs: 12 }}>
                <Button
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  onClick={handleFileSelectClick}
                >
                  Đính kèm file/ảnh
                </Button>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                  {selectedFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => handleFileDelete(file)}
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </Stack>
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
          {loading ? 'Đang gửi...' : 'Gửi thông báo'}
        </Button>
      </Box>
    </Paper>
  );
}
