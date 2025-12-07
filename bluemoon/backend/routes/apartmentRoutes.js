// File: backend/routes/apartmentRoutes.js

const express = require('express');
const router = express.Router();
const apartmentController = require('../controllers/apartmentController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// Bắt buộc đăng nhập mới xem được
router.use(checkAuth);

// 1. Lấy danh sách căn hộ (Cho trang Tra cứu sơ đồ)
// Chỉ BOD và Kế toán được xem sơ đồ tổng quát
router.get('/', 
    checkRole(['bod', 'accountance']), 
    apartmentController.getAllApartments
);

// 2. Lấy chi tiết căn hộ
router.get('/:id', 
    checkRole(['bod', 'accountance']), 
    apartmentController.getApartmentDetail
);

module.exports = router;