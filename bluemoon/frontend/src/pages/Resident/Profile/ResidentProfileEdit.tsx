// src/pages/Resident/Profile/ResidentProfileEdit.tsx
import { Typography, Paper, Grid, TextField, Button, Avatar, Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel, Card, Box, Modal, Snackbar } from '@mui/material';
import { useState, useEffect } from 'react';
import { residentApi, type Resident } from '../../../api/residentApi';
import { profileEditRequestApi, type ProfileEditRequest } from '../../../api/profileEditRequestApi';

export default function ResidentProfileEdit() {
    // State cho dữ liệu profile
    const [profileData, setProfileData] = useState<Resident | null>(null);
    const [editRequests, setEditRequests] = useState<ProfileEditRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    // State cho modal yêu cầu chỉnh sửa
    const [openModal, setOpenModal] = useState(false);
    const [editFormData, setEditFormData] = useState<Record<string, string>>({});
    const [editReason, setEditReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success'
    });

    // State cho form (các trường được phép sửa)
    const [formData, setFormData] = useState({
        phone: '',
        email: '',
        hometown: '',
        occupation: ''
    });



    // Fetch dữ liệu khi component mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await residentApi.getMyProfile();
            setProfileData(data);
            // Khởi tạo form data từ dữ liệu nhận được
            setFormData({
                phone: data.phone || '',
                email: data.email || '',
                hometown: data.hometown || '',
                occupation: data.occupation || ''
            });

            // Fetch edit requests
            const requestsData = await profileEditRequestApi.getMyRequests();
            setEditRequests(requestsData);
        } catch (err: any) {
            console.error('Error fetching profile:', err);
            setError(err.response?.data?.message || 'Không thể tải thông tin cá nhân. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };





    // Hiển thị loading
    if (loading) {
        return (
            <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Paper>
        );
    }

    // Hiển thị lỗi
    if (error) {
        return (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="contained" onClick={fetchProfile}>
                    Thử lại
                </Button>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Thông tin Cá nhân
            </Typography>
            <Grid container spacing={3}>
                {/* Avatar Column */}
                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'center' }}>
                    <Avatar
                        sx={{ width: 120, height: 120, mb: 2, margin: 'auto', bgcolor: 'primary.main', fontSize: '3rem' }}
                    >
                        {profileData?.full_name?.charAt(0) || 'U'}
                    </Avatar>
                    {/* Avatar change button removed */}
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        {profileData?.full_name || 'Chưa có tên'}
                    </Typography>
                    <Typography color="text.secondary">
                        Căn hộ: {profileData?.apartment_code || 'N/A'}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        {profileData?.role === 'owner' ? 'Chủ hộ' : 'Thành viên'}
                    </Typography>
                </Grid>

                {/* Info Column */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Grid container spacing={2}>
                        {/* Các trường KHÔNG được sửa */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Họ và tên"
                                fullWidth
                                value={profileData?.full_name || ''}
                                InputProps={{ readOnly: true }}
                                helperText="Liên hệ BQL để thay đổi thông tin này."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Ngày sinh"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={profileData?.dob ? new Date(profileData.dob).toISOString().split('T')[0] : ''}
                                InputProps={{ readOnly: true }}
                                helperText="Liên hệ BQL để thay đổi."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Giới tính</InputLabel>
                                <Select
                                    value={profileData?.gender || ''}
                                    label="Giới tính"
                                    inputProps={{ readOnly: true }}
                                >
                                    <MenuItem value="Nam">Nam</MenuItem>
                                    <MenuItem value="Nữ">Nữ</MenuItem>
                                    <MenuItem value="Khác">Khác</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Các trường ĐƯỢC sửa */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Số điện thoại"
                                fullWidth
                                name="phone"
                                value={formData.phone}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Email"
                                type="email"
                                fullWidth
                                name="email"
                                value={formData.email}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Quê quán"
                                fullWidth
                                name="hometown"
                                value={formData.hometown}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Nghề nghiệp"
                                fullWidth
                                name="occupation"
                                value={formData.occupation}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        {/* Trường KHÔNG được sửa */}
                        <Grid size={12}>
                            <TextField
                                label="CCCD"
                                fullWidth
                                value={profileData?.cccd || ''}
                                InputProps={{ readOnly: true }}
                                helperText="Liên hệ BQL để thay đổi thông tin này."
                            />
                        </Grid>

                        {/* Thông tin Cư trú & Tài khoản */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                                Thông tin Cư trú & Tài khoản
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Quyền hạn"
                                fullWidth
                                value={profileData?.role === 'owner' ? 'Chủ hộ' : 'Thành viên'}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Tình trạng cư trú"
                                fullWidth
                                value={profileData?.status || 'Đang sinh sống'}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Alert severity={profileData?.user_id ? "success" : "warning"} sx={{ mt: 1 }}>
                                {profileData?.user_id
                                    ? `✅ Có tài khoản đăng nhập | User ID: ${profileData.user_id}`
                                    : '⚠️ Chưa có tài khoản đăng nhập'
                                }
                            </Alert>
                        </Grid>
                        {profileData?.user_id && (
                            <>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Tên đăng nhập"
                                        fullWidth
                                        value={(profileData as any).account_username || ''}
                                        InputProps={{ readOnly: true }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Mật khẩu"
                                        type="password"
                                        fullWidth
                                        value="********"
                                        InputProps={{ readOnly: true }}
                                        helperText="Liên hệ BQL để đổi mật khẩu"
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                </Grid>
            </Grid>

            {/* Save button removed */}

            {/* Nút yêu cầu chỉnh sửa */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button variant="contained" color="primary" onClick={() => setOpenModal(true)}>
                    Yêu cầu chỉnh sửa thông tin
                </Button>
            </Box>

            {/* Section: Lịch sử yêu cầu */}
            <Card sx={{ mt: 3, p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Yêu cầu chỉnh sửa của tôi
                </Typography>
                {editRequests.length === 0 ? (
                    <Alert severity="info">Bạn chưa gửi yêu cầu chỉnh sửa nào.</Alert>
                ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Ngày gửi</th>
                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nội dung</th>
                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {editRequests.map((req) => (
                                    <tr key={req.id}>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                                            {req.created_at ? new Date(req.created_at).toLocaleDateString('vi-VN') : ''}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '0.85rem' }}>
                                            {Object.entries(req.requested_changes || {}).map(([key, val]) => (
                                                <div key={key}><strong>{key}:</strong> {String(val)}</div>
                                            ))}
                                            {req.reason && <div style={{ color: '#666', marginTop: 4 }}>Lý do: {req.reason}</div>}
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                )}
            </Card>

            {/* Modal yêu cầu chỉnh sửa */}
            <Modal open={openModal} onClose={() => setOpenModal(false)}>
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: { xs: '95%', sm: 500 }, bgcolor: 'background.paper', borderRadius: 2,
                    boxShadow: 24, p: 4, maxHeight: '90vh', overflow: 'auto'
                }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Yêu cầu chỉnh sửa thông tin
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Chỉ điền các trường bạn muốn thay đổi. Giá trị hiện tại được hiển thị làm placeholder.
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid size={12}>
                            <TextField
                                label="Họ và tên mới"
                                fullWidth
                                placeholder={profileData?.full_name || ''}
                                value={editFormData.full_name || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                label="Ngày sinh mới"
                                fullWidth
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={editFormData.dob || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                            />
                        </Grid>
                        <Grid size={6}>
                            <FormControl fullWidth>
                                <InputLabel>Giới tính mới</InputLabel>
                                <Select
                                    value={editFormData.gender || ''}
                                    label="Giới tính mới"
                                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                                >
                                    <MenuItem value="">-- Không thay đổi --</MenuItem>
                                    <MenuItem value="Nam">Nam</MenuItem>
                                    <MenuItem value="Nữ">Nữ</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Số điện thoại mới"
                                fullWidth
                                placeholder={profileData?.phone || ''}
                                value={editFormData.phone || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Email mới"
                                fullWidth
                                placeholder={profileData?.email || ''}
                                value={editFormData.email || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Quê quán mới"
                                fullWidth
                                placeholder={profileData?.hometown || ''}
                                value={editFormData.hometown || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, hometown: e.target.value })}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Nghề nghiệp mới"
                                fullWidth
                                placeholder={profileData?.occupation || ''}
                                value={editFormData.occupation || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, occupation: e.target.value })}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="CCCD mới"
                                fullWidth
                                placeholder={profileData?.cccd || ''}
                                value={editFormData.cccd || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, cccd: e.target.value })}
                            />
                        </Grid>

                        {/* 3 trường mới: Quyền hạn, Tình trạng, Tài khoản */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                                Yêu cầu thay đổi Quyền hạn / Tài khoản
                            </Typography>
                        </Grid>
                        <Grid size={6}>
                            <FormControl fullWidth>
                                <InputLabel>Quyền hạn mới</InputLabel>
                                <Select
                                    value={editFormData.role || ''}
                                    label="Quyền hạn mới"
                                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                >
                                    <MenuItem value="">-- Không thay đổi --</MenuItem>
                                    <MenuItem value="owner">Chủ hộ</MenuItem>
                                    <MenuItem value="member">Thành viên</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={6}>
                            <FormControl fullWidth>
                                <InputLabel>Tình trạng mới</InputLabel>
                                <Select
                                    value={editFormData.status || ''}
                                    label="Tình trạng mới"
                                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                >
                                    <MenuItem value="">-- Không thay đổi --</MenuItem>
                                    <MenuItem value="Đang sinh sống">Đang sinh sống</MenuItem>
                                    <MenuItem value="Đã chuyển đi">Đã chuyển đi</MenuItem>
                                    <MenuItem value="Tạm vắng">Tạm vắng</MenuItem>
                                    <MenuItem value="Tạm trú">Tạm trú</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                label="Tên đăng nhập mới"
                                fullWidth
                                placeholder={(profileData as any)?.account_username || 'Chưa có tài khoản'}
                                value={editFormData.username || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                                helperText="Yêu cầu đổi username"
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                label="Mật khẩu mới"
                                type="password"
                                fullWidth
                                value={editFormData.password || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                helperText="Yêu cầu đổi mật khẩu"
                            />
                        </Grid>

                        <Grid size={12}>
                            <TextField
                                label="Lý do yêu cầu"
                                fullWidth
                                multiline
                                rows={2}
                                value={editReason}
                                onChange={(e) => setEditReason(e.target.value)}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={() => setOpenModal(false)}>Hủy</Button>
                        <Button
                            variant="contained"
                            disabled={submitting}
                            onClick={async () => {
                                // Filter only filled fields
                                const changes: Record<string, string> = {};
                                Object.entries(editFormData).forEach(([k, v]) => {
                                    if (v && v.trim()) changes[k] = v.trim();
                                });

                                if (Object.keys(changes).length === 0) {
                                    setSnackbar({ open: true, message: 'Vui lòng nhập ít nhất 1 thông tin cần thay đổi.', severity: 'error' });
                                    return;
                                }

                                try {
                                    setSubmitting(true);
                                    await profileEditRequestApi.createRequest({
                                        requested_changes: changes,
                                        reason: editReason || undefined
                                    });
                                    setSnackbar({ open: true, message: 'Đã gửi yêu cầu thành công!', severity: 'success' });
                                    setOpenModal(false);
                                    setEditFormData({});
                                    setEditReason('');
                                    // Reload requests
                                    const newRequests = await profileEditRequestApi.getMyRequests();
                                    setEditRequests(newRequests);
                                } catch (err: any) {
                                    setSnackbar({ open: true, message: err.response?.data?.message || 'Có lỗi xảy ra.', severity: 'error' });
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                        >
                            {submitting ? <CircularProgress size={20} /> : 'Gửi yêu cầu'}
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

        </Paper>
    );
}