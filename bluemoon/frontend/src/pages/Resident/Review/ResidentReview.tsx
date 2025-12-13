import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Rating,
    TextField,
    Button,
    Stack,
    Alert,
    CircularProgress,
    Snackbar,
    Divider,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';
import { Send as SendIcon, Star as StarIcon } from '@mui/icons-material';
import reviewApi from '../../../api/reviewApi';
// import { useAuth } from '../../../contexts/AuthContext';

export default function ResidentReview() {
    const [rating, setRating] = useState<number | null>(5);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Simple survey state
    const [survey, setSurvey] = useState({
        satisfaction: 'good',
        security: 'good',
        cleanliness: 'good'
    });

    const handleSurveyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSurvey({
            ...survey,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async () => {
        if (!rating) {
            setError('Vui lòng chọn số sao đánh giá.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await reviewApi.create({
                rating,
                feedback,
                survey_response: survey
            });

            setSuccess(true);
            setFeedback('');
            setRating(5);
            // Reset survey
            setSurvey({
                satisfaction: 'good',
                security: 'good',
                cleanliness: 'good'
            });

        } catch (err) {
            console.error('Error submitting review:', err);
            setError('Không thể gửi đánh giá. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
            <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
                    Đánh giá & Góp ý
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Ý kiến của bạn giúp chúng tôi cải thiện chất lượng dịch vụ chung cư BlueMoon mỗi ngày.
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Stack spacing={4}>
                    {/* Rating Section */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography component="legend" gutterBottom fontWeight="bold">
                            Mức độ hài lòng chung
                        </Typography>
                        <Rating
                            name="rating"
                            value={rating}
                            onChange={(_event, newValue) => {
                                setRating(newValue);
                            }}
                            size="large"
                            precision={1}
                            icon={<StarIcon fontSize="inherit" />}
                            emptyIcon={<StarIcon fontSize="inherit" style={{ opacity: 0.55 }} />}
                            sx={{ fontSize: '3rem' }}
                        />
                        <Typography variant="caption" display="block" color={rating && rating < 3 ? 'error' : 'text.secondary'}>
                            {rating === 1 && 'Rất không hài lòng'}
                            {rating === 2 && 'Không hài lòng'}
                            {rating === 3 && 'Bình thường'}
                            {rating === 4 && 'Hài lòng'}
                            {rating === 5 && 'Rất hài lòng'}
                        </Typography>
                    </Box>

                    <Divider />

                    {/* Survey Section */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Khảo sát nhanh (Tùy chọn)
                        </Typography>
                        <Stack spacing={2}>
                            <FormControl>
                                <FormLabel id="satisfaction-label">Thái độ của nhân viên</FormLabel>
                                <RadioGroup
                                    row
                                    name="satisfaction"
                                    value={survey.satisfaction}
                                    onChange={handleSurveyChange}
                                >
                                    <FormControlLabel value="bad" control={<Radio size="small" />} label="Cần cải thiện" />
                                    <FormControlLabel value="normal" control={<Radio size="small" />} label="Bình thường" />
                                    <FormControlLabel value="good" control={<Radio size="small" />} label="Tốt" />
                                </RadioGroup>
                            </FormControl>

                            <FormControl>
                                <FormLabel id="security-label">An ninh trật tự</FormLabel>
                                <RadioGroup
                                    row
                                    name="security"
                                    value={survey.security}
                                    onChange={handleSurveyChange}
                                >
                                    <FormControlLabel value="bad" control={<Radio size="small" />} label="Không an tâm" />
                                    <FormControlLabel value="normal" control={<Radio size="small" />} label="Bình thường" />
                                    <FormControlLabel value="good" control={<Radio size="small" />} label="An toàn" />
                                </RadioGroup>
                            </FormControl>

                            <FormControl>
                                <FormLabel id="cleanliness-label">Vệ sinh môi trường</FormLabel>
                                <RadioGroup
                                    row
                                    name="cleanliness"
                                    value={survey.cleanliness}
                                    onChange={handleSurveyChange}
                                >
                                    <FormControlLabel value="bad" control={<Radio size="small" />} label="Chưa sạch" />
                                    <FormControlLabel value="normal" control={<Radio size="small" />} label="Bình thường" />
                                    <FormControlLabel value="good" control={<Radio size="small" />} label="Sạch sẽ" />
                                </RadioGroup>
                            </FormControl>
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Feedback Section */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Ý kiến đóng góp chi tiết
                        </Typography>
                        <TextField
                            multiline
                            rows={4}
                            fullWidth
                            placeholder="Hãy chia sẻ thêm chi tiết về trải nghiệm của bạn hoặc đề xuất cải thiện..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            variant="outlined"
                        />
                    </Box>

                    {/* Submit Button */}
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleSubmit}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        sx={{
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            borderRadius: 2
                        }}
                    >
                        {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </Button>
                </Stack>
            </Paper>

            <Snackbar
                open={success}
                autoHideDuration={6000}
                onClose={() => setSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%', borderRadius: 2 }}>
                    Cảm ơn bạn đã gửi đánh giá! Ban quản trị sẽ ghi nhận ý kiến của bạn.
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%', borderRadius: 2 }}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}
