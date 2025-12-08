// File: backend/routes/serviceRoutes.js

const express = require('express');
const router = express.Router();
console.log('--- DBG: serviceRoutes.js Loaded ---');
const serviceController = require('../controllers/serviceController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// Bảo vệ tất cả routes
router.use(checkAuth);

// === ROUTES CHO TẤT CẢ USER ĐÃ ĐĂNG NHẬP ===
// Lấy danh sách dịch vụ đang hoạt động (cho Resident xem)
router.get('/public', serviceController.getActiveServices);

// Lấy chi tiết dịch vụ theo ID
router.get('/detail/:id', serviceController.getServiceById);

// === ROUTES CHO RESIDENT ===
// Cư dân đặt dịch vụ
router.post('/bookings', checkRole(['resident']), serviceController.createBooking);

// Cư dân xem lịch sử booking của mình
router.get('/my-bookings', checkRole(['resident']), serviceController.getMyBookings);

// === ROUTES CHO BOD/ACCOUNTANT ===
// Lấy tất cả dịch vụ (bao gồm inactive)
router.get('/', checkRole(['bod', 'accountance']), serviceController.getAllServices);

// BOD quản lý dịch vụ
router.post('/', checkRole(['bod']), serviceController.createService);
router.put('/:id', checkRole(['bod']), serviceController.updateService);
router.delete('/:id', checkRole(['bod']), serviceController.deleteService);

// BOD xem và quản lý tất cả bookings
router.get('/bookings', checkRole(['bod']), serviceController.getAllBookings);
router.put('/bookings/:id/status', checkRole(['bod']), serviceController.updateBookingStatus);

module.exports = router;

