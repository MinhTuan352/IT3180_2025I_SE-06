// File: backend/routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const notificationController = require('../controllers/notificationController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// ===============================
// CẤU HÌNH MULTER (UPLOAD FILE)
// ===============================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Chỉ định thư mục lưu file
        cb(null, 'uploads/notifications/');
    },
    filename: function (req, file, cb) {
        // Đổi tên file: timestamp-tenfilegoc.jpg
        // Để tránh trường hợp 2 người upload cùng tên file đè lên nhau
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Bộ lọc file (Chỉ cho phép ảnh và PDF)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh, PDF hoặc Word!'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: fileFilter
});

// ===============================
// ĐỊNH TUYẾN (ROUTES)
// ===============================

router.use(checkAuth);

// 1. Lấy danh sách thông báo
router.get('/', notificationController.getAllNotifications);

// 2. Lấy chi tiết thông báo
router.get('/:id', notificationController.getNotificationDetail);

// 3. Đánh dấu đã đọc (Cho cư dân)
router.put('/:id/read', notificationController.markAsRead);

// 4. Tạo thông báo mới (Chỉ Admin)
// upload.array('attachments', 5) => Cho phép upload tối đa 5 file, key form là 'attachments'
router.post('/', 
    checkRole(['bod']), 
    upload.array('attachments', 5), 
    notificationController.createNotification
);

module.exports = router;