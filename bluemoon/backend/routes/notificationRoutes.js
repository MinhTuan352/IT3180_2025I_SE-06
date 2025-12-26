// File: backend/routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');
const upload = require('../middleware/uploadMiddleware'); // [FIX REQ 33] Dùng middleware chung

router.use(checkAuth);

// 1. Lấy danh sách thông báo
router.get('/', notificationController.getAllNotifications);

// 2. Lấy chi tiết thông báo
router.get('/:id', notificationController.getNotificationDetail);

// 3. Tạo thông báo mới (Chỉ BOD)
// [FIX REQ 33] Hỗ trợ upload nhiều file (ảnh, pdf...)
router.post('/', 
    checkRole(['bod']), 
    upload.array('attachments', 5), 
    notificationController.createNotification
);

// 4. Đánh dấu đã đọc
router.put('/:id/read', notificationController.markAsRead);

// 5. Xóa thông báo (Chỉ BOD)
router.delete('/:id', checkRole(['bod']), notificationController.deleteNotification);

module.exports = router;