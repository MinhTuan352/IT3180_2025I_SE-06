import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, CircularProgress } from '@mui/material';
import { useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import axiosClient from '../../api/axiosClient';

interface ApiEndpoint {
    name: string;
    method: string;
    url: string;
    description: string;
    status: 'pending' | 'success' | 'error';
    latency?: number;
}

const apiList: ApiEndpoint[] = [
    // --- System & Auth ---
    { name: 'Server Health', method: 'GET', url: '/', description: 'Kiểm tra Server sống', status: 'pending' },
    { name: 'Auth - Login', method: 'POST', url: '/auth/login', description: 'Đăng nhập', status: 'pending' },
    { name: 'Auth - Register', method: 'POST', url: '/auth/register', description: 'Đăng ký', status: 'pending' },
    { name: 'Auth - Refresh Token', method: 'POST', url: '/auth/refresh-token', description: 'Làm mới token', status: 'pending' },
    { name: 'Auth - Logout', method: 'POST', url: '/auth/logout', description: 'Đăng xuất', status: 'pending' },
    { name: 'Auth - Forgot Pwd', method: 'POST', url: '/auth/forgot-password', description: 'Quên mật khẩu', status: 'pending' },
    { name: 'Auth - Change Pwd', method: 'POST', url: '/auth/change-password', description: 'Đổi mật khẩu', status: 'pending' },
    { name: 'Auth - Admin History', method: 'GET', url: '/auth/history/admin', description: 'Lịch sử Admin', status: 'pending' },
    { name: 'Auth - Resident History', method: 'GET', url: '/auth/history/resident', description: 'Lịch sử Cư dân', status: 'pending' },

    // --- Dashboard & Sidebar ---
    { name: 'Dashboard - BOD', method: 'GET', url: '/dashboard/bod', description: 'Thống kê BOD', status: 'pending' },
    { name: 'Dashboard - Accountant', method: 'GET', url: '/dashboard/accountant', description: 'Thống kê Kế toán', status: 'pending' },
    { name: 'Dashboard - Resident', method: 'GET', url: '/dashboard/resident', description: 'Thống kê Cư dân', status: 'pending' },
    { name: 'Dashboard - CQCN', method: 'GET', url: '/dashboard/cqcn', description: 'Thống kê CQCN', status: 'pending' },
    { name: 'Sidebar - Badges', method: 'GET', url: '/sidebar/badges', description: 'Đếm badge sidebar', status: 'pending' },
    { name: 'Sidebar - Mark Fee Viewed', method: 'POST', url: '/sidebar/mark-fees-viewed', description: 'Đánh dấu đã xem phí', status: 'pending' },

    // --- Access Control ---
    { name: 'Access - Logs', method: 'GET', url: '/access/logs', description: 'Nhật ký ra vào', status: 'pending' },
    { name: 'Access - Latest', method: 'GET', url: '/access/latest', description: 'Ra vào mới nhất', status: 'pending' },
    { name: 'Access - Stats', method: 'GET', url: '/access/stats', description: 'Thống kê ra vào', status: 'pending' },
    { name: 'Access - Simulate', method: 'POST', url: '/access/simulate', description: 'Giả lập ra vào', status: 'pending' },

    // --- Apartment & Building ---
    { name: 'Apartment - List', method: 'GET', url: '/apartments', description: 'Danh sách căn hộ', status: 'pending' },
    { name: 'Apartment - Detail', method: 'GET', url: '/apartments/:id', description: 'Chi tiết căn hộ', status: 'pending' },
    { name: 'Building - Info', method: 'GET', url: '/building/info', description: 'Thông tin chung cư', status: 'pending' },
    { name: 'Building - Regs', method: 'GET', url: '/building/regulations', description: 'Nội quy', status: 'pending' },
    { name: 'Building - Update Info', method: 'PUT', url: '/building/info', description: 'Cập nhật Info', status: 'pending' },

    // --- Assets ---
    { name: 'Assets - List (Res)', method: 'GET', url: '/assets/resident', description: 'Tài sản công cộng', status: 'pending' },
    { name: 'Assets - List (Admin)', method: 'GET', url: '/assets', description: 'Quản lý tài sản', status: 'pending' },
    { name: 'Assets - Detail', method: 'GET', url: '/assets/:id', description: 'Chi tiết tài sản', status: 'pending' },
    { name: 'Assets - Create', method: 'POST', url: '/assets', description: 'Thêm tài sản', status: 'pending' },
    { name: 'Assets - Update', method: 'PUT', url: '/assets/:id', description: 'Cập nhật tài sản', status: 'pending' },
    { name: 'Assets - Delete', method: 'DELETE', url: '/assets/:id', description: 'Xóa tài sản', status: 'pending' },
    { name: 'Assets - Maintain', method: 'POST', url: '/assets/:id/maintenance', description: 'Bảo trì tài sản', status: 'pending' },

    // --- Accounting ---
    { name: 'Accounting - Tasks', method: 'GET', url: '/accounting/tasks', description: 'Công việc kế toán', status: 'pending' },
    { name: 'Accounting - Create Task', method: 'POST', url: '/accounting/tasks', description: 'Tạo công việc', status: 'pending' },
    { name: 'Accounting - Task Stat', method: 'GET', url: '/accounting/tasks/stats', description: 'Thống kê công việc', status: 'pending' },
    { name: 'Accounting - Schedules', method: 'GET', url: '/accounting/schedules', description: 'Lịch định kỳ', status: 'pending' },
    { name: 'Accounting - Categories', method: 'GET', url: '/accounting/categories', description: 'Danh mục thu chi', status: 'pending' },

    // --- Audit ---
    { name: 'Audit - Logs', method: 'GET', url: '/audit', description: 'Nhật ký hệ thống', status: 'pending' },

    // --- Users ---
    { name: 'Users - List', method: 'GET', url: '/users', description: 'Danh sách người dùng', status: 'pending' },
    { name: 'Users - Toggle Status', method: 'PUT', url: '/users/:id/status', description: 'Khóa/Mở khóa User', status: 'pending' },
    { name: 'Users - Reset Pwd', method: 'POST', url: '/users/:id/reset-password', description: 'Reset mật khẩu', status: 'pending' },
    { name: 'Users - Create Admin', method: 'POST', url: '/users/create-admin', description: 'Tạo tài khoản quản trị', status: 'pending' },
    { name: 'Users - Get Detail', method: 'GET', url: '/users/:id', description: 'Chi tiết User', status: 'pending' },
    { name: 'Users - Update', method: 'PUT', url: '/users/:id', description: 'Cập nhật User', status: 'pending' },
    { name: 'Users - Delete', method: 'DELETE', url: '/users/:id', description: 'Xóa User', status: 'pending' },

    // --- Residents ---
    { name: 'Resident - Me', method: 'GET', url: '/residents/me', description: 'Profile Cư dân', status: 'pending' },
    { name: 'Resident - Update Me', method: 'PUT', url: '/residents/me', description: 'Cập nhật Profile', status: 'pending' },
    { name: 'Resident - Apartment', method: 'GET', url: '/residents/my-apartment', description: 'Thông tin căn hộ', status: 'pending' },

    // --- Vehicles ---
    { name: 'Vehicles - Me', method: 'GET', url: '/vehicles/me', description: 'Xe của tôi', status: 'pending' },
    { name: 'Vehicles - Register', method: 'POST', url: '/vehicles/register', description: 'Đăng ký xe', status: 'pending' },
    { name: 'Vehicles - List All', method: 'GET', url: '/vehicles', description: 'Tất cả xe (Admin)', status: 'pending' },
    { name: 'Vehicles - Export', method: 'GET', url: '/vehicles/export', description: 'Xuất Excel xe', status: 'pending' },
    { name: 'Vehicles - Import', method: 'POST', url: '/vehicles/import', description: 'Import Excel xe', status: 'pending' },
    { name: 'Vehicles - By Resident', method: 'GET', url: '/vehicles/resident/:residentId', description: 'Xe theo cư dân', status: 'pending' },
    { name: 'Vehicles - Update Status', method: 'PUT', url: '/vehicles/:id/status', description: 'Duyệt/Hủy xe', status: 'pending' },

    // --- Visitors ---
    { name: 'Visitors - List', method: 'GET', url: '/visitors', description: 'Danh sách khách', status: 'pending' },
    { name: 'Visitors - Check-In', method: 'POST', url: '/visitors/check-in', description: 'Check-in khách', status: 'pending' },
    { name: 'Visitors - Check-Out', method: 'PUT', url: '/visitors/:id/check-out', description: 'Check-out khách', status: 'pending' },

    // --- Temporary Residence ---
    { name: 'Temp Res - Register', method: 'POST', url: '/temporary-residence/register', description: 'Đăng ký tạm trú', status: 'pending' },
    { name: 'Temp Res - Me', method: 'GET', url: '/temporary-residence/me', description: 'Đơn tạm trú của tôi', status: 'pending' },
    { name: 'Temp Res - List All', method: 'GET', url: '/temporary-residence', description: 'Tất cả đơn tạm trú', status: 'pending' },
    { name: 'Temp Res - Detail', method: 'GET', url: '/temporary-residence/:id', description: 'Chi tiết đơn', status: 'pending' },
    { name: 'Temp Res - Status', method: 'PUT', url: '/temporary-residence/:id/status', description: 'Duyệt đơn', status: 'pending' },

    // --- Services ---
    { name: 'Services - Public', method: 'GET', url: '/services/public', description: 'Dịch vụ công khai', status: 'pending' },
    { name: 'Services - Detail', method: 'GET', url: '/services/detail/:id', description: 'Chi tiết dịch vụ', status: 'pending' },
    { name: 'Services - Book', method: 'POST', url: '/services/bookings', description: 'Đặt chỗ', status: 'pending' },
    { name: 'Services - My Bookings', method: 'GET', url: '/services/my-bookings', description: 'Lịch sử đặt chỗ', status: 'pending' },
    { name: 'Services - List All', method: 'GET', url: '/services', description: 'Quản lý dịch vụ', status: 'pending' },
    { name: 'Services - Bookings List', method: 'GET', url: '/services/bookings', description: 'Quản lý đặt chỗ', status: 'pending' },
    { name: 'Services - Booking Status', method: 'PUT', url: '/services/bookings/:id/status', description: 'Duyệt đặt chỗ', status: 'pending' },

    // --- Fees ---
    { name: 'Fees - Types', method: 'GET', url: '/fees/types', description: 'Loại phí', status: 'pending' },
    { name: 'Fees - List All', method: 'GET', url: '/fees', description: 'Danh sách khoản thu', status: 'pending' },
    { name: 'Fees - Stats', method: 'GET', url: '/fees/stats', description: 'Thống kê phí', status: 'pending' },
    { name: 'Fees - Batch Preview', method: 'GET', url: '/fees/batch-preview', description: 'Xem trước định kỳ', status: 'pending' },
    { name: 'Fees - Import Utility', method: 'POST', url: '/fees/import-utility', description: 'Import điện nước', status: 'pending' },
    { name: 'Fees - Gen Vehicle', method: 'POST', url: '/fees/generate/vehicles', description: 'Tạo phí xe', status: 'pending' },
    { name: 'Fees - Batch Create', method: 'POST', url: '/fees/batch-create', description: 'Tạo phí hàng loạt', status: 'pending' },
    { name: 'Fees - Batch Remind', method: 'POST', url: '/fees/batch-remind', description: 'Nhắc phí hàng loạt', status: 'pending' },
    { name: 'Fees - Detail', method: 'GET', url: '/fees/:id', description: 'Chi tiết phí', status: 'pending' },
    { name: 'Fees - Pay', method: 'POST', url: '/fees/:id/pay', description: 'Xác nhận thanh toán', status: 'pending' },

    // --- Payment ---
    { name: 'Payment - Gen QR', method: 'GET', url: '/payment/generate-qr/:invoiceId', description: 'Tạo QR Code', status: 'pending' },
    { name: 'Payment - Check Status', method: 'GET', url: '/payment/status/:invoiceId', description: 'Kiểm tra trạng thái', status: 'pending' },
    { name: 'Payment - Simulate', method: 'POST', url: '/payment/simulate/:invoiceId', description: 'Giả lập thanh toán', status: 'pending' },

    // --- Reports ---
    { name: 'Report - Residents', method: 'GET', url: '/reports/residents', description: 'Báo cáo cư dân', status: 'pending' },
    { name: 'Report - Assets', method: 'GET', url: '/reports/assets', description: 'Báo cáo tài sản', status: 'pending' },
    { name: 'Report - Vehicles', method: 'GET', url: '/reports/vehicles', description: 'Báo cáo xe', status: 'pending' },
    { name: 'Report - Fees', method: 'GET', url: '/reports/fees', description: 'Báo cáo phí', status: 'pending' },

    // --- Notifications ---
    { name: 'Notif - List', method: 'GET', url: '/notifications', description: 'Danh sách thông báo', status: 'pending' },
    { name: 'Notif - Create', method: 'POST', url: '/notifications', description: 'Tạo thông báo', status: 'pending' },
    { name: 'Notif - Mark Read', method: 'PUT', url: '/notifications/:id/read', description: 'Đánh dấu đã đọc', status: 'pending' },

    // --- Incidents ---
    { name: 'Incidents - List', method: 'GET', url: '/incidents', description: 'Danh sách sự cố', status: 'pending' },
    { name: 'Incidents - Create', method: 'POST', url: '/incidents', description: 'Báo cáo sự cố', status: 'pending' },
    { name: 'Incidents - Update', method: 'PUT', url: '/incidents/:id', description: 'Cập nhật sự cố', status: 'pending' },

    // --- Import ---
    { name: 'Import - Master Data', method: 'POST', url: '/import/master-data', description: 'Import Excel Master', status: 'pending' },
    { name: 'Import - Template', method: 'GET', url: '/import/export-master-data', description: 'Lấy file mẫu', status: 'pending' },

    // --- Profile Requests ---
    { name: 'Profile Req - Me', method: 'GET', url: '/profile-requests/me', description: 'Request của tôi', status: 'pending' },
    { name: 'Profile Req - All', method: 'GET', url: '/profile-requests/all', description: 'Duyệt Request', status: 'pending' },
    { name: 'Profile Req - Status', method: 'PUT', url: '/profile-requests/:id/status', description: 'Cập nhật trạng thái', status: 'pending' },

    // --- Donations ---
    { name: 'Donation - Campaigns', method: 'GET', url: '/donations/campaigns', description: 'Danh sách vận động', status: 'pending' },
    { name: 'Donation - Create', method: 'POST', url: '/donations/campaigns', description: 'Tạo chiến dịch', status: 'pending' },
    { name: 'Donation - Donate', method: 'POST', url: '/donations/donate', description: 'Quyên góp', status: 'pending' },
    { name: 'Donation - History', method: 'GET', url: '/donations/me/history', description: 'Lịch sử quyên góp', status: 'pending' },
    { name: 'Donation - Stats', method: 'GET', url: '/donations/statistics', description: 'Thống kê quyên góp', status: 'pending' },

    // --- Others ---
    { name: 'Chatbot - Ask', method: 'POST', url: '/chatbot/ask', description: 'Hỏi Chatbot', status: 'pending' },
    { name: 'Reviews - List', method: 'GET', url: '/reviews', description: 'Đánh giá chi tiết', status: 'pending' },
];

export default function APIReport() {
    const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(apiList);
    const [checking, setChecking] = useState(false);

    const checkApi = async (index: number) => {
        const ep = endpoints[index];
        const start = Date.now();
        try {
            if (ep.method === 'GET') {
                await axiosClient.get(ep.url);
            } else {
                try {
                    await axiosClient.request({ method: ep.method, url: ep.url });
                } catch (e: any) {
                    // Special handling for Payment Simulate which returns 404 if invoice not found but IS connected
                    if (ep.url.includes('/payment/simulate') && e.response?.status === 404 && e.response?.data) {
                        // Connected but logic error (Invoice not found) -> Success
                    }
                    else if (e.response && e.response.status !== 404) {
                        // Connected but error (auth, validation, etc) -> Success
                    } else {
                        throw e;
                    }
                }
            }

            const end = Date.now();
            updateStatus(index, 'success', end - start);
        } catch (error: any) {
            const end = Date.now();
            console.warn(`Check failed for ${ep.name}:`, error);

            // Nếu 401/403/400 thì vẫn là kết nối được
            if (error.response && [400, 401, 403].includes(error.response.status)) {
                updateStatus(index, 'success', end - start);
            } else if (error.response && error.response.status === 404) {
                // Check if it's a logic 404 (with JSON body) or Route 404 (Express default HTML or cannot POST)
                if (error.response.data && (error.response.data.success === false || error.response.data.message)) {
                    // Backward compatibility: If it returns JSON, it means Controller caught it -> Connected
                    updateStatus(index, 'success', end - start);
                } else {
                    updateStatus(index, 'error', end - start);
                }
            } else {
                updateStatus(index, 'error', end - start);
            }
        }
    };

    const updateStatus = (index: number, status: 'success' | 'error', latency: number) => {
        setEndpoints(prev => {
            const next = [...prev];
            next[index] = { ...next[index], status, latency };
            return next;
        });
    };

    const handleCheckAll = async () => {
        setChecking(true);
        for (let i = 0; i < endpoints.length; i++) {
            await checkApi(i);
        }
        setChecking(false);
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold">Báo cáo tình trạng API Hệ thống</Typography>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={checking ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                    onClick={handleCheckAll}
                    disabled={checking}
                >
                    Kiểm tra Kết nối
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Tên API</strong></TableCell>
                            <TableCell><strong>Phương thức</strong></TableCell>
                            <TableCell><strong>Endpoint</strong></TableCell>
                            <TableCell><strong>Mô tả</strong></TableCell>
                            <TableCell align="center"><strong>Trạng thái</strong></TableCell>
                            <TableCell align="right"><strong>Độ trễ</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {endpoints.map((ep, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell>{ep.name}</TableCell>
                                <TableCell><Chip label={ep.method} color={ep.method === 'GET' ? 'primary' : 'secondary'} size="small" /></TableCell>
                                <TableCell>{ep.url}</TableCell>
                                <TableCell>{ep.description}</TableCell>
                                <TableCell align="center">
                                    {ep.status === 'pending' && <Chip label="Chưa kiểm tra" />}
                                    {ep.status === 'success' && <Chip icon={<CheckCircleIcon />} label="Đã kết nối" color="success" />}
                                    {ep.status === 'error' && <Chip icon={<ErrorIcon />} label="Mất kết nối / 404" color="error" />}
                                </TableCell>
                                <TableCell align="right">
                                    {ep.latency ? `${ep.latency} ms` : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
