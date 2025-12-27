// File: backend/routes/incidentRoutes.js

const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');
const upload = require('../middleware/uploadMiddleware');

// ===============================
// ĐỊNH TUYẾN API
// ===============================

// Bắt buộc đăng nhập cho mọi thao tác bên dưới
router.use(checkAuth);

// 1. Xem danh sách sự cố
// - Cư dân: Xem của mình
// - Admin: Xem tất cả
router.get('/', incidentController.getAllIncidents);

// 2. Xem chi tiết sự cố
router.get('/:id', incidentController.getIncidentDetail);

// 3. Tạo báo cáo sự cố (Chỉ dành cho Cư dân)
// upload.array('images', 3) => Cho phép upload tối đa 3 ảnh với key là 'images'
router.post('/',
    checkRole(['resident', 'bod']),
    upload.array('images', 3),
    incidentController.createIncident
);

// 4. Cập nhật thông tin sự cố (Dùng chung cho cả 2 vai trò)
// - Admin (bod): Cập nhật trạng thái, phân công, phản hồi.
// - Cư dân (resident): Đánh giá (rating), gửi feedback (chỉ khi đã hoàn thành).
router.put('/:id',
    checkRole(['bod', 'resident']), // [QUAN TRỌNG] Cho phép cả resident gọi vào
    incidentController.updateIncident
);

module.exports = router;