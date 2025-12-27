// File: backend/routes/reviewRoutes.js

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const checkAuth = require('../middleware/checkAuth'); // [FIXED] Tên chuẩn
const checkRole = require('../middleware/checkRole'); // [FIXED] Tên chuẩn

router.use(checkAuth);

// Cư dân gửi đánh giá
router.post('/', checkRole(['resident']), reviewController.createReview);
router.get('/my-reviews', checkRole(['resident']), reviewController.getResidentReviews);

// BQT xem đánh giá
router.get('/', checkRole(['bod']), reviewController.getAllReviews);
router.get('/stats', checkRole(['bod']), reviewController.getStats);
router.put('/:id/view', checkRole(['bod']), reviewController.markAsViewed);

module.exports = router;