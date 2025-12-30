// File: backend/app.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const cronJob = require('./jobs/cronJob');
require('dotenv').config();

// Import Database (chỉ để kiểm tra kết nối lúc khởi động)
require('./config/db');

// Khởi tạo App
const app = express();
const PORT = process.env.PORT || 3000;


// --- [DEBUG START] THÊM ĐOẠN NÀY ĐỂ DEBUG ---
app.use((req, res, next) => {
    console.log(`\n🔥 [INCOMING REQUEST]: ${req.method} ${req.originalUrl}`);
    next();
});
// --- [DEBUG END] ----------------------------

// =======================
// 1. MIDDLEWARE
// =======================

// CORS Configuration - Cho phép Frontend gọi API
const allowedOrigins = [
    'http://localhost:5173',           // Local development
    'http://localhost:3000',           // Backend local
    'https://bluemoon-frontend-3xgx.onrender.com',  // Production frontend
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true  // Cho phép gửi cookies/credentials
}));

// Cho phép đọc dữ liệu JSON từ body request
app.use(express.json({ limit: '50mb' }));

// Cho phép đọc dữ liệu form (x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cấu hình thư mục Static để truy cập file upload (ảnh báo cáo, thông báo)
// Ví dụ: http://localhost:3000/uploads/notifications/abc.jpg
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// =======================
// 2. ROUTES (Định tuyến)
// =======================

app.get('/api', (req, res) => {
    res.json({ success: true, message: 'BlueMoon API Gateway is ready' });
});

app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/residents', require('./routes/residentRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/incidents', require('./routes/incidentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
console.log('--- DBG: Loading Service Routes... ---');
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/apartments', require('./routes/apartmentRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/access', require('./routes/accessRoutes'));
app.use('/api/building', require('./routes/buildingRoutes'));
app.use('/api/sidebar', require('./routes/sidebarRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/temporary-residence', require('./routes/temporaryResidenceRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/visitors', require('./routes/visitorRoutes'));
app.use('/api/import', require('./routes/importRoutes'));
app.use('/api/profile-requests', require('./routes/profileEditRequestRoutes'));
app.use('/api/accounting', require('./routes/accountingRoutes'));

cronJob.start();
// Route kiểm tra server sống hay chết
app.get('/', (req, res) => {
    res.send('🚀 BlueMoon Backend API is running!');
});

// Middleware xử lý lỗi tập trung (Global Error Handler)
// Giúp app không bị crash khi có lỗi bất ngờ
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Đã có lỗi xảy ra ở phía Server!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// =======================
// 3. START SERVER
// =======================

app.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`Server is running on port: ${PORT}`);
    console.log(`Link: http://localhost:${PORT}`);
    console.log(`Public Uploads Path: ${path.join(__dirname, 'public/uploads')}`);
    console.log(`==========================================`);
});