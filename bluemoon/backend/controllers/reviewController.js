const Review = require('../models/Review');
const Resident = require('../models/residentModel');

exports.createReview = async (req, res) => {
    try {
        const userId = req.user.id; // Changed from req.user.userId

        // Find resident by user_id
        const resident = await Resident.findByUserId(userId);
        if (!resident) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin cư dân' });
        }

        const reviewData = {
            resident_id: resident.id,
            rating: req.body.rating,
            feedback: req.body.feedback,
            survey_response: req.body.survey_response
        };

        await Review.create(reviewData);
        res.status(201).json({ message: 'Gửi đánh giá thành công' });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.getAll();
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getResidentReviews = async (req, res) => {
    try {
        const userId = req.user.userId;
        const resident = await Resident.findByUserId(userId);
        if (!resident) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin cư dân' });
        }

        const reviews = await Review.getByResidentId(resident.id);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching resident reviews:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.markAsViewed = async (req, res) => {
    try {
        const { id } = req.params;
        await Review.markAsViewed(id);
        res.json({ message: 'Đã đánh dấu đã xem' });
    } catch (error) {
        console.error('Error marking review as viewed:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const stats = await Review.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
