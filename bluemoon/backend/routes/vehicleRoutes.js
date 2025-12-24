// File: backend/routes/vehicleRoutes.js

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const checkAuth = require('../middleware/checkAuth'); // Middleware xác thực token
const checkRole = require('../middleware/checkRole'); // Middleware phân quyền
const upload = require('../middleware/uploadMiddleware'); // Bạn cần tạo file này (sẽ hướng dẫn bên dưới)

// ==========================================
// 1. DÀNH CHO CƯ DÂN (RESIDENT)
// ==========================================

// Xem danh sách xe của chính mình
router.get('/me', checkAuth, checkRole(['resident']), vehicleController.getMyVehicles);

// Đăng ký xe mới (Upload 2 file: Ảnh xe & Đăng ký xe)
router.post('/register', 
    checkAuth, 
    checkRole(['resident']), 
    upload.fields([
        { name: 'vehicle_image', maxCount: 1 }, 
        { name: 'registration_cert', maxCount: 1 }
    ]), 
    vehicleController.registerVehicle
);

// Hủy đăng ký xe
router.delete('/:id', checkAuth, checkRole(['resident']), vehicleController.cancelRegistration);

// ==========================================
// 2. DÀNH CHO BAN QUẢN TRỊ (BOD)
// ==========================================

// Xem danh sách tất cả xe (có bộ lọc)
router.get('/', checkAuth, checkRole(['bod', 'admin']), vehicleController.getAllVehicles);

// Duyệt / Từ chối xe (Update status)
router.put('/:id/status', checkAuth, checkRole(['bod', 'admin']), vehicleController.updateVehicleStatus);

// Chỉnh sửa thông tin xe (Sửa sai sót)
router.put('/:id', checkAuth, checkRole(['bod', 'admin']), vehicleController.updateVehicleInfo);

module.exports = router;