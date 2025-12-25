// File: backend/routes/visitorRoutes.js

const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const checkAuth = require('../middleware/checkAuth'); // Middleware xác thực
const checkRole = require('../middleware/checkRole'); // Middleware phân quyền

// Bắt buộc đăng nhập cho tất cả các routes
router.use(checkAuth);

// ==========================================
// 1. NHÓM API TRA CỨU (READ)
// ==========================================

/**
 * [GET] /api/visitors
 * Xem danh sách khách ra vào
 * Quyền hạn: 
 * - BOD: Quản lý an ninh.
 * - CQCN: Kiểm tra hành chính/an ninh.
 */
router.get('/', 
    checkRole(['bod', 'cqcn']), 
    visitorController.getAllVisitors
);

// ==========================================
// 2. NHÓM API TÁC VỤ (WRITE)
// ==========================================

/**
 * [POST] /api/visitors/check-in
 * Ghi nhận khách vào
 * Quyền hạn: Chỉ BOD (Bảo vệ/Lễ tân)
 */
router.post('/check-in', 
    checkRole(['bod']), 
    visitorController.checkIn
);

/**
 * [PUT] /api/visitors/:id/check-out
 * Ghi nhận khách ra
 * Quyền hạn: Chỉ BOD
 */
router.put('/:id/check-out', 
    checkRole(['bod']), 
    visitorController.checkOut
);

/**
 * [DELETE] /api/visitors/:id
 * Xóa lịch sử (Xử lý sai sót)
 * Quyền hạn: Chỉ BOD
 */
router.delete('/:id', 
    checkRole(['bod']), 
    visitorController.deleteVisitor
);

module.exports = router;