// backend/routes/incidentRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const incidentController = require('../controllers/incidentController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// ===============================
// CẤU HÌNH MULTER (Cho sự cố)
// ===============================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Lưu vào folder incidents
        cb(null, 'uploads/incidents/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Chỉ chấp nhận ảnh cho báo cáo sự cố (jpg, png)
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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

// ===============================
// ĐỊNH TUYẾN
// ===============================

router.use(checkAuth);

// 1. Xem danh sách (Cư dân xem của mình, Admin xem hết)
router.get('/', incidentController.getAllIncidents);

// 2. Xem chi tiết
router.get('/:id', incidentController.getIncidentDetail);

// 3. Tạo báo cáo sự cố (Chỉ cư dân)
// upload.array('images', 3) => Cho phép upload tối đa 3 ảnh
router.post('/', 
    checkRole(['resident']), 
    upload.array('images', 3), 
    incidentController.createIncident
);

// 4. Cập nhật trạng thái (Chỉ Admin/BOD)
// Ví dụ: Đánh dấu "Đang xử lý", Giao cho nhân viên A
router.put('/:id', 
    checkRole(['bod']), 
    incidentController.updateIncidentStatus
);

module.exports = router;