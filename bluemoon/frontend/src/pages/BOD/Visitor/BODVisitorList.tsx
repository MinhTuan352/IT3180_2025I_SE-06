import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Tooltip, Avatar, TextField, InputAdornment
} from '@mui/material';
import { useState, useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Check-in
import LogoutIcon from '@mui/icons-material/Logout'; // Check-out
import SearchIcon from '@mui/icons-material/Search';
import toast from 'react-hot-toast';
import visitorApi, { type Visitor } from '../../../api/visitorApi';

export default function BODVisitorList({ readOnly = false }: { readOnly?: boolean }) {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchVisitors = async () => {
        try {
            const res = await visitorApi.getAll();
            if (res.data && res.data.success) {
                setVisitors(res.data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchVisitors();
    }, []);

    const handleCheckIn = async (id: number) => {
        if (window.confirm('Xác nhận khách đã đến?')) {
            try {
                await visitorApi.checkIn({ id });
                toast.success('Check-in thành công!');
                fetchVisitors();
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Lỗi check-in');
            }
        }
    };

    const handleCheckOut = async (id: number) => {
        if (window.confirm('Xác nhận khách đã rời đi?')) {
            try {
                await visitorApi.checkOut(id);
                toast.success('Check-out thành công!');
                fetchVisitors();
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Lỗi check-out');
            }
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'Đăng ký': return 'info';
            case 'Đã vào': return 'success';
            case 'Đã ra': return 'default';
            default: return 'warning';
        }
    };

    const filtered = visitors.filter(v =>
        v.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.apartment_code && v.apartment_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Quản lý Khách ra vào</Typography>
                <TextField
                    placeholder="Tìm kiếm khách/căn hộ..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                    }}
                    sx={{ width: 300 }}
                />
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Căn hộ</strong></TableCell>
                            <TableCell><strong>Tên khách</strong></TableCell>
                            <TableCell><strong>Dự kiến đến</strong></TableCell>
                            <TableCell align="center"><strong>Trạng thái</strong></TableCell>
                            <TableCell align="center"><strong>Thực tế</strong></TableCell>
                            <TableCell align="center"><strong>Thao tác</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.map((v) => (
                            <TableRow key={v.id} hover>
                                <TableCell>
                                    <Chip label={v.apartment_code || 'N/A'} size="small" variant="outlined" />
                                    <Typography variant="caption" display="block" color="text.secondary">
                                        {v.resident_name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ width: 30, height: 30, mr: 1, fontSize: '0.875rem' }}>
                                            {v.visitor_name[0]}
                                        </Avatar>
                                        {v.visitor_name}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {v.expected_arrival ? new Date(v.expected_arrival).toLocaleString('vi-VN') : '---'}
                                </TableCell>
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
                                <TableCell align="center">
                                    {readOnly ? (
                                        <Typography variant="caption" color="text.secondary">
                                            Chỉ xem
                                        </Typography>
                                    ) : (
                                        <>
                                            {v.status === 'Đăng ký' && (
                                                <Tooltip title="Check-in (Khách đến)">
                                                    <IconButton color="success" onClick={() => handleCheckIn(v.id)}>
                                                        <CheckCircleIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {v.status === 'Đã vào' && (
                                                <Tooltip title="Check-out (Khách về)">
                                                    <IconButton color="warning" onClick={() => handleCheckOut(v.id)}>
                                                        <LogoutIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {(v.status === 'Đã ra' || v.status === 'Hủy') && (
                                                <Typography variant="caption" color="text.secondary">Hoàn tất</Typography>
                                            )}
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
