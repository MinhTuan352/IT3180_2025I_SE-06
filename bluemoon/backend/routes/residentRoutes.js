// File: backend/routes/residentRoutes.js

const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

router.use(checkAuth);

// --- 1. NHÓM CÁ NHÂN (ME) ---
// Cư dân tự xem/sửa thông tin của mình
router.get('/me', residentController.getMyProfile);
router.put('/me', residentController.updateMyProfile);
router.get('/my-apartment', residentController.getMyApartment);

// --- 2. NHÓM TẠM TRÚ / TẠM VẮNG ---
// Đăng ký (Cư dân tự làm hoặc Admin làm hộ)
router.post('/temporary', residentController.registerTemporary);

// Xem danh sách đơn (Chỉ BOD, Công an)
router.get('/temporary',
    checkRole(['bod', 'cqcn']),
    residentController.getTemporaryList
);

// Duyệt đơn (Chỉ BOD)
router.put('/temporary/:id/approve',
    checkRole(['bod']),
    residentController.approveTemporary
);

// --- 3. NHÓM QUẢN LÝ CƯ DÂN (CRUD) ---
// Xem danh sách (BOD, Kế toán, Công an)
router.get('/',
    checkRole(['bod', 'accountance', 'cqcn']),
    residentController.getAllResidents
);

// Xem chi tiết
router.get('/:id',
    checkRole(['bod', 'accountance', 'cqcn']),
    residentController.getResidentDetail
);

// Xem lịch sử thay đổi thông tin (từ audit_logs)
router.get('/:id/change-history',
    checkRole(['bod']),
    residentController.getResidentChangeHistory
);

// Thêm mới (Chỉ BOD)
router.post('/',
    checkRole(['bod']),
    residentController.createResident
);

// Cập nhật thông tin (Chỉ BOD)
router.put('/:id',
    checkRole(['bod']),
    residentController.updateResident
);

// [MỚI] Chức năng Chuyển đi (Thay vì xóa)
router.put('/:id/move-out',
    checkRole(['bod']),
    residentController.moveOutResident
);

// Xóa vĩnh viễn (Chỉ BOD - Dùng khi nhập sai)
router.delete('/:id',
    checkRole(['bod']),
    residentController.deleteResident
);

module.exports = router;