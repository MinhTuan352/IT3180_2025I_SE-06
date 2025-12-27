// src/pages/BOD/ResidentManagement/ResidentProfile.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Avatar,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  type SelectChangeEvent,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { residentApi, type Resident } from '../../../api/residentApi';
import { apartmentApi, type Apartment } from '../../../api/apartmentApi';
import { vehicleApi, type Vehicle } from '../../../api/vehicleApi';
import { profileEditRequestApi, type ProfileEditRequest } from '../../../api/profileEditRequestApi';

export default function ResidentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<Resident | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [changeHistory, setChangeHistory] = useState<any[]>([]);
  const [editRequests, setEditRequests] = useState<ProfileEditRequest[]>([]);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch resident, apartments, vehicles and edit requests in parallel
        const [resResponse, aptsData, vehiclesData, historyData, requestsResponse] = await Promise.all([
          residentApi.getById(id),
          apartmentApi.getAll(),
          vehicleApi.getVehiclesByResidentId(id),
          residentApi.getResidentChangeHistory(id),
          profileEditRequestApi.getRequestsByResidentId(id)
        ]);

        // Handle response structure
        const data = (resResponse as any).data || resResponse;
        setUserData(data);
        setApartments(aptsData);
        setVehicles(vehiclesData);
        setChangeHistory(historyData);
        setEditRequests(requestsResponse.data);
        setPendingRequestCount(requestsResponse.pendingCount);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin cư dân.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (field: keyof Resident) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!userData) return;
    setUserData({ ...userData, [field]: e.target.value });
  };

  const handleSelectChange = (field: keyof Resident) => (e: SelectChangeEvent) => {
    if (!userData) return;
    setUserData({ ...userData, [field]: e.target.value });
  };

  // Helper formatting Date for Input (YYYY-MM-DD)
  // Fix timezone: MySQL trả về date dạng "1979-12-29T17:00:00.000Z" (UTC)
  // Khi browser parse, nó chuyển về local time, có thể lùi 1 ngày
  const formatDateForInput = (isoDate?: string) => {
    if (!isoDate) return '';
    try {
      // Nếu là ISO string với time component (có chữ T), chỉ lấy phần date TRƯỚC chữ T
      // Đây là date gốc từ database, không bị ảnh hưởng timezone
      if (isoDate.includes('T')) {
        return isoDate.split('T')[0];
      }
      // Nếu đã là YYYY-MM-DD thì return luôn
      if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
        return isoDate;
      }
      // Fallback: Nếu là date object string, thử parse khác
      // Tránh dùng new Date() vì sẽ bị timezone shift
      return '';
    } catch (e) {
      return '';
    }
  };

  const handleUpdateResident = async () => {
    if (!id || !userData) return;

    setSaving(true);
    try {
      await residentApi.update(id, userData);
      setSnackbar({ open: true, message: 'Cập nhật thành công!', severity: 'success' });
    } catch (err: any) {
      console.error('Error updating resident:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Không thể cập nhật. Vui lòng thử lại.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResident = async () => {
    if (!id) return;

    if (!window.confirm('Bạn có chắc chắn muốn xóa cư dân này?')) return;

    try {
      await residentApi.delete(id);
      setSnackbar({ open: true, message: 'Đã xóa cư dân!', severity: 'success' });
      setTimeout(() => navigate('/bod/resident/list'), 1500);
    } catch (err: any) {
      console.error('Error deleting resident:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Không thể xóa cư dân.',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (!userData) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Alert severity="warning">Không tìm thấy thông tin cư dân với ID: {id}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Hồ sơ Cư dân
      </Typography>

      <Grid container spacing={3}>
        {/* CỘT BÊN TRÁI: Avatar và ID */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <Avatar sx={{ width: 120, height: 120, mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}>
              {userData.full_name?.charAt(0) || '?'}
            </Avatar>
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
              {userData.full_name}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Căn hộ: {userData.apartment_code || 'N/A'}
            </Typography>
          </Card>
        </Grid>

        {/* CỘT BÊN PHẢI: Form điền thông tin */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Họ và tên"
                  fullWidth
                  value={userData.full_name || ''}
                  onChange={handleChange('full_name')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Căn hộ</InputLabel>
                  <Select
                    label="Căn hộ"
                    value={String(userData.apartment_id) || ''}
                    onChange={handleSelectChange('apartment_id' as any)}
                  >
                    {apartments.map(apt => (
                      <MenuItem key={apt.id} value={String(apt.id)}>
                        {apt.apartment_code}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Ngày sinh"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formatDateForInput(userData.dob)}
                  onChange={handleChange('dob')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Giới tính</InputLabel>
                  <Select
                    label="Giới tính"
                    value={userData.gender || ''}
                    onChange={handleSelectChange('gender')}
                  >
                    <MenuItem value="Nam">Nam</MenuItem>
                    <MenuItem value="Nữ">Nữ</MenuItem>
                    <MenuItem value="Khác">Khác</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Quê quán"
                  fullWidth
                  value={userData.hometown || ''}
                  onChange={handleChange('hometown')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nghề nghiệp"
                  fullWidth
                  value={userData.occupation || ''}
                  onChange={handleChange('occupation')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="CCCD"
                  fullWidth
                  value={userData.cccd || ''}
                  onChange={handleChange('cccd')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Số điện thoại"
                  fullWidth
                  value={userData.phone || ''}
                  onChange={handleChange('phone')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={userData.email || ''}
                  onChange={handleChange('email')}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  Thông tin Cư trú & Tài khoản
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Quyền hạn</InputLabel>
                  <Select
                    label="Quyền hạn"
                    value={userData.role || ''}
                    onChange={handleSelectChange('role')}
                  >
                    <MenuItem value="owner">Chủ hộ</MenuItem>
                    <MenuItem value="member">Thành viên</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tình trạng</InputLabel>
                  <Select
                    label="Tình trạng"
                    value={userData.status || ''}
                    onChange={handleSelectChange('status')}
                  >
                    <MenuItem value="Đang sinh sống">Đang sinh sống</MenuItem>
                    <MenuItem value="Đã chuyển đi">Đã chuyển đi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Trạng thái Tài khoản (Không phụ thuộc role) */}
              <Grid size={{ xs: 12 }}>
                {userData.user_id ? (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    ✅ Có tài khoản đăng nhập | User ID: {userData.user_id}
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    ⚠️ Chưa có tài khoản đăng nhập - Điền username và mật khẩu bên dưới để tạo
                  </Alert>
                )}
              </Grid>

              {/* Username và Password fields */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={userData.user_id ? "Tên đăng nhập" : "Tên đăng nhập mới"}
                  fullWidth
                  value={(userData as any).username || (userData as any).account_username || ''}
                  onChange={(e) => setUserData({ ...userData, username: e.target.value } as any)}
                  helperText={userData.user_id ? "Để trống nếu không muốn đổi" : "Nhập để tạo tài khoản mới"}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={userData.user_id ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
                  type="password"
                  fullWidth
                  value={(userData as any).password || ''}
                  onChange={(e) => setUserData({ ...userData, password: e.target.value } as any)}
                  helperText={userData.user_id ? "Chỉ nhập nếu muốn đổi mật khẩu" : "Mật khẩu cho tài khoản mới"}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* Section: Phương tiện */}
      <Card sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Phương tiện đăng ký
        </Typography>
        {vehicles.length === 0 ? (
          <Alert severity="info">Cư dân chưa đăng ký phương tiện nào.</Alert>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Loại xe</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Biển số</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Hãng / Model</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {v.vehicle_type === 'Ô tô' ? '🚗' : '🏍️'} {v.vehicle_type}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                      {v.license_plate}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {v.brand || 'N/A'} {v.model ? `- ${v.model}` : ''}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <Box component="span" sx={{
                        px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.85rem',
                        bgcolor: v.status === 'Đang sử dụng' ? '#e8f5e9' : v.status === 'Chờ duyệt' ? '#fff3e0' : '#f5f5f5',
                        color: v.status === 'Đang sử dụng' ? '#2e7d32' : v.status === 'Chờ duyệt' ? '#e65100' : '#666'
                      }}>
                        {v.status}
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Card>

      {/* Section: Lịch sử thay đổi */}
      <Card sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Lịch sử thay đổi thông tin
        </Typography>
        {changeHistory.length === 0 ? (
          <Alert severity="info">Chưa có lịch sử thay đổi.</Alert>
        ) : (
          <Box sx={{ overflowX: 'auto', maxHeight: 300, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', width: '150px' }}>Thời gian</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', width: '120px' }}>Người thực hiện</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', width: '100px' }}>Hành động</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Chi tiết thay đổi</th>
                </tr>
              </thead>
              <tbody>
                {changeHistory.map((log, idx) => {
                  // Tạo danh sách các trường đã thay đổi
                  const hiddenFields = ['password', 'user_id', 'created_at', 'updated_at', 'apartment_code', 'history'];
                  const fieldLabels: Record<string, string> = {
                    full_name: 'Họ tên', phone: 'SĐT', email: 'Email', dob: 'Ngày sinh',
                    gender: 'Giới tính', cccd: 'CCCD', hometown: 'Quê quán', occupation: 'Nghề nghiệp',
                    role: 'Vai trò', status: 'Trạng thái', apartment_id: 'Căn hộ',
                    relationship_with_owner: 'Quan hệ với chủ hộ', identity_date: 'Ngày cấp CCCD'
                  };

                  // Format giá trị - đặc biệt xử lý date không bị lệch timezone
                  const formatValue = (val: any, key: string): string => {
                    if (val === null || val === undefined) return '(trống)';
                    // Nếu là date field (dob, identity_date) hoặc chuỗi giống date YYYY-MM-DD
                    if ((key === 'dob' || key === 'identity_date') && typeof val === 'string') {
                      // Nếu có chứa T (ISO string), lấy phần date
                      if (val.includes('T')) {
                        const [datePart] = val.split('T');
                        const [y, m, d] = datePart.split('-');
                        return `${d}/${m}/${y}`;
                      }
                      // Nếu đã là YYYY-MM-DD
                      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                        const [y, m, d] = val.split('-');
                        return `${d}/${m}/${y}`;
                      }
                    }
                    return String(val);
                  };

                  const changes: { field: string; oldVal: string; newVal: string }[] = [];
                  if (log.old_values && log.new_values && log.action_type === 'UPDATE') {
                    Object.keys(log.new_values).forEach(key => {
                      if (!hiddenFields.includes(key) && log.old_values[key] !== log.new_values[key]) {
                        changes.push({
                          field: fieldLabels[key] || key,
                          oldVal: formatValue(log.old_values[key], key),
                          newVal: formatValue(log.new_values[key], key)
                        });
                      }
                    });
                  }

                  return (
                    <tr key={log.id || idx}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                        {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : 'N/A'}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        {log.actor_name || 'Hệ thống'}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <Box component="span" sx={{
                          px: 1, py: 0.5, borderRadius: 1, fontSize: '0.8rem',
                          bgcolor: log.action_type === 'CREATE' ? '#e3f2fd' : log.action_type === 'UPDATE' ? '#fff3e0' : '#ffebee',
                          color: log.action_type === 'CREATE' ? '#1565c0' : log.action_type === 'UPDATE' ? '#e65100' : '#c62828'
                        }}>
                          {log.action_type === 'CREATE' ? 'Tạo mới' : log.action_type === 'UPDATE' ? 'Cập nhật' : 'Xóa'}
                        </Box>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '0.85rem' }}>
                        {log.action_type === 'CREATE' ? (
                          <span style={{ color: '#1565c0' }}>Tạo hồ sơ cư dân mới</span>
                        ) : log.action_type === 'DELETE' ? (
                          <span style={{ color: '#c62828' }}>Xóa hồ sơ cư dân</span>
                        ) : changes.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {changes.slice(0, 5).map((c, i) => (
                              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                <strong>{c.field}:</strong>
                                <span style={{ color: '#c62828', textDecoration: 'line-through' }}>{String(c.oldVal)}</span>
                                <span>→</span>
                                <span style={{ color: '#2e7d32', fontWeight: 500 }}>{String(c.newVal)}</span>
                              </Box>
                            ))}
                            {changes.length > 5 && <span style={{ color: '#666' }}>... và {changes.length - 5} thay đổi khác</span>}
                          </Box>
                        ) : (
                          <span style={{ color: '#999' }}>Không có thay đổi rõ ràng</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        )}
      </Card>

      {/* Section: Yêu cầu chỉnh sửa từ cư dân */}
      <Card sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Yêu cầu chỉnh sửa thông tin
        </Typography>
        {editRequests.length === 0 ? (
          <Alert severity="info">Không có yêu cầu chỉnh sửa nào.</Alert>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Ngày gửi</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nội dung yêu cầu</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Lý do</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Trạng thái</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {editRequests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                      {req.created_at ? new Date(req.created_at).toLocaleString('vi-VN') : ''}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '0.85rem' }}>
                      {Object.entries(req.requested_changes || {}).map(([key, val]) => (
                        <div key={key}><strong>{key}:</strong> {String(val)}</div>
                      ))}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee', color: '#666' }}>
                      {req.reason || '-'}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                      <Box component="span" sx={{
                        px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.85rem',
                        bgcolor: req.status === 'Đã duyệt' ? '#e8f5e9' : req.status === 'Chờ duyệt' ? '#fff3e0' : '#ffebee',
                        color: req.status === 'Đã duyệt' ? '#2e7d32' : req.status === 'Chờ duyệt' ? '#e65100' : '#c62828'
                      }}>
                        {req.status}
                      </Box>
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                      {req.status === 'Chờ duyệt' ? (
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={async () => {
                              try {
                                await profileEditRequestApi.updateRequestStatus(req.id, 'Đã duyệt');
                                setSnackbar({ open: true, message: 'Đã duyệt và cập nhật thông tin!', severity: 'success' });
                                // Reload data
                                const newData = await profileEditRequestApi.getRequestsByResidentId(id!);
                                setEditRequests(newData.data);
                                setPendingRequestCount(newData.pendingCount);
                                // Reload profile to show updated info
                                const resResponse = await residentApi.getById(id!);
                                setUserData((resResponse as any).data || resResponse);
                              } catch (err: any) {
                                setSnackbar({ open: true, message: err.response?.data?.message || 'Có lỗi xảy ra.', severity: 'error' });
                              }
                            }}
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={async () => {
                              const note = prompt('Nhập lý do từ chối (tùy chọn):');
                              try {
                                await profileEditRequestApi.updateRequestStatus(req.id, 'Từ chối', note || undefined);
                                setSnackbar({ open: true, message: 'Đã từ chối yêu cầu.', severity: 'success' });
                                const newData = await profileEditRequestApi.getRequestsByResidentId(id!);
                                setEditRequests(newData.data);
                                setPendingRequestCount(newData.pendingCount);
                              } catch (err: any) {
                                setSnackbar({ open: true, message: err.response?.data?.message || 'Có lỗi xảy ra.', severity: 'error' });
                              }
                            }}
                          >
                            Từ chối
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {req.processed_by_name && `Bởi: ${req.processed_by_name}`}
                        </Typography>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDeleteResident}
        >
          Xóa cư dân
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/bod/resident/list')}
          >
            Quay lại
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleUpdateResident}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {saving ? 'Đang lưu...' : 'Cập nhật'}
          </Button>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}