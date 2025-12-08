// File: backend/routes/paymentRoutes.js
// Routes cho hệ thống thanh toán tự động

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const checkAuth = require('../middleware/checkAuth');

// Tạo QR code thanh toán (cần đăng nhập)
router.get('/generate-qr/:invoiceId', checkAuth, paymentController.generateQR);

// Kiểm tra trạng thái thanh toán (frontend polling)
router.get('/status/:invoiceId', checkAuth, paymentController.checkStatus);

// Webhook nhận callback từ ngân hàng (KHÔNG cần auth vì gọi từ bên ngoài)
router.post('/webhook', paymentController.webhook);

// API giả lập thanh toán để test (KHÔNG cần auth - CHỈ DÙNG CHO DEV/TEST)
router.post('/simulate/:invoiceId', paymentController.simulatePayment);

module.exports = router;
