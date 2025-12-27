import { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Table, TableHead, TableBody, TableRow, TableCell,
    Chip, Rating, CircularProgress, Stack, IconButton, Dialog,
    DialogTitle, DialogContent, Button, Card, CardContent, Divider
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
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
            const [reviewsRes, statsRes] = await Promise.all([
                reviewApi.getAll(),
                reviewApi.getStats()
            ]);
            setReviews(reviewsRes.data.data);
            setStats(statsRes.data.data);
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
                setReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: 'Đã xem' } : r));
                if (stats) setStats({ ...stats, new_reviews: stats.new_reviews - 1 });
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
            <Typography variant="h5" fontWeight="bold" mb={3}>Đánh giá từ Cư dân</Typography>

            {/* Layout Stats dùng Flexbox thay cho Grid */}
            {stats && (
                <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 3, 
                    mb: 4 
                }}>
                    {[
                        { label: 'Tổng số đánh giá', value: stats.total, color: 'primary.main' },
                        { label: 'Điểm trung bình', value: Number(stats.avg_rating || 0).toFixed(1), color: 'secondary.main', isRating: true },
                        { label: 'Đánh giá mới', value: stats.new_reviews, color: 'success.main' }
                    ].map((item, index) => (
                        <Card key={index} sx={{ bgcolor: item.color, color: 'white', flex: '1 1 300px' }}>
                            <CardContent>
                                <Typography variant="h6">{item.label}</Typography>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="h3" fontWeight="bold">{item.value}</Typography>
                                    {item.isRating && (
                                        <Rating value={Number(stats.avg_rating)} readOnly precision={0.5} sx={{ color: 'white' }} />
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

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
                                    <TableCell><Chip label={review.apartment_code} size="small" variant="outlined" /></TableCell>
                                    <TableCell><Rating value={review.rating} readOnly size="small" /></TableCell>
                                    <TableCell sx={{ maxWidth: 300 }}>
                                        <Typography noWrap variant="body2">{review.feedback || <i>(Không nội dung)</i>}</Typography>
                                    </TableCell>
                                    <TableCell>{new Date(review.created_at).toLocaleDateString('vi-VN')}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={review.status} 
                                            color={review.status === 'Mới' ? 'error' : 'success'} 
                                            size="small" 
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton onClick={() => handleViewDetail(review)} color="primary"><ViewIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Paper>

            <Dialog open={!!selectedReview} onClose={() => setSelectedReview(null)} maxWidth="md" fullWidth>
                {selectedReview && (
                    <>
                        <DialogTitle sx={{ borderBottom: '1px solid #eee' }}>Chi tiết đánh giá</DialogTitle>
                        <DialogContent sx={{ p: 4 }}>
                            <Stack spacing={3}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Người gửi</Typography>
                                        <Typography variant="h6">{selectedReview.full_name}</Typography>
                                        <Typography variant="body2">{selectedReview.apartment_code} - {selectedReview.building}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Đánh giá</Typography>
                                        <Rating value={selectedReview.rating} readOnly />
                                        <Typography variant="body2" display="block">Trạng thái: {selectedReview.status}</Typography>
                                    </Box>
                                </Box>

                                <Box>
                                    <Divider sx={{ mb: 2 }} />
                                    <Typography variant="subtitle1" fontWeight="bold">Nội dung góp ý</Typography>
                                    <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }} variant="outlined">
                                        <Typography variant="body1">{selectedReview.feedback || 'Không có nội dung'}</Typography>
                                    </Paper>
                                </Box>

                                {selectedReview.survey_response && (
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold" mb={1}>Khảo sát dịch vụ</Typography>
                                        <Table size="small" sx={{ border: '1px solid #eee' }}>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Thái độ nhân viên</TableCell>
                                                    <TableCell>{getSurveyLabel(selectedReview.survey_response.satisfaction)}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>An ninh</TableCell>
                                                    <TableCell>{getSurveyLabel(selectedReview.survey_response.security)}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Vệ sinh</TableCell>
                                                    <TableCell>{getSurveyLabel(selectedReview.survey_response.cleanliness)}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Box>
                                )}
                            </Stack>
                        </DialogContent>
                        <Box sx={{ p: 2, textAlign: 'right', borderTop: '1px solid #eee' }}>
                            <Button variant="contained" onClick={() => setSelectedReview(null)}>Đóng</Button>
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
        default: return value || 'N/A';
    }
}