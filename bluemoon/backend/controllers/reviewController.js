// File: backend/controllers/reviewController.js

const Review = require('../models/reviewModel'); // [FIXED] Import đúng tên file
const Resident = require('../models/residentModel');

const reviewController = {
    
    createReview: async (req, res) => {
        try {
            const userId = req.user.id; 
            const resident = await Resident.findByUserId(userId);
            if (!resident) return res.status(404).json({ message: 'Không tìm thấy thông tin cư dân.' });

            await Review.create({
                resident_id: resident.id,
                rating: req.body.rating,
                feedback: req.body.feedback,
                survey_response: req.body.survey_response
            });
            res.status(201).json({ success: true, message: 'Cảm ơn bạn đã gửi đánh giá.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    getAllReviews: async (req, res) => {
        try {
            const reviews = await Review.getAll();
            res.json({ success: true, count: reviews.length, data: reviews });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getResidentReviews: async (req, res) => {
        try {
            const resident = await Resident.findByUserId(req.user.id);
            if (!resident) return res.json({ success: true, data: [] });

            const reviews = await Review.getByResidentId(resident.id);
            res.json({ success: true, data: reviews });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    markAsViewed: async (req, res) => {
        try {
            await Review.markAsViewed(req.params.id);
            res.json({ success: true, message: 'Đã đánh dấu đã xem.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getStats: async (req, res) => {
        try {
            const stats = await Review.getStats();
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = reviewController;