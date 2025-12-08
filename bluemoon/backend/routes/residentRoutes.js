// File: backend/routes/residentRoutes.js

const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// Áp dụng middleware checkAuth cho TẤT CẢ các route bên dưới
// Nghĩa là phải đăng nhập mới sờ vào được API cư dân
router.use(checkAuth);

// ========================================================
// [MỚI] ROUTE CHO CƯ DÂN XEM/CẬP NHẬT PROFILE CỦA CHÍNH MÌNH
// ========================================================
// QUAN TRỌNG: Các route /me PHẢI đặt TRƯỚC /:id để tránh Express hiểu nhầm "me" là ID

// Cư dân xem thông tin cá nhân của chính mình
router.get('/me', residentController.getMyProfile);

// Cư dân cập nhật thông tin cá nhân
router.put('/me', residentController.updateMyProfile);

// [MỚI] Cư dân xem thông tin căn hộ của mình
router.get('/my-apartment', residentController.getMyApartment);

// ========================================================
// ROUTE CHO BOD/ACCOUNTANT QUẢN LÝ CƯ DÂN
// ========================================================

// 1. Xem danh sách (Admin & Kế toán)
router.get('/',
    checkRole(['bod', 'accountance']),
    residentController.getAllResidents
);

// 2. Xem chi tiết (Admin & Kế toán)
// (Mở rộng: Cư dân cũng có thể xem profile của chính mình - logic này sẽ xử lý sau)
router.get('/:id',
    checkRole(['bod', 'accountance']),
    residentController.getResidentDetail
);

// 3. Thêm mới (Chỉ Admin)
router.post('/',
    checkRole(['bod']),
    residentController.createResident
);

// 4. Cập nhật (Chỉ Admin)
router.put('/:id',
    checkRole(['bod']),
    residentController.updateResident
);

// 5. Xóa (Chỉ Admin)
router.delete('/:id',
    checkRole(['bod']),
    residentController.deleteResident
);

module.exports = router;