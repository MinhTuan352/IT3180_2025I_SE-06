// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// Kích hoạt bảo vệ: Phải đăng nhập
router.use(checkAuth);

// Kích hoạt bảo vệ cấp cao: Chỉ Ban quản trị mới được dùng các API dưới đây
router.use(checkRole(['bod'])); 

// 1. Xem danh sách tất cả tài khoản
router.get('/', userController.getAllUsers);

// 2. Khóa / Mở khóa tài khoản
router.put('/:id/status', userController.toggleStatus);

// 3. Reset mật khẩu cho người dùng
router.post('/:id/reset-password', userController.resetPassword);

module.exports = router;