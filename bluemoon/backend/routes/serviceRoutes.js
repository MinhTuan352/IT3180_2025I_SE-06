// File: backend/routes/serviceRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path'); // [MỚI] Import path
const serviceController = require('../controllers/serviceController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// [MỚI] CẤU HÌNH UPLOAD ẢNH
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/services/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Chỉ chấp nhận file ảnh!'));
    }
});

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