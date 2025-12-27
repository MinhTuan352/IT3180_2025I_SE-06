// File: backend/routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// ==========================================
// CÁC BÁO CÁO QUẢN TRỊ & CƠ QUAN CHỨC NĂNG
// ==========================================

/**
 * [GET] /api/reports/residents
 * Xuất danh sách cư dân (Excel)
 * Ai được xem?
 * - bod: Quản lý chung.
 * - cqcn: Công an kiểm tra nhân khẩu.
 * - accountance: Kế toán (có thể cần để đối chiếu người đóng tiền).
 */
router.get('/residents', 
    checkAuth, 
    checkRole(['bod', 'cqcn', 'accountance']), 
    reportController.exportResidentList
);

/**
 * [GET] /api/reports/assets
 * Xuất danh sách tài sản (Excel)
 * Ai được xem?
 * - bod: Quản lý tài sản.
 * - accountance: Kiểm kê tài sản cố định.
 */
router.get('/assets', 
    checkAuth, 
    checkRole(['bod', 'accountance']), 
    reportController.exportAssetList
);

/**
 * [GET] /api/reports/vehicles
 * Xuất danh sách phương tiện (Excel)
 * Ai được xem?
 * - bod: Quản lý an ninh/bãi xe.
 * - accountance: Tính phí gửi xe.
 * - cqcn: Tra cứu xe vi phạm/an ninh.
 */
router.get('/vehicles', 
    checkAuth, 
    checkRole(['bod', 'accountance', 'cqcn']), 
    reportController.exportVehicleList
);

/**
 * [GET] /api/reports/fees
 * Xuất báo cáo công nợ phí (Excel)
 * Ai được xem?
 * - bod: Quản lý chung.
 * - accountance: Kế toán quản lý phí.
 */
router.get('/fees', 
    checkAuth, 
    checkRole(['bod', 'accountance']), 
    reportController.exportFeeList
);

module.exports = router;