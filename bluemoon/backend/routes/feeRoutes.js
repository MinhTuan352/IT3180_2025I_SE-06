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

// === CÁC ROUTE CỐ ĐỊNH PHẢI ĐẶT TRƯỚC /:id ===

// [MỚI] Batch preview - Xem trước danh sách hóa đơn sẽ tạo
router.get('/batch-preview',
    checkRole(['accountance', 'bod']),
    feeController.batchPreview
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

// [MỚI] Tự động sinh phí gửi xe từ danh sách xe (Chỉ Kế toán & BOD)
router.post('/generate/vehicles', 
    checkRole(['accountance', 'bod']), 
    feeController.generateVehicleFees
);

// [MỚI] Batch create - Tạo hóa đơn hàng loạt
router.post('/batch-create',
    checkRole(['accountance', 'bod']),
    feeController.batchCreate
);

// [MỚI] Gửi nhắc nợ hàng loạt
router.post('/batch-remind',
    checkRole(['accountance', 'bod']),
    feeController.sendBatchReminder
);

// === ROUTE ĐỘNG ĐẶT SAU CÙNG ===

// [GET] /api/fees/:id - Xem chi tiết hóa đơn
router.get('/:id', feeController.getFeeDetail);

// [POST] /api/fees - Tạo hóa đơn mới (Chỉ Kế toán & Admin)
router.post('/',
    checkRole(['bod', 'accountance']),
    feeController.createInvoice
);

// [POST] /api/fees/:id/pay - Xác nhận thanh toán (Chỉ Kế toán)
router.post('/:id/pay',
    checkRole(['accountance']),
    feeController.payInvoice
);

// [MỚI] Gửi nhắc nợ cho 1 hóa đơn
router.post('/:id/remind',
    checkRole(['accountance', 'bod']),
    feeController.sendReminder
);

module.exports = router;