import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Rating,
    CircularProgress,
    Stack,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Grid,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    Visibility as ViewIcon
} from '@mui/icons-material';
import reviewApi from '../../../api/reviewApi';
import type { Review, ReviewStats } from '../../../api/reviewApi';

export default function BODReviewList() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reviewsResponse, statsResponse] = await Promise.all([
                reviewApi.getAll(),
                reviewApi.getStats()
            ]);
            setReviews(reviewsResponse.data);
            setStats(statsResponse.data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleViewDetail = async (review: Review) => {
        setSelectedReview(review);
        if (review.status === 'Mới') {
            try {
                await reviewApi.markAsViewed(review.id);
                // Update local state
                setReviews(reviews.map(r => r.id === review.id ? { ...r, status: 'Đã xem' } : r));
            } catch (error) {
                console.error('Error marking as viewed:', error);
            }
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                    Đánh giá từ Cư dân
                </Typography>
            </Stack>

            {/* Stats Cards */}
            {stats && (
                <Grid container spacing={3} mb={4}>
                    <Grid sx={{ xs: 12, md: 4 }}>
                        <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                            <CardContent>
                                <Typography variant="h6">Tổng số đánh giá</Typography>
                                <Typography variant="h3" fontWeight="bold">{stats.total}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid sx={{ xs: 12, md: 4 }}>
                        <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                            <CardContent>
                                <Typography variant="h6">Điểm trung bình</Typography>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="h3" fontWeight="bold">{Number(stats.avg_rating).toFixed(1)}</Typography>
                                    <Rating value={Number(stats.avg_rating)} readOnly precision={0.5} sx={{ color: 'white' }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid sx={{ xs: 12, md: 4 }}>
                        <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                            <CardContent>
                                <Typography variant="h6">Đánh giá mới</Typography>
                                <Typography variant="h3" fontWeight="bold">{stats.new_reviews}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Reviews Table */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                            <TableCell>Cư dân</TableCell>
                            <TableCell>Căn hộ</TableCell>
                            <TableCell>Đánh giá</TableCell>
                            <TableCell>Nội dung</TableCell>
                            <TableCell>Ngày gửi</TableCell>
                            <TableCell>Trạng thái</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reviews.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Typography color="text.secondary">Chưa có đánh giá nào</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            reviews.map((review) => (
                                <TableRow key={review.id} hover>
                                    <TableCell>{review.full_name}</TableCell>
                                    <TableCell>
                                        <Chip label={review.apartment_code} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Rating value={review.rating} readOnly size="small" />
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 300 }}>
                                        <Typography noWrap variant="body2">
                                            {review.feedback || <i>(Không có nội dung)</i>}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(review.created_at).toLocaleDateString('vi-VN')}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={review.status}
                                            color={review.status === 'Mới' ? 'error' : 'success'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Xem chi tiết">
                                            <IconButton onClick={() => handleViewDetail(review)} color="primary">
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Paper>

            {/* Detail Modal */}
            <Dialog
                open={!!selectedReview}
                onClose={() => setSelectedReview(null)}
                maxWidth="md"
                fullWidth
            >
                {selectedReview && (
                    <>
                        <DialogTitle sx={{ borderBottom: '1px solid #eee' }}>
                            Chi tiết đánh giá
                        </DialogTitle>
                        <DialogContent sx={{ p: 4 }}>
                            <Grid container spacing={4}>
                                <Grid sx={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Người gửi</Typography>
                                    <Typography variant="h6" gutterBottom>{selectedReview.full_name}</Typography>

                                    <Typography variant="subtitle2" color="text.secondary">Căn hộ</Typography>
                                    <Typography variant="body1" gutterBottom>{selectedReview.apartment_code} - {selectedReview.building}</Typography>

                                    <Typography variant="subtitle2" color="text.secondary">Thời gian</Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {new Date(selectedReview.created_at).toLocaleString('vi-VN')}
                                    </Typography>
                                </Grid>
                                <Grid sx={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Đánh giá chung</Typography>
                                    <Rating value={selectedReview.rating} readOnly size="large" sx={{ mb: 2 }} />

                                    <Typography variant="subtitle2" color="text.secondary">Trạng thái</Typography>
                                    <Chip
                                        label={selectedReview.status}
                                        color={selectedReview.status === 'Mới' ? 'error' : 'success'}
                                        sx={{ mt: 0.5 }}
                                    />
                                </Grid>

                                <Grid sx={{ xs: 12 }}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                                        Nội dung góp ý
                                    </Typography>
                                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }} variant="outlined">
                                        <Typography variant="body1">
                                            {selectedReview.feedback || 'Không có nội dung'}
                                        </Typography>
                                    </Paper>
                                </Grid>

                                {selectedReview.survey_response && Object.keys(selectedReview.survey_response).length > 0 && (
                                    <Grid sx={{ xs: 12 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                                            Khảo sát
                                        </Typography>
                                        <Paper variant="outlined">
                                            <Table size="small">
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell>Thái độ nhân viên</TableCell>
                                                        <TableCell>{getSurveyLabel(selectedReview.survey_response.satisfaction)}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell>An ninh</TableCell>
                                                        <TableCell>{getSurveyLabel(selectedReview.survey_response.security)}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell>Vệ sinh</TableCell>
                                                        <TableCell>{getSurveyLabel(selectedReview.survey_response.cleanliness)}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        </DialogContent>
                        <Box sx={{ p: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button onClick={() => setSelectedReview(null)}>Đóng</Button>
                        </Box>
                    </>
                )}
            </Dialog>
        </Box>
    );
}

function getSurveyLabel(value: string) {
    switch (value) {
        case 'good': return <Chip label="Tốt" color="success" size="small" />;
        case 'normal': return <Chip label="Bình thường" color="info" size="small" />;
        case 'bad': return <Chip label="Cần cải thiện" color="warning" size="small" />;
        default: return value;
    }
}
