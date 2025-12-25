// File: backend/routes/temporaryResidenceRoutes.js

const express = require('express');
const router = express.Router();
const temporaryResidenceController = require('../controllers/temporaryResidenceController');
const checkAuth = require('../middleware/checkAuth'); // Xác thực Token
const checkRole = require('../middleware/checkRole'); // Phân quyền
const upload = require('../middleware/uploadMiddleware'); // Upload ảnh giấy tờ

// ==========================================
// 1. DÀNH CHO CƯ DÂN (RESIDENT)
// ==========================================

// Đăng ký khai báo mới (Có upload 1 file ảnh giấy tờ)
router.post('/register', 
    checkAuth, 
    checkRole(['resident']), 
    upload.single('attachments'), // Tên field trong FormData là 'attachments'
    temporaryResidenceController.register
);

// Xem lịch sử khai báo của bản thân
router.get('/me', 
    checkAuth, 
    checkRole(['resident']), 
    temporaryResidenceController.getMyHistory
);

// Hủy đơn (khi còn ở trạng thái Chờ duyệt)
router.delete('/:id', 
    checkAuth, 
    checkRole(['resident']), 
    temporaryResidenceController.cancelRegistration
);

// ==========================================
// 2. DÀNH CHO QUẢN TRỊ & CƠ QUAN CHỨC NĂNG
// ==========================================

// Xem danh sách tất cả (BOD, CQCN đều xem được)
router.get('/', 
    checkAuth, 
    checkRole(['bod', 'cqcn']), 
    temporaryResidenceController.getAll
);

// Xem chi tiết một đơn
router.get('/:id', 
    checkAuth, 
    checkRole(['bod', 'cqcn']), 
    temporaryResidenceController.getDetail
);

// Duyệt hoặc Từ chối đơn (CHỈ DÀNH CHO BOD - CQCN không được duyệt)
router.put('/:id/status', 
    checkAuth, 
    checkRole(['bod']), 
    temporaryResidenceController.updateStatus
);

module.exports = router;