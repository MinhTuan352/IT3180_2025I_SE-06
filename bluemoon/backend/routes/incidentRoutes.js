// File: backend/routes/incidentRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const incidentController = require('../controllers/incidentController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// ===============================
// CẤU HÌNH MULTER (UPLOAD ẢNH SỰ CỐ)
// ===============================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Lưu vào folder uploads/incidents
        cb(null, 'uploads/incidents/');
    },
    filename: function (req, file, cb) {
        // Đặt tên file unique để tránh trùng lặp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Chỉ chấp nhận file ảnh (jpg, png, jpeg)
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG)!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB/file
    fileFilter: fileFilter
});

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