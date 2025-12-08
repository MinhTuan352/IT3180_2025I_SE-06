// File: backend/routes/feeRoutes.js

const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// 1. Kích hoạt Middleware xác thực cho toàn bộ các route bên dưới
// Bắt buộc phải đăng nhập mới được gọi API phí
router.use(checkAuth);

// ==============================
// NHÓM 1: QUẢN LÝ LOẠI PHÍ
// ==============================

// [GET] /api/fees/types - Xem danh sách loại phí (Ai cũng xem được)
router.get('/types', feeController.getFeeTypes);

// [POST] /api/fees/types - Tạo loại phí mới (Chỉ Admin & Kế toán)
router.post('/types',
    checkRole(['bod', 'accountance']),
    feeController.createFeeType
);

// [MỚI] Sửa loại phí (VD: Tăng giá phí quản lý)
router.put('/types/:id',
    checkRole(['bod', 'accountance']),
    feeController.updateFeeType
);

// [MỚI] Xóa loại phí (VD: Xóa phí cũ không dùng nữa)
router.delete('/types/:id',
    checkRole(['bod', 'accountance']),
    feeController.deleteFeeType
);

// ==============================
// NHÓM 2: QUẢN LÝ HÓA ĐƠN
// ==============================

// [GET] /api/fees - Xem danh sách hóa đơn
// (Controller tự động lọc: Kế toán thấy hết, Cư dân thấy của mình)
router.get('/', feeController.getFees);

// [GET] /api/fees/:id - Xem chi tiết hóa đơn
router.get('/:id', feeController.getFeeDetail);

// [POST] /api/fees - Tạo hóa đơn mới (Chỉ Kế toán & Admin)
router.post('/',
    checkRole(['bod', 'accountance']),
    feeController.createInvoice
);

// [POST] /api/fees/:id/pay - Xác nhận thanh toán (Chỉ Kế toán)
// Cư dân không tự gọi API này được, họ phải chuyển khoản -> Kế toán check -> Kế toán gọi API này
router.post('/:id/pay',
    checkRole(['accountance']),
    feeController.payInvoice
);

// [MỚI] Trigger quét nợ thủ công (Chỉ Admin)
router.post('/trigger-scan',
    checkRole(['bod', 'accountance']),
    feeController.triggerLateFeeScan
);

// [MỚI] Import chỉ số nước hàng loạt và tạo hóa đơn (Chỉ Kế toán)
router.post('/import-water',
    checkRole(['accountance', 'bod']),
    feeController.importWaterMeter
);

module.exports = router;