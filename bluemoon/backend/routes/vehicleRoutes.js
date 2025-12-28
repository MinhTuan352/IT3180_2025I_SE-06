// File: backend/routes/vehicleRoutes.js

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const checkAuth = require('../middleware/checkAuth'); // Middleware xác thực token
const checkRole = require('../middleware/checkRole'); // Middleware phân quyền
const upload = require('../middleware/uploadMiddleware'); // Bạn cần tạo file này (sẽ hướng dẫn bên dưới)
const { excelUpload } = require('../middleware/uploadMiddleware'); // Excel upload

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
router.delete('/:id', checkAuth, vehicleController.cancelRegistration);

// ==========================================
// 2. DÀNH CHO BAN QUẢN TRỊ (BOD)
// ==========================================

// Xem danh sách tất cả xe (có bộ lọc)
router.get('/', checkAuth, checkRole(['bod', 'cqcn']), vehicleController.getAllVehicles);

// Export danh sách xe ra Excel
router.get('/export', checkAuth, checkRole(['bod', 'cqcn']), vehicleController.exportVehicles);

// Import danh sách xe từ Excel
router.post('/import',
    checkAuth,
    checkRole(['bod', 'cqcn']),
    excelUpload.single('file'),
    vehicleController.importVehicles
);

// Xem xe của một cư dân cụ thể (dùng cho Profile)
router.get('/resident/:residentId', checkAuth, checkRole(['bod', 'cqcn']), vehicleController.getVehiclesByResidentId);

// BOD thêm xe mới (status = Đang sử dụng)
router.post('/',
    checkAuth,
    checkRole(['bod', 'cqcn']),
    upload.fields([
        { name: 'vehicle_image', maxCount: 1 },
        { name: 'registration_cert', maxCount: 1 }
    ]),
    vehicleController.createVehicle
);

// Duyệt / Từ chối xe (Update status)
router.put('/:id/status', checkAuth, checkRole(['bod', 'cqcn']), vehicleController.updateVehicleStatus);

// Chỉnh sửa thông tin xe (Sửa sai sót)
router.put('/:id', checkAuth, checkRole(['bod', 'cqcn']), vehicleController.updateVehicleInfo);

module.exports = router;