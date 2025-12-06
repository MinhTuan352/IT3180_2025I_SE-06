// File: backend/routes/assetRoutes.js

const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// ==========================================
// MIDDLEWARE BẢO VỆ CHUNG
// ==========================================
// Tất cả các API bên dưới đều yêu cầu phải đăng nhập
router.use(checkAuth);

// ==========================================
// 1. NHÓM API ĐỌC DỮ LIỆU (READ)
// ==========================================
// Cho phép: Ban quản trị (bod) & Kế toán (accountance)
// Cư dân (resident) không cần xem danh sách máy bơm/thang máy chi tiết làm gì.

router.get('/', 
    checkRole(['bod', 'accountance']), 
    assetController.getAllAssets
);

router.get('/:id', 
    checkRole(['bod', 'accountance']), 
    assetController.getAssetDetail
);

// ==========================================
// 2. NHÓM API THAY ĐỔI DỮ LIỆU (WRITE)
// ==========================================
// Chỉ cho phép: Ban quản trị (bod)

// Thêm tài sản mới
router.post('/', 
    checkRole(['bod']), 
    assetController.createAsset
);

// Cập nhật thông tin tài sản
router.put('/:id', 
    checkRole(['bod']), 
    assetController.updateAsset
);

// Xóa tài sản
router.delete('/:id', 
    checkRole(['bod']), 
    assetController.deleteAsset
);

module.exports = router;