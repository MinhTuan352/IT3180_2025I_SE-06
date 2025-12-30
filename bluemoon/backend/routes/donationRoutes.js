// File: backend/routes/donationRoutes.js

const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');
const upload = require('../middleware/uploadMiddleware');

// ==========================================
// 1. NHÓM QUẢN LÝ (KẾ TOÁN / BQT)
// ==========================================

/**
 * Tạo đợt quyên góp mới (có thể upload ảnh)
 * Chỉ Kế toán hoặc BQT được phép
 */
router.post('/campaigns',
    checkAuth,
    checkRole(['accountance', 'bod']),
    upload.single('image'),
    donationController.createCampaign
);

/**
 * Đóng quỹ thủ công
 * Chỉ Kế toán hoặc BQT được phép
 */
router.put('/campaigns/:id/close',
    checkAuth,
    checkRole(['accountance', 'bod']),
    donationController.closeCampaign
);

/**
 * Nhập liệu hộ cư dân (Thu tiền mặt)
 * Chỉ Kế toán được phép (vì liên quan đến cầm tiền mặt)
 */
router.post('/record-offline',
    checkAuth,
    checkRole(['accountance', 'bod']),
    donationController.recordOffline
);

// ==========================================
// 2. NHÓM CƯ DÂN (TƯƠNG TÁC)
// ==========================================

/**
 * Cư dân tự quyên góp qua App
 */
router.post('/donate',
    checkAuth,
    checkRole(['resident']),
    donationController.donate
);

/**
 * Xem lịch sử đóng góp của bản thân
 */
router.get('/me/history',
    checkAuth,
    checkRole(['resident']),
    donationController.getMyHistory
);

/**
 * [NEW] Bắt đầu quyên góp (Lấy QR)
 */
router.post('/initiate',
    checkAuth,
    checkRole(['resident']),
    donationController.initiateDonation
);

/**
 * [NEW] Kiểm tra trạng thái đóng góp
 */
router.get('/status/:tempId',
    donationController.checkDonationStatus
);

/**
 * [NEW] Giả lập thanh toán (DEV)
 */
router.post('/simulate/:tempId',
    donationController.simulateDonation
);

/**
 * Xem danh sách các đợt quyên góp
 * (Để hiển thị ra trang chủ App)
 */
router.get('/campaigns',
    checkAuth,
    donationController.getCampaigns
);

/**
 * Thống kê tổng hợp
 * Chỉ BOD/Kế toán xem được
 */
router.get('/statistics',
    checkAuth,
    checkRole(['bod', 'accountance']),
    donationController.getStatistics
);

/**
 * Lấy chi tiết một quỹ
 */
router.get('/campaigns/:id',
    checkAuth,
    donationController.getCampaignDetail
);

/**
 * Cập nhật thông tin quỹ (có thể upload ảnh)
 * Chỉ BOD/Kế toán được phép
 */
router.put('/campaigns/:id',
    checkAuth,
    checkRole(['bod', 'accountance']),
    upload.single('image'),
    donationController.updateCampaign
);

/**
 * Xem sao kê chi tiết (Statement)
 * Controller đã tự xử lý logic ẩn tên nếu là user thường
 */
router.get('/campaigns/:id/statement',
    checkAuth,
    donationController.getCampaignStatement
);

module.exports = router;