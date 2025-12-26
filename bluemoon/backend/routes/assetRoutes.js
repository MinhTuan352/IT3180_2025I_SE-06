// File: backend/routes/assetRoutes.js

const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

router.use(checkAuth);

// --- NHÓM CƯ DÂN (READ ONLY) ---
router.get('/resident', checkRole(['resident']), assetController.getAllAssets);

// --- NHÓM QUẢN TRỊ (BOD/Accountant) ---
router.get('/', checkRole(['bod', 'accountance']), assetController.getAllAssets);
router.get('/:id', checkRole(['bod', 'accountance']), assetController.getAssetDetail);

router.post('/', checkRole(['bod']), assetController.createAsset);
router.put('/:id', checkRole(['bod']), assetController.updateAsset);
router.delete('/:id', checkRole(['bod']), assetController.deleteAsset);

// --- NHÓM BẢO TRÌ (MAINTENANCE) ---
// Thêm lịch bảo trì cho tài sản ID
router.post('/:id/maintenance', 
    checkRole(['bod']), 
    assetController.addMaintenance
);

// Hoàn thành bảo trì (Theo Schedule ID)
// Lưu ý: Route này dùng ID của Schedule, không phải ID Asset
router.put('/maintenance/:scheduleId/complete', 
    checkRole(['bod']), 
    assetController.completeMaintenance
);

module.exports = router;