// File: backend/routes/serviceRoutes.js

const express = require('express');
const router = express.Router();
console.log('--- DBG: serviceRoutes.js Loaded ---');
const serviceController = require('../controllers/serviceController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// --- [DEBUG] ---
router.use((req, res, next) => {
    console.log(`   👉 [SERVICE ROUTER] Đã vào file!`);
    console.log(`   👉 [SERVICE ROUTER] Url con (req.url): "${req.url}"`);
    // Nếu req.url là "/" thì router.get('/') sẽ khớp.
    // Nếu req.url là "/services" thì router.get('/services') mới khớp.
    next();
});
// ----------------

// --- THÊM ĐOẠN DEBUG NÀY ---
console.log('👉 [DEBUG] Đang khởi tạo Route Dịch Vụ');
console.log('👉 [DEBUG] Hàm getAllServices:', serviceController.getAllServices); // Kiểm tra xem hàm này có bị undefined không?
// ---------------------------

// Bảo vệ tất cả routes
router.use(checkAuth);

// 1. READ (Ai cũng xem được danh sách dịch vụ để đặt?) 
// Nhưng đây là trang quản lý của BOD, nên check role BOD/Accountance
router.get('/', checkRole(['bod', 'accountance']), serviceController.getAllServices);

// 2. WRITE (Chỉ BOD quản lý dịch vụ)
router.post('/', checkRole(['bod']), serviceController.createService);
router.put('/:id', checkRole(['bod']), serviceController.updateService);
router.delete('/:id', checkRole(['bod']), serviceController.deleteService);

module.exports = router;
