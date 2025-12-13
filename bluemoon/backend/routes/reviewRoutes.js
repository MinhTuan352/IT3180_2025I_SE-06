const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/checkAuth');
const roleMiddleware = require('../middleware/checkRole');

// Public or Resident routes
router.post('/', authMiddleware, roleMiddleware(['resident']), reviewController.createReview);
router.get('/my-reviews', authMiddleware, roleMiddleware(['resident']), reviewController.getResidentReviews);

// BOD routes
router.get('/', authMiddleware, roleMiddleware(['bod']), reviewController.getAllReviews);
router.get('/stats', authMiddleware, roleMiddleware(['bod']), reviewController.getStats);
router.put('/:id/view', authMiddleware, roleMiddleware(['bod']), reviewController.markAsViewed);

module.exports = router;
