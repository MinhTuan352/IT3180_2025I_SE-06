// File: backend/routes/accessRoutes.js

const express = require('express');
const router = express.Router();
const accessController = require('../controllers/accessController');

// Lấy danh sách lịch sử ra vào
router.get('/logs', accessController.getAccessLogs);

// Lấy bản ghi mới nhất (cho polling)
router.get('/latest', accessController.getLatestAccess);

// Thống kê ra vào hôm nay
router.get('/stats', accessController.getAccessStats);

// Mô phỏng xe ra vào (từ barrier simulator)
router.post('/simulate', accessController.simulateAccess);

// Lấy danh sách xe cho simulator
router.get('/simulator-vehicles', accessController.getSimulatorVehicles);

// Lấy dữ liệu báo cáo phân tích
router.get('/report', accessController.getReportData);

// Xuất báo cáo PDF
router.get('/export-pdf', accessController.exportReportPDF);

module.exports = router;
