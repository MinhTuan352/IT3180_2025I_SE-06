// File: backend/routes/serviceRoutes.js

const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');
const upload = require('../middleware/uploadMiddleware');

router.use(checkAuth);

// === PUBLIC (AI CŨNG XEM ĐƯỢC) ===
router.get('/public', serviceController.getActiveServices);
router.get('/detail/:id', serviceController.getServiceById);

// === RESIDENT ===
router.post('/bookings', checkRole(['resident']), serviceController.createBooking);
router.get('/my-bookings', checkRole(['resident']), serviceController.getMyBookings);

// === BOD (ADMIN) ===
router.get('/', checkRole(['bod', 'accountance']), serviceController.getAllServices);

// [CẬP NHẬT] Thêm middleware upload.array('images')
router.post('/', 
    checkRole(['bod']), 
    upload.array('images', 5), 
    serviceController.createService
);

router.put('/:id', checkRole(['bod']), serviceController.updateService);
router.delete('/:id', checkRole(['bod']), serviceController.deleteService);

router.get('/bookings', checkRole(['bod']), serviceController.getAllBookings);
router.put('/bookings/:id/status', checkRole(['bod']), serviceController.updateBookingStatus);

module.exports = router;