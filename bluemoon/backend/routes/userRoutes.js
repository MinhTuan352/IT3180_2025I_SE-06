// File: backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// ==========================================
// MIDDLEWARE BẢO VỆ
// ==========================================

// 1. Bắt buộc phải đăng nhập
router.use(checkAuth);

// 2. Chỉ Ban quản trị (BOD) mới được quyền quản lý User
router.use(checkRole(['bod'])); 

// ==========================================
// CÁC ROUTE QUẢN LÝ (CŨ)
// ==========================================

// [GET] /api/users - Xem danh sách tất cả tài khoản
router.get('/', userController.getAllUsers);

// [PUT] /api/users/:id/status - Khóa / Mở khóa tài khoản
router.put('/:id/status', userController.toggleStatus);

// [POST] /api/users/:id/reset-password - Reset mật khẩu
router.post('/:id/reset-password', userController.resetPassword);

// ==========================================
// CÁC ROUTE TẠO MỚI (SPRINT 2)
// ==========================================

// [POST] /api/users/create-admin
// Tạo tài khoản quản trị (Admin hoặc Kế toán)
router.post('/create-admin', userController.createManagementAccount);

// [POST] /api/users/create-resident
// Tạo tài khoản cư dân (Kèm thông tin căn hộ)
router.post('/create-resident', userController.createResidentAccount);

module.exports = router;