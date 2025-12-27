// File: backend/routes/profileEditRequestRoutes.js

const express = require('express');
const router = express.Router();
const profileEditRequestController = require('../controllers/profileEditRequestController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

router.use(checkAuth);

// ==========================================
// 1. DÀNH CHO CƯ DÂN (RESIDENT)
// ==========================================

// Tạo yêu cầu mới
router.post('/', checkRole(['resident']), profileEditRequestController.createRequest);

// Xem yêu cầu của mình
router.get('/me', checkRole(['resident']), profileEditRequestController.getMyRequests);

// ==========================================
// 2. DÀNH CHO BAN QUẢN TRỊ (BOD)
// ==========================================

// Xem yêu cầu của 1 cư dân
router.get('/resident/:id', checkRole(['bod']), profileEditRequestController.getRequestsByResidentId);

// Xem chi tiết 1 yêu cầu
router.get('/:id', checkRole(['bod', 'resident']), profileEditRequestController.getRequestDetail);

// Cập nhật trạng thái
router.put('/:id/status', checkRole(['bod']), profileEditRequestController.updateRequestStatus);

module.exports = router;
