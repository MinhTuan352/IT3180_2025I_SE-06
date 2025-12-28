
import { Box, Typography, Grid, Card, CardContent, CardActions, Button, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useEffect, useState } from 'react';
import feeApi from '../../../api/feeApi';
import toast, { Toaster } from 'react-hot-toast';

export default function FeeTypeList() {
    const [feeTypes, setFeeTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Simplified fetch to replicate Accountant's view
    // NOTE: BQT has correct rights to add/edit as requested.
    const fetchFeeTypes = async () => {
        try {
            const response: any = await feeApi.getTypes();
            if (response && response.data && response.data.data) {
                setFeeTypes(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching fee types:", error);
            toast.error("Không thể tải danh sách loại phí");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeeTypes();
    }, []);

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa loại phí này?')) {
            try {
                await feeApi.deleteType(id.toString());
                toast.success('Đã xóa loại phí thành công');
                fetchFeeTypes();
            } catch (error: any) {
                console.error("Error deleting:", error);
                toast.error(error.response?.data?.message || 'Lỗi khi xóa loại phí');
            }
        }
    };

    const handleEdit = () => {
        // Vì không clone trang Edit/Create của Accountant, chúng ta tạm thời chỉ thông báo tính năng
        // Hoặc nếu cần kíp thì phải import component từ Accountant
        toast('Tính năng chỉnh sửa đang được phát triển cho BQT', { icon: '🚧' });
    }

    const handleAdd = () => {
        toast('Tính năng thêm đang được phát triển cho BQT', { icon: '🚧' });
    }

    if (loading) {
        return <Typography sx={{ p: 3 }}>Đang tải dữ liệu...</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Danh sách Các Loại Phí
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                >
                    Thêm loại phí
                </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Quản lý các danh mục phí dịch vụ áp dụng cho toàn chung cư.
            </Typography>

            <Grid container spacing={3}>
                {feeTypes.map((fee) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={fee.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, '&:hover': { boxShadow: 4 } }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" gutterBottom color="primary.main">{fee.fee_name}</Typography>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                                    Mã: {fee.fee_code || 'N/A'}
                                </Typography>

                                <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
                                    <Typography variant="body2">
                                        <strong>Đơn giá:</strong> {Number(fee.default_price || 0).toLocaleString('vi-VN')} đ
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Đơn vị:</strong> {fee.unit || 'Lần'}
                                    </Typography>
                                </Box>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                                <Button
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => handleDelete(fee.id)}
                                >
                                    Xóa
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<EditIcon />}
                                    onClick={() => handleEdit()}
                                >
                                    Sửa
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
                {feeTypes.length === 0 && (
                    <Typography sx={{ p: 3, width: '100%', textAlign: 'center', color: 'text.secondary' }}>
                        Chưa có dữ liệu.
                    </Typography>
                )}
            </Grid>
            <Toaster />
        </Box>
    );
}
