// File: backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const checkAuth = require('../middleware/checkAuth'); // [MỚI] Import middleware bảo vệ

// ==========================
// PUBLIC ROUTES (Ai cũng gọi được)
// ==========================

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// ==========================
// PRIVATE ROUTES (Phải đăng nhập)
// ==========================

// POST /api/auth/change-password - Đổi mật khẩu
router.post('/change-password', checkAuth, authController.changePassword);

// GET /api/auth/history - Xem lịch sử đăng nhập (của chính user đang login)
router.get('/history', checkAuth, authController.getLoginHistory);

// ==========================
// BOD ROUTES (Quản lý lịch sử đăng nhập)
// ==========================

// GET /api/auth/history/admin - Lịch sử đăng nhập của QTV
router.get('/history/admin', checkAuth, authController.getAdminLoginHistory);

// GET /api/auth/history/resident - Lịch sử đăng nhập của Cư dân
router.get('/history/resident', checkAuth, authController.getResidentLoginHistory);

module.exports = router;
