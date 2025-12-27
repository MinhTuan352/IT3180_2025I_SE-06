// File: backend/routes/importRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/importController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// Cấu hình Multer để lưu tạm file Excel vào RAM (buffer) -> Xử lý nhanh hơn lưu đĩa
const upload = multer({ storage: multer.memoryStorage() });

router.use(checkAuth);

// Tải file mẫu
router.get('/template', checkRole(['bod', 'cqcn']), importController.downloadTemplate);

// Import dữ liệu (Chỉ Admin/BOD)
router.post('/master-data', 
    checkRole(['bod']), 
    upload.single('file'), // Key form-data là 'file'
    importController.importMasterData
);

module.exports = router;