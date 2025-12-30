import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack
} from '@mui/material';
import { useState, useEffect } from 'react';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import toast from 'react-hot-toast';
import visitorApi, { type Visitor } from '../../../api/visitorApi';

export default function ResidentVisitorRegistration() {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        visitor_name: '',
        visitor_id_card: '',
        expected_arrival: '',
        expected_departure: '',
        purpose: '',
    });

    const fetchVisitors = async () => {
        try {
            const res = await visitorApi.getAll();
            if (res.data && res.data.success) {
                setVisitors(res.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải danh sách khách.');
        }
    };

    useEffect(() => {
        fetchVisitors();
    }, []);

    const handleRegister = async () => {
        try {
            if (!formData.visitor_name || !formData.expected_arrival) {
                toast.error('Vui lòng nhập tên khách và thời gian đến.');
                return;
            }

            await visitorApi.register(formData);
            toast.success('Đăng ký khách thành công!');
            setOpen(false);
            setFormData({
                visitor_name: '',
                visitor_id_card: '',
                expected_arrival: '',
                expected_departure: '',
                purpose: '',
            });
            fetchVisitors();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Đăng ký thất bại.');
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'Đăng ký': return 'info';
            case 'Đã vào': return 'success';
            case 'Đã ra': return 'default';
            case 'Hủy': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    Đăng ký Khách ra vào
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => setOpen(true)}
                >
                    Đăng ký mới
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Tên khách</strong></TableCell>
                            <TableCell><strong>CCCD/CMND</strong></TableCell>
                            <TableCell><strong>Dự kiến đến</strong></TableCell>
                            <TableCell><strong>Mục đích</strong></TableCell>
                            <TableCell align="center"><strong>Trạng thái</strong></TableCell>
                            <TableCell align="center"><strong>Thực tế</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visitors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    Chưa có lịch sử đăng ký khách nào.
                                </TableCell>
                            </TableRow>
                        ) : (
                            visitors.map((v) => (
                                <TableRow key={v.id} hover>
                                    <TableCell>{v.visitor_name}</TableCell>
                                    <TableCell>{v.visitor_id_card || '---'}</TableCell>
                                    <TableCell>
                                        {v.expected_arrival ? new Date(v.expected_arrival).toLocaleString('vi-VN') : '---'}
                                    </TableCell>
                                    <TableCell>{v.purpose || '---'}</TableCell>
                                    <TableCell align="center">
                                        <Chip label={v.status} color={statusColor(v.status) as any} size="small" />
                                    </TableCell>
                                    <TableCell align="center">
                                        {v.check_in_time ? (
                                            <Typography variant="caption" display="block">
                                                Vào: {new Date(v.check_in_time).toLocaleTimeString('vi-VN')}
                                            </Typography>
                                        ) : '-'}
                                        {v.check_out_time && (
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                Ra: {new Date(v.check_out_time).toLocaleTimeString('vi-VN')}
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog Đăng ký */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Đăng ký Khách đến thăm</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Họ tên khách *"
                            fullWidth
                            value={formData.visitor_name}
                            onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                        />
                        <TextField
                            label="CCCD/CMND (Nếu có)"
                            fullWidth
                            value={formData.visitor_id_card}
                            onChange={(e) => setFormData({ ...formData, visitor_id_card: e.target.value })}
                        />
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Thời gian dự kiến đến *"
                                type="datetime-local"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.expected_arrival}
                                onChange={(e) => setFormData({ ...formData, expected_arrival: e.target.value })}
                            />
                            <TextField
                                label="Thời gian dự kiến ra"
                                type="datetime-local"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.expected_departure}
                                onChange={(e) => setFormData({ ...formData, expected_departure: e.target.value })}
                            />
                        </Stack>
                        <TextField
                            label="Mục đích / Ghi chú"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleRegister}>
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
